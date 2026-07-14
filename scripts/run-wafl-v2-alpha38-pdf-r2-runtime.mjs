#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import pg from "pg";

import { createR2WorkerSignedUrl, normalizeWorkerBaseUrl } from "../lib/storage/r2/r2WorkerSignature.mjs";
import { LocalChromiumIssuedWorkOrderPdfRenderer } from "../lib/generated-documents/work-order-pdf/localChromiumRenderer.mts";
import {
  createWorkOrderIssuedPdfSnapshot,
  hashWorkOrderIssuedPdfSnapshot,
  serializeWorkOrderIssuedPdfSnapshot,
  selectRepresentativeAsset,
} from "../lib/generated-documents/work-order-pdf/snapshot.ts";
import { createWorkOrderPdfStorageKey } from "../lib/workorder/pdf/workOrderPdfPolicy.ts";

const { Client } = pg;
const MODE = process.argv[2] ?? "preflight";
const REQUIRED_FINGERPRINT = "01e5dcc7fea3";
const COMPANY_A = "wafl-fn-company-a";
const CROSS_TENANTS = ["wafl-fn-company-b", "wafl-fn-company-c", "wafl-fn-company-h"];
const COMMAND_CODE = "work_order.document.generate";
const DOCUMENT_TYPE = "factory_instruction";
const ITEM_CODE = "A30FACT";
const IDEMPOTENCY_KEY = "alpha38-a30fact-factory-instruction-v1";
const CORRELATION_ID = "alpha38-a30fact-generated-document-v1";
const RUNTIME_APPROVAL = "2.0.0-alpha.38-approved-bounded-db-r2-runtime";
const CONTINUATION_APPROVAL = "2.0.0-alpha.38-approved-pending-continuation";
const CONTINUATION_GENERATED_DOCUMENT_ID = "f9c2141d-19e2-4a37-ba4b-33588cd3cd74";
const CONTINUATION_WORK_ORDER_ID = "358099b0-538f-49b0-aa6c-2c8f223cc2cf";
const CONTINUATION_OBJECT_KEY = "companies/wafl-fn-company-a/workorders/358099b0-538f-49b0-aa6c-2c8f223cc2cf/pdf/f9c2141d-19e2-4a37-ba4b-33588cd3cd74.pdf";
const PREVIEW_READ_APPROVAL = "1";
const CONFIRMATION = MODE === "runtime"
  ? "EXECUTE WAFL V2 ALPHA38 PDF DB R2 RUNTIME"
  : MODE === "continuation"
    ? "EXECUTE WAFL V2 ALPHA38 PENDING DOCUMENT CONTINUATION"
    : MODE.startsWith("continuation-")
      ? "VERIFY WAFL V2 ALPHA38 PENDING DOCUMENT CONTINUATION"
      : "VERIFY WAFL V2 ALPHA38 PDF DB R2 PREFLIGHT";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_RUNTIME = new Set(["development", "test"]);

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const safeRef = (value) => sha256(String(value)).slice(0, 12);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const requestSha = sha256(JSON.stringify({ itemCode: ITEM_CODE, documentType: DOCUMENT_TYPE, commandCode: COMMAND_CODE }));

function databaseFingerprint(databaseUrl) {
  const parsed = new URL(databaseUrl);
  return sha256(`${parsed.hostname}/${decodeURIComponent(parsed.pathname.replace(/^\/+/, ""))}`).slice(0, 12);
}

function r2Fingerprints(workerUrl, runtime) {
  const normalized = normalizeWorkerBaseUrl(workerUrl);
  const parsed = new URL(normalized);
  const host = parsed.hostname.toLowerCase();
  const normalizedUrl = `${parsed.protocol}//${host}${parsed.pathname.replace(/\/+$/, "")}`;
  const alias = process.env.WAFL_PDF_R2_ENV_ALIAS?.trim() || "dev-test";
  return {
    normalized,
    host: sha256(host).slice(0, 12),
    url: sha256(normalizedUrl).slice(0, 12),
    environment: sha256(`${normalizedUrl}|${runtime}|${alias}`).slice(0, 12),
  };
}

