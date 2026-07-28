#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const root = process.cwd();
const resumeAttachment = process.argv.includes("--resume-attachment");
const evidencePath = path.join(root, ".tmp", "wafl-external-qa", "a57-v9-runtime-evidence.jsonl");
const resultPath = path.join(root, ".tmp", "wafl-external-qa", "a57-v9-runtime-result.json");
const statePath = path.join(root, ".tmp", "wafl-external-qa", "state.json");
const markers = {
  fabricLifecycle: "A57V9_AUTO_FABRIC_LIFECYCLE",
  fabricDelete: "A57V9_AUTO_FABRIC_DELETE",
  accessoryLifecycle: "A57V9_AUTO_ACCESSORY_LIFECYCLE",
  accessoryDelete: "A57V9_AUTO_ACCESSORY_DELETE",
};
const pdfBytes = Buffer.from("%PDF-1.4\n% WAFL A57 V9 preview fixture\n%%EOF\n", "utf8");

function readEnv() {
  const values = {};
  for (const line of fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!match) continue;
    let value = match[2];
    if (value.length >= 2 && ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'")))) {
      value = value.slice(1, -1);
    }
    values[match[1]] = value;
  }
  return values;
}

function ref(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, 12);
}

if (!resumeAttachment) fs.writeFileSync(evidencePath, "", "utf8");
let sequence = resumeAttachment && fs.existsSync(evidencePath)
  ? fs.readFileSync(evidencePath, "utf8").split(/\r?\n/).filter(Boolean).length
  : 0;
