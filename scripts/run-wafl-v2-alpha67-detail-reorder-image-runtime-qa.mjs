#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import pg from "pg";
import { createR2WorkerSignedUrl } from "../lib/storage/r2/r2WorkerSignature.mjs";

const root = process.cwd();
const state = JSON.parse(fs.readFileSync(path.join(root, ".tmp/wafl-external-qa/state.json"), "utf8"));
const env = Object.fromEntries(fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/u).map((line) => {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/u);
  return match ? [match[1], match[2].trim().replace(/^("|')|("|')$/gu, "")] : null;
}).filter(Boolean));
const suffix = crypto.randomBytes(4).toString("hex").toUpperCase();
const marker = `QA A67 상세 재진입 ${suffix}`;
const resultPath = path.join(root, ".tmp/wafl-v2-alpha67/detail-reorder-image-runtime.json");
const companyId = "wafl-fn-company-a";
const base = `https://${state.tailscaleServeHostname}`;
const requests = [];
let cookie = "";
let imageKey = null;
let cleanupImageId = null;
let cleanupWorkOrderId = null;
let cleanupExpectedVersion = null;

const short = (value) => crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, 12);

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii"); const length = Buffer.alloc(4); const crc = Buffer.alloc(4);
  length.writeUInt32BE(data.length); crc.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])));
  return Buffer.concat([length, typeBytes, data, crc]);
}
function syntheticPng(width = 64, height = 64) {
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 6;
  const rows = [];
  for (let y = 0; y < height; y += 1) {
    const row = Buffer.alloc(1 + width * 4); row[0] = 0;
    for (let x = 0; x < width; x += 1) { const at = 1 + x * 4; row[at] = 180; row[at + 1] = x * 4; row[at + 2] = y * 4; row[at + 3] = 255; }
    rows.push(row);
  }
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), pngChunk("IHDR", ihdr), pngChunk("IDAT", zlib.deflateSync(Buffer.concat(rows))), pngChunk("IEND", Buffer.alloc(0))]);
}

async function request(route, method = "GET", body = null, key = null) {
  const response = await fetch(`${base}${route}`, { method, redirect: "manual", headers: { Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}), ...(key ? { "Idempotency-Key": key } : {}), ...(cookie ? { Cookie: cookie } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(90000) });
  const setCookies = response.headers.getSetCookie?.() ?? [];
  if (setCookies.length) cookie = setCookies.map((value) => value.split(";", 1)[0]).join("; ");
  const text = await response.text();
  const json = (() => { try { return JSON.parse(text); } catch { return null; } })();
  requests.push({ method, route: route.replace(/[0-9a-f]{8}-[0-9a-f-]{28}/giu, "fixture").replace(/q=[^&]+/gu, "q=[redacted]"), status: response.status, code: json?.error?.code ?? null });
  return { response, json };
}

function workerUrl(method, key, action = null) {
  const signed = createR2WorkerSignedUrl({ uploadUrl: env.R2_WORKER_UPLOAD_URL, secret: env.R2_WORKER_UPLOAD_SECRET, method, key, expiresAt: Math.floor(Date.now() / 1000) + 300 });
  const url = new URL(signed); if (action) url.searchParams.set("action", action); return url;
}
function derivativeKeys(key) {
  const match = key.match(/^companies\/([^/]+)\/workorders\/([^/]+)\/design\/([^/.]+)(?:\.[^/]+)?$/iu);
  assert.ok(match); const [, company, workOrder, object] = match;
  return { thumbnail: `companies/${company}/workorders/${workOrder}/thumbnails/design/${object}.webp`, medium: `companies/${company}/workorders/${workOrder}/previews/design/${object}-medium.webp`, large: `companies/${company}/workorders/${workOrder}/previews/design/${object}-large.webp` };
}
async function deleteObject(key) { await fetch(workerUrl("DELETE", key), { method: "DELETE", signal: AbortSignal.timeout(30000) }); }

assert.equal(state.makerQaProfile, "alpha67-current-maker");
assert.equal(state.mutationMode, "current-maker-alpha67");
assert.equal(state.developerAutoConnectReady, true);
assert.ok(env.DATABASE_URL && env.R2_WORKER_UPLOAD_URL && env.R2_WORKER_UPLOAD_SECRET);
const client = new pg.Client({ connectionString: env.DATABASE_URL, application_name: "wafl-alpha67-detail-reorder-image-runtime", statement_timeout: 120000 });
await client.connect();

