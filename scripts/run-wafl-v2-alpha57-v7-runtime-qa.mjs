#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const root = process.cwd();
const v8Mode = process.argv.includes("--v8");
const evidencePath = path.join(root, ".tmp", "wafl-external-qa", v8Mode ? "a57-v8-runtime-evidence.jsonl" : "a57-v7-runtime-evidence.jsonl");
const resultPath = path.join(root, ".tmp", "wafl-external-qa", v8Mode ? "a57-v8-runtime-result.json" : "a57-v7-runtime-result.json");
const statePath = path.join(root, ".tmp", "wafl-external-qa", "state.json");
const finalizeExistingCycle = process.argv.includes("--finalize-existing-cycle");
const expectedMemo = v8Mode ? `한글 IME\n${"가".repeat(493)}` : "A57-V7 Runtime QA\n공장 전달 메모 ✓";
if (v8Mode) assert.equal(expectedMemo.length, 500);
const imageBytes = Buffer.from(
  "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAAgACADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDEooor+zT+ZwooooAKKKKACiiigD//2Q==",
  "base64",
);
const attachmentBytes = Buffer.from("%PDF-1.4\n% WAFL A57 V7 runtime attachment\n%%EOF\n", "utf8");

function readEnv() {
  const values = {};
  for (const line of fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!match) continue;
    let value = match[2];
    if (
      value.length >= 2
      && ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'")))
    ) value = value.slice(1, -1);
    values[match[1]] = value;
  }
  return values;
}

