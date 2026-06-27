#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { createR2WorkerSignedUrl, normalizeWorkerBaseUrl } from "../../../lib/storage/r2/r2WorkerSignature.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const MANIFEST_PATH = path.join(PROJECT_ROOT, "tools", "simulator", "fixtures", "attachments", "canonical-lifecycle-manifest.json");
const OUT_ROOT = path.join(PROJECT_ROOT, ".tmp", "simulator", "attachments");
const REPORT_DIR = path.join(PROJECT_ROOT, "artifacts", "test-reports", "functions");
const REPORT_PATH = path.join(REPORT_DIR, "simulator-attachment-lifecycle-latest.json");

const ALLOWED_RUNTIMES = new Set(["development", "dev", "local", "test", "demo"]);
const DATABASE_KEYS = ["DATABASE_URL", "POSTGRES_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL_NON_POOLING", "NEON_DATABASE_URL"];
const MUTATING_MODES = new Set(["upload-seed", "repair-e-to-g", "lifecycle", "cleanup", "fault-execute"]);
const VALID_MODES = new Set(["plan", "generate", "upload-seed", "repair-e-to-g", "verify", "lifecycle", "cleanup", "fault-plan", "fault-execute"]);
const LEGACY_E_ATTACHMENT_FIXTURES = [
  {
    fixture_id: "legacy-E-active-image",
    company_id: "wafl-fn-company-e",
    workorder_id: "wafl-fn-company-e-workorder-00001",
    attachment_id: "wafl-fn-company-e-attachment-image-001",
    original_filename: "e-active-image.png",
    mime_type: "image/png",
    exact_size_bytes: 131072,
    canonical_r2_key: "companies/wafl-fn-company-e/workorders/wafl-fn-company-e-workorder-00001/attachments/e-active-image.png",
  },
  {
    fixture_id: "legacy-E-trashed-pdf",
    company_id: "wafl-fn-company-e",
    workorder_id: "wafl-fn-company-e-workorder-00001",
    attachment_id: "wafl-fn-company-e-attachment-trash-001",
    original_filename: "e-trash-reference.pdf",
    mime_type: "application/pdf",
    exact_size_bytes: 262144,
    canonical_r2_key: "companies/wafl-fn-company-e/workorders/wafl-fn-company-e-workorder-00001/attachments/e-trash-reference.pdf",
  },
];
const REQUIRED_ATTACHMENT_FIELDS = [
  "fixture_id",
  "company_id",
  "workorder_id",
  "attachment_id",
  "attachment_kind",
  "original_filename",
  "mime_type",
  "exact_size_bytes",
  "canonical_r2_key",
  "preview_mode",
  "is_representative_design",
  "lifecycle_status",
  "trashed_at",
  "expected_company_active_bytes",
  "expected_company_trash_bytes",
  "expected_company_total_bytes",
];

function parseArgs(argv) {
  const args = new Map();
  const flags = new Set();
  for (const raw of argv.slice(2)) {
    if (!raw.startsWith("--")) continue;
    const body = raw.slice(2);
    const equalsIndex = body.indexOf("=");
    if (equalsIndex === -1) {
      flags.add(body);
    } else {
      args.set(body.slice(0, equalsIndex), body.slice(equalsIndex + 1));
    }
  }
  return { args, flags };
}

const { args, flags } = parseArgs(process.argv);
const mode = args.get("mode") || "plan";
const execute = flags.has("execute");

if (!VALID_MODES.has(mode)) {
  fail(`Unknown mode: ${mode}`);
}

function fail(message) {
  console.error(`[ERROR] ${message}`);
  process.exit(1);
}

function readEnv(name) {
  const value = process.env[name];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function hashPrefix(value) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex").slice(0, 12);
}

