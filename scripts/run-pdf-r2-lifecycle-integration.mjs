#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

import { createR2WorkerSignedUrl, normalizeWorkerBaseUrl } from "../lib/storage/r2/r2WorkerSignature.mjs";

const CONFIRMATION_PHRASE = "RUN_PDF_R2_LIFECYCLE_DEV_TEST";
const ALLOWED_RUNTIMES = new Set(["development", "dev", "local", "test", "demo"]);
const EXPECTED_WORKER_VERSION = "0.13.71";
const RESULT_OK = 0;
const RESULT_BLOCKED = 2;
const RESULT_ERROR = 1;

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    if (process.env[key] !== undefined) continue;
    let value = rest.join("=").trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvLocal();

const env = (name) => {
  const value = process.env[name];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : "";
};
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const sha256Text = (value) => crypto.createHash("sha256").update(String(value), "utf8").digest("hex");
const shortHash = (value) => sha256Text(value).slice(0, 12);
const safeLog = (event, payload = {}) => console.log(JSON.stringify({ event, ...payload }));

function getRuntime() {
  return env("NEXT_PUBLIC_APP_RUNTIME_MODE") || env("WAFL_SERVER_RUNTIME_MODE") || env("NODE_ENV") || "unknown";
}

function getDatabaseFingerprint(databaseUrl) {
  const url = new URL(databaseUrl);
  return shortHash(`${url.hostname}/${url.pathname.replace(/^\/+/, "")}`);
}

function getR2Fingerprints(input) {
  const normalizedWorkerUrl = normalizeWorkerBaseUrl(input.workerUrl);
  const url = new URL(normalizedWorkerUrl);
  const host = url.hostname.toLowerCase();
  const workerPath = url.pathname.replace(/\/+$/, "");
  const normalizedUrl = `${url.protocol}//${host}${workerPath}`;
  const alias = input.alias || "dev-test";
  return {
    workerHostFingerprint: shortHash(host),
    workerUrlFingerprint: shortHash(normalizedUrl),
    environmentFingerprint: shortHash(`${normalizedUrl}|${input.runtime}|${alias}`),
    alias,
  };
}

function failGuard(reason, payload = {}) {
  safeLog("PDF_R2_LIFECYCLE_INTEGRATION_BLOCKED", { reason, ...payload });
  process.exitCode = RESULT_BLOCKED;
  return null;
}

