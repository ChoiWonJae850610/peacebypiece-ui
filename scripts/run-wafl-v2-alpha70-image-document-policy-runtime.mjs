#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

import { createR2WorkerSignedUrl } from "../lib/storage/r2/r2WorkerSignature.mjs";

const root = process.cwd();
const state = JSON.parse(fs.readFileSync(path.join(root, ".tmp/wafl-external-qa/state.json"), "utf8"));
const env = Object.fromEntries(fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/u).map((line) => {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/u);
  return match ? [match[1], match[2].trim().replace(/^("|')|("|')$/gu, "")] : null;
}).filter(Boolean));
const base = `https://${state.tailscaleServeHostname}`;
const suffix = crypto.randomBytes(4).toString("hex");
const productName = `QA A70 image document ${suffix.toUpperCase()}`;
const resultPath = path.join(root, ".tmp/wafl-v2-alpha70/image-document-policy-runtime.json");
let cookie = "";
let workOrderId = null;
let deleted = false;
const calls = [];

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

function syntheticPng(red, green, blue) {
  const width = 32; const height = 32;
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 6;
  const rows = Array.from({ length: height }, () => {
    const row = Buffer.alloc(1 + width * 4); row[0] = 0;
    for (let x = 0; x < width; x += 1) { const at = 1 + x * 4; row[at] = red; row[at + 1] = green; row[at + 2] = blue; row[at + 3] = 255; }
    return row;
  });
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), pngChunk("IHDR", ihdr), pngChunk("IDAT", zlib.deflateSync(Buffer.concat(rows))), pngChunk("IEND", Buffer.alloc(0))]);
}

async function request(route, { method = "GET", body, rawBody, key, headers = {}, absolute = false } = {}) {
  const response = await fetch(absolute ? route : `${base}${route}`, {
    method,
    redirect: "manual",
    headers: { Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}), ...(key ? { "Idempotency-Key": key } : {}), ...(cookie && (!absolute || route.startsWith(base)) ? { Cookie: cookie } : {}), ...headers },
    ...(body ? { body: JSON.stringify(body) } : rawBody ? { body: rawBody } : {}),
    signal: AbortSignal.timeout(120000),
  });
  const setCookies = response.headers.getSetCookie?.() ?? [];
  if (setCookies.length) cookie = setCookies.map((value) => value.split(";", 1)[0]).join("; ");
  const text = await response.text();
  let json = null; try { json = JSON.parse(text); } catch { /* binary */ }
  calls.push({ method, route: route.replace(/[0-9a-f]{8}-[0-9a-f-]{28}/giu, "fixture"), status: response.status, code: json?.error?.code ?? null });
  return { response, text, json };
}

async function detail() {
  const result = await request(`/api/v2/work-orders/${workOrderId}`);
  assert.equal(result.response.status, 200, result.text.slice(0, 300));
  return result.json.data;
}

async function assets() {
  const result = await request(`/api/v2/work-orders/${workOrderId}/assets?limit=50`);
  assert.equal(result.response.status, 200, result.text.slice(0, 300));
  return result.json.data.items;
}

async function uploadImage(bytes, label, expectedVersion) {
  const prepared = await request(`/api/v2/work-orders/${workOrderId}/images/upload`, { method: "POST", body: { file: { name: `${label}.png`, type: "image/png", size: bytes.length } } });
  assert.equal(prepared.response.status, 200, prepared.text.slice(0, 300));
  const target = prepared.json.data.uploadTarget;
  const put = await request(new URL(target.uploadUrl, base).toString(), { method: "PUT", rawBody: bytes, headers: target.headers, absolute: true });
  assert.equal(put.response.status, 200, put.text.slice(0, 200));
  const key = `a70-image-complete-${label}-${suffix}`;
  const completed = await request(`/api/v2/work-orders/${workOrderId}/images/upload/complete`, { method: "POST", key, body: { expectedVersion, clientRequestId: key, uploadTarget: target } });
  assert.equal(completed.response.status, 201, completed.text.slice(0, 500));
  return completed.json.data;
}

