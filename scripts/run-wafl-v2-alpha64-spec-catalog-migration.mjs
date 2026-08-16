#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const { Client } = pg;
const mode = process.argv[2] ?? "preflight";
const file = "017_v2_company_spec_item_catalog.sql";
const approval = "2.0.0-alpha.64-spec-catalog-dev-test-reviewed";
const manifestPath = path.resolve(".tmp/wafl-v2-alpha64/migration-017-manifest.json");
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
  if (mode === "apply") assert.equal(process.env.WAFL_V2_ALPHA64_SPEC_CATALOG_MIGRATION_APPROVED, approval, "migration-approval-missing");
  else assert.ok(!process.env.WAFL_V2_ALPHA64_SPEC_CATALOG_MIGRATION_APPROVED, "read-only-mode-approval-forbidden");
  return { url, expected };
}

async function snapshot(client) {
  await client.query("BEGIN READ ONLY");
  try {
    const ledger = (await client.query("SELECT migration_id,filename,migration_sha256,database_fingerprint,v1_baseline_fingerprint FROM public.wafl_v2_migration_ledger ORDER BY migration_id")).rows;
    const constraints = (await client.query(`SELECT conname,pg_get_constraintdef(oid) definition FROM pg_constraint WHERE conrelid='public.company_work_order_structure_options'::regclass AND conname IN ('company_work_order_structure_options_kind_check','company_work_order_structure_options_hex_check') ORDER BY conname`)).rows;
    const rows = (await client.query(`SELECT (SELECT count(*)::integer FROM work_orders) work_orders,(SELECT count(*)::integer FROM work_order_revisions) revisions,(SELECT count(*)::integer FROM company_work_order_structure_options) catalog_options,(SELECT count(*)::integer FROM work_order_size_spec_poms) pom_rows,(SELECT count(*)::integer FROM domain_events) events,(SELECT count(*)::integer FROM work_order_command_receipts) receipts`)).rows[0];
    await client.query("COMMIT");
    return { ledger, constraints, rows };
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
  const client = new Client({ connectionString: url, application_name: `wafl-v2-alpha64-spec-catalog-${mode}`, statement_timeout: 120000 });
  await client.connect();
  try {
    const before = await snapshot(client);
    assert.equal(before.ledger[0]?.database_fingerprint, expected, "ledger-fingerprint-mismatch");
    if (mode === "preflight") {
      assert.equal(before.ledger.length, 16, "ledger-must-be-16-before-017");
      assert.deepEqual(before.ledger.map((entry) => entry.filename), files.slice(0, -1), "ledger-manifest-mismatch");
      assert.equal(before.constraints.some((item) => /spec_item/u.test(item.definition)), false, "migration-017-already-present");
      await write({ result: "ALPHA64_MIGRATION_017_READ_ONLY_PREFLIGHT_PASS", migrationSha256, ledgerBefore: 16, ledgerAfter: 16, rowCounts: before.rows, databaseMutation: false, productionMutation: false });
      console.log("ALPHA64_MIGRATION_017_READ_ONLY_PREFLIGHT_PASS"); return;
    }
    if (mode === "audit") {
      assert.equal(before.ledger.length, 17, "ledger-must-be-17-after-017");
      assert.equal(before.ledger[16]?.filename, file);
      assert.equal(before.ledger[16]?.migration_sha256, migrationSha256);
      assert.equal(before.constraints.every((item) => /spec_item/u.test(item.definition)), true, "migration-017-constraints-missing");
      await write({ result: "ALPHA64_MIGRATION_017_READ_ONLY_AUDIT_PASS", migrationSha256, ledgerBefore: 16, ledgerAfter: 17, rowCounts: before.rows, databaseMutation: false, productionMutation: false });
      console.log("ALPHA64_MIGRATION_017_READ_ONLY_AUDIT_PASS"); return;
    }
    assert.equal(before.ledger.length, 16, "ledger-must-be-16-before-apply");
    await client.query("BEGIN");
    try {
      await client.query("SELECT set_config('wafl.runtime_environment',$1,true),set_config('wafl.migration_execution_approved',$2,true)", [process.env.WAFL_V2_RUNTIME, approval]);
      await client.query(executableBody(source));
      await client.query("INSERT INTO public.wafl_v2_migration_ledger(migration_id,filename,migration_sha256,runner_version,database_fingerprint,v1_baseline_fingerprint) VALUES(17,$1,$2,'alpha64-spec-catalog-v1',$3,$4)", [file, migrationSha256, expected, before.ledger[0].v1_baseline_fingerprint]);
      await client.query("COMMIT");
    } catch (error) { await client.query("ROLLBACK"); throw error; }
    const after = await snapshot(client);
    assert.equal(after.ledger.length, 17);
    assert.deepEqual(after.rows, before.rows, "business-row-count-mutated");
    assert.equal(after.constraints.every((item) => /spec_item/u.test(item.definition)), true, "migration-017-constraints-missing");
    await write({ result: "ALPHA64_MIGRATION_017_APPLY_PASS", migrationSha256, ledgerBefore: 16, ledgerAfter: 17, rowCounts: after.rows, databaseMutation: true, businessMutation: false, productionMutation: false });
    console.log("ALPHA64_MIGRATION_017_APPLY_PASS");
  } finally { await client.end(); }
}

main().catch((error) => { console.error("WAFL v2 alpha.64 spec-catalog migration runner: FAILED", { name: error instanceof Error ? error.name : "UnknownError", message: error instanceof Error ? error.message : "unknown" }); process.exitCode = 1; });
