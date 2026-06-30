import assert from "node:assert/strict";
import fs from "node:fs";

const runner = fs.readFileSync("scripts/run-signup-certificate-r2-integration.mjs", "utf8");
const adapter = fs.readFileSync("scripts/signup-certificate-r2-integration-adapters.mjs", "utf8");
const runnerAndAdapter = `${runner}\n${adapter}`;
const pipeline = fs.readFileSync("tools/pipeline/peacebypiece-auto-pipeline.ps1", "utf8");
const config = fs.readFileSync("tools/pipeline/pipeline.config.psd1", "utf8");

for (const token of [
  "RUN_SIGNUP_CERTIFICATE_R2_DEV_TEST_INTEGRATION",
  "WAFL_SIGNUP_CERTIFICATE_R2_INTEGRATION_APPROVED",
  "WAFL_SIGNUP_CERTIFICATE_R2_CONFIRMATION",
  "WAFL_DB_AUDIT_APPROVED",
  "WAFL_APPROVED_DB_FINGERPRINT",
  "WAFL_SIGNUP_CERTIFICATE_R2_APPROVED_ENVIRONMENT_FINGERPRINT",
  "WAFL_SIGNUP_CERTIFICATE_R2_APPROVED_WORKER_URL_FINGERPRINT",
  "WAFL_SIGNUP_CERTIFICATE_R2_APPROVED_WORKER_HOST_FINGERPRINT",
  "r2-approved-fingerprint-missing",
  "r2-fingerprint-and-mismatch",
  "runtime-not-dev-test",
  "db-fingerprint-mismatch",
  "SIGNUP_CERTIFICATE_R2_PREFLIGHT_APPROVAL_REQUIRED",
  "APPROVAL_REQUIRED",
  "DISCOVERED",
  "MISMATCH",
  "BEGIN READ ONLY",
  "ROLLBACK",
  "transaction: \"read-only\"",
  "rollback: \"confirmed\"",
  "setDiagnosticStage",
  "createSafeFailure",
  "lastFailure",
  "stage: recorded?.stage",
  "keyFingerprint",
  "responseReceived",
]) {
  assert.ok(runner.includes(token), `runner guard missing ${token}`);
}

assert.match(runner, /if \(!approvedEnvironment \|\| !approvedUrl \|\| !approvedHost\)/, "blank environment/url/host fingerprint must block");
assert.match(runner, /r2Url: approvedUrl \? "PASS" : "DISCOVERED"/, "blank URL fingerprint discovery must not be logged as PASS");
assert.match(runner, /r2Host: approvedHost \? "PASS" : "DISCOVERED"/, "blank host fingerprint discovery must not be logged as PASS");
assert.match(runner, /r2Environment: "APPROVAL_REQUIRED"/, "blank environment fingerprint must be approval required");
assert.match(runner, /r2Fingerprints\.environmentFingerprint !== approvedEnvironment[\s\S]*r2Fingerprints\.workerUrlFingerprint !== approvedUrl[\s\S]*r2Fingerprints\.workerHostFingerprint !== approvedHost/, "R2 fingerprints must be AND-required");
assert.doesNotMatch(runner, /approvedR2Fingerprints\.some|currentR2Fingerprints\.includes/, "R2 fingerprint guard must not allow OR matching");
assert.match(runner, /shortHash\(`\$\{normalizedUrl\}\|\$\{input\.runtime\}\|\$\{alias\}`\)/, "environment fingerprint must include normalized URL, runtime, and alias");

for (const token of [
  "signup-applications",
  "business-registration",
  "createManifest",
  "manifest.r2Keys.push(input.storageKey)",
  "manifest.rows.push",
  "finally",
  "cleanupDatabase",
  "verifyResiduals",
  "residualDbRows",
  "residualR2Objects",
  "workerRequest(config, \"GET\"",
  "valid-png",
  "valid-jpeg",
  "valid-pdf",
  "png-bytes-with-pdf-extension",
  "jpeg-bytes-with-application-pdf",
  "pdf-bytes-with-jpg-extension",
  "missing-extension",
  "unsupported-extension",
  "bounded-oversize-without-large-binary",
  "negativeValidationExecuted",
  "negativeR2MutationCount: 0",
  "negativeDbMutationCount: 0",
  "actualIntegration",
  "validationOnly",
  "staticMock",
  "liveViewer",
  "NOT_RUN",
  "orchestrateSignupApplicationCertificateUpload",
  "orchestrateSignupApplicationCertificateDelete",
  "createIntegrationCertificateRepository",
  "createIntegrationWorkerStorageAdapter",
  "IntegrationWorkerRequestError",
  "R2_WORKER_REQUEST_FAILED_",
  "R2_WORKER_${method}_NETWORK_ERROR",
]) {
  assert.ok(runnerAndAdapter.includes(token), `runner scenario/cleanup missing ${token}`);
}

assert.doesNotMatch(runner, /UPDATE signup_application_files|INSERT INTO signup_application_files|FOR UPDATE|RETURNING storage_key/, "runner body must not duplicate certificate metadata SQL");
assert.match(runner, /orchestrateSignupApplicationCertificateUpload[\s\S]*orchestrateSignupApplicationCertificateDelete/, "runner must call shared certificate service orchestration");

const preflightStart = runner.indexOf("async function runPreflight");
const preflightEnd = runner.indexOf("async function runIntegration", preflightStart);
const preflightBody = runner.slice(preflightStart, preflightEnd);
assert.match(preflightBody, /BEGIN READ ONLY/, "preflight must start a read-only transaction");
assert.match(preflightBody, /ROLLBACK/, "preflight must always attempt rollback");
assert.doesNotMatch(preflightBody, /COMMIT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TRUNCATE/i, "preflight must be SELECT-only and never commit");

