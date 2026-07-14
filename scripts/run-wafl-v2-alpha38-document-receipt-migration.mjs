#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const { Client } = pg;
const MODE = process.argv[2] ?? "preflight";
const FILE = "010_v2_generated_document_receipt_link.sql";
const REQUIRED_FINGERPRINT = "01e5dcc7fea3";
const APPROVAL = "2.0.0-alpha.38-dev-test-reviewed";
const CONFIRMATION = MODE === "apply"
  ? "APPLY WAFL V2 ALPHA38 GENERATED DOCUMENT RECEIPT LINK"
  : "VERIFY WAFL V2 ALPHA38 GENERATED DOCUMENT RECEIPT PREFLIGHT";

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const migrationBody = (source) => source
  .replace(/^\s*BEGIN\s*;/i, "")
  .replace(/COMMIT\s*;\s*$/i, "")
  .trim();

function guard() {
  assert.ok(new Set(["preflight", "apply"]).has(MODE), "unsupported-mode");
  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, "database-url-missing");
  const parsed = new URL(databaseUrl);
  const fingerprint = sha256(`${parsed.hostname}/${decodeURIComponent(parsed.pathname.replace(/^\/+/, ""))}`).slice(0, 12);
  assert.equal(fingerprint, REQUIRED_FINGERPRINT, "target-fingerprint-mismatch");
  assert.equal(process.env.WAFL_V2_APPROVED_DB_FINGERPRINT, REQUIRED_FINGERPRINT, "approved-fingerprint-mismatch");
  assert.equal(process.env.WAFL_V2_TEST_PREFIX, "wafl-fn", "test-prefix-mismatch");
  assert.ok(new Set(["development", "test"]).has(process.env.WAFL_V2_RUNTIME ?? ""), "dev-test-runtime-required");
  assert.equal(process.env.WAFL_V2_CONFIRMATION, CONFIRMATION, "confirmation-mismatch");
  if (MODE === "apply") {
    assert.equal(process.env.WAFL_V2_ALPHA38_MIGRATION_APPROVED, APPROVAL, "migration-approval-missing");
  } else {
    assert.ok(!process.env.WAFL_V2_ALPHA38_MIGRATION_APPROVED, "preflight-mutation-approval-forbidden");
  }
  return { databaseUrl, fingerprint };
}

async function ledger(client) {
  return (await client.query(`
    SELECT migration_id, filename, migration_sha256, database_fingerprint, v1_baseline_fingerprint
    FROM public.wafl_v2_migration_ledger
    ORDER BY migration_id
  `)).rows;
}

async function schemaState(client) {
  const column = (await client.query(`
    SELECT data_type, is_nullable, udt_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'work_order_command_receipts'
      AND column_name = 'result_generated_document_id'
  `)).rows[0] ?? null;
  const constraint = (await client.query(`
    SELECT c.conname, c.convalidated, pg_get_constraintdef(c.oid, true) AS definition
    FROM pg_constraint c
    WHERE c.conrelid = 'public.work_order_command_receipts'::regclass
      AND c.conname = 'work_order_command_receipts_generated_document_company_fk'
  `)).rows[0] ?? null;
  const types = (await client.query(`
    SELECT
      (SELECT data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='generated_documents' AND column_name='id') AS document_id_type,
      (SELECT column_default FROM information_schema.columns WHERE table_schema='public' AND table_name='generated_documents' AND column_name='id') AS document_id_default,
      (SELECT data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='work_order_command_receipts' AND column_name='company_id') AS receipt_company_type
  `)).rows[0];
  return { column, constraint, types };
}

async function rowState(client) {
  return (await client.query(`
    SELECT
      (SELECT count(*)::integer FROM public.work_orders) AS work_orders,
      (SELECT count(*)::integer FROM public.work_order_revisions) AS revisions,
      (SELECT count(*)::integer FROM public.work_order_command_receipts) AS receipts,
      (SELECT count(*)::integer FROM public.generated_documents) AS generated_documents,
      (SELECT count(*)::integer FROM public.domain_events) AS domain_events
  `)).rows[0];
}

