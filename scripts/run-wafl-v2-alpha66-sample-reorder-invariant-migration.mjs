#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const { Client } = pg;
const mode = process.argv[2] ?? "preflight";
const file = "020_v2_sample_reorder_invariant.sql";
const approval = "2.0.0-alpha.66-sample-reorder-invariant-dev-test-reviewed";
const manifestPath = path.resolve(".tmp/wafl-v2-alpha66/migration-020-manifest.json");
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
  if (mode === "apply") assert.equal(process.env.WAFL_V2_ALPHA66_SAMPLE_REORDER_MIGRATION_APPROVED, approval, "migration-approval-missing");
  else assert.ok(!process.env.WAFL_V2_ALPHA66_SAMPLE_REORDER_MIGRATION_APPROVED, "read-only-mode-approval-forbidden");
  return { url, expected };
}

async function snapshot(client) {
  await client.query("BEGIN READ ONLY");
  try {
    const ledger = (await client.query("SELECT migration_id,filename,migration_sha256,database_fingerprint,v1_baseline_fingerprint FROM public.wafl_v2_migration_ledger ORDER BY migration_id")).rows;
    const constraint = (await client.query("SELECT conname,pg_get_constraintdef(oid) definition FROM pg_constraint WHERE conrelid='public.work_orders'::regclass AND conname='work_orders_sample_reorder_invariant_check'")).rows;
    const invalid = (await client.query(`
      SELECT count(*)::integer total,
             count(*) FILTER (WHERE product_name LIKE 'QA A66 계보 필터 %')::integer fixture,
             count(*) FILTER (WHERE product_name NOT LIKE 'QA A66 계보 필터 %')::integer unknown
      FROM work_orders
      WHERE is_sample=true AND (derivation_kind='reorder' OR reorder_round>=1)
    `)).rows[0];
    const rows = (await client.query(`SELECT (SELECT count(*)::integer FROM work_orders) work_orders,(SELECT count(*)::integer FROM work_order_revisions) revisions,(SELECT count(*)::integer FROM domain_events) events,(SELECT count(*)::integer FROM work_order_command_receipts) receipts`)).rows[0];
    await client.query("COMMIT");
    return { ledger, constraint, invalid: { total: Number(invalid.total), fixture: Number(invalid.fixture), unknown: Number(invalid.unknown) }, rows };
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
  assert.equal(files.at(-1), file, "migration-order-invalid");
  assert.doesNotMatch(source.replace(/^\s*--.*$/gm, ""), /\b(?:DROP\s+TABLE|DROP\s+COLUMN|TRUNCATE|DELETE\s+FROM|UPDATE\s+work_orders)\b/i, "destructive-sql-forbidden");
  const client = new Client({ connectionString: url, application_name: `wafl-v2-alpha66-sample-reorder-${mode}`, statement_timeout: 120000 });
  await client.connect();
  try {
    const before = await snapshot(client);
    assert.equal(before.ledger[0]?.database_fingerprint, expected, "ledger-fingerprint-mismatch");
    assert.equal(before.invalid.unknown, 0, "unknown-sample-reorder-violation-stop");
    if (mode === "preflight") {
      assert.equal(before.ledger.length, 19, "ledger-must-be-19-before-020");
      assert.equal(before.constraint.length, 0, "migration-020-already-present");
      await write({ result: "ALPHA66_MIGRATION_020_READ_ONLY_PREFLIGHT_PASS", migrationSha256, ledgerBefore: 19, fixtureViolationRows: before.invalid.fixture, unknownViolationRows: 0, databaseMutation: false, productionMutation: false });
      console.log("ALPHA66_MIGRATION_020_READ_ONLY_PREFLIGHT_PASS"); return;
    }
    if (mode === "audit") {
      assert.equal(before.ledger.length, 20, "ledger-must-be-20-after-020");
      assert.equal(before.ledger[19]?.filename, file);
      assert.equal(before.ledger[19]?.migration_sha256, migrationSha256);
      assert.equal(before.constraint.length, 1, "migration-020-constraint-missing");
      assert.equal(before.invalid.total, 0, "sample-reorder-invariant-drift");
      await write({ result: "ALPHA66_MIGRATION_020_READ_ONLY_AUDIT_PASS", migrationSha256, ledgerBefore: 19, ledgerAfter: 20, invalidRows: 0, databaseMutation: false, productionMutation: false });
      console.log("ALPHA66_MIGRATION_020_READ_ONLY_AUDIT_PASS"); return;
    }
    assert.equal(before.ledger.length, 19, "ledger-must-be-19-before-apply");
    assert.equal(before.invalid.total, 0, "fixture-reconciliation-required-before-apply");
    await client.query("BEGIN");
    try {
      await client.query("SELECT set_config('wafl.runtime_environment',$1,true),set_config('wafl.migration_execution_approved',$2,true)", [process.env.WAFL_V2_RUNTIME, approval]);
      await client.query(executableBody(source));
      await client.query("INSERT INTO public.wafl_v2_migration_ledger(migration_id,filename,migration_sha256,runner_version,database_fingerprint,v1_baseline_fingerprint) VALUES(20,$1,$2,'alpha66-sample-reorder-invariant-v1',$3,$4)", [file, migrationSha256, expected, before.ledger[0].v1_baseline_fingerprint]);
      await client.query("COMMIT");
    } catch (error) { await client.query("ROLLBACK"); throw error; }
    const after = await snapshot(client);
    assert.equal(after.ledger.length, 20);
    assert.deepEqual(after.rows, before.rows, "migration-business-row-count-mutated");
    assert.equal(after.constraint.length, 1);
    assert.equal(after.invalid.total, 0);
    await write({ result: "ALPHA66_MIGRATION_020_APPLY_PASS", migrationSha256, ledgerBefore: 19, ledgerAfter: 20, rowCounts: after.rows, databaseMutation: true, businessMutation: false, productionMutation: false });
    console.log("ALPHA66_MIGRATION_020_APPLY_PASS");
  } finally { await client.end(); }
}

main().catch((error) => { console.error("WAFL v2 alpha.66 sample/reorder migration runner: FAILED", { name: error instanceof Error ? error.name : "UnknownError", message: error instanceof Error ? error.message : "unknown" }); process.exitCode = 1; });
