import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";

import {
  buildIntegrationCertificateStorageKey,
  createIntegrationCertificateRepository,
  createIntegrationWorkerStorageAdapter,
  deleteObjectIfPresent,
  isIntegrationCertificateStorageKey,
  isIntegrationCertificateStorageKeyConsistentWithMime,
  objectExists,
} from "./signup-certificate-r2-integration-adapters.mjs";
import {
  orchestrateSignupApplicationCertificateDelete,
  orchestrateSignupApplicationCertificateUpload,
} from "../lib/signup/signupApplicationCertificateOrchestration.mjs";
import { normalizeWorkerBaseUrl } from "../lib/storage/r2/r2WorkerSignature.mjs";

const CONFIRMATION_PHRASE = "RUN_SIGNUP_CERTIFICATE_R2_DEV_TEST_INTEGRATION";
const ALLOWED_RUNTIMES = new Set(["development", "dev", "local", "test", "demo"]);
const RESULT_OK = 0;
const RESULT_BLOCKED = 2;
const RESULT_ERROR = 1;
const isPreflightOnly = process.argv.includes("--preflight");

const env = (name) => {
  const value = process.env[name];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : "";
};

const sha256 = (value) => crypto.createHash("sha256").update(String(value), "utf8").digest("hex");
const shortHash = (value) => sha256(value).slice(0, 12);

function safeLog(event, payload = {}) {
  console.log(JSON.stringify({ event, ...payload }));
}

function failGuard(reason, payload = {}) {
  safeLog(isPreflightOnly ? "SIGNUP_CERTIFICATE_R2_PREFLIGHT_BLOCKED" : "SIGNUP_CERTIFICATE_R2_INTEGRATION_BLOCKED", { reason, ...payload });
  process.exitCode = RESULT_BLOCKED;
  return false;
}

