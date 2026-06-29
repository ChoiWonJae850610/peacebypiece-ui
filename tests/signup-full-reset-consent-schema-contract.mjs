import assert from "node:assert/strict";
import fs from "node:fs";

const schema = fs.readFileSync("db/schema/full_reset.sql", "utf8");
const smoke = fs.readFileSync("db/schema/full_reset_smoke_test.sql", "utf8");

for (const token of [
  "DROP TABLE IF EXISTS signup_application_consents CASCADE",
  "CREATE TABLE signup_application_consents",
  "application_id text NOT NULL REFERENCES signup_applications(id) ON DELETE CASCADE",
  "signup_application_consents_type_check",
  "signup_application_consents_policy_code_check",
  "signup_application_consents_policy_version_check",
  "signup_application_consents_email_normalized_check",
  "signup_application_consents_google_sub_check",
  "signup_application_consents_revoke_check",
  "CREATE INDEX signup_application_consents_application_idx",
  "CREATE UNIQUE INDEX signup_application_consents_active_type_unique",
]) {
  assert.ok(schema.includes(token), `full reset schema missing ${token}`);
}

for (const token of [
  "signup_application_consents",
  "signup_application_consents_application_idx",
  "signup_application_consents_active_type_unique",
]) {
  assert.ok(smoke.includes(token), `full reset smoke missing ${token}`);
}

assert.doesNotMatch(`${schema}\n${smoke}`, /signup_application_consents_active_version_unique/);

console.log("signup full reset consent schema contract passed");
