#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const { Client } = pg;
const MODE = process.argv[2] ?? "preflight";
const MIGRATION_FILE = "008_v2_tenant_document_number_settings_function.sql";
const EXPECTED_CONFIRMATION = MODE === "apply"
  ? "APPLY WAFL V2 ALPHA27A NUMBER SETTINGS"
  : "VERIFY WAFL V2 ALPHA27A NUMBER SETTINGS PREFLIGHT";
const APPLY_APPROVAL = "2.0.0-alpha.27a-dev-test-reviewed";
const EXPECTED_LEDGER_FILES = [
  "001_v2_tenant_document_number_foundation.sql",
  "002_v2_work_orders_revisions.sql",
  "003_v2_revision_content.sql",
  "004_v2_assets_revision_linkage.sql",
  "005_v2_documents_access_events.sql",
  "006_v2_deferred_constraints_indexes.sql",
  "007_v2_work_order_list_material_lookup_index.sql",
];
const ALLOWED_RUNTIMES = new Set(["development", "dev", "local", "test", "demo"]);
const TEST_COMPANIES = ["wafl-fn-company-a", "wafl-fn-company-b", "wafl-fn-company-h"];

function fail(message) { throw new Error(message); }
function sha256(value) { return crypto.createHash("sha256").update(value).digest("hex"); }

function guardTarget() {
  if (!new Set(["preflight", "apply"]).has(MODE)) fail("unsupported-mode");
  const runtime = String(process.env.WAFL_V2_RUNTIME ?? "").trim().toLowerCase();
  const connectionString = process.env.DATABASE_URL;
  const approvedFingerprint = String(process.env.WAFL_V2_APPROVED_DB_FINGERPRINT ?? "").trim().toLowerCase();
  if (!ALLOWED_RUNTIMES.has(runtime) || !connectionString) fail("approved-dev-test-target-required");
  if (String(process.env.WAFL_V2_TEST_PREFIX ?? "").trim() !== "wafl-fn") fail("fixture-prefix-mismatch");
  if (process.env.WAFL_V2_CONFIRMATION !== EXPECTED_CONFIRMATION) fail("confirmation-mismatch");
  if (MODE === "apply" && process.env.WAFL_V2_MIGRATION_APPROVED !== "1") fail("migration-approval-missing");
  if (MODE === "preflight" && process.env.WAFL_V2_MIGRATION_APPROVED) fail("migration-approval-must-be-absent");
  const parsed = new URL(connectionString);
  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
  if (!new Set(["postgres:", "postgresql:"]).has(parsed.protocol) || !parsed.hostname || !databaseName) fail("database-url-invalid");
  const fingerprint = sha256(`${parsed.hostname}/${databaseName}`).slice(0, 12);
  if (!approvedFingerprint || fingerprint !== approvedFingerprint) fail("db-fingerprint-mismatch");
  return { runtime: runtime === "test" ? "test" : "development", connectionString, fingerprint, databaseName };
}

function migrationBody(source) {
  const body = source.replace(/^\s*BEGIN\s*;/i, "").replace(/COMMIT\s*;\s*$/i, "").trim();
  if (!body) fail("empty-migration-body");
  return body;
}

async function localMigrations() {
  const entries = [];
  for (const filename of [...EXPECTED_LEDGER_FILES, MIGRATION_FILE]) {
    const source = await fs.readFile(path.resolve("db/v2/migrations", filename), "utf8");
    entries.push({ filename, source, sha256: sha256(source) });
  }
  return entries;
}

async function readLedger(client) {
  const result = await client.query(`
    SELECT migration_id, filename, migration_sha256, database_fingerprint,
           v1_baseline_fingerprint, runner_version
    FROM public.wafl_v2_migration_ledger
    ORDER BY migration_id
  `);
  return result.rows;
}

function verifyExistingLedger(ledger, migrations, fingerprint) {
  assert.equal(ledger.length, 7, "migration ledger must be 7/7 before apply");
  assert.deepEqual(ledger.map((row) => row.filename), EXPECTED_LEDGER_FILES);
  for (const row of ledger) {
    const local = migrations.find((entry) => entry.filename === row.filename);
    assert.ok(local, `local migration missing: ${row.filename}`);
    assert.equal(row.migration_sha256, local.sha256, `migration SHA mismatch: ${row.filename}`);
    assert.equal(row.database_fingerprint, fingerprint, `migration fingerprint mismatch: ${row.filename}`);
  }
  const baselines = new Set(ledger.map((row) => row.v1_baseline_fingerprint));
  assert.equal(baselines.size, 1, "ledger v1 baseline must remain stable");
  return ledger[0].v1_baseline_fingerprint;
}

