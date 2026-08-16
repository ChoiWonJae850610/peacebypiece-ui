#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const { Client } = pg;
const mode = process.argv[2] ?? "preflight";
const file = "018_v2_company_spec_item_category_scope.sql";
const approval = "2.0.0-alpha.64-category-spec-items-dev-test-reviewed";
const manifestPath = path.resolve(".tmp/wafl-v2-alpha64/migration-018-manifest.json");
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
  if (mode === "apply") assert.equal(process.env.WAFL_V2_ALPHA64_CATEGORY_SPEC_MIGRATION_APPROVED, approval, "migration-approval-missing");
  else assert.ok(!process.env.WAFL_V2_ALPHA64_CATEGORY_SPEC_MIGRATION_APPROVED, "read-only-mode-approval-forbidden");
  return { url, expected };
}

async function snapshot(client) {
  await client.query("BEGIN READ ONLY");
  try {
    const ledger = (await client.query("SELECT migration_id,filename,migration_sha256,database_fingerprint,v1_baseline_fingerprint FROM public.wafl_v2_migration_ledger ORDER BY migration_id")).rows;
    const categoryColumn = (await client.query("SELECT data_type,is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name='company_work_order_structure_options' AND column_name='category_code'")).rows;
    const categoryIndexes = (await client.query("SELECT indexname,indexdef FROM pg_indexes WHERE schemaname='public' AND tablename='company_work_order_structure_options' AND indexname LIKE '%category%' ORDER BY indexname")).rows;
    const rows = (await client.query(`SELECT (SELECT count(*)::integer FROM work_orders) work_orders,(SELECT count(*)::integer FROM work_order_revisions) revisions,(SELECT count(*)::integer FROM company_work_order_structure_options) catalog_options,(SELECT count(*)::integer FROM work_order_size_spec_poms) pom_rows,(SELECT count(*)::integer FROM domain_events) events,(SELECT count(*)::integer FROM work_order_command_receipts) receipts`)).rows[0];
    await client.query("COMMIT");
    return { ledger, categoryColumn, categoryIndexes, rows };
  } catch (error) { await client.query("ROLLBACK"); throw error; }
}

async function write(value) { await fs.mkdir(path.dirname(manifestPath), { recursive: true }); await fs.writeFile(manifestPath, `${JSON.stringify(value, null, 2)}\n`, "utf8"); }

async function main() {
  const { url, expected } = guard();
  const source = await fs.readFile(path.resolve("db/v2/migrations", file), "utf8");
  const migrationSha256 = sha256(source);
  const files = (await fs.readdir(path.resolve("db/v2/migrations"))).filter((name) => /^\d{3}_.*\.sql$/.test(name)).sort();
  assert.equal(files.at(-1), file, "migration-order-invalid");
  assert.doesNotMatch(source.replace(/^\s*--.*$/gm, ""), /\b(?:DROP\s+TABLE|DROP\s+COLUMN|TRUNCATE|DELETE\s+FROM)\b/i, "destructive-sql-forbidden");
  const client = new Client({ connectionString: url, application_name: `wafl-v2-alpha64-category-spec-${mode}`, statement_timeout: 120000 });
  await client.connect();
  try {
    const before = await snapshot(client);
    assert.equal(before.ledger[0]?.database_fingerprint, expected, "ledger-fingerprint-mismatch");
    if (mode === "preflight") {
      assert.equal(before.ledger.length, 17, "ledger-must-be-17-before-018");
      assert.deepEqual(before.ledger.map((entry) => entry.filename), files.slice(0, -1), "ledger-manifest-mismatch");
      assert.equal(before.categoryColumn.length, 0, "migration-018-already-present");
      await write({ result: "ALPHA64_MIGRATION_018_READ_ONLY_PREFLIGHT_PASS", migrationSha256, ledgerBefore: 17, ledgerAfter: 17, rowCounts: before.rows, databaseMutation: false, productionMutation: false });
      console.log("ALPHA64_MIGRATION_018_READ_ONLY_PREFLIGHT_PASS"); return;
    }
    if (mode === "audit") {
      assert.equal(before.ledger.length, 18, "ledger-must-be-18-after-018");
      assert.equal(before.ledger[17]?.filename, file);
      assert.equal(before.ledger[17]?.migration_sha256, migrationSha256);
      assert.equal(before.categoryColumn.length, 1, "migration-018-column-missing");
      assert.equal(before.categoryIndexes.length, 2, "migration-018-indexes-missing");
      await write({ result: "ALPHA64_MIGRATION_018_READ_ONLY_AUDIT_PASS", migrationSha256, ledgerBefore: 17, ledgerAfter: 18, rowCounts: before.rows, databaseMutation: false, productionMutation: false });
      console.log("ALPHA64_MIGRATION_018_READ_ONLY_AUDIT_PASS"); return;
    }
    assert.equal(before.ledger.length, 17, "ledger-must-be-17-before-apply");
    await client.query("BEGIN");
    try {
      await client.query("SELECT set_config('wafl.runtime_environment',$1,true),set_config('wafl.migration_execution_approved',$2,true)", [process.env.WAFL_V2_RUNTIME, approval]);
      await client.query(executableBody(source));
      await client.query("INSERT INTO public.wafl_v2_migration_ledger(migration_id,filename,migration_sha256,runner_version,database_fingerprint,v1_baseline_fingerprint) VALUES(18,$1,$2,'alpha64-category-spec-v1',$3,$4)", [file, migrationSha256, expected, before.ledger[0].v1_baseline_fingerprint]);
      await client.query("COMMIT");
    } catch (error) { await client.query("ROLLBACK"); throw error; }
    const after = await snapshot(client);
    assert.equal(after.ledger.length, 18);
    assert.deepEqual(after.rows, before.rows, "business-row-count-mutated");
    assert.equal(after.categoryColumn.length, 1);
    assert.equal(after.categoryIndexes.length, 2);
    await write({ result: "ALPHA64_MIGRATION_018_APPLY_PASS", migrationSha256, ledgerBefore: 17, ledgerAfter: 18, rowCounts: after.rows, databaseMutation: true, businessMutation: false, productionMutation: false });
    console.log("ALPHA64_MIGRATION_018_APPLY_PASS");
  } finally { await client.end(); }
}

main().catch((error) => { console.error("WAFL v2 alpha.64 category Spec Item migration runner: FAILED", { name: error instanceof Error ? error.name : "UnknownError", message: error instanceof Error ? error.message : "unknown" }); process.exitCode = 1; });
