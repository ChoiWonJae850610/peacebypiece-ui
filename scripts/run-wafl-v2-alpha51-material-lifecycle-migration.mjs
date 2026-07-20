#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const { Client } = pg;
const MODE = process.argv[2] ?? "preflight";
const FILE = "013_v2_material_line_archive_lifecycle.sql";
const APPROVAL = "2.0.0-alpha.51-dev-test-reviewed";
const REQUIRED_FINGERPRINT = String(process.env.WAFL_V2_APPROVED_DB_FINGERPRINT ?? "").trim();
const MANIFEST_PATH = path.resolve(".tmp/wafl-v2-alpha51/migration-manifest.json");

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const migrationBody = (source) => source.replace(/^\uFEFF/, "").replace(/^\s*BEGIN\s*;/i, "").replace(/COMMIT\s*;\s*$/i, "").trim();

function databaseFingerprint(databaseUrl) {
  const parsed = new URL(databaseUrl);
  return sha256(`${parsed.hostname}/${decodeURIComponent(parsed.pathname.replace(/^\/+/, ""))}`).slice(0, 12);
}

function guard() {
  assert.ok(new Set(["preflight", "apply", "audit"]).has(MODE), "unsupported-mode");
  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, "database-url-missing");
  assert.ok(new Set(["development", "test"]).has(process.env.WAFL_V2_RUNTIME), "dev-test-runtime-required");
  assert.equal(process.env.WAFL_V2_TEST_PREFIX, "wafl-fn", "test-prefix-mismatch");
  assert.match(REQUIRED_FINGERPRINT, /^[0-9a-f]{12}$/i, "approved-fingerprint-missing");
  assert.equal(databaseFingerprint(databaseUrl), REQUIRED_FINGERPRINT, "target-fingerprint-mismatch");
  if (MODE === "apply") assert.equal(process.env.WAFL_V2_ALPHA51_MIGRATION_APPROVED, APPROVAL, "migration-approval-missing");
  else assert.ok(!process.env.WAFL_V2_ALPHA51_MIGRATION_APPROVED, "read-only-mode-approval-forbidden");
  return databaseUrl;
}

async function ledger(client) {
  return (await client.query("SELECT migration_id, filename, migration_sha256, database_fingerprint, v1_baseline_fingerprint FROM public.wafl_v2_migration_ledger ORDER BY migration_id")).rows;
}

