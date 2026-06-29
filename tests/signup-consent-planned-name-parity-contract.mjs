import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync("db/migrations/patch_0_24_26_signup_application_consents.sql", "utf8");
const audit = fs.readFileSync("db/audits/0.24.26-signup-consents-migration-compatibility-readonly.sql", "utf8");

const migrationIndexNames = [
  ...migration.matchAll(/CREATE (?:UNIQUE )?INDEX IF NOT EXISTS ([a-z0-9_]+)/g),
].map((match) => match[1]).sort();
const auditPlannedNames = [
  ...audit.matchAll(/\('([a-z0-9_]+)'\)/g),
].map((match) => match[1]).filter((name) => name.endsWith("_idx") || name.endsWith("_unique")).sort();

assert.ok(migrationIndexNames.length > 0, "signup consent migration must declare planned indexes");
assert.deepEqual(auditPlannedNames, migrationIndexNames);

console.log("signup consent planned-name parity contract passed");
