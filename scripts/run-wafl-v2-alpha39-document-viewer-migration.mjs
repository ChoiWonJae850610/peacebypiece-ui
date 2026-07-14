#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const { Client } = pg;
const MODE = process.argv[2] ?? "preflight";
const FILE = "011_v2_document_access_viewer_functions.sql";
const REQUIRED_FINGERPRINT = "01e5dcc7fea3";
const APPROVAL = "2.0.0-alpha.39-dev-test-reviewed";
const CONFIRMATION = MODE === "apply"
  ? "EXECUTE WAFL V2 ALPHA39 MIGRATION 011"
  : "VERIFY WAFL V2 ALPHA39 MIGRATION 011 PREFLIGHT";

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const MANIFEST_PATH = path.resolve(".tmp/wafl-v2-alpha39/migration-manifest.json");

async function writeManifest(value) {
  await fs.mkdir(path.dirname(MANIFEST_PATH), { recursive: true });
  await fs.writeFile(MANIFEST_PATH, `${JSON.stringify({
    appVersion: "2.0.0-alpha.38",
    targetVersion: "2.0.0-alpha.39",
    targetFingerprint: REQUIRED_FINGERPRINT,
    migrationFile: FILE,
    ...value,
  }, null, 2)}\n`, "utf8");
}

function databaseFingerprint(databaseUrl) {
  const parsed = new URL(databaseUrl);
  return sha256(`${parsed.hostname}/${decodeURIComponent(parsed.pathname.replace(/^\/+/, ""))}`).slice(0, 12);
}

function guard() {
  assert.ok(new Set(["preflight", "apply", "audit"]).has(MODE), "unsupported-mode");
  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, "database-url-missing");
  assert.ok(new Set(["development", "test"]).has(process.env.WAFL_V2_RUNTIME), "dev-test-runtime-required");
  assert.equal(process.env.WAFL_V2_TEST_PREFIX, "wafl-fn", "test-prefix-mismatch");
  assert.equal(databaseFingerprint(databaseUrl), REQUIRED_FINGERPRINT, "target-fingerprint-mismatch");
  assert.equal(process.env.WAFL_V2_APPROVED_DB_FINGERPRINT, REQUIRED_FINGERPRINT, "approved-fingerprint-mismatch");
  assert.equal(process.env.WAFL_V2_CONFIRMATION, CONFIRMATION, "confirmation-mismatch");
  if (MODE === "apply") assert.equal(process.env.WAFL_V2_ALPHA39_MIGRATION_APPROVED, APPROVAL, "migration-approval-missing");
  else assert.ok(!process.env.WAFL_V2_ALPHA39_MIGRATION_APPROVED, "read-only-mode-approval-forbidden");
  return databaseUrl;
}

async function ledger(client) {
  return (await client.query(`
    SELECT migration_id, filename, migration_sha256, database_fingerprint, v1_baseline_fingerprint
    FROM public.wafl_v2_migration_ledger ORDER BY migration_id
  `)).rows;
}

async function functionState(client) {
  return (await client.query(`
    SELECT proc.proname, proc.prosecdef, proc.provolatile,
           pg_catalog.pg_get_userbyid(proc.proowner) AS owner,
           owner_role.rolbypassrls,
           proc.proconfig,
           pg_catalog.pg_get_function_identity_arguments(proc.oid) AS arguments,
           pg_catalog.has_function_privilege('public', proc.oid, 'EXECUTE') AS public_execute,
           pg_catalog.has_function_privilege('wafl_v2_tenant_runtime', proc.oid, 'EXECUTE') AS runtime_execute
    FROM pg_catalog.pg_proc proc
    JOIN pg_catalog.pg_namespace namespace ON namespace.oid = proc.pronamespace
    JOIN pg_catalog.pg_roles owner_role ON owner_role.oid = proc.proowner
    WHERE namespace.nspname = 'public'
      AND proc.proname IN ('wafl_v2_redeem_document_access_token','wafl_v2_read_document_access_session')
    ORDER BY proc.proname
  `)).rows;
}

async function rowState(client) {
  return (await client.query(`
    SELECT
      (SELECT count(*)::integer FROM public.document_access_tokens) AS tokens,
      (SELECT count(*)::integer FROM public.generated_documents) AS documents,
      (SELECT count(*)::integer FROM public.domain_events) AS events,
      (SELECT count(*)::integer FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r') AS tables,
      (SELECT count(*)::integer FROM pg_catalog.pg_indexes WHERE schemaname='public') AS indexes
  `)).rows[0];
}

