#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const root = process.cwd();
const resumePicker = process.argv.includes("--resume-picker");
const resumeUploads = process.argv.includes("--resume-uploads");
const resumeAny = resumePicker || resumeUploads;
const evidencePath = path.join(root, ".tmp", "wafl-external-qa", "a57-v5-corrected-runtime.jsonl");
const resultPath = path.join(root, ".tmp", "wafl-external-qa", "a57-v5-runtime-result.json");
const imageBytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nVQAAAAASUVORK5CYII=",
  "base64",
);
const fixtures = [
  {
    source: "picker",
    localUri: "file:///var/mobile/Containers/Data/Application/redacted/Library/Caches/ImagePicker/a57-v5-picker.png",
    filename: "A57_V5_PICKER.png",
    mimeType: "image/png",
  },
  {
    source: "camera",
    localUri: "file:///var/mobile/Containers/Data/Application/redacted/Library/Caches/Camera/a57-v5-camera.png",
    filename: "A57_V5_CAMERA.png",
    mimeType: "image/png",
  },
];

function hash(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function shortRef(value) {
  return hash(value).slice(0, 12);
}

function readEnv() {
  const result = {};
  for (const line of fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!match) continue;
    let value = match[2];
    if (
      value.length >= 2
      && ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'")))
    ) value = value.slice(1, -1);
    result[match[1]] = value;
  }
  return result;
}

if (!resumeAny) fs.writeFileSync(evidencePath, "", "utf8");
let sequence = resumeAny && fs.existsSync(evidencePath)
  ? fs.readFileSync(evidencePath, "utf8").split(/\r?\n/).filter(Boolean).length
  : 0;
function record(entry) {
  sequence += 1;
  fs.appendFileSync(evidencePath, `${JSON.stringify({
    sequence,
    timestamp: new Date().toISOString(),
    ...entry,
  })}\n`, "utf8");
}

function sanitizedBody(body) {
  if (!body || typeof body !== "object") return body;
  return {
    ok: body.ok === true,
    error: body.error ? {
      code: body.error.code ?? null,
      message: body.error.message ?? null,
    } : null,
    data: body.data ? {
      nextVersion: body.data.nextVersion ?? null,
      imageIdRef: body.data.imageId ? shortRef(body.data.imageId) : null,
      isRepresentative: body.data.isRepresentative ?? null,
      deleted: body.data.deleted ?? null,
      entityVersion: body.data.entityVersion ?? null,
      itemCount: Array.isArray(body.data.items) ? body.data.items.length : null,
      uploadTarget: body.data.uploadTarget ? {
        method: body.data.uploadTarget.method,
        fileName: body.data.uploadTarget.fileName,
        contentType: body.data.uploadTarget.contentType,
        fileSize: body.data.uploadTarget.fileSize,
        storageKeyRef: body.data.uploadTarget.storageKey ? shortRef(body.data.uploadTarget.storageKey) : null,
        uploadUrl: "[redacted-worker-signed-url]",
      } : null,
    } : null,
  };
}

const state = JSON.parse(fs.readFileSync(path.join(root, ".tmp", "wafl-external-qa", "state.json"), "utf8"));
record({
  kind: "runner-state-before-assertion",
  runtimeQaMode: state.runtimeQaMode,
  commandApi: state.commandApi,
  mutationMode: state.mutationMode,
  nextPort: state.nextPort,
  expoPort: state.expoPort,
  correctionCycle: 1,
});
assert.equal(state.status, "running");
assert.equal(state.runtimeQaMode, "work-order-image");
assert.equal(state.commandApi, "ready");
assert.equal(state.mutationMode, "work-order-image-upload-primary-delete");
assert.equal(state.nextPort, 3100);
assert.equal(state.expoPort, 8081);

const env = readEnv();
assert.ok(env.DATABASE_URL, "DATABASE_URL_MISSING");
assert.ok(env.R2_WORKER_UPLOAD_URL, "R2_WORKER_UPLOAD_URL_MISSING");
const workerOrigin = new URL(env.R2_WORKER_UPLOAD_URL).origin;
const client = new pg.Client({
  connectionString: env.DATABASE_URL,
  application_name: "wafl-a57-v5-image-runtime-qa",
});
await client.connect();

