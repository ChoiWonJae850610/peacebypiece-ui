#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const { Client } = pg;
const MODE = process.argv[2] ?? "preflight";
const FILE = "012_v2_document_access_token_purpose.sql";
const REQUIRED_FINGERPRINT = "01e5dcc7fea3";
const APPROVAL = "2.0.0-alpha.42-dev-test-reviewed";
const CONFIRMATION = MODE === "apply"
  ? "APPLY WAFL V2 ALPHA42 TOKEN PURPOSE MIGRATION 012"
  : "VERIFY WAFL V2 ALPHA42 TOKEN PURPOSE MIGRATION 012";
const MANIFEST_PATH = path.resolve(".tmp/wafl-v2-alpha42/migration-manifest.json");

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const migrationBody = (source) => source.replace(/^\uFEFF/, "").replace(/^\s*BEGIN\s*;/i, "").replace(/COMMIT\s*;\s*$/i, "").trim();

function fingerprint(databaseUrl) {
  const parsed = new URL(databaseUrl);
  return sha256(`${parsed.hostname}/${decodeURIComponent(parsed.pathname.replace(/^\/+/, ""))}`).slice(0, 12);
}

function guard() {
  assert.ok(new Set(["preflight", "apply", "audit"]).has(MODE), "unsupported-mode");
  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, "database-url-missing");
  assert.ok(new Set(["development", "test"]).has(process.env.WAFL_V2_RUNTIME), "dev-test-runtime-required");
  assert.equal(process.env.WAFL_V2_TEST_PREFIX, "wafl-fn", "test-prefix-mismatch");
  assert.equal(fingerprint(databaseUrl), REQUIRED_FINGERPRINT, "target-fingerprint-mismatch");
  assert.equal(process.env.WAFL_V2_APPROVED_DB_FINGERPRINT, REQUIRED_FINGERPRINT, "approved-fingerprint-mismatch");
  assert.equal(process.env.WAFL_V2_CONFIRMATION, CONFIRMATION, "confirmation-mismatch");
  if (MODE === "apply") assert.equal(process.env.WAFL_V2_ALPHA42_MIGRATION_APPROVED, APPROVAL, "migration-approval-missing");
  else assert.ok(!process.env.WAFL_V2_ALPHA42_MIGRATION_APPROVED, "read-only-mode-approval-forbidden");
  return databaseUrl;
}

async function ledger(client) {
  return (await client.query(`
    SELECT migration_id, filename, migration_sha256, database_fingerprint, v1_baseline_fingerprint
    FROM public.wafl_v2_migration_ledger ORDER BY migration_id
  `)).rows;
}

async function schemaState(client) {
  const column = (await client.query(`
    SELECT data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='document_access_tokens' AND column_name='token_purpose'
  `)).rows[0] ?? null;
  const constraint = (await client.query(`
    SELECT conname, convalidated, pg_catalog.pg_get_constraintdef(oid, true) AS definition
    FROM pg_catalog.pg_constraint
    WHERE conrelid='public.document_access_tokens'::regclass
      AND conname='document_access_tokens_token_purpose_check'
  `)).rows[0] ?? null;
  const index = (await client.query(`
    SELECT indexname, indexdef
    FROM pg_catalog.pg_indexes
    WHERE schemaname='public' AND tablename='document_access_tokens'
      AND indexname='document_access_tokens_one_embedded_qr_per_document_idx'
  `)).rows[0] ?? null;
  return { column, constraint, index };
}

async function rowState(client, hasPurpose) {
  const result = await client.query(`
    SELECT
      (SELECT count(*)::integer FROM public.document_access_tokens) AS tokens,
      (SELECT count(*)::integer FROM public.generated_documents) AS documents,
      (SELECT count(*)::integer FROM public.work_order_command_receipts) AS receipts,
      (SELECT count(*)::integer FROM public.domain_events) AS events,
      ${hasPurpose ? "(SELECT count(*)::integer FROM public.document_access_tokens WHERE token_purpose='manual_share')" : "NULL::integer"} AS manual_share,
      ${hasPurpose ? "(SELECT count(*)::integer FROM public.document_access_tokens WHERE token_purpose='embedded_qr')" : "NULL::integer"} AS embedded_qr
  `);
  return result.rows[0];
}