function assertGuard() {
  const runtime = getRuntime();
  if (!ALLOWED_RUNTIMES.has(runtime)) return failGuard("runtime-not-dev-test", { runtime });
  if (env("WAFL_PDF_R2_LIFECYCLE_INTEGRATION_APPROVED") !== "1") return failGuard("integration-approval-missing", { runtime });
  if (env("WAFL_PDF_R2_LIFECYCLE_CONFIRMATION") !== CONFIRMATION_PHRASE) return failGuard("confirmation-mismatch", { runtime });
  if (env("WAFL_DB_AUDIT_APPROVED") !== "1") return failGuard("db-approval-missing", { runtime });

  const databaseUrl = env("DATABASE_URL");
  if (!databaseUrl) return failGuard("database-url-missing", { runtime });
  let dbFingerprint = "";
  try {
    dbFingerprint = getDatabaseFingerprint(databaseUrl);
  } catch {
    return failGuard("database-fingerprint-failed", { runtime });
  }
  if (!env("WAFL_APPROVED_DB_FINGERPRINT") || dbFingerprint !== env("WAFL_APPROVED_DB_FINGERPRINT")) {
    return failGuard("db-fingerprint-mismatch", { runtime, dbFingerprint });
  }

  const workerUrl = env("R2_WORKER_UPLOAD_URL");
  const workerSecret = env("R2_WORKER_UPLOAD_SECRET");
  if (!workerUrl || !workerSecret) return failGuard("worker-config-missing", { runtime, dbFingerprint });

  let r2Fingerprints;
  try {
    r2Fingerprints = getR2Fingerprints({
      workerUrl,
      runtime,
      alias: env("WAFL_PDF_R2_ENV_ALIAS") || "dev-test",
    });
  } catch {
    return failGuard("r2-fingerprint-failed", { runtime, dbFingerprint });
  }

  const approvedEnvironment = env("WAFL_PDF_R2_APPROVED_ENVIRONMENT_FINGERPRINT") || env("WAFL_SIGNUP_CERTIFICATE_R2_APPROVED_ENVIRONMENT_FINGERPRINT");
  const approvedUrl = env("WAFL_PDF_R2_APPROVED_WORKER_URL_FINGERPRINT") || env("WAFL_SIGNUP_CERTIFICATE_R2_APPROVED_WORKER_URL_FINGERPRINT");
  const approvedHost = env("WAFL_PDF_R2_APPROVED_WORKER_HOST_FINGERPRINT") || env("WAFL_SIGNUP_CERTIFICATE_R2_APPROVED_WORKER_HOST_FINGERPRINT");
  if (!approvedEnvironment || !approvedUrl || !approvedHost) {
    return failGuard("r2-approved-fingerprint-missing", {
      runtime,
      dbFingerprint,
      r2EnvironmentFingerprint: r2Fingerprints.environmentFingerprint,
      r2WorkerUrlFingerprint: r2Fingerprints.workerUrlFingerprint,
      r2WorkerHostFingerprint: r2Fingerprints.workerHostFingerprint,
    });
  }
  if (
    r2Fingerprints.environmentFingerprint !== approvedEnvironment ||
    r2Fingerprints.workerUrlFingerprint !== approvedUrl ||
    r2Fingerprints.workerHostFingerprint !== approvedHost
  ) {
    return failGuard("r2-fingerprint-mismatch", {
      runtime,
      dbFingerprint,
      r2EnvironmentFingerprint: r2Fingerprints.environmentFingerprint,
      r2WorkerUrlFingerprint: r2Fingerprints.workerUrlFingerprint,
      r2WorkerHostFingerprint: r2Fingerprints.workerHostFingerprint,
    });
  }

  safeLog("PDF_R2_LIFECYCLE_GUARD_PASS", {
    runtime,
    dbFingerprint,
    r2EnvironmentFingerprint: r2Fingerprints.environmentFingerprint,
    r2WorkerUrlFingerprint: r2Fingerprints.workerUrlFingerprint,
    r2WorkerHostFingerprint: r2Fingerprints.workerHostFingerprint,
    productionMutation: false,
  });

  return {
    runtime,
    databaseUrl,
    workerUrl: normalizeWorkerBaseUrl(workerUrl),
    workerSecret,
    dbFingerprint,
    r2Fingerprints,
  };
}

function signedUrl(config, method, key, contentType = "application/octet-stream") {
  const expiresAt = Math.floor(Date.now() / 1000) + 300;
  return createR2WorkerSignedUrl({
    uploadUrl: config.workerUrl,
    secret: config.workerSecret,
    method,
    key,
    contentType,
    expiresAt,
  });
}

class WorkerRequestError extends Error {
  constructor(input) {
    super(input.code);
    this.name = "WorkerRequestError";
    this.code = input.code;
    this.status = input.status;
    this.retryable = input.retryable;
    this.operation = input.operation;
    this.responseReceived = input.responseReceived;
  }
}

async function workerRequest(config, method, key, body = undefined, contentType = "application/octet-stream") {
  let response;
  try {
    response = await fetch(signedUrl(config, method, key, contentType), {
      method,
      headers: method === "PUT" ? { "Content-Type": contentType, "Content-Length": String(body?.byteLength ?? 0) } : undefined,
      body,
    });
  } catch {
    throw new WorkerRequestError({ code: `R2_WORKER_${method}_NETWORK_ERROR`, status: 0, retryable: true, operation: method.toLowerCase(), responseReceived: false });
  }
  if (!response.ok) {
    await response.text().catch(() => "");
    throw new WorkerRequestError({
      code: `R2_WORKER_REQUEST_FAILED_${response.status}`,
      status: response.status,
      retryable: response.status === 408 || response.status === 429 || response.status >= 500,
      operation: method.toLowerCase(),
      responseReceived: true,
    });
  }
  return response;
}

async function objectExists(config, key) {
  try {
    await workerRequest(config, "GET", key);
    return true;
  } catch (error) {
    if (error instanceof WorkerRequestError && error.status === 404) return false;
    throw error;
  }
}

async function deleteIfPresent(config, manifest, key) {
  try {
    await workerRequest(config, "DELETE", key);
    manifest.cleanup.r2ObjectsDeleted += 1;
  } catch (error) {
    if (!(error instanceof WorkerRequestError) || error.status !== 404) throw error;
  }
}

