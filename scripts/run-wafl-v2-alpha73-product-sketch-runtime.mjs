#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const state = JSON.parse(fs.readFileSync(path.join(root, ".tmp/wafl-external-qa/state.json"), "utf8"));
const base = `https://${state.tailscaleServeHostname}`;
const productName = "QA A73 product sketch retained";
const resultPath = path.join(root, ".tmp/wafl-v2-alpha73/product-sketch-runtime.json");
let cookie = "";
const calls = [];

function scene(id, points) {
  return {
    schemaVersion: 1,
    canvas: { width: 1000, height: 1400, origin: "top-left", xAxis: "right", yAxis: "down" },
    elements: [{ id, kind: "freehand", style: { strokeColor: "#17263D", strokeWidth: 4, fillColor: null }, points }],
  };
}

async function request(route, { method = "GET", body, key } = {}) {
  const response = await fetch(`${base}${route}`, {
    method,
    redirect: "manual",
    headers: { Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}), ...(key ? { "Idempotency-Key": key } : {}), ...(cookie ? { Cookie: cookie } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(120000),
  });
  const setCookies = response.headers.getSetCookie?.() ?? [];
  if (setCookies.length) cookie = setCookies.map((value) => value.split(";", 1)[0]).join("; ");
  const text = await response.text();
  let json = null; try { json = JSON.parse(text); } catch { /* no-op */ }
  calls.push({ method, route: route.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/giu, "fixture"), status: response.status, code: json?.error?.code ?? null, correlationPresent: Boolean(response.headers.get("x-wafl-correlation-id")) });
  return { response, text, json };
}

assert.equal(state.status, "running");
assert.equal(state.developerAutoConnectReady, true);
assert.equal(state.makerQaProfile, "alpha67-current-maker");

const auth = await request("/api/dev/mobile-connect/auto", { method: "POST", body: {} });
assert.equal(auth.response.status, 200, auth.text.slice(0, 300));
assert.ok(cookie);

const listed = await request(`/api/v2/work-orders?q=${encodeURIComponent(productName)}&limit=30`);
assert.equal(listed.response.status, 200, listed.text.slice(0, 300));
const exact = listed.json.data.items.filter((item) => item.productName === productName);
assert.ok(exact.length <= 1, "ambiguous retained fixture");
let workOrderId = exact[0]?.workOrderId ?? null;
let created = false;
if (!workOrderId) {
  const key = "alpha73-retained-product-sketch-v1";
  const result = await request("/api/v2/work-orders", { method: "POST", key, body: { clientRequestId: key, productName, isSample: false } });
  assert.equal(result.response.status, 201, result.text.slice(0, 500));
  workOrderId = result.json.data.result.workOrderId;
  created = true;
}
assert.match(workOrderId, /^[0-9a-f-]{36}$/i);

const detailBefore = await request(`/api/v2/work-orders/${workOrderId}`);
assert.equal(detailBefore.response.status, 200, detailBefore.text.slice(0, 500));
assert.equal(detailBefore.json.data.header.productName, productName);
assert.equal(detailBefore.json.data.header.status, "draft");
const workOrderVersion = detailBefore.json.data.header.entityVersion;

const initial = await request(`/api/v2/work-orders/${workOrderId}/drawings/primary-sketch`);
assert.equal(initial.response.status, 200, initial.text.slice(0, 500));
const sceneA = scene("stroke:a73:1", [{ x: 120, y: 180 }, { x: 260, y: 320 }, { x: 420, y: 230 }]);
const saveKey1 = `alpha73-sketch-save-v${initial.json.data.drawingVersion + 1}`;
const saveBody1 = { clientRequestId: saveKey1, drawingId: initial.json.data.drawingId, expectedVersion: initial.json.data.drawingVersion, scene: sceneA };
const saved1 = await request(`/api/v2/work-orders/${workOrderId}/drawings/primary-sketch`, { method: "PATCH", key: saveKey1, body: saveBody1 });
assert.equal(saved1.response.status, 200, saved1.text.slice(0, 500));
assert.equal(saved1.json.data.drawingVersion, initial.json.data.drawingVersion + 1);