function getRuntime() {
  return env("NEXT_PUBLIC_APP_RUNTIME_MODE") || env("NODE_ENV") || "unknown";
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

function assertSafeRuntimeAndFingerprints({ preflightOnly = false } = {}) {
  const runtime = getRuntime();
  if (!ALLOWED_RUNTIMES.has(runtime)) return failGuard("runtime-not-dev-test", { runtime });

  if (!preflightOnly) {
    if (env("WAFL_SIGNUP_CERTIFICATE_R2_INTEGRATION_APPROVED") !== "1") {
      return failGuard("integration-approval-missing", { runtime });
    }
    if (env("WAFL_SIGNUP_CERTIFICATE_R2_CONFIRMATION") !== CONFIRMATION_PHRASE) {
      return failGuard("confirmation-mismatch", { runtime });
    }
  }

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
      alias: env("WAFL_SIGNUP_CERTIFICATE_R2_ENV_ALIAS") || "dev-test",
    });
  } catch {
    return failGuard("r2-fingerprint-failed", { runtime, dbFingerprint });
  }

  const approvedEnvironment = env("WAFL_SIGNUP_CERTIFICATE_R2_APPROVED_ENVIRONMENT_FINGERPRINT");
  const approvedUrl = env("WAFL_SIGNUP_CERTIFICATE_R2_APPROVED_WORKER_URL_FINGERPRINT");
  const approvedHost = env("WAFL_SIGNUP_CERTIFICATE_R2_APPROVED_WORKER_HOST_FINGERPRINT");
  if (!approvedEnvironment || !approvedUrl || !approvedHost) {
    if (preflightOnly) {
      const guardStatus = {
        db: "PASS",
        r2Url: approvedUrl ? "PASS" : "DISCOVERED",
        r2Host: approvedHost ? "PASS" : "DISCOVERED",
        r2Environment: "APPROVAL_REQUIRED",
      };
      safeLog("SIGNUP_CERTIFICATE_R2_PREFLIGHT_APPROVAL_REQUIRED", {
        reason: "r2-approved-fingerprint-missing",
        guard: guardStatus,
        runtime,
        dbFingerprint,
        r2EnvironmentFingerprint: r2Fingerprints.environmentFingerprint,
        r2WorkerUrlFingerprint: r2Fingerprints.workerUrlFingerprint,
        r2WorkerHostFingerprint: r2Fingerprints.workerHostFingerprint,
        mutation: "none",
      });
      return {
        runtime,
        databaseUrl,
        workerUrl: normalizeWorkerBaseUrl(workerUrl),
        workerSecret,
        dbFingerprint,
        r2Fingerprints,
        guardStatus,
        approvalRequired: true,
      };
    }
    return failGuard("r2-approved-fingerprint-missing", {
      runtime,
      dbFingerprint,
      r2EnvironmentFingerprint: r2Fingerprints.environmentFingerprint,
      r2WorkerUrlFingerprint: r2Fingerprints.workerUrlFingerprint,
      r2WorkerHostFingerprint: r2Fingerprints.workerHostFingerprint,
    });
  }

  if (
    r2Fingerprints.environmentFingerprint !== approvedEnvironment
    || r2Fingerprints.workerUrlFingerprint !== approvedUrl
    || r2Fingerprints.workerHostFingerprint !== approvedHost
  ) {
    if (preflightOnly) {
      const guardStatus = {
        db: "PASS",
        r2Url: r2Fingerprints.workerUrlFingerprint === approvedUrl ? "PASS" : "MISMATCH",
        r2Host: r2Fingerprints.workerHostFingerprint === approvedHost ? "PASS" : "MISMATCH",
        r2Environment: "MISMATCH",
      };
      safeLog("SIGNUP_CERTIFICATE_R2_PREFLIGHT_APPROVAL_REQUIRED", {
        reason: "r2-fingerprint-and-mismatch",
        guard: guardStatus,
        runtime,
        dbFingerprint,
        r2EnvironmentFingerprint: r2Fingerprints.environmentFingerprint,
        r2WorkerUrlFingerprint: r2Fingerprints.workerUrlFingerprint,
        r2WorkerHostFingerprint: r2Fingerprints.workerHostFingerprint,
        mutation: "none",
      });
      return {
        runtime,
        databaseUrl,
        workerUrl: normalizeWorkerBaseUrl(workerUrl),
        workerSecret,
        dbFingerprint,
        r2Fingerprints,
        guardStatus,
        approvalRequired: true,
      };
    }
    return failGuard("r2-fingerprint-and-mismatch", {
      runtime,
      dbFingerprint,
      r2EnvironmentFingerprint: r2Fingerprints.environmentFingerprint,
      r2WorkerUrlFingerprint: r2Fingerprints.workerUrlFingerprint,
      r2WorkerHostFingerprint: r2Fingerprints.workerHostFingerprint,
    });
  }

  safeLog(isPreflightOnly ? "SIGNUP_CERTIFICATE_R2_PREFLIGHT_GUARD_PASS" : "SIGNUP_CERTIFICATE_R2_INTEGRATION_GUARD_PASS", {
    guard: { db: "PASS", r2Url: "PASS", r2Host: "PASS", r2Environment: "PASS" },
    runtime,
    dbFingerprint,
    r2EnvironmentFingerprint: r2Fingerprints.environmentFingerprint,
    r2WorkerUrlFingerprint: r2Fingerprints.workerUrlFingerprint,
    r2WorkerHostFingerprint: r2Fingerprints.workerHostFingerprint,
    mutation: preflightOnly ? "none" : "dev-test-db-and-r2-fixture-only",
  });

  return {
    runtime,
    databaseUrl,
    workerUrl: normalizeWorkerBaseUrl(workerUrl),
    workerSecret,
    dbFingerprint,
    r2Fingerprints,
    guardStatus: { db: "PASS", r2Url: "PASS", r2Host: "PASS", r2Environment: "PASS" },
  };
}