function databaseIdentity() {
  const entry = DATABASE_KEYS.map((key) => [key, readEnv(key)]).find(([, value]) => value);
  if (!entry) return { present: false, fingerprint: null, source: null, protocolOk: false };
  try {
    const url = new URL(entry[1]);
    const database = url.pathname.replace(/^\//, "") || "unknown";
    const protocolOk = url.protocol === "postgres:" || url.protocol === "postgresql:";
    return {
      present: true,
      fingerprint: hashPrefix(`${url.hostname}/${database}`),
      source: entry[0],
      protocolOk,
    };
  } catch {
    return { present: true, fingerprint: null, source: entry[0], protocolOk: false };
  }
}

function workerIdentity() {
  const uploadUrl = readEnv("R2_WORKER_UPLOAD_URL");
  if (!uploadUrl) return { present: false, fingerprint: null, hostFingerprint: null, protocolOk: false, productionLike: false };
  try {
    const normalized = normalizeWorkerBaseUrl(uploadUrl);
    const url = new URL(normalized);
    const productionLike = /(^|[-_.])prod(uction)?($|[-_.])|production/i.test(`${url.hostname} ${url.pathname}`);
    return {
      present: true,
      fingerprint: hashPrefix(normalized),
      hostFingerprint: hashPrefix(url.host.toLowerCase()),
      protocolOk: url.protocol === "https:",
      productionLike,
    };
  } catch {
    return { present: true, fingerprint: null, hostFingerprint: null, protocolOk: false, productionLike: false };
  }
}

function workerFingerprintApproved(worker) {
  if (!worker.fingerprint) return false;
  const approvedUrlFingerprint = String(readEnv("WAFL_SIMULATOR_APPROVED_WORKER_URL_FINGERPRINT") || "").toLowerCase();
  const approvedHostFingerprint = String(readEnv("WAFL_SIMULATOR_APPROVED_WORKER_HOST_FINGERPRINT") || "").toLowerCase();
  const approvedAllowlist = String(readEnv("WAFL_SIMULATOR_APPROVED_WORKER_URL_ALLOWLIST") || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const urlConfigured = Boolean(approvedUrlFingerprint);
  const hostConfigured = Boolean(approvedHostFingerprint);
  if (urlConfigured && hostConfigured) {
    return worker.fingerprint === approvedUrlFingerprint && worker.hostFingerprint === approvedHostFingerprint;
  }
  return (
    worker.fingerprint === approvedUrlFingerprint ||
    (worker.hostFingerprint && worker.hostFingerprint === approvedHostFingerprint) ||
    approvedAllowlist.includes(worker.fingerprint)
  );
}

function workerFingerprintMatchDetails(worker) {
  const approvedUrlFingerprint = String(readEnv("WAFL_SIMULATOR_APPROVED_WORKER_URL_FINGERPRINT") || "").toLowerCase();
  const approvedHostFingerprint = String(readEnv("WAFL_SIMULATOR_APPROVED_WORKER_HOST_FINGERPRINT") || "").toLowerCase();
  const approvedAllowlist = String(readEnv("WAFL_SIMULATOR_APPROVED_WORKER_URL_ALLOWLIST") || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return {
    urlFingerprintMatch: Boolean(worker.fingerprint && approvedUrlFingerprint && worker.fingerprint === approvedUrlFingerprint),
    hostFingerprintMatch: Boolean(worker.hostFingerprint && approvedHostFingerprint && worker.hostFingerprint === approvedHostFingerprint),
    allowlistMatch: Boolean(worker.fingerprint && approvedAllowlist.includes(worker.fingerprint)),
    exactUrlAndHostRequired: Boolean(approvedUrlFingerprint && approvedHostFingerprint),
  };
}

function normalizeRuntime() {
  return String(process.env.NEXT_PUBLIC_APP_RUNTIME_MODE ?? process.env.NODE_ENV ?? "").trim().toLowerCase();
}

function isNormalMaterializedAttachment(item) {
  return item.attachment_kind !== "none" && item.lifecycle_status !== "fault_reference_only";
}

function validateStorageKey(item, testPrefix) {
  if (!item.canonical_r2_key) return item.attachment_kind === "none";
  if (item.canonical_r2_key.includes("..") || item.canonical_r2_key.startsWith("/")) return false;
  const companyPrefix = `companies/${item.company_id}/workorders/${item.workorder_id}/`;
  if (!item.canonical_r2_key.startsWith(companyPrefix)) return false;
  if (!item.company_id.startsWith(testPrefix)) return false;
  if (!String(item.workorder_id || "").startsWith(`${item.company_id}-workorder-`)) return false;
  return /\/(design|attachments)\//.test(item.canonical_r2_key);
}

function summarizeManifest(manifest) {
  const normalItems = manifest.normalLifecycleFixtures || [];
  const materialized = normalItems.filter(isNormalMaterializedAttachment);
  const activeItems = materialized.filter((item) => ["active", "restored"].includes(item.lifecycle_status));
  const trashItems = materialized.filter((item) => item.lifecycle_status === "trashed");
  const companyIds = new Set([...normalItems.map((item) => item.company_id), ...(manifest.capacityBoundaryFixtures || []).map((item) => item.company_id)]);
  const workOrderIds = new Set(materialized.map((item) => item.workorder_id).filter(Boolean));
  const r2Keys = materialized.map((item) => item.canonical_r2_key).filter(Boolean);
  return {
    manifestId: manifest.manifestId,
    schemaVersion: manifest.schemaVersion,
    testPrefix: manifest.testPrefix,
    companyCount: companyIds.size,
    workOrderCount: workOrderIds.size,
    normalFixtureCount: normalItems.length,
    materializedFileCount: materialized.length,
    activeFileCount: activeItems.length,
    trashFileCount: trashItems.length,
    capacityBoundaryCount: (manifest.capacityBoundaryFixtures || []).length,
    faultModeCount: (manifest.faultFixtures || []).length,
    expectedActiveBytes: activeItems.reduce((total, item) => total + item.exact_size_bytes, 0),
    expectedTrashBytes: trashItems.reduce((total, item) => total + item.exact_size_bytes, 0),
    expectedTotalBytes: materialized.reduce((total, item) => total + item.exact_size_bytes, 0),
    r2Prefix: `companies/${manifest.testPrefix}-`,
    r2KeyCount: r2Keys.length,
  };
}

function validateManifest(manifest) {
  const errors = [];
  if (manifest.schemaVersion !== "1.0") errors.push("schemaVersion must be 1.0");
  if (manifest.testPrefix !== "wafl-fn") errors.push("testPrefix must be wafl-fn");
  if (!Array.isArray(manifest.normalLifecycleFixtures)) errors.push("normalLifecycleFixtures must be an array");
  if (!Array.isArray(manifest.capacityBoundaryFixtures)) errors.push("capacityBoundaryFixtures must be an array");
  if (!Array.isArray(manifest.faultFixtures)) errors.push("faultFixtures must be an array");

  const items = manifest.normalLifecycleFixtures || [];
  const attachmentIds = new Set();
  const r2Keys = new Set();
  const representativeByWorkOrder = new Map();
  const companyTotals = new Map();
  const scenarioCodes = new Set(items.map((item) => item.scenario_code));
  for (const item of items) {
    for (const field of REQUIRED_ATTACHMENT_FIELDS) {
      if (!(field in item)) errors.push(`${item.fixture_id || "unknown"} missing ${field}`);
    }
    if (!["none", "design", "file"].includes(item.attachment_kind)) errors.push(`${item.fixture_id} invalid attachment_kind`);
    if (!Number.isSafeInteger(item.exact_size_bytes) || item.exact_size_bytes < 0) errors.push(`${item.fixture_id} invalid exact_size_bytes`);
    if (!validateStorageKey(item, manifest.testPrefix)) errors.push(`${item.fixture_id} unsafe canonical_r2_key`);
    if (item.attachment_id) {
      if (attachmentIds.has(item.attachment_id)) errors.push(`duplicate attachment_id ${item.attachment_id}`);
      attachmentIds.add(item.attachment_id);
    }
    if (item.canonical_r2_key && item.lifecycle_status !== "fault_reference_only") {
      if (r2Keys.has(item.canonical_r2_key)) errors.push(`duplicate canonical_r2_key ${item.canonical_r2_key}`);
      r2Keys.add(item.canonical_r2_key);
    }
    if (item.is_representative_design) {
      if (item.attachment_kind !== "design") errors.push(`${item.fixture_id} representative must be design`);
      const existing = representativeByWorkOrder.get(item.workorder_id);
      if (existing) errors.push(`duplicate representative design for ${item.workorder_id}`);
      representativeByWorkOrder.set(item.workorder_id, item.attachment_id);
    }

    const total = companyTotals.get(item.company_id) || { active: 0, trash: 0 };
    if (["active", "restored"].includes(item.lifecycle_status)) total.active += item.exact_size_bytes;
    if (item.lifecycle_status === "trashed") total.trash += item.exact_size_bytes;
    companyTotals.set(item.company_id, total);
  }

  for (const code of ["A", "B", "C", "D", "E", "F", "G"]) {
    if (!scenarioCodes.has(code)) errors.push(`missing normal scenario ${code}`);
  }
  const capacityCodes = new Set((manifest.capacityBoundaryFixtures || []).map((item) => item.scenario_code));
  for (const code of ["H", "I", "J"]) {
    if (!capacityCodes.has(code)) errors.push(`missing capacity boundary scenario ${code}`);
  }
  for (const item of items) {
    const total = companyTotals.get(item.company_id) || { active: 0, trash: 0 };
    if (item.expected_company_active_bytes !== total.active) errors.push(`${item.fixture_id} active bytes mismatch`);
    if (item.expected_company_trash_bytes !== total.trash) errors.push(`${item.fixture_id} trash bytes mismatch`);
    if (item.expected_company_total_bytes !== total.active + total.trash) errors.push(`${item.fixture_id} total bytes mismatch`);
  }
  return errors;
}

async function readManifest() {
  return JSON.parse(await fs.readFile(MANIFEST_PATH, "utf8"));
}

function createBytesForItem(item) {
  const targetSize = item.exact_size_bytes;
  if (targetSize === 0) return Buffer.alloc(0);
  let base;
  if (item.mime_type === "application/pdf") {
    base = Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF\n", "utf8");
  } else if (String(item.mime_type || "").startsWith("image/")) {
    base = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/ax3pPAAAAAASUVORK5CYII=", "base64");
  } else {
    base = Buffer.from("WAFL simulator attachment fixture\n", "utf8");
  }
  const output = Buffer.alloc(targetSize);
  for (let offset = 0; offset < targetSize; offset += base.length) {
    base.copy(output, offset, 0, Math.min(base.length, targetSize - offset));
  }
  return output;
}

async function generateLocalFiles(manifest, items = manifest.normalLifecycleFixtures.filter(isNormalMaterializedAttachment)) {
  const generated = [];
  const filesRoot = path.join(OUT_ROOT, "files");
  for (const item of items) {
    const targetPath = path.join(filesRoot, item.canonical_r2_key);
    const resolvedTarget = path.resolve(targetPath);
    const resolvedRoot = path.resolve(filesRoot);
    if (!resolvedTarget.startsWith(`${resolvedRoot}${path.sep}`)) {
      throw new Error(`Refusing to write outside simulator files root: ${item.fixture_id}`);
    }
    await fs.mkdir(path.dirname(resolvedTarget), { recursive: true });
    const bytes = createBytesForItem(item);
    await fs.writeFile(resolvedTarget, bytes);
    generated.push({ fixtureId: item.fixture_id, path: path.relative(PROJECT_ROOT, resolvedTarget).replaceAll(path.sep, "/"), bytes: bytes.byteLength });
  }
  return generated;
}

function buildPreflight(manifest, summary) {
  const runtime = normalizeRuntime();
  const db = databaseIdentity();
  const worker = workerIdentity();
  const approvedDbFingerprint = readEnv("WAFL_SIMULATOR_APPROVED_DB_FINGERPRINT");
  return {
    targetRuntime: runtime || "unset",
    neonFingerprint: db.fingerprint || "unavailable",
    neonFingerprintApproved: Boolean(db.fingerprint && approvedDbFingerprint && db.fingerprint === approvedDbFingerprint.toLowerCase()),
    workerUrlFingerprint: worker.fingerprint || "unavailable",
    workerHostFingerprint: worker.hostFingerprint || "unavailable",
    workerProductionPatternBlocked: worker.productionLike === false,
    ...workerFingerprintMatchDetails(worker),
    workerFingerprintApproved: workerFingerprintApproved(worker),
    targetCompanyCount: summary.companyCount,
    targetWorkOrderCount: summary.workOrderCount,
    generatedFileCount: summary.materializedFileCount,
    expectedTotalBytes: summary.expectedTotalBytes,
    simulatorPrefix: manifest.testPrefix,
    dbMutationRange: "attachments, attachment_trash_items, storage_usage_snapshots rows whose ids/company ids start with wafl-fn and are listed in the canonical manifest",
    r2MutationRange: "only canonical_r2_key values listed in the manifest under companies/wafl-fn-company-*/workorders/* through the dev/test Cloudflare Worker",
    workerAdapterCapabilities: ["signed PUT exact key", "signed GET exact key byte/content-type verification", "signed DELETE exact key followed by GET 404 verification"],
    cleanupRange: "only manifest attachment ids, trash items, snapshots, and exact manifest R2 keys; no whole bucket or broad prefix delete",
    reconciliationScope: "manifest-scoped exact keys/attachment ids/trash ids/snapshot company ids only; no bucket-wide orphan scan or prefix LIST",
    confirmationString: confirmationForMode(mode),
    resumeRollbackCompensation: "Re-run verify to detect partial state. Re-run upload-seed for idempotent DB metadata repair. Cleanup deletes only manifest R2 keys after key validation and then marks/removes simulator metadata. If R2 delete fails, DB metadata is not removed.",
  };
}

function confirmationForMode(value) {
  if (value === "upload-seed") return "UPLOAD SEED WAF-FN ATTACHMENTS";
  if (value === "repair-e-to-g") return "REPAIR WAF-FN ATTACHMENTS E TO G";
  if (value === "lifecycle") return "RUN WAF-FN ATTACHMENT LIFECYCLE";
  if (value === "cleanup") return "CLEAN WAF-FN ATTACHMENTS";
  if (value === "fault-execute") return "CREATE WAF-FN ATTACHMENT FAULTS";
  return "NO MUTATION";
}

function assertMutationGuards(manifest) {
  const runtime = normalizeRuntime();
  if (!ALLOWED_RUNTIMES.has(runtime) || runtime === "production") throw new Error(`mutation blocked: runtime=${runtime || "unset"}`);
  if (readEnv("WAFL_SIMULATOR_ATTACHMENT_ENABLE_MUTATION") !== "1") throw new Error("mutation blocked: WAFL_SIMULATOR_ATTACHMENT_ENABLE_MUTATION=1 required");
  if (readEnv("WAFL_SIMULATOR_ATTACHMENT_CONFIRM") !== confirmationForMode(mode)) throw new Error(`mutation blocked: WAFL_SIMULATOR_ATTACHMENT_CONFIRM=${confirmationForMode(mode)} required`);
  if (readEnv("WAFL_FUNCTIONS_TEST_PREFIX") !== manifest.testPrefix) throw new Error("mutation blocked: WAFL_FUNCTIONS_TEST_PREFIX mismatch");
  const db = databaseIdentity();
  const worker = workerIdentity();
  if (!db.present || !db.protocolOk || !db.fingerprint) throw new Error("mutation blocked: valid PostgreSQL identity required");
  if (!worker.present || !worker.protocolOk || !worker.fingerprint) throw new Error("mutation blocked: valid HTTPS Worker identity required");
  if (worker.productionLike) throw new Error("mutation blocked: production-like Worker URL pattern");
  if (db.fingerprint !== String(readEnv("WAFL_SIMULATOR_APPROVED_DB_FINGERPRINT") || "").toLowerCase()) throw new Error("mutation blocked: DB fingerprint mismatch");
  if (!workerFingerprintApproved(worker)) throw new Error("mutation blocked: Worker fingerprint mismatch");
}

function getDatabaseUrl() {
  const entry = DATABASE_KEYS.map((key) => [key, readEnv(key)]).find(([, value]) => value);
  if (!entry) throw new Error("DATABASE_URL_REQUIRED");
  return entry[1];
}

function getWorkerConfig() {
  const uploadUrl = readEnv("R2_WORKER_UPLOAD_URL");
  const secret = readEnv("R2_WORKER_UPLOAD_SECRET");
  if (!uploadUrl || !secret) throw new Error("R2_WORKER_CONFIG_REQUIRED");
  return {
    uploadUrl: normalizeWorkerBaseUrl(uploadUrl),
    secret,
  };
}

async function createPgClient() {
  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: getDatabaseUrl() });
  await client.connect();
  return client;
}

function createWorkerSignedUrl(config, { method, key, contentType }) {
  return createR2WorkerSignedUrl({
    uploadUrl: config.uploadUrl,
    secret: config.secret,
    method,
    key,
    contentType: contentType || "application/octet-stream",
    expiresAt: Math.floor(Date.now() / 1000) + 600,
  });
}

function materializedItems(manifest) {
  return manifest.normalLifecycleFixtures.filter(isNormalMaterializedAttachment);
}

function localPathForItem(item) {
  return path.join(OUT_ROOT, "files", item.canonical_r2_key);
}

async function readWorkerError(response) {
  try {
    const text = await response.text();
    return text.trim().slice(0, 160);
  } catch {
    return "";
  }
}

function isWorkerMissingObject(status, body) {
  return status === 404 || /WORKER_FILE_NOT_FOUND|NOT_FOUND/i.test(String(body || ""));
}

function contentTypeMatches(actual, expected) {
  const actualBase = String(actual || "").split(";")[0].trim().toLowerCase();
  const expectedBase = String(expected || "application/octet-stream").trim().toLowerCase();
  return actualBase === expectedBase;
}

async function getWorkerObject(config, item) {
  const url = createWorkerSignedUrl(config, {
    method: "GET",
    key: item.canonical_r2_key,
    contentType: item.mime_type,
  });
  const response = await fetch(url, { method: "GET" });
  const contentType = response.headers.get("content-type") || "";
  if (!response.ok) {
    const body = await readWorkerError(response);
    return {
      key: item.canonical_r2_key,
      status: response.status,
      bytes: 0,
      contentType,
      missing: isWorkerMissingObject(response.status, body),
      transportIssue: !isWorkerMissingObject(response.status, body),
      error: body || `WORKER_GET_FAILED_${response.status}`,
    };
  }

  const body = Buffer.from(await response.arrayBuffer());
  return {
    key: item.canonical_r2_key,
    status: response.status,
    bytes: body.byteLength,
    contentType,
    missing: false,
    transportIssue: false,
    error: null,
  };
}

async function deleteWorkerObjectAndVerifyMissing(config, item) {
  const deleteUrl = createWorkerSignedUrl(config, {
    method: "DELETE",
    key: item.canonical_r2_key,
    contentType: item.mime_type,
  });
  const deleteResponse = await fetch(deleteUrl, { method: "DELETE" });
  if (!deleteResponse.ok) {
    const body = await readWorkerError(deleteResponse);
    if (!isWorkerMissingObject(deleteResponse.status, body)) {
      return {
        key: item.canonical_r2_key,
        deleted: false,
        deleteStatus: deleteResponse.status,
        missingAfterDelete: false,
        error: body || `WORKER_DELETE_FAILED_${deleteResponse.status}`,
      };
    }
  }

  const afterDelete = await getWorkerObject(config, item);
  return {
    key: item.canonical_r2_key,
    deleted: afterDelete.missing,
    deleteStatus: deleteResponse.status,
    missingAfterDelete: afterDelete.missing,
    error: afterDelete.missing ? null : (afterDelete.error || "WORKER_DELETE_VERIFY_NOT_MISSING"),
  };
}

async function uploadAndVerifyR2Objects(manifest, items = materializedItems(manifest)) {
  const workerConfig = getWorkerConfig();
  const results = [];

  for (const item of items) {
    const body = await fs.readFile(localPathForItem(item));
    if (body.byteLength !== item.exact_size_bytes) {
      results.push({ key: item.canonical_r2_key, status: "failed", error: "LOCAL_SIZE_MISMATCH", expectedBytes: item.exact_size_bytes, actualBytes: body.byteLength });
      continue;
    }

    const putUrl = createWorkerSignedUrl(workerConfig, {
      method: "PUT",
      key: item.canonical_r2_key,
      contentType: item.mime_type,
    });
    const putResponse = await fetch(putUrl, {
      method: "PUT",
      headers: { "content-type": item.mime_type || "application/octet-stream" },
      body,
    });
    if (!putResponse.ok) {
      results.push({
        key: item.canonical_r2_key,
        status: "failed",
        expectedBytes: item.exact_size_bytes,
        putStatus: putResponse.status,
        getBytes: 0,
        contentType: null,
        error: (await readWorkerError(putResponse)) || `WORKER_PUT_FAILED_${putResponse.status}`,
      });
      continue;
    }

    const get = await getWorkerObject(workerConfig, item);
    const ok =
      !get.missing &&
      !get.transportIssue &&
      get.bytes === item.exact_size_bytes &&
      contentTypeMatches(get.contentType, item.mime_type);
    results.push({
      key: item.canonical_r2_key,
      status: ok ? "uploaded" : "failed",
      expectedBytes: item.exact_size_bytes,
      putStatus: putResponse.status,
      getStatus: get.status,
      getBytes: get.bytes,
      contentType: get.contentType,
      error: ok ? null : (get.error || "WORKER_GET_SIZE_OR_CONTENT_TYPE_MISMATCH"),
    });
  }

  return {
    results,
    successCount: results.filter((item) => item.status === "uploaded").length,
    failedCount: results.filter((item) => item.status !== "uploaded").length,
    totalBytes: results.filter((item) => item.status === "uploaded").reduce((sum, item) => sum + item.getBytes, 0),
    orphanScanScope: "not_performed_manifest_scoped_only",
    orphanCount: null,
    orphanKeys: [],
  };
}

function companyTotalsFromManifest(manifest) {
  const totals = new Map();
  for (const item of manifest.normalLifecycleFixtures) {
    if (!item.company_id) continue;
    const current = totals.get(item.company_id) || { companyId: item.company_id, activeBytes: 0, trashBytes: 0, totalBytes: 0, attachmentCount: 0 };
    if (["active", "restored"].includes(item.lifecycle_status)) current.activeBytes += item.exact_size_bytes;
    if (item.lifecycle_status === "trashed") current.trashBytes += item.exact_size_bytes;
    if (isNormalMaterializedAttachment(item)) current.attachmentCount += 1;
    current.totalBytes = current.activeBytes + current.trashBytes;
    totals.set(item.company_id, current);
  }
  return Array.from(totals.values()).sort((a, b) => a.companyId.localeCompare(b.companyId));
}

async function validateDatabaseTargets(manifest, existingClient = null) {
  const client = existingClient || await createPgClient();
  const ownsClient = !existingClient;
  const items = materializedItems(manifest);
  const companyIds = Array.from(new Set(items.map((item) => item.company_id)));
  const workOrderIds = Array.from(new Set(items.map((item) => item.workorder_id)));

  try {
    if (ownsClient) await client.query("BEGIN READ ONLY");
    const companyCheck = await client.query("SELECT id, name FROM companies WHERE id = ANY($1::text[])", [companyIds]);
    const existingCompanies = new Map(companyCheck.rows.map((row) => [row.id, row.name || null]));
    const missingCompanies = companyIds.filter((id) => !existingCompanies.has(id));
    if (missingCompanies.length > 0) throw new Error(`MISSING_SIMULATOR_COMPANIES:${missingCompanies.join(",")}`);

    const workOrderCheck = await client.query("SELECT id, company_id FROM spec_sheets WHERE id = ANY($1::text[])", [workOrderIds]);
    const existingWorkOrders = new Map(workOrderCheck.rows.map((row) => [row.id, row.company_id]));
    const missingWorkOrders = workOrderIds.filter((id) => !existingWorkOrders.has(id));
    if (missingWorkOrders.length > 0) throw new Error(`MISSING_SIMULATOR_WORKORDERS:${missingWorkOrders.join(",")}`);
    for (const item of items) {
      if (existingWorkOrders.get(item.workorder_id) !== item.company_id) {
        throw new Error(`WORKORDER_COMPANY_MISMATCH:${item.workorder_id}`);
      }
    }
    if (ownsClient) await client.query("COMMIT");
    return {
      companyIds,
      workOrderIds,
      companyNames: existingCompanies,
      checkedCompanyCount: companyIds.length,
      checkedWorkOrderCount: workOrderIds.length,
    };
  } catch (error) {
    if (ownsClient) {
      try { await client.query("ROLLBACK"); } catch {}
    }
    throw error;
  } finally {
    if (ownsClient) await client.end();
  }
}

async function seedAttachmentMetadata(manifest) {
  const client = await createPgClient();
  const items = materializedItems(manifest);
  const attachmentIds = items.map((item) => item.attachment_id);
  const trashIds = items.filter((item) => item.lifecycle_status === "trashed").map((item) => `${item.attachment_id}-trash`);
  const companyIds = Array.from(new Set(items.map((item) => item.company_id)));
  const totals = companyTotalsFromManifest(manifest);

  try {
    const targetCheck = await validateDatabaseTargets(manifest, client);
    const existingCompanies = targetCheck.companyNames;

    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`${manifest.testPrefix}:attachment-lifecycle-upload-seed`]);

    await client.query(
      `DELETE FROM attachment_trash_items
        WHERE attachment_id = ANY($1::text[])
           OR id = ANY($2::text[])`,
      [attachmentIds, trashIds],
    );

    for (const item of items) {
      const isTrashed = item.lifecycle_status === "trashed";
      const isActive = !isTrashed;
      const deletedAt = isTrashed ? item.trashed_at : null;
      const companyName = existingCompanies.get(item.company_id);
      await client.query(
        `INSERT INTO attachments (
           id, company_id, company_name, order_id, type, storage_key, original_name,
           mime_type, size_bytes, author_id, is_primary, source_type,
           is_active, deleted_at, deleted_by, delete_source, delete_scope,
           delete_parent_type, delete_parent_id, delete_batch_id, purge_after_at, updated_at
         )
         VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,'wafl-fn-simulator',
           $10,'user',$11,$12,
           CASE WHEN $12::timestamptz IS NULL THEN NULL ELSE 'wafl-fn-simulator' END,
           CASE WHEN $12::timestamptz IS NULL THEN NULL ELSE 'manual' END,
           CASE WHEN $12::timestamptz IS NULL THEN NULL ELSE 'single' END,
           CASE WHEN $12::timestamptz IS NULL THEN NULL ELSE 'none' END,
           NULL,
           CASE WHEN $12::timestamptz IS NULL THEN NULL ELSE $1 END,
           CASE WHEN $12::timestamptz IS NULL THEN NULL ELSE $12::timestamptz + interval '30 days' END,
           now()
         )
         ON CONFLICT (id) DO UPDATE SET
           company_id=EXCLUDED.company_id,
           company_name=EXCLUDED.company_name,
           order_id=EXCLUDED.order_id,
           type=EXCLUDED.type,
           storage_key=EXCLUDED.storage_key,
           original_name=EXCLUDED.original_name,
           mime_type=EXCLUDED.mime_type,
           size_bytes=EXCLUDED.size_bytes,
           author_id=EXCLUDED.author_id,
           is_primary=EXCLUDED.is_primary,
           source_type=EXCLUDED.source_type,
           is_active=EXCLUDED.is_active,
           deleted_at=EXCLUDED.deleted_at,
           deleted_by=EXCLUDED.deleted_by,
           delete_source=EXCLUDED.delete_source,
           delete_scope=EXCLUDED.delete_scope,
           delete_parent_type=EXCLUDED.delete_parent_type,
           delete_parent_id=EXCLUDED.delete_parent_id,
           delete_batch_id=EXCLUDED.delete_batch_id,
           purge_after_at=EXCLUDED.purge_after_at,
           updated_at=now()`,
        [
          item.attachment_id,
          item.company_id,
          companyName,
          item.workorder_id,
          item.attachment_kind === "design" ? "design" : "file",
          item.canonical_r2_key,
          item.original_filename,
          item.mime_type,
          item.exact_size_bytes,
          item.is_representative_design === true && isActive,
          isActive,
          deletedAt,
        ],
      );

      if (isTrashed) {
        await client.query(
          `INSERT INTO attachment_trash_items (
             id, company_id, company_name, attachment_id, order_id, storage_key,
             original_name, mime_type, size_bytes, deleted_by, delete_source,
             delete_scope, delete_parent_type, delete_batch_id, deleted_at,
             purge_after_at, purge_status, updated_at
           )
           VALUES (
             $1,$2,$3,$4,$5,$6,$7,$8,$9,'wafl-fn-simulator','manual',
             'single','none',$4,$10::timestamptz,$10::timestamptz + interval '30 days',
             'pending',now()
           )
           ON CONFLICT (id) DO UPDATE SET
             company_id=EXCLUDED.company_id,
             company_name=EXCLUDED.company_name,
             attachment_id=EXCLUDED.attachment_id,
             order_id=EXCLUDED.order_id,
             storage_key=EXCLUDED.storage_key,
             original_name=EXCLUDED.original_name,
             mime_type=EXCLUDED.mime_type,
             size_bytes=EXCLUDED.size_bytes,
             deleted_by=EXCLUDED.deleted_by,
             delete_source=EXCLUDED.delete_source,
             delete_scope=EXCLUDED.delete_scope,
             delete_parent_type=EXCLUDED.delete_parent_type,
             delete_batch_id=EXCLUDED.delete_batch_id,
             deleted_at=EXCLUDED.deleted_at,
             purge_after_at=EXCLUDED.purge_after_at,
             restored_at=NULL,
             restored_by=NULL,
             purged_at=NULL,
             purge_status='pending',
             last_purge_error=NULL,
             updated_at=now()`,
          [
            `${item.attachment_id}-trash`,
            item.company_id,
            companyName,
            item.attachment_id,
            item.workorder_id,
            item.canonical_r2_key,
            item.original_filename,
            item.mime_type,
            item.exact_size_bytes,
            item.trashed_at,
          ],
        );
      }
    }

    await client.query(
      `DELETE FROM storage_usage_snapshots
        WHERE company_id = ANY($1::text[])
          AND memo LIKE '[SIM ATTACHMENT LIFECYCLE]%'`,
      [companyIds],
    );
    for (const total of totals) {
      await client.query(
        `INSERT INTO storage_usage_snapshots (company_id, used_bytes, attachment_count, source, memo)
         VALUES ($1, $2, $3, 'db_attachment_metadata', $4)`,
        [
          total.companyId,
          total.totalBytes,
          total.attachmentCount,
          `[SIM ATTACHMENT LIFECYCLE] active=${total.activeBytes}; trash=${total.trashBytes}; manifest=${manifest.manifestId}`,
        ],
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch {}
    throw error;
  } finally {
    await client.end();
  }
}

function repairGTrashItems(manifest) {
  return materializedItems(manifest).filter(
    (item) =>
      item.company_id === "wafl-fn-company-g" &&
      item.lifecycle_status === "trashed" &&
      item.attachment_id === "wafl-fn-company-g-attachment-trash-001",
  );
}

async function removeLegacyEAttachmentRowsAndResetSnapshot(manifest) {
  const client = await createPgClient();
  const legacyAttachmentIds = LEGACY_E_ATTACHMENT_FIXTURES.map((item) => item.attachment_id);
  const legacyStorageKeys = LEGACY_E_ATTACHMENT_FIXTURES.map((item) => item.canonical_r2_key);
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`${manifest.testPrefix}:attachment-lifecycle-e-to-g-repair`]);
    await client.query(
      `DELETE FROM attachment_trash_items
        WHERE attachment_id = ANY($1::text[])
           OR storage_key = ANY($2::text[])`,
      [legacyAttachmentIds, legacyStorageKeys],
    );
    await client.query(
      `DELETE FROM attachments
        WHERE id = ANY($1::text[])
           OR storage_key = ANY($2::text[])`,
      [legacyAttachmentIds, legacyStorageKeys],
    );
    await client.query(
      `DELETE FROM storage_usage_snapshots
        WHERE company_id = 'wafl-fn-company-e'
          AND memo LIKE '[SIM ATTACHMENT LIFECYCLE]%'`,
    );
    await client.query(
      `INSERT INTO storage_usage_snapshots (company_id, used_bytes, attachment_count, source, memo)
       VALUES ('wafl-fn-company-e', 0, 0, 'db_attachment_metadata', $1)`,
      [`[SIM ATTACHMENT LIFECYCLE] active=0; trash=0; manifest=${manifest.manifestId}; repair=e-to-g`],
    );
    await client.query("COMMIT");
    return {
      removedAttachmentIds: legacyAttachmentIds,
      removedStorageKeys: legacyStorageKeys,
      eSnapshotUsedBytes: 0,
    };
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch {}
    throw error;
  } finally {
    await client.end();
  }
}