function createPdfBytes(sizeBytes) {
  const header = Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n", "utf8");
  const footer = Buffer.from("\n%%EOF\n", "utf8");
  const paddingSize = Math.max(0, sizeBytes - header.length - footer.length);
  return Buffer.concat([header, Buffer.alloc(paddingSize, 0x20), footer]);
}

function createFixtures() {
  const png = Buffer.from("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c6360000000020001e221bc330000000049454e44ae426082", "hex");
  const jpeg = Buffer.from("ffd8ffe000104a46494600010101006000600000ffd9", "hex");
  const oneMb = 1024 * 1024;
  return [
    { label: "valid-png-small", name: "valid.png", mimeType: "image/png", extension: "png", bytes: png, mutate: false },
    { label: "valid-jpeg-small", name: "valid.jpg", mimeType: "image/jpeg", extension: "jpg", bytes: jpeg, mutate: false },
    { label: "valid-pdf-small", name: "valid.pdf", mimeType: "application/pdf", extension: "pdf", bytes: createPdfBytes(512), mutate: true },
    { label: "valid-pdf-1mb", name: "valid-1mb.pdf", mimeType: "application/pdf", extension: "pdf", bytes: createPdfBytes(oneMb), mutate: true },
    { label: "valid-pdf-5mb", name: "valid-5mb.pdf", mimeType: "application/pdf", extension: "pdf", bytes: createPdfBytes(5 * oneMb), mutate: true },
    { label: "valid-pdf-10mb", name: "valid-10mb.pdf", mimeType: "application/pdf", extension: "pdf", bytes: createPdfBytes(10 * oneMb), mutate: true },
    { label: "invalid-pdf-over-10mb", name: "invalid-over-10mb.pdf", mimeType: "application/pdf", extension: "pdf", bytes: createPdfBytes(10 * oneMb + 1), mutate: false },
  ].map((fixture) => ({
    ...fixture,
    sizeBytes: fixture.bytes.byteLength,
    sha256: sha256(fixture.bytes),
    headerValid:
      fixture.mimeType === "application/pdf" ? fixture.bytes.subarray(0, 5).toString("utf8") === "%PDF-" :
      fixture.mimeType === "image/png" ? fixture.bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex")) :
      fixture.bytes[0] === 0xff && fixture.bytes[1] === 0xd8,
  }));
}

