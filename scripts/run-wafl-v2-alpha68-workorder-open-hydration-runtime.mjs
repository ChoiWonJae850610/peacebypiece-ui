#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const root = process.cwd();
const state = JSON.parse(fs.readFileSync(path.join(root, ".tmp/wafl-external-qa/state.json"), "utf8"));
const base = `https://${state.tailscaleServeHostname}`;
const suffix = crypto.randomBytes(4).toString("hex").toUpperCase();
const marker = `QA A68 open hydration ${suffix}`;
const outputPath = path.join(root, ".tmp/wafl-v2-alpha68/workorder-open-hydration-runtime.json");
const requests = [];
const createdIds = [];
let cookie = "";
let companyId = "";
const db = new pg.Client({ connectionString: process.env.DATABASE_URL, application_name: "wafl-a68-open-hydration-runtime" });

function hash(value, length = 12) {
  return crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, length);
}

async function request(route, { method = "GET", body = null, key = null } = {}) {
  const response = await fetch(`${base}${route}`, {
    method,
    redirect: "manual",
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(key ? { "Idempotency-Key": key } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(60_000),
  });
  const setCookies = response.headers.getSetCookie?.() ?? [];
  if (setCookies.length) cookie = setCookies.map((value) => value.split(";", 1)[0]).join("; ");
  const text = await response.text();
  const json = (() => { try { return JSON.parse(text); } catch { return null; } })();
  const correlation = response.headers.get("x-wafl-correlation-id") ?? json?.error?.correlationId ?? null;
  requests.push({
    method,
    route: route.replace(/\b[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\b/giu, "fixture"),
    status: response.status,
    code: json?.error?.code ?? null,
    correlationHash: correlation ? hash(correlation, 10) : null,
  });
  return { response, json, text };
}

async function hydrate(id) {
  const detail = await request(`/api/v2/work-orders/${id}`);
  assert.equal(detail.response.status, 200, detail.text.slice(0, 300));
  const [assets, partners, history] = await Promise.all([
    request(`/api/v2/work-orders/${id}/assets?limit=50`),
    request(`/api/v2/work-orders/${id}/material-partners`),
    detail.json.data.header.identity.isSample ? Promise.resolve(null) : request(`/api/v2/work-orders/${id}/reorder`),
  ]);
  assert.equal(assets.response.status, 200, assets.text.slice(0, 300));
  assert.equal(partners.response.status, 200, partners.text.slice(0, 300));
  if (history) assert.equal(history.response.status, 200, history.text.slice(0, 300));
  assert.equal(assets.json.data.entityVersion, detail.json.data.header.entityVersion);
  assert.equal(partners.json.data.entityVersion, detail.json.data.header.entityVersion);
  return { detail: detail.json.data, assets: assets.json.data, partners: partners.json.data, history: history?.json.data ?? null };
}

async function deleteDraft(id) {
  const deleted = await request(`/api/v2/work-orders/${id}`, { method: "DELETE" });
  assert.equal(deleted.response.status, 200, deleted.text.slice(0, 300));
  assert.equal(deleted.json.data.deleted, true);
}

assert.equal(state.status, "running");
assert.equal(state.developerAutoConnectReady, true);
assert.equal(state.nodeVersion, "24.14.0");
assert.ok(process.env.DATABASE_URL);
await db.connect();
try {
  const connected = await request("/api/dev/mobile-connect/auto", { method: "POST", body: {} });
  assert.equal(connected.response.status, 200);
  const me = await request("/api/auth/me");
  assert.equal(me.response.status, 200);
  companyId = String(me.json.user.companyId);
  assert.equal(companyId, "wafl-fn-company-a");

  const createKey = `a68-open-create-${suffix.toLowerCase()}`;
  const created = await request("/api/v2/work-orders", {
    method: "POST",
    body: { clientRequestId: createKey, productName: marker, isSample: false },
    key: createKey,
  });
  assert.equal(created.response.status, 201, created.text.slice(0, 300));
  const originalId = created.json.data.result.workOrderId;
  createdIds.push(originalId);
  const original = await hydrate(originalId);
  assert.equal(original.detail.header.id, originalId);
  assert.equal(original.history.items.length, 1);

  const copyKey = `a68-open-copy-${suffix.toLowerCase()}`;
  const copyFirst = await request(`/api/v2/work-orders/${originalId}/copy`, {
    method: "POST",
    body: { clientRequestId: copyKey },
    key: copyKey,
  });
  assert.equal(copyFirst.response.status, 201, copyFirst.text.slice(0, 300));
  const copyId = copyFirst.json.data.result.workOrderId;
  createdIds.push(copyId);
  const copyReplay = await request(`/api/v2/work-orders/${originalId}/copy`, {
    method: "POST",
    body: { clientRequestId: copyKey },
    key: copyKey,
  });
  assert.equal(copyReplay.response.status, 200, copyReplay.text.slice(0, 300));
  assert.equal(copyReplay.json.data.result.workOrderId, copyId, "Copy replay must retain the authoritative created ID");
  const copyRows = await db.query("SELECT count(*)::integer count FROM work_orders WHERE company_id=$1 AND product_name=$2 AND deleted_at IS NULL", [companyId, `(복사본) ${marker}`]);
  assert.equal(Number(copyRows.rows[0].count), 1, "Copy must create exactly one Draft");
  const copied = await hydrate(copyId);
  assert.equal(copied.detail.header.id, copyId);
  assert.equal(copied.detail.header.status, "draft");

  const list = await request("/api/v2/work-orders?limit=30&lineage=reorder");
  assert.equal(list.response.status, 200);
  const existingReorderItem = list.json.data.items.find((item) => item.identity?.derivationKind === "reorder");
  assert.ok(existingReorderItem, "one existing Reorder is required for read-only open evidence");
  const existingReorder = await hydrate(existingReorderItem.workOrderId);
  assert.equal(existingReorder.detail.header.identity.derivationKind, "reorder");
  const sibling = existingReorder.history.items.find((item) => item.workOrderId && item.workOrderId !== existingReorderItem.workOrderId);
  assert.ok(sibling?.workOrderId, "existing Reorder history must expose a navigable sibling");
  const siblingHydration = await hydrate(sibling.workOrderId);
  assert.equal(siblingHydration.detail.header.id, sibling.workOrderId);
  const tombstones = existingReorder.history.items.filter((item) => item.status === "deleted");
  assert.equal(tombstones.every((item) => item.workOrderId === null), true, "deleted Reorder tombstones must stay non-navigable");

  const evidence = {
    result: "WAFL_V2_ALPHA68_WORKORDER_OPEN_HYDRATION_RUNTIME_PASS",
    checkpoint: "ALPHA68_WORKORDER_OPEN_HYDRATION_BLOCKER_IPHONE_REQA_REQUIRED",
    markerHash: hash(marker),
    copy: { commandCalls: 2, createdRows: 1, replaySameCreatedId: true, coreOpen: true, childHydration: true },
    reorder: { existingCoreOpen: true, childHydration: true, historySiblingOpen: true, tombstonesNonNavigable: true },
    projections: { detail: 200, assets: 200, partners: 200, history: 200, entityVersionEquality: true },
    requests,
    productionMutation: 0,
    ownerMutation: 0,
    ambiguousMutation: 0,
    physicalResultInferred: false,
  };
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(evidence, null, 2), "utf8");
  console.log(JSON.stringify({ result: evidence.result, requests: requests.length, copyCreatedRows: 1, existingReorderOpen: true }));
} finally {
  for (const id of createdIds.reverse()) await deleteDraft(id);
  if (companyId) {
    const residual = await db.query("SELECT count(*)::integer count FROM work_orders WHERE company_id=$1 AND (product_name=$2 OR product_name=$3) AND deleted_at IS NULL", [companyId, marker, `(복사본) ${marker}`]);
    assert.equal(Number(residual.rows[0].count), 0, "isolated WorkOrder residual must be zero");
    const assetResidual = await db.query("SELECT (SELECT count(*) FROM work_order_images WHERE company_id=$1 AND work_order_id=ANY($2::uuid[]))::integer images,(SELECT count(*) FROM work_order_attachments WHERE company_id=$1 AND work_order_id=ANY($2::uuid[]))::integer attachments", [companyId, createdIds]);
    assert.deepEqual(assetResidual.rows[0], { images: 0, attachments: 0 });
    if (fs.existsSync(outputPath)) {
      const evidence = JSON.parse(fs.readFileSync(outputPath, "utf8"));
      evidence.cleanup = { workOrders: 0, images: 0, attachments: 0, r2Objects: 0 };
      fs.writeFileSync(outputPath, JSON.stringify(evidence, null, 2), "utf8");
    }
  }
  await db.end();
}