async function validateRepairEToGTargets(manifest) {
  const client = await createPgClient();
  const gTrashItems = repairGTrashItems(manifest);
  if (gTrashItems.length !== 1) throw new Error("REPAIR_G_TRASH_FIXTURE_REQUIRED");
  const gTrashItem = gTrashItems[0];
  const legacyAttachmentIds = LEGACY_E_ATTACHMENT_FIXTURES.map((item) => item.attachment_id);
  const legacyStorageKeys = LEGACY_E_ATTACHMENT_FIXTURES.map((item) => item.canonical_r2_key);
  try {
    await client.query("BEGIN READ ONLY");
    const company = await client.query(
      `SELECT id, is_active, subscription_status, billing_status
         FROM companies
        WHERE id = 'wafl-fn-company-g'`,
    );
    const companyRow = company.rows[0];
    if (!companyRow || companyRow.is_active !== true) throw new Error("REPAIR_G_COMPANY_NOT_ACTIVE");
    if (companyRow.subscription_status !== "active" || companyRow.billing_status !== "active") {
      throw new Error("REPAIR_G_COMPANY_NOT_APPROVED_FOR_UI");
    }

    const workorder = await client.query(
      `SELECT id, company_id, is_active, deleted_at
         FROM spec_sheets
        WHERE id = $1`,
      [gTrashItem.workorder_id],
    );
    const workorderRow = workorder.rows[0];
    if (
      !workorderRow ||
      workorderRow.company_id !== "wafl-fn-company-g" ||
      workorderRow.is_active !== true ||
      workorderRow.deleted_at !== null
    ) {
      throw new Error("REPAIR_G_WORKORDER_NOT_ACTIVE");
    }

    const legacyAttachments = await client.query(
      `SELECT id, storage_key
         FROM attachments
        WHERE id = ANY($1::text[])
        ORDER BY id`,
      [legacyAttachmentIds],
    );
    const legacyAttachmentMap = new Map(legacyAttachments.rows.map((row) => [row.id, row.storage_key]));
    for (const legacy of LEGACY_E_ATTACHMENT_FIXTURES) {
      if (legacyAttachmentMap.get(legacy.attachment_id) !== legacy.canonical_r2_key) {
        throw new Error(`REPAIR_LEGACY_E_ATTACHMENT_MISMATCH:${legacy.attachment_id}`);
      }
    }

    const legacyTrash = await client.query(
      `SELECT id, attachment_id, storage_key
         FROM attachment_trash_items
        WHERE attachment_id = $1
          AND id = $2`,
      ["wafl-fn-company-e-attachment-trash-001", "wafl-fn-company-e-attachment-trash-001-trash"],
    );
    const legacyTrashRow = legacyTrash.rows[0];
    if (!legacyTrashRow || legacyTrashRow.storage_key !== LEGACY_E_ATTACHMENT_FIXTURES[1].canonical_r2_key) {
      throw new Error("REPAIR_LEGACY_E_TRASH_ROW_MISMATCH");
    }

    if (gTrashItem.canonical_r2_key !== "companies/wafl-fn-company-g/workorders/wafl-fn-company-g-workorder-00003/attachments/g-trash-reference.pdf") {
      throw new Error("REPAIR_G_CANONICAL_KEY_MISMATCH");
    }
    if (gTrashItem.exact_size_bytes !== 262144 || gTrashItem.mime_type !== "application/pdf") {
      throw new Error("REPAIR_G_FIXTURE_CONTRACT_MISMATCH");
    }
    if (legacyStorageKeys.some((key) => !key.startsWith("companies/wafl-fn-company-e/workorders/wafl-fn-company-e-workorder-00001/attachments/"))) {
      throw new Error("REPAIR_LEGACY_E_KEY_SCOPE_MISMATCH");
    }

    await client.query("COMMIT");
    return {
      gCompanyId: "wafl-fn-company-g",
      gWorkOrderId: gTrashItem.workorder_id,
      legacyAttachmentIds,
      legacyStorageKeys,
      gAttachmentId: gTrashItem.attachment_id,
      gStorageKey: gTrashItem.canonical_r2_key,
    };
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch {}
    throw error;
  } finally {
    await client.end();
  }
}

