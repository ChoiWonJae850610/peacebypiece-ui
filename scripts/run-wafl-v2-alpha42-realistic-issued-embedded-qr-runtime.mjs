#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

import pg from "pg";

import { ALPHA42_REALISTIC_FIXTURE, assertAlpha42RealisticFixture } from "../lib/generated-documents/work-order-pdf/realisticIssuedFixture.mjs";
import { deriveEmbeddedQrOpaqueToken, scopeEmbeddedQrIdempotencyKey } from "../lib/generated-documents/document-access/tokenDerivation.mjs";
import { createR2WorkerSignedUrl, normalizeWorkerBaseUrl } from "../lib/storage/r2/r2WorkerSignature.mjs";
import { LocalChromiumIssuedWorkOrderPdfRenderer } from "../lib/generated-documents/work-order-pdf/localChromiumRenderer.mts";
import {
  createWorkOrderIssuedPdfSnapshot,
  hashWorkOrderIssuedPdfSnapshot,
  selectRepresentativeAsset,
  serializeWorkOrderIssuedPdfSnapshot,
} from "../lib/generated-documents/work-order-pdf/snapshot.ts";
import { createWorkOrderPdfStorageKey } from "../lib/workorder/pdf/workOrderPdfPolicy.ts";
import { writeLocalIssuedPdfRenderInput } from "../lib/generated-documents/work-order-pdf/localRenderInputCore.mjs";
import { prepareAlpha42RepresentativeImage } from "./lib/alpha42-representative-image.mjs";
import {
  assertPublicViewerNotFoundResponse,
  assertWorkspaceForbiddenResponse,
  assertWorkspaceNotFoundResponse,
} from "./lib/alpha42-viewer-response-assertions.mjs";

const { Client } = pg;
const MODE = process.argv[2] ?? "preflight";
const REQUIRED_FINGERPRINT = "01e5dcc7fea3";
const COMPANY_A = "wafl-fn-company-a";
const COMPANY_B = "wafl-fn-company-b";
const COMPANY_C = "wafl-fn-company-c";
const COMPANY_H = "wafl-fn-company-h";
const CROSS_TENANTS = [COMPANY_B, COMPANY_H];
const TARGET_LEDGER = 12;
const DOCUMENT_TYPE = "factory_instruction";
const GENERATION_COMMAND = "work_order.document.generate";
const EMBEDDED_TOKEN_COMMAND = "work_order.document.embedded_qr.create";
const CREATE_COMMAND = "work_order.create_draft";
const CREATE_IDEMPOTENCY_KEY = "alpha42-realistic-work-order-create-v1";
const GENERATION_IDEMPOTENCY_KEY = "alpha42-realistic-issued-embedded-qr-generation-v1";
const GENERATION_CORRELATION_ID = "alpha42-realistic-issued-embedded-qr-generation-v1";
const RUNTIME_APPROVAL = "2.0.0-alpha.42-dev-test-realistic-issued-embedded-qr-runtime";
const CONFIRMATION = MODE === "runtime"
  ? "EXECUTE WAFL V2 ALPHA42 REALISTIC ISSUED EMBEDDED QR RUNTIME"
  : MODE === "continuation"
    ? "EXECUTE WAFL V2 ALPHA42 RETAINED DRAFT CONTINUATION"
    : "VERIFY WAFL V2 ALPHA42 REALISTIC ISSUED EMBEDDED QR PREFLIGHT";
const CREATE_APPROVAL = "2.0.0-alpha.25-dev-test-command-runtime";
const ISSUE_APPROVAL = "2.0.0-alpha.27-dev-test-revision-issue-runtime";
const VIEWER_APPROVAL = "2.0.0-alpha.39-dev-test-document-access-runtime";
const PREVIEW_READ_APPROVAL = "1";
const MANIFEST_PATH = path.resolve(".tmp/wafl-v2-alpha42/runtime-manifest.json");
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const safeRef = (value) => sha256(String(value)).slice(0, 12);
const fixture = assertAlpha42RealisticFixture(ALPHA42_REALISTIC_FIXTURE);

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
  assert.ok(new Set(["preflight", "runtime", "continuation-preflight", "continuation", "audit"]).has(MODE), "unsupported-mode");
  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, "database-url-missing");
  assert.ok(new Set(["development", "test"]).has(process.env.WAFL_V2_RUNTIME), "dev-test-runtime-required");
  assert.equal(process.env.WAFL_V2_TEST_PREFIX, "wafl-fn", "test-prefix-mismatch");
  assert.equal(databaseFingerprint(databaseUrl), REQUIRED_FINGERPRINT, "target-fingerprint-mismatch");
  assert.equal(process.env.WAFL_V2_APPROVED_DB_FINGERPRINT, REQUIRED_FINGERPRINT, "approved-fingerprint-mismatch");
  assert.equal(process.env.WAFL_V2_CONFIRMATION, CONFIRMATION, "confirmation-mismatch");
  if (MODE === "runtime" || MODE === "continuation") {
    assert.equal(process.env.WAFL_V2_ALPHA42_RUNTIME_APPROVED, RUNTIME_APPROVAL, "runtime-approval-missing");
  } else {
    assert.ok(!process.env.WAFL_V2_ALPHA42_RUNTIME_APPROVED, "read-only-mode-approval-forbidden");
  }
  const workerUrl = process.env.R2_WORKER_UPLOAD_URL?.trim();
  const workerSecret = process.env.R2_WORKER_UPLOAD_SECRET?.trim();
  const viewerOrigin = process.env.WAFL_DOCUMENT_VIEWER_ORIGIN?.trim();
  assert.ok(workerUrl && workerSecret, "r2-config-missing");
  assert.ok(viewerOrigin, "viewer-origin-missing");
  const origin = new URL(viewerOrigin);
  assert.ok(origin.protocol === "http:" || origin.protocol === "https:", "viewer-origin-invalid");
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
  return { databaseUrl, workerUrl: current.normalized, workerSecret, viewerOrigin: origin.origin };
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

async function tenantClaims(client, actor, correlationId) {
  await client.query(
    "SELECT set_config('wafl.company_id',$1,true),set_config('wafl.company_member_id',$2,true),set_config('wafl.access_mode','tenant_member',true),set_config('wafl.correlation_id',$3,true)",
    [COMPANY_A, actor.companyMemberId, correlationId],
  );
}