function guard() {
  assert.ok(new Set(["preflight", "runtime", "audit", "continuation-preflight", "continuation", "continuation-audit"]).has(MODE), "unsupported-mode");
  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, "database-url-missing");
  const runtime = process.env.WAFL_V2_RUNTIME ?? "";
  assert.ok(ALLOWED_RUNTIME.has(runtime), "dev-test-runtime-required");
  assert.equal(process.env.WAFL_V2_TEST_PREFIX, "wafl-fn", "test-prefix-mismatch");
  assert.equal(databaseFingerprint(databaseUrl), REQUIRED_FINGERPRINT, "target-fingerprint-mismatch");
  assert.equal(process.env.WAFL_V2_APPROVED_DB_FINGERPRINT, REQUIRED_FINGERPRINT, "approved-db-fingerprint-mismatch");
  assert.equal(process.env.WAFL_V2_CONFIRMATION, CONFIRMATION, "confirmation-mismatch");
  if (MODE === "runtime") {
    assert.equal(process.env.WAFL_V2_ALPHA38_RUNTIME_APPROVED, RUNTIME_APPROVAL, "runtime-approval-missing");
  } else if (MODE === "continuation") {
    assert.equal(process.env.WAFL_V2_ALPHA38_RUNTIME_APPROVED, CONTINUATION_APPROVAL, "continuation-approval-missing");
  } else {
    assert.ok(!process.env.WAFL_V2_ALPHA38_RUNTIME_APPROVED, "read-only-mode-mutation-approval-forbidden");
  }
  const workerUrl = process.env.R2_WORKER_UPLOAD_URL?.trim();
  const workerSecret = process.env.R2_WORKER_UPLOAD_SECRET?.trim();
  assert.ok(workerUrl && workerSecret, "r2-worker-config-missing");
  const r2Runtime = process.env.NEXT_PUBLIC_APP_RUNTIME_MODE?.trim()
    || process.env.WAFL_SERVER_RUNTIME_MODE?.trim()
    || process.env.NODE_ENV?.trim()
    || "unknown";
  const current = r2Fingerprints(workerUrl, r2Runtime);
  const approved = {
    environment: process.env.WAFL_PDF_R2_APPROVED_ENVIRONMENT_FINGERPRINT?.trim()
      || process.env.WAFL_SIGNUP_CERTIFICATE_R2_APPROVED_ENVIRONMENT_FINGERPRINT?.trim(),
    url: process.env.WAFL_PDF_R2_APPROVED_WORKER_URL_FINGERPRINT?.trim()
      || process.env.WAFL_SIGNUP_CERTIFICATE_R2_APPROVED_WORKER_URL_FINGERPRINT?.trim(),
    host: process.env.WAFL_PDF_R2_APPROVED_WORKER_HOST_FINGERPRINT?.trim()
      || process.env.WAFL_SIGNUP_CERTIFICATE_R2_APPROVED_WORKER_HOST_FINGERPRINT?.trim(),
  };
  assert.ok(approved.environment && approved.url && approved.host, "approved-r2-fingerprints-missing");
  assert.equal(current.environment, approved.environment, "r2-environment-fingerprint-mismatch");
  assert.equal(current.url, approved.url, "r2-url-fingerprint-mismatch");
  assert.equal(current.host, approved.host, "r2-host-fingerprint-mismatch");
  return { databaseUrl, runtime, workerUrl: current.normalized, workerSecret, r2: current };
}

async function tenantClaims(client, actor, correlationId) {
  await client.query("SELECT set_config('wafl.company_id',$1,true),set_config('wafl.company_member_id',$2,true),set_config('wafl.access_mode','tenant_member',true),set_config('wafl.correlation_id',$3,true)", [COMPANY_A, actor.companyMemberId, correlationId]);
}

async function readOnly(client, operation) {
  await client.query("BEGIN READ ONLY");
  try {
    const result = await operation();
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function loadActorAndTarget(client) {
  return readOnly(client, async () => {
    const actor = (await client.query(`
      SELECT id, user_id
      FROM public.company_members
      WHERE company_id=$1 AND status='approved' AND user_id IS NOT NULL
      ORDER BY created_at, id
      LIMIT 1
    `, [COMPANY_A])).rows[0];
    assert.ok(actor, "company-a-approved-actor-missing");
    const target = (await client.query(`
      SELECT w.id AS work_order_id, w.current_revision_id AS revision_id,
             w.status, w.document_number_base, w.entity_version AS work_order_version,
             r.revision_status, r.revision_no, r.entity_version AS revision_version,
             r.finalized_at
      FROM public.work_orders w
      JOIN public.work_order_revisions r
        ON r.company_id=w.company_id AND r.id=w.current_revision_id
      WHERE w.company_id=$1 AND w.item_code=$2 AND w.deleted_at IS NULL
        AND w.status IN ('issued','revised','completed')
        AND r.revision_status IN ('finalized','superseded')
        AND w.document_number_base IS NOT NULL
      ORDER BY w.updated_at DESC, w.id DESC
      LIMIT 1
    `, [COMPANY_A, ITEM_CODE])).rows[0];
    assert.ok(target, "actual-issued-a30fact-target-missing");
    return {
      actor: { companyId: COMPANY_A, companyMemberId: String(actor.id), userId: String(actor.user_id) },
      target: {
        ...target,
        work_order_id: String(target.work_order_id),
        revision_id: String(target.revision_id),
      },
    };
  });
}

async function loadAssetManifest(client, actor, revisionId) {
  await client.query("BEGIN READ ONLY; SET LOCAL ROLE wafl_v2_tenant_runtime");
  try {
    await tenantClaims(client, actor, `${CORRELATION_ID}-assets`);
    const rows = (await client.query(`
      SELECT 'image' AS asset_type, ri.image_id AS revision_asset_id,
             ri.company_id, ri.filename_snapshot, ri.mime_type_snapshot,
             ri.storage_object_key_snapshot, ri.display_order,
             ri.is_representative, true AS include_in_document,
             i.size_bytes AS source_size_bytes, i.content_sha256 AS source_content_sha256
      FROM public.work_order_revision_images ri
      JOIN public.work_order_images i ON i.company_id=ri.company_id AND i.id=ri.image_id
      WHERE ri.company_id=$1 AND ri.revision_id=$2::uuid
      UNION ALL
      SELECT 'attachment', ra.attachment_id, ra.company_id,
             ra.filename_snapshot, ra.mime_type_snapshot,
             ra.storage_object_key_snapshot, ra.display_order,
             false, ra.output_include, a.size_bytes, a.content_sha256
      FROM public.work_order_revision_attachments ra
      JOIN public.work_order_attachments a ON a.company_id=ra.company_id AND a.id=ra.attachment_id
      WHERE ra.company_id=$1 AND ra.revision_id=$2::uuid
      ORDER BY display_order, asset_type, revision_asset_id
    `, [COMPANY_A, revisionId])).rows;
    await client.query("COMMIT");
    return rows.map((row) => ({
      assetType: row.asset_type,
      revisionAssetId: String(row.revision_asset_id),
      companyId: String(row.company_id),
      filename: String(row.filename_snapshot),
      mimeType: String(row.mime_type_snapshot),
      storageObjectKeySnapshot: row.storage_object_key_snapshot ? String(row.storage_object_key_snapshot) : null,
      displayOrder: Number(row.display_order),
      isRepresentative: Boolean(row.is_representative),
      includeInDocument: Boolean(row.include_in_document),
      sourceSizeBytes: Number(row.source_size_bytes),
      sourceContentSha256: row.source_content_sha256 ? String(row.source_content_sha256) : null,
    }));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

function sessionCookie(actor) {
  const secret = process.env.WAFL_SESSION_SECRET?.trim() || process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  assert.ok(secret, "session-secret-missing");
  const payload = Buffer.from(JSON.stringify({
    ...actor,
    companyName: "WAFL synthetic runtime",
    role: "company_admin",
    email: "alpha38-reader@example.invalid",
    name: "alpha38 reader",
    issuedAt: new Date().toISOString(),
  }), "utf8").toString("base64url");
  return `wafl_auth_session=${payload}.${crypto.createHmac("sha256", secret).update(payload).digest("base64url")}`;
}

async function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") return reject(new Error("port-unavailable"));
      server.close(() => resolve(address.port));
    });
  });
}

