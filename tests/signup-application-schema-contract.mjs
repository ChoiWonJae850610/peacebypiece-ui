import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync("db/migrations/patch_0_24_26_signup_applications.sql", "utf8");
const types = fs.readFileSync("lib/signup/signupApplicationTypes.ts", "utf8");
const repository = fs.readFileSync("lib/signup/signupApplicationRepository.ts", "utf8");

for (const token of [
  "CREATE TABLE IF NOT EXISTS signup_applications",
  "status text NOT NULL DEFAULT 'draft'",
  "email_verified boolean NOT NULL",
  "email_normalized text NOT NULL",
  "business_registration_number text NOT NULL",
  "business_registration_number_normalized text NOT NULL",
  "requested_plan_code text NOT NULL",
  "business_validation_summary jsonb",
  "provisioning_attempt_count integer NOT NULL DEFAULT 0",
  "created_company_id text REFERENCES companies(id)",
  "created_user_id text REFERENCES users(id)",
  "created_company_member_id text REFERENCES company_members(id)",
  "created_subscription_id text REFERENCES company_subscriptions(id)",
  "CREATE TABLE IF NOT EXISTS signup_application_files",
  "application_id text NOT NULL REFERENCES signup_applications(id) ON DELETE CASCADE",
  "approved_company_file_id text REFERENCES company_files(id) ON DELETE SET NULL",
]) {
  assert.ok(migration.includes(token), `migration missing ${token}`);
}

for (const status of [
  "draft",
  "submitted",
  "reviewing",
  "changes_requested",
  "approved",
  "rejected",
  "canceled",
  "provisioning_failed",
]) {
  assert.ok(migration.includes(`'${status}'`), `migration missing status ${status}`);
  assert.ok(types.includes(`"${status}"`), `types missing status ${status}`);
}

for (const plan of ["lite", "flow", "studio", "custom"]) {
  assert.ok(migration.includes(`'${plan}'`), `migration missing plan ${plan}`);
  assert.ok(types.includes(`"${plan}"`), `types missing plan ${plan}`);
}

assert.match(migration, /signup_applications_email_verified_check CHECK \(email_verified = true\)/);
assert.doesNotMatch(migration, /email_verified boolean NOT NULL DEFAULT true/);
assert.match(migration, /signup_applications_active_email_idx[\s\S]*email_normalized/);
assert.match(migration, /signup_applications_active_google_sub_idx[\s\S]*google_sub/);
assert.match(
  migration,
  /signup_applications_active_business_registration_idx[\s\S]*business_registration_number_normalized/,
);
assert.match(migration, /business_registration_number_normalized ~ '\^\[0-9\]\{10\}\$'/);
assert.match(migration, /signup_application_files_active_certificate_unique/);
assert.match(migration, /signup_applications_created_company_idx/);
assert.match(repository, /SIGNUP_APPLICATION_DUPLICATE_CONSTRAINTS/);

console.log("signup application schema contract passed");
