import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync("db/migrations/patch_0_24_26_signup_application_consents.sql", "utf8");

for (const token of [
  "CREATE TABLE IF NOT EXISTS signup_application_consents",
  "application_id text NOT NULL REFERENCES signup_applications(id) ON DELETE CASCADE",
  "consent_type text NOT NULL",
  "policy_code text NOT NULL",
  "policy_version text NOT NULL",
  "agreed_at timestamptz NOT NULL",
  "agreed_email_normalized text NOT NULL",
  "agreed_google_sub text NOT NULL",
  "revoked_at timestamptz",
  "revoke_reason_code text",
  "terms_of_service",
  "privacy_policy",
  "signup_application_consents_active_type_unique",
]) {
  assert.ok(migration.includes(token), `signup consent migration missing ${token}`);
}

assert.doesNotMatch(migration, /signup_applications\s+ADD|ALTER TABLE signup_applications|DROP TABLE|TRUNCATE|INSERT INTO signup_applications/i);
assert.doesNotMatch(migration, /signup_application_consents_active_version_unique/);

console.log("signup consent migration schema contract passed");