async function loadPreflightState(client) {
  return readOnly(client, async () => {
    const ledger = (await client.query("SELECT migration_id, filename FROM public.wafl_v2_migration_ledger ORDER BY migration_id")).rows;
    const purpose = (await client.query(`
      SELECT data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema='public' AND table_name='document_access_tokens' AND column_name='token_purpose'
    `)).rows[0];
    const actor = (await client.query(`
      SELECT id, user_id FROM public.company_members
      WHERE company_id=$1 AND status='approved' AND user_id IS NOT NULL
      ORDER BY created_at,id LIMIT 1
    `, [COMPANY_A])).rows[0];
    assert.ok(actor, "company-a-approved-member-missing");
    const settingsAccess = (await client.query(`
      SELECT
        has_function_privilege(
          'wafl_v2_tenant_runtime',
          'public.wafl_v2_document_number_settings()',
          'EXECUTE'
        ) AS runtime_execute,
        EXISTS (
          SELECT 1
          FROM pg_catalog.pg_proc p
          CROSS JOIN LATERAL pg_catalog.aclexplode(
            COALESCE(p.proacl, pg_catalog.acldefault('f', p.proowner))
          ) acl
          WHERE p.oid = 'public.wafl_v2_document_number_settings()'::regprocedure
            AND acl.grantee = 0
            AND acl.privilege_type = 'EXECUTE'
        ) AS public_execute,
        has_table_privilege(
          'wafl_v2_tenant_runtime',
          'public.company_settings',
          'SELECT'
        ) AS direct_settings_select
    `)).rows[0];
    assert.ok(settingsAccess, "DOCUMENT_NUMBER_SETTINGS_NOT_READY");
    assert.equal(settingsAccess.runtime_execute, true, "DOCUMENT_NUMBER_SETTINGS_NOT_READY");
    assert.equal(settingsAccess.public_execute, false, "DOCUMENT_NUMBER_SETTINGS_NOT_READY");
    assert.equal(settingsAccess.direct_settings_select, false, "DOCUMENT_NUMBER_SETTINGS_NOT_READY");

    await client.query("SET LOCAL ROLE wafl_v2_tenant_runtime");
    await tenantClaims(client, { companyMemberId: String(actor.id) }, "alpha42-realistic-issued-preflight");
    const settingsResult = await client.query(`
      SELECT document_code, business_timezone
      FROM public.wafl_v2_document_number_settings()
    `);
    assert.equal(settingsResult.rowCount, 1, "DOCUMENT_NUMBER_SETTINGS_NOT_READY");
    const documentCode = String(settingsResult.rows[0]?.document_code ?? "").trim();
    const normalizedDocumentCode = documentCode.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const businessTimezone = String(settingsResult.rows[0]?.business_timezone ?? "").trim();
    assert.ok(
      documentCode.length > 0
        && documentCode.length <= 16
        && normalizedDocumentCode.length > 0
        && businessTimezone.length > 0,
      "DOCUMENT_NUMBER_SETTINGS_INVALID",
    );
    const settings = {
      rowCount: settingsResult.rowCount,
      documentCode: normalizedDocumentCode,
      businessTimezone,
      method: "public.wafl_v2_document_number_settings()",
    };
    const target = (await client.query(`
      SELECT w.id,w.status,w.entity_version,w.current_revision_id,w.document_number_base,
             r.revision_status,r.entity_version AS revision_version
      FROM public.work_orders w
      LEFT JOIN public.work_order_revisions r ON r.company_id=w.company_id AND r.id=w.current_revision_id
      WHERE w.company_id=$1 AND w.legacy_source_id=$2
    `, [COMPANY_A, fixture.legacySourceId])).rows;
    const createReceiptKey = sha256([
      CREATE_COMMAND,
      COMPANY_A,
      String(actor.id),
      CREATE_IDEMPOTENCY_KEY,
    ].join("\0"));
    const retained = (await client.query(`
      SELECT w.id AS work_order_id,w.status,w.entity_version AS work_order_version,
             w.current_revision_id,w.legacy_source_id,w.document_number_base,
             r.id AS revision_id,r.revision_status,r.entity_version AS revision_version,
             (SELECT count(*)::integer FROM public.work_order_material_lines m WHERE m.company_id=w.company_id AND m.revision_id=r.id) AS materials,
             (SELECT count(*)::integer FROM public.work_order_colors c WHERE c.company_id=w.company_id AND c.revision_id=r.id) AS colors,
             (SELECT count(*)::integer FROM public.work_order_sizes s WHERE s.company_id=w.company_id AND s.revision_id=r.id) AS sizes,
             (SELECT count(*)::integer FROM public.color_size_quantities q WHERE q.company_id=w.company_id AND q.revision_id=r.id) AS matrix,
             (SELECT count(*)::integer FROM public.work_order_processes p WHERE p.company_id=w.company_id AND p.revision_id=r.id) AS processes,
             (SELECT count(*)::integer FROM public.work_order_images i WHERE i.company_id=w.company_id AND i.work_order_id=w.id) AS images,
             (SELECT count(*)::integer FROM public.work_order_revision_images i WHERE i.company_id=w.company_id AND i.revision_id=r.id) AS revision_images,
             (SELECT count(*)::integer FROM public.generated_documents g WHERE g.company_id=w.company_id AND g.work_order_id=w.id) AS documents,
             (SELECT count(*)::integer FROM public.document_access_tokens t JOIN public.generated_documents g ON g.company_id=t.company_id AND g.id=t.generated_document_id WHERE g.company_id=w.company_id AND g.work_order_id=w.id) AS tokens,
             (SELECT count(*)::integer FROM public.work_order_command_receipts x WHERE x.company_id=w.company_id AND x.work_order_id=w.id) AS receipts,
             (SELECT count(*)::integer FROM public.work_order_command_receipts x WHERE x.company_id=w.company_id AND x.work_order_id=w.id AND (x.result_revision_id IS NULL OR x.result_entity_version IS NULL)) AS incomplete_receipts,
             (SELECT count(*)::integer FROM public.domain_events e WHERE e.company_id=w.company_id AND e.entity_id=w.id::text) AS events
      FROM public.work_order_command_receipts receipt
      JOIN public.work_orders w ON w.company_id=receipt.company_id AND w.id=receipt.work_order_id
      JOIN public.work_order_revisions r ON r.company_id=w.company_id AND r.id=w.current_revision_id
      WHERE receipt.company_id=$1 AND receipt.command_code=$2 AND receipt.idempotency_key=$3
    `, [COMPANY_A, CREATE_COMMAND, createReceiptKey])).rows;
    const a30 = (await client.query(`
      SELECT w.id,w.status,w.entity_version,w.document_number_base,r.id AS revision_id,
             r.revision_status,r.entity_version AS revision_version,
             g.id AS generated_document_id,g.status AS generated_document_status,
             g.storage_object_key,g.file_size_bytes,g.content_sha256,
             (SELECT count(*)::integer FROM public.generated_documents counted
              WHERE counted.company_id=w.company_id AND counted.work_order_id=w.id) AS document_count
      FROM public.work_orders w JOIN public.work_order_revisions r
        ON r.company_id=w.company_id AND r.id=w.current_revision_id
      LEFT JOIN LATERAL (
        SELECT id,status,storage_object_key,file_size_bytes,content_sha256
        FROM public.generated_documents
        WHERE company_id=w.company_id AND work_order_id=w.id
        ORDER BY generation_no DESC,id DESC LIMIT 1
      ) g ON true
      WHERE w.company_id=$1 AND w.item_code='A30FACT' AND w.deleted_at IS NULL
      ORDER BY w.updated_at DESC LIMIT 1
    `, [COMPANY_A])).rows[0];
    const a30ManualTokens = a30?.generated_document_id ? (await client.query(`
      SELECT id,expires_at,revoked_at,last_accessed_at,access_count,rotated_from_token_id
      FROM public.document_access_tokens
      WHERE company_id=$1 AND generated_document_id=$2::uuid AND token_purpose='manual_share'
      ORDER BY created_at,id
    `, [COMPANY_A, a30.generated_document_id])).rows : [];
    const counts = (await client.query(`
      SELECT
        (SELECT count(*)::integer FROM public.work_orders) AS work_orders,
        (SELECT count(*)::integer FROM public.work_order_revisions) AS revisions,
        (SELECT count(*)::integer FROM public.work_order_material_lines) AS materials,
        (SELECT count(*)::integer FROM public.work_order_colors) AS colors,
        (SELECT count(*)::integer FROM public.work_order_sizes) AS sizes,
        (SELECT count(*)::integer FROM public.color_size_quantities) AS matrix,
        (SELECT count(*)::integer FROM public.work_order_size_specs) AS size_specs,
        (SELECT count(*)::integer FROM public.work_order_size_spec_sizes) AS spec_sizes,
        (SELECT count(*)::integer FROM public.work_order_size_spec_poms) AS spec_poms,
        (SELECT count(*)::integer FROM public.work_order_size_spec_values) AS spec_values,
        (SELECT count(*)::integer FROM public.work_order_processes) AS processes,
        (SELECT count(*)::integer FROM public.work_order_images) AS images,
        (SELECT count(*)::integer FROM public.work_order_revision_images) AS revision_images,
        (SELECT count(*)::integer FROM public.work_order_command_receipts) AS receipts,
        (SELECT count(*)::integer FROM public.generated_documents) AS documents,
        (SELECT count(*)::integer FROM public.document_access_tokens) AS tokens,
        (SELECT count(*)::integer FROM public.domain_events) AS events
    `)).rows[0];
    assert.ok(a30, "a30fact-baseline-missing");
    return {
      ledger,
      purpose,
      actor: { companyId: COMPANY_A, companyMemberId: String(actor.id), userId: String(actor.user_id) },
      settings,
      settingsAccess,
      target,
      retained,
      a30,
      a30ManualTokens,
      counts,
    };
  });
}

function timestampValue(value) {
  return value ? new Date(value).toISOString() : null;
}

function a30FactSnapshot(state) {
  return {
    workOrderId: String(state.a30.id),
    revisionId: String(state.a30.revision_id),
    workOrderStatus: String(state.a30.status),
    revisionStatus: String(state.a30.revision_status),
    workOrderVersion: Number(state.a30.entity_version),
    revisionVersion: Number(state.a30.revision_version),
    documentNumberBase: String(state.a30.document_number_base),
    generatedDocumentId: String(state.a30.generated_document_id),
    generatedDocumentStatus: String(state.a30.generated_document_status),
    storageObjectKey: String(state.a30.storage_object_key),
    fileSizeBytes: Number(state.a30.file_size_bytes),
    contentSha256: String(state.a30.content_sha256),
    generatedDocumentCount: Number(state.a30.document_count),
    manualShareTokens: state.a30ManualTokens.map((row) => ({
      tokenRef: safeRef(row.id),
      expiresAt: timestampValue(row.expires_at),
      revokedAt: timestampValue(row.revoked_at),
      lastAccessedAt: timestampValue(row.last_accessed_at),
      accessCount: Number(row.access_count),
      rotatedFromTokenRef: row.rotated_from_token_id ? safeRef(row.rotated_from_token_id) : null,
    })),
  };
}

function assertPreflightState(state, expectedTargetCount) {
  assert.equal(state.ledger.length, TARGET_LEDGER, "migration-ledger-count-mismatch");
  assert.equal(Number(state.ledger.at(-1)?.migration_id), TARGET_LEDGER, "migration-ledger-tail-mismatch");
  assert.equal(state.ledger.at(-1)?.filename, "012_v2_document_access_token_purpose.sql", "migration-ledger-filename-mismatch");
  assert.equal(state.purpose?.data_type, "text", "token-purpose-type-mismatch");
  assert.equal(state.purpose?.is_nullable, "NO", "token-purpose-nullability-mismatch");
  assert.match(String(state.purpose?.column_default), /manual_share/, "token-purpose-default-mismatch");
  assert.equal(state.target.length, expectedTargetCount, expectedTargetCount === 0 ? "target-already-exists" : "target-missing-or-duplicated");
  assert.equal(state.a30.generated_document_status, "generated", "a30fact-generated-document-status-mismatch");
  assert.ok(state.a30.storage_object_key && state.a30.content_sha256, "a30fact-generated-document-metadata-missing");
  assert.ok(Number(state.a30.file_size_bytes) > 0, "a30fact-generated-document-size-invalid");
  assert.equal(state.a30ManualTokens.length, 2, "a30fact-manual-share-token-baseline-mismatch");
}

function assertContinuationPreflightState(state) {
  assertPreflightState(state, 0);
  assert.equal(state.retained.length, 1, "retained-draft-missing-or-duplicated");
  const retained = state.retained[0];
  assert.equal(retained.status, "draft", "retained-work-order-status-mismatch");
  assert.equal(retained.revision_status, "draft", "retained-revision-status-mismatch");
  assert.equal(Number(retained.work_order_version), 1, "retained-work-order-version-mismatch");
  assert.equal(Number(retained.revision_version), 1, "retained-revision-version-mismatch");
  assert.equal(retained.legacy_source_id, null, "retained-fixture-identity-must-be-unset");
  assert.equal(retained.document_number_base, null, "retained-document-number-must-be-unset");
  for (const field of ["materials", "colors", "sizes", "matrix", "processes", "images", "revision_images", "documents", "tokens"]) {
    assert.equal(Number(retained[field]), 0, `retained-${field}-must-be-zero`);
  }
  assert.equal(Number(retained.receipts), 1, "retained-create-receipt-count-mismatch");
  assert.equal(Number(retained.incomplete_receipts), 0, "retained-incomplete-receipt-detected");
  assert.equal(Number(retained.events), 1, "retained-create-event-count-mismatch");
  return retained;
}

function mutationBudget() {
  return Object.freeze({
    workOrders: 1, revisions: 1, workOrderPointerUpdates: 1, fixtureMetadataUpdates: 1,
    materials: 6, colors: 3, sizes: 3, matrix: 9,
    sizeSpecs: 1, specSizes: 3, specPoms: 5, specValues: 15,
    processes: 4, images: 1, revisionImages: 1,
    receipts: 3, events: 5, generatedDocuments: 1, embeddedTokens: 1,
    workOrderVersion: "1->2", revisionVersion: "1->2",
    imageR2Put: 1, pdfR2Put: 1,
    imageR2Get: 3, pdfR2Get: 3, r2GetTotal: 6,
    r2Delete: 0, production: 0,
  });
}