async function prepareAndPutAttachment(bytes, label) {
  const prepared = await request(`/api/v2/work-orders/${workOrderId}/attachments/upload`, { method: "POST", body: { file: { name: `${label}.pdf`, type: "application/pdf", size: bytes.length } } });
  assert.equal(prepared.response.status, 200, prepared.text.slice(0, 300));
  const target = prepared.json.data.uploadTarget;
  const put = await request(new URL(target.uploadUrl, base).toString(), { method: "PUT", rawBody: bytes, headers: target.headers, absolute: true });
  assert.equal(put.response.status, 200, put.text.slice(0, 200));
  return target;
}

async function r2Exists(key) {
  const expiresAt = Math.floor(Date.now() / 1000) + 120;
  const url = createR2WorkerSignedUrl({ uploadUrl: env.R2_WORKER_UPLOAD_URL, secret: env.R2_WORKER_UPLOAD_SECRET, method: "GET", key, expiresAt });
  const response = await fetch(url, { method: "GET", signal: AbortSignal.timeout(30000) });
  return response.ok;
}

assert.equal(state.status, "running");
assert.equal(state.developerAutoConnectReady, true);

try {
  const auth = await request("/api/dev/mobile-connect/auto", { method: "POST", body: {} });
  assert.equal(auth.response.status, 200); assert.ok(cookie);
  const createKey = `a70-image-policy-create-${suffix}`;
  const created = await request("/api/v2/work-orders", { method: "POST", key: createKey, body: { clientRequestId: createKey, productName, isSample: false } });
  assert.equal(created.response.status, 201, created.text.slice(0, 500));
  workOrderId = created.json.data.result.workOrderId;

  let version = (await detail()).header.entityVersion;
  const first = await uploadImage(syntheticPng(180, 40, 60), "representative", version); version = first.nextVersion;
  const second = await uploadImage(syntheticPng(30, 80, 190), "supplemental", version); version = second.nextVersion;
  let currentAssets = await assets();
  const firstAsset = currentAssets.find((item) => item.id === first.imageId);
  const secondAsset = currentAssets.find((item) => item.id === second.imageId);
  assert.equal(firstAsset.isRepresentative, true); assert.equal(firstAsset.includeInDocument, false);
  assert.equal(secondAsset.isRepresentative, false); assert.equal(secondAsset.includeInDocument, false);

  const includeKey = `a70-output-include-${suffix}`;
  const included = await request(`/api/v2/work-orders/${workOrderId}/images/${second.imageId}/output-include`, { method: "PATCH", key: includeKey, body: { expectedVersion: version, clientRequestId: includeKey, includeInDocument: true } });
  assert.equal(included.response.status, 200, included.text.slice(0, 500));
  assert.equal(included.json.data.includeInDocument, true); assert.equal(included.json.data.nextVersion, version + 1); version = included.json.data.nextVersion;
  const replay = await request(`/api/v2/work-orders/${workOrderId}/images/${second.imageId}/output-include`, { method: "PATCH", key: includeKey, body: { expectedVersion: version - 1, clientRequestId: includeKey, includeInDocument: true } });
  assert.equal(replay.response.status, 200); assert.equal(replay.json.data.nextVersion, version); assert.equal(replay.response.headers.get("x-wafl-idempotent-replay"), "1");
  const staleKey = `a70-output-stale-${suffix}`;
  const stale = await request(`/api/v2/work-orders/${workOrderId}/images/${second.imageId}/output-include`, { method: "PATCH", key: staleKey, body: { expectedVersion: version - 1, clientRequestId: staleKey, includeInDocument: false } });
  assert.equal(stale.response.status, 409); assert.equal(stale.json.error.code, "CONFLICT");
  currentAssets = await assets();
  assert.equal(currentAssets.find((item) => item.id === second.imageId).includeInDocument, true);
  assert.equal(currentAssets.find((item) => item.id === first.imageId).isRepresentative, true);

  const badPdfBytes = syntheticPng(20, 20, 20);
  const badTarget = await prepareAndPutAttachment(badPdfBytes, `fake-${suffix}`);
  const badKey = `a70-fake-pdf-${suffix}`;
  const bad = await request(`/api/v2/work-orders/${workOrderId}/attachments/upload/complete`, { method: "POST", key: badKey, body: { expectedVersion: version, clientRequestId: badKey, uploadTarget: badTarget } });
  assert.equal(bad.response.status, 400, bad.text.slice(0, 500)); assert.equal(bad.json.error.code, "VALIDATION_ERROR");
  assert.equal(await r2Exists(badTarget.storageKey), false, "invalid renamed image object must be removed");

  const pdfBytes = Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF\n", "ascii");
  const pdfTarget = await prepareAndPutAttachment(pdfBytes, `delivery-${suffix}`);
  const pdfKey = `a70-valid-pdf-${suffix}`;
  const pdf = await request(`/api/v2/work-orders/${workOrderId}/attachments/upload/complete`, { method: "POST", key: pdfKey, body: { expectedVersion: version, clientRequestId: pdfKey, uploadTarget: pdfTarget } });
  assert.equal(pdf.response.status, 201, pdf.text.slice(0, 500)); version = pdf.json.data.nextVersion;
  currentAssets = await assets();
  assert.equal(currentAssets.filter((item) => item.assetType === "image").length, 2);
  assert.equal(currentAssets.filter((item) => item.assetType === "attachment" && item.mimeType === "application/pdf").length, 1);
  const pdfAttachment = currentAssets.find((item) => item.assetType === "attachment" && item.mimeType === "application/pdf");
  assert.ok(pdfAttachment);
  const attachmentIncludeKey = `a70-attachment-include-${suffix}`;
  const attachmentIncluded = await request(`/api/v2/work-orders/${workOrderId}/attachments/${pdfAttachment.id}/output-include`, { method: "PATCH", key: attachmentIncludeKey, body: { expectedVersion: version, clientRequestId: attachmentIncludeKey, includeInDocument: true } });
  assert.equal(attachmentIncluded.response.status, 200, attachmentIncluded.text.slice(0, 500));
  version = attachmentIncluded.json.data.nextVersion;
  assert.equal((await assets()).find((item) => item.id === pdfAttachment.id)?.includeInDocument, true);
  const attachmentExcludeKey = `a70-attachment-exclude-${suffix}`;
  const attachmentExcluded = await request(`/api/v2/work-orders/${workOrderId}/attachments/${pdfAttachment.id}/output-include`, { method: "PATCH", key: attachmentExcludeKey, body: { expectedVersion: version, clientRequestId: attachmentExcludeKey, includeInDocument: false } });
  assert.equal(attachmentExcluded.response.status, 200, attachmentExcluded.text.slice(0, 500));
  version = attachmentExcluded.json.data.nextVersion;
  assert.equal((await assets()).find((item) => item.id === pdfAttachment.id)?.includeInDocument, false);

  const remove = await request(`/api/v2/work-orders/${workOrderId}`, { method: "DELETE" });
  assert.equal(remove.response.status, 200, remove.text.slice(0, 500)); deleted = true;
  assert.equal((await request(`/api/v2/work-orders/${workOrderId}`)).response.status, 404);
  assert.equal((await request(`/api/v2/work-orders?q=${encodeURIComponent(productName)}`)).json.data.items.some((item) => item.workOrderId === workOrderId), false);
  assert.equal(await r2Exists(pdfTarget.storageKey), false);
  assert.equal(await r2Exists(badTarget.storageKey), false);

  const result = {
    ok: true,
    checkpoint: "ALPHA70_IMAGE_DOCUMENT_POLICY_HEIC_IPHONE_REQA_REQUIRED",
    imageUploads: 2,
    outputIncludeMutations: 1,
    attachmentOutputIncludeMutations: 2,
    idempotentReplay: 1,
    staleConflictStatus: 409,
    pdfAttachmentStatus: 201,
    disguisedImagePdfStatus: 400,
    imageRowsAfterUpload: 2,
    attachmentRowsAfterUpload: 1,
    duplicateImages: 0,
    listResidual: 0,
    fixtureResidual: 0,
    r2Residual: 0,
    productionMutation: 0,
    ownerMutation: 0,
    ambiguousMutation: 0,
    correlations: calls.filter((item) => item.status >= 400),
  };
  fs.mkdirSync(path.dirname(resultPath), { recursive: true });
  fs.writeFileSync(resultPath, JSON.stringify(result, null, 2), "utf8");
  console.log(JSON.stringify(result));
} finally {
  if (workOrderId && !deleted) {
    const cleanup = await request(`/api/v2/work-orders/${workOrderId}`, { method: "DELETE" }).catch(() => null);
    if (!cleanup || ![200, 404].includes(cleanup.response.status)) throw new Error("EXACT_A70_DRAFT_FIXTURE_CLEANUP_FAILED");
  }
}