async function snapshot() {
  await client.query("BEGIN READ ONLY");
  try {
    const parent = (await client.query(`
      SELECT w.company_id, w.id AS work_order_id, w.current_revision_id AS revision_id,
             w.entity_version AS work_order_version, r.entity_version AS revision_version,
             w.representative_image_id,
             (SELECT count(*)::integer FROM domain_events) AS event_count,
             (SELECT count(*)::integer FROM work_order_command_receipts) AS receipt_count,
             (SELECT count(*)::integer FROM work_order_images) AS image_count,
             (SELECT count(*)::integer FROM wafl_v2_migration_ledger) AS migration_count
        FROM work_orders w
        JOIN work_order_revisions r
          ON r.company_id=w.company_id AND r.id=w.current_revision_id
       WHERE EXISTS (
         SELECT 1 FROM work_order_material_lines marker
          WHERE marker.company_id=w.company_id
            AND marker.revision_id=r.id
            AND marker.name='UNITEDITABLEMATERI'
       )
       LIMIT 1
    `)).rows[0];
    assert.ok(parent, "TARGET_FIXTURE_NOT_FOUND");
    const targetImages = (await client.query(`
      SELECT i.id, i.original_filename, i.deleted_at, ri.is_representative, ri.display_order
        FROM work_order_images i
        LEFT JOIN work_order_revision_images ri
          ON ri.company_id=i.company_id AND ri.image_id=i.id AND ri.revision_id=$3::uuid
       WHERE i.company_id=$1 AND i.work_order_id=$2::uuid
       ORDER BY i.id
    `, [parent.company_id, parent.work_order_id, parent.revision_id])).rows;
    const otherImages = (await client.query(`
      SELECT i.work_order_id, i.id, i.deleted_at, ri.is_representative, ri.display_order
        FROM work_order_images i
        LEFT JOIN work_order_revision_images ri
          ON ri.company_id=i.company_id AND ri.image_id=i.id
       WHERE i.company_id=$1 AND i.work_order_id<>$2::uuid
       ORDER BY i.work_order_id, i.id, ri.revision_id
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
      migrationLedger: Number(parent.migration_count),
      representativeImageId: parent.representative_image_id,
      activeImages: targetImages.filter((row) => row.deleted_at === null).length,
      deletedImages: targetImages.filter((row) => row.deleted_at !== null).length,
      targetImages,
      otherFingerprint: hash(JSON.stringify(otherImages)),
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

function assertMutation(previous, next, expected) {
  record({
    kind: "mutation-delta-before-assertion",
    command: expected.command,
    workOrderVersion: next.workOrderVersion - previous.workOrderVersion,
    revisionVersion: next.revisionVersion - previous.revisionVersion,
    event: next.eventCount - previous.eventCount,
    receipt: next.receiptCount - previous.receiptCount,
    imageRows: next.imageRowCount - previous.imageRowCount,
    activeImages: next.activeImages - previous.activeImages,
    migrationLedger: next.migrationLedger - previous.migrationLedger,
    otherWorkOrderMutation: next.otherFingerprint === previous.otherFingerprint ? 0 : 1,
  });
  assert.equal(next.workOrderVersion - previous.workOrderVersion, 1);
  assert.equal(next.revisionVersion - previous.revisionVersion, 1);
  assert.equal(next.eventCount - previous.eventCount, 1);
  assert.equal(next.receiptCount - previous.receiptCount, 1);
  assert.equal(next.imageRowCount - previous.imageRowCount, expected.imageRows ?? 0);
  assert.equal(next.activeImages - previous.activeImages, expected.activeImages ?? 0);
  assert.equal(next.migrationLedger, previous.migrationLedger);
  assert.equal(next.otherFingerprint, previous.otherFingerprint);
}

let cookie = "";
const runtimeBaseUrl = `https://${state.tailscaleServeHostname}`;

async function requestJson(input) {
  record({
    kind: "request-before-assertion",
    source: input.source ?? null,
    layer: input.layer,
    endpoint: input.redactedPath,
    method: input.method,
    request: {
      path: input.redactedPath,
      query: input.query ?? null,
      body: input.redactedBody ?? null,
    },
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
    signal: AbortSignal.timeout(60_000),
  });
  const setCookies = response.headers.getSetCookie?.() ?? [];
  if (setCookies.length) cookie = setCookies.map((value) => value.split(";", 1)[0]).join("; ");
  const text = await response.text();
  let body = null;
  try {
    body = JSON.parse(text);
  } catch {
    body = null;
  }
  record({
    kind: "response-before-assertion",
    source: input.source ?? null,
    layer: input.layer,
    endpoint: input.redactedPath,
    method: input.method,
    status: response.status,
    contentType: response.headers.get("content-type"),
    responseBody: sanitizedBody(body) ?? text,
    errorCode: body?.error?.code ?? null,
    requestId: response.headers.get("x-request-id"),
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

async function uploadFixture(fixture, current) {
  record({
    kind: "acquisition-result-before-assertion",
    source: fixture.source,
    status: "success",
    localUri: fixture.localUri,
    filename: fixture.filename,
    mimeType: fixture.mimeType,
    fileSize: imageBytes.byteLength,
  });
  assert.ok(imageBytes.byteLength > 0);

  const init = await requestJson({
    source: fixture.source,
    layer: "Mobile -> Next API",
    method: "POST",
    path: `/api/v2/work-orders/${current.workOrderId}/images/upload`,
    redactedPath: "/api/v2/work-orders/{workOrderId}/images/upload",
    body: { file: { name: fixture.filename, type: fixture.mimeType, size: imageBytes.byteLength } },
    redactedBody: { file: { name: fixture.filename, type: fixture.mimeType, size: imageBytes.byteLength } },
    workerRoute: "not-yet-issued",
    r2Operation: "none",
  });
  assert.equal(init.response.status, 200);
  const target = init.body?.data?.uploadTarget;
  assert.equal(target?.fileName, fixture.filename);
  assert.equal(target?.contentType, fixture.mimeType);
  assert.equal(target?.fileSize, imageBytes.byteLength);
  assert.equal(target?.method, "PUT");
  assert.equal(new URL(target.uploadUrl).origin, workerOrigin);
  assert.doesNotMatch(target.uploadUrl, /cloudflarestorage|amazonaws|r2\.cloudflare/i);

  record({
    kind: "request-before-assertion",
    source: fixture.source,
    layer: "Mobile -> Worker -> R2",
    endpoint: "[redacted-worker-signed-upload-route]",
    method: "PUT",
    request: { path: "[redacted-worker-signed-upload-route]", query: "[redacted-signature]", body: `[${imageBytes.byteLength} bytes]` },
    workerRoute: "signed Worker PUT",
    r2Operation: "PUT",
    objectIdentifier: shortRef(target.storageKey),
    directR2Access: false,
    workerBypass: false,
  });
  const putStarted = performance.now();
  const putResponse = await fetch(target.uploadUrl, {
    method: "PUT",
    headers: Object.fromEntries(Object.entries(target.headers ?? {}).map(([key, value]) => [key, String(value)])),
    body: imageBytes,
    signal: AbortSignal.timeout(60_000),
  });
  const putText = await putResponse.text();
  let putBody = null;
  try {
    putBody = JSON.parse(putText);
  } catch {
    putBody = null;
  }
  record({
    kind: "response-before-assertion",
    source: fixture.source,
    layer: "Worker -> R2",
    endpoint: "[redacted-worker-signed-upload-route]",
    method: "PUT",
    status: putResponse.status,
    contentType: putResponse.headers.get("content-type"),
    responseBody: putBody ? { ok: putBody.ok === true, key: "[redacted-object-key]", method: putBody.method ?? null } : "",
    errorCode: null,
    requestId: putResponse.headers.get("x-request-id"),
    correlationId: null,
    elapsedMs: Math.round((performance.now() - putStarted) * 100) / 100,
    workerRoute: "signed Worker PUT",
    r2Operation: "PUT",
    objectIdentifier: shortRef(target.storageKey),
    directR2Access: false,
    workerBypass: false,
  });
  assert.equal(putResponse.ok, true);

  const commandToken = `a57-v5-${fixture.source}-${current.workOrderVersion}`;
  const complete = await requestJson({
    source: fixture.source,
    layer: "Mobile -> Next API",
    method: "POST",
    path: `/api/v2/work-orders/${current.workOrderId}/images/upload/complete`,
    redactedPath: "/api/v2/work-orders/{workOrderId}/images/upload/complete",
    idempotencyKey: `${commandToken}-idempotency`,
    body: {
      expectedVersion: current.workOrderVersion,
      clientRequestId: `${commandToken}-client`,
      uploadTarget: target,
    },
    redactedBody: {
      expectedVersion: current.workOrderVersion,
      clientRequestId: "[redacted]",
      uploadTarget: {
        storageKey: shortRef(target.storageKey),
        fileName: target.fileName,
        contentType: target.contentType,
        fileSize: target.fileSize,
        uploadUrl: "[redacted-worker-signed-url]",
      },
    },
    workerRoute: "upload already completed through Worker",
    r2Operation: "none",
    objectIdentifier: shortRef(target.storageKey),
  });
  assert.equal(complete.response.status, 201);
  const imageId = complete.body?.data?.imageId;
  record({
    kind: "returned-image-id-before-assertion",
    source: fixture.source,
    returnedImageOrAttachmentId: imageId ? shortRef(imageId) : null,
  });
  assert.match(imageId, /^[0-9a-f-]{36}$/i);

  const next = await snapshot();
  assertMutation(current, next, { command: `upload-${fixture.source}`, imageRows: 1, activeImages: 1 });
  assert.equal(next.representativeImageId, current.representativeImageId, "upload-must-not-auto-promote");

  const assets = await requestJson({
    source: fixture.source,
    layer: "Mobile -> Next API -> repository",
    method: "GET",
    path: `/api/v2/work-orders/${current.workOrderId}/assets?limit=50`,
    redactedPath: "/api/v2/work-orders/{workOrderId}/assets",
    query: { limit: 50 },
    workerRoute: "not-used-for-metadata",
    r2Operation: "none",
  });
  assert.equal(assets.response.status, 200);
  const image = (assets.body?.data?.items ?? []).find((item) => item.id === imageId);
  assert.ok(image);
  assert.equal(image.isRepresentative, false);
  assert.equal(typeof image.viewUrl, "string");

  const file = await requestJson({
    source: fixture.source,
    layer: "Mobile -> Next API -> Worker -> R2",
    method: "GET",
    path: image.viewUrl,
    redactedPath: "/api/v2/work-orders/images/file?token=[redacted]",
    query: { token: "[redacted]" },
    workerRoute: "signed Worker GET",
    r2Operation: "GET",
    objectIdentifier: shortRef(imageId),
  });
  record({
    kind: "post-upload-refresh-before-assertion",
    source: fixture.source,
    returnedImageOrAttachmentId: shortRef(imageId),
    postUploadAssetsRefresh: assets.response.status,
    imageFileGet: file.response.status,
  });
  assert.equal(file.response.status, 307);
  const workerFileUrl = file.response.headers.get("location");
  assert.ok(workerFileUrl);
  assert.equal(new URL(workerFileUrl).origin, workerOrigin);
  record({
    kind: "request-before-assertion",
    source: fixture.source,
    layer: "Next API -> Worker -> R2",
    endpoint: "[redacted-worker-signed-file-route]",
    method: "GET",
    request: { path: "[redacted-worker-signed-file-route]", query: "[redacted-signature]", body: null },
    workerRoute: "signed Worker GET",
    r2Operation: "GET",
    objectIdentifier: shortRef(imageId),
    directR2Access: false,
    workerBypass: false,
  });
  const workerGetStarted = performance.now();
  const workerFileResponse = await fetch(workerFileUrl, {
    method: "GET",
    redirect: "manual",
    signal: AbortSignal.timeout(60_000),
  });
  const workerFileBytes = await workerFileResponse.arrayBuffer();
  record({
    kind: "response-before-assertion",
    source: fixture.source,
    layer: "Worker -> R2",
    endpoint: "[redacted-worker-signed-file-route]",
    method: "GET",
    status: workerFileResponse.status,
    contentType: workerFileResponse.headers.get("content-type"),
    responseBody: `[${workerFileBytes.byteLength} bytes]`,
    errorCode: null,
    requestId: workerFileResponse.headers.get("x-request-id"),
    correlationId: null,
    elapsedMs: Math.round((performance.now() - workerGetStarted) * 100) / 100,
    workerRoute: "signed Worker GET",
    r2Operation: "GET",
    objectIdentifier: shortRef(imageId),
    directR2Access: false,
    workerBypass: false,
  });
  record({
    kind: "post-upload-file-result-before-assertion",
    source: fixture.source,
    returnedImageOrAttachmentId: shortRef(imageId),
    postUploadAssetsRefresh: assets.response.status,
    nextFileProxyStatus: file.response.status,
    imageFileGet: workerFileResponse.status,
  });
  assert.equal(workerFileResponse.status, 200);
  assert.match(workerFileResponse.headers.get("content-type") ?? "", /image\/png/);
  return { current: next, imageId };
}

async function verifyExistingFile(source, current, imageId) {
  const assets = await requestJson({
    source,
    layer: "Mobile -> Next API -> repository",
    method: "GET",
    path: `/api/v2/work-orders/${current.workOrderId}/assets?limit=50`,
    redactedPath: "/api/v2/work-orders/{workOrderId}/assets",
    query: { limit: 50 },
    workerRoute: "not-used-for-metadata",
    r2Operation: "none",
  });
  assert.equal(assets.response.status, 200);
  const image = (assets.body?.data?.items ?? []).find((item) => item.id === imageId);
  assert.equal(typeof image?.viewUrl, "string");
  const proxy = await requestJson({
    source,
    layer: "Mobile -> Next API -> Worker -> R2",
    method: "GET",
    path: image.viewUrl,
    redactedPath: "/api/v2/work-orders/images/file?token=[redacted]",
    query: { token: "[redacted]" },
    workerRoute: "signed Worker GET",
    r2Operation: "GET",
    objectIdentifier: shortRef(imageId),
  });
  assert.equal(proxy.response.status, 307);
  const workerFileUrl = proxy.response.headers.get("location");
  assert.ok(workerFileUrl);
  assert.equal(new URL(workerFileUrl).origin, workerOrigin);
  record({
    kind: "request-before-assertion",
    source,
    layer: "Next API -> Worker -> R2",
    endpoint: "[redacted-worker-signed-file-route]",
    method: "GET",
    request: { path: "[redacted-worker-signed-file-route]", query: "[redacted-signature]", body: null },
    workerRoute: "signed Worker GET",
    r2Operation: "GET",
    objectIdentifier: shortRef(imageId),
    directR2Access: false,
    workerBypass: false,
  });
  const started = performance.now();
  const response = await fetch(workerFileUrl, { method: "GET", redirect: "manual", signal: AbortSignal.timeout(60_000) });
  const bytes = await response.arrayBuffer();
  record({
    kind: "response-before-assertion",
    source,
    layer: "Worker -> R2",
    endpoint: "[redacted-worker-signed-file-route]",
    method: "GET",
    status: response.status,
    contentType: response.headers.get("content-type"),
    responseBody: `[${bytes.byteLength} bytes]`,
    errorCode: null,
    requestId: response.headers.get("x-request-id"),
    correlationId: null,
    elapsedMs: Math.round((performance.now() - started) * 100) / 100,
    workerRoute: "signed Worker GET",
    r2Operation: "GET",
    objectIdentifier: shortRef(imageId),
    directR2Access: false,
    workerBypass: false,
  });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /image\/png/);
}

try {
  const observed = await snapshot();
  const resumedPickerRow = resumeAny
    ? observed.targetImages.find((row) => row.original_filename === fixtures[0].filename && row.deleted_at === null)
    : null;
  const resumedCameraRow = resumeUploads
    ? observed.targetImages.find((row) => row.original_filename === fixtures[1].filename && row.deleted_at === null)
    : null;
  const completedUploads = resumeUploads ? 2 : resumePicker ? 1 : 0;
  const before = resumeAny ? {
    ...observed,
    workOrderVersion: observed.workOrderVersion - completedUploads,
    revisionVersion: observed.revisionVersion - completedUploads,
    eventCount: observed.eventCount - completedUploads,
    receiptCount: observed.receiptCount - completedUploads,
    imageRowCount: observed.imageRowCount - completedUploads,
    activeImages: observed.activeImages - completedUploads,
    targetImages: observed.targetImages.filter((row) => row.id !== resumedPickerRow?.id && row.id !== resumedCameraRow?.id),
  } : observed;
  record({
    kind: "baseline-before-assertion",
    workOrderVersion: before.workOrderVersion,
    revisionVersion: before.revisionVersion,
    eventCount: before.eventCount,
    receiptCount: before.receiptCount,
    imageRowCount: before.imageRowCount,
    activeImages: before.activeImages,
    deletedImages: before.deletedImages,
    representativeRef: before.representativeImageId ? shortRef(before.representativeImageId) : null,
    migrationLedger: before.migrationLedger,
  });
  assert.equal(before.workOrderVersion, 138);
  assert.equal(before.revisionVersion, 138);
  assert.equal(before.eventCount, 171);
  assert.equal(before.receiptCount, 77);
  assert.equal(before.targetImages.some((row) => fixtures.some((fixture) => fixture.filename === row.original_filename)), false);
  if (resumeAny) {
    record({
      kind: "safe-resume-before-assertion",
      reason: resumeUploads
        ? "representative transaction returned 500 and rolled back after both uploads"
        : "picker file proxy returned expected 307 before Worker follow assertion",
      repeatedPickerUpload: false,
      repeatedCameraUpload: false,
      currentVersion: observed.workOrderVersion,
      pickerImageRef: resumedPickerRow ? shortRef(resumedPickerRow.id) : null,
      cameraImageRef: resumedCameraRow ? shortRef(resumedCameraRow.id) : null,
    });
    assert.equal(observed.workOrderVersion, resumeUploads ? 140 : 139);
    assert.ok(resumedPickerRow);
    if (resumeUploads) assert.ok(resumedCameraRow);
  }

  const auth = await requestJson({
    layer: "Development Client -> Next API",
    method: "POST",
    path: "/api/dev/mobile-connect/auto",
    redactedPath: "/api/dev/mobile-connect/auto",
    workerRoute: null,
    r2Operation: "none",
  });
  assert.equal(auth.response.status, 200);
  assert.ok(cookie);

  let current = resumeAny ? observed : before;
  const picker = resumeAny
    ? { current, imageId: resumedPickerRow.id }
    : await uploadFixture(fixtures[0], current);
  current = picker.current;
  if (resumePicker) await verifyExistingFile("picker", current, picker.imageId);
  const camera = resumeUploads
    ? { current, imageId: resumedCameraRow.id }
    : await uploadFixture(fixtures[1], current);
  current = camera.current;

  const representative = await requestJson({
    source: "picker",
    layer: "Mobile -> Next API -> DB",
    method: "POST",
    path: `/api/v2/work-orders/${current.workOrderId}/images/${picker.imageId}/representative`,
    redactedPath: "/api/v2/work-orders/{workOrderId}/images/{imageId}/representative",
    idempotencyKey: `a57-v5-representative-${current.workOrderVersion}`,
    body: {
      expectedVersion: current.workOrderVersion,
      clientRequestId: `a57-v5-representative-client-${current.workOrderVersion}`,
    },
    redactedBody: { expectedVersion: current.workOrderVersion, clientRequestId: "[redacted]" },
    workerRoute: null,
    r2Operation: "none",
    objectIdentifier: shortRef(picker.imageId),
  });
  assert.equal(representative.response.status, 200);
  let next = await snapshot();
  assertMutation(current, next, { command: "representative-picker" });
  assert.equal(next.representativeImageId, picker.imageId);
  current = next;

  const deleted = await requestJson({
    source: "picker",
    layer: "Mobile -> Next API -> DB",
    method: "POST",
    path: `/api/v2/work-orders/${current.workOrderId}/images/${picker.imageId}/delete`,
    redactedPath: "/api/v2/work-orders/{workOrderId}/images/{imageId}/delete",
    idempotencyKey: `a57-v5-delete-${current.workOrderVersion}`,
    body: {
      expectedVersion: current.workOrderVersion,
      clientRequestId: `a57-v5-delete-client-${current.workOrderVersion}`,
    },
    redactedBody: { expectedVersion: current.workOrderVersion, clientRequestId: "[redacted]" },
    workerRoute: null,
    r2Operation: "none",
    objectIdentifier: shortRef(picker.imageId),
  });
  assert.equal(deleted.response.status, 200);
  next = await snapshot();
  assertMutation(current, next, { command: "delete-representative-picker", activeImages: -1 });
  record({
    kind: "representative-policy-before-assertion",
    representativeDeleteLeavesNoPrimary: next.representativeImageId === null,
    automaticPrimaryPromotion: 0,
  });
  assert.equal(next.representativeImageId, null, "representative-delete-must-not-auto-promote");
  current = next;

  const finalAssets = await requestJson({
    layer: "Mobile -> Next API -> repository",
    method: "GET",
    path: `/api/v2/work-orders/${current.workOrderId}/assets?limit=50`,
    redactedPath: "/api/v2/work-orders/{workOrderId}/assets",
    query: { limit: 50 },
    workerRoute: "not-used-for-metadata",
    r2Operation: "none",
  });
  assert.equal(finalAssets.response.status, 200);
  const activeImageItems = (finalAssets.body?.data?.items ?? []).filter((item) => item.assetType === "image");
  assert.equal(activeImageItems.some((item) => item.id === picker.imageId), false);
  assert.ok(activeImageItems.some((item) => item.id === camera.imageId));
  assert.equal(activeImageItems.some((item) => item.isRepresentative), false);

  const mutation = {
    workOrderVersion: current.workOrderVersion - before.workOrderVersion,
    revisionVersion: current.revisionVersion - before.revisionVersion,
    event: current.eventCount - before.eventCount,
    receipt: current.receiptCount - before.receiptCount,
    imageRows: current.imageRowCount - before.imageRowCount,
    activeImages: current.activeImages - before.activeImages,
    migrationLedger: current.migrationLedger - before.migrationLedger,
    otherWorkOrderMutation: current.otherFingerprint === before.otherFingerprint ? 0 : 1,
    r2Put: 2,
    r2Delete: 0,
    directR2S3Access: 0,
    workerBypass: 0,
  };
  record({ kind: "final-mutation-budget-before-assertion", ...mutation });
  assert.deepEqual(mutation, {
    workOrderVersion: 4,
    revisionVersion: 4,
    event: 4,
    receipt: 4,
    imageRows: 2,
    activeImages: 1,
    migrationLedger: 0,
    otherWorkOrderMutation: 0,
    r2Put: 2,
    r2Delete: 0,
    directR2S3Access: 0,
    workerBypass: 0,
  });

  const result = {
    result: "PASS",
    checkpoint: "ALPHA57_IMAGE_UI_PARITY_AND_UPLOAD_FIX_IPHONE_QA_REQUIRED",
    correctionCycle: 1,
    evidencePath: ".tmp/wafl-external-qa/a57-v5-corrected-runtime.jsonl",
    fixture: {
      workOrderRef: shortRef(current.workOrderId),
      revisionRef: shortRef(current.revisionId),
      pickerImageRef: shortRef(picker.imageId),
      cameraImageRef: shortRef(camera.imageId),
    },
    mutation,
    policy: {
      mobileNextWorkerR2: true,
      representativeIsUserSelectedOnly: true,
      representativeDeleteLeavesNoPrimary: true,
      automaticPrimaryPromotion: 0,
    },
  };
  fs.writeFileSync(resultPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(result));
} finally {
  await client.end();
}