async function schemaState(client) {
  const columns = (await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='work_order_material_lines'
      AND column_name IN ('archived_at','archived_by_member_id')
    ORDER BY column_name
  `)).rows;
  const constraints = (await client.query(`
    SELECT conname, convalidated, pg_catalog.pg_get_constraintdef(oid, true) AS definition
    FROM pg_catalog.pg_constraint
    WHERE conrelid='public.work_order_material_lines'::regclass
      AND conname IN ('work_order_material_lines_archive_metadata_check','work_order_material_lines_archived_by_company_fk')
    ORDER BY conname
  `)).rows;
  const indexes = (await client.query(`
    SELECT indexname, indexdef FROM pg_catalog.pg_indexes
    WHERE schemaname='public' AND tablename='work_order_material_lines'
      AND indexname IN ('work_order_material_lines_active_revision_type_order_idx','work_order_material_lines_archived_revision_type_order_idx')
    ORDER BY indexname
  `)).rows;
  return { columns, constraints, indexes };
}

async function rowState(client, hasLifecycle) {
  return (await client.query(`
    SELECT
      (SELECT count(*)::integer FROM public.work_order_material_lines) AS materials,
      ${hasLifecycle ? "(SELECT count(*)::integer FROM public.work_order_material_lines WHERE archived_at IS NOT NULL)" : "NULL::integer"} AS archived,
      (SELECT count(*)::integer FROM public.work_orders) AS work_orders,
      (SELECT count(*)::integer FROM public.work_order_revisions) AS revisions,
      (SELECT count(*)::integer FROM public.work_order_command_receipts) AS receipts,
      (SELECT count(*)::integer FROM public.domain_events) AS events
  `)).rows[0];
}

async function snapshot(client) {
  await client.query("BEGIN READ ONLY");
  try {
    const currentLedger = await ledger(client);
    const schema = await schemaState(client);
    const rows = await rowState(client, schema.columns.length === 2);
    await client.query("COMMIT");
    return { ledger: currentLedger, schema, rows };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

function assertAppliedSchema(schema) {
  assert.deepEqual(schema.columns.map((row) => row.column_name), ["archived_at", "archived_by_member_id"]);
  assert.equal(schema.constraints.length, 2, "lifecycle-constraints-missing");
  assert.equal(schema.indexes.length, 2, "lifecycle-indexes-missing");
  assert.match(schema.indexes[0].indexdef + schema.indexes[1].indexdef, /archived_at IS NULL/i);
  assert.match(schema.indexes[0].indexdef + schema.indexes[1].indexdef, /archived_at IS NOT NULL/i);
}

async function writeManifest(value) {
  await fs.mkdir(path.dirname(MANIFEST_PATH), { recursive: true });
  await fs.writeFile(MANIFEST_PATH, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function main() {
  const databaseUrl = guard();
  const source = await fs.readFile(path.resolve("db/v2/migrations", FILE), "utf8");
  const migrationSha = sha256(source);
  assert.doesNotMatch(source.replace(/^\s*--.*$/gm, ""), /\b(?:DROP\s+TABLE|TRUNCATE|DELETE\s+FROM)\b/i, "destructive-sql-forbidden");
  const manifest = (await fs.readdir(path.resolve("db/v2/migrations"))).filter((name) => /^\d{3}_.*\.sql$/.test(name)).sort();
  assert.equal(manifest.at(-1), FILE, "migration-order-invalid");

  const client = new Client({ connectionString: databaseUrl, application_name: `wafl-v2-alpha51-material-lifecycle-${MODE}`, statement_timeout: 120_000 });
  await client.connect();
  try {
    const identity = (await client.query("SELECT rolsuper FROM pg_catalog.pg_roles WHERE rolname=current_user")).rows[0];
    assert.equal(identity.rolsuper, false, "superuser-forbidden");
    const before = await snapshot(client);
    assert.equal(new Set(before.ledger.map((row) => row.database_fingerprint)).size, 1, "ledger-fingerprint-inconsistent");
    assert.equal(before.ledger[0]?.database_fingerprint, REQUIRED_FINGERPRINT, "ledger-fingerprint-mismatch");

    if (MODE === "preflight") {
      assert.equal(before.ledger.length, 12, "ledger-must-be-12-before-013");
      assert.deepEqual(before.ledger.map((row) => row.filename), manifest.slice(0, -1), "ledger-manifest-mismatch");
      assert.deepEqual(before.schema, { columns: [], constraints: [], indexes: [] }, "migration-013-object-already-present");
      await writeManifest({ result: "ALPHA51_MIGRATION_013_READ_ONLY_PREFLIGHT_PASS", migrationSha256: migrationSha, ledgerBefore: 12, ledgerAfter: 12, rowCounts: before.rows, databaseMutation: false, productionMutation: false });
      console.log("ALPHA51_MIGRATION_013_READ_ONLY_PREFLIGHT_PASS");
      console.log(`Target fingerprint prefix: ${REQUIRED_FINGERPRINT.slice(0, 6)}`);
      console.log(`Migration SHA-256: ${migrationSha}`);
      console.log("Ledger: 12/12; expected schema +2 columns/+2 constraints/+2 indexes; business rows 0");
      return;
    }

    if (MODE === "audit") {
      assert.equal(before.ledger.length, 13, "ledger-must-be-13-after-013");
      assert.equal(before.ledger[12].filename, FILE);
      assert.equal(before.ledger[12].migration_sha256, migrationSha);
      assertAppliedSchema(before.schema);
      assert.equal(Number(before.rows.archived), 0, "existing-materials-must-remain-active");
      await writeManifest({ result: "ALPHA51_MIGRATION_013_READ_ONLY_AUDIT_PASS", migrationSha256: migrationSha, ledgerBefore: 12, ledgerAfter: 13, rowCounts: before.rows, databaseMutation: false, productionMutation: false });
      console.log("ALPHA51_MIGRATION_013_READ_ONLY_AUDIT_PASS");
      console.log("Ledger: 13/13; lifecycle columns/constraints/indexes PASS; archived existing rows 0");
      return;
    }

    assert.equal(before.ledger.length, 12, "ledger-must-be-12-before-apply");
    assert.deepEqual(before.schema, { columns: [], constraints: [], indexes: [] }, "migration-013-object-already-present");
    await client.query("BEGIN");
    try {
      await client.query("SELECT set_config('wafl.runtime_environment',$1,true), set_config('wafl.migration_execution_approved',$2,true)", [process.env.WAFL_V2_RUNTIME, APPROVAL]);
      await client.query(migrationBody(source));
      await client.query(`
        INSERT INTO public.wafl_v2_migration_ledger (
          migration_id, filename, migration_sha256, runner_version,
          database_fingerprint, v1_baseline_fingerprint
        ) VALUES (13, $1, $2, 'alpha51-material-lifecycle-v1', $3, $4)
      `, [FILE, migrationSha, REQUIRED_FINGERPRINT, before.ledger[0].v1_baseline_fingerprint]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
    const after = await snapshot(client);
    assert.equal(after.ledger.length, 13);
    assert.equal(after.ledger[12].filename, FILE);
    assertAppliedSchema(after.schema);
    assert.deepEqual(after.rows, { ...before.rows, archived: 0 }, "business-row-count-mutated");
    await writeManifest({ result: "ALPHA51_MIGRATION_013_APPLY_PASS", migrationSha256: migrationSha, ledgerBefore: 12, ledgerAfter: 13, rowCounts: after.rows, databaseMutation: true, businessMutation: false, productionMutation: false });
    console.log("ALPHA51_MIGRATION_013_APPLY_PASS");
    console.log("Ledger: 12/12 -> 13/13; schema +2 columns/+2 constraints/+2 indexes; business rows 0");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("WAFL v2 alpha.51 migration runner: FAILED", { name: error instanceof Error ? error.name : "UnknownError", message: error instanceof Error ? error.message : "unknown" });
  process.exitCode = 1;
});
