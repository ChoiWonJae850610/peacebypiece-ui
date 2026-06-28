import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync("db/migrations/patch_0_24_26_signup_applications.sql", "utf8");
const policy = fs.readFileSync("lib/signup/signupApplicationFilePolicy.ts", "utf8");

for (const token of [
  "CREATE TABLE IF NOT EXISTS signup_application_files",
  "application_id text NOT NULL REFERENCES signup_applications(id) ON DELETE CASCADE",
  "approved_company_file_id text REFERENCES company_files(id) ON DELETE SET NULL",
  "signup_application_files_active_certificate_unique",
]) {
  assert.ok(migration.includes(token), `certificate migration contract missing ${token}`);
}

for (const token of [
  'SIGNUP_APPLICATION_FILE_STORAGE_ROOT = "signup-applications"',
  'SIGNUP_APPLICATION_CERTIFICATE_DIRECTORY = "business-registration"',
  "buildSignupApplicationCertificateStorageKey",
  "isSignupApplicationCertificateStorageKey",
  "isWaflProvidedCertificateDownloadAllowed",
  "isSignupApplicationCertificateCleanupKey",
  "SignupApplicationCertificateApprovalLink",
]) {
  assert.ok(policy.includes(token), `certificate policy contract missing ${token}`);
}

assert.doesNotMatch(policy, /companies\/|company-files|R2|DeleteObject|PutObject|downloadAllowed:\s*true/i);

console.log("signup application certificate storage ownership contract passed");