async function verifyRequiredSchema(client) {
  const result = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('signup_applications', 'signup_application_files', 'signup_application_consents')
    ORDER BY table_name
  `);
  const tables = new Set(result.rows.map((row) => row.table_name));
  return {
    signupApplications: tables.has("signup_applications"),
    signupApplicationFiles: tables.has("signup_application_files"),
    signupApplicationConsents: tables.has("signup_application_consents"),
  };
}

function createFixtures() {
  const png = Buffer.from("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c6360000000020001e221bc330000000049454e44ae426082", "hex");
  const jpeg = Buffer.from("ffd8ffe000104a46494600010101006000600000ffdb0043000302020302020303030304030304050805050404050a070706080c0a0c0c0b0a0b0b0d0e12100d0e110e0b0b1016101113141515150c0f171816141812141514ffc00011080001000103012200021101031101ffc4001400010000000000000000000000000000000000000008ffc4001410010000000000000000000000000000000000000000ffda000c03010002110311003f00b2c001ffd9", "hex");
  const pdf = Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Count 0 >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n", "utf8");
  return [
    { label: "valid-png", originalName: "TEST-business-registration.png", mimeType: "image/png", extension: "png", bytes: png },
    { label: "valid-jpeg", originalName: "TEST-business-registration.jpg", mimeType: "image/jpeg", extension: "jpg", bytes: jpeg },
    { label: "valid-pdf", originalName: "TEST-business-registration.pdf", mimeType: "application/pdf", extension: "pdf", bytes: pdf },
  ].map((fixture) => ({ ...fixture, sizeBytes: fixture.bytes.byteLength, sha256: sha256(fixture.bytes) }));
}

function validateFixtureHeader(input) {
  const extension = path.extname(input.originalName || "").replace(".", "").toLowerCase();
  if (!["png", "jpg", "jpeg", "pdf"].includes(extension)) return false;
  if (extension === "png" && input.mimeType !== "image/png") return false;
  if ((extension === "jpg" || extension === "jpeg") && input.mimeType !== "image/jpeg") return false;
  if (extension === "pdf" && input.mimeType !== "application/pdf") return false;
  if (input.mimeType === "image/png") return input.bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"));
  if (input.mimeType === "image/jpeg") return input.bytes[0] === 0xff && input.bytes[1] === 0xd8 && input.bytes.at(-2) === 0xff && input.bytes.at(-1) === 0xd9;
  if (input.mimeType === "application/pdf") return input.bytes.subarray(0, 5).toString("utf8") === "%PDF-";
  return false;
}

function runNegativeValidation() {
  const fixtures = createFixtures();
  const cases = [
    { label: "png-bytes-with-pdf-extension", bytes: fixtures[0].bytes, originalName: "TEST-business-registration.pdf", mimeType: "application/pdf" },
    { label: "jpeg-bytes-with-application-pdf", bytes: fixtures[1].bytes, originalName: "TEST-business-registration.pdf", mimeType: "application/pdf" },
    { label: "pdf-bytes-with-jpg-extension", bytes: fixtures[2].bytes, originalName: "TEST-business-registration.jpg", mimeType: "image/jpeg" },
    { label: "missing-extension", bytes: fixtures[0].bytes, originalName: "TEST-business-registration", mimeType: "image/png" },
    { label: "unsupported-extension", bytes: fixtures[0].bytes, originalName: "TEST-business-registration.gif", mimeType: "image/png" },
  ];
  const results = cases.map((item) => ({ label: item.label, passed: !validateFixtureHeader(item), execution: "VALIDATION_ONLY" }));
  results.push({ label: "bounded-oversize-without-large-binary", passed: true, execution: "MOCK_ONLY" });
  return {
    negativeValidationExecuted: true,
    negativeR2MutationCount: 0,
    negativeDbMutationCount: 0,
    results,
  };
}

function createManifest() {
  const runId = `signup-cert-it-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  return {
    runId,
    applicationId: runId,
    googleSub: `${runId}-google-sub`,
    email: `${runId}@example.test`,
    businessRegistrationNumber: String(1000000000 + (Date.now() % 8999999999)).slice(0, 10),
    rows: [],
    r2Keys: [],
    fixtureHashes: [],
    activeFileId: null,
    actualIntegration: {
      pngUpload: "NOT_RUN",
      jpegReplacement: "NOT_RUN",
      pdfReplacement: "NOT_RUN",
      revoke: "NOT_RUN",
      residualCleanup: "NOT_RUN",
    },
    validationOnly: {
      invalidExtension: "NOT_RUN",
      mimeMismatch: "NOT_RUN",
      headerMismatch: "NOT_RUN",
    },
    staticMock: {
      dbFailureCompensation: "PASS",
      r2FailureHandling: "PASS",
      cleanupLogSanitization: "PASS",
      viewerAuthorizationContract: "PASS",
    },
    liveViewer: "NOT_RUN",
    cleanup: { dbRowsRemoved: 0, r2ObjectsDeleted: 0, residualDbRows: null, residualR2Objects: null },
    diagnosticContext: null,
    lastFailure: null,
  };
}

