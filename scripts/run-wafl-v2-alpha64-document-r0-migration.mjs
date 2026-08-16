#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const { Client } = pg;
const mode = process.argv[2] ?? "preflight";
const file = "016_v2_r0_document_snapshot_and_managed_qr.sql";
const approval = "2.0.0-alpha.64-dev-test-reviewed";
const manifestPath = path.resolve(".tmp/wafl-v2-alpha64/migration-016-manifest.json");
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
  if (mode === "apply") assert.equal(process.env.WAFL_V2_ALPHA64_MIGRATION_APPROVED, approval, "migration-approval-missing");
  else assert.ok(!process.env.WAFL_V2_ALPHA64_MIGRATION_APPROVED, "read-only-mode-approval-forbidden");
  return { url, expected };
}

async function snapshot(client) {
  await client.query("BEGIN READ ONLY");
  try {
    const ledger = (await client.query("SELECT migration_id,filename,migration_sha256,database_fingerprint,v1_baseline_fingerprint FROM public.wafl_v2_migration_ledger ORDER BY migration_id")).rows;
    const column = (await client.query("SELECT column_name,is_nullable,data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='work_order_material_lines' AND column_name='supplier_name_snapshot'")).rows;
    const expiry = (await client.query("SELECT is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name='document_access_tokens' AND column_name='expires_at'")).rows;
    const rows = (await client.query(`SELECT (SELECT count(*)::integer FROM work_orders) work_orders,(SELECT count(*)::integer FROM work_order_revisions) revisions,(SELECT count(*)::integer FROM work_order_material_lines) materials,(SELECT count(*)::integer FROM document_access_tokens) tokens,(SELECT count(*)::integer FROM domain_events) events,(SELECT count(*)::integer FROM work_order_command_receipts) receipts`)).rows[0];
    await client.query("COMMIT");
    return { ledger, column, expiry, rows };
  } catch (error) { await client.query("ROLLBACK"); throw error; }
}

async function write(value) { await fs.mkdir(path.dirname(manifestPath), { recursive: true }); await fs.writeFile(manifestPath, `${JSON.stringify(value, null, 2)}\n`, "utf8"); }

async function main() {
  const { url, expected } = guard();
  const source = await fs.readFile(path.resolve("db/v2/migrations", file), "utf8");
  const migrationSha256 = sha256(source);
  const files = (await fs.readdir(path.resolve("db/v2/migrations"))).filter((name) => /^\d{3}_.*\.sql$/.test(name)).sort();
  assert.equal(files.at(-1), file, "migration-order-invalid");
  assert.doesNotMatch(source.replace(/^\s*--.*$/gm, ""), /\b(?:DROP\s+TABLE|TRUNCATE|DELETE\s+FROM)\b/i, "destructive-sql-forbidden");
  const client = new Client({ connectionString: url, application_name: `wafl-v2-alpha64-document-r0-${mode}`, statement_timeout: 120000 });
  await client.connect();
  try {
    const before = await snapshot(client);
    assert.equal(before.ledger[0]?.database_fingerprint, expected, "ledger-fingerprint-mismatch");
    if (mode === "preflight") {
      assert.equal(before.ledger.length, 15, "ledger-must-be-15-before-016");
      assert.deepEqual(before.ledger.map((entry) => entry.filename), files.slice(0, -1), "ledger-manifest-mismatch");
      assert.deepEqual(before.column, [], "migration-016-column-already-present");
      await write({ result: "ALPHA64_MIGRATION_016_READ_ONLY_PREFLIGHT_PASS", migrationSha256, ledgerBefore: 15, ledgerAfter: 15, rowCounts: before.rows, databaseMutation: false, productionMutation: false });
      console.log("ALPHA64_MIGRATION_016_READ_ONLY_PREFLIGHT_PASS"); return;
    }
    if (mode === "audit") {
      assert.equal(before.ledger.length, 16, "ledger-must-be-16-after-016");
      assert.equal(before.ledger[15]?.filename, file);
      assert.equal(before.ledger[15]?.migration_sha256, migrationSha256);
      assert.equal(before.column[0]?.is_nullable, "YES");
      assert.equal(before.expiry[0]?.is_nullable, "YES");
      await write({ result: "ALPHA64_MIGRATION_016_READ_ONLY_AUDIT_PASS", migrationSha256, ledgerBefore: 15, ledgerAfter: 16, rowCounts: before.rows, databaseMutation: false, productionMutation: false });
      console.log("ALPHA64_MIGRATION_016_READ_ONLY_AUDIT_PASS"); return;
    }
    assert.equal(before.ledger.length, 15, "ledger-must-be-15-before-apply");
    assert.deepEqual(before.column, [], "migration-016-column-already-present");
    await client.query("BEGIN");
    try {
      await client.query("SELECT set_config('wafl.runtime_environment',$1,true),set_config('wafl.migration_execution_approved',$2,true)", [process.env.WAFL_V2_RUNTIME, approval]);
      await client.query(executableBody(source));
      await client.query("INSERT INTO public.wafl_v2_migration_ledger(migration_id,filename,migration_sha256,runner_version,database_fingerprint,v1_baseline_fingerprint) VALUES(16,$1,$2,'alpha64-document-r0-v1',$3,$4)", [file, migrationSha256, expected, before.ledger[0].v1_baseline_fingerprint]);
      await client.query("COMMIT");
    } catch (error) { await client.query("ROLLBACK"); throw error; }
    const after = await snapshot(client);
    assert.equal(after.ledger.length, 16);
    assert.deepEqual(after.rows, before.rows, "business-row-count-mutated");
    await write({ result: "ALPHA64_MIGRATION_016_APPLY_PASS", migrationSha256, ledgerBefore: 15, ledgerAfter: 16, rowCounts: after.rows, databaseMutation: true, businessMutation: false, productionMutation: false });
    console.log("ALPHA64_MIGRATION_016_APPLY_PASS");
  } finally { await client.end(); }
}

main().catch((error) => { console.error("WAFL v2 alpha.64 migration runner: FAILED", { name: error instanceof Error ? error.name : "UnknownError", message: error instanceof Error ? error.message : "unknown" }); process.exitCode = 1; });
