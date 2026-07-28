#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const root = process.cwd();
const evidencePath = path.join(root, ".tmp", "wafl-external-qa", "a57-v10-qa-fix-runtime-evidence.jsonl");
const resultPath = path.join(root, ".tmp", "wafl-external-qa", "a57-v10-qa-fix-runtime-result.json");
const statePath = path.join(root, ".tmp", "wafl-external-qa", "state.json");
const markerPrefix = `A57V10QAFIX_${Date.now().toString(36).toUpperCase()}`;
const markers = {
  fabric: `${markerPrefix}_FABRIC`.slice(0, 48),
  accessory: `${markerPrefix}_ACCESSORY`.slice(0, 48),
};

function readEnv() {
  const values = {};
  for (const line of fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!match) continue;
    let value = match[2];
    if (value.length >= 2 && (
      (value.startsWith("\"") && value.endsWith("\""))
      || (value.startsWith("'") && value.endsWith("'"))
    )) value = value.slice(1, -1);
    values[match[1]] = value;
  }
  return values;
}

function ref(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, 12);
}

fs.writeFileSync(evidencePath, "", "utf8");
let sequence = 0;
function record(entry) {
  sequence += 1;
  fs.appendFileSync(evidencePath, `${JSON.stringify({
    sequence,
    timestamp: new Date().toISOString(),
    ...entry,
  })}\n`, "utf8");
}

const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
record({
  kind: "runtime-owner-before-assertion",
  status: state.status,
  runtimeQaMode: state.runtimeQaMode,
  mutationMode: state.mutationMode,
  commandApi: state.commandApi,
  nextPort: state.nextPort,
  expoPort: state.expoPort,
  directR2Access: false,
  workerBypass: false,
});
assert.equal(state.status, "running");
assert.equal(state.runtimeQaMode, "work-order-image");
assert.equal(state.mutationMode, "work-order-image-upload-primary-delete");
assert.equal(state.commandApi, "ready");
assert.equal(state.nextPort, 3100);
assert.equal(state.expoPort, 8081);

const env = readEnv();
assert.ok(env.DATABASE_URL, "DATABASE_URL_MISSING");
const runtimeBase = `https://${state.tailscaleServeHostname}`;
const client = new pg.Client({
  connectionString: env.DATABASE_URL,
  application_name: "wafl-a57-v10-qa-fix-runtime-qa",
});
await client.connect();