async function reconcileUploadSeed(manifest) {
  const client = await createPgClient();
  const workerConfig = getWorkerConfig();
  const items = materializedItems(manifest);
  const attachmentIds = items.map((item) => item.attachment_id);
  const companyIds = Array.from(new Set(manifest.normalLifecycleFixtures.map((item) => item.company_id).filter(Boolean)));
  try {
    const attachments = await client.query(
      `SELECT id, company_id, order_id, storage_key, size_bytes, is_primary, is_active, deleted_at
         FROM attachments
        WHERE id = ANY($1::text[])`,
      [attachmentIds],
    );
    const trash = await client.query(
      `SELECT id, attachment_id, company_id, storage_key, size_bytes, purge_status, restored_at, purged_at
         FROM attachment_trash_items
        WHERE attachment_id = ANY($1::text[])`,
      [attachmentIds],
    );
    const snapshots = await client.query(
      `SELECT DISTINCT ON (company_id) company_id, used_bytes, attachment_count, measured_at
         FROM storage_usage_snapshots
        WHERE company_id = ANY($1::text[])
          AND memo LIKE '[SIM ATTACHMENT LIFECYCLE]%'
        ORDER BY company_id, measured_at DESC`,
      [companyIds],
    );
    const representativeDuplicates = await client.query(
      `SELECT order_id, COUNT(*)::int AS count
         FROM attachments
        WHERE company_id = ANY($1::text[])
          AND type = 'design'
          AND is_primary = true
          AND is_active = true
          AND deleted_at IS NULL
        GROUP BY order_id
       HAVING COUNT(*) > 1`,
      [companyIds],
    );

    const attachmentById = new Map(attachments.rows.map((row) => [row.id, row]));
    const missingDbRows = items.filter((item) => !attachmentById.has(item.attachment_id));
    const r2Results = [];
    for (const item of items) {
      const result = await getWorkerObject(workerConfig, item);
      r2Results.push(result);
    }
    const r2ByKey = new Map(r2Results.map((row) => [row.key, row]));
    const sizeMismatches = [];
    const contentTypeMismatches = [];
    for (const item of items) {
      const db = attachmentById.get(item.attachment_id);
      const r2 = r2ByKey.get(item.canonical_r2_key);
      const dbBytes = Number(db?.size_bytes || 0);
      const r2Bytes = Number(r2?.bytes || 0);
      if (!db || !r2 || r2.missing || dbBytes !== item.exact_size_bytes || r2Bytes !== item.exact_size_bytes) {
        sizeMismatches.push({ attachmentId: item.attachment_id, expected: item.exact_size_bytes, dbBytes, r2Bytes, r2Missing: Boolean(r2?.missing) });
      }
      if (r2 && !r2.missing && !r2.transportIssue && !contentTypeMatches(r2.contentType, item.mime_type)) {
        contentTypeMismatches.push({ attachmentId: item.attachment_id, expected: item.mime_type, actual: r2.contentType });
      }
    }
    const missingR2Objects = r2Results.filter((row) => row.missing);
    const workerTransportIssues = r2Results.filter((row) => row.transportIssue);
    const totals = companyTotalsFromManifest(manifest);

    return {
      reconciliationScope: "manifest-scoped exact keys, attachment ids, trash ids, and snapshot company ids only",
      bucketWideOrphanScan: false,
      dbAttachmentRowCount: attachments.rows.length,
      dbTrashRowCount: trash.rows.length,
      snapshotRows: snapshots.rows.map((row) => ({
        companyId: row.company_id,
        usedBytes: Number(row.used_bytes || 0),
        attachmentCount: Number(row.attachment_count || 0),
      })),
      companyBytes: totals,
      r2Count: r2Results.filter((row) => !row.missing).length,
      r2Bytes: r2Results.reduce((sum, row) => sum + row.bytes, 0),
      sizeMismatchCount: sizeMismatches.length,
      sizeMismatches,
      contentTypeMismatchCount: contentTypeMismatches.length,
      contentTypeMismatches,
      missingDbRowCount: missingDbRows.length,
      missingDbRows: missingDbRows.map((item) => item.attachment_id),
      missingR2ObjectCount: missingR2Objects.length,
      missingR2Objects: missingR2Objects.map((row) => row.key),
      workerTransportIssueCount: workerTransportIssues.length,
      workerTransportIssues: workerTransportIssues.map((row) => ({ key: row.key, status: row.status, error: row.error })),
      orphanObjectCount: null,
      orphanObjects: [],
      orphanScanScope: "not_performed_manifest_scoped_only",
      duplicateRepresentativeCount: representativeDuplicates.rows.length,
      duplicateRepresentatives: representativeDuplicates.rows,
      issueCount:
        sizeMismatches.length +
        contentTypeMismatches.length +
        missingDbRows.length +
        missingR2Objects.length +
        workerTransportIssues.length +
        representativeDuplicates.rows.length,
    };
  } finally {
    await client.end();
  }
}