async function startServer(actor) {
  const port = await freePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", String(port)], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      WAFL_V2_READ_API_ENABLED: "1",
      WAFL_V2_READ_APPROVED: PREVIEW_READ_APPROVAL,
      WAFL_V2_RUNTIME: "test",
      WAFL_V2_TEST_PREFIX: "wafl-fn",
      WAFL_V2_APPROVED_DB_FINGERPRINT: REQUIRED_FINGERPRINT,
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  let stderr = "";
  child.stderr.on("data", (chunk) => { stderr = `${stderr}${String(chunk)}`.slice(-8000); });
  for (let attempt = 0; attempt < 240; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`server-exited:${child.exitCode}`);
    try {
      const response = await fetch(`${baseUrl}/api/v2/work-orders?limit=1`);
      if (response.status === 401) return { actor, baseUrl, child, stderr: () => stderr };
    } catch {}
    await sleep(250);
  }
  child.kill();
  throw new Error("server-timeout");
}

async function stopServer(server) {
  if (!server || server.child.exitCode !== null) return;
  server.child.kill();
  await Promise.race([new Promise((resolve) => server.child.once("exit", resolve)), sleep(3000)]);
}

async function loadActualPreview(server, target) {
  const response = await fetch(`${server.baseUrl}/api/v2/work-orders/${target.work_order_id}/revisions/${target.revision_id}/preview`, {
    method: "GET",
    headers: { Cookie: sessionCookie(server.actor) },
  });
  const body = await response.json();
  assert.equal(response.status, 200, `preview-http-${response.status}`);
  assert.equal(body?.ok, true, "preview-not-ok");
  assert.equal(body.data?.header?.workOrderId, target.work_order_id);
  assert.equal(body.data?.header?.revisionId, target.revision_id);
  assert.equal(body.data?.issue?.revisionStatus, target.revision_status);
  return body.data;
}

function signedUrl(config, method, key, contentType = "application/octet-stream") {
  return createR2WorkerSignedUrl({
    uploadUrl: config.workerUrl,
    secret: config.workerSecret,
    method,
    key,
    contentType,
    expiresAt: Math.floor(Date.now() / 1000) + 300,
  });
}