const replay = await request(`/api/v2/work-orders/${workOrderId}/drawings/primary-sketch`, { method: "PATCH", key: saveKey1, body: saveBody1 });
assert.equal(replay.response.status, 200, replay.text.slice(0, 500));
assert.equal(replay.response.headers.get("x-wafl-idempotent-replay"), "1");
assert.equal(replay.json.data.drawingVersion, saved1.json.data.drawingVersion);

const sceneB = scene("stroke:a73:retained", [{ x: 180, y: 260 }, { x: 360, y: 510 }, { x: 590, y: 420 }, { x: 760, y: 680 }]);
const saveKey2 = `alpha73-sketch-save-v${saved1.json.data.drawingVersion + 1}`;
const saved2 = await request(`/api/v2/work-orders/${workOrderId}/drawings/primary-sketch`, { method: "PATCH", key: saveKey2, body: { clientRequestId: saveKey2, drawingId: saved1.json.data.drawingId, expectedVersion: saved1.json.data.drawingVersion, scene: sceneB } });
assert.equal(saved2.response.status, 200, saved2.text.slice(0, 500));
assert.equal(saved2.json.data.drawingId, saved1.json.data.drawingId);
assert.equal(saved2.json.data.drawingVersion, saved1.json.data.drawingVersion + 1);

const staleKey = `alpha73-sketch-stale-v${saved1.json.data.drawingVersion}`;
const stale = await request(`/api/v2/work-orders/${workOrderId}/drawings/primary-sketch`, { method: "PATCH", key: staleKey, body: { clientRequestId: staleKey, drawingId: saved1.json.data.drawingId, expectedVersion: saved1.json.data.drawingVersion, scene: scene("stroke:stale", [{ x: 50, y: 50 }, { x: 70, y: 70 }]) } });
assert.equal(stale.response.status, 409, stale.text.slice(0, 500));
assert.equal(stale.json.error.code, "CONFLICT");

const reopened = await request(`/api/v2/work-orders/${workOrderId}/drawings/primary-sketch`);
assert.equal(reopened.response.status, 200, reopened.text.slice(0, 500));
assert.deepEqual(reopened.json.data.scene, sceneB);
assert.equal(reopened.json.data.drawingVersion, saved2.json.data.drawingVersion);
const detailAfter = await request(`/api/v2/work-orders/${workOrderId}`);
assert.equal(detailAfter.response.status, 200, detailAfter.text.slice(0, 500));
assert.equal(detailAfter.json.data.header.entityVersion, workOrderVersion, "drawing version must be independent from WorkOrder version");

const missing = crypto.randomUUID();
const missingRead = await request(`/api/v2/work-orders/${missing}/drawings/primary-sketch`);
assert.equal(missingRead.response.status, 404);

const result = {
  ok: true,
  checkpoint: "ALPHA73_PRODUCT_SKETCH_FREEHAND_PERSISTENCE_IPHONE_QA_REQUIRED",
  fixture: { productName, retained: true, createdThisRun: created, reference: crypto.createHash("sha256").update(workOrderId).digest("hex").slice(0, 12) },
  drawing: { initialVersion: initial.json.data.drawingVersion, finalVersion: reopened.json.data.drawingVersion, drawingIdentityStable: true, reopenSceneEqual: true },
  idempotentReplay: 1,
  staleConflictStatus: stale.response.status,
  workOrderVersionMutation: 0,
  r2Mutation: 0,
  productionMutation: 0,
  ownerMutation: 0,
  ambiguousMutation: 0,
  calls,
};
fs.mkdirSync(path.dirname(resultPath), { recursive: true });
fs.writeFileSync(resultPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(JSON.stringify(result));