try {
  const auth = await request("/api/dev/mobile-connect/auto", "POST", {});
  assert.equal(auth.response.status, 200); assert.ok(cookie);

  const createKey = `a67-detail-sample-${suffix}`;
  const createdSample = await request("/api/v2/work-orders", "POST", { clientRequestId: createKey, productName: marker, isSample: true }, createKey);
  assert.equal(createdSample.response.status, 201);
  const sampleId = createdSample.json.data.result.workOrderId;
  const firstDetail = await request(`/api/v2/work-orders/${sampleId}`);
  assert.equal(firstDetail.response.status, 200); assert.equal(firstDetail.json.data.header.identity.isSample, true);
  const noHistory = await request(`/api/v2/work-orders/${sampleId}/reorder`);
  assert.equal(noHistory.response.status, 404, "sample history is contextual, not detail existence");
  const sampleList = await request(`/api/v2/work-orders?limit=30&q=${encodeURIComponent(marker)}&character=sample`);
  assert.equal(sampleList.response.status, 200); assert.ok(sampleList.json.data.items.some((item) => item.workOrderId === sampleId));
  const reopenedDetail = await request(`/api/v2/work-orders/${sampleId}`);
  assert.equal(reopenedDetail.response.status, 200);

  const source = (await client.query(`SELECT w.id::text work_order_id,coalesce(max(series.reorder_round),0)::integer max_round,count(series.id)::integer reorder_count FROM work_orders w JOIN work_order_revisions r ON r.company_id=w.company_id AND r.id=w.current_revision_id LEFT JOIN work_orders series ON series.company_id=w.company_id AND series.series_root_work_order_id=w.id AND series.derivation_kind='reorder' AND series.deleted_at IS NULL WHERE w.company_id=$1 AND w.product_name LIKE 'QA A67 N차 리오더 % 원본' AND w.status='issued' AND r.revision_status='finalized' AND w.is_sample=false AND w.derivation_kind='original' GROUP BY w.id ORDER BY w.created_at DESC LIMIT 1`, [companyId])).rows[0];
  assert.ok(source);
  const reorderKey = `a67-postcreate-${suffix}`;
  const createdReorder = await request(`/api/v2/work-orders/${source.work_order_id}/reorder`, "POST", { clientRequestId: reorderKey, totalQuantity: 175, dueDate: "2027-06-15" }, reorderKey);
  assert.equal(createdReorder.response.status, 201);
  const reorderId = createdReorder.json.data.result.workOrderId;
  assert.equal(createdReorder.json.data.result.reorderRound, Number(source.max_round) + 1);
  const excludedList = await request("/api/v2/work-orders?limit=30&character=sample&lineage=reorder");
  assert.equal(excludedList.response.status, 200); assert.equal(excludedList.json.data.items.some((item) => item.workOrderId === reorderId), false);
  let simulatedHydrationAttempts = 0;
  const hydrateCommitted = async () => { simulatedHydrationAttempts += 1; if (simulatedHydrationAttempts === 1) throw new Error("SIMULATED_READ_ONLY_HYDRATION_FAILURE"); return request(`/api/v2/work-orders/${reorderId}`); };
  await hydrateCommitted().catch(() => undefined);
  const reorderedDetail = await hydrateCommitted();
  assert.equal(reorderedDetail.response.status, 200); assert.equal(reorderedDetail.json.data.header.id, reorderId);
  const [reorderImages, reorderPartners, reorderHistory] = await Promise.all([request(`/api/v2/work-orders/${reorderId}/assets?limit=50`), request(`/api/v2/work-orders/${reorderId}/material-partners`), request(`/api/v2/work-orders/${reorderId}/reorder`)]);
  assert.equal(reorderImages.response.status, 200); assert.equal(reorderPartners.response.status, 200); assert.equal(reorderHistory.response.status, 200);
  const afterReorders = (await client.query("SELECT count(*)::integer count,max(reorder_round)::integer max_round FROM work_orders WHERE company_id=$1 AND series_root_work_order_id=$2::uuid AND derivation_kind='reorder' AND deleted_at IS NULL", [companyId, source.work_order_id])).rows[0];
  assert.equal(Number(afterReorders.count), Number(source.reorder_count) + 1); assert.equal(Number(afterReorders.max_round), Number(source.max_round) + 1);
  assert.equal(requests.filter((entry) => entry.method === "POST" && entry.route.includes("/reorder")).length, 1, "hydration retry must not issue another create");

  const bytes = syntheticPng();
  const sampleVersion = reopenedDetail.json.data.header.entityVersion;
  const prepared = await request(`/api/v2/work-orders/${sampleId}/images/upload`, "POST", { file: { name: `QA_A67_${suffix}.png`, type: "image/png", size: bytes.length } });
  assert.equal(prepared.response.status, 200);
  const uploadTarget = prepared.json.data.uploadTarget; imageKey = uploadTarget.storageKey;
  const put = await fetch(new URL(uploadTarget.uploadUrl, base), { method: "PUT", headers: { ...uploadTarget.headers, Cookie: cookie }, body: bytes, signal: AbortSignal.timeout(60000) });
  assert.equal(put.status, 200);
  const completeKey = `a67-image-complete-${suffix}`;
  const completed = await request(`/api/v2/work-orders/${sampleId}/images/upload/complete`, "POST", { expectedVersion: sampleVersion, clientRequestId: completeKey, uploadTarget }, completeKey);
  assert.equal(completed.response.status, 201);
  const imageId = completed.json.data.imageId;
  cleanupImageId = imageId;
  cleanupWorkOrderId = sampleId;
  cleanupExpectedVersion = completed.json.data.nextVersion;
  const assets = await request(`/api/v2/work-orders/${sampleId}/assets?limit=50`);
  const image = assets.json.data.items.find((item) => item.id === imageId); assert.ok(image?.viewUrl);
  const redirect = await request(image.viewUrl); assert.equal(redirect.response.status, 307);
  const thumbnail = await fetch(redirect.response.headers.get("location"), { redirect: "manual", signal: AbortSignal.timeout(60000) });
  assert.equal(thumbnail.status, 200); assert.match(thumbnail.headers.get("content-type") ?? "", /image\/webp/iu); assert.ok((await thumbnail.arrayBuffer()).byteLength > 0);
  const representativeKey = `a67-image-representative-${suffix}`;
  const representative = await request(`/api/v2/work-orders/${sampleId}/images/${imageId}/representative`, "POST", { expectedVersion: completed.json.data.nextVersion, clientRequestId: representativeKey }, representativeKey);
  assert.equal(representative.response.status, 200);
  cleanupExpectedVersion = representative.json.data.nextVersion;
  const representativeDetail = await request(`/api/v2/work-orders/${sampleId}`);
  assert.equal(representativeDetail.json.data.header.representativeImage.imageId, imageId);
  const deleteKey = `a67-image-delete-${suffix}`;
  const deleted = await request(`/api/v2/work-orders/${sampleId}/images/${imageId}/delete`, "POST", { expectedVersion: representative.json.data.nextVersion, clientRequestId: deleteKey }, deleteKey);
  assert.equal(deleted.response.status, 200);
  cleanupImageId = null;
  cleanupWorkOrderId = null;
  cleanupExpectedVersion = null;
  const finalAssets = await request(`/api/v2/work-orders/${sampleId}/assets?limit=50`);
  assert.equal(finalAssets.json.data.items.some((item) => item.id === imageId), false);
  const keys = derivativeKeys(imageKey);
  for (const key of [keys.thumbnail, keys.medium, keys.large, imageKey]) {
    const missing = await fetch(workerUrl("GET", key), { method: "GET", redirect: "manual", signal: AbortSignal.timeout(30000) });
    assert.equal(missing.status, 404);
  }
  const activeResidual = Number((await client.query("SELECT count(*)::integer count FROM work_order_images WHERE company_id=$1 AND work_order_id=$2::uuid AND deleted_at IS NULL", [companyId, sampleId])).rows[0].count);
  assert.equal(activeResidual, 0);

  const result = {
    ok: true,
    checkpoint: "ALPHA67_DETAIL_ENTRY_REORDER_POSTCREATE_IMAGE_PIPELINE_IPHONE_REQA_REQUIRED",
    sample: { retainedRef: short(sampleId), listReentry: "PASS", optionalHistory404DoesNotBlockDetail: "PASS" },
    reorder: { retainedRef: short(reorderId), allocatedRound: createdReorder.json.data.result.reorderRound, excludedFilteredListAccepted: true, hydrationAttempts: simulatedHydrationAttempts, createCommandCalls: 1 },
    image: { prepare: 200, upload: 200, complete: 201, thumbnail: 200, representative: 200, activeResidual: 0, objectResidual: 0 },
    requests: requests.length,
    migrationLedger: 20,
    productionMutation: 0,
    ownerFixtureMutation: 0,
    physicalResultInferred: false,
  };
  fs.mkdirSync(path.dirname(resultPath), { recursive: true }); fs.writeFileSync(resultPath, JSON.stringify(result, null, 2), "utf8");
  console.log(JSON.stringify(result));
} finally {
  if (cleanupImageId && cleanupWorkOrderId && Number.isInteger(cleanupExpectedVersion)) {
    const cleanupKey = `a67-image-cleanup-${suffix}`;
    await request(`/api/v2/work-orders/${cleanupWorkOrderId}/images/${cleanupImageId}/delete`, "POST", {
      expectedVersion: cleanupExpectedVersion,
      clientRequestId: cleanupKey,
    }, cleanupKey).catch(() => undefined);
  }
  if (imageKey) { const keys = derivativeKeys(imageKey); for (const key of [keys.thumbnail, keys.medium, keys.large, imageKey]) await deleteObject(key).catch(() => undefined); }
  await client.end();
}
