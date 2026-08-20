#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const { Client } = pg;
const mode = process.argv[2] ?? "preflight";
const file = "019_v2_work_order_lineage_sample.sql";
const approval = "2.0.0-alpha.66-lineage-sample-dev-test-reviewed";
const manifestPath = path.resolve(".tmp/wafl-v2-alpha66/migration-019-manifest.json");
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const fingerprint = (url) => { const parsed = new URL(url); return sha256(`${parsed.hostname}/${decodeURIComponent(parsed.pathname.replace(/^\/+/, ""))}`).slice(0, 12); };
const executableBody = (source) => source.replace(/^\uFEFF/, "").replace(/^\s*BEGIN\s*;/i, "").replace(/COMMIT\s*;\s*$/i, "").trim();

function guard() {
  const url = process.env.DATABASE_URL;
  const expected = String(process.env.WAFL_V2_APPROVED_DB_FINGERPRINT ?? "").trim();
  assert.ok(["preflight", "apply", "audit"].includes(mode), "unsupported-mode");
  assert.ok(url, "database-url-missing");
  assert.ok(["development", "test"].includes(process.env.WAFL_V2_RUNTIME), "dev-test-runtime-required");
  assert.equal(process.env.WAFL_V2_TEST_PREFIX, "wafl-fn", "test-prefix-mismatch");
  assert.match(expected, /^[0-9a-f]{12}$/i, "approved-fingerprint-missing");
  assert.equal(fingerprint(url), expected, "target-fingerprint-mismatch");
  if (mode === "apply") assert.equal(process.env.WAFL_V2_ALPHA66_LINEAGE_MIGRATION_APPROVED, approval, "migration-approval-missing");
  else assert.ok(!process.env.WAFL_V2_ALPHA66_LINEAGE_MIGRATION_APPROVED, "read-only-mode-approval-forbidden");
  return { url, expected };
}

async function snapshot(client) {
  await client.query("BEGIN READ ONLY");
  try {
    const ledger = (await client.query("SELECT migration_id,filename,migration_sha256,database_fingerprint,v1_baseline_fingerprint FROM public.wafl_v2_migration_ledger ORDER BY migration_id")).rows;
    const columns = (await client.query("SELECT column_name,data_type,is_nullable,column_default FROM information_schema.columns WHERE table_schema='public' AND table_name='work_orders' AND column_name IN ('is_sample','derivation_kind','source_work_order_id','source_revision_id','series_root_work_order_id','reorder_round') ORDER BY column_name")).rows;
    const constraints = (await client.query("SELECT conname,contype,pg_get_constraintdef(oid) definition FROM pg_constraint WHERE conrelid='public.work_orders'::regclass AND conname LIKE 'work_orders_%lineage%' OR conrelid='public.work_orders'::regclass AND conname IN ('work_orders_derivation_kind_check','work_orders_reorder_round_check','work_orders_source_work_order_fk','work_orders_series_root_work_order_fk','work_orders_source_revision_fk') ORDER BY conname")).rows;
    const indexes = (await client.query("SELECT indexname,indexdef FROM pg_indexes WHERE schemaname='public' AND tablename='work_orders' AND indexname IN ('work_orders_company_derivation_recent_idx','work_orders_company_sample_recent_idx','work_orders_series_round_idx','work_orders_reorder_round_unique_idx') ORDER BY indexname")).rows;
    const rows = (await client.query(`SELECT (SELECT count(*)::integer FROM work_orders) work_orders,(SELECT count(*)::integer FROM work_order_revisions) revisions,(SELECT count(*)::integer FROM domain_events) events,(SELECT count(*)::integer FROM work_order_command_receipts) receipts`)).rows[0];
    const invalidIdentityShape = columns.length === 6 ? Number((await client.query(`
      SELECT count(*)
      FROM work_orders
      WHERE derivation_kind NOT IN ('original','reorder','rework')
         OR reorder_round < 0
         OR (derivation_kind = 'original' AND (source_work_order_id IS NOT NULL OR source_revision_id IS NOT NULL OR reorder_round <> 0))
         OR (derivation_kind = 'reorder' AND (source_work_order_id IS NULL OR source_revision_id IS NULL OR series_root_work_order_id IS NULL OR reorder_round < 1))
         OR (derivation_kind = 'rework' AND (source_work_order_id IS NULL OR source_revision_id IS NULL OR series_root_work_order_id IS NULL))
         OR source_work_order_id = id
    `)).rows[0].count) : null;
    await client.query("COMMIT");
    return { ledger, columns, constraints, indexes, rows, invalidIdentityShape };
  } catch (error) { await client.query("ROLLBACK"); throw error; }
}

