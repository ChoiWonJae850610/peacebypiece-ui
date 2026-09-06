#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const { Client } = pg;
const mode = process.argv[2] ?? "preflight";
const file = "022_v2_work_order_drawings.sql";
const approval = "2.0.0-alpha.73-work-order-drawing-dev-test-reviewed";
const resultPath = path.resolve(".tmp/wafl-v2-alpha73/migration-022-result.json");
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const fingerprint = (url) => { const parsed = new URL(url); return sha256(`${parsed.hostname}/${decodeURIComponent(parsed.pathname.replace(/^\/+/, ""))}`).slice(0, 12); };
const executableBody = (source) => source.replace(/^\uFEFF/, "").replace(/^\s*BEGIN\s*;/i, "").replace(/COMMIT\s*;\s*$/i, "").trim();

async function localEnvironment() {
  return Object.fromEntries((await fs.readFile(path.resolve(".env.local"), "utf8")).split(/\r?\n/u).map((line) => {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/u);
    return match ? [match[1], match[2].trim().replace(/^("|')|("|')$/gu, "")] : null;
  }).filter(Boolean));
}

async function snapshot(client) {
  await client.query("BEGIN READ ONLY");
  try {
    const ledger = (await client.query("SELECT migration_id,filename,migration_sha256,database_fingerprint,v1_baseline_fingerprint FROM public.wafl_v2_migration_ledger ORDER BY migration_id")).rows;
    const tables = (await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name='work_order_drawings'")).rows;
    const columns = tables.length === 1 ? (await client.query("SELECT column_name,data_type,is_nullable,column_default FROM information_schema.columns WHERE table_schema='public' AND table_name='work_order_drawings' ORDER BY ordinal_position")).rows : [];
    const policies = tables.length === 1 ? (await client.query("SELECT policyname,cmd FROM pg_policies WHERE schemaname='public' AND tablename='work_order_drawings' ORDER BY policyname")).rows : [];
    const rls = tables.length === 1 ? (await client.query("SELECT relrowsecurity,relforcerowsecurity FROM pg_class WHERE oid='public.work_order_drawings'::regclass")).rows[0] : null;
    const rows = tables.length === 1 ? Number((await client.query("SELECT count(*)::integer count FROM public.work_order_drawings")).rows[0].count) : null;
    await client.query("COMMIT");
    return { ledger, tables, columns, policies, rls, rows };
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
  assert.ok(["preflight", "apply", "repair-acl", "audit"].includes(mode), "unsupported-mode");
  assert.ok(url, "database-url-missing");
  assert.ok(["development", "test"].includes(runtime), "dev-test-runtime-required");
  assert.equal(prefix, "wafl-fn", "test-prefix-mismatch");
  assert.match(expected ?? "", /^[0-9a-f]{12}$/i, "approved-fingerprint-missing");
  assert.equal(fingerprint(url), expected, "target-fingerprint-mismatch");
  if (mode === "apply" || mode === "repair-acl") assert.equal(process.env.WAFL_V2_ALPHA73_DRAWING_MIGRATION_APPROVED, approval, "migration-approval-missing");
  const source = await fs.readFile(path.resolve("db/v2/migrations", file), "utf8");
  const migrationSha256 = sha256(source);
  const files = (await fs.readdir(path.resolve("db/v2/migrations"))).filter((name) => /^\d{3}_.*\.sql$/.test(name)).sort();
  assert.equal(files.at(-1), file, "migration-order-invalid");
  assert.doesNotMatch(
    source.replace(/^\s*--.*$/gm, ""),
    /\b(?:DROP|TRUNCATE|DELETE\s+FROM|UPDATE\s+\w+\s+SET)\b/i,
    "destructive-sql-forbidden",
  );
  assert.match(source, /CREATE TABLE public\.work_order_drawings/i);
  assert.match(source, /entity_version integer NOT NULL DEFAULT 1/i);
  assert.match(source, /scene_json jsonb NOT NULL/i);
  const client = new Client({ connectionString: url, application_name: `wafl-v2-alpha73-drawing-${mode}`, statement_timeout: 120000 });
  await client.connect();
  try {
    const before = await snapshot(client);
    assert.equal(before.ledger[0]?.database_fingerprint, expected, "ledger-fingerprint-mismatch");
    if (mode === "preflight") {
      assert.equal(before.ledger.length, 21, "ledger-must-be-21-before-022");
      assert.equal(before.tables.length, 0, "migration-022-already-present");
      await write({ result: "ALPHA73_MIGRATION_022_READ_ONLY_PREFLIGHT_PASS", migrationSha256, ledgerBefore: 21, databaseMutation: false, productionMutation: false, ownerMutation: false });
      console.log("ALPHA73_MIGRATION_022_READ_ONLY_PREFLIGHT_PASS"); return;
    }
    if (mode === "audit") {
      assert.equal(before.ledger.length, 22, "ledger-must-be-22-after-022");
      assert.equal(before.ledger[21]?.filename, file);
      assert.equal(before.ledger[21]?.migration_sha256, migrationSha256);
      assert.equal(before.tables.length, 1);
      assert.equal(before.rls?.relrowsecurity, true);
      assert.equal(before.rls?.relforcerowsecurity, true);
      assert.equal(before.policies.length, 2);
      const privilege = await client.query("SELECT has_table_privilege('wafl_v2_tenant_runtime','public.work_order_drawings','SELECT,INSERT,UPDATE') ready");
      assert.equal(privilege.rows[0]?.ready, true, "drawing-runtime-acl-missing");
      await write({ result: "ALPHA73_MIGRATION_022_READ_ONLY_AUDIT_PASS", migrationSha256, ledgerAfter: 22, drawingRows: before.rows, runtimeAcl: true, databaseMutation: false, productionMutation: false, ownerMutation: false });
      console.log("ALPHA73_MIGRATION_022_READ_ONLY_AUDIT_PASS"); return;
    }
    if (mode === "repair-acl") {
      const oldMigrationSha256 = "b7d6ef3c141ee32d484afe210d577b7e07543b9fa12ae1929967e8f55ba64e47";
      assert.equal(before.ledger.length, 22, "ledger-must-be-22-for-acl-repair");
      assert.equal(before.ledger[21]?.migration_sha256, oldMigrationSha256, "unexpected-migration-022-checksum");
      assert.equal(before.tables.length, 1, "drawing-table-missing");
      assert.equal(before.rows, 0, "drawing-table-must-be-empty-before-acl-repair");
      await client.query("BEGIN");
      try {
        await client.query("GRANT SELECT, INSERT, UPDATE ON TABLE public.work_order_drawings TO wafl_v2_tenant_runtime");
        const ledger = await client.query("UPDATE public.wafl_v2_migration_ledger SET migration_sha256=$1 WHERE migration_id=22 AND migration_sha256=$2 RETURNING migration_id", [migrationSha256, oldMigrationSha256]);
        assert.equal(ledger.rowCount, 1, "migration-022-ledger-repair-row-count");
        await client.query("COMMIT");
      } catch (error) { await client.query("ROLLBACK"); throw error; }
      const after = await snapshot(client);
      assert.equal(after.ledger[21]?.migration_sha256, migrationSha256, "migration-022-repaired-checksum-mismatch");
      await write({ result: "ALPHA73_MIGRATION_022_BOUNDED_ACL_REPAIR_PASS", migrationSha256, ledgerAfter: 22, drawingRows: after.rows, mutatedRows: 1, productionMutation: false, ownerMutation: false });
      console.log("ALPHA73_MIGRATION_022_BOUNDED_ACL_REPAIR_PASS"); return;
    }
    assert.equal(before.ledger.length, 21, "ledger-must-be-21-before-apply");
    assert.equal(before.tables.length, 0, "migration-022-already-present");
    await client.query("BEGIN");
    try {
      await client.query("SELECT set_config('wafl.runtime_environment',$1,true),set_config('wafl.migration_execution_approved',$2,true)", [runtime, approval]);
      await client.query(executableBody(source));
      await client.query("INSERT INTO public.wafl_v2_migration_ledger(migration_id,filename,migration_sha256,runner_version,database_fingerprint,v1_baseline_fingerprint) VALUES(22,$1,$2,'alpha73-work-order-drawing-v1',$3,$4)", [file, migrationSha256, expected, before.ledger[0].v1_baseline_fingerprint]);
      await client.query("COMMIT");
    } catch (error) { await client.query("ROLLBACK"); throw error; }
    const after = await snapshot(client);
    assert.equal(after.ledger.length, 22);
    assert.equal(after.rows, 0, "migration-must-not-create-drawing-rows");
    assert.equal(after.rls?.relrowsecurity, true);
    assert.equal(after.rls?.relforcerowsecurity, true);
    await write({ result: "ALPHA73_MIGRATION_022_APPLY_PASS", migrationSha256, ledgerBefore: 21, ledgerAfter: 22, drawingRows: 0, databaseMutation: true, businessMutation: false, productionMutation: false, ownerMutation: false });
    console.log("ALPHA73_MIGRATION_022_APPLY_PASS");
  } finally { await client.end(); }
}

main().catch((error) => { console.error("WAFL v2 alpha.73 drawing migration runner: FAILED", { name: error instanceof Error ? error.name : "UnknownError", message: error instanceof Error ? error.message : "unknown" }); process.exitCode = 1; });
