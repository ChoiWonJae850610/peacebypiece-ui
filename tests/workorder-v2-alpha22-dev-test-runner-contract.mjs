#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const runner = fs.readFileSync(path.join(root, "scripts/run-wafl-v2-alpha22.mjs"), "utf8");
const pipeline = fs.readFileSync(path.join(root, "tools/pipeline/peacebypiece-auto-pipeline.ps1"), "utf8");
const migration001 = fs.readFileSync(path.join(root, "db/v2/migrations/001_v2_tenant_document_number_foundation.sql"), "utf8");
const migration005 = fs.readFileSync(path.join(root, "db/v2/migrations/005_v2_documents_access_events.sql"), "utf8");

for (const token of [
  'const VERSION = "2.0.0-alpha.22"',
  'const PREFIX = "wafl-fn"',
  '"preflight", "apply", "apply-index", "validate", "seed", "verify"',
  "runtime-not-dev-test",
  "db-fingerprint-mismatch",
  "fixture-prefix-mismatch",
  "superuser-connection-blocked",
  "alpha22-generic-apply-disabled-after-alpha23-index",
  "APPLY WAFL V2 ALPHA23 MATERIAL INDEX",
  "applyAlpha23MaterialIndex",
  "alpha23-index-ledger-precondition",
  "DB schema mutation: true; approved dev/test additive index 007 only",
  "SEED WAFL V2 A500",
  "SEED WAFL V2 B5000",
  "SEED WAFL V2 C-MULTI",
  "VERIFY WAFL V2 ALPHA22 DEV TEST",
  "preflight-baseline-mismatch",
  "empty-migration-body",
  "migration-ledger-mismatch",
  "Migration ledger rows after failure",
  "Alpha.23 material index present after failure",
  "partial-seed-detected",
  "tenant-runtime-role-unsafe-or-missing",
  "tenant-isolation-failed",
  "optimistic-concurrency-failed",
  "idempotency-contract-failed",
  "document-number-concurrency-duplicate",
  "cursor-duplicate",
  "cursor-missing",
  "list-p95-budget-failed",
  "list-payload-budget-failed",
  "Production mutation: false",
  "R2 mutation: false",
]) {
  assert.ok(runner.includes(token), `alpha.22 runner contract missing ${token}`);
}

for (const migration of [
  "001_v2_tenant_document_number_foundation.sql",
  "002_v2_work_orders_revisions.sql",
  "003_v2_revision_content.sql",
  "004_v2_assets_revision_linkage.sql",
  "005_v2_documents_access_events.sql",
  "006_v2_deferred_constraints_indexes.sql",
  "007_v2_work_order_list_material_lookup_index.sql",
]) {
  assert.ok(runner.includes(`"${migration}"`), `ordered migration missing ${migration}`);
}

for (const forbidden of [
  /\bDROP\s+(TABLE|SCHEMA|COLUMN|CONSTRAINT|INDEX)\b/i,
  /\bTRUNCATE\b/i,
  /\bALTER\s+TABLE[\s\S]{0,120}\bDROP\b/i,
  /\bmax\s*\([^)]*\)\s*\+\s*1\b/i,
  /child_process/,
  /\bpsql\b/i,
  /Full Reset/i,
  /automatic retry/i,
]) {
  assert.doesNotMatch(runner, forbidden, `alpha.22 runner contains forbidden pattern ${forbidden}`);
}

for (const token of [
  "$RunWaflV2MigrationPreflight",
  "$ApplyWaflV2Migrations",
  "$ApplyWaflV2Alpha23MaterialIndex",
  "$RunWaflV2PostApplyValidation",
  "$RunWaflV2SeedProfile",
  "$RunWaflV2DevTestVerification",
  "function InvokeWaflV2Alpha22Command",
  "TestReadOnlyDbAuditGuard",
  "ApprovedDbFingerprint",
  'TestPrefix).Trim()',
  "WAFL_V2_MIGRATION_APPROVED",
  "Apply_Wafl_V2_Alpha23_Material_Index",
  "WAFL_V2_SEED_APPROVED",
  "WAFL_V2_VERIFY_APPROVED",
  "node scripts/run-wafl-v2-alpha22.mjs",
  "function NewWaflV2FailureHandoff",
  "Failure_Handoff",
  "Completion Artifact:",
  "never publish to 4. Newest",
  "$CreateWaflV2FailureHandoff",
  "failure-source-$version-$timestamp.zip",
  "failure-repo-state-$version-$timestamp.txt",
  "failure-log-$version-$timestamp.txt",
  "Successful Seed Profiles Before Failure:",
  "OK_Apply_Wafl_V2_Alpha22_Migrations_*.txt",
  "OK_Wafl_V2_Alpha22_Seed_*.txt",
  ".env* including .env.example",
  'Title "ZIP Size Bytes:" -Values @([string]$zipSize)',
]) {
  assert.ok(pipeline.includes(token), `canonical pipeline contract missing ${token}`);
}