function continuationMutationBudget() {
  return Object.freeze({
    workOrders: 0, revisions: 0, workOrderPointerUpdates: 0,
    fixtureMetadataUpdates: 1, materials: 6, colors: 3, sizes: 3, matrix: 9,
    sizeSpecs: 1, specSizes: 3, specPoms: 5, specValues: 15,
    processes: 4, images: 1, revisionImages: 1,
    receipts: 2, events: 4, generatedDocuments: 1, embeddedTokens: 1,
    workOrderVersion: "1->2", revisionVersion: "1->2",
    imageR2Put: 1, pdfR2Put: 1,
    imageR2Get: 3, pdfR2Get: 3, r2GetTotal: 6,
    r2Delete: 0, production: 0,
  });
}

async function writeManifest(value) {
  await fs.mkdir(path.dirname(MANIFEST_PATH), { recursive: true });
  await fs.writeFile(MANIFEST_PATH, `${JSON.stringify({
    appVersion: "2.0.0-alpha.41",
    targetVersion: "2.0.0-alpha.42",
    targetFingerprint: REQUIRED_FINGERPRINT,
    fixtureIdentity: fixture.legacySourceId,
    rawTokenPersisted: false,
    viewerUrlPersisted: false,
    ...value,
  }, null, 2)}\n`, "utf8");
}

function sessionSecret() {
  const value = process.env.WAFL_SESSION_SECRET?.trim() || process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  assert.ok(value, "session-secret-missing");
  return value;
}

function sessionCookie(actor) {
  const payload = Buffer.from(JSON.stringify({
    ...actor,
    companyName: "WAFL dev/test Company A",
    role: "company_admin",
    email: "alpha42-actor@example.invalid",
    name: "alpha42 actor",
    issuedAt: new Date().toISOString(),
  }), "utf8").toString("base64url");
  const signature = crypto.createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
  return `wafl_auth_session=${payload}.${signature}`;
}

async function companyActor(client, companyId) {
  const row = (await client.query(`
    SELECT id,COALESCE(user_id,$2) AS user_id
    FROM public.company_members
    WHERE company_id=$1
    ORDER BY (status='approved') DESC,created_at,id LIMIT 1
  `, [companyId, `alpha42-${companyId}`])).rows[0];
  return {
    companyId,
    companyMemberId: String(row?.id ?? `company-member:${companyId}`),
    userId: String(row?.user_id ?? `alpha42-${companyId}`),
  };
}

async function loadTargetMutationLedger(client, actor, target) {
  return readOnly(client, async () => {
    await client.query("SET LOCAL ROLE wafl_v2_tenant_runtime");
    await tenantClaims(client, actor, "alpha42-runtime-noop-ledger");
    const row = (await client.query(`
      SELECT w.status AS work_order_status,w.entity_version AS work_order_version,
             r.revision_status,r.entity_version AS revision_version,
             (SELECT count(*)::integer FROM public.work_order_command_receipts receipt
              WHERE receipt.company_id=w.company_id AND receipt.work_order_id=w.id) AS receipts,
             (SELECT count(*)::integer FROM public.generated_documents document
              WHERE document.company_id=w.company_id AND document.work_order_revision_id=r.id) AS documents,
             (SELECT count(*)::integer FROM public.document_access_tokens token
              JOIN public.generated_documents document
                ON document.company_id=token.company_id AND document.id=token.generated_document_id
              WHERE document.company_id=w.company_id AND document.work_order_revision_id=r.id) AS tokens,
             (SELECT count(*)::integer FROM public.domain_events event
              WHERE event.company_id=w.company_id
                AND (event.entity_id=w.id::text OR event.entity_id IN (
                  SELECT document.id::text FROM public.generated_documents document
                  WHERE document.company_id=w.company_id AND document.work_order_revision_id=r.id
                ))) AS events
      FROM public.work_orders w JOIN public.work_order_revisions r
        ON r.company_id=w.company_id AND r.id=$3::uuid
      WHERE w.company_id=$1 AND w.id=$2::uuid
    `, [COMPANY_A, target.workOrderId, target.revisionId])).rows[0];
    assert.ok(row, "target-noop-ledger-missing");
    return {
      workOrderStatus: String(row.work_order_status),
      workOrderVersion: Number(row.work_order_version),
      revisionStatus: String(row.revision_status),
      revisionVersion: Number(row.revision_version),
      receipts: Number(row.receipts),
      documents: Number(row.documents),
      tokens: Number(row.tokens),
      events: Number(row.events),
    };
  });
}

async function tenantTargetVisibility(client, actor, target, generatedDocumentId) {
  return readOnly(client, async () => {
    await client.query("SET LOCAL ROLE wafl_v2_tenant_runtime");
    await client.query(
      "SELECT set_config('wafl.company_id',$1,true),set_config('wafl.company_member_id',$2,true),set_config('wafl.access_mode','tenant_member',true),set_config('wafl.correlation_id',$3,true)",
      [actor.companyId, actor.companyMemberId, `alpha42-tenant-visibility-${actor.companyId}`],
    );
    const row = (await client.query(`
      SELECT
        (SELECT count(*)::integer FROM public.work_orders WHERE id=$1::uuid) AS work_orders,
        (SELECT count(*)::integer FROM public.work_order_revisions WHERE id=$2::uuid) AS revisions,
        (SELECT count(*)::integer FROM public.generated_documents WHERE id=$3::uuid) AS documents,
        (SELECT count(*)::integer FROM public.document_access_tokens WHERE generated_document_id=$3::uuid) AS tokens
    `, [target.workOrderId, target.revisionId, generatedDocumentId])).rows[0];
    return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, Number(value)]));
  });
}

async function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") return server.close(() => reject(new Error("port-unavailable")));
      server.close(() => resolve(address.port));
    });
  });
}

async function startServer(approval) {
  const port = await freePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", String(port)], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      WAFL_V2_READ_APPROVED: PREVIEW_READ_APPROVAL,
      WAFL_V2_READ_API_ENABLED: "1",
      WAFL_V2_COMMAND_API_ENABLED: "1",
      WAFL_V2_COMMAND_MUTATION_APPROVED: approval,
      WAFL_V2_DOCUMENT_VIEWER_MUTATION_APPROVED: approval === VIEWER_APPROVAL ? VIEWER_APPROVAL : "",
      WAFL_V2_ALPHA42_RUNTIME_APPROVED: RUNTIME_APPROVAL,
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  let stderr = "";
  child.stderr.on("data", (chunk) => { stderr = `${stderr}${String(chunk)}`.slice(-4_000); });
  for (let attempt = 0; attempt < 240; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`server-exited:${child.exitCode}`);
    try {
      const response = await fetch(`${baseUrl}/v`, { redirect: "manual" });
      if (response.status === 200) return { baseUrl, child, stderr: () => stderr };
    } catch {}
    await sleep(250);
  }
  child.kill();
  throw new Error("server-ready-timeout");
}

async function stopServer(server) {
  if (!server?.child) return;
  server.child.kill();
  await Promise.race([
    new Promise((resolve) => server.child.once("exit", resolve)),
    sleep(3_000),
  ]);
}

