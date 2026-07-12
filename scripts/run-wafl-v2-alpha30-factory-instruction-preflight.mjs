#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import process from "node:process";
import pg from "pg";

const { Client } = pg;
const REQUIRED_FINGERPRINT = "01e5dcc7fea3";
const REQUIRED_PREFIX = "wafl-fn";
const REQUIRED_CONFIRMATION = "VERIFY WAFL V2 ALPHA30 FACTORY INSTRUCTION RUNTIME PREFLIGHT";
const COMPANY_A = "wafl-fn-company-a";
const TARGET_ITEM_CODE = "A30FACT";
const TARGET_CLIENT_REQUEST_ID = "alpha30-factory-instruction-create-v1";
const MIGRATION_FILE = "009_v2_workorder_factory_instruction_fields.sql";
const MIGRATION_SHA = "bb2f505eecbad87246360d42f5bdcd24b20f4b9f056a4df6afe5346e673f3af9";

const sha256 = (value) => crypto.createHash("sha256").update(String(value)).digest("hex");
function databaseFingerprint(connectionString) {
  const parsed = new URL(connectionString);
  return sha256(`${parsed.hostname}/${decodeURIComponent(parsed.pathname.replace(/^\/+/, ""))}`).slice(0, 12);
}

const databaseUrl = process.env.DATABASE_URL;
assert.ok(databaseUrl, "database-url-missing");
assert.equal(process.env.WAFL_V2_RUNTIME, "test", "dev-test-runtime-required");
assert.equal(process.env.WAFL_V2_TEST_PREFIX, REQUIRED_PREFIX, "fixture-prefix-mismatch");
assert.equal(process.env.WAFL_V2_APPROVED_DB_FINGERPRINT, REQUIRED_FINGERPRINT, "approved-fingerprint-mismatch");
assert.equal(databaseFingerprint(databaseUrl), REQUIRED_FINGERPRINT, "target-fingerprint-mismatch");
assert.equal(process.env.WAFL_V2_CONFIRMATION, REQUIRED_CONFIRMATION, "confirmation-mismatch");
assert.ok(!process.env.WAFL_V2_COMMAND_MUTATION_APPROVED, "command-approval-must-be-absent");
assert.ok(!process.env.WAFL_V2_ALPHA30_FIXTURE_APPROVED, "fixture-approval-must-be-absent");

const client = new Client({
  connectionString: databaseUrl,
  application_name: "wafl-v2-alpha30-factory-instruction-preflight",
});

await client.connect();
try {
  await client.query("BEGIN READ ONLY");
  const identity = (await client.query("SELECT current_user,r.rolsuper FROM pg_roles r WHERE r.rolname=current_user")).rows[0];
  assert.equal(identity?.rolsuper, false, "superuser-forbidden");

  const ledger = (await client.query(`
    SELECT migration_id,filename,migration_sha256
    FROM public.wafl_v2_migration_ledger
    ORDER BY migration_id`)).rows;
  assert.equal(ledger.length, 9, "ledger-must-be-9");
  assert.deepEqual(ledger.map((row) => Number(row.migration_id)), [1,2,3,4,5,6,7,8,9]);
  assert.equal(ledger[8].filename, MIGRATION_FILE);
  assert.equal(ledger[8].migration_sha256, MIGRATION_SHA);

  const columns = (await client.query(`
    SELECT table_name,column_name,data_type,is_nullable
    FROM information_schema.columns
    WHERE table_schema='public'
      AND (table_name,column_name) IN (
        ('work_order_material_lines','usage_area'),
        ('work_order_processes','application_area'),
        ('work_order_processes','application_color_target'),
        ('work_order_revisions','factory_delivery_memo')
      )
    ORDER BY table_name,column_name`)).rows;
  assert.equal(columns.length, 4, "alpha30-columns-missing");
  for (const column of columns) {
    assert.equal(column.data_type, "text");
    assert.equal(column.is_nullable, "YES");
  }

  const target = (await client.query(`
    SELECT count(*)::integer AS target_count,
           count(*) FILTER (WHERE document_number_base IS NOT NULL)::integer AS numbered_count
    FROM public.work_orders
    WHERE company_id=$1 AND item_code=$2 AND deleted_at IS NULL`, [COMPANY_A, TARGET_ITEM_CODE])).rows[0];
  assert.equal(Number(target.target_count), 0, "alpha30-synthetic-target-already-exists");
  assert.equal(Number(target.numbered_count), 0, "alpha30-document-number-already-issued");

  const receipts = (await client.query(`
    SELECT count(*)::integer AS receipt_count
    FROM public.work_order_command_receipts r
    JOIN public.work_orders w
      ON w.company_id=r.company_id AND w.id=r.work_order_id
    WHERE r.company_id=$1 AND w.item_code=$2`, [COMPANY_A, TARGET_ITEM_CODE])).rows[0];
  const events = (await client.query(`
    SELECT count(*)::integer AS event_count
    FROM public.domain_events
    WHERE company_id=$1
      AND metadata->>'clientRequestId'=$2`, [COMPANY_A, TARGET_CLIENT_REQUEST_ID])).rows[0];
  assert.equal(Number(receipts.receipt_count), 0, "alpha30-runtime-receipt-already-exists");
  assert.equal(Number(events.event_count), 0, "alpha30-runtime-event-already-exists");

  const processContract = (await client.query(`
    SELECT column_name,is_nullable,column_default
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='work_order_processes'
      AND column_name IN ('company_id','revision_id','process_type_code','process_name_snapshot','quantity','unit_code','unit_price','amount','status','display_order','entity_version')
    ORDER BY column_name`)).rows;
  assert.equal(processContract.length, 11, "process-fixture-schema-mismatch");
  for (const required of ["company_id","revision_id","process_type_code","process_name_snapshot","quantity","unit_code","unit_price","amount","status","display_order","entity_version"]) {
    assert.ok(processContract.some((column) => column.column_name === required), `missing-process-column:${required}`);
  }

  await client.query("COMMIT");
  console.log("ALPHA30 FACTORY INSTRUCTION READ-ONLY PREFLIGHT: PASS");
  console.log(`Target fingerprint: ${REQUIRED_FINGERPRINT}`);
  console.log("Migration ledger: 9/9; migration 009 filename/SHA PASS");
  console.log("New nullable columns: 4/4");
  console.log(`Synthetic target criterion: Company A + itemCode ${TARGET_ITEM_CODE}; existing rows 0`);
  console.log("Document number issued: false");
  console.log("Runtime receipts/events: 0/0");
  console.log("Process fixture canonical required columns: 11/11");
  console.log("Valid Command sent: false");
  console.log("DB write: false");
  console.log("Production/R2/Worker/PDF access: false");
} catch (error) {
  try { await client.query("ROLLBACK"); } catch {}
  throw error;
} finally {
  await client.end();
}