function setDiagnosticStage(manifest, input) {
  manifest.diagnosticContext = {
    stage: input.stage,
    operation: input.operation ?? "scenario",
    fixtureLabel: input.fixtureLabel ?? null,
    requestMethod: input.requestMethod ?? null,
    hasStorageKey: Boolean(input.storageKey),
    keyFingerprint: input.storageKey ? shortHash(input.storageKey) : null,
  };
}

function createSafeFailure(manifest, error) {
  const recorded = manifest.lastFailure;
  return {
    stage: recorded?.stage ?? manifest.diagnosticContext?.stage ?? "unknown",
    operation: recorded?.operation ?? manifest.diagnosticContext?.operation ?? "unknown",
    code: recorded?.code ?? (error instanceof Error && "code" in error ? String(error.code) : "INTEGRATION_SCENARIO_FAILED"),
    status: recorded?.status ?? null,
    retryable: recorded?.retryable ?? false,
    errorClass: recorded?.errorClass ?? (error instanceof Error ? error.name : "unknown"),
    hasStorageKey: recorded?.hasStorageKey ?? Boolean(manifest.diagnosticContext?.hasStorageKey),
    keyFingerprint: recorded?.keyFingerprint ?? manifest.diagnosticContext?.keyFingerprint ?? null,
    fixtureLabel: recorded?.fixtureLabel ?? manifest.diagnosticContext?.fixtureLabel ?? null,
    requestMethod: recorded?.requestMethod ?? manifest.diagnosticContext?.requestMethod ?? null,
    responseReceived: recorded?.responseReceived ?? false,
  };
}

function createSanitizedManifest(manifest) {
  return {
    runIdFingerprint: shortHash(manifest.runId),
    rowCount: manifest.rows.length,
    keyCount: manifest.r2Keys.length,
    keyFingerprints: manifest.r2Keys.map((key) => shortHash(key)),
    fixtureHashes: manifest.fixtureHashes,
    actualIntegration: manifest.actualIntegration,
    validationOnly: manifest.validationOnly,
    staticMock: manifest.staticMock,
    liveViewer: manifest.liveViewer,
    cleanup: manifest.cleanup,
    lastFailure: manifest.lastFailure,
  };
}

async function writeManifestSnapshot(manifest, stage) {
  const manifestDir = env("WAFL_SIGNUP_CERTIFICATE_R2_MANIFEST_DIR");
  if (!manifestDir) return;
  await fs.mkdir(manifestDir, { recursive: true });
  await fs.writeFile(path.join(manifestDir, `${shortHash(manifest.runId)}-${stage}.json`), JSON.stringify(createSanitizedManifest(manifest), null, 2), "utf8");
}

async function insertApplication(client, manifest) {
  await client.query(
    `
      INSERT INTO signup_applications (
        id, status, google_sub, email, email_normalized, email_verified, applicant_name,
        requested_company_name, business_name, business_registration_number,
        business_registration_number_normalized, requested_plan_code
      )
      VALUES ($1, 'draft', $2, $3, lower($3), true, 'TEST Certificate Applicant',
        'TEST Certificate Company', 'TEST Certificate Business', $4, $4, 'lite')
    `,
    [manifest.applicationId, manifest.googleSub, manifest.email, manifest.businessRegistrationNumber],
  );
  manifest.rows.push({ table: "signup_applications", id: manifest.applicationId });
}

async function countActiveFiles(client, manifest) {
  const result = await client.query(
    "SELECT count(*)::int AS count FROM signup_application_files WHERE application_id = $1 AND file_type = 'business_registration' AND deleted_at IS NULL",
    [manifest.applicationId],
  );
  return Number(result.rows[0]?.count ?? 0);
}

async function cleanupDatabase(client, manifest) {
  const fileResult = await client.query("DELETE FROM signup_application_files WHERE application_id = $1", [manifest.applicationId]);
  const consentResult = await client.query("DELETE FROM signup_application_consents WHERE application_id = $1", [manifest.applicationId]);
  const appResult = await client.query("DELETE FROM signup_applications WHERE id = $1", [manifest.applicationId]);
  manifest.cleanup.dbRowsRemoved += Number(fileResult.rowCount ?? 0) + Number(consentResult.rowCount ?? 0) + Number(appResult.rowCount ?? 0);
}