async function snapshot(client) {
  await client.query("BEGIN READ ONLY");
  try {
    const currentLedger = await ledger(client);
    const schema = await schemaState(client);
    const rows = await rowState(client, Boolean(schema.column));
    await client.query("COMMIT");
    return { ledger: currentLedger, schema, rows };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function writeManifest(value) {
  await fs.mkdir(path.dirname(MANIFEST_PATH), { recursive: true });
  await fs.writeFile(MANIFEST_PATH, `${JSON.stringify({
    appVersion: "2.0.0-alpha.41",
    targetVersion: "2.0.0-alpha.42",
    targetFingerprint: REQUIRED_FINGERPRINT,
    migrationFile: FILE,
    ...value,
  }, null, 2)}\n`, "utf8");
}

function assertAppliedSchema(schema) {
  assert.equal(schema.column?.data_type, "text", "token-purpose-type-invalid");
  assert.equal(schema.column?.is_nullable, "NO", "token-purpose-nullability-invalid");
  assert.match(schema.column?.column_default ?? "", /'manual_share'::text/, "token-purpose-default-invalid");
  assert.equal(schema.constraint?.convalidated, true, "token-purpose-check-not-validated");
  assert.match(schema.constraint?.definition ?? "", /manual_share.*embedded_qr/, "token-purpose-check-invalid");
  assert.match(schema.index?.indexdef ?? "", /UNIQUE.*\(company_id, generated_document_id\).*WHERE \(token_purpose = 'embedded_qr'::text\)/i, "embedded-qr-index-invalid");
}

async function main() {
  const databaseUrl = guard();
  const migrationPath = path.resolve("db/v2/migrations", FILE);
  const source = await fs.readFile(migrationPath, "utf8");
  const migrationSha = sha256(source);
  assert.doesNotMatch(source.replace(/^\s*--.*$/gm, ""), /\b(?:DROP|TRUNCATE|DELETE\s+FROM|UPDATE\s+public\.)\b/i, "destructive-or-backfill-sql-forbidden");
  assert.match(source, /ADD COLUMN token_purpose text NOT NULL DEFAULT 'manual_share'/);
  assert.match(source, /WHERE token_purpose = 'embedded_qr'/);
  const manifest = (await fs.readdir(path.resolve("db/v2/migrations"))).filter((name) => /^\d{3}_.*\.sql$/.test(name)).sort();
  assert.equal(manifest.at(-1), FILE, "migration-manifest-order-invalid");

  const client = new Client({ connectionString: databaseUrl, application_name: `wafl-v2-alpha42-token-purpose-${MODE}`, statement_timeout: 120_000 });
  await client.connect();
  try {
    const identity = (await client.query("SELECT current_user, rolsuper FROM pg_catalog.pg_roles WHERE rolname=current_user")).rows[0];
    assert.equal(identity.rolsuper, false, "superuser-forbidden");
    const before = await snapshot(client);
    assert.equal(new Set(before.ledger.map((row) => row.database_fingerprint)).size, 1, "ledger-fingerprint-inconsistent");
    assert.equal(before.ledger[0]?.database_fingerprint, REQUIRED_FINGERPRINT, "ledger-fingerprint-mismatch");

    if (MODE === "preflight") {
      assert.equal(before.ledger.length, 11, "ledger-must-be-11-before-012");
      assert.deepEqual(before.ledger.map((row) => row.filename), manifest.slice(0, -1), "ledger-manifest-mismatch");
      assert.deepEqual(before.schema, { column: null, constraint: null, index: null }, "migration-012-object-already-present");
      await writeManifest({ result: "ALPHA42_MIGRATION_012_READ_ONLY_PREFLIGHT_PASS", migrationSha256: migrationSha, ledgerBefore: 11, ledgerAfter: 11, tokenBaseline: Number(before.rows.tokens), migrationApplied: false, databaseMutation: false, r2Mutation: false, productionMutation: false });
      console.log("ALPHA42_MIGRATION_012_READ_ONLY_PREFLIGHT_PASS");
      console.log(`Target fingerprint: ${REQUIRED_FINGERPRINT}`);
      console.log(`Migration SHA-256: ${migrationSha}`);
      console.log(`Ledger: 11/11; existing token baseline: ${Number(before.rows.tokens)}`);
      console.log("Expected mutation: ledger +1, text NOT NULL column +1, CHECK +1, partial unique index +1; data/R2/production 0");
      return;
    }

    if (MODE === "audit") {
      assert.equal(before.ledger.length, 12, "ledger-must-be-12-after-012");
      assert.equal(before.ledger[11].filename, FILE);
      assert.equal(before.ledger[11].migration_sha256, migrationSha);
      assertAppliedSchema(before.schema);
      assert.equal(Number(before.rows.manual_share), Number(before.rows.tokens), "existing-token-purpose-not-manual-share");
      assert.equal(Number(before.rows.embedded_qr), 0, "embedded-token-must-not-exist-before-runtime");
      await writeManifest({ result: "ALPHA42_MIGRATION_012_READ_ONLY_AUDIT_PASS", migrationSha256: migrationSha, ledgerBefore: 11, ledgerAfter: 12, tokenBaseline: Number(before.rows.tokens), manualShareCount: Number(before.rows.manual_share), embeddedQrCount: 0, migrationApplied: true, r2Mutation: false, productionMutation: false });
      console.log("ALPHA42_MIGRATION_012_READ_ONLY_AUDIT_PASS");
      console.log(`Ledger: 12/12; manual_share/embedded_qr: ${Number(before.rows.manual_share)}/0`);
      return;
    }

    assert.equal(before.ledger.length, 11, "ledger-must-be-11-before-apply");
    assert.deepEqual(before.schema, { column: null, constraint: null, index: null }, "migration-012-object-already-present");
    await client.query("BEGIN");
    try {
      await client.query("SELECT set_config('wafl.runtime_environment',$1,true), set_config('wafl.migration_execution_approved',$2,true)", [process.env.WAFL_V2_RUNTIME, APPROVAL]);
      await client.query(migrationBody(source));
      await client.query(`
        INSERT INTO public.wafl_v2_migration_ledger (
          migration_id, filename, migration_sha256, runner_version,
          database_fingerprint, v1_baseline_fingerprint
        ) VALUES (12, $1, $2, 'alpha42-document-access-token-purpose-v1', $3, $4)
      `, [FILE, migrationSha, REQUIRED_FINGERPRINT, before.ledger[0].v1_baseline_fingerprint]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
    const after = await snapshot(client);
    assert.equal(after.ledger.length, 12);
    assert.equal(after.ledger[11].filename, FILE);
    assert.equal(after.ledger[11].migration_sha256, migrationSha);
    assertAppliedSchema(after.schema);
    assert.deepEqual({ documents: after.rows.documents, receipts: after.rows.receipts, events: after.rows.events, tokens: after.rows.tokens }, { documents: before.rows.documents, receipts: before.rows.receipts, events: before.rows.events, tokens: before.rows.tokens }, "existing-row-count-mutated");
    assert.equal(Number(after.rows.manual_share), Number(before.rows.tokens));
    assert.equal(Number(after.rows.embedded_qr), 0);
    await writeManifest({ result: "ALPHA42_MIGRATION_012_APPLY_PASS", migrationSha256: migrationSha, ledgerBefore: 11, ledgerAfter: 12, tokenBaseline: Number(before.rows.tokens), manualShareCount: Number(after.rows.manual_share), embeddedQrCount: 0, migrationApplied: true, r2Mutation: false, productionMutation: false });
    console.log("ALPHA42_MIGRATION_012_APPLY_PASS");
    console.log("Ledger: 11/11 -> 12/12; schema column/check/index: +1/+1/+1");
    console.log(`Existing tokens/manual_share: ${Number(after.rows.tokens)}/${Number(after.rows.manual_share)}; data/R2/production mutation 0`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("WAFL v2 alpha.42 migration runner: FAILED", { name: error instanceof Error ? error.name : "UnknownError", message: error instanceof Error ? error.message : "unknown" });
  process.exitCode = 1;
});