async function executeUploadSeed(manifest, report) {
  report.generated = await generateLocalFiles(manifest);
  const targetCheck = await validateDatabaseTargets(manifest);
  report.uploadSeed = {
    databaseTargetCheck: {
      checkedCompanyCount: targetCheck.checkedCompanyCount,
      checkedWorkOrderCount: targetCheck.checkedWorkOrderCount,
    },
  };
  const upload = await uploadAndVerifyR2Objects(manifest);
  report.uploadSeed.upload = upload;
  if (upload.failedCount > 0) {
    report.mutationExecuted = true;
    throw new Error("R2_UPLOAD_VERIFY_FAILED");
  }
  await seedAttachmentMetadata(manifest);
  const reconciliation = await reconcileUploadSeed(manifest);
  report.uploadSeed.reconciliation = reconciliation;
  report.mutationExecuted = true;
  report.stopBeforeActualMutation = false;
  return report.uploadSeed;
}

async function executeRepairEToG(manifest, report) {
  const gTrashItems = repairGTrashItems(manifest);
  if (gTrashItems.length !== 1) throw new Error("REPAIR_G_TRASH_FIXTURE_REQUIRED");
  report.generated = await generateLocalFiles(manifest, gTrashItems);
  const repairTargetCheck = await validateRepairEToGTargets(manifest);
  const targetCheck = await validateDatabaseTargets(manifest);
  report.repairEToG = {
    databaseTargetCheck: {
      checkedCompanyCount: targetCheck.checkedCompanyCount,
      checkedWorkOrderCount: targetCheck.checkedWorkOrderCount,
    },
    repairTargetCheck,
    legacyE: {
      attachmentIds: LEGACY_E_ATTACHMENT_FIXTURES.map((item) => item.attachment_id),
      storageKeys: LEGACY_E_ATTACHMENT_FIXTURES.map((item) => item.canonical_r2_key),
    },
    newG: {
      attachmentIds: gTrashItems.map((item) => item.attachment_id),
      storageKeys: gTrashItems.map((item) => item.canonical_r2_key),
    },
  };

  const upload = await uploadAndVerifyR2Objects(manifest, gTrashItems);
  report.repairEToG.upload = upload;
  if (upload.failedCount > 0) {
    report.mutationExecuted = true;
    throw new Error("REPAIR_G_WORKER_UPLOAD_VERIFY_FAILED");
  }

  await seedAttachmentMetadata(manifest);
  const beforeLegacyDeleteReconciliation = await reconcileUploadSeed(manifest);
  report.repairEToG.beforeLegacyDeleteReconciliation = beforeLegacyDeleteReconciliation;
  if (beforeLegacyDeleteReconciliation.issueCount > 0) {
    report.mutationExecuted = true;
    throw new Error("REPAIR_G_RECONCILIATION_FAILED");
  }

  const workerConfig = getWorkerConfig();
  const legacyDeleteResults = [];
  for (const legacy of LEGACY_E_ATTACHMENT_FIXTURES) {
    legacyDeleteResults.push(await deleteWorkerObjectAndVerifyMissing(workerConfig, legacy));
  }
  report.repairEToG.legacyDelete = {
    results: legacyDeleteResults,
    failedCount: legacyDeleteResults.filter((item) => !item.missingAfterDelete).length,
  };
  if (report.repairEToG.legacyDelete.failedCount > 0) {
    report.mutationExecuted = true;
    throw new Error("REPAIR_LEGACY_E_WORKER_DELETE_FAILED");
  }

  report.repairEToG.legacyDbCleanup = await removeLegacyEAttachmentRowsAndResetSnapshot(manifest);
  report.repairEToG.finalReconciliation = await reconcileUploadSeed(manifest);
  report.mutationExecuted = true;
  report.stopBeforeActualMutation = false;
  return report.repairEToG;
}

