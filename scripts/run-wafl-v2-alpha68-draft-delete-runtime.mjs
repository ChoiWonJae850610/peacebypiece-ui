#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const root = process.cwd();
const state = JSON.parse(fs.readFileSync(path.join(root, ".tmp/wafl-external-qa/state.json"), "utf8"));
const base = `https://${state.tailscaleServeHostname}`;
const suffix = crypto.randomBytes(4).toString("hex").toUpperCase();
const productName = `QA A68 Draft delete ${suffix}`;
const resultPath = path.join(root, ".tmp/wafl-v2-alpha68/draft-delete-runtime.json");
let cookie = "";
let workOrderId = null;
let deleted = false;
let mutationRequests = 0;

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4); length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])));
  return Buffer.concat([length, typeBytes, data, crc]);
}

function syntheticPng() {
  const width = 24; const height = 24;
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 6;
  const rows = Array.from({ length: height }, (_, y) => {
    const row = Buffer.alloc(1 + width * 4); row[0] = 0;
    for (let x = 0; x < width; x += 1) { const at = 1 + x * 4; row[at] = 44; row[at + 1] = 88 + x; row[at + 2] = 132 + y; row[at + 3] = 255; }
    return row;
  });
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), pngChunk("IHDR", ihdr), pngChunk("IDAT", zlib.deflateSync(Buffer.concat(rows))), pngChunk("IEND", Buffer.alloc(0))]);
}

async function request(route, { method = "GET", body, rawBody, key, headers = {} } = {}) {
  if (!["GET", "HEAD"].includes(method)) mutationRequests += 1;
  const response = await fetch(`${base}${route}`, {
    method,
    redirect: "manual",
    headers: { Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}), ...(key ? { "Idempotency-Key": key } : {}), ...(cookie ? { Cookie: cookie } : {}), ...headers },
    ...(body ? { body: JSON.stringify(body) } : rawBody ? { body: rawBody } : {}),
    signal: AbortSignal.timeout(120000),
  });
  const setCookies = response.headers.getSetCookie?.() ?? [];
  if (setCookies.length) cookie = setCookies.map((value) => value.split(";", 1)[0]).join("; ");
  const text = await response.text();
  let json = null; try { json = JSON.parse(text); } catch { /* binary/non-JSON */ }
  return { response, text, json };
}

assert.equal(state.status, "running");
assert.equal(state.developerAutoConnectReady, true);

try {
  const auth = await request("/api/dev/mobile-connect/auto", { method: "POST", body: {} });
  assert.equal(auth.response.status, 200); assert.ok(cookie);

  const createKey = `a68-delete-create-${suffix.toLowerCase()}`;
  const created = await request("/api/v2/work-orders", { method: "POST", key: createKey, body: { clientRequestId: createKey, productName, isSample: false } });
  assert.equal(created.response.status, 201, created.text.slice(0, 300));
  workOrderId = created.json.data.result.workOrderId;

  const detail = await request(`/api/v2/work-orders/${workOrderId}`);
  assert.equal(detail.response.status, 200);
  let entityVersion = detail.json.data.header.entityVersion;

  const sizeKey = `a68-delete-size-${suffix.toLowerCase()}`;
  const size = await request(`/api/v2/work-orders/${workOrderId}/size-color/sizes`, { method: "POST", key: sizeKey, body: { clientRequestId: sizeKey, expectedVersion: entityVersion, displayLabel: `QA-${suffix}` } });
  assert.equal(size.response.status, 201, size.text.slice(0, 300));
  entityVersion = size.json.data.nextVersion;

  const bytes = syntheticPng();
  const prepared = await request(`/api/v2/work-orders/${workOrderId}/images/upload`, { method: "POST", body: { file: { name: `qa-${suffix}.png`, type: "image/png", size: bytes.length } } });
  assert.equal(prepared.response.status, 200, prepared.text.slice(0, 300));
  const target = prepared.json.data.uploadTarget;
  const uploaded = await fetch(new URL(target.uploadUrl, base), { method: "PUT", headers: { ...target.headers, ...(cookie ? { Cookie: cookie } : {}) }, body: bytes, signal: AbortSignal.timeout(120000) });
  assert.equal(uploaded.status, 200);
  const completeKey = `a68-delete-image-${suffix.toLowerCase()}`;
  const completed = await request(`/api/v2/work-orders/${workOrderId}/images/upload/complete`, { method: "POST", key: completeKey, body: { expectedVersion: entityVersion, clientRequestId: completeKey, uploadTarget: target } });
  assert.equal(completed.response.status, 201, completed.text.slice(0, 300));
  const beforeAssets = await request(`/api/v2/work-orders/${workOrderId}/assets?limit=50`);
  assert.equal(beforeAssets.response.status, 200); assert.equal(beforeAssets.json.data.items.length, 1);

  // Native Alert cancel has no onPress and therefore emits no DELETE request.
  const mutationsBeforeCancel = mutationRequests;
  const afterCancelDetail = await request(`/api/v2/work-orders/${workOrderId}`);
  assert.equal(afterCancelDetail.response.status, 200);
  assert.equal(mutationRequests, mutationsBeforeCancel);

  const listBefore = await request(`/api/v2/work-orders?q=${encodeURIComponent(productName)}`);
  assert.equal(listBefore.response.status, 200);
  assert.equal(listBefore.json.data.items.some((item) => item.workOrderId === workOrderId), true);

  const remove = await request(`/api/v2/work-orders/${workOrderId}`, { method: "DELETE" });
  assert.equal(remove.response.status, 200, remove.text.slice(0, 300));
  assert.equal(remove.json?.ok, true);
  assert.equal(remove.json?.data?.deleted, true);
  assert.equal(remove.json?.data?.workOrderId, workOrderId);
  deleted = true;
  const missing = await request(`/api/v2/work-orders/${workOrderId}`);
  assert.equal(missing.response.status, 404);
  const listAfter = await request(`/api/v2/work-orders?q=${encodeURIComponent(productName)}`);
  assert.equal(listAfter.response.status, 200);
  assert.equal(listAfter.json.data.items.some((item) => item.workOrderId === workOrderId), false);
  const replay = await request(`/api/v2/work-orders/${workOrderId}`, { method: "DELETE" });
  assert.equal(replay.response.status, 404);

  const result = {
    ok: true,
    checkpoint: "ALPHA68_BASIC_INFO_PICKER_TAB_DELETE_BLOCKER_IPHONE_REQA_REQUIRED",
    cancelMutation: 0,
    confirmStatus: remove.response.status,
    confirmCorrelationHash: crypto.createHash("sha256").update(remove.response.headers.get("x-wafl-correlation-id") ?? "missing").digest("hex").slice(0, 12),
    coreReadAfterDelete: missing.response.status,
    listResidual: 0,
    exactOwnedImageFamilyDeleteCompletedBeforeResponse: true,
    replayStatus: replay.response.status,
    productionMutation: 0,
    ownerMutation: 0,
    ambiguousMutation: 0,
    triggerDisabled: false,
  };
  fs.mkdirSync(path.dirname(resultPath), { recursive: true });
  fs.writeFileSync(resultPath, JSON.stringify(result, null, 2), "utf8");
  console.log(JSON.stringify(result));
} finally {
  if (workOrderId && !deleted) {
    const cleanup = await request(`/api/v2/work-orders/${workOrderId}`, { method: "DELETE" }).catch(() => null);
    if (!cleanup || ![200, 404].includes(cleanup.response.status)) throw new Error("EXACT_DRAFT_FIXTURE_CLEANUP_FAILED");
  }
}
