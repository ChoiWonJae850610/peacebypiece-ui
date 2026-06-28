import assert from "node:assert/strict";
import fs from "node:fs";

const runner = fs.readFileSync("scripts/run-readonly-db-audit.mjs", "utf8");
const audit = fs.readFileSync("db/audits/0.24.26-signup-post-apply-schema-readonly.sql", "utf8");
const smoke = fs.readFileSync("db/audits/0.24.26-signup-schema-smoke-rollback.sql", "utf8");
const reset = fs.readFileSync("db/schema/full_reset.sql", "utf8");
const resetSmoke = fs.readFileSync("db/schema/full_reset_smoke_test.sql", "utf8");

assert.ok(runner.includes("'signup-post-apply': 'db/audits/0.24.26-signup-post-apply-schema-readonly.sql'"));
assert.ok(runner.includes("'signup-post-apply'"));

for (const token of [
  "signup_applications",
  "signup_application_files",
  "signup_application_files_application_id_fkey",
  "signup_applications_reviewed_by_system_user_id_fkey",
  "signup_applications_created_company_id_fkey",
  "signup_applications_created_user_id_fkey",
  "signup_applications_created_company_member_id_fkey",
  "signup_applications_created_subscription_id_fkey",
  "signup_application_files_approved_company_file_id_fkey",
  "signup_applications_email_verified_check",
  "signup_applications_email_normalized_check",
  "signup_applications_business_registration_check",
  "signup_applications_status_provisioning_consistency_check",
  "signup_applications_review_queue_idx",
  "signup_application_files_active_certificate_unique",
  "smoke_residue",
  "signup-smoke-%",
]) {
  assert.ok(audit.includes(token), `post-apply audit missing ${token}`);
}

assert.doesNotMatch(audit.replace(/--.*$/gm, ""), /\b(create|alter|drop|insert|update|delete|truncate|merge)\b/i);
assert.match(smoke, /^BEGIN;/);
assert.match(smoke, /ROLLBACK;/);
assert.match(smoke, /email_verified=false was accepted/);
assert.match(smoke, /email_normalized mismatch was accepted/);
assert.match(smoke, /business registration normalization mismatch was accepted/);
assert.match(smoke, /empty google_sub was accepted/);
assert.match(smoke, /status\/provisioning mismatch was accepted/);
assert.match(smoke, /duplicate active email was accepted/);
assert.match(smoke, /duplicate active business registration was accepted/);
assert.match(smoke, /second active certificate was accepted/);

for (const token of [
  "CREATE TABLE signup_applications",
  "CREATE TABLE signup_application_files",
  "DROP TABLE IF EXISTS signup_application_files CASCADE",
  "DROP TABLE IF EXISTS signup_applications CASCADE",
  "CREATE UNIQUE INDEX signup_application_files_active_certificate_unique",
  "104857600",
]) {
  assert.ok(reset.includes(token), `full_reset missing ${token}`);
}

for (const token of [
  "signup_applications",
  "signup_application_files",
  "signup_applications_active_email_idx",
  "signup_application_files_storage_key_unique",
]) {
  assert.ok(resetSmoke.includes(token), `full_reset smoke missing ${token}`);
}

console.log("signup post-apply schema audit contract passed");
