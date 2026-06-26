#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const MANIFEST_PATH = path.join(PROJECT_ROOT, "tools", "simulator", "fixtures", "attachments", "canonical-lifecycle-manifest.json");
const OUT_ROOT = path.join(PROJECT_ROOT, ".tmp", "simulator", "attachments");
const REPORT_DIR = path.join(PROJECT_ROOT, "artifacts", "test-reports", "functions");
const REPORT_PATH = path.join(REPORT_DIR, "simulator-attachment-lifecycle-latest.json");

const ALLOWED_RUNTIMES = new Set(["development", "dev", "local", "test", "demo"]);
const DATABASE_KEYS = ["DATABASE_URL", "POSTGRES_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL_NON_POOLING", "NEON_DATABASE_URL"];
const MUTATING_MODES = new Set(["upload-seed", "lifecycle", "cleanup", "fault-execute"]);
const VALID_MODES = new Set(["plan", "generate", "upload-seed", "verify", "lifecycle", "cleanup", "fault-plan", "fault-execute"]);
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

function r2Identity() {
  const accountId = readEnv("R2_ACCOUNT_ID");
  const bucketName = readEnv("R2_BUCKET_NAME");
  if (!accountId || !bucketName) return { present: false, fingerprint: null };
  return {
    present: true,
    fingerprint: hashPrefix(`${accountId}/${bucketName}`),
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

async function generateLocalFiles(manifest) {
  const generated = [];
  const filesRoot = path.join(OUT_ROOT, "files");
  for (const item of manifest.normalLifecycleFixtures.filter(isNormalMaterializedAttachment)) {
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
  const r2 = r2Identity();
  const approvedDbFingerprint = readEnv("WAFL_SIMULATOR_APPROVED_DB_FINGERPRINT");
  const approvedR2Fingerprint = readEnv("WAFL_SIMULATOR_APPROVED_R2_FINGERPRINT");
  return {
    targetRuntime: runtime || "unset",
    neonFingerprint: db.fingerprint || "unavailable",
    neonFingerprintApproved: Boolean(db.fingerprint && approvedDbFingerprint && db.fingerprint === approvedDbFingerprint.toLowerCase()),
    r2AccountBucketFingerprint: r2.fingerprint || "unavailable",
    r2FingerprintApproved: Boolean(r2.fingerprint && approvedR2Fingerprint && r2.fingerprint === approvedR2Fingerprint.toLowerCase()),
    targetCompanyCount: summary.companyCount,
    targetWorkOrderCount: summary.workOrderCount,
    generatedFileCount: summary.materializedFileCount,
    expectedTotalBytes: summary.expectedTotalBytes,
    simulatorPrefix: manifest.testPrefix,
    dbMutationRange: "attachments, attachment_trash_items, storage_usage_snapshots rows whose ids/company ids start with wafl-fn and are listed in the canonical manifest",
    r2MutationRange: "only canonical_r2_key values listed in the manifest under companies/wafl-fn-company-*/workorders/*",
    cleanupRange: "only manifest attachment ids, trash items, snapshots, and exact manifest R2 keys; no whole bucket or broad prefix delete",
    confirmationString: confirmationForMode(mode),
    resumeRollbackCompensation: "Re-run verify to detect partial state. Re-run upload-seed for idempotent DB metadata repair. Cleanup deletes only manifest R2 keys after key validation and then marks/removes simulator metadata. If R2 delete fails, DB metadata is not removed.",
  };
}

function confirmationForMode(value) {
  if (value === "upload-seed") return "UPLOAD SEED WAF-FN ATTACHMENTS";
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
  const r2 = r2Identity();
  if (!db.present || !db.protocolOk || !db.fingerprint) throw new Error("mutation blocked: valid PostgreSQL identity required");
  if (!r2.present || !r2.fingerprint) throw new Error("mutation blocked: R2 account/bucket identity required");
  if (db.fingerprint !== String(readEnv("WAFL_SIMULATOR_APPROVED_DB_FINGERPRINT") || "").toLowerCase()) throw new Error("mutation blocked: DB fingerprint mismatch");
  if (r2.fingerprint !== String(readEnv("WAFL_SIMULATOR_APPROVED_R2_FINGERPRINT") || "").toLowerCase()) throw new Error("mutation blocked: R2 fingerprint mismatch");
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
      throw new Error("ACTUAL_DB_R2_MUTATION_REQUIRES_SEPARATE_USER_APPROVAL_AND_RUNTIME_EXECUTION");
    }
  }

  await writeReport(report);
  console.log(`Simulator attachment lifecycle mode=${mode} execute=${execute}`);
  console.log(`manifest=${report.manifestPath}`);
  console.log(`companies=${summary.companyCount} workorders=${summary.workOrderCount} files=${summary.materializedFileCount} bytes=${summary.expectedTotalBytes}`);
  console.log(`prefix=${summary.r2Prefix}`);
  console.log(`report=${path.relative(PROJECT_ROOT, REPORT_PATH).replaceAll(path.sep, "/")}`);
  if (mode === "generate") console.log(`generated=${report.generated.length}`);
  if (MUTATING_MODES.has(mode)) console.log("No DB or R2 mutation was executed.");
}

main().catch(async (error) => {
  console.error(`[ERROR] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
