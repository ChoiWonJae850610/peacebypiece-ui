#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const { Client } = pg;
const mode = process.argv[2] ?? "preflight";
const file = "015_v2_company_work_order_structure_options.sql";
const approval = "2.0.0-alpha.62-dev-test-reviewed";
const manifestPath = path.resolve(".tmp/wafl-v2-alpha62/structure-option-migration-manifest.json");
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const fingerprint = (url) => {
  const parsed = new URL(url);
  return sha256(`${parsed.hostname}/${decodeURIComponent(parsed.pathname.replace(/^\/+/, ""))}`).slice(0, 12);
};
const executableBody = (source) => source
  .replace(/^\uFEFF/, "")
  .replace(/^\s*BEGIN\s*;/i, "")
  .replace(/COMMIT\s*;\s*$/i, "")
  .trim();

function guard() {
  const url = process.env.DATABASE_URL;
  const expected = String(process.env.WAFL_V2_APPROVED_DB_FINGERPRINT ?? "").trim();
  assert.ok(["preflight", "apply", "audit"].includes(mode), "unsupported-mode");
  assert.ok(url, "database-url-missing");
  assert.ok(["development", "test"].includes(process.env.WAFL_V2_RUNTIME), "dev-test-runtime-required");
  assert.equal(process.env.WAFL_V2_TEST_PREFIX, "wafl-fn", "test-prefix-mismatch");
  assert.match(expected, /^[0-9a-f]{12}$/i, "approved-fingerprint-missing");
  assert.equal(fingerprint(url), expected, "target-fingerprint-mismatch");
  if (mode === "apply") assert.equal(process.env.WAFL_V2_ALPHA62_MIGRATION_APPROVED, approval, "migration-approval-missing");
  else assert.ok(!process.env.WAFL_V2_ALPHA62_MIGRATION_APPROVED, "read-only-mode-approval-forbidden");
  return { url, expected };
}

