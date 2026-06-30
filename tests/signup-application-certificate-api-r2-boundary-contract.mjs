import assert from "node:assert/strict";
import fs from "node:fs";

const policy = fs.readFileSync("lib/signup/signupApplicationFilePolicy.ts", "utf8");
const repository = fs.readFileSync("lib/signup/signupApplicationCertificateRepository.ts", "utf8");
const service = fs.readFileSync("lib/signup/signupApplicationCertificateService.ts", "utf8");
const orchestration = fs.readFileSync("lib/signup/signupApplicationCertificateOrchestration.mjs", "utf8");
const route = fs.readFileSync("app/api/signup/application/certificate/route.ts", "utf8");
const viewer = fs.readFileSync("app/api/system/signup/applications/[applicationId]/certificate/[fileId]/view/route.ts", "utf8");
const workerUpload = fs.readFileSync("lib/storage/r2/r2WorkerUpload.ts", "utf8");
const dashboard = fs.readFileSync("components/signup/SignupApplicationDashboard.tsx", "utf8");

for (const token of [
  'SIGNUP_APPLICATION_CERTIFICATE_MAX_BYTES = 10 * 1024 * 1024',
  '"image/png"',
  '"image/jpeg"',
  '"application/pdf"',
  "validateSignupApplicationCertificateBytes",
  "sanitizeSignupApplicationCertificateOriginalName",
  "isSignupApplicationCertificateStorageKeyConsistentWithMime",
  "buildSignupApplicationCertificateStorageKey",
  "isSupportedSignupApplicationCertificateStorageKey",
]) {
  assert.ok(policy.includes(token), `certificate policy missing ${token}`);
}

for (const token of [
  "FOR UPDATE",
  "status IN ('draft', 'changes_requested')",
  "UPDATE signup_application_files",
  "SET deleted_at = now()",
  "INSERT INTO signup_application_files",
  "file_type = $4",
  "deleted_at IS NULL",
  "SET deleted_at = now()",
  "signup_application_files",
]) {
  assert.ok(repository.includes(token), `certificate repository missing ${token}`);
}

for (const token of [
  "createR2WorkerUploadUrl",
  "deleteR2ObjectViaWorker",
  "deleteUploadedObjectQuietly",
  "cleanupInactiveCertificateObjects",
  "orchestrateSignupApplicationCertificateUpload",
  "orchestrateSignupApplicationCertificateDelete",
  "SIGNUP_CERTIFICATE_R2_CLEANUP_PENDING",
  "hasStorageKey: Boolean",
]) {
  assert.ok(service.includes(token), `certificate service missing ${token}`);
}

for (const token of [
  "storageAdapter.upload",
  "createActiveOwnedCertificate",
  "deleteActiveOwnedCertificate",
  "metadata-save-failed",
  "delete-after-metadata-revoke",
]) {
  assert.ok(orchestration.includes(token), `certificate orchestration missing ${token}`);
}

for (const token of [
  "getCurrentSignupApplicantSession",
  "isSameOriginSignupMutation",
  "assertSignupRateLimitExtensionPoint",
  "request.formData()",
  "Cache-Control",
  "no-store",
]) {
  assert.ok(route.includes(token), `certificate API route missing ${token}`);
}

for (const token of [
  "requireSystemAdminScope",
  "getR2Object",
  "SIGNUP_CERTIFICATE_DOWNLOAD_BLOCKED",
  "Content-Disposition",
  "createInlineDisposition",
  "isObjectContentTypeConsistent",
  "isSignupApplicationCertificateStorageKeyConsistentWithMime",
  "X-Content-Type-Options",
  "no-store",
]) {
  assert.ok(viewer.includes(token), `system certificate viewer missing ${token}`);
}

assert.match(workerUpload, /isSupportedSignupApplicationCertificateStorageKey/);
assert.ok(repository.indexOf("UPDATE signup_application_files") < repository.indexOf("INSERT INTO signup_application_files"), "replacement must inactive old certificate before inserting new active row");
assert.ok(orchestration.indexOf("deleteActiveOwnedCertificate") < orchestration.indexOf("delete-after-metadata-revoke"), "delete must mark DB inactive before R2 cleanup");
assert.match(policy, /throw new Error\(SIGNUP_APPLICATION_CERTIFICATE_ERROR_CODES\.extensionUnsupported\)/);
assert.match(policy, /UNSAFE_ORIGINAL_NAME_PATTERN/);
assert.match(service, /catch \{\s+throw new SignupApplicationApiError\(SIGNUP_APPLICATION_CERTIFICATE_ERROR_CODES\.extensionUnsupported/s);
assert.doesNotMatch(`${route}\n${service}\n${viewer}\n${dashboard}`, /signedUrl|publicUrl|downloadUrl|storageKey:\s*file\.storageKey|bucketName|R2_BUCKET_NAME|R2_SECRET|raw_card|payment_reference/i);
assert.match(dashboard, /accept="image\/png,image\/jpeg,application\/pdf/);
assert.match(dashboard, /fetch\("\/api\/signup\/application\/certificate"/);

console.log("signup application certificate API/R2 boundary contract: OK");
