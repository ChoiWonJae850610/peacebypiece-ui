#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const migrationRoot = path.join(root, "db/v2/migrations");
const expectedFiles = [
  "001_v2_tenant_document_number_foundation.sql",
  "002_v2_work_orders_revisions.sql",
  "003_v2_revision_content.sql",
  "004_v2_assets_revision_linkage.sql",
  "005_v2_documents_access_events.sql",
  "006_v2_deferred_constraints_indexes.sql",
  "007_v2_work_order_list_material_lookup_index.sql",
  "008_v2_tenant_document_number_settings_function.sql",
];

const actualFiles = fs
  .readdirSync(migrationRoot)
  .filter((file) => file.endsWith(".sql"))
  .sort();

assert.deepEqual(actualFiles, expectedFiles, "alpha.21 migration order or file set changed");

const sources = expectedFiles.map((file) => ({
  file,
  source: fs.readFileSync(path.join(migrationRoot, file), "utf8"),
}));
const combined = sources.map(({ source }) => source).join("\n");
const executableSql = combined
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*--.*$/gm, "");

for (const { file, source } of sources) {
  if (file === "008_v2_tenant_document_number_settings_function.sql") {
    assert.ok(source.includes("EXECUTION IS PROHIBITED WITHOUT THE APPROVED ALPHA.27A DEV/TEST GATE"), `${file} missing alpha.27a execution prohibition`);
  } else if (file === "007_v2_work_order_list_material_lookup_index.sql") {
    assert.ok(source.includes("EXECUTION IS PROHIBITED WITHOUT THE APPROVED ALPHA.23 DEV/TEST GATE"), `${file} missing alpha.23 execution prohibition`);
  } else {
    assert.ok(source.includes("EXECUTION IS PROHIBITED IN ALPHA.21"), `${file} missing execution prohibition`);
  }
  assert.ok(source.includes("BEGIN;"), `${file} missing transaction start`);
  assert.ok(source.includes("COMMIT;"), `${file} missing transaction end`);
  assert.match(
    source,
    /wafl_v2_assert_migration_draft_gate|wafl\.migration_execution_approved/,
    `${file} missing approved dev/test gate`,
  );

  const dollarTags = source.match(/\$[A-Za-z_]*\$/g) ?? [];
  const dollarTagCounts = new Map();
  for (const tag of dollarTags) dollarTagCounts.set(tag, (dollarTagCounts.get(tag) ?? 0) + 1);
  for (const [tag, count] of dollarTagCounts) {
    assert.equal(count % 2, 0, `${file} has an unbalanced dollar quote: ${tag}`);
  }

  const structureOnly = source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*--.*$/gm, "")
    .replace(/\$([A-Za-z_]*)\$[\s\S]*?\$\1\$/g, "")
    .replace(/'(?:''|[^'])*'/g, "");
  let parenthesisDepth = 0;
  for (const character of structureOnly) {
    if (character === "(") parenthesisDepth += 1;
    if (character === ")") parenthesisDepth -= 1;
    assert.ok(parenthesisDepth >= 0, `${file} closes a parenthesis before opening it`);
  }
  assert.equal(parenthesisDepth, 0, `${file} has unbalanced parentheses`);
  assert.equal((structureOnly.match(/\bBEGIN\s*;/gi) ?? []).length, 1, `${file} must have one BEGIN`);
  assert.equal((structureOnly.match(/\bCOMMIT\s*;/gi) ?? []).length, 1, `${file} must have one COMMIT`);
}

for (const [label, pattern] of [
  ["DROP", /\bDROP\s+(TABLE|SCHEMA|COLUMN|CONSTRAINT|INDEX|TYPE|FUNCTION|POLICY)\b/i],
  ["TRUNCATE", /\bTRUNCATE\b/i],
  ["destructive DELETE", /\bDELETE\s+FROM\b/i],
  ["rename", /\bRENAME\s+(TO|COLUMN)\b/i],
  ["column removal", /\bALTER\s+TABLE[\s\S]{0,240}\bDROP\b/i],
]) {
  assert.doesNotMatch(executableSql, pattern, `migration draft contains forbidden ${label}`);
}

