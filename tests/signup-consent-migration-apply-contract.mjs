import assert from "node:assert/strict";
import fs from "node:fs";

const runner = fs.readFileSync("scripts/run-approved-db-migration.mjs", "utf8");
const smoke = fs.readFileSync("scripts/run-signup-consent-rollback-smoke.mjs", "utf8");
const pipeline = fs.readFileSync("tools/pipeline/peacebypiece-auto-pipeline.ps1", "utf8");

for (const token of [
  "signup-consents",
  "db/migrations/patch_0_24_26_signup_application_consents.sql",
  "WAFL_DB_MIGRATION_APPROVED",
  "Migration SHA-256",
  "Production migration: false",
  "Business data mutation: false",
  "R2 mutation: false",
  "Unexpected duplicate active version unique index remains",
]) {
  assert.ok(runner.includes(token), `approved migration runner missing ${token}`);
}

for (const token of [
  "WAFL_DB_AUDIT_APPROVED",
  "BEGIN",
  "SAVEPOINT",
  "ROLLBACK TO SAVEPOINT",
  "ROLLBACK",
  "duplicate active application/type",
  "invalid consent type",
  "empty policy code",
  "empty google sub",
  "missing application FK",
  "Residual rows:",
  "Result: PASS",
]) {
  assert.ok(smoke.includes(token), `signup consent rollback smoke missing ${token}`);
}

for (const token of [
  "ApplySignupConsentMigration",
  "RunSignupConsentPostApplyAudit",
  "RunSignupConsentRollbackSmoke",
  "WAFL_DB_MIGRATION_APPROVED = '1'",
  "WAFL_DB_AUDIT_APPROVED = '1'",
  "DB_Audit",
]) {
  assert.ok(pipeline.includes(token), `pipeline migration/smoke path missing ${token}`);
}

assert.doesNotMatch(runner, /DATABASE_URL.*console|connectionString.*console|credential|password/i);
assert.doesNotMatch(smoke, /DATABASE_URL.*console|connectionString.*console|credential|password/i);

console.log("signup consent migration apply contract passed");