async function readOnlySnapshot(client) {
  await client.query("BEGIN READ ONLY");
  try {
    const result = {
      ledger: await ledger(client),
      schema: await schemaState(client),
      rows: await rowState(client),
    };
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function main() {
  const target = guard();
  const migrationPath = path.resolve("db/v2/migrations", FILE);
  const source = await fs.readFile(migrationPath, "utf8");
  const migrationSha = sha256(source);
  assert.doesNotMatch(source, /^\s*(?:DROP|TRUNCATE|DELETE|UPDATE)\b/im, "destructive-or-backfill-sql-forbidden");
  const manifest = (await fs.readdir(path.resolve("db/v2/migrations")))
    .filter((name) => /^\d{3}_.*\.sql$/.test(name))
    .sort();
  assert.equal(manifest.at(-1), FILE, "migration-manifest-order-invalid");

  const client = new Client({
    connectionString: target.databaseUrl,
    application_name: `wafl-v2-alpha38-receipt-link-${MODE}`,
    statement_timeout: 120_000,
  });
  await client.connect();
  try {
    const identity = (await client.query("SELECT current_user, r.rolsuper FROM pg_roles r WHERE r.rolname=current_user")).rows[0];
    assert.equal(identity.rolsuper, false, "superuser-forbidden");
    const before = await readOnlySnapshot(client);
    assert.equal(before.ledger.length, 9, "ledger-must-be-9-before-010");
    assert.deepEqual(before.ledger.map((row) => Number(row.migration_id)), [1,2,3,4,5,6,7,8,9]);
    assert.deepEqual(before.ledger.map((row) => row.filename), manifest.slice(0, -1), "ledger-manifest-mismatch");
    assert.equal(new Set(before.ledger.map((row) => row.database_fingerprint)).size, 1);
    assert.equal(before.ledger[0].database_fingerprint, target.fingerprint);
    assert.equal(before.schema.column, null, "receipt-link-column-already-present");
    assert.equal(before.schema.constraint, null, "receipt-link-constraint-already-present");
    assert.equal(before.schema.types.document_id_type, "uuid");
    assert.match(before.schema.types.document_id_default ?? "", /gen_random_uuid\(\)/);
    assert.equal(before.schema.types.receipt_company_type, "text");

    if (MODE === "preflight") {
      console.log("WAFL v2 alpha.38 migration 010 preflight: PASS");
      console.log(`Target fingerprint: ${target.fingerprint}`);
      console.log("Ledger: 9/9; migration 010 unapplied");
      console.log(`Migration SHA-256: ${migrationSha}`);
      console.log("Expected schema mutation: native uuid column +1, tenant-safe composite FK +1, ledger +1");
      console.log("Expected business/R2/Worker/PDF/production mutation: false");
      return;
    }

    await client.query("BEGIN");
    try {
      await client.query(
        "SELECT set_config('wafl.runtime_environment',$1,true), set_config('wafl.migration_execution_approved',$2,true)",
        [process.env.WAFL_V2_RUNTIME, APPROVAL],
      );
      await client.query(migrationBody(source));
      await client.query(`
        INSERT INTO public.wafl_v2_migration_ledger (
          migration_id, filename, migration_sha256, runner_version,
          database_fingerprint, v1_baseline_fingerprint
        ) VALUES (10, $1, $2, 'alpha38-generated-document-receipt-link-v1', $3, $4)
      `, [FILE, migrationSha, target.fingerprint, before.ledger[0].v1_baseline_fingerprint]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }

    const after = await readOnlySnapshot(client);
    assert.equal(after.ledger.length, 10);
    assert.equal(after.ledger[9].filename, FILE);
    assert.equal(after.ledger[9].migration_sha256, migrationSha);
    assert.equal(after.schema.column?.data_type, "uuid");
    assert.equal(after.schema.column?.udt_name, "uuid");
    assert.equal(after.schema.column?.is_nullable, "YES");
    assert.equal(after.schema.constraint?.convalidated, false);
    assert.match(after.schema.constraint?.definition ?? "", /FOREIGN KEY \(company_id, result_generated_document_id\).*generated_documents\(company_id, id\).*ON DELETE RESTRICT/i);
    assert.deepEqual(after.rows, before.rows, "business-row-count-mutated");
    const nonNull = (await client.query("SELECT count(*)::integer AS count FROM public.work_order_command_receipts WHERE result_generated_document_id IS NOT NULL")).rows[0];
    assert.equal(Number(nonNull.count), 0, "existing-receipts-mutated");
    console.log("ALPHA38_MIGRATION_010_APPLY_PASS");
    console.log(`Target fingerprint: ${target.fingerprint}`);
    console.log("Ledger: 9/9 -> 10/10");
    console.log("Column: result_generated_document_id uuid NULL; composite FK NOT VALID");
    console.log("Existing receipt non-null count: 0");
    console.log("Business/R2/Worker/PDF/production mutation: false");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("WAFL v2 alpha.38 migration runner: FAILED", {
    name: error instanceof Error ? error.name : "UnknownError",
    message: error instanceof Error ? error.message : "unknown",
  });
  process.exitCode = 1;
});