async function write(value) {
  await fs.mkdir(path.dirname(manifestPath), { recursive: true });
  await fs.writeFile(manifestPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function main() {
  const { url, expected } = guard();
  const source = await fs.readFile(path.resolve("db/v2/migrations", file), "utf8");
  const migrationSha256 = sha256(source);
  const files = (await fs.readdir(path.resolve("db/v2/migrations"))).filter((name) => /^\d{3}_.*\.sql$/.test(name)).sort();
  assert.equal(files[18], file, "migration-019-order-invalid");
  assert.doesNotMatch(source.replace(/^\s*--.*$/gm, ""), /\b(?:DROP\s+TABLE|DROP\s+COLUMN|TRUNCATE|DELETE\s+FROM|UPDATE\s+work_orders)\b/i, "destructive-sql-forbidden");
  const client = new Client({ connectionString: url, application_name: `wafl-v2-alpha66-lineage-${mode}`, statement_timeout: 120000 });
  await client.connect();
  try {
    const before = await snapshot(client);
    assert.equal(before.ledger[0]?.database_fingerprint, expected, "ledger-fingerprint-mismatch");
    if (mode === "preflight") {
      assert.equal(before.ledger.length, 18, "ledger-must-be-18-before-019");
      assert.deepEqual(before.ledger.map((entry) => entry.filename), files.slice(0, -1), "ledger-manifest-mismatch");
      assert.equal(before.columns.length, 0, "migration-019-already-present");
      await write({ result: "ALPHA66_MIGRATION_019_READ_ONLY_PREFLIGHT_PASS", migrationSha256, ledgerBefore: 18, ledgerAfter: 18, rowCounts: before.rows, databaseMutation: false, productionMutation: false });
      console.log("ALPHA66_MIGRATION_019_READ_ONLY_PREFLIGHT_PASS"); return;
    }
    if (mode === "audit") {
      assert.ok(before.ledger.length >= 19, "ledger-must-contain-019");
      assert.equal(before.ledger[18]?.filename, file);
      assert.equal(before.ledger[18]?.migration_sha256, migrationSha256);
      assert.equal(before.columns.length, 6, "migration-019-columns-missing");
      assert.ok(before.constraints.length >= 7, "migration-019-constraints-missing");
      assert.equal(before.indexes.length, 4, "migration-019-indexes-missing");
      assert.equal(before.invalidIdentityShape, 0, "work-order-identity-shape-drift");
      await write({ result: "ALPHA66_MIGRATION_019_READ_ONLY_AUDIT_PASS", migrationSha256, ledgerBefore: 18, ledgerAfter: 19, rowCounts: before.rows, invalidIdentityShapeRows: 0, databaseMutation: false, productionMutation: false });
      console.log("ALPHA66_MIGRATION_019_READ_ONLY_AUDIT_PASS"); return;
    }
    assert.equal(before.ledger.length, 18, "ledger-must-be-18-before-apply");
    await client.query("BEGIN");
    try {
      await client.query("SELECT set_config('wafl.runtime_environment',$1,true),set_config('wafl.migration_execution_approved',$2,true)", [process.env.WAFL_V2_RUNTIME, approval]);
      await client.query(executableBody(source));
      await client.query("INSERT INTO public.wafl_v2_migration_ledger(migration_id,filename,migration_sha256,runner_version,database_fingerprint,v1_baseline_fingerprint) VALUES(19,$1,$2,'alpha66-lineage-sample-v1',$3,$4)", [file, migrationSha256, expected, before.ledger[0].v1_baseline_fingerprint]);
      await client.query("COMMIT");
    } catch (error) { await client.query("ROLLBACK"); throw error; }
    const after = await snapshot(client);
    assert.equal(after.ledger.length, 19);
    assert.deepEqual(after.rows, before.rows, "migration-business-row-count-mutated");
    assert.equal(after.columns.length, 6);
    assert.equal(after.indexes.length, 4);
    assert.equal(after.invalidIdentityShape, 0);
    await write({ result: "ALPHA66_MIGRATION_019_APPLY_PASS", migrationSha256, ledgerBefore: 18, ledgerAfter: 19, rowCounts: after.rows, invalidExistingIdentityRows: 0, databaseMutation: true, businessMutation: false, productionMutation: false });
    console.log("ALPHA66_MIGRATION_019_APPLY_PASS");
  } finally { await client.end(); }
}

main().catch((error) => { console.error("WAFL v2 alpha.66 lineage migration runner: FAILED", { name: error instanceof Error ? error.name : "UnknownError", message: error instanceof Error ? error.message : "unknown" }); process.exitCode = 1; });