async function writeReport(report) {
  await fs.mkdir(REPORT_DIR, { recursive: true });
  await fs.writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

async function main() {
  const manifest = await readManifest();
  const errors = validateManifest(manifest);
  const summary = summarizeManifest(manifest);
  const preflight = buildPreflight(manifest, summary);
  const report = {
    generatedAt: new Date().toISOString(),
    mode,
    execute,
    mutationExecuted: false,
    manifestPath: path.relative(PROJECT_ROOT, MANIFEST_PATH).replaceAll(path.sep, "/"),
    summary,
    preflight,
    validation: { ok: errors.length === 0, errors },
    generated: [],
    faultFixtures: manifest.faultFixtures,
    stopBeforeActualMutation: true,
  };

  if (errors.length > 0) {
    await writeReport(report);
    for (const error of errors) console.error(`[FAIL] ${error}`);
    process.exit(1);
  }

  if (mode === "generate") {
    report.generated = await generateLocalFiles(manifest);
  }

  if (MUTATING_MODES.has(mode)) {
    if (!execute) {
      report.note = "Plan/preflight only. No DB or R2 mutation was executed.";
    } else {
      assertMutationGuards(manifest);
      if (mode !== "upload-seed" && mode !== "repair-e-to-g") {
        throw new Error("ACTUAL_DB_R2_MUTATION_REQUIRES_SEPARATE_USER_APPROVAL_AND_RUNTIME_EXECUTION");
      }
      try {
        if (mode === "repair-e-to-g") {
          await executeRepairEToG(manifest, report);
        } else {
          await executeUploadSeed(manifest, report);
        }
      } catch (error) {
        const targetKey = mode === "repair-e-to-g" ? "repairEToG" : "uploadSeed";
        report[targetKey] = {
          ...(report[targetKey] || {}),
          failed: true,
          error: error instanceof Error ? error.message : String(error),
        };
        await writeReport(report);
        throw error;
      }
    }
  }

  await writeReport(report);
  console.log(`Simulator attachment lifecycle mode=${mode} execute=${execute}`);
  console.log(`manifest=${report.manifestPath}`);
  console.log(`companies=${summary.companyCount} workorders=${summary.workOrderCount} files=${summary.materializedFileCount} bytes=${summary.expectedTotalBytes}`);
  console.log(`prefix=${summary.r2Prefix}`);
  console.log(`report=${path.relative(PROJECT_ROOT, REPORT_PATH).replaceAll(path.sep, "/")}`);
  if (mode === "generate") console.log(`generated=${report.generated.length}`);
  if (MUTATING_MODES.has(mode) && !execute) console.log("No DB or R2 mutation was executed.");
  if (mode === "upload-seed" && execute) {
    const reconciliation = report.uploadSeed?.reconciliation;
    console.log(`r2Uploaded=${report.uploadSeed?.upload?.successCount ?? 0} r2Failed=${report.uploadSeed?.upload?.failedCount ?? 0}`);
    console.log(`dbAttachments=${reconciliation?.dbAttachmentRowCount ?? 0} dbTrash=${reconciliation?.dbTrashRowCount ?? 0}`);
    console.log(`reconciliationIssues=${reconciliation?.issueCount ?? "unknown"}`);
  }
  if (mode === "repair-e-to-g" && execute) {
    const reconciliation = report.repairEToG?.finalReconciliation;
    console.log(`gUploaded=${report.repairEToG?.upload?.successCount ?? 0} gFailed=${report.repairEToG?.upload?.failedCount ?? 0}`);
    console.log(`legacyEDeleteFailed=${report.repairEToG?.legacyDelete?.failedCount ?? "unknown"}`);
    console.log(`reconciliationIssues=${reconciliation?.issueCount ?? "unknown"}`);
  }
}

main().catch(async (error) => {
  console.error(`[ERROR] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