assert.doesNotMatch(runner, /console\.log\(.*DATABASE_URL/);
assert.doesNotMatch(runner, /console\.log\(.*R2_WORKER_UPLOAD_SECRET/);
assert.doesNotMatch(runner, /R2_ENDPOINT|R2_ACCESS_KEY_ID|R2_SECRET_ACCESS_KEY/);
assert.doesNotMatch(runnerAndAdapter, /response\.text\(\)[\s\S]*safeLog|body:\s*deleteError\.body|message:\s*error\.message|stack:\s*error\.stack/, "diagnostics must not log raw response bodies, messages, or stack traces");
assert.doesNotMatch(runner, /ListObjectsV2Command|DeleteObjectsCommand|bucket delete|LIKE/i);
assert.match(runner, /keyFingerprints: manifest\.r2Keys\.map/, "manifest may store key fingerprints only");
assert.doesNotMatch(runner, /JSON\.stringify\(manifest/, "raw manifest with keys/email/google_sub must not be written");
assert.doesNotMatch(runner, /reason: error instanceof Error \? error\.name : "unknown"/, "failure logs must include safe stage/code diagnostics, not generic Error-only reason");

for (const token of [
  "[switch]$RunSignupCertificateR2IntegrationPreflight",
  "[switch]$RunSignupCertificateR2IntegrationTest",
  "function RunSignupCertificateR2IntegrationPreflight",
  "function RunSignupCertificateR2IntegrationTest",
  "44. Signup Certificate R2 Integration Test",
  "45. Signup Certificate R2 Integration Preflight",
  "RunSignupCertificateR2IntegrationTest | Out-Null",
  "RunSignupCertificateR2IntegrationPreflight | Out-Null",
  "RunSignupCertificateR2IntegrationTest -PauseAfter $false",
  "RunSignupCertificateR2IntegrationPreflight -PauseAfter $false",
  "node scripts/run-signup-certificate-r2-integration.mjs --preflight",
  "-ApprovalRequiredExitCode 2",
  '-ApprovalRequiredResultToken "Result: APPROVAL_REQUIRED"',
  "Join-Path (Split-Path -Parent $LogDir) \"R2_Test\"",
  "-ResultDirectory $r2TestLogDir",
  "WAFL_SIGNUP_CERTIFICATE_R2_MANIFEST_DIR = $r2TestLogDir",
  "WAFL_SIGNUP_CERTIFICATE_R2_INTEGRATION_APPROVED = '1'",
  "WAFL_SIGNUP_CERTIFICATE_R2_CONFIRMATION = 'RUN_SIGNUP_CERTIFICATE_R2_DEV_TEST_INTEGRATION'",
  "WAFL_SIGNUP_CERTIFICATE_R2_ENV_ALIAS = 'dev-test'",
  "WAFL_SIGNUP_CERTIFICATE_R2_APPROVED_ENVIRONMENT_FINGERPRINT",
  "WAFL_SIGNUP_CERTIFICATE_R2_APPROVED_WORKER_URL_FINGERPRINT",
  "WAFL_SIGNUP_CERTIFICATE_R2_APPROVED_WORKER_HOST_FINGERPRINT",
  "TestReadOnlyDbAuditGuard",
]) {
  assert.ok(pipeline.includes(token), `PowerShell integration menu missing ${token}`);
}

assert.ok(config.includes('ApprovedWorkerEnvironmentFingerprint = "cd6334cbc703"'), "approved environment fingerprint must match the user-approved preflight value");
assert.ok(pipeline.includes('$statusPrefix = "ApprovalRequired"'), "preflight approval-required exit 2 must not be labeled failed");
assert.ok(pipeline.includes('LogWarning "$Title 승인 필요. ExitCode: $testExitCode"'), "approval-required results must be reported distinctly");
assert.ok(pipeline.includes("0~45"), "developer menu input range must include 45");
assert.doesNotMatch(pipeline, /Newest.*Signup_Certificate_R2_Integration_Test/, "integration logs must not target 4. Newest");

const integrationStart = pipeline.indexOf("function RunSignupCertificateR2IntegrationTest");
const integrationEnd = pipeline.indexOf("function RunSignupCertificateR2IntegrationPreflight", integrationStart);
const integrationFunction = integrationStart >= 0 && integrationEnd > integrationStart ? pipeline.slice(integrationStart, integrationEnd) : "";
assert.ok(integrationFunction, "integration function body must be present");
assert.doesNotMatch(integrationFunction, /patch_0_24_26_signup|InvokeApprovedDbMigrationCommand|ApplySignupConsentMigration|run-approved-db-migration/i, "integration menu must not call migration scripts");

const service = fs.readFileSync("lib/signup/signupApplicationCertificateService.ts", "utf8");
const orchestration = fs.readFileSync("lib/signup/signupApplicationCertificateOrchestration.mjs", "utf8");
assert.match(service, /orchestrateSignupApplicationCertificateUpload/, "production certificate service must use shared upload orchestration");
assert.match(service, /orchestrateSignupApplicationCertificateDelete/, "production certificate service must use shared delete orchestration");
assert.match(orchestration, /storageAdapter\.upload[\s\S]*repository\.createActiveOwnedCertificate/, "shared upload orchestration must upload before metadata transaction");
assert.match(orchestration, /repository\.deleteActiveOwnedCertificate[\s\S]*deleteUploadedObjectQuietly/, "shared delete orchestration must revoke metadata before exact-key delete");

console.log("signup certificate R2 integration harness contract: OK");