async function snapshot(client) {
  await client.query("BEGIN READ ONLY");
  try {
    const ledger = (await client.query("SELECT migration_id,filename,migration_sha256,database_fingerprint,v1_baseline_fingerprint FROM public.wafl_v2_migration_ledger ORDER BY migration_id")).rows;
    const schema = (await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema='public' AND table_name='company_work_order_structure_options'
    `)).rows;
    const rows = (await client.query(`
      SELECT
        (SELECT count(*)::integer FROM work_orders) work_orders,
        (SELECT count(*)::integer FROM work_order_revisions) revisions,
        (SELECT count(*)::integer FROM domain_events) events,
        (SELECT count(*)::integer FROM work_order_command_receipts) receipts
    `)).rows[0];
    rows.structure_options = schema.length === 0
      ? 0
      : (await client.query("SELECT count(*)::integer AS count FROM company_work_order_structure_options")).rows[0].count;
    const policies = schema.length === 0 ? [] : (await client.query(`
      SELECT policyname,cmd,qual,with_check FROM pg_policies
      WHERE schemaname='public' AND tablename='company_work_order_structure_options'
      ORDER BY policyname
    `)).rows;
    await client.query("COMMIT");
    return { ledger, schema, rows, policies };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function write(value) {
  await fs.mkdir(path.dirname(manifestPath), { recursive: true });
  await fs.writeFile(manifestPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

const main = async () => {
  const { url, expected } = guard();
  const source = await fs.readFile(path.resolve("db/v2/migrations", file), "utf8");
  const migrationSha256 = sha256(source);
  const sqlWithoutComments = source.replace(/^\s*--.*$/gm, "");
  assert.doesNotMatch(sqlWithoutComments, /\b(?:DROP\s+TABLE|TRUNCATE|DELETE\s+FROM)\b/i, "destructive-sql-forbidden");
  const files = (await fs.readdir(path.resolve("db/v2/migrations"))).filter((name) => /^\d{3}_.*\.sql$/.test(name)).sort();
  assert.equal(files.at(-1), file, "migration-order-invalid");
  const client = new Client({ connectionString: url, application_name: `wafl-v2-alpha62-structure-options-${mode}`, statement_timeout: 120000 });
  await client.connect();
  try {
    const before = await snapshot(client);
    assert.equal(before.ledger[0]?.database_fingerprint, expected, "ledger-fingerprint-mismatch");
    if (mode === "preflight") {
      assert.equal(before.ledger.length, 14, "ledger-must-be-14-before-015");
      assert.deepEqual(before.ledger.map((entry) => entry.filename), files.slice(0, -1), "ledger-manifest-mismatch");
      assert.deepEqual(before.schema, [], "migration-015-object-already-present");
      await write({ result: "ALPHA62_MIGRATION_015_READ_ONLY_PREFLIGHT_PASS", migrationSha256, ledgerBefore: 14, ledgerAfter: 14, rowCounts: before.rows, databaseMutation: false, productionMutation: false });
      console.log("ALPHA62_MIGRATION_015_READ_ONLY_PREFLIGHT_PASS");
      return;
    }
    if (mode === "audit") {
      assert.equal(before.ledger.length, 15, "ledger-must-be-15-after-015");
      assert.equal(before.ledger[14]?.filename, file);
      assert.equal(before.ledger[14]?.migration_sha256, migrationSha256);
      assert.deepEqual(before.schema.map((entry) => entry.table_name), ["company_work_order_structure_options"]);
      assert.equal(before.policies.length, 1, "tenant-policy-count-mismatch");
      assert.match(String(before.policies[0]?.qual), /wafl_v2_request_company_id/);
      await write({ result: "ALPHA62_MIGRATION_015_READ_ONLY_AUDIT_PASS", migrationSha256, ledgerBefore: 14, ledgerAfter: 15, rowCounts: before.rows, policyCount: before.policies.length, databaseMutation: false, productionMutation: false });
      console.log("ALPHA62_MIGRATION_015_READ_ONLY_AUDIT_PASS");
      return;
    }
    assert.equal(before.ledger.length, 14, "ledger-must-be-14-before-apply");
    assert.deepEqual(before.schema, [], "migration-015-object-already-present");
    await client.query("BEGIN");
    try {
      await client.query("SELECT set_config('wafl.runtime_environment',$1,true),set_config('wafl.migration_execution_approved',$2,true)", [process.env.WAFL_V2_RUNTIME, approval]);
      await client.query(executableBody(source));
      await client.query(`
        INSERT INTO public.wafl_v2_migration_ledger(
          migration_id,filename,migration_sha256,runner_version,database_fingerprint,v1_baseline_fingerprint
        ) VALUES(15,$1,$2,'alpha62-company-structure-options-v1',$3,$4)
      `, [file, migrationSha256, expected, before.ledger[0].v1_baseline_fingerprint]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
    const after = await snapshot(client);
    assert.equal(after.ledger.length, 15);
    assert.equal(after.rows.work_orders, before.rows.work_orders, "work-order-count-mutated");
    assert.equal(after.rows.revisions, before.rows.revisions, "revision-count-mutated");
    assert.equal(after.rows.events, before.rows.events, "event-count-mutated");
    assert.equal(after.rows.receipts, before.rows.receipts, "receipt-count-mutated");
    assert.equal(after.rows.structure_options, 0, "catalog-seed-forbidden");
    await write({ result: "ALPHA62_MIGRATION_015_APPLY_PASS", migrationSha256, ledgerBefore: 14, ledgerAfter: 15, rowCounts: after.rows, databaseMutation: true, businessMutation: false, productionMutation: false });
    console.log("ALPHA62_MIGRATION_015_APPLY_PASS");
  } finally {
    await client.end();
  }
};

main().catch((error) => {
  console.error("WAFL v2 alpha.62 structure-option migration runner: FAILED", { name: error instanceof Error ? error.name : "UnknownError", message: error instanceof Error ? error.message : "unknown" });
  process.exitCode = 1;
});