async function snapshot(client) {
  await client.query("BEGIN READ ONLY");
  try {
    const result = { ledger: await ledger(client), functions: await functionState(client), rows: await rowState(client) };
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

function migrationBody(source) {
  return source.replace(/^\uFEFF/, "").replace(/^\s*BEGIN;\s*/i, "").replace(/\s*COMMIT;\s*$/i, "");
}

function assertFunctions(rows) {
  assert.equal(rows.length, 2, "viewer-function-count-mismatch");
  for (const row of rows) {
    assert.equal(row.prosecdef, true, `${row.proname}-security-definer-required`);
    assert.equal(row.rolbypassrls, true, `${row.proname}-owner-bypassrls-required`);
    assert.ok(row.proconfig?.includes("search_path=pg_catalog, public"), `${row.proname}-search-path-invalid`);
    assert.equal(row.public_execute, false, `${row.proname}-public-execute-forbidden`);
    assert.equal(row.runtime_execute, true, `${row.proname}-runtime-execute-required`);
  }
}

async function main() {
  const databaseUrl = guard();
  const migrationPath = path.resolve("db/v2/migrations", FILE);
  const source = await fs.readFile(migrationPath, "utf8");
  const migrationSha = sha256(source);
  assert.doesNotMatch(source, /\b(?:ALTER\s+TABLE|CREATE\s+(?:TABLE|INDEX)|DROP|TRUNCATE|DELETE)\b/i, "schema-or-destructive-sql-forbidden");
  assert.doesNotMatch(source, /\bEXECUTE\s+format\s*\(/i, "dynamic-sql-forbidden");
  const manifest = (await fs.readdir(path.resolve("db/v2/migrations"))).filter((name) => /^\d{3}_.*\.sql$/.test(name)).sort();
  assert.equal(manifest.at(-1), FILE, "migration-manifest-order-invalid");

  const client = new Client({ connectionString: databaseUrl, application_name: `wafl-v2-alpha39-viewer-${MODE}`, statement_timeout: 120_000 });
  await client.connect();
  try {
    const identity = (await client.query("SELECT current_user, rolsuper, rolbypassrls FROM pg_catalog.pg_roles WHERE rolname=current_user")).rows[0];
    assert.equal(identity.rolsuper, false, "superuser-forbidden");
    assert.equal(identity.rolbypassrls, true, "migration-owner-bypassrls-required");
    const before = await snapshot(client);
    assert.equal(new Set(before.ledger.map((row) => row.database_fingerprint)).size, 1, "ledger-fingerprint-inconsistent");
    assert.equal(before.ledger[0]?.database_fingerprint, REQUIRED_FINGERPRINT, "ledger-fingerprint-mismatch");

    if (MODE === "preflight") {
      assert.equal(before.ledger.length, 10, "ledger-must-be-10-before-011");
      assert.deepEqual(before.ledger.map((row) => row.filename), manifest.slice(0, -1), "ledger-manifest-mismatch");
      assert.equal(before.functions.length, 0, "viewer-functions-already-exist");
      await writeManifest({
        result: "ALPHA39_MIGRATION_011_READ_ONLY_PREFLIGHT_PASS",
        migrationSha256: migrationSha,
        ledgerBefore: 10,
        ledgerAfter: 10,
        migrationApplied: false,
        functionCount: 0,
        databaseMutation: false,
        r2Mutation: false,
        productionMutation: false,
      });
      console.log("ALPHA39_MIGRATION_011_READ_ONLY_PREFLIGHT_PASS");
      console.log(`Target fingerprint: ${REQUIRED_FINGERPRINT}`);
      console.log("Ledger: 10/10; migration 011 unapplied");
      console.log(`Migration SHA-256: ${migrationSha}`);
      console.log("Expected mutation: functions +2, grants, ledger +1; table/column/index/data/R2/production 0");
      return;
    }

    if (MODE === "audit") {
      assert.equal(before.ledger.length, 11, "ledger-must-be-11-after-011");
      assert.equal(before.ledger[10].filename, FILE);
      assert.equal(before.ledger[10].migration_sha256, migrationSha);
      assertFunctions(before.functions);
      await writeManifest({
        result: "ALPHA39_MIGRATION_011_READ_ONLY_AUDIT_PASS",
        migrationSha256: migrationSha,
        ledgerBefore: 10,
        ledgerAfter: 11,
        migrationApplied: true,
        functionCount: 2,
        existingDataRowDelta: 0,
        r2Mutation: false,
        productionMutation: false,
      });
      console.log("ALPHA39_MIGRATION_011_READ_ONLY_AUDIT_PASS");
      console.log("Ledger: 11/11; functions 2; PUBLIC execute 0; runtime execute 2");
      return;
    }

    assert.equal(before.ledger.length, 10, "ledger-must-be-10-before-apply");
    assert.equal(before.functions.length, 0, "viewer-functions-already-exist");
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
        ) VALUES (11, $1, $2, 'alpha39-document-viewer-functions-v1', $3, $4)
      `, [FILE, migrationSha, REQUIRED_FINGERPRINT, before.ledger[0].v1_baseline_fingerprint]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
    const after = await snapshot(client);
    assert.equal(after.ledger.length, 11);
    assert.equal(after.ledger[10].filename, FILE);
    assert.equal(after.ledger[10].migration_sha256, migrationSha);
    assertFunctions(after.functions);
    assert.deepEqual(after.rows, before.rows, "unexpected-schema-or-data-row-delta");
    await writeManifest({
      result: "ALPHA39_MIGRATION_011_APPLY_PASS",
      migrationSha256: migrationSha,
      ledgerBefore: 10,
      ledgerAfter: 11,
      migrationApplied: true,
      functionCount: 2,
      existingDataRowDelta: 0,
      r2Mutation: false,
      productionMutation: false,
    });
    console.log("ALPHA39_MIGRATION_011_APPLY_PASS");
    console.log("Ledger: 10/10 -> 11/11");
    console.log("Functions: 2; PUBLIC execute 0; runtime execute 2");
    console.log("Table/column/index/data/R2/production mutation: false");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("WAFL v2 alpha.39 migration runner: FAILED", {
    name: error instanceof Error ? error.name : "UnknownError",
    message: error instanceof Error ? error.message : "unknown",
  });
  process.exitCode = 1;
});