async function apiRequest(server, route, { actor, method = "GET", body, headers = {} } = {}) {
  const response = await fetch(`${server.baseUrl}${route}`, {
    method,
    headers: {
      ...(actor ? { Cookie: sessionCookie(actor) } : {}),
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: "manual",
  });
  const text = await response.text();
  return { response, body: text ? JSON.parse(text) : null };
}

function assertPublicPayloadSafe(body, forbiddenValues) {
  const serialized = JSON.stringify(body);
  for (const forbidden of forbiddenValues.filter(Boolean)) {
    assert.equal(serialized.includes(String(forbidden)), false, "public-viewer-internal-identity-leak");
  }
  for (const forbiddenKey of ["token_hash", "storage_object_key", "signedUrl", "company_id"]) {
    assert.equal(serialized.includes(forbiddenKey), false, "public-viewer-internal-field-leak");
  }
}

function assertOk(result, status = 200) {
  assert.equal(result.response.status, status, `unexpected-http-${result.response.status}`);
  assert.equal(result.body?.ok, true, "api-result-not-ok");
  return result.body.data;
}

function signedUrl(config, method, key, contentType = "application/octet-stream") {
  return createR2WorkerSignedUrl({
    uploadUrl: config.workerUrl,
    secret: config.workerSecret,
    method,
    key,
    contentType,
    expiresAt: Math.floor(Date.now() / 1_000) + 300,
  });
}

function createR2CallAudit() {
  return { imageGet: 0, imagePut: 0, pdfGet: 0, pdfPut: 0, delete: 0, putKeys: [] };
}

function snapshotR2CallAudit(audit) {
  return {
    imageGet: audit.imageGet,
    imagePut: audit.imagePut,
    pdfGet: audit.pdfGet,
    pdfPut: audit.pdfPut,
    totalGet: audit.imageGet + audit.pdfGet,
    totalPut: audit.imagePut + audit.pdfPut,
    delete: audit.delete,
  };
}

function recordR2Call(audit, assetKind, method, key = null) {
  assert.ok(assetKind === "image" || assetKind === "pdf", "r2-asset-kind-invalid");
  assert.ok(method === "get" || method === "put", "r2-method-invalid");
  audit[`${assetKind}${method === "get" ? "Get" : "Put"}`] += 1;
  if (method === "put") audit.putKeys.push(String(key));
}

function assertR2CallBudget(audit) {
  assert.deepEqual(snapshotR2CallAudit(audit), {
    imageGet: 3, imagePut: 1,
    pdfGet: 3, pdfPut: 1,
    totalGet: 6, totalPut: 2,
    delete: 0,
  }, "r2-actual-call-budget-mismatch");
}

async function r2Get(config, key, audit, assetKind, expectedStatus = 200) {
  recordR2Call(audit, assetKind, "get");
  const response = await fetch(signedUrl(config, "GET", key));
  assert.equal(response.status, expectedStatus, `r2-get-http-${response.status}`);
  return response;
}

async function assertR2Absent(config, key, audit, assetKind) {
  recordR2Call(audit, assetKind, "get");
  const response = await fetch(signedUrl(config, "GET", key));
  if (response.status === 404) return;
  if (response.ok) await response.arrayBuffer();
  throw new Error(`R2_TARGET_NOT_ABSENT_${response.status}`);
}

async function r2PutOnce(config, key, bytes, contentType, audit, assetKind) {
  recordR2Call(audit, assetKind, "put", key);
  const response = await fetch(signedUrl(config, "PUT", key, contentType), {
    method: "PUT",
    headers: { "Content-Type": contentType, "Content-Length": String(bytes.byteLength) },
    body: bytes,
  });
  if (!response.ok) {
    const body = (await response.text().catch(() => "")).slice(0, 512);
    let workerCode = "UNKNOWN";
    try {
      const parsed = JSON.parse(body);
      if (/^[A-Z0-9_]{1,80}$/.test(String(parsed?.error ?? ""))) workerCode = String(parsed.error);
    } catch {}
    throw new Error(`r2-put-http-${response.status}:${workerCode}`);
  }
}

async function verifyR2Object(config, key, expectedBytes, expectedType, audit, assetKind) {
  const response = await r2Get(config, key, audit, assetKind);
  assert.equal(response.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase(), expectedType);
  const actual = Buffer.from(await response.arrayBuffer());
  assert.equal(actual.byteLength, expectedBytes.byteLength, "r2-size-mismatch");
  assert.equal(sha256(actual), sha256(expectedBytes), "r2-hash-mismatch");
}

async function createDraft(server, actor) {
  const result = await apiRequest(server, "/api/v2/work-orders", {
    actor,
    method: "POST",
    headers: { "Idempotency-Key": "alpha42-realistic-work-order-create-v1" },
    body: {
      clientRequestId: "alpha42-realistic-work-order-create-v1",
      productName: fixture.productName,
      productTypeCode: fixture.productTypeCode,
      seasonCode: fixture.seasonCode,
      itemCode: fixture.itemCode,
      dueDate: fixture.dueDate,
      totalQuantity: fixture.totalQuantity,
      memo: fixture.factoryDeliveryMemo,
      factoryDeliveryMemo: fixture.factoryDeliveryMemo,
    },
  });
  const data = assertOk(result, 201);
  assert.equal(data.nextVersion, 1, "create-version-mismatch");
  return { workOrderId: String(data.result.workOrderId), revisionId: String(data.result.revisionId) };
}

async function insertFixtureContent(client, input) {
  await client.query("BEGIN; SET LOCAL ROLE wafl_v2_tenant_runtime");
  try {
    await tenantClaims(client, input.actor, "alpha42-realistic-content-fixture-v1");
    const locked = (await client.query(`
      SELECT w.id,r.id AS revision_id,w.entity_version,r.entity_version AS revision_version
      FROM public.work_orders w JOIN public.work_order_revisions r
        ON r.company_id=w.company_id AND r.id=w.current_revision_id
      WHERE w.company_id=$1 AND w.id=$2::uuid AND r.id=$3::uuid
        AND w.status='draft' AND r.revision_status='draft'
      FOR UPDATE OF w,r
    `, [COMPANY_A, input.workOrderId, input.revisionId])).rows[0];
    assert.ok(locked, "draft-fixture-lock-missing");
    assert.equal(Number(locked.entity_version), 1, "draft-work-order-version-mismatch");
    assert.equal(Number(locked.revision_version), 1, "draft-revision-version-mismatch");
    const metadata = await client.query(`
      UPDATE public.work_orders SET legacy_source_id=$3, updated_at=now()
      WHERE company_id=$1 AND id=$2::uuid AND legacy_source_id IS NULL
    `, [COMPANY_A, input.workOrderId, fixture.legacySourceId]);
    assert.equal(metadata.rowCount, 1, "fixture-identity-update-failed");

    const colorIds = new Map();
    for (const color of fixture.colors) {
      const row = (await client.query(`
        INSERT INTO public.work_order_colors(company_id,revision_id,color_code,display_name,hex_value,display_order)
        VALUES($1,$2::uuid,$3,$4,$5,$6) RETURNING id
      `, [COMPANY_A, input.revisionId, color.code, color.displayName, color.hexValue, color.displayOrder])).rows[0];
      colorIds.set(color.code, String(row.id));
    }
    const sizeIds = new Map();
    for (const [displayOrder, size] of fixture.sizes.entries()) {
      const row = (await client.query(`
        INSERT INTO public.work_order_sizes(company_id,revision_id,size_code,display_label,display_order)
        VALUES($1,$2::uuid,$3,$3,$4) RETURNING id
      `, [COMPANY_A, input.revisionId, size, displayOrder])).rows[0];
      sizeIds.set(size, String(row.id));
    }
    for (const [colorCode, quantities] of Object.entries(fixture.matrix)) {
      for (const [sizeCode, quantity] of Object.entries(quantities)) {
        await client.query(`
          INSERT INTO public.color_size_quantities(company_id,revision_id,color_id,size_id,quantity)
          VALUES($1,$2::uuid,$3::uuid,$4::uuid,$5)
        `, [COMPANY_A, input.revisionId, colorIds.get(colorCode), sizeIds.get(sizeCode), quantity]);
      }
    }
    for (const [displayOrder, material] of fixture.materials.entries()) {
      await client.query(`
        INSERT INTO public.work_order_material_lines(
          company_id,revision_id,material_type,name,color_option,required_quantity,
          allowance_quantity,inventory_usage_quantity,order_quantity,unit_code,
          unit_price,amount,memo,display_order,usage_area
        ) VALUES($1,$2::uuid,$3,$4,$5,$6::numeric,$7::numeric,0,
          ($6::numeric+$7::numeric),$8,0,0,$9,$10,$11)
      `, [COMPANY_A, input.revisionId, material.type, material.name, material.colorOption,
        material.requiredQuantity, material.allowanceQuantity, material.unitCode,
        material.memo, displayOrder, material.usageArea]);
    }
    const sizeSpec = (await client.query(`
      INSERT INTO public.work_order_size_specs(company_id,revision_id,gender_code,category_code,measurement_unit)
      VALUES($1,$2::uuid,'female','onepiece',$3) RETURNING id
    `, [COMPANY_A, input.revisionId, fixture.sizeSpec.measurementUnit])).rows[0];
    const specSizeIds = new Map();
    for (const [displayOrder, size] of fixture.sizes.entries()) {
      const row = (await client.query(`
        INSERT INTO public.work_order_size_spec_sizes(company_id,revision_id,size_spec_id,size_code,display_label,display_order)
        VALUES($1,$2::uuid,$3::uuid,$4,$4,$5) RETURNING id
      `, [COMPANY_A, input.revisionId, sizeSpec.id, size, displayOrder])).rows[0];
      specSizeIds.set(size, String(row.id));
    }
    for (const [displayOrder, pom] of fixture.sizeSpec.rows.entries()) {
      const pomRow = (await client.query(`
        INSERT INTO public.work_order_size_spec_poms(
          company_id,revision_id,size_spec_id,pom_code,display_name,measurement_type,instruction,display_order
        ) VALUES($1,$2::uuid,$3::uuid,$4,$5,$6,$7,$8) RETURNING id
      `, [COMPANY_A, input.revisionId, sizeSpec.id, pom.code, pom.name, pom.type,
        `${pom.name} 완성 치수를 평평하게 놓고 측정`, displayOrder])).rows[0];
      for (const size of fixture.sizes) {
        await client.query(`
          INSERT INTO public.work_order_size_spec_values(
            company_id,revision_id,size_spec_id,size_row_id,pom_column_id,decimal_value
          ) VALUES($1,$2::uuid,$3::uuid,$4::uuid,$5::uuid,$6::numeric)
        `, [COMPANY_A, input.revisionId, sizeSpec.id, specSizeIds.get(size), pomRow.id, pom.values[size]]);
      }
    }
    for (const [displayOrder, workProcess] of fixture.processes.entries()) {
      await client.query(`
        INSERT INTO public.work_order_processes(
          company_id,revision_id,process_type_code,process_name_snapshot,partner_name_snapshot,
          quantity,due_date,unit_code,unit_price,amount,memo,status,display_order
        ) VALUES($1,$2::uuid,$3,$4,$5,$6,$7::date,'ea',0,0,$8,'ready',$9)
      `, [COMPANY_A, input.revisionId, workProcess.typeCode, workProcess.name,
        workProcess.partnerName, fixture.totalQuantity, workProcess.dueDate, workProcess.memo, displayOrder]);
    }
    const image = (await client.query(`
      INSERT INTO public.work_order_images(
        company_id,work_order_id,storage_object_key,original_filename,mime_type,size_bytes,
        content_sha256,title,display_order,is_current_representative,created_by_member_id
      ) VALUES($1,$2::uuid,$3,$4,$5,$6,$7,$8,0,true,$9) RETURNING id
    `, [COMPANY_A, input.workOrderId, input.imageKey, input.imageFilename,
      input.imageMimeType, input.imageBytes.byteLength, sha256(input.imageBytes), fixture.image.title,
      input.actor.companyMemberId])).rows[0];
    await client.query(`
      INSERT INTO public.work_order_revision_images(
        company_id,revision_id,image_id,display_order,is_representative,
        filename_snapshot,mime_type_snapshot,storage_object_key_snapshot
      ) VALUES($1,$2::uuid,$3::uuid,0,true,$4,$5,$6)
    `, [COMPANY_A, input.revisionId, image.id, input.imageFilename, input.imageMimeType, input.imageKey]);
    await client.query("COMMIT");
    return { imageId: String(image.id) };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

function issueRequestBody(target, issueNote = "공장 전달용 작업지시서 최초 발행") {
  return {
    clientRequestId: "alpha42-realistic-revision-issue-v1",
    expectedWorkOrderVersion: 1,
    expectedRevisionVersion: 1,
    expectedRevisionId: target.revisionId,
    issueNote,
  };
}

async function issueDraft(server, actor, target) {
  const result = await apiRequest(server, `/api/v2/work-orders/${target.workOrderId}/revisions/issue`, {
    actor,
    method: "POST",
    headers: { "Idempotency-Key": "alpha42-realistic-revision-issue-v1" },
    body: issueRequestBody(target),
  });
  const data = assertOk(result);
  assert.equal(data.nextVersion, 2, "issue-version-mismatch");
  assert.equal(data.result.status, "issued", "issue-status-mismatch");
  assert.equal(data.result.revisionStatus, "finalized", "issue-revision-status-mismatch");
  return data.result;
}

async function verifyIssueApiIdempotency(client, server, actor, target) {
  const before = await loadTargetMutationLedger(client, actor, target);
  const replay = await apiRequest(server, `/api/v2/work-orders/${target.workOrderId}/revisions/issue`, {
    actor,
    method: "POST",
    headers: { "Idempotency-Key": "alpha42-realistic-revision-issue-v1" },
    body: issueRequestBody(target),
  });
  assert.equal(replay.response.status, 200, "issue-idempotent-replay-status-mismatch");
  assert.equal(replay.response.headers.get("X-WAFL-Idempotent-Replay"), "1", "issue-idempotent-replay-header-missing");
  const conflict = await apiRequest(server, `/api/v2/work-orders/${target.workOrderId}/revisions/issue`, {
    actor,
    method: "POST",
    headers: { "Idempotency-Key": "alpha42-realistic-revision-issue-v1" },
    body: issueRequestBody(target, "공장 전달용 작업지시서 변경 요청"),
  });
  assert.equal(conflict.response.status, 409, "issue-api-conflict-status-mismatch");
  assert.equal(conflict.body?.error?.code, "CONFLICT", "issue-api-conflict-code-mismatch");
  const after = await loadTargetMutationLedger(client, actor, target);
  assert.deepEqual(after, before, "issue-api-idempotency-mutated-ledger");
  return { expected: "409 CONFLICT", actual: "409 CONFLICT", deltaZero: true };
}

async function loadPreview(server, actor, target) {
  const result = await apiRequest(server, `/api/v2/work-orders/${target.workOrderId}/revisions/${target.revisionId}/preview`, { actor });
  const preview = assertOk(result);
  assert.equal(preview.header.workOrderId, target.workOrderId);
  assert.equal(preview.header.revisionId, target.revisionId);
  assert.equal(preview.header.productName, fixture.productName);
  assert.ok(preview.header.factoryDeliveryMemo?.includes(fixture.factoryName), "factory-name-not-visible");
  return preview;
}

async function loadAssetManifest(client, revisionId) {
  return readOnly(client, async () => (await client.query(`
    SELECT 'image' AS asset_type,ri.image_id AS revision_asset_id,ri.company_id,
           ri.filename_snapshot,ri.mime_type_snapshot,ri.storage_object_key_snapshot,
           ri.display_order,ri.is_representative,true AS include_in_document,
           i.size_bytes AS source_size_bytes,i.content_sha256 AS source_content_sha256
    FROM public.work_order_revision_images ri JOIN public.work_order_images i
      ON i.company_id=ri.company_id AND i.id=ri.image_id
    WHERE ri.company_id=$1 AND ri.revision_id=$2::uuid
    ORDER BY ri.display_order,ri.image_id
  `, [COMPANY_A, revisionId])).rows.map((row) => ({
    assetType: row.asset_type,
    revisionAssetId: String(row.revision_asset_id),
    companyId: String(row.company_id),
    filename: String(row.filename_snapshot),
    mimeType: String(row.mime_type_snapshot),
    storageObjectKeySnapshot: String(row.storage_object_key_snapshot),
    displayOrder: Number(row.display_order),
    isRepresentative: Boolean(row.is_representative),
    includeInDocument: Boolean(row.include_in_document),
    sourceSizeBytes: Number(row.source_size_bytes),
    sourceContentSha256: String(row.source_content_sha256),
  })));
}

async function prepareGenerationAndToken(client, input) {
  const requestSha = sha256(JSON.stringify({
    companyId: COMPANY_A,
    workOrderId: input.target.workOrderId,
    revisionId: input.target.revisionId,
    documentType: DOCUMENT_TYPE,
    embeddedQrPolicy: input.snapshot.embeddedQrPolicy,
  }));
  const scopedKey = scopeEmbeddedQrIdempotencyKey(sessionSecret(), {
    companyId: COMPANY_A, revisionId: input.target.revisionId,
    commandCode: GENERATION_COMMAND, idempotencyKey: GENERATION_IDEMPOTENCY_KEY,
  });
  await client.query("BEGIN; SET LOCAL ROLE wafl_v2_tenant_runtime");
  try {
    await tenantClaims(client, input.actor, GENERATION_CORRELATION_ID);
    const reserved = await client.query(`
      INSERT INTO public.work_order_command_receipts(
        company_id,command_code,idempotency_key,request_sha256,correlation_id
      ) VALUES($1,$2,$3,$4,$5)
      ON CONFLICT(company_id,command_code,idempotency_key) DO NOTHING
    `, [COMPANY_A, GENERATION_COMMAND, scopedKey, requestSha, GENERATION_CORRELATION_ID]);
    if (reserved.rowCount === 0) {
      const receipt = (await client.query(`
        SELECT request_sha256,result_generated_document_id,result_entity_version
        FROM public.work_order_command_receipts
        WHERE company_id=$1 AND command_code=$2 AND idempotency_key=$3
        FOR UPDATE
      `, [COMPANY_A, GENERATION_COMMAND, scopedKey])).rows[0];
      assert.ok(receipt, "generation-replay-receipt-missing");
      assert.equal(receipt.request_sha256, requestSha, "IDEMPOTENCY_CONFLICT");
      assert.ok(receipt.result_generated_document_id, "IDEMPOTENCY_RECEIPT_INCOMPLETE");
      const document = (await client.query(`
        SELECT id,generation_no,status FROM public.generated_documents
        WHERE company_id=$1 AND id=$2::uuid
      `, [COMPANY_A, receipt.result_generated_document_id])).rows[0];
      assert.ok(document, "IDEMPOTENCY_DOCUMENT_MISSING");
      const token = (await client.query(`
        SELECT id,expires_at FROM public.document_access_tokens
        WHERE company_id=$1 AND generated_document_id=$2::uuid AND token_purpose='embedded_qr'
      `, [COMPANY_A, document.id])).rows[0];
      assert.ok(token, "IDEMPOTENCY_EMBEDDED_TOKEN_MISSING");
      const rawToken = deriveEmbeddedQrOpaqueToken(sessionSecret(), {
        companyId: COMPANY_A, generatedDocumentId: String(document.id),
        commandCode: EMBEDDED_TOKEN_COMMAND, idempotencyKey: GENERATION_IDEMPOTENCY_KEY,
      });
      await client.query("COMMIT");
      return {
        replay: true,
        generatedDocumentId: String(document.id),
        generationNo: Number(document.generation_no),
        tokenId: String(token.id), rawToken,
        tokenHash: sha256(Buffer.from(rawToken, "utf8")), scopedKey,
      };
    }
    assert.equal(reserved.rowCount, 1, "generation-receipt-reservation-invalid");
    const source = (await client.query(`
      SELECT w.id,r.id AS revision_id,w.document_number_base,r.revision_no
      FROM public.work_orders w JOIN public.work_order_revisions r
        ON r.company_id=w.company_id AND r.id=w.current_revision_id
      WHERE w.company_id=$1 AND w.id=$2::uuid AND r.id=$3::uuid
        AND w.status='issued' AND r.revision_status='finalized'
      FOR SHARE OF w,r
    `, [COMPANY_A, input.target.workOrderId, input.target.revisionId])).rows[0];
    assert.ok(source?.document_number_base, "issued-source-not-ready");
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1 || ':' || $2::text || ':' || $3,0))", [COMPANY_A, input.target.revisionId, DOCUMENT_TYPE]);
    const generationNo = Number((await client.query(`
      SELECT COALESCE(MAX(generation_no),0)+1 AS generation_no
      FROM public.generated_documents
      WHERE company_id=$1 AND work_order_revision_id=$2::uuid AND document_type=$3
    `, [COMPANY_A, input.target.revisionId, DOCUMENT_TYPE])).rows[0].generation_no);
    const document = (await client.query(`
      INSERT INTO public.generated_documents(
        company_id,work_order_id,work_order_revision_id,document_type,generation_no,
        display_document_number,status,renderer_version,dto_schema_version,snapshot
      ) VALUES($1,$2::uuid,$3::uuid,$4,$5,$6,'pending',$7,$8,$9::jsonb)
      RETURNING id,generation_no,status
    `, [COMPANY_A, input.target.workOrderId, input.target.revisionId, DOCUMENT_TYPE,
      generationNo, input.preview.document.displayDocumentNumber, input.snapshot.rendererVersion,
      input.snapshot.dtoSchemaVersion, input.canonicalSnapshot])).rows[0];
    assert.match(String(document.id), UUID_PATTERN, "db-generated-document-id-invalid");
    const rawToken = deriveEmbeddedQrOpaqueToken(sessionSecret(), {
      companyId: COMPANY_A, generatedDocumentId: String(document.id),
      commandCode: EMBEDDED_TOKEN_COMMAND, idempotencyKey: GENERATION_IDEMPOTENCY_KEY,
    });
    const tokenHash = sha256(Buffer.from(rawToken, "utf8"));
    const token = (await client.query(`
      INSERT INTO public.document_access_tokens(
        company_id,generated_document_id,token_hash,expires_at,token_purpose
      ) VALUES($1,$2::uuid,$3::char(64),$4::timestamptz,'embedded_qr')
      RETURNING id,expires_at,token_purpose
    `, [COMPANY_A, document.id, tokenHash, input.expiresAt])).rows[0];
    assert.equal(token.token_purpose, "embedded_qr", "embedded-token-purpose-mismatch");
    const linked = await client.query(`
      UPDATE public.work_order_command_receipts
      SET work_order_id=$4::uuid,result_revision_id=$5::uuid,
          result_generated_document_id=$6::uuid,result_entity_version=$7
      WHERE company_id=$1 AND command_code=$2 AND idempotency_key=$3
    `, [COMPANY_A, GENERATION_COMMAND, scopedKey, input.target.workOrderId,
      input.target.revisionId, document.id, generationNo]);
    assert.equal(linked.rowCount, 1, "generation-receipt-link-failed");
    await client.query("COMMIT");
    return {
      replay: false,
      generatedDocumentId: String(document.id), generationNo,
      tokenId: String(token.id), rawToken, tokenHash, scopedKey,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function verifyGenerationRequestShaConflict(client, input) {
  const changedSnapshot = {
    ...input.snapshot,
    embeddedQrPolicy: {
      ...input.snapshot.embeddedQrPolicy,
      qrPlacementVersion: "cover-top-right/conflict-proof",
    },
  };
  let actual = null;
  try {
    await prepareGenerationAndToken(client, {
      ...input,
      snapshot: changedSnapshot,
      canonicalSnapshot: serializeWorkOrderIssuedPdfSnapshot(changedSnapshot),
    });
  } catch (error) {
    actual = error instanceof Error ? error.message : "unknown";
  }
  assert.equal(actual, "IDEMPOTENCY_CONFLICT", "generation-request-sha-conflict-code-mismatch");
  return { expected: "IDEMPOTENCY_CONFLICT", actual, deltaZero: true };
}

async function finalizeGeneration(client, input) {
  await client.query("BEGIN; SET LOCAL ROLE wafl_v2_tenant_runtime");
  try {
    await tenantClaims(client, input.actor, `${GENERATION_CORRELATION_ID}-finalize`);
    const updated = await client.query(`
      UPDATE public.generated_documents
      SET status='generated',storage_object_key=$4,file_size_bytes=$5,
          content_sha256=$6,generated_at=$7::timestamptz,updated_at=$7::timestamptz
      WHERE company_id=$1 AND id=$2::uuid AND work_order_revision_id=$3::uuid AND status='pending'
    `, [COMPANY_A, input.generatedDocumentId, input.target.revisionId, input.objectKey,
      input.pdf.fileSizeBytes, input.pdf.contentSha256, input.generatedAt]);
    assert.equal(updated.rowCount, 1, "generated-document-finalize-failed");
    for (const [commandCode, changeSummary] of [
      ["pdf.generated", "Generated immutable factory instruction PDF"],
      ["pdf.embedded_qr_created", "Created hash-only embedded QR access token"],
    ]) {
      const event = await client.query(`
        INSERT INTO public.domain_events(
          company_id,entity_type,entity_id,command_code,actor_member_id,
          correlation_id,change_summary,metadata,schema_version
        ) VALUES($1,'generated_document',$2,$3,$4,$5,$6,$7::jsonb,1)
      `, [COMPANY_A, input.generatedDocumentId, commandCode, input.actor.companyMemberId,
        `${GENERATION_CORRELATION_ID}-${commandCode}`, changeSummary, JSON.stringify({
          workOrderId: input.target.workOrderId,
          revisionId: input.target.revisionId,
          documentType: DOCUMENT_TYPE,
          generationNo: input.generationNo,
          displayDocumentNumber: input.preview.document.displayDocumentNumber,
          rendererVersion: input.snapshot.rendererVersion,
          dtoSchemaVersion: input.snapshot.dtoSchemaVersion,
          ...(commandCode === "pdf.generated"
            ? { fileSizeBytes: input.pdf.fileSizeBytes, contentSha256: input.pdf.contentSha256 }
            : { tokenPurpose: "embedded_qr", expiresAt: input.expiresAt }),
        })]);
      assert.equal(event.rowCount, 1, `${commandCode}-event-failed`);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function redeemAndReadPdf(server, rawToken, expectedPdf, r2Audit) {
  const exchanged = await apiRequest(server, "/api/public/document-viewer/session", {
    method: "POST", body: { token: rawToken },
  });
  assert.equal(exchanged.response.status, 200, "embedded-token-exchange-failed");
  const cookie = exchanged.response.headers.get("set-cookie");
  assert.ok(cookie?.includes("HttpOnly") && /SameSite=Lax/i.test(cookie), "viewer-cookie-policy-mismatch");
  recordR2Call(r2Audit, "pdf", "get");
  const pdfResponse = await fetch(`${server.baseUrl}/api/public/document-viewer/file`, {
    headers: { Cookie: cookie.split(";", 1)[0] },
  });
  assert.equal(pdfResponse.status, 200, "embedded-token-pdf-get-failed");
  const bytes = Buffer.from(await pdfResponse.arrayBuffer());
  assert.equal(bytes.byteLength, expectedPdf.fileSizeBytes, "viewer-pdf-size-mismatch");
  assert.equal(sha256(bytes), expectedPdf.contentSha256, "viewer-pdf-hash-mismatch");
}

async function verifyInvalidTokenAndTenantIsolation(client, server, input) {
  const tamperedToken = `${input.rawToken.slice(0, -1)}${input.rawToken.endsWith("A") ? "B" : "A"}`;
  const invalid = await apiRequest(server, "/api/public/document-viewer/session", {
    method: "POST",
    body: { token: tamperedToken },
  });
  assertPublicViewerNotFoundResponse({ status: invalid.response.status, body: invalid.body }, [
    input.rawToken,
    tamperedToken,
    input.generatedDocumentId,
    input.objectKey,
    input.tokenHash,
    COMPANY_A,
  ]);
  assertPublicPayloadSafe(invalid.body, [
    input.rawToken,
    tamperedToken,
    input.generatedDocumentId,
    input.workOrderId,
    input.revisionId,
    input.objectKey,
    input.tokenHash,
    COMPANY_A,
  ]);

  const actors = {
    A: input.actor,
    B: await companyActor(client, COMPANY_B),
    H: await companyActor(client, COMPANY_H),
    C: await companyActor(client, COMPANY_C),
  };
  const visibility = {};
  for (const [key, actor] of Object.entries(actors)) {
    visibility[key] = await tenantTargetVisibility(client, actor, input.target, input.generatedDocumentId);
  }
  assert.deepEqual(visibility.A, { work_orders: 1, revisions: 1, documents: 1, tokens: 1 }, "company-a-target-visibility-mismatch");
  for (const key of ["B", "H", "C"]) {
    assert.deepEqual(visibility[key], { work_orders: 0, revisions: 0, documents: 0, tokens: 0 }, `company-${key}-target-leak`);
  }

  for (const key of ["B", "H"]) {
    const result = await apiRequest(server, `/api/v2/work-orders/documents/${input.generatedDocumentId}/access-tokens`, { actor: actors[key] });
    assertWorkspaceNotFoundResponse({ status: result.response.status, body: result.body }, [
      input.generatedDocumentId,
      input.objectKey,
      input.tokenHash,
      COMPANY_A,
    ]);
  }
  const companyC = await apiRequest(server, `/api/v2/work-orders/documents/${input.generatedDocumentId}/access-tokens`, { actor: actors.C });
  assertWorkspaceForbiddenResponse({ status: companyC.response.status, body: companyC.body }, [
    input.generatedDocumentId,
    input.objectKey,
    input.tokenHash,
    COMPANY_A,
  ]);
  return {
    invalidToken: { expected: "404 NOT_FOUND", actual: "404 NOT_FOUND", deltaZero: true },
    tenantIsolation: { expected: "B/H 404 NOT_FOUND; C 403 FORBIDDEN", actual: "B/H 404 NOT_FOUND; C 403 FORBIDDEN", deltaZero: true },
  };
}

async function loadTargetAudit(client) {
  return readOnly(client, async () => {
    const row = (await client.query(`
      SELECT w.id AS work_order_id,w.status,w.entity_version AS work_order_version,
             w.document_number_base,r.id AS revision_id,r.revision_status,
             r.entity_version AS revision_version,
             (SELECT count(*)::integer FROM public.work_order_material_lines m WHERE m.company_id=w.company_id AND m.revision_id=r.id) AS materials,
             (SELECT count(*)::integer FROM public.work_order_material_lines m WHERE m.company_id=w.company_id AND m.revision_id=r.id AND m.material_type='fabric') AS fabric,
             (SELECT count(*)::integer FROM public.work_order_material_lines m WHERE m.company_id=w.company_id AND m.revision_id=r.id AND m.material_type='accessory') AS accessory,
             (SELECT count(*)::integer FROM public.work_order_colors c WHERE c.company_id=w.company_id AND c.revision_id=r.id) AS colors,
             (SELECT count(*)::integer FROM public.work_order_sizes s WHERE s.company_id=w.company_id AND s.revision_id=r.id) AS sizes,
             (SELECT count(*)::integer FROM public.color_size_quantities q WHERE q.company_id=w.company_id AND q.revision_id=r.id) AS matrix_rows,
             (SELECT coalesce(sum(quantity),0)::integer FROM public.color_size_quantities q WHERE q.company_id=w.company_id AND q.revision_id=r.id) AS matrix_total,
             (SELECT count(*)::integer FROM public.work_order_size_spec_poms p WHERE p.company_id=w.company_id AND p.revision_id=r.id) AS spec_poms,
             (SELECT count(*)::integer FROM public.work_order_size_spec_values v WHERE v.company_id=w.company_id AND v.revision_id=r.id) AS spec_values,
             (SELECT count(*)::integer FROM public.work_order_processes p WHERE p.company_id=w.company_id AND p.revision_id=r.id) AS processes,
             (SELECT count(*)::integer FROM public.work_order_images i WHERE i.company_id=w.company_id AND i.work_order_id=w.id) AS images,
             (SELECT count(*)::integer FROM public.work_order_revision_images i WHERE i.company_id=w.company_id AND i.revision_id=r.id) AS revision_images,
             (SELECT count(*)::integer FROM public.generated_documents g WHERE g.company_id=w.company_id AND g.work_order_revision_id=r.id) AS documents,
             (SELECT count(*)::integer FROM public.generated_documents g WHERE g.company_id=w.company_id AND g.work_order_revision_id=r.id AND g.status='generated') AS generated,
             (SELECT count(*)::integer FROM public.document_access_tokens t JOIN public.generated_documents g ON g.company_id=t.company_id AND g.id=t.generated_document_id WHERE g.company_id=w.company_id AND g.work_order_revision_id=r.id AND t.token_purpose='embedded_qr') AS embedded_tokens,
             (SELECT count(*)::integer FROM public.work_order_command_receipts x WHERE x.company_id=w.company_id AND x.work_order_id=w.id) AS receipts,
             (SELECT count(*)::integer FROM public.work_order_command_receipts x WHERE x.company_id=w.company_id AND x.work_order_id=w.id AND x.result_generated_document_id IS NULL AND x.command_code=$3) AS incomplete_generation_receipts
      FROM public.work_orders w JOIN public.work_order_revisions r
        ON r.company_id=w.company_id AND r.id=w.current_revision_id
      WHERE w.company_id=$1 AND w.legacy_source_id=$2
    `, [COMPANY_A, fixture.legacySourceId, GENERATION_COMMAND])).rows[0];
    const generated = row ? (await client.query(`
      SELECT g.id,g.storage_object_key,g.file_size_bytes,g.content_sha256,g.status,
             t.id AS token_id,t.token_purpose,t.expires_at,t.access_count,
             (SELECT count(*)::integer FROM public.domain_events e
              WHERE e.company_id=g.company_id AND e.entity_type='generated_document' AND e.entity_id=g.id::text) AS generation_events
      FROM public.generated_documents g JOIN public.document_access_tokens t
        ON t.company_id=g.company_id AND t.generated_document_id=g.id AND t.token_purpose='embedded_qr'
      WHERE g.company_id=$1 AND g.work_order_revision_id=$2::uuid
    `, [COMPANY_A, row.revision_id])).rows[0] : null;
    return { row, generated };
  });
}

async function runRuntime(client, config, state, { continuation = false } = {}) {
  const retained = continuation ? assertContinuationPreflightState(state) : null;
  if (!continuation) assertPreflightState(state, 0);
  const before = state.counts;
  const a30Baseline = a30FactSnapshot(state);
  const r2Audit = createR2CallAudit();
  let server;
  try {
    let target;
    if (continuation) {
      target = { workOrderId: String(retained.work_order_id), revisionId: String(retained.revision_id) };
    } else {
      server = await startServer(CREATE_APPROVAL);
      target = await createDraft(server, state.actor);
      await stopServer(server); server = null;
    }

    const image = await prepareAlpha42RepresentativeImage({ sourcePath: fixture.image.sourcePath });
    const imageKey = `companies/${COMPANY_A}/workorders/${target.workOrderId}/design/${image.contentSha256.slice(0, 24)}${image.extension}`;
    await assertR2Absent(config, imageKey, r2Audit, "image");
    await r2PutOnce(config, imageKey, image.bytes, image.mimeType, r2Audit, "image");
    await verifyR2Object(config, imageKey, image.bytes, image.mimeType, r2Audit, "image");
    await insertFixtureContent(client, {
      ...target,
      actor: state.actor,
      imageKey,
      imageBytes: image.bytes,
      imageFilename: image.filename,
      imageMimeType: image.mimeType,
    });

    server = await startServer(ISSUE_APPROVAL);
    const issue = await issueDraft(server, state.actor, target);
    const issueApiIdempotency = await verifyIssueApiIdempotency(client, server, state.actor, target);
    const preview = await loadPreview(server, state.actor, target);
    await stopServer(server); server = null;
    assert.equal(issue.displayDocumentNumber, preview.document.displayDocumentNumber, "issued-number-mismatch");

    const assetManifest = await loadAssetManifest(client, target.revisionId);
    assert.equal(assetManifest.length, 1, "representative-asset-count-mismatch");
    const representative = selectRepresentativeAsset(assetManifest);
    assert.ok(representative, "representative-asset-missing");
    const imageResponse = await r2Get(config, representative.storageObjectKeySnapshot, r2Audit, "image");
    const resolvedImage = Buffer.from(await imageResponse.arrayBuffer());
    assert.equal(sha256(resolvedImage), representative.sourceContentSha256, "representative-image-hash-mismatch");
    const representativeImageDataUrl = `data:${representative.mimeType};base64,${resolvedImage.toString("base64")}`;

    const snapshotCreatedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1_000).toISOString();
    const snapshot = createWorkOrderIssuedPdfSnapshot({
      companyId: COMPANY_A,
      requestedWorkOrderId: target.workOrderId,
      requestedRevisionId: target.revisionId,
      documentType: DOCUMENT_TYPE,
      preview,
      assetManifest,
      snapshotCreatedAt,
      embeddedQrPolicy: {
        tokenPurpose: "embedded_qr", expiresAt,
        qrPolicyVersion: "wafl-embedded-qr/1",
        viewerOriginPolicy: "controlled-fragment-viewer",
        qrPlacementVersion: "cover-top-right/1",
      },
    });
    const canonicalSnapshot = serializeWorkOrderIssuedPdfSnapshot(snapshot);
    assert.ok(!canonicalSnapshot.includes("#t="), "snapshot-viewer-token-persistence-forbidden");
    const prepared = await prepareGenerationAndToken(client, {
      actor: state.actor, target, preview, snapshot, canonicalSnapshot, expiresAt,
    });
    const viewerUrl = `${config.viewerOrigin}/v#t=${prepared.rawToken}`;
    const snapshotSha256 = hashWorkOrderIssuedPdfSnapshot(snapshot);
    const objectKey = createWorkOrderPdfStorageKey({
      companyId: COMPANY_A, workOrderId: target.workOrderId, pdfId: prepared.generatedDocumentId,
    });
    const runToken = crypto.randomBytes(16).toString("hex");
    await writeLocalIssuedPdfRenderInput(runToken, {
      snapshot,
      canonicalSnapshotJson: canonicalSnapshot,
      snapshotSha256,
      objectKeyPlan: objectKey,
      representativeImageDataUrl,
    });
    server = await startServer(VIEWER_APPROVAL);
    const renderer = new LocalChromiumIssuedWorkOrderPdfRenderer();
    const pdf = await renderer.render({
      snapshot,
      canonicalSnapshotJson: canonicalSnapshot,
      snapshotSha256,
      outputFileName: `${preview.document.displayDocumentNumber}.pdf`,
      renderUrl: `${server.baseUrl}/dev/workorder-pdf-render/${runToken}`,
      embeddedQrContext: { viewerUrl, expiresAt, label: "문서 보기", purpose: "embedded_qr" },
      options: { printBackground: true, preferCssPageSize: true, maxFileSizeBytes: 10 * 1024 * 1024 },
    });
    assert.equal(pdf.embeddedQrVisible, true, "embedded-qr-not-visible");
    assert.ok(pdf.pageCount >= 1 && pdf.pageOrientations[0] === "landscape", "pdf-orientation-invalid");
    assert.equal(pdf.blankPageCount, 0, "pdf-blank-page-detected");
    assert.equal(pdf.clippingViolationCount, 0, "pdf-clipping-detected");
    assert.notEqual(objectKey, a30Baseline.storageObjectKey, "a30fact-r2-object-overwrite-forbidden");
    await assertR2Absent(config, objectKey, r2Audit, "pdf");
    await r2PutOnce(config, objectKey, pdf.pdf, "application/pdf", r2Audit, "pdf");
    await verifyR2Object(config, objectKey, pdf.pdf, "application/pdf", r2Audit, "pdf");
    const generatedAt = new Date().toISOString();
    await finalizeGeneration(client, {
      actor: state.actor, target, preview, snapshot, prepared, generatedDocumentId: prepared.generatedDocumentId,
      generationNo: prepared.generationNo, objectKey, pdf, expiresAt, generatedAt,
    });
    await redeemAndReadPdf(server, prepared.rawToken, pdf, r2Audit);
    const noOpBefore = await loadTargetMutationLedger(client, state.actor, target);
    const noOpR2Before = snapshotR2CallAudit(r2Audit);
    const viewerAssertions = await verifyInvalidTokenAndTenantIsolation(client, server, {
      actor: state.actor,
      target,
      rawToken: prepared.rawToken,
      tokenHash: prepared.tokenHash,
      generatedDocumentId: prepared.generatedDocumentId,
      workOrderId: target.workOrderId,
      revisionId: target.revisionId,
      objectKey,
    });
    await stopServer(server); server = null;
    const replay = await prepareGenerationAndToken(client, {
      actor: state.actor, target, preview, snapshot, canonicalSnapshot, expiresAt,
    });
    assert.equal(replay.replay, true, "generation-replay-not-noop");
    assert.equal(replay.generatedDocumentId, prepared.generatedDocumentId, "generation-replay-identity-mismatch");
    assert.equal(replay.tokenId, prepared.tokenId, "generation-replay-token-mismatch");
    const generationConflict = await verifyGenerationRequestShaConflict(client, {
      actor: state.actor, target, preview, snapshot, canonicalSnapshot, expiresAt,
    });
    const noOpAfter = await loadTargetMutationLedger(client, state.actor, target);
    assert.deepEqual(noOpAfter, noOpBefore, "no-op-verification-mutated-target-ledger");
    assert.deepEqual(snapshotR2CallAudit(r2Audit), noOpR2Before, "no-op-verification-made-r2-request");

    const afterState = await loadPreflightState(client);
    const audit = await loadTargetAudit(client);
    assert.deepEqual(a30FactSnapshot(afterState), a30Baseline, "a30fact-baseline-mutated");
    assert.equal(r2Audit.putKeys.includes(a30Baseline.storageObjectKey), false, "a30fact-r2-object-targeted");
    assert.equal(new Set(r2Audit.putKeys).size, 2, "r2-put-key-uniqueness-mismatch");
    assertR2CallBudget(r2Audit);
    assert.equal(Number(afterState.counts.work_orders), Number(before.work_orders) + (continuation ? 0 : 1));
    assert.equal(Number(afterState.counts.revisions), Number(before.revisions) + (continuation ? 0 : 1));
    assert.equal(Number(afterState.counts.materials), Number(before.materials) + 6);
    assert.equal(Number(afterState.counts.colors), Number(before.colors) + 3);
    assert.equal(Number(afterState.counts.sizes), Number(before.sizes) + 3);
    assert.equal(Number(afterState.counts.matrix), Number(before.matrix) + 9);
    assert.equal(Number(afterState.counts.receipts), Number(before.receipts) + (continuation ? 2 : 3));
    assert.equal(Number(afterState.counts.documents), Number(before.documents) + 1);
    assert.equal(Number(afterState.counts.tokens), Number(before.tokens) + 1);
    assert.equal(Number(afterState.counts.events), Number(before.events) + (continuation ? 4 : 5));
    assert.equal(audit.row.status, "issued");
    assert.equal(audit.row.revision_status, "finalized");
    assert.equal(Number(audit.row.work_order_version), 2);
    assert.equal(Number(audit.row.revision_version), 2);
    assert.equal(Number(audit.row.materials), 6);
    assert.equal(Number(audit.row.fabric), 2);
    assert.equal(Number(audit.row.accessory), 4);
    assert.equal(Number(audit.row.matrix_total), 144);
    assert.equal(Number(audit.row.spec_poms), 5);
    assert.equal(Number(audit.row.spec_values), 15);
    assert.equal(Number(audit.row.processes), 4);
    assert.equal(Number(audit.row.images), 1);
    assert.equal(Number(audit.row.revision_images), 1);
    assert.equal(Number(audit.row.documents), 1);
    assert.equal(Number(audit.row.generated), 1);
    assert.equal(Number(audit.row.embedded_tokens), 1);
    assert.equal(Number(audit.row.receipts), 3);
    assert.equal(Number(audit.row.incomplete_generation_receipts), 0);
    assert.equal(audit.generated.status, "generated");
    assert.equal(Number(audit.generated.access_count), 1);
    assert.equal(Number(audit.generated.generation_events), 3);
    const r2Calls = snapshotR2CallAudit(r2Audit);
    const runtimeAssertions = {
      issueApiConflict: issueApiIdempotency,
      generationRequestShaConflict: generationConflict,
      invalidToken: viewerAssertions.invalidToken,
      tenantIsolation: viewerAssertions.tenantIsolation,
      a30FactUnchanged: { expected: "UNCHANGED", actual: "UNCHANGED", deltaZero: true },
      r2CallBudget: { expected: "GET image/pdf 3/3; PUT 1/1; DELETE 0", actual: "GET image/pdf 3/3; PUT 1/1; DELETE 0" },
    };
    await writeManifest({
      result: "ALPHA42_REALISTIC_ISSUED_EMBEDDED_QR_RUNTIME_PASS",
      workOrderRef: safeRef(target.workOrderId), revisionRef: safeRef(target.revisionId),
      generatedDocumentRef: safeRef(prepared.generatedDocumentId),
      displayDocumentNumber: preview.document.displayDocumentNumber,
      snapshotSha256: hashWorkOrderIssuedPdfSnapshot(snapshot),
      pdfSha256: pdf.contentSha256, fileSizeBytes: pdf.fileSizeBytes,
      pageCount: pdf.pageCount, pageOrientations: pdf.pageOrientations,
      embeddedQrVisible: pdf.embeddedQrVisible,
      duplicateGenerationNoop: true,
      runtimeAssertions,
      r2GetCount: r2Calls.totalGet, r2PutCount: r2Calls.totalPut, r2DeleteCount: r2Calls.delete,
      continuation,
      dbMutation: true, devTestFixtureMutation: true,
      productionMutation: false, partialMutation: false,
    });
    console.log("ALPHA42 REALISTIC ISSUED EMBEDDED QR RUNTIME: PASS");
    console.log(JSON.stringify({
      workOrderRef: safeRef(target.workOrderId), revisionRef: safeRef(target.revisionId),
      generatedDocumentRef: safeRef(prepared.generatedDocumentId),
      displayDocumentNumber: preview.document.displayDocumentNumber,
      pdfSha256: pdf.contentSha256, fileSizeBytes: pdf.fileSizeBytes,
      pageCount: pdf.pageCount, r2GetCount: r2Calls.totalGet,
      r2PutCount: r2Calls.totalPut, r2DeleteCount: r2Calls.delete,
      receiptDelta: continuation ? 2 : 3, eventDelta: continuation ? 4 : 5, embeddedTokenDelta: 1,
      duplicateGenerationNoop: true,
      requestShaConflict: "IDEMPOTENCY_CONFLICT",
      issueApiConflict: "409 CONFLICT",
      invalidToken: "404 NOT_FOUND",
      tenantIsolation: "B/H NOT_FOUND; C FORBIDDEN",
      a30FactUnchanged: true,
      rawTokenPersisted: false, productionMutation: false, partialMutation: false,
    }));
  } finally {
    if (server) await stopServer(server);
  }
}

async function runContinuationPreflight(config, state) {
  const retained = assertContinuationPreflightState(state);
  const image = await prepareAlpha42RepresentativeImage({ sourcePath: fixture.image.sourcePath });
  const imageKey = `companies/${COMPANY_A}/workorders/${retained.work_order_id}/design/${image.contentSha256.slice(0, 24)}${image.extension}`;
  const r2Audit = createR2CallAudit();
  await assertR2Absent(config, imageKey, r2Audit, "image");
  assert.deepEqual(snapshotR2CallAudit(r2Audit), {
    imageGet: 1, imagePut: 0,
    pdfGet: 0, pdfPut: 0,
    totalGet: 1, totalPut: 0,
    delete: 0,
  }, "continuation-preflight-r2-budget-mismatch");

  const imageTransport = {
    sourceFormat: "svg",
    finalFormat: image.extension,
    filename: image.filename,
    mimeType: image.mimeType,
    width: image.width,
    height: image.height,
    fileSizeBytes: image.fileSizeBytes,
    sourceSha256: image.sourceSha256,
    contentSha256: image.contentSha256,
    renderer: image.renderer,
    objectKeyPattern: "companies/{companyId}/workorders/{workOrderId}/design/{contentSha256Prefix}.png",
    targetObjectAbsent: true,
    priorFailedSvgObject: "ABSENT_BY_POST_FAILURE_AUDIT",
  };
  await writeManifest({
    result: "ALPHA42_CONTINUATION_PREFLIGHT_PASS",
    workOrderRef: safeRef(retained.work_order_id),
    revisionRef: safeRef(retained.revision_id),
    retainedState: {
      workOrderStatus: retained.status,
      revisionStatus: retained.revision_status,
      workOrderVersion: Number(retained.work_order_version),
      revisionVersion: Number(retained.revision_version),
      createReceipts: Number(retained.receipts),
      createEvents: Number(retained.events),
      incompleteReceipts: Number(retained.incomplete_receipts),
    },
    failureDiagnosis: {
      httpStatus: 400,
      workerCode: "WORKER_FILE_POLICY_REJECTED",
      cause: "image/svg+xml is outside the design image allowlist",
    },
    imageTransport,
    continuationStartsAt: "representative-image-upload",
    mutationBudget: continuationMutationBudget(),
    preflightR2Get: { image: 1, pdf: 0, total: 1 },
    a30FactR2Integrity: "PASS_BY_EXISTING_RUNTIME_AND_DB_METADATA_EVIDENCE",
    dbMutation: false,
    r2Mutation: false,
    productionMutation: false,
  });
  console.log("ALPHA42 RETAINED DRAFT CONTINUATION PREFLIGHT: PASS");
  console.log(JSON.stringify({
    fingerprint: REQUIRED_FINGERPRINT,
    ledger: `${state.ledger.length}/${TARGET_LEDGER}`,
    workOrderRef: safeRef(retained.work_order_id),
    revisionRef: safeRef(retained.revision_id),
    retainedState: "draft/draft 1/1",
    createReceiptEvent: "1/1",
    incompleteReceipt: 0,
    imageTransport,
    preflightR2Get: "image/pdf 1/0",
    mutationBudget: continuationMutationBudget(),
    dbMutation: false,
    r2Mutation: false,
    productionMutation: false,
  }));
}

async function main() {
  const config = guard();
  const client = new Client({ connectionString: config.databaseUrl, application_name: `alpha42-realistic-issued-${MODE}` });
  await client.connect();
  try {
    const state = await loadPreflightState(client);
    if (MODE === "preflight") {
      assertPreflightState(state, 0);
      const documentNumberPolicy = {
        method: state.settings.method,
        resultRowCount: state.settings.rowCount,
        documentCodeSanitized: state.settings.documentCode,
        businessTimezone: state.settings.businessTimezone,
        runtimeExecute: state.settingsAccess.runtime_execute,
        publicExecute: state.settingsAccess.public_execute,
        directSettingsSelect: state.settingsAccess.direct_settings_select,
      };
      const a30FactBaseline = {
        present: true,
        workOrderStatus: state.a30.status,
        revisionStatus: state.a30.revision_status,
        workOrderVersion: Number(state.a30.entity_version),
        revisionVersion: Number(state.a30.revision_version),
        generatedDocumentCount: Number(state.a30.document_count),
        generatedDocumentStatus: state.a30.generated_document_status,
        manualShareTokenCount: state.a30ManualTokens.length,
        metadataFingerprint: sha256(JSON.stringify(a30FactSnapshot(state))),
      };
      await writeManifest({
        result: "ALPHA42_RUNTIME_PREFLIGHT_PASS",
        documentNumberPolicy,
        fixtureBaseline: { matches: state.target.length, partial: false },
        a30FactBaseline,
        mutationBudget: mutationBudget(),
        dbMutation: false,
        r2Mutation: false,
      });
      console.log("ALPHA42 REALISTIC ISSUED EMBEDDED QR PREFLIGHT: PASS");
      console.log(JSON.stringify({
        fingerprint: REQUIRED_FINGERPRINT, ledger: `${state.ledger.length}/${TARGET_LEDGER}`,
        fixtureMatches: state.target.length, companyMemberReady: true,
        documentSettingsReady: true, documentNumberPolicy,
        r2TransportReady: true, viewerOriginReady: true,
        existingA30FactPreserved: true, a30FactBaseline,
        mutationBudget: mutationBudget(),
        dbMutation: false, r2Mutation: false, productionMutation: false,
      }));
      return;
    }
    if (MODE === "continuation-preflight") {
      await runContinuationPreflight(config, state);
      return;
    }
    if (MODE === "runtime") {
      await runRuntime(client, config, state);
      return;
    }
    if (MODE === "continuation") {
      await runRuntime(client, config, state, { continuation: true });
      return;
    }
    assertPreflightState(state, 1);
    const audit = await loadTargetAudit(client);
    assert.equal(audit.row.status, "issued");
    assert.equal(audit.row.revision_status, "finalized");
    assert.equal(Number(audit.row.matrix_total), 144);
    assert.equal(Number(audit.row.materials), 6);
    assert.equal(Number(audit.row.spec_poms), 5);
    assert.equal(Number(audit.row.processes), 4);
    assert.equal(Number(audit.row.embedded_tokens), 1);
    assert.equal(audit.generated.status, "generated");
    console.log("ALPHA42 REALISTIC ISSUED EMBEDDED QR AUDIT: PASS");
    console.log(JSON.stringify({
      workOrderRef: safeRef(audit.row.work_order_id),
      generatedDocumentRef: safeRef(audit.generated.id),
      matrixTotal: Number(audit.row.matrix_total), materials: Number(audit.row.materials),
      embeddedTokens: Number(audit.row.embedded_tokens), partialMutation: false,
      dbMutation: false, r2Mutation: false, productionMutation: false,
    }));
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("ALPHA42 REALISTIC ISSUED EMBEDDED QR RUNNER: FAILED", {
    mode: MODE,
    name: error instanceof Error ? error.name : "UnknownError",
    message: error instanceof Error ? error.message : "unknown",
    runnerLocation: String(error?.stack ?? "").match(/run-wafl-v2-alpha42-realistic-issued-embedded-qr-runtime\.mjs:(\d+):(\d+)/)?.[0] ?? "unknown",
  });
  process.exitCode = 1;
});
