import assert from "node:assert/strict";
import fs from "node:fs";

const runner = fs.readFileSync("scripts/run-readonly-db-audit.mjs", "utf8");
const audit = fs.readFileSync("db/audits/0.24.26-signup-migration-compatibility-readonly.sql", "utf8");
const migration = fs.readFileSync("db/migrations/patch_0_24_26_signup_applications.sql", "utf8");

assert.ok(runner.includes("'signup-compatibility'"), "read-only runner must expose signup compatibility mode");

for (const token of [
  "system_users",
  "companies",
  "users",
  "company_members",
  "company_subscriptions",
  "company_files",
  "gen_random_uuid",
  "signup_applications",
  "signup_application_files",
  "signup_applications_active_business_registration_idx",
  "signup_application_files_active_certificate_unique",
  "missing_table",
  "missing_id_column",
  "id_type_drift",
  "missing_or_incompatible",
]) {
  assert.ok(audit.includes(token), `signup compatibility audit missing ${token}`);
}

for (const token of [
  "BEGIN READ ONLY",
  "ROLLBACK",
  "Mutation: none",
  "Transaction: rolled back",
  "Total compatibility findings",
  "Result:",
  "findingModes.has(mode)",
  "process.exitCode = totalResultRows > 0 ? 2 : 0",
]) {
  assert.ok(runner.includes(token), `read-only runner missing ${token}`);
}

assert.ok(runner.includes("WAFL_DB_AUDIT_APPROVED"), "runner must require explicit read-only approval flag");
assert.ok(runner.includes("DATABASE_URL is required"), "runner must require DATABASE_URL without printing it");
assert.doesNotMatch(runner, /console\.log\([^)]*DATABASE_URL|connectionString\)/);

const withoutComments = audit.replace(/--.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
assert.doesNotMatch(
  withoutComments,
  /\b(insert|update|delete|merge|alter|drop|truncate|create|grant|revoke|comment|copy|call|do|vacuum|analyze|refresh|reindex|cluster|set)\b/i,
);

for (const statement of withoutComments.split(";").map((value) => value.trim()).filter(Boolean)) {
  assert.match(statement, /^(select|with)\b/i, "every audit statement must be read-only SELECT/WITH");
}

assert.ok(audit.includes("public_namespace"), "audit must scope relation checks to public namespace");
assert.doesNotMatch(audit, /LEFT JOIN pg_class\s+ON pg_class\.relname/);
assert.doesNotMatch(audit, /JOIN pg_class\s+ON pg_class\.relname/);
assert.match(audit, /public_relation\.relnamespace = public_namespace\.oid/);
assert.match(audit, /columns\.table_schema = 'public'/);

const migrationIndexNames = [
  ...migration.matchAll(/CREATE (?:UNIQUE )?INDEX IF NOT EXISTS ([a-z0-9_]+)/g),
].map((match) => match[1]).sort();
const auditPlannedNames = [
  ...audit.matchAll(/\('([a-z0-9_]+)'\)/g),
].map((match) => match[1]).filter((name) => name.endsWith("_idx") || name.endsWith("_unique")).sort();

assert.deepEqual(auditPlannedNames, migrationIndexNames, "audit planned names must match migration indexes");

console.log("signup migration compatibility audit contract passed");