assert.doesNotMatch(executableSql, /\bmax\s*\([^)]*\)\s*\+\s*1\b/i, "document allocator must not use max()+1");
assert.doesNotMatch(
  executableSql,
  /^\s*(raw_token|access_token|token)\s+[a-z]/gim,
  "document access table must not persist a raw token column",
);
assert.doesNotMatch(executableSql, /\bVALIDATE\s+CONSTRAINT\b/i, "alpha.21 must not validate constraints");

const tenantTables = [
  "document_number_sequences",
  "work_orders",
  "work_order_revisions",
  "work_order_command_receipts",
  "work_order_material_lines",
  "work_order_colors",
  "work_order_sizes",
  "color_size_quantities",
  "work_order_size_specs",
  "work_order_size_spec_sizes",
  "work_order_size_spec_poms",
  "work_order_size_spec_values",
  "work_order_processes",
  "work_order_images",
  "work_order_attachments",
  "work_order_revision_images",
  "work_order_revision_attachments",
  "generated_documents",
  "document_access_tokens",
  "domain_events",
];

for (const table of tenantTables) {
  const start = combined.indexOf(`CREATE TABLE IF NOT EXISTS ${table} (`);
  assert.notEqual(start, -1, `missing v2 table: ${table}`);
  const nextTable = combined.indexOf("CREATE TABLE IF NOT EXISTS ", start + 1);
  const tableBlock = combined.slice(start, nextTable === -1 ? combined.length : nextTable);
  assert.match(tableBlock, /\bcompany_id\s+text\b/, `${table} must carry direct company scope`);
  assert.ok(combined.includes(`'${table}'`) || combined.includes(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`), `${table} missing RLS registry`);
}

for (const token of [
  "wafl_v2_request_company_id",
  "wafl_v2_privileged_context_ready",
  "wafl_v2_privileged_scope_ready",
  "privileged_system",
  "wafl.system_actor_id",
  "wafl.privileged_reason",
  "wafl.correlation_id",
  "wafl.privileged_audit_event_id",
  "ENABLE ROW LEVEL SECURITY",
  "FORCE ROW LEVEL SECURITY",
]) {
  assert.ok(combined.includes(token), `tenant/RLS contract missing ${token}`);
}

for (const token of [
  "INSERT INTO document_number_sequences",
  "ON CONFLICT (company_id, business_date)",
  "DO UPDATE SET",
  "work_order_revisions_immutable_guard",
  "wafl_v2_guard_mutable_revision_child",
  "generated_documents_immutable_guard",
  "domain_events_append_only_guard",
  "idempotency_key",
  "request_sha256",
  "entity_version",
  "token_hash char(64)",
  "expires_at timestamptz",
  "revoked_at timestamptz",
  "NOT VALID",
  "wafl_v2_migration_ledger",
  "migration_sha256",
  "v1_baseline_fingerprint",
  "wafl_v2_tenant_runtime",
  "NOBYPASSRLS",
]) {
  assert.ok(combined.includes(token), `core schema contract missing ${token}`);
}

for (const index of [
  "work_orders_company_recent_idx",
  "work_orders_company_status_recent_idx",
  "work_orders_company_due_idx",
  "work_orders_company_product_name_idx",
  "work_order_material_lines_revision_type_order_idx",
  "work_order_processes_revision_order_idx",
  "generated_documents_revision_type_recent_idx",
  "document_access_tokens_active_expiry_idx",
  "domain_events_entity_history_idx",
  "work_order_material_lines_company_revision_cover_idx",
]) {
  assert.ok(combined.includes(index), `required query index missing ${index}`);
}
assert.match(
  combined,
  /work_order_material_lines_company_revision_cover_idx[\s\S]*ON work_order_material_lines \(company_id, revision_id\)[\s\S]*INCLUDE \(material_type, status\)/,
  "alpha.23 list index must directly support tenant company plus revision lookup and cover aggregate fields",
);

function gitChanged(pathspec) {
  const result = spawnSync("git", ["status", "--short", "--untracked-files=all", "--", pathspec], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, `git status failed for ${pathspec}`);
  return result.stdout.trim();
}

for (const legacyMigration of expectedFiles.slice(0, 6)) {
  assert.equal(gitChanged(`db/v2/migrations/${legacyMigration}`), "", `existing migration changed: ${legacyMigration}`);
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
const alpha25ApiPaths = [
  "app/api/v2/work-orders/[workOrderId]/route.ts",
  "app/api/v2/work-orders/route.ts",
];
const alpha26ApiPaths = [
  "app/api/v2/work-orders/[workOrderId]/materials/route.ts",
  "app/api/v2/work-orders/[workOrderId]/materials/[materialLineId]/route.ts",
  "app/api/v2/work-orders/[workOrderId]/materials/[materialLineId]/order-request/route.ts",
  "app/api/v2/work-orders/[workOrderId]/materials/[materialLineId]/order-cancel/route.ts",
  "app/api/v2/work-orders/[workOrderId]/materials/[materialLineId]/order-complete/route.ts",
];
const alpha27ApiPaths = ["app/api/v2/work-orders/[workOrderId]/revisions/issue/route.ts"];
const alpha25ContractExists = fs.existsSync(path.join(root, "tests/workorder-v2-alpha25-command-api-contract.mjs"));
const alpha26ContractExists = fs.existsSync(path.join(root, "tests/workorder-v2-alpha26-material-command-api-contract.mjs"));
const alpha27ContractExists = fs.existsSync(path.join(root, "tests/workorder-v2-alpha27-revision-issue-command-contract.mjs"));
if (alpha27ContractExists && (appVersion.includes('APP_VERSION = "2.0.0-alpha.26"') || appVersion.includes('APP_VERSION = "2.0.0-alpha.27"'))) {
  assert.deepEqual(
    apiChanges.filter((change) => ![...alpha25ApiPaths, ...alpha26ApiPaths, ...alpha27ApiPaths].some((allowedPath) => change.endsWith(allowedPath))),
    [],
    "alpha.27 may modify only exact WorkOrder, material, and revision issue Command routes",
  );
} else if ((appVersion.includes('APP_VERSION = "2.0.0-alpha.25"') || appVersion.includes('APP_VERSION = "2.0.0-alpha.26"')) && alpha26ContractExists) {
  assert.deepEqual(
    apiChanges.filter((change) => ![...alpha25ApiPaths, ...alpha26ApiPaths].some((allowedPath) => change.endsWith(allowedPath))),
    [],
    "alpha.26 may modify only exact WorkOrder and material Command routes",
  );
} else if (appVersion.includes('APP_VERSION = "2.0.0-alpha.25"') || (appVersion.includes('APP_VERSION = "2.0.0-alpha.24"') && alpha25ContractExists)) {
  assert.deepEqual(
    apiChanges.filter((change) => !alpha25ApiPaths.some((allowedPath) => change.endsWith(allowedPath))),
    [],
    "alpha.25 may modify only the existing WorkOrder collection/detail routes for POST/PATCH",
  );
} else if (appVersion.includes('APP_VERSION = "2.0.0-alpha.24"')) {
  assert.deepEqual(
    apiChanges.filter((change) => !alpha24ApiChanges.includes(change)),
    [],
    "alpha.24 may change only the exact WorkOrder detail/lazy GET routes under app/api",
  );
} else if (appVersion.includes('APP_VERSION = "2.0.0-alpha.23"')) {
  const allowedAlpha23ApiChanges = ["?? app/api/v2/work-orders/route.ts"];
  assert.deepEqual(apiChanges.filter((change) => !allowedAlpha23ApiChanges.includes(change)), [], "alpha.23 may change only the exact WorkOrder list GET route under app/api");
} else {
  assert.deepEqual(apiChanges, [], "app/api must remain unchanged before alpha.23 runtime adoption");
}

console.log("workorder v2 alpha.21 migration schema contract: PASS");