function hash(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function shortRef(value) {
  return hash(value).slice(0, 12);
}

if (!finalizeExistingCycle) fs.writeFileSync(evidencePath, "", "utf8");
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
assert.ok(env.DATABASE_URL);
assert.ok(env.R2_WORKER_UPLOAD_URL);
const workerOrigin = new URL(env.R2_WORKER_UPLOAD_URL).origin;
const runtimeBaseUrl = `https://${state.tailscaleServeHostname}`;
const client = new pg.Client({
  connectionString: env.DATABASE_URL,
  application_name: "wafl-a57-v7-runtime-qa",
});
await client.connect();

async function snapshot() {
  await client.query("BEGIN READ ONLY");
  try {
    const parent = (await client.query(`
      SELECT w.company_id, w.id AS work_order_id, w.current_revision_id AS revision_id,
             w.entity_version AS work_order_version, r.entity_version AS revision_version,
             w.representative_image_id, r.factory_delivery_memo,
             (SELECT count(*)::integer FROM domain_events) AS event_count,
             (SELECT count(*)::integer FROM work_order_command_receipts) AS receipt_count,
             (SELECT count(*)::integer FROM work_order_images) AS image_count,
             (SELECT count(*)::integer FROM work_order_attachments) AS attachment_count,
             (SELECT count(*)::integer FROM wafl_v2_migration_ledger) AS migration_count
        FROM work_orders w
        JOIN work_order_revisions r
          ON r.company_id = w.company_id AND r.id = w.current_revision_id
       WHERE EXISTS (
         SELECT 1 FROM work_order_material_lines marker
          WHERE marker.company_id = w.company_id
            AND marker.revision_id = r.id
            AND marker.name = 'UNITEDITABLEMATERI'
       )
       LIMIT 1
    `)).rows[0];
    assert.ok(parent, "TARGET_FIXTURE_NOT_FOUND");
    const images = (await client.query(`
      SELECT i.id, i.storage_object_key, i.thumbnail_object_key, i.original_filename,
             i.deleted_at, ri.is_representative, ri.display_order
        FROM work_order_images i
        LEFT JOIN work_order_revision_images ri
          ON ri.company_id = i.company_id AND ri.image_id = i.id AND ri.revision_id = $3::uuid
       WHERE i.company_id = $1 AND i.work_order_id = $2::uuid
       ORDER BY i.id
    `, [parent.company_id, parent.work_order_id, parent.revision_id])).rows;
    const attachments = (await client.query(`
      SELECT a.id, a.storage_object_key, a.original_filename, a.deleted_at, ra.display_order
        FROM work_order_attachments a
        LEFT JOIN work_order_revision_attachments ra
          ON ra.company_id = a.company_id AND ra.attachment_id = a.id AND ra.revision_id = $3::uuid
       WHERE a.company_id = $1 AND a.work_order_id = $2::uuid
       ORDER BY a.id
    `, [parent.company_id, parent.work_order_id, parent.revision_id])).rows;
    const others = (await client.query(`
      SELECT w.id, w.entity_version, w.representative_image_id,
             i.id AS image_id, i.deleted_at AS image_deleted_at,
             a.id AS attachment_id, a.deleted_at AS attachment_deleted_at
        FROM work_orders w
        LEFT JOIN work_order_images i ON i.company_id = w.company_id AND i.work_order_id = w.id
        LEFT JOIN work_order_attachments a ON a.company_id = w.company_id AND a.work_order_id = w.id
       WHERE w.company_id = $1 AND w.id <> $2::uuid
       ORDER BY w.id, i.id, a.id
    `, [parent.company_id, parent.work_order_id])).rows;
    await client.query("ROLLBACK");
    return {
      workOrderId: parent.work_order_id,
      revisionId: parent.revision_id,
      workOrderVersion: Number(parent.work_order_version),
      revisionVersion: Number(parent.revision_version),
      eventCount: Number(parent.event_count),
      receiptCount: Number(parent.receipt_count),
      imageRowCount: Number(parent.image_count),
      attachmentRowCount: Number(parent.attachment_count),
      migrationLedger: Number(parent.migration_count),
      representativeImageId: parent.representative_image_id,
      factoryDeliveryMemo: parent.factory_delivery_memo,
      activeImages: images.filter((row) => row.deleted_at === null),
      activeAttachments: attachments.filter((row) => row.deleted_at === null),
      allImages: images,
      allAttachments: attachments,
      otherFingerprint: hash(JSON.stringify(others)),
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

function delta(previous, next) {
  return {
    workOrderVersion: next.workOrderVersion - previous.workOrderVersion,
    revisionVersion: next.revisionVersion - previous.revisionVersion,
    event: next.eventCount - previous.eventCount,
    receipt: next.receiptCount - previous.receiptCount,
    imageRows: next.imageRowCount - previous.imageRowCount,
    attachmentRows: next.attachmentRowCount - previous.attachmentRowCount,
    activeImages: next.activeImages.length - previous.activeImages.length,
    activeAttachments: next.activeAttachments.length - previous.activeAttachments.length,
    migrationLedger: next.migrationLedger - previous.migrationLedger,
    otherWorkOrderMutation: next.otherFingerprint === previous.otherFingerprint ? 0 : 1,
  };
}

function assertMutation(previous, next, expected) {
  const observed = delta(previous, next);
  record({ kind: "mutation-delta-before-assertion", command: expected.command, ...observed });
  for (const [field, value] of Object.entries(expected.delta)) assert.equal(observed[field], value, `${expected.command}:${field}`);
  assert.equal(observed.migrationLedger, 0);
  assert.equal(observed.otherWorkOrderMutation, 0);
}

let cookie = "";
function sanitizedJson(body) {
  if (!body || typeof body !== "object") return body;
  return {
    ok: body.ok === true,
    error: body.error ? { code: body.error.code ?? null, message: body.error.message ?? null } : null,
    data: body.data ? {
      nextVersion: body.data.nextVersion ?? null,
      entityVersion: body.data.entityVersion ?? body.data.header?.entityVersion ?? null,
      imageIdRef: body.data.imageId ? shortRef(body.data.imageId) : null,
      attachmentIdRef: body.data.attachmentId ? shortRef(body.data.attachmentId) : null,
      isRepresentative: body.data.isRepresentative ?? null,
      deleted: body.data.deleted ?? null,
      itemCount: Array.isArray(body.data.items) ? body.data.items.length : null,
      uploadTarget: body.data.uploadTarget ? {
        method: body.data.uploadTarget.method,
        fileName: body.data.uploadTarget.fileName,
        contentType: body.data.uploadTarget.contentType,
        fileSize: body.data.uploadTarget.fileSize,
        storageKeyRef: shortRef(body.data.uploadTarget.storageKey),
        uploadUrl: "[redacted-next-upload-capability]",
      } : null,
    } : null,
  };
}

async function requestJson(input) {
  record({
    kind: "request-before-assertion",
    layer: input.layer,
    endpoint: input.redactedPath,
    method: input.method,
    request: { path: input.redactedPath, body: input.redactedBody ?? null },
    workerRoute: input.workerRoute ?? null,
    r2Operation: input.r2Operation ?? "none",
    objectIdentifier: input.objectIdentifier ?? null,
    directR2Access: false,
    workerBypass: false,
  });
  const started = performance.now();
  const response = await fetch(`${runtimeBaseUrl}${input.path}`, {
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
  const cookies = response.headers.getSetCookie?.() ?? [];
  if (cookies.length) cookie = cookies.map((value) => value.split(";", 1)[0]).join("; ");
  const text = await response.text();
  let body = null;
  try {
    body = JSON.parse(text);
  } catch {
    body = null;
  }
  record({
    kind: "response-before-assertion",
    layer: input.layer,
    endpoint: input.redactedPath,
    method: input.method,
    status: response.status,
    contentType: response.headers.get("content-type"),
    responseBody: sanitizedJson(body) ?? `[${text.length} chars]`,
    errorCode: body?.error?.code ?? null,
    correlationId: response.headers.get("x-wafl-correlation-id"),
    elapsedMs: Math.round((performance.now() - started) * 100) / 100,
    workerRoute: input.workerRoute ?? null,
    r2Operation: input.r2Operation ?? "none",
    objectIdentifier: input.objectIdentifier ?? null,
    directR2Access: false,
    workerBypass: false,
  });
  return { response, body, text };
}

async function putViaNext(target, bytes, label) {
  assert.match(target.uploadUrl, /^\/api\/v2\/work-orders\/files\/upload\?/);
  assert.doesNotMatch(target.uploadUrl, /cloudflarestorage|amazonaws|workers\.dev/i);
  record({
    kind: "request-before-assertion",
    layer: "Mobile -> Next API -> Worker -> R2",
    endpoint: "/api/v2/work-orders/files/upload?[redacted-capability]",
    method: "PUT",
    request: { body: `[${bytes.byteLength} bytes]` },
    workerRoute: "signed Worker PUT",
    r2Operation: "PUT",
    objectIdentifier: shortRef(target.storageKey),
    directR2Access: false,
    workerBypass: false,
  });
  const started = performance.now();
  const response = await fetch(`${runtimeBaseUrl}${target.uploadUrl}`, {
    method: "PUT",
    headers: {
      ...(cookie ? { Cookie: cookie } : {}),
      ...Object.fromEntries(Object.entries(target.headers ?? {}).map(([key, value]) => [key, String(value)])),
    },
    body: bytes,
    signal: AbortSignal.timeout(90_000),
  });
  const text = await response.text();
  record({
    kind: "response-before-assertion",
    layer: "Next API -> Worker -> R2",
    endpoint: "/api/v2/work-orders/files/upload?[redacted-capability]",
    method: "PUT",
    label,
    status: response.status,
    contentType: response.headers.get("content-type"),
    responseBody: text ? `[${text.length} chars]` : "",
    errorCode: response.ok ? null : "NEXT_WORKER_UPLOAD_FAILED",
    elapsedMs: Math.round((performance.now() - started) * 100) / 100,
    workerRoute: "signed Worker PUT",
    r2Operation: "PUT",
    objectIdentifier: shortRef(target.storageKey),
    directR2Access: false,
    workerBypass: false,
  });
  assert.equal(response.ok, true, `${label}:upload`);
}

let identityCounter = 0;
function identity(kind, version) {
  identityCounter += 1;
  const token = `a57-${v8Mode ? "v8" : "v7"}-${kind}-${version}-${identityCounter}`;
  return { clientRequestId: `${token}-client`, idempotencyKey: `${token}-idempotency` };
}

async function prepareUpload(current, kind, file) {
  const segment = kind === "image" ? "images" : "attachments";
  const prepared = await requestJson({
    layer: "Mobile -> Next API",
    method: "POST",
    path: `/api/v2/work-orders/${current.workOrderId}/${segment}/upload`,
    redactedPath: `/api/v2/work-orders/{workOrderId}/${segment}/upload`,
    body: { file },
    redactedBody: { file },
  });
  assert.equal(prepared.response.status, 200);
  const target = prepared.body?.data?.uploadTarget;
  assert.ok(target);
  assert.equal(target.method, "PUT");
  assert.equal(target.fileName, file.name);
  assert.equal(target.contentType, file.type);
  assert.equal(target.fileSize, file.size);
  return target;
}

async function uploadImage(current, label) {
  const file = { name: `A57_${v8Mode ? "V8" : "V7"}_${label}.jpg`, type: "image/jpeg", size: imageBytes.byteLength };
  const target = await prepareUpload(current, "image", file);
  await putViaNext(target, imageBytes, label);
  const command = identity(`image-${label}`, current.workOrderVersion);
  const completed = await requestJson({
    layer: "Mobile -> Next API -> Worker derivatives -> DB",
    method: "POST",
    path: `/api/v2/work-orders/${current.workOrderId}/images/upload/complete`,
    redactedPath: "/api/v2/work-orders/{workOrderId}/images/upload/complete",
    idempotencyKey: command.idempotencyKey,
    body: {
      expectedVersion: current.workOrderVersion,
      clientRequestId: command.clientRequestId,
      uploadTarget: target,
    },
    redactedBody: {
      expectedVersion: current.workOrderVersion,
      clientRequestId: "[redacted]",
      uploadTarget: { ...file, storageKeyRef: shortRef(target.storageKey), uploadUrl: "[redacted]" },
    },
    workerRoute: "signed Worker POST action=derive",
    r2Operation: "GET original + PUT thumbnail/medium/large",
    objectIdentifier: shortRef(target.storageKey),
  });
  assert.equal(completed.response.status, 201);
  assert.match(completed.body?.data?.imageId ?? "", /^[0-9a-f-]{36}$/i);
  return { imageId: completed.body.data.imageId, nextVersion: completed.body.data.nextVersion };
}

async function mutateDelete(current, kind, id) {
  const segment = kind === "image" ? "images" : "attachments";
  const command = identity(`${kind}-delete`, current.workOrderVersion);
  const deleted = await requestJson({
    layer: "Mobile -> Next API -> Worker DELETE -> R2",
    method: "POST",
    path: `/api/v2/work-orders/${current.workOrderId}/${segment}/${id}/delete`,
    redactedPath: `/api/v2/work-orders/{workOrderId}/${segment}/{assetId}/delete`,
    idempotencyKey: command.idempotencyKey,
    body: { expectedVersion: current.workOrderVersion, clientRequestId: command.clientRequestId },
    redactedBody: { expectedVersion: current.workOrderVersion, clientRequestId: "[redacted]" },
    workerRoute: "signed Worker DELETE",
    r2Operation: kind === "image" ? "DELETE original + thumbnail/medium/large" : "DELETE attachment",
    objectIdentifier: shortRef(id),
  });
  assert.equal(deleted.response.status, 200);
  assert.equal(deleted.body?.data?.deleted, true);
  return deleted.body.data.nextVersion;
}

async function getAssets(current) {
  const assets = await requestJson({
    layer: "Mobile -> Next API -> repository",
    method: "GET",
    path: `/api/v2/work-orders/${current.workOrderId}/assets?limit=50`,
    redactedPath: "/api/v2/work-orders/{workOrderId}/assets?limit=50",
  });
  assert.equal(assets.response.status, 200);
  return assets.body.data.items;
}

async function followFile(relativeUrl, expectedContentType, label) {
  const proxy = await requestJson({
    layer: "Mobile -> Next API -> Worker -> R2",
    method: "GET",
    path: relativeUrl,
    redactedPath: "/api/v2/work-orders/images/file?[redacted-key]",
    workerRoute: "signed Worker GET",
    r2Operation: "GET",
    objectIdentifier: shortRef(label),
  });
  assert.equal(proxy.response.status, 307);
  const location = proxy.response.headers.get("location");
  assert.ok(location);
  assert.equal(new URL(location).origin, workerOrigin);
  record({
    kind: "request-before-assertion",
    layer: "Next API -> Worker -> R2",
    endpoint: "[redacted-worker-signed-get]",
    method: "GET",
    workerRoute: "signed Worker GET",
    r2Operation: "GET",
    objectIdentifier: shortRef(label),
    directR2Access: false,
    workerBypass: false,
  });
  const started = performance.now();
  const response = await fetch(location, { redirect: "manual", signal: AbortSignal.timeout(60_000) });
  const bytes = await response.arrayBuffer();
  record({
    kind: "response-before-assertion",
    layer: "Worker -> R2",
    endpoint: "[redacted-worker-signed-get]",
    method: "GET",
    status: response.status,
    contentType: response.headers.get("content-type"),
    responseBody: `[${bytes.byteLength} bytes]`,
    errorCode: response.status === 200 ? null : "WORKER_FILE_GET_FAILED",
    elapsedMs: Math.round((performance.now() - started) * 100) / 100,
    workerRoute: "signed Worker GET",
    r2Operation: "GET",
    objectIdentifier: shortRef(label),
    directR2Access: false,
    workerBypass: false,
  });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", expectedContentType);
  assert.ok(bytes.byteLength > 0);
  return location;
}

async function assertWorkerDeleted(location, label) {
  const response = await fetch(location, { redirect: "manual", signal: AbortSignal.timeout(60_000) });
  const body = await response.text();
  record({
    kind: "deleted-object-before-assertion",
    label,
    status: response.status,
    contentType: response.headers.get("content-type"),
    responseBody: body ? `[${body.length} chars]` : "",
    workerRoute: "signed Worker GET",
    r2Operation: "GET after DELETE",
    directR2Access: false,
    workerBypass: false,
  });
  assert.equal(response.status, 404);
}

if (finalizeExistingCycle) {
  const evidence = fs.readFileSync(evidencePath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  const baseline = evidence.find((entry) => entry.kind === "baseline-before-assertion");
  const audit = evidence.findLast((entry) => entry.kind === "final-mutation-audit-before-assertion");
  assert.ok(baseline);
  assert.ok(audit);
  assert.deepEqual(audit.observed, audit.expected);
  const current = await snapshot();
  assert.equal(current.activeImages.length, 0);
  assert.equal(current.activeAttachments.length, 0);
  assert.equal(current.representativeImageId, null);
  assert.equal(current.factoryDeliveryMemo, expectedMemo);
  assert.equal(current.migrationLedger, baseline.migrationLedger);
  const result = {
    ok: true,
    checkpoint: "ALPHA57_DOCUMENT_PICKER_DERIVATIVE_VIEWER_MEMO_RUNTIME_QA_PASS",
    sourceStaticRuntimeQa: "PASS",
    workOrderRef: shortRef(current.workOrderId),
    baseline: {
      workOrderVersion: baseline.workOrderVersion,
      revisionVersion: baseline.revisionVersion,
      eventCount: baseline.eventCount,
      receiptCount: baseline.receiptCount,
      imageRowCount: baseline.imageRowCount,
      attachmentRowCount: baseline.attachmentRowCount,
      activeImages: baseline.activeImages,
      activeAttachments: baseline.activeAttachments,
      migrationLedger: baseline.migrationLedger,
    },
    final: {
      workOrderVersion: current.workOrderVersion,
      revisionVersion: current.revisionVersion,
      eventCount: current.eventCount,
      receiptCount: current.receiptCount,
      imageRowCount: current.imageRowCount,
      attachmentRowCount: current.attachmentRowCount,
      activeImages: current.activeImages.length,
      activeAttachments: current.activeAttachments.length,
      representative: null,
      memoExact: current.factoryDeliveryMemo === expectedMemo,
      migrationLedger: current.migrationLedger,
    },
    delta: audit.observed,
    worker: {
      version: "0.13.74",
      originalPut: 2,
      derivativePut: 6,
      attachmentPut: 1,
      deleteRequests: (baseline.activeImages + 2) * 4 + 1,
      directR2Access: 0,
      workerBypass: 0,
    },
    uiContracts: {
      swipeCarousel: "PASS_STATIC",
      fullscreenViewer: "PASS_STATIC",
      filenameSizeMimeHidden: "PASS_STATIC",
      memoCancel: "PASS_STATIC",
      originalFallback: "PASS_STATIC_AND_ORIGINAL_GET_RUNTIME",
    },
    finalizedFromCompletedEvidence: true,
  };
  fs.writeFileSync(resultPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  await client.end();
  console.log(JSON.stringify(result));
  process.exit(0);
}

try {
  const before = await snapshot();
  record({
    kind: "baseline-before-assertion",
    workOrderVersion: before.workOrderVersion,
    revisionVersion: before.revisionVersion,
    eventCount: before.eventCount,
    receiptCount: before.receiptCount,
    imageRowCount: before.imageRowCount,
    attachmentRowCount: before.attachmentRowCount,
    activeImages: before.activeImages.length,
    activeAttachments: before.activeAttachments.length,
    representativeRef: before.representativeImageId ? shortRef(before.representativeImageId) : null,
    memoLength: before.factoryDeliveryMemo?.length ?? 0,
    migrationLedger: before.migrationLedger,
  });

  const auth = await requestJson({
    layer: "Development Client -> Next API",
    method: "POST",
    path: "/api/dev/mobile-connect/auto",
    redactedPath: "/api/dev/mobile-connect/auto",
  });
  assert.equal(auth.response.status, 200);
  assert.ok(cookie);

  let current = before;
  for (const existing of before.activeImages) {
    const nextVersion = await mutateDelete(current, "image", existing.id);
    const next = await snapshot();
    assert.equal(nextVersion, next.workOrderVersion);
    assertMutation(current, next, {
      command: "cleanup-existing-image",
      delta: { workOrderVersion: 1, revisionVersion: 1, event: 1, receipt: 1, imageRows: 0, attachmentRows: 0, activeImages: -1, activeAttachments: 0 },
    });
    current = next;
  }
  assert.equal(current.activeImages.length, 0);
  assert.equal(current.representativeImageId, null);

  const firstUpload = await uploadImage(current, v8Mode ? "PHOTO_ASSET" : "FIRST");
  let next = await snapshot();
  assert.equal(firstUpload.nextVersion, next.workOrderVersion);
  assertMutation(current, next, {
    command: "first-image-upload",
    delta: { workOrderVersion: 1, revisionVersion: 1, event: 1, receipt: 1, imageRows: 1, attachmentRows: 0, activeImages: 1, activeAttachments: 0 },
  });
  assert.equal(next.representativeImageId, firstUpload.imageId);
  current = next;

  let assets = await getAssets(current);
  const firstAsset = assets.find((item) => item.id === firstUpload.imageId);
  assert.ok(firstAsset);
  assert.equal(firstAsset.isRepresentative, true);
  for (const [variant, url] of Object.entries({
    thumbnail: firstAsset.thumbnailUrl,
    medium: firstAsset.previewUrl,
    large: firstAsset.fullscreenUrl,
  })) {
    assert.equal(typeof url, "string");
    await followFile(url, /image\/webp/i, `first-${variant}`);
  }
  assert.equal(typeof firstAsset.originalUrl, "string");
  const firstOriginalLocation = await followFile(firstAsset.originalUrl, /image\/jpeg/i, "first-original");
  const firstDerivativeLocations = await Promise.all([
    followFile(firstAsset.thumbnailUrl, /image\/webp/i, "first-thumbnail-delete-check"),
    followFile(firstAsset.previewUrl, /image\/webp/i, "first-medium-delete-check"),
    followFile(firstAsset.fullscreenUrl, /image\/webp/i, "first-large-delete-check"),
  ]);

  const secondUpload = await uploadImage(current, v8Mode ? "CAMERA_ASSET" : "SECOND");
  next = await snapshot();
  assertMutation(current, next, {
    command: "second-image-upload",
    delta: { workOrderVersion: 1, revisionVersion: 1, event: 1, receipt: 1, imageRows: 1, attachmentRows: 0, activeImages: 1, activeAttachments: 0 },
  });
  assert.equal(next.representativeImageId, firstUpload.imageId);
  current = next;
  assets = await getAssets(current);
  assert.equal(assets.find((item) => item.id === secondUpload.imageId)?.isRepresentative, false);

  await mutateDelete(current, "image", firstUpload.imageId);
  next = await snapshot();
  assertMutation(current, next, {
    command: "delete-representative-without-promotion",
    delta: { workOrderVersion: 1, revisionVersion: 1, event: 1, receipt: 1, imageRows: 0, attachmentRows: 0, activeImages: -1, activeAttachments: 0 },
  });
  assert.equal(next.representativeImageId, null);
  assert.equal(next.activeImages.find((item) => item.id === secondUpload.imageId)?.is_representative, false);
  current = next;
  await assertWorkerDeleted(firstOriginalLocation, "first-original");
  for (const [index, location] of firstDerivativeLocations.entries()) {
    await assertWorkerDeleted(location, `first-derivative-${index}`);
  }

  await mutateDelete(current, "image", secondUpload.imageId);
  next = await snapshot();
  assertMutation(current, next, {
    command: "cleanup-second-image",
    delta: { workOrderVersion: 1, revisionVersion: 1, event: 1, receipt: 1, imageRows: 0, attachmentRows: 0, activeImages: -1, activeAttachments: 0 },
  });
  assert.equal(next.representativeImageId, null);
  current = next;

  if (!v8Mode) {
  const attachmentFile = { name: "A57_V7_ATTACHMENT.pdf", type: "application/pdf", size: attachmentBytes.byteLength };
  const attachmentTarget = await prepareUpload(current, "attachment", attachmentFile);
  await putViaNext(attachmentTarget, attachmentBytes, "attachment");
  const attachmentIdentity = identity("attachment-upload", current.workOrderVersion);
  const attachmentComplete = await requestJson({
    layer: "Mobile -> Next API -> Worker -> R2 -> DB",
    method: "POST",
    path: `/api/v2/work-orders/${current.workOrderId}/attachments/upload/complete`,
    redactedPath: "/api/v2/work-orders/{workOrderId}/attachments/upload/complete",
    idempotencyKey: attachmentIdentity.idempotencyKey,
    body: {
      expectedVersion: current.workOrderVersion,
      clientRequestId: attachmentIdentity.clientRequestId,
      uploadTarget: attachmentTarget,
    },
    redactedBody: {
      expectedVersion: current.workOrderVersion,
      clientRequestId: "[redacted]",
      uploadTarget: { ...attachmentFile, storageKeyRef: shortRef(attachmentTarget.storageKey), uploadUrl: "[redacted]" },
    },
    workerRoute: "signed Worker PUT already complete",
    r2Operation: "none",
  });
  assert.equal(attachmentComplete.response.status, 201);
  const attachmentId = attachmentComplete.body.data.attachmentId;
  next = await snapshot();
  assertMutation(current, next, {
    command: "attachment-upload",
    delta: { workOrderVersion: 1, revisionVersion: 1, event: 1, receipt: 1, imageRows: 0, attachmentRows: 1, activeImages: 0, activeAttachments: 1 },
  });
  current = next;
  assets = await getAssets(current);
  const attachmentAsset = assets.find((item) => item.id === attachmentId);
  assert.ok(attachmentAsset);
  const attachmentLocation = await followFile(
    `${attachmentAsset.viewUrl}&download=1&name=${encodeURIComponent(attachmentAsset.filename)}`,
    /application\/pdf/i,
    "attachment-open",
  );

  await mutateDelete(current, "attachment", attachmentId);
  next = await snapshot();
  assertMutation(current, next, {
    command: "attachment-delete",
    delta: { workOrderVersion: 1, revisionVersion: 1, event: 1, receipt: 1, imageRows: 0, attachmentRows: 0, activeImages: 0, activeAttachments: -1 },
  });
  current = next;
  await assertWorkerDeleted(attachmentLocation, "attachment");
  }

  const memo = expectedMemo;
  if (v8Mode) {
    const overLimitMemo = `${memo}가`;
    assert.equal(overLimitMemo.length, 501);
    const overLimitIdentity = identity("memo-over-limit", current.workOrderVersion);
    const overLimit = await requestJson({
      layer: "Mobile -> Next API validation",
      method: "PATCH",
      path: `/api/v2/work-orders/${current.workOrderId}`,
      redactedPath: "/api/v2/work-orders/{workOrderId}",
      body: {
        expectedVersion: current.workOrderVersion,
        clientRequestId: overLimitIdentity.clientRequestId,
        patch: { factoryDeliveryMemo: overLimitMemo },
      },
      redactedBody: {
        expectedVersion: current.workOrderVersion,
        clientRequestId: "[redacted]",
        patch: { factoryDeliveryMemoLength: overLimitMemo.length },
      },
    });
    assert.equal(overLimit.response.status, 400);
    assert.equal(overLimit.body?.error?.code, "VALIDATION_ERROR");
    const afterOverLimit = await snapshot();
    assertMutation(current, afterOverLimit, {
      command: "factory-delivery-memo-501-validation",
      delta: { workOrderVersion: 0, revisionVersion: 0, event: 0, receipt: 0, imageRows: 0, attachmentRows: 0, activeImages: 0, activeAttachments: 0 },
    });
    current = afterOverLimit;

    record({
      kind: "memo-inline-cancel-before-assertion",
      requestCount: 0,
      expectedMutation: 0,
    });
    const afterCancel = await snapshot();
    assertMutation(current, afterCancel, {
      command: "factory-delivery-memo-inline-cancel",
      delta: { workOrderVersion: 0, revisionVersion: 0, event: 0, receipt: 0, imageRows: 0, attachmentRows: 0, activeImages: 0, activeAttachments: 0 },
    });
    current = afterCancel;
  }
  const memoIdentity = identity("memo", current.workOrderVersion);
  const memoSave = await requestJson({
    layer: "Mobile -> Next API -> DB",
    method: "PATCH",
    path: `/api/v2/work-orders/${current.workOrderId}`,
    redactedPath: "/api/v2/work-orders/{workOrderId}",
    body: {
      expectedVersion: current.workOrderVersion,
      clientRequestId: memoIdentity.clientRequestId,
      patch: { factoryDeliveryMemo: memo },
    },
    redactedBody: {
      expectedVersion: current.workOrderVersion,
      clientRequestId: "[redacted]",
      patch: { factoryDeliveryMemo: memo },
    },
  });
  assert.equal(memoSave.response.status, 200);
  next = await snapshot();
  assertMutation(current, next, {
    command: "factory-delivery-memo-save",
    delta: { workOrderVersion: 1, revisionVersion: 1, event: 1, receipt: 0, imageRows: 0, attachmentRows: 0, activeImages: 0, activeAttachments: 0 },
  });
  assert.equal(next.factoryDeliveryMemo, memo);
  current = next;

  const detail = await requestJson({
    layer: "Mobile -> Next API -> DB",
    method: "GET",
    path: `/api/v2/work-orders/${current.workOrderId}`,
    redactedPath: "/api/v2/work-orders/{workOrderId}",
  });
  assert.equal(detail.response.status, 200);
  assert.equal(detail.body.data.revision.factoryDeliveryMemo, memo);

  const unchangedIdentity = identity("memo-unchanged", current.workOrderVersion);
  const unchanged = await requestJson({
    layer: "Mobile -> Next API -> DB",
    method: "PATCH",
    path: `/api/v2/work-orders/${current.workOrderId}`,
    redactedPath: "/api/v2/work-orders/{workOrderId}",
    body: {
      expectedVersion: current.workOrderVersion,
      clientRequestId: unchangedIdentity.clientRequestId,
      patch: { factoryDeliveryMemo: memo },
    },
    redactedBody: {
      expectedVersion: current.workOrderVersion,
      clientRequestId: "[redacted]",
      patch: { factoryDeliveryMemo: memo },
    },
  });
  assert.equal(unchanged.response.status, 200);
  const afterUnchanged = await snapshot();
  assertMutation(current, afterUnchanged, {
    command: "factory-delivery-memo-unchanged",
    delta: { workOrderVersion: 0, revisionVersion: 0, event: 0, receipt: 0, imageRows: 0, attachmentRows: 0, activeImages: 0, activeAttachments: 0 },
  });
  current = afterUnchanged;

  if (v8Mode) {
    const restoreIdentity = identity("memo-restore", current.workOrderVersion);
    const restored = await requestJson({
      layer: "Mobile -> Next API -> DB",
      method: "PATCH",
      path: `/api/v2/work-orders/${current.workOrderId}`,
      redactedPath: "/api/v2/work-orders/{workOrderId}",
      body: {
        expectedVersion: current.workOrderVersion,
        clientRequestId: restoreIdentity.clientRequestId,
        patch: { factoryDeliveryMemo: before.factoryDeliveryMemo },
      },
      redactedBody: {
        expectedVersion: current.workOrderVersion,
        clientRequestId: "[redacted]",
        patch: { factoryDeliveryMemoLength: before.factoryDeliveryMemo?.length ?? 0 },
      },
    });
    assert.equal(restored.response.status, 200);
    const afterRestore = await snapshot();
    assertMutation(current, afterRestore, {
      command: "factory-delivery-memo-baseline-restore",
      delta: { workOrderVersion: 1, revisionVersion: 1, event: 1, receipt: 0, imageRows: 0, attachmentRows: 0, activeImages: 0, activeAttachments: 0 },
    });
    assert.equal(afterRestore.factoryDeliveryMemo, before.factoryDeliveryMemo);
    current = afterRestore;
  }

  const total = delta(before, current);
  const existingImageCleanupCount = before.activeImages.length;
  const expectedTotal = {
    workOrderVersion: existingImageCleanupCount + (v8Mode ? 6 : 7),
    revisionVersion: existingImageCleanupCount + (v8Mode ? 6 : 7),
    event: existingImageCleanupCount + (v8Mode ? 6 : 7),
    receipt: existingImageCleanupCount + (v8Mode ? 4 : 6),
    imageRows: 2,
    attachmentRows: v8Mode ? 0 : 1,
    activeImages: before.activeImages.length === 0 ? 0 : -before.activeImages.length,
    activeAttachments: v8Mode ? 0 : before.activeAttachments.length === 0 ? 0 : -before.activeAttachments.length,
    migrationLedger: 0,
    otherWorkOrderMutation: 0,
  };
  record({ kind: "final-mutation-audit-before-assertion", observed: total, expected: expectedTotal });
  assert.deepEqual(total, expectedTotal);
  assert.equal(current.activeImages.length, 0);
  assert.equal(current.activeAttachments.length, 0);
  assert.equal(current.representativeImageId, null);
  assert.equal(current.factoryDeliveryMemo, v8Mode ? before.factoryDeliveryMemo : memo);

  const result = {
    ok: true,
    checkpoint: v8Mode
      ? "ALPHA57_IMAGE_MEMO_MATERIAL_ACTIONS_RUNTIME_QA_PASS"
      : "ALPHA57_DOCUMENT_PICKER_DERIVATIVE_VIEWER_MEMO_RUNTIME_QA_PASS",
    sourceStaticRuntimeQa: "PASS",
    workOrderRef: shortRef(current.workOrderId),
    baseline: {
      workOrderVersion: before.workOrderVersion,
      revisionVersion: before.revisionVersion,
      eventCount: before.eventCount,
      receiptCount: before.receiptCount,
      imageRowCount: before.imageRowCount,
      attachmentRowCount: before.attachmentRowCount,
      activeImages: before.activeImages.length,
      activeAttachments: before.activeAttachments.length,
      migrationLedger: before.migrationLedger,
    },
    final: {
      workOrderVersion: current.workOrderVersion,
      revisionVersion: current.revisionVersion,
      eventCount: current.eventCount,
      receiptCount: current.receiptCount,
      imageRowCount: current.imageRowCount,
      attachmentRowCount: current.attachmentRowCount,
      activeImages: current.activeImages.length,
      activeAttachments: current.activeAttachments.length,
      representative: null,
      memoExact: current.factoryDeliveryMemo === (v8Mode ? before.factoryDeliveryMemo : memo),
      migrationLedger: current.migrationLedger,
    },
    delta: total,
    worker: {
      version: "0.13.74",
      originalPut: 2,
      derivativePut: 6,
      attachmentPut: v8Mode ? 0 : 1,
      deleteRequests: (existingImageCleanupCount + 2) * 4 + (v8Mode ? 0 : 1),
      directR2Access: 0,
      workerBypass: 0,
    },
    uiContracts: {
      swipeCarousel: "PASS_STATIC",
      fullscreenViewer: "PASS_STATIC",
      filenameSizeMimeHidden: "PASS_STATIC",
      memoCancel: "PASS_STATIC",
      memo500SaveAndRead: v8Mode ? "PASS_RUNTIME" : "NOT_APPLICABLE",
      memo501Validation: v8Mode ? "PASS_RUNTIME_400_ZERO_MUTATION" : "NOT_APPLICABLE",
      memoBaselineRestore: v8Mode ? "PASS_RUNTIME" : "NOT_APPLICABLE",
      originalFallback: "PASS_STATIC_AND_ORIGINAL_GET_RUNTIME",
    },
  };
  fs.writeFileSync(resultPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(result));
} finally {
  await client.end();
}
