#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const { Client } = pg;
const mode = process.argv[2] ?? "preflight";
const file = "021_v2_work_order_image_output_include.sql";
const approval = "2.0.0-alpha.70-image-output-include-dev-test-reviewed";
const resultPath = path.resolve(".tmp/wafl-v2-alpha70/migration-021-result.json");
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const fingerprint = (url) => { const parsed = new URL(url); return sha256(`${parsed.hostname}/${decodeURIComponent(parsed.pathname.replace(/^\/+/, ""))}`).slice(0, 12); };
const executableBody = (source) => source.replace(/^\uFEFF/, "").replace(/^\s*BEGIN\s*;/i, "").replace(/COMMIT\s*;\s*$/i, "").trim();

async function localEnvironment() {
  const entries = Object.fromEntries((await fs.readFile(path.resolve(".env.local"), "utf8")).split(/\r?\n/u).map((line) => {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/u);
    return match ? [match[1], match[2].trim().replace(/^("|')|("|')$/gu, "")] : null;
  }).filter(Boolean));
  return entries;
}

async function snapshot(client) {
  await client.query("BEGIN READ ONLY");
  try {
    const ledger = (await client.query("SELECT migration_id,filename,migration_sha256,database_fingerprint,v1_baseline_fingerprint FROM public.wafl_v2_migration_ledger ORDER BY migration_id")).rows;
    const column = (await client.query(`
      SELECT column_name,data_type,is_nullable,column_default
      FROM information_schema.columns
      WHERE table_schema='public' AND table_name='work_order_revision_images' AND column_name='output_include'
    `)).rows;
    const rows = (await client.query(`SELECT
      (SELECT count(*)::integer FROM work_orders) work_orders,
      (SELECT count(*)::integer FROM work_order_revisions) revisions,
      (SELECT count(*)::integer FROM work_order_images) images,
      (SELECT count(*)::integer FROM work_order_revision_images) revision_images,
      (SELECT count(*)::integer FROM work_order_attachments) attachments,
      (SELECT count(*)::integer FROM work_order_revision_attachments) revision_attachments
    `)).rows[0];
    const included = column.length === 1
      ? Number((await client.query("SELECT count(*)::integer count FROM work_order_revision_images WHERE output_include=true")).rows[0].count)
      : null;
    await client.query("COMMIT");
    return { ledger, column, rows, included };
  } catch (error) { await client.query("ROLLBACK"); throw error; }
}

async function write(value) {
  await fs.mkdir(path.dirname(resultPath), { recursive: true });
  await fs.writeFile(resultPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function main() {
  const local = await localEnvironment();
  const url = local.DATABASE_URL;
  const expected = process.env.WAFL_V2_APPROVED_DB_FINGERPRINT ?? local.WAFL_V2_APPROVED_DB_FINGERPRINT;
  const runtime = process.env.WAFL_V2_RUNTIME ?? local.WAFL_V2_RUNTIME;
  const prefix = process.env.WAFL_V2_TEST_PREFIX ?? local.WAFL_V2_TEST_PREFIX;
  assert.ok(["preflight", "apply", "audit"].includes(mode), "unsupported-mode");
  assert.ok(url, "database-url-missing");
  assert.ok(["development", "test"].includes(runtime), "dev-test-runtime-required");
  assert.equal(prefix, "wafl-fn", "test-prefix-mismatch");
  assert.match(expected ?? "", /^[0-9a-f]{12}$/i, "approved-fingerprint-missing");
  assert.equal(fingerprint(url), expected, "target-fingerprint-mismatch");
  if (mode === "apply") assert.equal(process.env.WAFL_V2_ALPHA70_IMAGE_OUTPUT_INCLUDE_MIGRATION_APPROVED, approval, "migration-approval-missing");
  const source = await fs.readFile(path.resolve("db/v2/migrations", file), "utf8");
  const migrationSha256 = sha256(source);
  const files = (await fs.readdir(path.resolve("db/v2/migrations"))).filter((name) => /^\d{3}_.*\.sql$/.test(name)).sort();
  assert.equal(files.at(-1), file, "migration-order-invalid");
  assert.doesNotMatch(source.replace(/^\s*--.*$/gm, ""), /\b(?:DROP|TRUNCATE|DELETE|UPDATE|ALTER\s+COLUMN)\b/i, "destructive-sql-forbidden");
  assert.match(source, /ADD COLUMN output_include boolean NOT NULL DEFAULT false/i);
  const client = new Client({ connectionString: url, application_name: `wafl-v2-alpha70-image-output-include-${mode}`, statement_timeout: 120000 });
  await client.connect();
  try {
    const before = await snapshot(client);
    assert.equal(before.ledger[0]?.database_fingerprint, expected, "ledger-fingerprint-mismatch");
    if (mode === "preflight") {
      assert.equal(before.ledger.length, 20, "ledger-must-be-20-before-021");
      assert.equal(before.column.length, 0, "migration-021-already-present");
      await write({ result: "ALPHA70_MIGRATION_021_READ_ONLY_PREFLIGHT_PASS", migrationSha256, ledgerBefore: 20, rowCounts: before.rows, databaseMutation: false, productionMutation: false, ownerMutation: false });
      console.log("ALPHA70_MIGRATION_021_READ_ONLY_PREFLIGHT_PASS"); return;
    }
    if (mode === "audit") {
      assert.equal(before.ledger.length, 21, "ledger-must-be-21-after-021");
      assert.equal(before.ledger[20]?.filename, file);
      assert.equal(before.ledger[20]?.migration_sha256, migrationSha256);
      assert.deepEqual(before.column, [{ column_name: "output_include", data_type: "boolean", is_nullable: "NO", column_default: "false" }]);
      await write({ result: "ALPHA70_MIGRATION_021_READ_ONLY_AUDIT_PASS", migrationSha256, ledgerBefore: 20, ledgerAfter: 21, existingIncludedRows: before.included, rowCounts: before.rows, databaseMutation: false, productionMutation: false, ownerMutation: false });
      console.log("ALPHA70_MIGRATION_021_READ_ONLY_AUDIT_PASS"); return;
    }
    assert.equal(before.ledger.length, 20, "ledger-must-be-20-before-apply");
    assert.equal(before.column.length, 0, "migration-021-already-present");
    await client.query("BEGIN");
    try {
      await client.query("SELECT set_config('wafl.runtime_environment',$1,true),set_config('wafl.migration_execution_approved',$2,true)", [runtime, approval]);
      await client.query(executableBody(source));
      await client.query("INSERT INTO public.wafl_v2_migration_ledger(migration_id,filename,migration_sha256,runner_version,database_fingerprint,v1_baseline_fingerprint) VALUES(21,$1,$2,'alpha70-image-output-include-v1',$3,$4)", [file, migrationSha256, expected, before.ledger[0].v1_baseline_fingerprint]);
      await client.query("COMMIT");
    } catch (error) { await client.query("ROLLBACK"); throw error; }
    const after = await snapshot(client);
    assert.equal(after.ledger.length, 21);
    assert.deepEqual(after.rows, before.rows, "migration-business-row-count-mutated");
    assert.equal(after.included, 0, "existing-image-default-must-be-false");
    assert.deepEqual(after.column, [{ column_name: "output_include", data_type: "boolean", is_nullable: "NO", column_default: "false" }]);
    await write({ result: "ALPHA70_MIGRATION_021_APPLY_PASS", migrationSha256, ledgerBefore: 20, ledgerAfter: 21, rowCountsBefore: before.rows, rowCountsAfter: after.rows, existingIncludedRows: 0, databaseMutation: true, businessMutation: false, productionMutation: false, ownerMutation: false });
    console.log("ALPHA70_MIGRATION_021_APPLY_PASS");
  } finally { await client.end(); }
}

main().catch((error) => { console.error("WAFL v2 alpha.70 image output-include migration runner: FAILED", { name: error instanceof Error ? error.name : "UnknownError", message: error instanceof Error ? error.message : "unknown" }); process.exitCode = 1; });