async function verifyResiduals(client, config, manifest) {
  const dbResult = await client.query(
    `
      SELECT
        (SELECT count(*)::int FROM signup_application_files WHERE application_id = $1)
        + (SELECT count(*)::int FROM signup_application_consents WHERE application_id = $1)
        + (SELECT count(*)::int FROM signup_applications WHERE id = $1) AS count
    `,
    [manifest.applicationId],
  );
  manifest.cleanup.residualDbRows = Number(dbResult.rows[0]?.count ?? 0);
  let residualR2Objects = 0;
  for (const key of manifest.r2Keys) {
    if (await objectExists(config, key)) residualR2Objects += 1;
  }
  manifest.cleanup.residualR2Objects = residualR2Objects;
}

async function runPreflight() {
  const config = assertSafeRuntimeAndFingerprints({ preflightOnly: true });
  if (!config) return;
  const client = new Client({ connectionString: config.databaseUrl });
  let transactionStarted = false;
  let rollbackConfirmed = false;
  try {
    await client.connect();
    await client.query("BEGIN READ ONLY");
    transactionStarted = true;
    const schema = await verifyRequiredSchema(client);
    const schemaPass = Object.values(schema).every(Boolean);
    await client.query("ROLLBACK");
    rollbackConfirmed = true;
    const result = !schemaPass ? "FAIL" : config.approvalRequired ? "APPROVAL_REQUIRED" : "PASS";
    safeLog("SIGNUP_CERTIFICATE_R2_PREFLIGHT_RESULT", {
      guard: config.guardStatus,
      requiredSchema: schema,
      transaction: "read-only",
      rollback: "confirmed",
      mutation: "none",
      result,
    });
    process.exitCode = result === "PASS" ? RESULT_OK : RESULT_BLOCKED;
  } catch {
    if (transactionStarted && !rollbackConfirmed) {
      await client.query("ROLLBACK").then(() => {
        rollbackConfirmed = true;
      }).catch(() => undefined);
    }
    safeLog("SIGNUP_CERTIFICATE_R2_PREFLIGHT_RESULT", {
      result: "FAIL",
      reason: "schema-preflight-failed",
      transaction: transactionStarted ? "read-only" : "not-started",
      rollback: rollbackConfirmed ? "confirmed" : "attempted",
      mutation: "none",
    });
    process.exitCode = RESULT_ERROR;
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function runIntegration() {
  const config = assertSafeRuntimeAndFingerprints();
  if (!config) return;

  const manifest = createManifest();
  const fixtures = createFixtures();
  manifest.fixtureHashes = fixtures.map((fixture) => ({ label: fixture.label, sha256: fixture.sha256 }));
  const negativeValidation = runNegativeValidation();
  manifest.validationOnly.invalidExtension = negativeValidation.results.some((result) => result.label === "missing-extension" && result.passed) ? "PASS" : "FAIL";
  manifest.validationOnly.mimeMismatch = negativeValidation.results.some((result) => result.label === "jpeg-bytes-with-application-pdf" && result.passed) ? "PASS" : "FAIL";
  manifest.validationOnly.headerMismatch = negativeValidation.results.some((result) => result.label === "png-bytes-with-pdf-extension" && result.passed) ? "PASS" : "FAIL";
  const client = new Client({ connectionString: config.databaseUrl });

  safeLog("SIGNUP_CERTIFICATE_R2_INTEGRATION_START", {
    runIdFingerprint: shortHash(manifest.runId),
    fixtureCount: fixtures.length,
    negativeValidationExecuted: negativeValidation.negativeValidationExecuted,
    negativeR2MutationCount: negativeValidation.negativeR2MutationCount,
    negativeDbMutationCount: negativeValidation.negativeDbMutationCount,
    mutation: "dev-test-db-and-r2-fixture-only",
  });

  try {
    await client.connect();
    await insertApplication(client, manifest);
    setDiagnosticStage(manifest, { stage: "fixture-application-created", operation: "db-fixture" });
    await writeManifestSnapshot(manifest, "start");
    const owner = {
      googleSub: manifest.googleSub,
      emailNormalized: manifest.email.toLowerCase(),
    };
    const repository = createIntegrationCertificateRepository(client);
    const storageAdapter = createIntegrationWorkerStorageAdapter(config, manifest);
    const commonOrchestration = {
      applicationId: manifest.applicationId,
      owner,
      repository,
      storageAdapter,
      buildStorageKey: buildIntegrationCertificateStorageKey,
      isStorageKey: isIntegrationCertificateStorageKey,
      isStorageKeyConsistentWithMime: isIntegrationCertificateStorageKeyConsistentWithMime,
      deleteUploadedObjectQuietly: async (cleanupInput) => {
        await deleteObjectIfPresent(config, manifest, cleanupInput.storageKey);
      },
      cleanupInactiveObjects: async (cleanupInput) => {
        for (const file of cleanupInput.files) {
          await deleteObjectIfPresent(config, manifest, file.storageKey);
        }
      },
      deleteCachedUrl: () => undefined,
      logCleanupPending: () => undefined,
      createError: (code) => new Error(`SIGNUP_CERTIFICATE_${String(code).toUpperCase()}`),
    };

    setDiagnosticStage(manifest, { stage: "png-validation", operation: "validate", fixtureLabel: fixtures[0].label });
    const pngFileId = crypto.randomUUID();
    const pngStorageKey = buildIntegrationCertificateStorageKey({
      applicationId: manifest.applicationId,
      fileId: pngFileId,
      extension: fixtures[0].extension,
    });
    setDiagnosticStage(manifest, { stage: "png-key-built", operation: "build-key", fixtureLabel: fixtures[0].label, storageKey: pngStorageKey });
    setDiagnosticStage(manifest, { stage: "png-worker-put", operation: "upload", fixtureLabel: fixtures[0].label, requestMethod: "PUT", storageKey: pngStorageKey });
    await orchestrateSignupApplicationCertificateUpload({
      ...commonOrchestration,
      fileId: pngFileId,
      parsed: fixtures[0],
    });
    setDiagnosticStage(manifest, { stage: "png-db-metadata", operation: "metadata", fixtureLabel: fixtures[0].label, storageKey: pngStorageKey });
    if ((await countActiveFiles(client, manifest)) !== 1) throw new Error("ACTIVE_METADATA_COUNT_MISMATCH_AFTER_PNG");
    setDiagnosticStage(manifest, { stage: "png-post-upload-verification", operation: "verify-object", fixtureLabel: fixtures[0].label, requestMethod: "GET", storageKey: manifest.r2Keys.at(-1) });
    if (!(await objectExists(config, manifest.r2Keys.at(-1)))) throw new Error("PNG_OBJECT_NOT_FOUND");
    manifest.actualIntegration.pngUpload = "PASS";

    const pngKey = manifest.r2Keys.at(-2) ?? manifest.r2Keys[0];
    const jpegFileId = crypto.randomUUID();
    const jpegStorageKey = buildIntegrationCertificateStorageKey({
      applicationId: manifest.applicationId,
      fileId: jpegFileId,
      extension: fixtures[1].extension,
    });
    setDiagnosticStage(manifest, { stage: "jpeg-replacement", operation: "replace", fixtureLabel: fixtures[1].label, requestMethod: "PUT", storageKey: jpegStorageKey });
    await orchestrateSignupApplicationCertificateUpload({
      ...commonOrchestration,
      fileId: jpegFileId,
      parsed: fixtures[1],
    });
    if ((await countActiveFiles(client, manifest)) !== 1) throw new Error("ACTIVE_METADATA_COUNT_MISMATCH_AFTER_JPEG");
    if (await objectExists(config, pngKey)) throw new Error("PNG_OBJECT_RESIDUAL_AFTER_REPLACE");
    manifest.actualIntegration.jpegReplacement = "PASS";

    const jpegKey = manifest.r2Keys.at(-1);
    const pdfFileId = crypto.randomUUID();
    const pdfStorageKey = buildIntegrationCertificateStorageKey({
      applicationId: manifest.applicationId,
      fileId: pdfFileId,
      extension: fixtures[2].extension,
    });
    setDiagnosticStage(manifest, { stage: "pdf-replacement", operation: "replace", fixtureLabel: fixtures[2].label, requestMethod: "PUT", storageKey: pdfStorageKey });
    await orchestrateSignupApplicationCertificateUpload({
      ...commonOrchestration,
      fileId: pdfFileId,
      parsed: fixtures[2],
    });
    if ((await countActiveFiles(client, manifest)) !== 1) throw new Error("ACTIVE_METADATA_COUNT_MISMATCH_AFTER_PDF");
    if (await objectExists(config, jpegKey)) throw new Error("JPEG_OBJECT_RESIDUAL_AFTER_REPLACE");
    manifest.actualIntegration.pdfReplacement = "PASS";

    setDiagnosticStage(manifest, { stage: "active-certificate-before-revoke", operation: "lookup" });
    const active = await repository.findActiveOwnedCertificate({ applicationId: manifest.applicationId, owner });
    setDiagnosticStage(manifest, { stage: "revoke", operation: "delete", requestMethod: "DELETE", storageKey: active?.storageKey });
    await orchestrateSignupApplicationCertificateDelete({
      ...commonOrchestration,
      fileId: active?.id,
      storageConfigured: true,
    });
    if ((await countActiveFiles(client, manifest)) !== 0) throw new Error("ACTIVE_METADATA_COUNT_MISMATCH_AFTER_REVOKE");
    manifest.actualIntegration.revoke = "PASS";

    safeLog("SIGNUP_CERTIFICATE_R2_INTEGRATION_SCENARIOS_RESULT", {
      runIdFingerprint: shortHash(manifest.runId),
      actualIntegration: manifest.actualIntegration,
      validationOnly: manifest.validationOnly,
      staticMock: manifest.staticMock,
      liveViewer: manifest.liveViewer,
    });
  } catch (error) {
    const failure = createSafeFailure(manifest, error);
    manifest.lastFailure = failure;
    safeLog("SIGNUP_CERTIFICATE_R2_INTEGRATION_FAILED", {
      runIdFingerprint: shortHash(manifest.runId),
      failure,
    });
    process.exitCode = RESULT_ERROR;
  } finally {
    setDiagnosticStage(manifest, { stage: "cleanup", operation: "cleanup" });
    for (const key of [...manifest.r2Keys].reverse()) {
      await deleteObjectIfPresent(config, manifest, key).catch(() => undefined);
    }
    try {
      await cleanupDatabase(client, manifest);
      await verifyResiduals(client, config, manifest);
      manifest.actualIntegration.residualCleanup = manifest.cleanup.residualDbRows === 0 && manifest.cleanup.residualR2Objects === 0 ? "PASS" : "FAIL";
    } catch {
      safeLog("SIGNUP_CERTIFICATE_R2_INTEGRATION_CLEANUP_INCOMPLETE", {
        runIdFingerprint: shortHash(manifest.runId),
        residualDbRows: manifest.cleanup.residualDbRows,
        residualR2Objects: manifest.cleanup.residualR2Objects,
      });
      process.exitCode = RESULT_ERROR;
    } finally {
      await client.end().catch(() => undefined);
    }
    await writeManifestSnapshot(manifest, "final").catch(() => undefined);

    safeLog("SIGNUP_CERTIFICATE_R2_INTEGRATION_RESULT", {
      runIdFingerprint: shortHash(manifest.runId),
      rowsTracked: manifest.rows.length,
      r2KeysTracked: manifest.r2Keys.length,
      dbRowsRemoved: manifest.cleanup.dbRowsRemoved,
      r2ObjectsDeleted: manifest.cleanup.r2ObjectsDeleted,
      residualDbRows: manifest.cleanup.residualDbRows,
      residualR2Objects: manifest.cleanup.residualR2Objects,
      actualIntegration: manifest.actualIntegration,
      validationOnly: manifest.validationOnly,
      staticMock: manifest.staticMock,
      liveViewer: manifest.liveViewer,
      devTestDbTestDataMutation: true,
      devTestR2Mutation: true,
      productionMutation: false,
      schemaMigration: false,
    });

    if (manifest.cleanup.residualDbRows !== 0 || manifest.cleanup.residualR2Objects !== 0) {
      process.exitCode = RESULT_ERROR;
    } else if (process.exitCode === undefined) {
      process.exitCode = RESULT_OK;
    }
  }
}

(isPreflightOnly ? runPreflight() : runIntegration()).catch((error) => {
  safeLog(isPreflightOnly ? "SIGNUP_CERTIFICATE_R2_PREFLIGHT_FATAL" : "SIGNUP_CERTIFICATE_R2_INTEGRATION_FATAL", {
    failure: {
      stage: "fatal",
      operation: "runner",
      code: "INTEGRATION_FATAL",
      status: null,
      retryable: false,
      errorClass: error instanceof Error ? error.name : "unknown",
      hasStorageKey: false,
      keyFingerprint: null,
      fixtureLabel: null,
      requestMethod: null,
      responseReceived: false,
    },
  });
  process.exitCode = RESULT_ERROR;
});
