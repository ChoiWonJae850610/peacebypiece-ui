#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const migration = read("db/v2/migrations/008_v2_tenant_document_number_settings_function.sql");
const repository = read("lib/domain/work-orders/command/issueRepository.ts");
const preflight = read("scripts/run-wafl-v2-alpha27-revision-issue-preflight.mjs");
const migrationRunner = read("scripts/run-wafl-v2-alpha27a-number-settings-migration.mjs");
const pipeline = read("tools/pipeline/peacebypiece-auto-pipeline.ps1");
const fixtureRunner = read("scripts/run-wafl-v2-alpha27a-settings-fixture.mjs");

for (const token of [
  "EXECUTION IS PROHIBITED WITHOUT THE APPROVED ALPHA.27A DEV/TEST GATE",
  "2.0.0-alpha.27a-dev-test-reviewed",
  "CREATE OR REPLACE FUNCTION public.wafl_v2_document_number_settings()",
  "RETURNS TABLE",
  "document_code varchar(16)",
  "business_timezone text",
  "LANGUAGE sql",
  "STABLE",
  "SECURITY DEFINER",
  "SET search_path = pg_catalog, public, pg_temp",
  "public.company_settings",
  "public.company_members",
  "current_setting('wafl.access_mode', true) = 'tenant_member'",
  "current_setting('wafl.company_id', true)",
  "current_setting('wafl.company_member_id', true)",
  "member.status = 'approved'",
  "LIMIT 1",
  "REVOKE ALL ON FUNCTION public.wafl_v2_document_number_settings() FROM PUBLIC",
  "GRANT EXECUTE ON FUNCTION public.wafl_v2_document_number_settings() TO wafl_v2_tenant_runtime",
  "pg_catalog.pg_get_userbyid",
  "function_owner IS DISTINCT FROM current_user",
]) assert.ok(migration.includes(token), `migration 008 missing ${token}`);

assert.doesNotMatch(migration, /\bGRANT\s+SELECT\s+ON\s+(TABLE\s+)?(?:public\.)?company_settings\b/i, "direct company_settings SELECT grant is forbidden");
assert.doesNotMatch(migration, /\b(DROP|TRUNCATE|DELETE\s+FROM|UPDATE\s+public\.company_settings|INSERT\s+INTO\s+public\.company_settings|ALTER\s+TABLE)\b/i, "migration 008 must not mutate tables or data");
assert.doesNotMatch(migration, /\bEXECUTE\s+format/i, "SECURITY DEFINER function must not use dynamic SQL");
assert.doesNotMatch(migration, /\bp_company_id\b|\bcompany_id\s+(text|varchar)\b/i, "number settings function must accept no client-selected company ID");
assert.doesNotMatch(migration, /raw_token|idempotency|storage|secret|email/i, "bounded function must not expose sensitive fields");

assert.match(repository, /CROSS JOIN LATERAL public\.wafl_v2_document_number_settings\(\) AS settings/, "issue transaction must use the bounded settings function");
assert.doesNotMatch(repository, /JOIN\s+(?:public\.)?company_settings\b|FROM\s+(?:public\.)?company_settings\b/i, "repository must not directly read company_settings");
assert.match(repository, /withWaflV2TenantWriteTransaction[\s\S]*installTenantClaims[\s\S]*wafl_v2_document_number_settings/, "settings read must remain inside the tenant issue transaction after claims");
assert.match(preflight, /has_table_privilege\('wafl_v2_tenant_runtime', 'company_settings', 'SELECT'\)/, "post-apply preflight must verify no direct table grant");

for (const token of [
  "VERIFY WAFL V2 ALPHA27A NUMBER SETTINGS PREFLIGHT",
  "APPLY WAFL V2 ALPHA27A NUMBER SETTINGS",
  "WAFL_V2_MIGRATION_APPROVED",
  "migration ledger must be 7/7 before apply",
  "BEGIN READ ONLY",
  "migrationBody(migration.source)",
  "INSERT INTO public.wafl_v2_migration_ledger",
  "migration ledger must be 8/8 after apply",
  "acl.grantee = 0 AND acl.privilege_type = 'EXECUTE'",
  "has_function_privilege('wafl_v2_tenant_runtime'",
  "company_settings row count changed",
  "cross-company member claim must return no settings",
]) assert.ok(migrationRunner.includes(token), `alpha.27a migration runner missing ${token}`);
assert.doesNotMatch(migrationRunner, /DELETE\s+FROM|TRUNCATE|DROP\s+(TABLE|FUNCTION|SCHEMA)|ALTER\s+TABLE/i, "migration runner must not contain cleanup or destructive SQL");
for (const token of [
  "RunWaflV2Alpha27aNumberSettingsPreflight",
  "ApplyWaflV2Alpha27aNumberSettingsMigration",
  "run-wafl-v2-alpha27a-number-settings-migration.mjs",
  "alpha27a-number-settings-preflight",
  "alpha27a-number-settings-apply",
]) assert.ok(pipeline.includes(token), `canonical pipeline missing ${token}`);

for (const token of [
  "APPLY WAFL V2 ALPHA27A SETTINGS FIXTURE",
  'const DOCUMENT_CODE = "WAFN"',
  'const BUSINESS_TIMEZONE = "Asia/Seoul"',
  "TARGET_COMPANIES = [COMPANY_A, COMPANY_B, COMPANY_H]",
  "LOCK TABLE public.company_settings IN SHARE ROW EXCLUSIVE MODE",
  "INSERT INTO public.company_settings (company_id, document_number_prefix, business_timezone)",
  "inserted.rowCount !== 3",
  "Company C rows/function result: 0/0",
  "Cross-tenant function results: 0/0/0",
  "Direct company_settings SELECT: false",
  "ALPHA27A_SETTINGS_FIXTURE_PASS",
]) assert.ok(fixtureRunner.includes(token), `alpha.27a settings fixture runner missing ${token}`);
assert.doesNotMatch(fixtureRunner, /ON\s+CONFLICT|UPDATE\s+public\.company_settings|DELETE\s+FROM|TRUNCATE|DROP\s+(TABLE|FUNCTION)|ALTER\s+TABLE/i, "settings fixture must not upsert, update, delete, clean up, or mutate schema");
assert.match(pipeline, /ApplyWaflV2Alpha27aSettingsFixture/, "canonical settings fixture pipeline switch required");

console.log("workorder v2 alpha.27a tenant-safe numbering settings migration contract: PASS");