async function readBoundaryState(client) {
  const result = await client.query(`
    SELECT to_regprocedure('public.wafl_v2_document_number_settings()')::text AS function_name,
           has_table_privilege('wafl_v2_tenant_runtime', 'public.company_settings', 'SELECT') AS direct_settings_select,
           (SELECT count(*)::integer FROM public.company_settings) AS settings_rows,
           (SELECT md5(COALESCE(string_agg(
               company_id || ':' || COALESCE(document_number_prefix, '') || ':' || COALESCE(company_code, '') || ':' || business_timezone,
               '|' ORDER BY company_id
             ), '')) FROM public.company_settings) AS settings_fingerprint
  `);
  return result.rows[0];
}

async function preflight(target, migrations) {
  const client = new Client({ connectionString: target.connectionString, application_name: "wafl-v2-alpha27a-number-settings-preflight" });
  await client.connect();
  try {
    await client.query("BEGIN READ ONLY");
    const identity = await client.query(`
      SELECT current_database() AS database_name, current_user,
             role.rolsuper, role.rolbypassrls
      FROM pg_catalog.pg_roles AS role WHERE role.rolname = current_user
    `);
    assert.equal(identity.rows[0]?.database_name, target.databaseName);
    assert.equal(identity.rows[0]?.rolsuper, false, "superuser migration connection is forbidden");
    const ledger = await readLedger(client);
    verifyExistingLedger(ledger, migrations, target.fingerprint);
    const boundary = await readBoundaryState(client);
    assert.equal(boundary.function_name, null, "untracked migration 008 function already exists");
    assert.equal(boundary.direct_settings_select, false, "tenant runtime must not directly select company_settings");
    await client.query("COMMIT");

    const migration = migrations.find((entry) => entry.filename === MIGRATION_FILE);
    console.log("WAFL v2 alpha.27a numbering settings migration preflight");
    console.log(`Target fingerprint: ${target.fingerprint}`);
    console.log("Current ledger: 7/7; migration SHA/fingerprint PASS");
    console.log(`Migration 008 SHA-256: ${migration.sha256}`);
    console.log("Expected object: public.wafl_v2_document_number_settings()");
    console.log("Expected owner: current non-superuser migration executor");
    console.log(`Migration executor BYPASSRLS: ${identity.rows[0]?.rolbypassrls ? "true (existing canonical executor)" : "false"}`);
    console.log("Expected ACL: PUBLIC none; wafl_v2_tenant_runtime EXECUTE only");
    console.log("Direct company_settings SELECT grant: false");
    console.log("Expected schema mutation: one function plus ACL and ledger row");
    console.log("Expected business/table data mutation: 0");
    console.log("Issue runtime executed: false");
    console.log("Mutation: none");
    console.log("Result: PASS");
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch {}
    throw error;
  } finally { await client.end(); }
}

async function verifyTenantFunction(client, companyId, memberId) {
  await client.query("BEGIN READ ONLY");
  try {
    await client.query("SET LOCAL ROLE wafl_v2_tenant_runtime");
    await client.query(`
      SELECT set_config('wafl.company_id', $1, true),
             set_config('wafl.company_member_id', $2, true),
             set_config('wafl.access_mode', 'tenant_member', true)
    `, [companyId, memberId]);
    const result = await client.query("SELECT document_code, business_timezone FROM public.wafl_v2_document_number_settings()");
    await client.query("COMMIT");
    return result.rows;
  } catch (error) { await client.query("ROLLBACK"); throw error; }
}