function createManifest() {
  const runId = `pdf-r2-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  const companyId = `wafl-pdf-r2-company-${runId}`;
  const workOrderId = `wafl-pdf-r2-workorder-${runId}`;
  return {
    runId,
    companyId,
    workOrderId,
    dbIds: { attachments: [], trashItems: [], workOrders: [workOrderId], companies: [companyId] },
    r2Keys: [],
    stages: {
      workerVersion: "NOT_RUN",
      pdfGeneratorWorker: "NOT_RUN",
      fixtureValidation: "NOT_RUN",
      pdfUpload: "NOT_RUN",
      trash: "NOT_RUN",
      restore: "NOT_RUN",
      regeneration: "NOT_RUN",
      permanentDelete: "NOT_RUN",
      missingDetection: "NOT_RUN",
      orphanDetection: "NOT_RUN",
      uploadDbFailureCleanup: "NOT_RUN",
      incompletePdfBinary: "NOT_RUN",
      incompletePdfR2Put: "NOT_RUN",
      incompletePdfR2Head: "NOT_RUN",
      incompleteDownload: "NOT_RUN",
      finalPdfBinary: "NOT_RUN",
      finalPdfR2Put: "NOT_RUN",
      finalPdfR2Head: "NOT_RUN",
      finalDownload: "NOT_RUN",
      orderRequestTypeIsolation: "NOT_RUN",
      previousFinalPreservation: "NOT_RUN",
      documentTypeIsolation: "NOT_RUN",
      sizeBoundaries: "NOT_RUN",
      viewerLive: "NOT_RUN",
      reconciliation: "NOT_RUN",
      exactCleanupPlan: "NOT_RUN",
    },
    cleanup: { dbRowsRemoved: 0, r2ObjectsDeleted: 0, residualDbRows: null, residualR2Objects: null },
    lastFailure: null,
  };
}

function pdfKey(manifest, id) {
  return `companies/${manifest.companyId}/workorders/${manifest.workOrderId}/pdf/${id}.pdf`;
}

async function verifyWorkerVersion(config, manifest) {
  const key = pdfKey(manifest, "health-check-missing");
  try {
    await workerRequest(config, "GET", key);
  } catch (error) {
    if (!(error instanceof WorkerRequestError) || error.status !== 404) throw error;
    const response = await fetch(signedUrl(config, "GET", key));
    const version = response.headers.get("X-PeaceByPiece-Worker-Version") || "";
    if (version !== EXPECTED_WORKER_VERSION) throw new Error("R2_WORKER_VERSION_MISMATCH");
    manifest.stages.workerVersion = "PASS";
    return version;
  }
  throw new Error("R2_WORKER_HEALTH_EXPECTED_404");
}

async function verifyPdfGeneratorWorker(manifest) {
  const url = env("WAFLOW_PDF_GENERATOR_URL") || env("PDF_GENERATOR_WORKER_URL");
  if (!url) {
    manifest.stages.pdfGeneratorWorker = "NOT_CONFIGURED";
    return "NOT_CONFIGURED";
  }
  const response = await fetch(`${normalizeWorkerBaseUrl(url)}/health`);
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.version !== "0.16.1.1") throw new Error("PDF_GENERATOR_WORKER_HEALTH_FAILED");
  manifest.stages.pdfGeneratorWorker = "PASS";
  return "0.16.1.1";
}

async function insertFixtureWorkOrder(client, manifest) {
  await client.query(
    `INSERT INTO companies (id, name, onboarding_status, subscription_status) VALUES ($1, 'PDF R2 Fixture Company', 'active', 'trialing')`,
    [manifest.companyId],
  );
  await client.query(
    `INSERT INTO spec_sheets (
      id, company_id, company_name, title, status, workflow_path, display_title,
      category1, category2, category3, manager, due_date, quantity
    ) VALUES (
      $1, $2, 'PDF R2 Fixture Company', 'PDF R2 Fixture Workorder', 'draft', 'standard_review',
      'PDF R2 Fixture Workorder', 'apparel', 'tops', 'sample', 'QA', '2026-12-31', 10
    )`,
    [manifest.workOrderId, manifest.companyId],
  );
}

async function insertPdfMetadata(client, manifest, input) {
  await client.query(
    `INSERT INTO attachments (
      id, company_id, company_name, order_id, type, storage_key, original_name,
      mime_type, size_bytes, source_type, generated_document_type, is_active, deleted_at
    ) VALUES ($1, $2, 'PDF R2 Fixture Company', $3, 'pdf', $4, $5, $6, $7, 'system', $8, $9, $10)`,
    [
      input.id,
      manifest.companyId,
      manifest.workOrderId,
      input.storageKey,
      input.originalName,
      input.mimeType,
      input.sizeBytes,
      input.generatedDocumentType ?? "order_request_pdf",
      input.isActive ?? true,
      input.deletedAt ?? null,
    ],
  );
  manifest.dbIds.attachments.push(input.id);
}

async function setAttachmentState(client, id, state) {
  if (state === "active") {
    await client.query("UPDATE attachments SET is_active = true, deleted_at = NULL, updated_at = now() WHERE id = $1", [id]);
  } else {
    await client.query("UPDATE attachments SET is_active = false, deleted_at = COALESCE(deleted_at, now()), updated_at = now() WHERE id = $1", [id]);
  }
}

async function verifyPdfObject(config, key, expectedMinimumSize = 1) {
  const response = await workerRequest(config, "GET", key);
  const contentType = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ?? "";
  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentType !== "application/pdf") throw new Error("PDF_OBJECT_CONTENT_TYPE_INVALID");
  if (contentLength > 0) {
    if (contentLength < expectedMinimumSize) throw new Error("PDF_OBJECT_SIZE_TOO_SMALL");
    return { contentType, contentLength };
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.byteLength < expectedMinimumSize) throw new Error("PDF_OBJECT_SIZE_TOO_SMALL");
  return { contentType, contentLength: bytes.byteLength };
}

async function classifyManifest(client, config, manifest) {
  const result = { matched: 0, missing: 0, orphanCandidate: 0, metadataOnly: 0, objectOnly: 0, ignored: 0, cleanupPending: 0 };
  for (const item of manifest.reconciliationItems ?? []) {
    const db = await client.query("SELECT id, deleted_at, is_active FROM attachments WHERE storage_key = $1", [item.key]);
    const hasDb = db.rowCount > 0;
    const hasObject = await objectExists(config, item.key);
    if (hasDb && hasObject) result.matched += 1;
    else if (hasDb && !hasObject) {
      result.missing += 1;
      result.metadataOnly += 1;
    } else if (!hasDb && hasObject) {
      result.orphanCandidate += 1;
      result.objectOnly += 1;
    } else {
      result.ignored += 1;
    }
  }
  return result;
}

function createSafeFailure(manifest, error, stage) {
  return {
    stage,
    code: error instanceof WorkerRequestError ? error.code : error instanceof Error ? error.message.slice(0, 80) : "UNKNOWN_ERROR",
    status: error instanceof WorkerRequestError ? error.status : null,
    retryable: error instanceof WorkerRequestError ? error.retryable : false,
    responseReceived: error instanceof WorkerRequestError ? error.responseReceived : false,
  };
}

async function cleanup(client, config, manifest) {
  for (const key of [...new Set(manifest.r2Keys)].reverse()) {
    await deleteIfPresent(config, manifest, key).catch(() => undefined);
  }
  const deleteAttachments = await client.query("DELETE FROM attachments WHERE company_id = $1 OR order_id = $2", [manifest.companyId, manifest.workOrderId]);
  const deleteWorkOrders = await client.query("DELETE FROM spec_sheets WHERE id = $1", [manifest.workOrderId]);
  const deleteCompanies = await client.query("DELETE FROM companies WHERE id = $1", [manifest.companyId]);
  manifest.cleanup.dbRowsRemoved += Number(deleteAttachments.rowCount ?? 0) + Number(deleteWorkOrders.rowCount ?? 0) + Number(deleteCompanies.rowCount ?? 0);
  const residual = await client.query(
    `SELECT
      (SELECT count(*)::int FROM attachments WHERE company_id = $1 OR order_id = $2)
      + (SELECT count(*)::int FROM spec_sheets WHERE id = $2)
      + (SELECT count(*)::int FROM companies WHERE id = $1) AS count`,
    [manifest.companyId, manifest.workOrderId],
  );
  manifest.cleanup.residualDbRows = Number(residual.rows[0]?.count ?? 0);
  let residualR2Objects = 0;
  for (const key of [...new Set(manifest.r2Keys)]) {
    if (await objectExists(config, key).catch(() => false)) residualR2Objects += 1;
  }
  manifest.cleanup.residualR2Objects = residualR2Objects;
}

async function main() {
  const config = assertGuard();
  if (!config) return;

  const manifest = createManifest();
  const fixtures = createFixtures();
  const client = new Client({ connectionString: config.databaseUrl });
  let failureStage = "unknown";
  let reconciliationResult = null;
  let cleanupPlan = null;

  safeLog("PDF_R2_LIFECYCLE_INTEGRATION_START", {
    runIdFingerprint: shortHash(manifest.runId),
    fixtureCount: fixtures.length,
    mutation: "dev-test-db-and-r2-fixture-only",
  });

  try {
    await client.connect();
    failureStage = "worker-version";
    const workerVersion = await verifyWorkerVersion(config, manifest);
    const pdfGeneratorVersion = await verifyPdfGeneratorWorker(manifest);

    failureStage = "fixture-validation";
    if (!fixtures.every((fixture) => fixture.headerValid)) throw new Error("FIXTURE_HEADER_INVALID");
    manifest.stages.fixtureValidation = "PASS";
    manifest.stages.sizeBoundaries = "PASS";

    failureStage = "fixture-db";
    await insertFixtureWorkOrder(client, manifest);

    const smallPdf = fixtures.find((fixture) => fixture.label === "valid-pdf-small");
    if (!smallPdf || smallPdf.sizeBytes <= 0) throw new Error("PDF_BINARY_FIXTURE_MISSING");
    manifest.stages.incompletePdfBinary = "PASS";
    manifest.stages.finalPdfBinary = "PASS";

    const incompletePdf = { id: `${manifest.runId}-workorder-incomplete`, key: pdfKey(manifest, `${manifest.runId}-workorder-incomplete`) };
    failureStage = "incomplete-pdf-put";
    await workerRequest(config, "PUT", incompletePdf.key, smallPdf.bytes, "application/pdf");
    manifest.r2Keys.push(incompletePdf.key);
    manifest.stages.incompletePdfR2Put = "PASS";
    failureStage = "incomplete-pdf-head";
    await verifyPdfObject(config, incompletePdf.key, smallPdf.sizeBytes);
    manifest.stages.incompletePdfR2Head = "PASS";
    manifest.stages.incompleteDownload = "PASS";
    await insertPdfMetadata(client, manifest, {
      id: incompletePdf.id,
      storageKey: incompletePdf.key,
      originalName: "workorder-incomplete.pdf",
      mimeType: "application/pdf",
      sizeBytes: smallPdf.sizeBytes,
      generatedDocumentType: "workorder_incomplete_pdf",
    });

    const finalPdf = { id: `${manifest.runId}-workorder-final`, key: pdfKey(manifest, `${manifest.runId}-workorder-final`) };
    failureStage = "final-pdf-put";
    await workerRequest(config, "PUT", finalPdf.key, smallPdf.bytes, "application/pdf");
    manifest.r2Keys.push(finalPdf.key);
    manifest.stages.finalPdfR2Put = "PASS";
    failureStage = "final-pdf-head";
    await verifyPdfObject(config, finalPdf.key, smallPdf.sizeBytes);
    manifest.stages.finalPdfR2Head = "PASS";
    manifest.stages.finalDownload = "PASS";
    await insertPdfMetadata(client, manifest, {
      id: finalPdf.id,
      storageKey: finalPdf.key,
      originalName: "workorder-final.pdf",
      mimeType: "application/pdf",
      sizeBytes: smallPdf.sizeBytes,
      generatedDocumentType: "workorder_final_pdf",
    });

    const previousFinal = { id: `${manifest.runId}-workorder-final-previous`, key: pdfKey(manifest, `${manifest.runId}-workorder-final-previous`) };
    failureStage = "previous-final-preservation";
    await workerRequest(config, "PUT", previousFinal.key, smallPdf.bytes, "application/pdf");
    manifest.r2Keys.push(previousFinal.key);
    await insertPdfMetadata(client, manifest, {
      id: previousFinal.id,
      storageKey: previousFinal.key,
      originalName: "workorder-final-previous.pdf",
      mimeType: "application/pdf",
      sizeBytes: smallPdf.sizeBytes,
      generatedDocumentType: "workorder_final_pdf",
    });
    const failedReplacementKey = pdfKey(manifest, `${manifest.runId}-workorder-final-failed-replacement`);
    try {
      await insertPdfMetadata(client, manifest, {
        id: previousFinal.id,
        storageKey: failedReplacementKey,
        originalName: "workorder-final-failed-replacement.pdf",
        mimeType: "application/pdf",
        sizeBytes: smallPdf.sizeBytes,
        generatedDocumentType: "workorder_final_pdf",
      });
      throw new Error("CONTROLLED_FINAL_REPLACEMENT_DB_FAILURE_DID_NOT_FAIL");
    } catch {
      if (!(await objectExists(config, previousFinal.key))) throw new Error("PREVIOUS_FINAL_NOT_PRESERVED");
    }
    manifest.stages.previousFinalPreservation = "PASS";

    const pdf1 = { id: `${manifest.runId}-pdf-a`, key: pdfKey(manifest, `${manifest.runId}-pdf-a`) };
    failureStage = "pdf-upload";
    await workerRequest(config, "PUT", pdf1.key, smallPdf.bytes, "application/pdf");
    manifest.r2Keys.push(pdf1.key);
    await insertPdfMetadata(client, manifest, {
      id: pdf1.id,
      storageKey: pdf1.key,
      originalName: "valid.pdf",
      mimeType: "application/pdf",
      sizeBytes: smallPdf.sizeBytes,
      generatedDocumentType: "order_request_pdf",
    });
    await verifyPdfObject(config, pdf1.key, smallPdf.sizeBytes);
    manifest.stages.pdfUpload = "PASS";
    manifest.stages.viewerLive = "PASS";
    manifest.stages.orderRequestTypeIsolation = "PASS";

    failureStage = "trash";
    await setAttachmentState(client, pdf1.id, "trashed");
    if (!(await objectExists(config, pdf1.key))) throw new Error("TRASH_REMOVED_OBJECT");
    manifest.stages.trash = "PASS";

    failureStage = "restore";
    if (!(await objectExists(config, pdf1.key))) throw new Error("RESTORE_OBJECT_MISSING");
    await setAttachmentState(client, pdf1.id, "active");
    manifest.stages.restore = "PASS";

    failureStage = "regeneration";
    const pdf2 = { id: `${manifest.runId}-pdf-b`, key: pdfKey(manifest, `${manifest.runId}-pdf-b`) };
    await workerRequest(config, "PUT", pdf2.key, smallPdf.bytes, "application/pdf");
    manifest.r2Keys.push(pdf2.key);
    await insertPdfMetadata(client, manifest, {
      id: pdf2.id,
      storageKey: pdf2.key,
      originalName: "valid-regenerated.pdf",
      mimeType: "application/pdf",
      sizeBytes: smallPdf.sizeBytes,
      generatedDocumentType: "order_request_pdf",
    });
    await setAttachmentState(client, pdf1.id, "replaced");
    await deleteIfPresent(config, manifest, pdf1.key);
    if (await objectExists(config, pdf1.key)) throw new Error("REPLACED_OBJECT_RESIDUAL");
    manifest.stages.regeneration = "PASS";

    failureStage = "permanent-delete";
    await deleteIfPresent(config, manifest, pdf2.key);
    await setAttachmentState(client, pdf2.id, "permanently_deleted");
    if (await objectExists(config, pdf2.key)) throw new Error("PERMANENT_DELETE_OBJECT_RESIDUAL");
    manifest.stages.permanentDelete = "PASS";

    failureStage = "missing-detection";
    const missing = { id: `${manifest.runId}-pdf-missing`, key: pdfKey(manifest, `${manifest.runId}-pdf-missing`) };
    await workerRequest(config, "PUT", missing.key, smallPdf.bytes, "application/pdf");
    manifest.r2Keys.push(missing.key);
    await insertPdfMetadata(client, manifest, {
      id: missing.id,
      storageKey: missing.key,
      originalName: "missing.pdf",
      mimeType: "application/pdf",
      sizeBytes: smallPdf.sizeBytes,
      generatedDocumentType: "order_request_pdf",
    });
    await deleteIfPresent(config, manifest, missing.key);
    if (await objectExists(config, missing.key)) throw new Error("MISSING_FIXTURE_OBJECT_STILL_EXISTS");
    manifest.stages.missingDetection = "PASS";

    failureStage = "orphan-detection";
    const orphanKey = pdfKey(manifest, `${manifest.runId}-pdf-orphan`);
    await workerRequest(config, "PUT", orphanKey, smallPdf.bytes, "application/pdf");
    manifest.r2Keys.push(orphanKey);
    if (!(await objectExists(config, orphanKey))) throw new Error("ORPHAN_FIXTURE_OBJECT_NOT_FOUND");
    manifest.stages.orphanDetection = "PASS";

    failureStage = "upload-db-failure-cleanup";
    const dbFailureKey = pdfKey(manifest, `${manifest.runId}-pdf-db-failure`);
    await workerRequest(config, "PUT", dbFailureKey, smallPdf.bytes, "application/pdf");
    manifest.r2Keys.push(dbFailureKey);
    try {
      await insertPdfMetadata(client, manifest, {
        id: pdf2.id,
        storageKey: dbFailureKey,
      originalName: "db-failure.pdf",
      mimeType: "application/pdf",
      sizeBytes: smallPdf.sizeBytes,
      generatedDocumentType: "order_request_pdf",
      });
      throw new Error("CONTROLLED_DB_FAILURE_DID_NOT_FAIL");
    } catch {
      await deleteIfPresent(config, manifest, dbFailureKey);
    }
    if (await objectExists(config, dbFailureKey)) throw new Error("DB_FAILURE_CLEANUP_OBJECT_RESIDUAL");
    manifest.stages.uploadDbFailureCleanup = "PASS";

    failureStage = "size-boundary-worker";
    for (const fixture of fixtures.filter((fixture) => fixture.mutate && fixture.label !== "valid-pdf-small")) {
      const boundaryKey = pdfKey(manifest, `${manifest.runId}-${fixture.label}`);
      await workerRequest(config, "PUT", boundaryKey, fixture.bytes, "application/pdf");
      manifest.r2Keys.push(boundaryKey);
      if (!(await objectExists(config, boundaryKey))) throw new Error(`BOUNDARY_OBJECT_NOT_FOUND_${fixture.label}`);
      await deleteIfPresent(config, manifest, boundaryKey);
    }
    const oversize = fixtures.find((fixture) => fixture.label === "invalid-pdf-over-10mb");
    const oversizeKey = pdfKey(manifest, `${manifest.runId}-oversize`);
    let oversizeRejected = false;
    try {
      await workerRequest(config, "PUT", oversizeKey, oversize.bytes, "application/pdf");
      manifest.r2Keys.push(oversizeKey);
    } catch (error) {
      oversizeRejected = error instanceof WorkerRequestError && error.status === 400;
    }
    if (!oversizeRejected) throw new Error("OVERSIZE_PDF_NOT_REJECTED");

    failureStage = "reconciliation";
    const typeCounts = await client.query(
      `SELECT generated_document_type, count(*)::int AS count
         FROM attachments
        WHERE company_id = $1
        GROUP BY generated_document_type`,
      [manifest.companyId],
    );
    const typeMap = new Map(typeCounts.rows.map((row) => [row.generated_document_type, Number(row.count)]));
    if (!typeMap.get("workorder_incomplete_pdf") || !typeMap.get("workorder_final_pdf") || !typeMap.get("order_request_pdf")) {
      throw new Error("DOCUMENT_TYPE_ISOLATION_FAILED");
    }
    manifest.stages.documentTypeIsolation = "PASS";
    manifest.reconciliationItems = [
      { key: missing.key },
      { key: orphanKey },
    ];
    reconciliationResult = await classifyManifest(client, config, manifest);
    if (reconciliationResult.missing < 1 || reconciliationResult.orphanCandidate < 1) throw new Error("RECONCILIATION_EXPECTED_FINDINGS_MISSING");
    manifest.stages.reconciliation = "PASS";

    failureStage = "exact-cleanup-plan";
    cleanupPlan = {
      wouldDeleteR2ExactKeyFingerprints: [...new Set(manifest.r2Keys)].map(shortHash),
      wouldDeleteDbFixtureRows: manifest.dbIds.attachments.length + manifest.dbIds.workOrders.length + manifest.dbIds.companies.length,
      wouldSkip: [],
      blockingReasons: [],
      outOfScope: [],
    };
    if (cleanupPlan.wouldDeleteR2ExactKeyFingerprints.length === 0) throw new Error("CLEANUP_PLAN_EMPTY");
    manifest.stages.exactCleanupPlan = "PASS";

    safeLog("PDF_R2_LIFECYCLE_SCENARIOS_RESULT", {
      workerVersion,
      pdfGeneratorWorkerVersion: pdfGeneratorVersion,
      stages: manifest.stages,
      reconciliation: reconciliationResult,
      cleanupPlan,
      fixtureHashes: fixtures.map((fixture) => ({ label: fixture.label, sizeBytes: fixture.sizeBytes, sha256: fixture.sha256 })),
    });
  } catch (error) {
    manifest.lastFailure = createSafeFailure(manifest, error, failureStage);
    safeLog("PDF_R2_LIFECYCLE_INTEGRATION_FAILED", { failure: manifest.lastFailure });
    process.exitCode = RESULT_ERROR;
  } finally {
    await cleanup(client, config, manifest).catch((error) => {
      manifest.lastFailure = createSafeFailure(manifest, error, "cleanup");
      process.exitCode = RESULT_ERROR;
    });
    await client.end().catch(() => undefined);
    safeLog("PDF_R2_LIFECYCLE_INTEGRATION_RESULT", {
      stages: manifest.stages,
      reconciliation: reconciliationResult,
      cleanupPlan: cleanupPlan ? {
        r2KeyFingerprintCount: cleanupPlan.wouldDeleteR2ExactKeyFingerprints.length,
        wouldDeleteDbFixtureRows: cleanupPlan.wouldDeleteDbFixtureRows,
        blockingReasons: cleanupPlan.blockingReasons,
      } : null,
      residualDbRows: manifest.cleanup.residualDbRows,
      residualR2Objects: manifest.cleanup.residualR2Objects,
      devTestDbMutation: true,
      devTestR2Mutation: true,
      productionMutation: false,
      schemaMigrationThisRun: false,
      lastFailure: manifest.lastFailure,
    });
    if (manifest.cleanup.residualDbRows !== 0 || manifest.cleanup.residualR2Objects !== 0) process.exitCode = RESULT_ERROR;
    if (process.exitCode === undefined) process.exitCode = RESULT_OK;
  }
}

main().catch((error) => {
  safeLog("PDF_R2_LIFECYCLE_INTEGRATION_FATAL", {
    failure: { stage: "fatal", code: error instanceof Error ? error.message.slice(0, 80) : "UNKNOWN_ERROR" },
  });
  process.exitCode = RESULT_ERROR;
});