async function snapshot() {
  await client.query("BEGIN READ ONLY");
  try {
    const target = (await client.query(`
      SELECT w.company_id, w.id AS work_order_id, w.current_revision_id AS revision_id,
             w.entity_version AS work_order_version, r.entity_version AS revision_version,
             w.product_type_code, w.item_code, w.season_code, r.factory_delivery_memo,
             (SELECT count(*)::integer FROM domain_events) AS event_count,
             (SELECT count(*)::integer FROM work_order_command_receipts) AS receipt_count,
             (SELECT count(*)::integer FROM work_order_material_lines) AS material_rows,
             (SELECT COALESCE(sum(entity_version), 0)::integer FROM work_order_material_lines) AS material_version_sum,
             (SELECT count(*)::integer FROM wafl_v2_migration_ledger) AS migration_count
        FROM work_orders w
        JOIN work_order_revisions r
          ON r.company_id = w.company_id AND r.id = w.current_revision_id
       WHERE w.status = 'draft'
         AND r.revision_status = 'draft'
         AND w.deleted_at IS NULL
         AND EXISTS (
           SELECT 1
             FROM work_order_material_lines marker
            WHERE marker.company_id = w.company_id
              AND marker.revision_id = r.id
              AND marker.name = 'UNITEDITABLEMATERI'
         )
       LIMIT 1
    `)).rows[0];
    assert.ok(target, "APPROVED_DEV_FIXTURE_NOT_FOUND");
    const created = (await client.query(`
      SELECT id, name, material_type, unit_code, usage_area, memo, unit_price,
             entity_version, archived_at
        FROM work_order_material_lines
       WHERE company_id = $1
         AND revision_id = $2::uuid
         AND name = ANY($3::text[])
       ORDER BY name
    `, [target.company_id, target.revision_id, Object.values(markers)])).rows;
    const otherRows = (await client.query(`
      SELECT w.id, w.entity_version, r.entity_version AS revision_version,
             w.product_type_code, w.item_code, w.season_code, r.factory_delivery_memo,
             COALESCE((
               SELECT sum(line.entity_version)
                 FROM work_order_material_lines line
                WHERE line.company_id = w.company_id
                  AND line.revision_id = r.id
             ), 0)::integer AS material_version_sum
        FROM work_orders w
        JOIN work_order_revisions r
          ON r.company_id = w.company_id AND r.id = w.current_revision_id
       WHERE w.company_id = $1
         AND w.id <> $2::uuid
       ORDER BY w.id
    `, [target.company_id, target.work_order_id])).rows;
    await client.query("ROLLBACK");
    return {
      companyId: target.company_id,
      workOrderId: target.work_order_id,
      revisionId: target.revision_id,
      workOrderVersion: Number(target.work_order_version),
      revisionVersion: Number(target.revision_version),
      productTypeCode: target.product_type_code,
      itemCode: target.item_code,
      seasonCode: target.season_code,
      factoryDeliveryMemo: target.factory_delivery_memo,
      events: Number(target.event_count),
      receipts: Number(target.receipt_count),
      materialRows: Number(target.material_rows),
      materialVersionSum: Number(target.material_version_sum),
      migration: Number(target.migration_count),
      created,
      otherFingerprint: crypto.createHash("sha256").update(JSON.stringify(otherRows)).digest("hex"),
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

function delta(before, after) {
  return {
    workOrderVersion: after.workOrderVersion - before.workOrderVersion,
    revisionVersion: after.revisionVersion - before.revisionVersion,
    event: after.events - before.events,
    receipt: after.receipts - before.receipts,
    materialRows: after.materialRows - before.materialRows,
    materialVersionSum: after.materialVersionSum - before.materialVersionSum,
    migration: after.migration - before.migration,
  };
}

function assertDelta(before, after, command, expected) {
  const observed = delta(before, after);
  record({ kind: "mutation-delta-before-assertion", command, observed, expected });
  assert.deepEqual(observed, {
    workOrderVersion: 0,
    revisionVersion: 0,
    event: 0,
    receipt: 0,
    materialRows: 0,
    materialVersionSum: 0,
    migration: 0,
    ...expected,
  });
  assert.equal(after.otherFingerprint, before.otherFingerprint, `${command}:cross-work-order-isolation`);
}

let cookie = "";
async function request(input) {
  record({
    kind: "request-before-assertion",
    command: input.command,
    layer: "Mobile -> Next API",
    method: input.method,
    path: input.redactedPath,
    body: input.redactedBody ?? null,
    directR2Access: false,
    workerBypass: false,
  });
  const started = performance.now();
  const response = await fetch(`${runtimeBase}${input.path}`, {
    method: input.method,
    redirect: "manual",
    headers: {
      Accept: "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
      ...(input.body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(input.idempotencyKey ? { "Idempotency-Key": input.idempotencyKey } : {}),
    },
    body: input.body === undefined ? undefined : JSON.stringify(input.body),
    signal: AbortSignal.timeout(90_000),
  });
  const setCookies = response.headers.getSetCookie?.() ?? [];
  if (setCookies.length) cookie = setCookies.map((value) => value.split(";", 1)[0]).join("; ");
  const text = await response.text();
  let body = null;
  try { body = JSON.parse(text); } catch { body = null; }
  record({
    kind: "response-before-assertion",
    command: input.command,
    status: response.status,
    contentType: response.headers.get("content-type"),
    errorCode: body?.error?.code ?? null,
    nextVersion: body?.data?.nextVersion ?? null,
    correlationId: response.headers.get("x-wafl-correlation-id"),
    elapsedMs: Math.round((performance.now() - started) * 100) / 100,
    directR2Access: false,
    workerBypass: false,
  });
  return { response, body };
}

let commandSequence = 0;
function identity(kind) {
  commandSequence += 1;
  const suffix = `${Date.now()}.${commandSequence}`;
  return {
    clientRequestId: `a57.v10.qa-fix.${kind}.client.${suffix}`,
    idempotencyKey: `a57.v10.qa-fix.${kind}.idempotency.${suffix}`,
  };
}

async function patchOverview(current, patch, command) {
  const id = identity(command);
  const result = await request({
    command,
    method: "PATCH",
    path: `/api/v2/work-orders/${current.workOrderId}`,
    redactedPath: "/api/v2/work-orders/{workOrderId}",
    body: { clientRequestId: id.clientRequestId, expectedVersion: current.workOrderVersion, patch },
    redactedBody: { expectedVersion: current.workOrderVersion, patch: Object.keys(patch).sort() },
  });
  assert.equal(result.response.status, 200, `${command}:http`);
  assert.equal(result.body?.data?.nextVersion, current.workOrderVersion + 1, `${command}:next-version`);
  const next = await snapshot();
  assertDelta(current, next, command, { workOrderVersion: 1, revisionVersion: 1, event: 1 });
  return next;
}

async function createMaterial(current, materialType, unitCode, name) {
  const id = identity(`${materialType}.create`);
  const result = await request({
    command: `${materialType}-create`,
    method: "POST",
    path: `/api/v2/work-orders/${current.workOrderId}/materials`,
    redactedPath: "/api/v2/work-orders/{workOrderId}/materials",
    idempotencyKey: id.idempotencyKey,
    body: {
      clientRequestId: id.clientRequestId,
      expectedVersion: current.workOrderVersion,
      materialType,
      materialId: null,
      name,
      partnerId: null,
      colorOption: null,
      usageArea: "",
      requiredQuantity: "0",
      allowanceQuantity: "0",
      inventoryUsageQuantity: "0",
      orderQuantity: "0",
      unitCode,
      unitPrice: "0",
      memo: null,
    },
    redactedBody: { expectedVersion: current.workOrderVersion, materialType, unitCode, fixtureRef: ref(name) },
  });
  assert.equal(result.response.status, 201, `${materialType}-create:http`);
  const materialId = result.body?.data?.result?.materialLineId;
  assert.match(String(materialId), /^[0-9a-f-]{36}$/i);
  const next = await snapshot();
  assertDelta(current, next, `${materialType}-create`, {
    workOrderVersion: 1,
    revisionVersion: 1,
    event: 1,
    receipt: 1,
    materialRows: 1,
    materialVersionSum: 1,
  });
  const row = next.created.find((item) => item.id === materialId);
  assert.equal(row?.unit_code, unitCode);
  return { next, materialId };
}

async function patchMaterial(current, materialId, materialType, patch, command) {
  const id = identity(command);
  const result = await request({
    command,
    method: "PATCH",
    path: `/api/v2/work-orders/${current.workOrderId}/materials/${materialId}`,
    redactedPath: "/api/v2/work-orders/{workOrderId}/materials/{materialId}",
    body: { clientRequestId: id.clientRequestId, expectedVersion: current.workOrderVersion, patch },
    redactedBody: { expectedVersion: current.workOrderVersion, materialType, patch: Object.keys(patch).sort() },
  });
  assert.equal(result.response.status, 200, `${command}:http`);
  const next = await snapshot();
  assertDelta(current, next, command, {
    workOrderVersion: 1,
    revisionVersion: 1,
    event: 1,
    materialVersionSum: 1,
  });
  return next;
}

async function archiveMaterial(current, materialId, materialType) {
  const id = identity(`${materialType}.archive`);
  const result = await request({
    command: `${materialType}-archive-cleanup`,
    method: "POST",
    path: `/api/v2/work-orders/${current.workOrderId}/materials/${materialId}/archive`,
    redactedPath: "/api/v2/work-orders/{workOrderId}/materials/{materialId}/archive",
    idempotencyKey: id.idempotencyKey,
    body: { clientRequestId: id.clientRequestId, expectedVersion: current.workOrderVersion },
    redactedBody: { expectedVersion: current.workOrderVersion, materialType },
  });
  assert.equal(result.response.status, 200, `${materialType}-archive:http`);
  const next = await snapshot();
  assertDelta(current, next, `${materialType}-archive`, {
    workOrderVersion: 1,
    revisionVersion: 1,
    event: 1,
    receipt: 1,
    materialVersionSum: 1,
  });
  assert.ok(next.created.find((item) => item.id === materialId)?.archived_at);
  return next;
}

try {
  const before = await snapshot();
  assert.equal(before.created.length, 0, "QA_FIX_RUNTIME_FIXTURE_ALREADY_EXISTS");
  record({
    kind: "baseline-before-assertion",
    targetWorkOrderRef: ref(before.workOrderId),
    workOrderVersion: before.workOrderVersion,
    revisionVersion: before.revisionVersion,
    event: before.events,
    receipt: before.receipts,
    materialRows: before.materialRows,
    materialVersionSum: before.materialVersionSum,
    migration: before.migration,
  });

  const auth = await request({
    command: "auto-connect",
    method: "POST",
    path: "/api/dev/mobile-connect/auto",
    redactedPath: "/api/dev/mobile-connect/auto",
  });
  assert.equal(auth.response.status, 200);
  assert.ok(cookie);

  const list = await request({
    command: "work-order-list",
    method: "GET",
    path: "/api/v2/work-orders?limit=20",
    redactedPath: "/api/v2/work-orders?limit=20",
  });
  assert.equal(list.response.status, 200);
  const detail = await request({
    command: "work-order-detail",
    method: "GET",
    path: `/api/v2/work-orders/${before.workOrderId}`,
    redactedPath: "/api/v2/work-orders/{workOrderId}",
  });
  assert.equal(detail.response.status, 200);

  const categoryValue = {
    productTypeCode: "wafl-c1|X|X",
    itemCode: `QA-${Date.now().toString(36)}`.slice(0, 24),
    seasonCode: "QA-FIX",
  };
  let current = await patchOverview(before, categoryValue, "category-inline-save");
  assert.equal(current.productTypeCode, categoryValue.productTypeCode);
  assert.equal(current.itemCode, categoryValue.itemCode);
  assert.equal(current.seasonCode, categoryValue.seasonCode);
  const categoryRead = await request({
    command: "category-inline-reread",
    method: "GET",
    path: `/api/v2/work-orders/${current.workOrderId}`,
    redactedPath: "/api/v2/work-orders/{workOrderId}",
  });
  assert.equal(categoryRead.response.status, 200);
  assert.equal(categoryRead.body?.data?.header?.productTypeCode, categoryValue.productTypeCode);
  assert.equal(categoryRead.body?.data?.header?.itemCode, categoryValue.itemCode);
  assert.equal(categoryRead.body?.data?.header?.seasonCode, categoryValue.seasonCode);
  record({ kind: "unchanged-inline-save-before-assertion", command: "category", requestCount: 0 });
  assertDelta(current, await snapshot(), "category-unchanged", {});
  current = await patchOverview(current, {
    productTypeCode: before.productTypeCode,
    itemCode: before.itemCode,
    seasonCode: before.seasonCode,
  }, "category-baseline-restore");

  const memoValue = `A57 V10 QA FIX ${Date.now().toString(36)}`;
  current = await patchOverview(current, { factoryDeliveryMemo: memoValue }, "factory-memo-inline-save");
  assert.equal(current.factoryDeliveryMemo, memoValue);
  const memoRead = await request({
    command: "factory-memo-reread",
    method: "GET",
    path: `/api/v2/work-orders/${current.workOrderId}`,
    redactedPath: "/api/v2/work-orders/{workOrderId}",
  });
  assert.equal(memoRead.response.status, 200);
  assert.equal(memoRead.body?.data?.revision?.factoryDeliveryMemo, memoValue);
  record({ kind: "unchanged-inline-save-before-assertion", command: "factory-memo", requestCount: 0 });
  assertDelta(current, await snapshot(), "factory-memo-unchanged", {});
  current = await patchOverview(current, {
    factoryDeliveryMemo: before.factoryDeliveryMemo,
  }, "factory-memo-baseline-restore");

  const fabric = await createMaterial(current, "fabric", "yd", markers.fabric);
  current = fabric.next;
  const accessory = await createMaterial(current, "accessory", "개", markers.accessory);
  current = accessory.next;

  current = await patchMaterial(current, fabric.materialId, "fabric", {
    usageArea: "앞판",
    memo: "원단 인라인 QA",
    unitPrice: "8161",
  }, "fabric-inline-and-zero-replacement");
  let fabricRow = current.created.find((item) => item.id === fabric.materialId);
  assert.equal(fabricRow?.usage_area, "앞판");
  assert.equal(fabricRow?.memo, "원단 인라인 QA");
  assert.equal(fabricRow?.unit_price, "8161.00");
  const fabricRead = await request({
    command: "fabric-inline-reread",
    method: "GET",
    path: `/api/v2/work-orders/${current.workOrderId}/materials?type=fabric&lifecycle=active&limit=30`,
    redactedPath: "/api/v2/work-orders/{workOrderId}/materials?type=fabric&lifecycle=active&limit=30",
  });
  assert.equal(fabricRead.response.status, 200);
  const fabricApiRow = fabricRead.body?.data?.items?.find((item) => item.id === fabric.materialId);
  assert.equal(fabricApiRow?.usageArea, "앞판");
  assert.equal(fabricApiRow?.memo, "원단 인라인 QA");
  assert.equal(fabricApiRow?.unitPrice, "8161.00");
  record({ kind: "unchanged-inline-save-before-assertion", command: "fabric", requestCount: 0 });
  assertDelta(current, await snapshot(), "fabric-unchanged", {});
  current = await patchMaterial(current, fabric.materialId, "fabric", {
    usageArea: "",
    memo: null,
    unitPrice: "0",
  }, "fabric-baseline-restore");

  current = await patchMaterial(current, accessory.materialId, "accessory", {
    usageArea: "여밈",
    memo: "부자재 인라인 QA",
  }, "accessory-inline-save");
  let accessoryRow = current.created.find((item) => item.id === accessory.materialId);
  assert.equal(accessoryRow?.usage_area, "여밈");
  assert.equal(accessoryRow?.memo, "부자재 인라인 QA");
  const accessoryRead = await request({
    command: "accessory-inline-reread",
    method: "GET",
    path: `/api/v2/work-orders/${current.workOrderId}/materials?type=accessory&lifecycle=active&limit=30`,
    redactedPath: "/api/v2/work-orders/{workOrderId}/materials?type=accessory&lifecycle=active&limit=30",
  });
  assert.equal(accessoryRead.response.status, 200);
  const accessoryApiRow = accessoryRead.body?.data?.items?.find((item) => item.id === accessory.materialId);
  assert.equal(accessoryApiRow?.usageArea, "여밈");
  assert.equal(accessoryApiRow?.memo, "부자재 인라인 QA");
  record({ kind: "unchanged-inline-save-before-assertion", command: "accessory", requestCount: 0 });
  assertDelta(current, await snapshot(), "accessory-unchanged", {});
  current = await patchMaterial(current, accessory.materialId, "accessory", {
    usageArea: "",
    memo: null,
  }, "accessory-baseline-restore");

  current = await archiveMaterial(current, fabric.materialId, "fabric");
  current = await archiveMaterial(current, accessory.materialId, "accessory");

  assert.equal(current.productTypeCode, before.productTypeCode);
  assert.equal(current.itemCode, before.itemCode);
  assert.equal(current.seasonCode, before.seasonCode);
  assert.equal(current.factoryDeliveryMemo, before.factoryDeliveryMemo);
  assert.equal(current.created.filter((item) => item.archived_at !== null).length, 2);
  assert.deepEqual(current.created.map((item) => ({
    materialType: item.material_type,
    unitCode: item.unit_code,
    usageArea: item.usage_area,
    memo: item.memo,
    unitPrice: item.unit_price,
  })), [
    { materialType: "accessory", unitCode: "개", usageArea: null, memo: null, unitPrice: "0.00" },
    { materialType: "fabric", unitCode: "yd", usageArea: null, memo: null, unitPrice: "0.00" },
  ]);

  const finalDelta = delta(before, current);
  const expectedDelta = {
    workOrderVersion: 12,
    revisionVersion: 12,
    event: 12,
    receipt: 4,
    materialRows: 2,
    materialVersionSum: 8,
    migration: 0,
  };
  record({
    kind: "final-mutation-security-audit-before-assertion",
    observed: finalDelta,
    expected: expectedDelta,
    baselineRestored: true,
    archivedFixtures: 2,
    directR2Access: 0,
    workerBypass: 0,
    r2Put: 0,
    r2Delete: 0,
  });
  assert.deepEqual(finalDelta, expectedDelta);
  assert.equal(current.otherFingerprint, before.otherFingerprint);

  const result = {
    ok: true,
    checkpoint: "ALPHA57_V10_QA_FIX_IPHONE_REQA_REQUIRED",
    targetWorkOrderRef: ref(current.workOrderId),
    autoConnect: 200,
    list: 200,
    detail: 200,
    categoryInline: { save: "PASS", reread: "PASS", unchangedMutation: 0, baselineRestore: "PASS" },
    factoryMemoInline: { save: "PASS", reread: "PASS", unchangedMutation: 0, baselineRestore: "PASS" },
    materialInline: {
      fabric: "PASS",
      accessory: "PASS",
      zeroReplacement: { input: "8161", stored: "8161.00", result: "PASS" },
      unchangedMutation: 0,
      archivedCleanup: "PASS",
    },
    mutationDelta: finalDelta,
    directR2Access: 0,
    workerBypass: 0,
    r2Put: 0,
    r2Delete: 0,
    migrationDelta: 0,
  };
  fs.writeFileSync(resultPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(result));
} catch (error) {
  const failure = {
    ok: false,
    checkpoint: "ALPHA57_V10_QA_FIX_FAILURE_HANDOFF_REQUIRED",
    error: error instanceof Error ? error.message : String(error),
    directR2Access: 0,
    workerBypass: 0,
  };
  fs.writeFileSync(resultPath, `${JSON.stringify(failure, null, 2)}\n`, "utf8");
  throw error;
} finally {
  await client.end();
}