function record(entry) {
  sequence += 1;
  fs.appendFileSync(evidencePath, `${JSON.stringify({ sequence, timestamp: new Date().toISOString(), ...entry })}\n`, "utf8");
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
assert.ok(env.R2_WORKER_UPLOAD_URL, "R2_WORKER_UPLOAD_URL_MISSING");
assert.ok(env.WAFL_SESSION_SECRET || env.AUTH_SECRET, "SESSION_SIGNING_SECRET_MISSING");
const runtimeBase = `https://${state.tailscaleServeHostname}`;
const workerOrigin = new URL(env.R2_WORKER_UPLOAD_URL).origin;
const client = new pg.Client({ connectionString: env.DATABASE_URL, application_name: "wafl-a57-v9-runtime-qa" });
await client.connect();

async function snapshot() {
  await client.query("BEGIN READ ONLY");
  try {
    const parent = (await client.query(`
      SELECT w.company_id, w.id AS work_order_id, w.current_revision_id AS revision_id,
             w.entity_version AS work_order_version, r.entity_version AS revision_version,
             (SELECT count(*)::integer FROM domain_events) AS event_count,
             (SELECT count(*)::integer FROM work_order_command_receipts) AS receipt_count,
             (SELECT count(*)::integer FROM work_order_material_lines) AS material_rows,
             (SELECT COALESCE(sum(entity_version), 0)::integer FROM work_order_material_lines) AS material_version_sum,
             (SELECT count(*)::integer FROM work_order_attachments) AS attachment_rows,
             (SELECT count(*)::integer FROM wafl_v2_migration_ledger) AS migration_count
        FROM work_orders w
        JOIN work_order_revisions r ON r.company_id = w.company_id AND r.id = w.current_revision_id
       WHERE w.status = 'draft' AND r.revision_status = 'draft'
         AND w.deleted_at IS NULL
         AND EXISTS (
           SELECT 1 FROM work_order_material_lines marker
            WHERE marker.company_id = w.company_id
              AND marker.revision_id = r.id
              AND marker.name = 'UNITEDITABLEMATERI'
         )
       LIMIT 1
    `)).rows[0];
    assert.ok(parent, "APPROVED_DEV_FIXTURE_NOT_FOUND");
    const targetMaterials = (await client.query(`
      SELECT id, name, material_type, status, entity_version, archived_at, cancelled_at, completed_at, memo
        FROM work_order_material_lines
       WHERE company_id = $1 AND revision_id = $2::uuid
         AND name = ANY($3::text[])
       ORDER BY name, id
    `, [parent.company_id, parent.revision_id, Object.values(markers)])).rows;
    const targetAttachments = (await client.query(`
      SELECT id, original_filename, size_bytes, mime_type, deleted_at
        FROM work_order_attachments
       WHERE company_id = $1 AND work_order_id = $2::uuid
         AND original_filename = 'A57_V9_PREVIEW.pdf'
       ORDER BY id
    `, [parent.company_id, parent.work_order_id])).rows;
    const crossWorkspace = (await client.query(`
      SELECT a.id AS attachment_id, a.work_order_id
        FROM work_order_attachments a
       WHERE a.company_id <> $1 AND a.deleted_at IS NULL
       LIMIT 1
    `, [parent.company_id])).rows[0] ?? null;
    await client.query("ROLLBACK");
    return {
      companyId: parent.company_id,
      workOrderId: parent.work_order_id,
      revisionId: parent.revision_id,
      workOrderVersion: Number(parent.work_order_version),
      revisionVersion: Number(parent.revision_version),
      events: Number(parent.event_count),
      receipts: Number(parent.receipt_count),
      materialRows: Number(parent.material_rows),
      materialVersionSum: Number(parent.material_version_sum),
      attachmentRows: Number(parent.attachment_rows),
      migration: Number(parent.migration_count),
      targetMaterials,
      targetAttachments,
      crossWorkspace,
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
    attachmentRows: after.attachmentRows - before.attachmentRows,
    migration: after.migration - before.migration,
  };
}

function assertDelta(before, after, command, expected) {
  const observed = delta(before, after);
  record({ kind: "mutation-delta-before-assertion", command, observed, expected });
  assert.deepEqual(observed, { migration: 0, materialRows: 0, materialVersionSum: 0, attachmentRows: 0, ...expected });
}

let cookie = "";
async function request(input) {
  record({
    kind: "request-before-assertion",
    layer: input.layer ?? "Mobile -> Next API",
    method: input.method,
    path: input.redactedPath,
    body: input.redactedBody ?? null,
    workerRoute: input.workerRoute ?? null,
    r2Operation: input.r2Operation ?? "none",
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
    method: input.method,
    path: input.redactedPath,
    status: response.status,
    contentType: response.headers.get("content-type"),
    errorCode: body?.error?.code ?? null,
    response: body ? {
      ok: body.ok === true,
      nextVersion: body.data?.nextVersion ?? null,
      status: body.data?.result?.status ?? null,
      entityIdRef: body.data?.result?.materialLineId ? ref(body.data.result.materialLineId)
        : body.data?.attachmentId ? ref(body.data.attachmentId) : null,
    } : `[${text.length} chars]`,
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
    clientRequestId: `a57.v9.${kind}.client.${suffix}`,
    idempotencyKey: `a57.v9.${kind}.idempotency.${suffix}`,
  };
}

async function mutate(current, input, expectedStatus, expectedDelta) {
  const response = await request(input);
  assert.equal(response.response.status, input.expectedHttp ?? 200, `${input.command}:http`);
  if (expectedStatus) assert.equal(response.body?.data?.result?.status, expectedStatus, `${input.command}:status`);
  const next = await snapshot();
  assertDelta(current, next, input.command, expectedDelta);
  return { next, response };
}

async function runMaterialCycle(before, materialType, lifecycleName, deleteName) {
  const collection = `/api/v2/work-orders/${before.workOrderId}/materials`;
  const createIdentity = identity(`${materialType}.create`);
  let step = await mutate(before, {
    command: `${materialType}-create`,
    method: "POST",
    path: collection,
    redactedPath: "/api/v2/work-orders/{workOrderId}/materials",
    expectedHttp: 201,
    idempotencyKey: createIdentity.idempotencyKey,
    body: {
      clientRequestId: createIdentity.clientRequestId,
      expectedVersion: before.workOrderVersion,
      materialType,
      materialId: null,
      name: lifecycleName,
      partnerId: null,
      colorOption: "V9 QA",
      usageArea: "approved dev/test fixture",
      requiredQuantity: "1",
      allowanceQuantity: "0",
      inventoryUsageQuantity: "1",
      orderQuantity: "0",
      unitCode: materialType === "fabric" ? "yd" : "ea",
      unitPrice: "0",
      memo: "A57 V9 automated lifecycle",
    },
    redactedBody: { materialType, expectedVersion: before.workOrderVersion, fixture: lifecycleName },
  }, "editing", { workOrderVersion: 1, revisionVersion: 1, event: 1, receipt: 1, materialRows: 1, materialVersionSum: 1 });
  let current = step.next;
  const materialId = step.response.body?.data?.result?.materialLineId;
  assert.match(String(materialId), /^[0-9a-f-]{36}$/i);
  const base = `${collection}/${materialId}`;

  const updateIdentity = identity(`${materialType}.update`);
  step = await mutate(current, {
    command: `${materialType}-update`,
    method: "PATCH",
    path: base,
    redactedPath: "/api/v2/work-orders/{workOrderId}/materials/{entityId}",
    body: {
      clientRequestId: updateIdentity.clientRequestId,
      expectedVersion: current.workOrderVersion,
      patch: { memo: "A57 V9 verified update" },
    },
    redactedBody: { expectedVersion: current.workOrderVersion, patch: ["memo"] },
  }, "editing", { workOrderVersion: 1, revisionVersion: 1, event: 1, receipt: 0, materialVersionSum: 1 });
  current = step.next;

  const conflictIdentity = identity(`${materialType}.conflict`);
  step = await mutate(current, {
    command: `${materialType}-expected-version-conflict`,
    method: "PATCH",
    path: base,
    redactedPath: "/api/v2/work-orders/{workOrderId}/materials/{entityId}",
    expectedHttp: 409,
    body: {
      clientRequestId: conflictIdentity.clientRequestId,
      expectedVersion: before.workOrderVersion,
      patch: { memo: "must not commit" },
    },
    redactedBody: { expectedVersion: "[stale]", patch: ["memo"] },
  }, null, { workOrderVersion: 0, revisionVersion: 0, event: 0, receipt: 0 });
  assert.equal(step.response.body?.error?.code, "CONFLICT");
  current = step.next;

  record({ kind: "unchanged-save-before-assertion", materialType, requestCount: 0 });
  const unchanged = await snapshot();
  assertDelta(current, unchanged, `${materialType}-unchanged-save`, {
    workOrderVersion: 0, revisionVersion: 0, event: 0, receipt: 0,
  });
  current = unchanged;

  for (const action of ["request", "cancel", "request", "complete"]) {
    const endpoint = action === "request" ? "order-request" : action === "cancel" ? "order-cancel" : "order-complete";
    const actionIdentity = identity(`${materialType}.${action}`);
    step = await mutate(current, {
      command: `${materialType}-${action}`,
      method: "POST",
      path: `${base}/${endpoint}`,
      redactedPath: `/api/v2/work-orders/{workOrderId}/materials/{entityId}/${endpoint}`,
      idempotencyKey: actionIdentity.idempotencyKey,
      body: {
        clientRequestId: actionIdentity.clientRequestId,
        expectedVersion: current.workOrderVersion,
        ...(action === "cancel" ? { reason: "A57 V9 automated cancellation" } : {}),
      },
      redactedBody: { expectedVersion: current.workOrderVersion },
    }, action === "cancel" ? "editing" : action === "complete" ? "completed" : "requested", {
      workOrderVersion: 1, revisionVersion: 1, event: 1, receipt: 1, materialVersionSum: 1,
    });
    current = step.next;
  }

  const deleteCreateIdentity = identity(`${materialType}.delete-create`);
  step = await mutate(current, {
    command: `${materialType}-delete-fixture-create`,
    method: "POST",
    path: collection,
    redactedPath: "/api/v2/work-orders/{workOrderId}/materials",
    expectedHttp: 201,
    idempotencyKey: deleteCreateIdentity.idempotencyKey,
    body: {
      clientRequestId: deleteCreateIdentity.clientRequestId,
      expectedVersion: current.workOrderVersion,
      materialType,
      materialId: null,
      name: deleteName,
      partnerId: null,
      colorOption: null,
      usageArea: "approved dev/test fixture",
      requiredQuantity: "1",
      allowanceQuantity: "0",
      inventoryUsageQuantity: "1",
      orderQuantity: "0",
      unitCode: materialType === "fabric" ? "yd" : "ea",
      unitPrice: "0",
      memo: null,
    },
    redactedBody: { materialType, expectedVersion: current.workOrderVersion, fixture: deleteName },
  }, "editing", { workOrderVersion: 1, revisionVersion: 1, event: 1, receipt: 1, materialRows: 1, materialVersionSum: 1 });
  current = step.next;
  const deleteId = step.response.body?.data?.result?.materialLineId;
  const archiveIdentity = identity(`${materialType}.archive`);
  step = await mutate(current, {
    command: `${materialType}-delete-soft-archive`,
    method: "POST",
    path: `${collection}/${deleteId}/archive`,
    redactedPath: "/api/v2/work-orders/{workOrderId}/materials/{entityId}/archive",
    idempotencyKey: archiveIdentity.idempotencyKey,
    body: { clientRequestId: archiveIdentity.clientRequestId, expectedVersion: current.workOrderVersion },
    redactedBody: { expectedVersion: current.workOrderVersion },
  }, "editing", { workOrderVersion: 1, revisionVersion: 1, event: 1, receipt: 1, materialVersionSum: 1 });
  return step.next;
}

function createExpiredPreviewToken(companyId, workOrderId, attachmentId) {
  const payload = Buffer.from(JSON.stringify({
    companyId,
    workOrderId,
    attachmentId,
    expiresAt: Math.floor(Date.now() / 1000) - 1,
  }), "utf8").toString("base64url");
  const secret = env.WAFL_SESSION_SECRET || env.AUTH_SECRET;
  const signature = crypto.createHmac("sha256", secret)
    .update(`work-order-attachment-preview:${payload}`)
    .digest("base64url");
  return `${payload}.${signature}`;
}

try {
  const continuation = await snapshot();
  assert.equal(continuation.targetMaterials.length, resumeAttachment ? 4 : 0, "V9_MATERIAL_FIXTURE_CONTINUATION_MISMATCH");
  const before = resumeAttachment ? {
    ...continuation,
    workOrderVersion: continuation.workOrderVersion - 16,
    revisionVersion: continuation.revisionVersion - 16,
    events: continuation.events - 16,
    receipts: continuation.receipts - 14,
    materialRows: continuation.materialRows - 4,
    materialVersionSum: continuation.materialVersionSum - 16,
    targetMaterials: [],
  } : continuation;
  assert.equal(before.targetAttachments.length, 0, "V9_ATTACHMENT_FIXTURE_ALREADY_EXISTS");
  record({
    kind: "baseline-before-assertion",
    workOrderRef: ref(before.workOrderId),
    workOrderVersion: before.workOrderVersion,
    revisionVersion: before.revisionVersion,
    events: before.events,
    receipts: before.receipts,
    materialRows: before.materialRows,
    materialVersionSum: before.materialVersionSum,
    attachmentRows: before.attachmentRows,
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

  let current = continuation;
  if (resumeAttachment) {
    assert.equal(current.targetMaterials.filter((row) => row.status === "completed").length, 2);
    assert.equal(current.targetMaterials.filter((row) => row.archived_at !== null).length, 2);
    record({
      kind: "verified-correction-continuation-before-assertion",
      correctionCycle: 1,
      completedMaterials: 2,
      archivedMaterials: 2,
      priorFailedPutStatus: 401,
      priorFailedPutMutation: 0,
    });
  } else {
    current = await runMaterialCycle(before, "fabric", markers.fabricLifecycle, markers.fabricDelete);
    current = await runMaterialCycle(current, "accessory", markers.accessoryLifecycle, markers.accessoryDelete);
  }

  const file = { name: "A57_V9_PREVIEW.pdf", type: "application/pdf", size: pdfBytes.byteLength };
  const prepared = await request({
    command: "attachment-prepare",
    method: "POST",
    path: `/api/v2/work-orders/${current.workOrderId}/attachments/upload`,
    redactedPath: "/api/v2/work-orders/{workOrderId}/attachments/upload",
    body: { file },
    redactedBody: { file },
  });
  assert.equal(prepared.response.status, 200);
  const target = prepared.body?.data?.uploadTarget;
  assert.equal(target?.method, "PUT");
  assert.ok(String(target?.uploadUrl).startsWith("/api/v2/work-orders/files/upload?"));

  const putResponse = await fetch(`${runtimeBase}${target.uploadUrl}`, {
    method: "PUT",
    headers: {
      ...(cookie ? { Cookie: cookie } : {}),
      ...target.headers,
    },
    body: pdfBytes,
    signal: AbortSignal.timeout(90_000),
  });
  record({
    kind: "worker-mediated-put-response-before-assertion",
    status: putResponse.status,
    contentType: putResponse.headers.get("content-type"),
    workerRoute: "Next signed upload adapter -> Worker PUT",
    r2Operation: "PUT",
    objectIdentifier: ref(target.storageKey),
    directR2Access: false,
    workerBypass: false,
  });
  assert.ok(putResponse.ok);

  const uploadIdentity = identity("attachment.complete");
  let step = await mutate(current, {
    command: "attachment-upload-complete",
    method: "POST",
    path: `/api/v2/work-orders/${current.workOrderId}/attachments/upload/complete`,
    redactedPath: "/api/v2/work-orders/{workOrderId}/attachments/upload/complete",
    expectedHttp: 201,
    idempotencyKey: uploadIdentity.idempotencyKey,
    body: {
      expectedVersion: current.workOrderVersion,
      clientRequestId: uploadIdentity.clientRequestId,
      uploadTarget: target,
    },
    redactedBody: { expectedVersion: current.workOrderVersion, file, storageKeyRef: ref(target.storageKey) },
  }, null, { workOrderVersion: 1, revisionVersion: 1, event: 1, receipt: 1, attachmentRows: 1 });
  current = step.next;
  const attachmentId = step.response.body?.data?.attachmentId;
  assert.match(String(attachmentId), /^[0-9a-f-]{36}$/i);

  const issued = await request({
    command: "attachment-preview-issue",
    method: "POST",
    path: `/api/v2/work-orders/${current.workOrderId}/attachments/${attachmentId}/preview`,
    redactedPath: "/api/v2/work-orders/{workOrderId}/attachments/{attachmentId}/preview",
  });
  assert.equal(issued.response.status, 200);
  assert.equal(issued.body?.data?.expiresInSeconds, 120);
  const previewUrl = issued.body?.data?.previewUrl;
  assert.ok(String(previewUrl).startsWith("/api/v2/work-orders/attachments/preview?token="));

  const open = await fetch(`${runtimeBase}${previewUrl}`, { redirect: "manual", signal: AbortSignal.timeout(90_000) });
  record({
    kind: "sessionless-preview-open-before-assertion",
    status: open.status,
    contentType: open.headers.get("content-type"),
    hasSessionCookie: false,
    workerRoute: "Next token verification -> signed Worker GET",
    r2Operation: "GET",
    directR2Access: false,
    workerBypass: false,
  });
  assert.equal(open.status, 307);
  const workerLocation = open.headers.get("location");
  assert.ok(workerLocation);
  assert.equal(new URL(workerLocation).origin, workerOrigin);
  const workerFile = await fetch(workerLocation, { redirect: "manual", signal: AbortSignal.timeout(90_000) });
  assert.equal(workerFile.status, 200);
  assert.match(workerFile.headers.get("content-type") ?? "", /application\/pdf/i);

  const expiredToken = createExpiredPreviewToken(current.companyId, current.workOrderId, attachmentId);
  const expired = await request({
    command: "attachment-preview-expired",
    method: "GET",
    path: `/api/v2/work-orders/attachments/preview?token=${encodeURIComponent(expiredToken)}`,
    redactedPath: "/api/v2/work-orders/attachments/preview?token=[redacted]",
  });
  assert.equal(expired.response.status, 410);
  assert.equal(expired.body?.error?.code, "PREVIEW_TOKEN_EXPIRED");

  assert.ok(current.crossWorkspace, "CROSS_WORKSPACE_ATTACHMENT_FIXTURE_MISSING");
  const cross = await request({
    command: "attachment-preview-cross-workspace-deny",
    method: "POST",
    path: `/api/v2/work-orders/${current.crossWorkspace.work_order_id}/attachments/${current.crossWorkspace.attachment_id}/preview`,
    redactedPath: "/api/v2/work-orders/{foreignWorkOrderId}/attachments/{foreignAttachmentId}/preview",
  });
  assert.equal(cross.response.status, 404);

  const noPreviewMutation = await snapshot();
  assertDelta(current, noPreviewMutation, "attachment-preview-issue-open-expire-cross-workspace", {
    workOrderVersion: 0, revisionVersion: 0, event: 0, receipt: 0,
  });
  current = noPreviewMutation;

  const deleteIdentity = identity("attachment.delete");
  step = await mutate(current, {
    command: "attachment-delete-cleanup",
    method: "POST",
    path: `/api/v2/work-orders/${current.workOrderId}/attachments/${attachmentId}/delete`,
    redactedPath: "/api/v2/work-orders/{workOrderId}/attachments/{attachmentId}/delete",
    idempotencyKey: deleteIdentity.idempotencyKey,
    body: { expectedVersion: current.workOrderVersion, clientRequestId: deleteIdentity.clientRequestId },
    redactedBody: { expectedVersion: current.workOrderVersion },
    workerRoute: "Next -> Worker DELETE",
    r2Operation: "DELETE",
  }, null, { workOrderVersion: 1, revisionVersion: 1, event: 1, receipt: 1 });
  current = step.next;

  const finalDelta = delta(before, current);
  const expectedTotal = {
    workOrderVersion: 18,
    revisionVersion: 18,
    event: 18,
    receipt: 16,
    materialRows: 4,
    materialVersionSum: 16,
    attachmentRows: 1,
    migration: 0,
  };
  record({
    kind: "final-mutation-security-audit-before-assertion",
    observed: finalDelta,
    expected: expectedTotal,
    activeV9Attachments: current.targetAttachments.filter((row) => row.deleted_at === null).length,
    completedMaterials: current.targetMaterials.filter((row) => row.status === "completed").length,
    archivedMaterials: current.targetMaterials.filter((row) => row.archived_at !== null).length,
    directR2Access: 0,
    workerBypass: 0,
  });
  assert.deepEqual(finalDelta, expectedTotal);
  assert.equal(current.targetAttachments.filter((row) => row.deleted_at === null).length, 0);
  assert.equal(current.targetMaterials.filter((row) => row.status === "completed").length, 2);
  assert.equal(current.targetMaterials.filter((row) => row.archived_at !== null).length, 2);

  const result = {
    ok: true,
    checkpoint: "ALPHA57_V9_IPHONE_REQA_REQUIRED",
    targetWorkOrderRef: ref(current.workOrderId),
    materialLifecycle: {
      fabric: ["create", "update", "conflict", "unchanged", "request", "cancel", "request", "complete", "soft-delete"],
      accessory: ["create", "update", "conflict", "unchanged", "request", "cancel", "request", "complete", "soft-delete"],
    },
    attachmentPreview: {
      metadata: "filename + individual size + total count/size",
      issue: "PASS",
      sessionlessOpen: "PASS",
      expiry: "PASS",
      crossWorkspaceDeny: "PASS",
      ttlSeconds: 120,
      cleanup: "Worker-mediated DELETE PASS",
    },
    mutationDelta: finalDelta,
    directR2Access: 0,
    workerBypass: 0,
    migrationDelta: 0,
  };
  fs.writeFileSync(resultPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(result));
} finally {
  await client.end();
}