assert.match(migration001, /CREATE TABLE IF NOT EXISTS wafl_v2_migration_ledger/);
assert.match(migration001, /migration_sha256 char\(64\)/);
assert.match(migration001, /v1_baseline_fingerprint char\(64\)/);
assert.match(migration001, /wafl\.privileged_audit_event_id/);
assert.match(migration001, /CREATE ROLE wafl_v2_tenant_runtime/);
assert.match(migration001, /NOLOGIN NOSUPERUSER[\s\S]*NOBYPASSRLS/);
assert.match(migration005, /wafl_v2_privileged_context_ready\(company_id\)/);
assert.doesNotMatch(runner, /INSERT INTO domain_events[\s\S]{0,700}RETURNING id/);

const blocked = spawnSync(process.execPath, ["scripts/run-wafl-v2-alpha22.mjs", "preflight"], {
  cwd: root,
  encoding: "utf8",
  env: {
    ...process.env,
    WAFL_V2_RUNTIME: "production",
    WAFL_V2_APPROVED_DB_FINGERPRINT: "000000000000",
    WAFL_V2_TEST_PREFIX: "wafl-fn",
    WAFL_V2_READ_APPROVED: "1",
    DATABASE_URL: "postgresql://blocked.invalid/production",
  },
});
assert.notEqual(blocked.status, 0, "production runtime must be blocked before connection");
assert.match(`${blocked.stdout}\n${blocked.stderr}`, /runtime-not-dev-test/);

function gitChanged(pathspec) {
  const result = spawnSync("git", ["status", "--short", "--untracked-files=all", "--", pathspec], { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 0, `git status failed for ${pathspec}`);
  return result.stdout.trim();
}

for (const forbiddenPath of [
  "db/schema",
  "db/migrations",
  "cloudflare",
  "package.json",
  "package-lock.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
]) {
  assert.equal(gitChanged(forbiddenPath), "", `forbidden path changed: ${forbiddenPath}`);
}

const appVersion = fs.readFileSync(path.join(root, "lib/constants/version.ts"), "utf8");
const apiChanges = gitChanged("app/api").split(/\r?\n/).filter(Boolean);
const alpha24ApiChanges = [
  "?? app/api/v2/work-orders/[workOrderId]/assets/route.ts",
  "?? app/api/v2/work-orders/[workOrderId]/documents/route.ts",
  "?? app/api/v2/work-orders/[workOrderId]/history/route.ts",
  "?? app/api/v2/work-orders/[workOrderId]/materials/route.ts",
  "?? app/api/v2/work-orders/[workOrderId]/processes/route.ts",
  "?? app/api/v2/work-orders/[workOrderId]/route.ts",
  "?? app/api/v2/work-orders/[workOrderId]/size-color/route.ts",
  "?? app/api/v2/work-orders/[workOrderId]/size-spec/route.ts",
];
if (appVersion.includes('APP_VERSION = "2.0.0-alpha.24"')) {
  assert.deepEqual(apiChanges, alpha24ApiChanges, "alpha.24 may add only its exact detail/lazy GET routes");
} else if (appVersion.includes('APP_VERSION = "2.0.0-alpha.23"')) {
  assert.deepEqual(apiChanges, ["?? app/api/v2/work-orders/route.ts"], "alpha.23 may add only its exact GET route");
} else {
  assert.deepEqual(apiChanges, [], "app/api must remain unchanged through alpha.22");
}

console.log("workorder v2 alpha.22 dev/test runner contract: PASS");