async function workerRequest(config, method, key, body, contentType = "application/octet-stream") {
  const response = await fetch(signedUrl(config, method, key, contentType), {
    method,
    headers: method === "PUT" ? { "Content-Type": contentType, "Content-Length": String(body?.byteLength ?? 0) } : undefined,
    body,
  });
  if (!response.ok) {
    await response.text().catch(() => "");
    const error = new Error(`R2_WORKER_${method}_FAILED_${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response;
}

async function resolveRepresentativeImage(config, manifest) {
  const descriptor = selectRepresentativeAsset(manifest);
  if (!descriptor) return null;
  assert.ok(descriptor.storageObjectKeySnapshot, "representative-asset-key-missing");
  assert.match(descriptor.mimeType, /^image\/(?:png|jpeg|webp)$/i, "representative-asset-mime-unsupported");
  const response = await workerRequest(config, "GET", descriptor.storageObjectKeySnapshot);
  const contentType = response.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  assert.equal(contentType, descriptor.mimeType.toLowerCase(), "representative-asset-content-type-mismatch");
  const body = Buffer.from(await response.arrayBuffer());
  assert.equal(body.byteLength, descriptor.sourceSizeBytes, "representative-asset-size-mismatch");
  if (descriptor.sourceContentSha256) assert.equal(sha256(body), descriptor.sourceContentSha256, "representative-asset-hash-mismatch");
  return `data:${descriptor.mimeType};base64,${body.toString("base64")}`;
}

async function prepareGeneration(client, input) {
  await client.query("BEGIN; SET LOCAL ROLE wafl_v2_tenant_runtime");
  try {
    await tenantClaims(client, input.actor, CORRELATION_ID);
    let receipt = (await client.query(`
      SELECT request_sha256, result_generated_document_id
      FROM public.work_order_command_receipts
      WHERE company_id=$1 AND command_code=$2 AND idempotency_key=$3
      FOR UPDATE
    `, [COMPANY_A, COMMAND_CODE, IDEMPOTENCY_KEY])).rows[0];
    if (receipt) {
      assert.equal(receipt.request_sha256, requestSha, "IDEMPOTENCY_CONFLICT");
      assert.ok(receipt.result_generated_document_id, "IDEMPOTENCY_RECEIPT_INCOMPLETE");
      const document = (await client.query(`
        SELECT id, company_id, work_order_id, work_order_revision_id, document_type,
               generation_no, display_document_number, status, storage_object_key,
               file_size_bytes, content_sha256, renderer_version, dto_schema_version
        FROM public.generated_documents
        WHERE company_id=$1 AND id=$2::uuid
      `, [COMPANY_A, receipt.result_generated_document_id])).rows[0];
      assert.ok(document, "IDEMPOTENCY_DOCUMENT_MISSING");
      await client.query("COMMIT");
      return { replay: true, document };
    }
    await client.query(`
      INSERT INTO public.work_order_command_receipts (
        company_id, command_code, idempotency_key, request_sha256, correlation_id
      ) VALUES ($1,$2,$3,$4,$5)
      ON CONFLICT (company_id,command_code,idempotency_key) DO NOTHING
    `, [COMPANY_A, COMMAND_CODE, IDEMPOTENCY_KEY, requestSha, CORRELATION_ID]);
    receipt = (await client.query(`
      SELECT request_sha256, result_generated_document_id
      FROM public.work_order_command_receipts
      WHERE company_id=$1 AND command_code=$2 AND idempotency_key=$3
      FOR UPDATE
    `, [COMPANY_A, COMMAND_CODE, IDEMPOTENCY_KEY])).rows[0];
    assert.ok(receipt, "receipt-reservation-failed");
    assert.equal(receipt.request_sha256, requestSha, "IDEMPOTENCY_CONFLICT");
    assert.equal(receipt.result_generated_document_id, null, "unexpected-existing-result-link");
    const source = (await client.query(`
      SELECT w.id AS work_order_id, r.id AS revision_id, w.document_number_base,
             w.status, r.revision_status, r.revision_no
      FROM public.work_orders w
      JOIN public.work_order_revisions r ON r.company_id=w.company_id AND r.id=w.current_revision_id
      WHERE w.company_id=$1 AND w.id=$2::uuid AND r.id=$3::uuid AND w.deleted_at IS NULL
        AND w.status IN ('issued','revised','completed')
        AND r.revision_status IN ('finalized','superseded')
      FOR SHARE OF w, r
    `, [COMPANY_A, input.target.work_order_id, input.target.revision_id])).rows[0];
    assert.ok(source, "PDF_REVISION_NOT_FINALIZED");
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1 || ':' || $2::text || ':' || $3,0))", [COMPANY_A, input.target.revision_id, DOCUMENT_TYPE]);
    const generationNo = Number((await client.query(`
      SELECT COALESCE(MAX(generation_no),0)+1 AS generation_no
      FROM public.generated_documents
      WHERE company_id=$1 AND work_order_revision_id=$2::uuid AND document_type=$3
    `, [COMPANY_A, input.target.revision_id, DOCUMENT_TYPE])).rows[0].generation_no);
    const document = (await client.query(`
      INSERT INTO public.generated_documents (
        company_id, work_order_id, work_order_revision_id, document_type,
        generation_no, display_document_number, status, renderer_version,
        dto_schema_version, snapshot
      ) VALUES ($1,$2::uuid,$3::uuid,$4,$5,$6,'pending',$7,$8,$9::jsonb)
      RETURNING id, company_id, work_order_id, work_order_revision_id, document_type,
                generation_no, display_document_number, status, renderer_version, dto_schema_version
    `, [COMPANY_A, input.target.work_order_id, input.target.revision_id, DOCUMENT_TYPE,
      generationNo, input.preview.document.displayDocumentNumber,
      input.snapshot.rendererVersion, input.snapshot.dtoSchemaVersion, input.canonicalSnapshotJson])).rows[0];
    assert.ok(UUID_PATTERN.test(String(document.id)), "db-generated-document-uuid-invalid");
    const linked = await client.query(`
      UPDATE public.work_order_command_receipts
      SET work_order_id=$4::uuid, result_revision_id=$5::uuid,
          result_generated_document_id=$6::uuid, result_entity_version=$7
      WHERE company_id=$1 AND command_code=$2 AND idempotency_key=$3
    `, [COMPANY_A, COMMAND_CODE, IDEMPOTENCY_KEY, input.target.work_order_id,
      input.target.revision_id, document.id, generationNo]);
    assert.equal(linked.rowCount, 1, "receipt-link-row-count-invalid");
    await client.query("COMMIT");
    return { replay: false, document };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function finalizeGeneration(client, input) {
  await client.query("BEGIN; SET LOCAL ROLE wafl_v2_tenant_runtime");
  try {
    await tenantClaims(client, input.actor, `${CORRELATION_ID}-finalize`);
    const locked = (await client.query(`
      SELECT id, status, work_order_revision_id, snapshot
      FROM public.generated_documents
      WHERE company_id=$1 AND id=$2::uuid AND work_order_revision_id=$3::uuid
      FOR UPDATE
    `, [COMPANY_A, input.generatedDocumentId, input.target.revision_id])).rows[0];
    assert.ok(locked, "generated-document-not-found");
    assert.equal(locked.status, "pending", "generated-document-not-pending");
    assert.equal(hashWorkOrderIssuedPdfSnapshot(locked.snapshot), input.snapshotSha256, "stored-snapshot-hash-mismatch");
    const updated = await client.query(`
      UPDATE public.generated_documents
      SET status='generated', storage_object_key=$4, file_size_bytes=$5,
          content_sha256=$6, generated_at=$7::timestamptz, updated_at=$7::timestamptz
      WHERE company_id=$1 AND id=$2::uuid AND work_order_revision_id=$3::uuid AND status='pending'
    `, [COMPANY_A, input.generatedDocumentId, input.target.revision_id, input.objectKey,
      input.pdf.fileSizeBytes, input.pdf.contentSha256, input.generatedAt]);
    assert.equal(updated.rowCount, 1, "generated-document-finalize-row-count-invalid");
    const event = await client.query(`
      INSERT INTO public.domain_events (
        company_id, entity_type, entity_id, command_code, actor_member_id,
        correlation_id, change_summary, metadata, schema_version
      ) VALUES ($1,'generated_document',$2,$3,$4,$5,$6,$7::jsonb,1)
    `, [COMPANY_A, input.generatedDocumentId, COMMAND_CODE, input.actor.companyMemberId,
      `${CORRELATION_ID}-finalize`, "Generated immutable factory instruction PDF",
      JSON.stringify({
        workOrderId: input.target.work_order_id,
        revisionId: input.target.revision_id,
        documentType: DOCUMENT_TYPE,
        generationNo: Number(input.generationNo),
        displayDocumentNumber: input.preview.document.displayDocumentNumber,
        rendererVersion: input.snapshot.rendererVersion,
        dtoSchemaVersion: input.snapshot.dtoSchemaVersion,
        fileSizeBytes: input.pdf.fileSizeBytes,
        contentSha256: input.pdf.contentSha256,
      })]);
    assert.equal(event.rowCount, 1, "generated-document-event-row-count-invalid");
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function snapshotCounts(client, target = null) {
  return readOnly(client, async () => {
    const counts = (await client.query(`
      SELECT
        (SELECT count(*)::integer FROM public.wafl_v2_migration_ledger) AS ledger,
        (SELECT count(*)::integer FROM public.work_orders) AS work_orders,
        (SELECT count(*)::integer FROM public.work_order_revisions) AS revisions,
        (SELECT count(*)::integer FROM public.work_order_command_receipts) AS receipts,
        (SELECT count(*)::integer FROM public.generated_documents) AS documents,
        (SELECT count(*)::integer FROM public.domain_events) AS events
    `)).rows[0];
    let scoped = null;
    if (target) {
      scoped = (await client.query(`
        SELECT
          (SELECT count(*)::integer FROM public.work_order_command_receipts WHERE company_id=$1 AND command_code=$2 AND idempotency_key=$3) AS receipt_count,
          (SELECT count(*)::integer FROM public.work_order_command_receipts WHERE company_id=$1 AND command_code=$2 AND idempotency_key=$3 AND result_generated_document_id IS NULL) AS incomplete_receipts,
          (SELECT count(*)::integer FROM public.generated_documents WHERE company_id=$1 AND work_order_revision_id=$4::uuid AND document_type=$5) AS document_count,
          (SELECT count(*)::integer FROM public.generated_documents WHERE company_id=$1 AND work_order_revision_id=$4::uuid AND document_type=$5 AND status='generated') AS generated_count,
          (SELECT count(*)::integer FROM public.generated_documents WHERE company_id=$1 AND work_order_revision_id=$4::uuid AND document_type=$5 AND status='pending') AS pending_count,
          (SELECT count(*)::integer FROM public.generated_documents WHERE company_id=$1 AND work_order_revision_id=$4::uuid AND document_type=$5 AND status='failed') AS failed_count,
          (SELECT count(*)::integer FROM public.domain_events WHERE company_id=$1 AND entity_type='generated_document' AND command_code=$2 AND metadata->>'revisionId'=$4::text) AS event_count
      `, [COMPANY_A, COMMAND_CODE, IDEMPOTENCY_KEY, target.revision_id, DOCUMENT_TYPE])).rows[0];
    }
    return { counts, scoped };
  });
}

async function crossTenantIsolation(client, generatedDocumentId) {
  for (const companyId of CROSS_TENANTS) {
    await client.query("BEGIN READ ONLY; SET LOCAL ROLE wafl_v2_tenant_runtime");
    try {
      await client.query("SELECT set_config('wafl.company_id',$1,true),set_config('wafl.company_member_id',$2,true),set_config('wafl.access_mode','tenant_member',true),set_config('wafl.correlation_id',$3,true)", [companyId, `alpha38-${companyId}-member`, `${CORRELATION_ID}-isolation`]);
      const documentCount = Number((await client.query("SELECT count(*)::integer AS count FROM public.generated_documents WHERE id=$1::uuid", [generatedDocumentId])).rows[0].count);
      const receiptCount = Number((await client.query("SELECT count(*)::integer AS count FROM public.work_order_command_receipts WHERE result_generated_document_id=$1::uuid", [generatedDocumentId])).rows[0].count);
      assert.equal(documentCount, 0, "cross-tenant-document-leak");
      assert.equal(receiptCount, 0, "cross-tenant-receipt-leak");
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
}

async function auditGenerated(client, target) {
  return readOnly(client, async () => {
    const row = (await client.query(`
      SELECT g.id, g.status, g.storage_object_key, g.file_size_bytes, g.content_sha256,
             g.generated_at,
             g.renderer_version, g.dto_schema_version, g.generation_no,
             g.display_document_number, g.snapshot,
             r.result_generated_document_id, r.result_entity_version, r.request_sha256
      FROM public.generated_documents g
      JOIN public.work_order_command_receipts r
        ON r.company_id=g.company_id AND r.result_generated_document_id=g.id
      WHERE g.company_id=$1 AND g.work_order_revision_id=$2::uuid
        AND g.document_type=$3 AND r.command_code=$4 AND r.idempotency_key=$5
    `, [COMPANY_A, target.revision_id, DOCUMENT_TYPE, COMMAND_CODE, IDEMPOTENCY_KEY])).rows[0];
    assert.ok(row, "generated-document-audit-row-missing");
    assert.ok(UUID_PATTERN.test(String(row.id)));
    assert.equal(String(row.result_generated_document_id), String(row.id));
    assert.equal(row.request_sha256, requestSha);
    return row;
  });
}

async function objectExists(config, objectKey) {
  try {
    const response = await workerRequest(config, "GET", objectKey);
    await response.arrayBuffer();
    return true;
  } catch (error) {
    if (error.status === 404) return false;
    throw error;
  }
}

async function run() {
  const config = guard();
  const client = new Client({ connectionString: config.databaseUrl, application_name: `wafl-v2-alpha38-pdf-r2-${MODE}`, statement_timeout: 120_000 });
  await client.connect();
  let server = null;
  try {
    const manifest = (await fs.readdir(path.resolve("db/v2/migrations"))).filter((name) => /^\d{3}_.*\.sql$/.test(name)).sort();
    const { actor, target } = await loadActorAndTarget(client);
    const before = await snapshotCounts(client, target);
    assert.equal(Number(before.counts.ledger), 10, "migration-ledger-must-be-10");
    assert.equal(manifest.length, 10, "migration-manifest-must-be-10");
    const continuationMode = MODE.startsWith("continuation");
    if (continuationMode) assert.equal(target.work_order_id, CONTINUATION_WORK_ORDER_ID, "continuation-work-order-mismatch");

    if (MODE === "preflight") {
      assert.equal(Number(before.scoped.receipt_count), 0, "target-receipt-already-exists");
      assert.equal(Number(before.scoped.document_count), 0, "target-generated-document-already-exists");
      console.log("WAFL v2 alpha.38 PDF DB/R2 preflight: PASS");
      console.log(`Target fingerprint: ${REQUIRED_FINGERPRINT}; R2 environment fingerprint: ${config.r2.environment}`);
      console.log(`Actual issued source: ${safeRef(target.work_order_id)}/${safeRef(target.revision_id)}; status ${target.status}/${target.revision_status}`);
      console.log("Ledger: 10/10; target receipt/document: 0/0");
      console.log("Mutation budget: receipt +1, document +1/update +1, event +1, R2 PUT +1, DELETE 0");
      console.log("Production mutation: false");
      return;
    }

    if (MODE === "continuation-preflight") {
      const row = await auditGenerated(client, target);
      assert.equal(String(row.id), CONTINUATION_GENERATED_DOCUMENT_ID, "continuation-generated-document-mismatch");
      assert.equal(row.status, "pending", "continuation-document-not-pending");
      assert.equal(row.storage_object_key, null, "continuation-storage-key-already-set");
      assert.equal(row.file_size_bytes, null, "continuation-file-size-already-set");
      assert.equal(row.content_sha256, null, "continuation-content-sha-already-set");
      assert.equal(row.generated_at, null, "continuation-generated-at-already-set");
      assert.equal(Number(before.scoped.receipt_count), 1);
      assert.equal(Number(before.scoped.document_count), 1);
      assert.equal(Number(before.scoped.pending_count), 1);
      assert.equal(Number(before.scoped.generated_count), 0);
      assert.equal(Number(before.scoped.failed_count), 0);
      assert.equal(Number(before.scoped.incomplete_receipts), 0);
      assert.equal(Number(before.scoped.event_count), 0);
      assert.equal(await objectExists(config, CONTINUATION_OBJECT_KEY), false, "continuation-object-already-exists");
      console.log("WAFL v2 alpha.38 pending document continuation preflight: PASS");
      console.log(`Target: ${safeRef(target.work_order_id)}/${safeRef(target.revision_id)}; pending document ${safeRef(row.id)}`);
      console.log("Ledger: 10/10; receipt/document/pending/event: 1/1/1/0");
      console.log("Exact R2 object: absent; bounded prefix listing: unsupported by current signed worker contract");
      console.log("Continuation budget: render 1, R2 PUT 1, finalize update 1, event +1; receipt/document INSERT 0");
      return;
    }

    if (MODE === "audit" || MODE === "continuation-audit") {
      const row = await auditGenerated(client, target);
      if (continuationMode) {
        assert.equal(String(row.id), CONTINUATION_GENERATED_DOCUMENT_ID);
        assert.equal(row.storage_object_key, CONTINUATION_OBJECT_KEY);
      }
      await crossTenantIsolation(client, row.id);
      const object = await workerRequest(config, "GET", row.storage_object_key);
      const bytes = Buffer.from(await object.arrayBuffer());
      assert.equal(bytes.byteLength, Number(row.file_size_bytes));
      assert.equal(sha256(bytes), row.content_sha256);
      assert.equal(Number(before.scoped.receipt_count), 1);
      assert.equal(Number(before.scoped.document_count), 1);
      assert.equal(Number(before.scoped.generated_count), 1);
      assert.equal(Number(before.scoped.pending_count), 0);
      assert.equal(Number(before.scoped.failed_count), 0);
      assert.equal(Number(before.scoped.incomplete_receipts), 0);
      assert.equal(Number(before.scoped.event_count), 1);
      console.log("WAFL v2 alpha.38 PDF DB/R2 audit: PASS");
      console.log(`Generated document: ${safeRef(row.id)}; status generated; object integrity PASS`);
      console.log("Receipt/document/event: 1/1/1; incomplete/pending/failed: 0/0/0");
      console.log("Tenant isolation: B/C/H hidden; production mutation: false");
      return;
    }

    const isContinuation = MODE === "continuation";
    if (isContinuation) {
      assert.equal(Number(before.scoped.receipt_count), 1, "continuation-receipt-count-mismatch");
      assert.equal(Number(before.scoped.document_count), 1, "continuation-document-count-mismatch");
      assert.equal(Number(before.scoped.pending_count), 1, "continuation-pending-count-mismatch");
      assert.equal(Number(before.scoped.event_count), 0, "continuation-event-already-exists");
    } else {
      assert.equal(Number(before.scoped.receipt_count), 0, "runtime-target-receipt-already-exists");
      assert.equal(Number(before.scoped.document_count), 0, "runtime-target-document-already-exists");
    }
    const assetManifest = await loadAssetManifest(client, actor, target.revision_id);
    server = await startServer(actor);
    const preview = await loadActualPreview(server, target);
    const snapshot = createWorkOrderIssuedPdfSnapshot({
      companyId: COMPANY_A,
      requestedWorkOrderId: target.work_order_id,
      requestedRevisionId: target.revision_id,
      documentType: DOCUMENT_TYPE,
      preview,
      assetManifest,
      snapshotCreatedAt: preview.document.issuedAt,
    });
    const canonicalSnapshotJson = serializeWorkOrderIssuedPdfSnapshot(snapshot);
    const snapshotSha256 = hashWorkOrderIssuedPdfSnapshot(snapshot);
    const representativeImageDataUrl = await resolveRepresentativeImage(config, assetManifest);

    const prepared = isContinuation
      ? { replay: false, document: await auditGenerated(client, target) }
      : await prepareGeneration(client, { actor, target, preview, snapshot, canonicalSnapshotJson });
    assert.equal(prepared.replay, false, "first-prepare-must-not-replay");
    const generatedDocumentId = String(prepared.document.id);
    if (isContinuation) {
      assert.equal(generatedDocumentId, CONTINUATION_GENERATED_DOCUMENT_ID, "continuation-generated-document-mismatch");
      assert.equal(prepared.document.status, "pending", "continuation-document-not-pending");
      assert.equal(prepared.document.storage_object_key, null, "continuation-storage-key-already-set");
      assert.equal(prepared.document.file_size_bytes, null, "continuation-file-size-already-set");
      assert.equal(prepared.document.content_sha256, null, "continuation-content-sha-already-set");
      assert.equal(prepared.document.generated_at, null, "continuation-generated-at-already-set");
      assert.equal(hashWorkOrderIssuedPdfSnapshot(prepared.document.snapshot), snapshotSha256, "continuation-snapshot-hash-mismatch");
    }
    const objectKey = createWorkOrderPdfStorageKey({ companyId: COMPANY_A, workOrderId: target.work_order_id, pdfId: generatedDocumentId });
    if (isContinuation) assert.equal(objectKey, CONTINUATION_OBJECT_KEY, "continuation-object-key-mismatch");
    const existing = await objectExists(config, objectKey);
    assert.equal(existing, false, "generated-document-object-key-already-exists");

    const runToken = crypto.randomBytes(16).toString("hex");
    const inputPath = path.join(process.cwd(), ".tmp", "wafl-v2-alpha38", "render-input", `${runToken}.json`);
    await fs.mkdir(path.dirname(inputPath), { recursive: true });
    await fs.writeFile(inputPath, JSON.stringify({ snapshot, canonicalSnapshotJson, snapshotSha256, objectKeyPlan: objectKey, representativeImageDataUrl }), "utf8");
    const renderer = new LocalChromiumIssuedWorkOrderPdfRenderer();
    const pdf = await renderer.render({
      snapshot,
      canonicalSnapshotJson,
      snapshotSha256,
      renderUrl: `${server.baseUrl}/dev/workorder-pdf-render/${runToken}`,
      outputFileName: `${preview.document.displayDocumentNumber}.pdf`,
      options: { printBackground: true, preferCssPageSize: true, maxFileSizeBytes: 10 * 1024 * 1024 },
    });
    assert.match(pdf.extractedText, /작업지시서/);
    assert.ok(pdf.extractedText.includes(preview.header.productName));
    assert.ok(pdf.extractedText.includes(preview.document.displayDocumentNumber));
    assert.equal(pdf.extractedText.includes("리넨 라운드 셔츠 원피스"), false, "sample-fallback-detected");
    assert.equal(pdf.blankPageCount, 0);
    assert.equal(pdf.clippingViolationCount, 0);
    assert.equal(pdf.consoleErrorCount, 0);
    assert.equal(pdf.failedRequestCount, 0);

    await workerRequest(config, "PUT", objectKey, pdf.pdf, "application/pdf");
    const uploaded = await workerRequest(config, "GET", objectKey);
    assert.equal(uploaded.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase(), "application/pdf");
    const uploadedBytes = Buffer.from(await uploaded.arrayBuffer());
    assert.equal(uploadedBytes.byteLength, pdf.fileSizeBytes);
    assert.equal(sha256(uploadedBytes), pdf.contentSha256);

    const generatedAt = new Date().toISOString();
    await finalizeGeneration(client, {
      actor, target, preview, snapshot, snapshotSha256, objectKey, pdf, generatedAt,
      generatedDocumentId, generationNo: prepared.document.generation_no,
    });
    const replay = await prepareGeneration(client, { actor, target, preview, snapshot, canonicalSnapshotJson });
    assert.equal(replay.replay, true, "duplicate-request-must-replay");
    assert.equal(String(replay.document.id), generatedDocumentId);
    assert.equal(replay.document.status, "generated");

    const after = await snapshotCounts(client, target);
    assert.equal(Number(after.counts.receipts), Number(before.counts.receipts) + (isContinuation ? 0 : 1));
    assert.equal(Number(after.counts.documents), Number(before.counts.documents) + (isContinuation ? 0 : 1));
    assert.equal(Number(after.counts.events), Number(before.counts.events) + 1);
    assert.equal(Number(after.scoped.receipt_count), 1);
    assert.equal(Number(after.scoped.document_count), 1);
    assert.equal(Number(after.scoped.generated_count), 1);
    assert.equal(Number(after.scoped.pending_count), 0);
    assert.equal(Number(after.scoped.failed_count), 0);
    assert.equal(Number(after.scoped.incomplete_receipts), 0);
    assert.equal(Number(after.scoped.event_count), 1);
    assert.equal(Number(after.counts.work_orders), Number(before.counts.work_orders));
    assert.equal(Number(after.counts.revisions), Number(before.counts.revisions));
    const audit = await auditGenerated(client, target);
    assert.equal(String(audit.id), generatedDocumentId);
    assert.equal(audit.status, "generated");
    assert.equal(audit.storage_object_key, objectKey);
    assert.equal(Number(audit.file_size_bytes), pdf.fileSizeBytes);
    assert.equal(audit.content_sha256, pdf.contentSha256);
    await crossTenantIsolation(client, generatedDocumentId);

    const artifactDir = path.join(process.cwd(), ".tmp", "wafl-v2-alpha38");
    await fs.mkdir(artifactDir, { recursive: true });
    await fs.writeFile(path.join(artifactDir, "actual-issued-generated-document.pdf"), pdf.pdf);
    await fs.writeFile(path.join(artifactDir, "runtime-manifest.json"), JSON.stringify({
      result: isContinuation ? "ALPHA38_PDF_DB_R2_CONTINUATION_PASS" : "ALPHA38_PDF_DB_R2_RUNTIME_PASS",
      appVersion: "2.0.0-alpha.38",
      targetFingerprint: REQUIRED_FINGERPRINT,
      generatedDocumentId,
      uuidSource: "PostgreSQL DEFAULT gen_random_uuid() RETURNING id",
      workOrderId: target.work_order_id,
      revisionId: target.revision_id,
      displayDocumentNumber: preview.document.displayDocumentNumber,
      rendererVersion: snapshot.rendererVersion,
      dtoSchemaVersion: snapshot.dtoSchemaVersion,
      snapshotSha256,
      pdfSha256: pdf.contentSha256,
      fileSizeBytes: pdf.fileSizeBytes,
      pageCount: pdf.pageCount,
      pageOrientations: pdf.pageOrientations,
      objectKey,
      receiptDelta: isContinuation ? 0 : 1,
      documentDelta: isContinuation ? 0 : 1,
      documentUpdateCount: 1,
      eventDelta: 1,
      r2PutCount: 1,
      r2DeleteCount: 0,
      duplicateReplayDelta: 0,
      retained: true,
      partialMutation: false,
      productionMutation: false,
    }, null, 2), "utf8");
    console.log(isContinuation ? "ALPHA38_PDF_DB_R2_CONTINUATION_AND_COMPLETION_PASS" : "ALPHA38_PDF_DB_R2_RUNTIME_AND_COMPLETION_PASS");
    console.log(`Generated document: ${safeRef(generatedDocumentId)}; UUID source: PostgreSQL default`);
    console.log(`Actual source: ${safeRef(target.work_order_id)}/${safeRef(target.revision_id)}; document ${preview.document.displayDocumentNumber}`);
    console.log(`PDF: ${pdf.fileSizeBytes} bytes; ${pdf.contentSha256}; pages ${pdf.pageCount}; ${pdf.pageOrientations.join("/")}`);
    console.log(`R2 object key: ${objectKey}; PUT/GET integrity PASS; DELETE 0`);
    console.log(`Receipt/document/update/event: +${isContinuation ? 0 : 1}/+${isContinuation ? 0 : 1}/+1/+1; duplicate replay delta 0`);
    console.log("Retained DB rows/R2 object: true; partial/production mutation: false/false");
  } catch (error) {
    const stderr = server?.stderr?.() ?? "";
    if (stderr) console.error("Sanitized Next stderr tail present", { bytes: Buffer.byteLength(stderr) });
    throw error;
  } finally {
    await stopServer(server);
    await client.end();
  }
}

run().catch((error) => {
  console.error("WAFL v2 alpha.38 PDF DB/R2 runner: FAILED", {
    name: error instanceof Error ? error.name : "UnknownError",
    message: error instanceof Error ? error.message : "unknown",
    runnerLocation: String(error?.stack ?? "").match(/run-wafl-v2-alpha38-pdf-r2-runtime\.mjs:(\d+):(\d+)/)?.[0] ?? "unknown",
  });
  process.exitCode = 1;
});