async function apply(target, migrations) {
  const migration = migrations.find((entry) => entry.filename === MIGRATION_FILE);
  const client = new Client({ connectionString: target.connectionString, application_name: "wafl-v2-alpha27a-number-settings-apply", statement_timeout: 120_000 });
  await client.connect();
  let transactionOpen = false;
  try {
    const identity = await client.query(`
      SELECT current_user, role.rolsuper, role.rolbypassrls
      FROM pg_catalog.pg_roles AS role WHERE role.rolname = current_user
    `);
    assert.equal(identity.rows[0]?.rolsuper, false, "superuser migration connection is forbidden");
    const ledgerBefore = await readLedger(client);
    const v1Baseline = verifyExistingLedger(ledgerBefore, migrations, target.fingerprint);
    const before = await readBoundaryState(client);
    assert.equal(before.function_name, null, "migration 008 function already exists");
    assert.equal(before.direct_settings_select, false);

    await client.query("BEGIN");
    transactionOpen = true;
    await client.query("SELECT set_config('wafl.runtime_environment', $1, true)", [target.runtime]);
    await client.query("SELECT set_config('wafl.migration_execution_approved', $1, true)", [APPLY_APPROVAL]);
    await client.query(migrationBody(migration.source));
    await client.query(`
      INSERT INTO public.wafl_v2_migration_ledger (
        migration_id, filename, migration_sha256, runner_version,
        database_fingerprint, v1_baseline_fingerprint
      ) VALUES (8, $1, $2, '2.0.0-alpha.27a', $3, $4)
    `, [MIGRATION_FILE, migration.sha256, target.fingerprint, v1Baseline]);
    await client.query("COMMIT");
    transactionOpen = false;

    const ledgerAfter = await readLedger(client);
    assert.equal(ledgerAfter.length, 8, "migration ledger must be 8/8 after apply");
    const ledger008 = ledgerAfter.find((row) => Number(row.migration_id) === 8);
    assert.equal(ledger008?.filename, MIGRATION_FILE);
    assert.equal(ledger008?.migration_sha256, migration.sha256);
    const after = await readBoundaryState(client);
    assert.equal(after.function_name, "wafl_v2_document_number_settings()");
    assert.equal(after.direct_settings_select, false);
    assert.equal(after.settings_rows, before.settings_rows, "company_settings row count changed");
    assert.equal(after.settings_fingerprint, before.settings_fingerprint, "company_settings data changed");

    const functionAudit = await client.query(`
      SELECT pg_catalog.pg_get_userbyid(proc.proowner) AS owner_name,
             proc.prosecdef AS security_definer,
             proc.provolatile,
             proc.proconfig,
             has_function_privilege('wafl_v2_tenant_runtime', proc.oid, 'EXECUTE') AS runtime_execute,
             EXISTS (
               SELECT 1
               FROM pg_catalog.aclexplode(COALESCE(proc.proacl, pg_catalog.acldefault('f', proc.proowner))) AS acl
               WHERE acl.grantee = 0 AND acl.privilege_type = 'EXECUTE'
             ) AS public_execute
      FROM pg_catalog.pg_proc AS proc
      JOIN pg_catalog.pg_namespace AS namespace ON namespace.oid = proc.pronamespace
      WHERE namespace.nspname = 'public' AND proc.proname = 'wafl_v2_document_number_settings' AND proc.pronargs = 0
    `);
    const functionRow = functionAudit.rows[0];
    assert.equal(functionRow?.security_definer, true);
    assert.equal(functionRow?.owner_name, identity.rows[0]?.current_user);
    assert.equal(functionRow?.provolatile, "s");
    assert.ok(functionRow?.proconfig?.includes("search_path=pg_catalog, public, pg_temp"));
    assert.equal(functionRow?.runtime_execute, true);
    assert.equal(functionRow?.public_execute, false);

    const members = await client.query(`
      SELECT DISTINCT ON (company_id) company_id, id
      FROM public.company_members
      WHERE company_id = ANY($1::text[]) AND status = 'approved'
      ORDER BY company_id, created_at, id
    `, [TEST_COMPANIES]);
    assert.equal(members.rows.length, TEST_COMPANIES.length, "approved tenant test members missing");
    for (const companyId of TEST_COMPANIES) {
      const member = members.rows.find((row) => row.company_id === companyId);
      const rows = await verifyTenantFunction(client, companyId, member.id);
      assert.equal(rows.length, 1, `bounded settings row missing for ${companyId.slice(-1)}`);
      assert.ok(rows[0].document_code);
      assert.ok(rows[0].business_timezone);
    }
    const companyBMember = members.rows.find((row) => row.company_id === TEST_COMPANIES[1]);
    const crossRows = await verifyTenantFunction(client, TEST_COMPANIES[0], companyBMember.id);
    assert.equal(crossRows.length, 0, "cross-company member claim must return no settings");

    console.log("WAFL v2 alpha.27a numbering settings migration apply");
    console.log(`Target fingerprint: ${target.fingerprint}`);
    console.log("Migration ledger: 8/8");
    console.log(`Migration 008 SHA-256: ${migration.sha256}`);
    console.log(`Function owner: ${functionRow.owner_name}`);
    console.log(`Function owner BYPASSRLS: ${identity.rows[0]?.rolbypassrls ? "true (existing canonical migration executor)" : "false"}`);
    console.log("SECURITY DEFINER/fixed search_path: PASS");
    console.log("PUBLIC EXECUTE revoked; tenant runtime EXECUTE granted: PASS");
    console.log("Direct company_settings SELECT grant: false");
    console.log("Company A/B/H bounded settings read: PASS");
    console.log("Cross-company member claim: empty result PASS");
    console.log("company_settings row/data mutation: 0");
    console.log("DB schema mutation: true; function/ACL plus migration ledger only");
    console.log("Business/production/R2/Worker/PDF mutation: false");
    console.log("Result: PASS");
  } catch (error) {
    if (transactionOpen) await client.query("ROLLBACK");
    throw error;
  } finally { await client.end(); }
}

async function run() {
  const target = guardTarget();
  const migrations = await localMigrations();
  if (MODE === "preflight") await preflight(target, migrations);
  else await apply(target, migrations);
}

run().catch((error) => {
  console.error("WAFL_V2_ALPHA27A_MIGRATION_FAILED", {
    mode: MODE,
    errorName: error instanceof Error ? error.name : "UnknownError",
    errorCode: typeof error === "object" && error !== null && "code" in error ? String(error.code) : "UNKNOWN",
    assertion: error instanceof Error ? error.message.slice(0, 180) : "unknown",
    migrationFile: MIGRATION_FILE,
  });
  process.exitCode = 1;
});
