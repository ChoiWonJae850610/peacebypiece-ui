#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import process from "node:process";
import pg from "pg";

const { Client } = pg;
const REQUIRED_CONFIRMATION = "APPLY WAFL V2 ALPHA27A SETTINGS FIXTURE";
const REQUIRED_PREFIX = "wafl-fn";
const EXPECTED_FINGERPRINT = "01e5dcc7fea3";
const MIGRATION_008_SHA = "11be99d82fdd49041320b796d2c54e4f463e1572431b3a925ed7e7be619d0d32";
const DOCUMENT_CODE = "WAFN";
const BUSINESS_TIMEZONE = "Asia/Seoul";
const COMPANY_A = "wafl-fn-company-a";
const COMPANY_B = "wafl-fn-company-b";
const COMPANY_C = "wafl-fn-company-c";
const COMPANY_H = "wafl-fn-company-h";
const TARGET_COMPANIES = [COMPANY_A, COMPANY_B, COMPANY_H];

function fail(message) { throw new Error(message); }
function sha256(value) { return crypto.createHash("sha256").update(value).digest("hex"); }
function safeCompany(companyId) { return `synthetic-${companyId.slice(-1).toUpperCase()}`; }

function guardTarget() {
  const runtime = String(process.env.WAFL_V2_RUNTIME ?? "").trim().toLowerCase();
  const connectionString = process.env.DATABASE_URL;
  if (!new Set(["development", "dev", "local", "test", "demo"]).has(runtime) || !connectionString) fail("approved-dev-test-target-required");
  if (String(process.env.WAFL_V2_TEST_PREFIX ?? "").trim() !== REQUIRED_PREFIX) fail("fixture-prefix-mismatch");
  if (process.env.WAFL_V2_SETTINGS_FIXTURE_APPROVED !== "1") fail("fixture-approval-missing");
  if (process.env.WAFL_V2_CONFIRMATION !== REQUIRED_CONFIRMATION) fail("confirmation-mismatch");
  const parsed = new URL(connectionString);
  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
  const fingerprint = sha256(`${parsed.hostname}/${databaseName}`).slice(0, 12);
  if (fingerprint !== EXPECTED_FINGERPRINT || process.env.WAFL_V2_APPROVED_DB_FINGERPRINT !== EXPECTED_FINGERPRINT) fail("target-fingerprint-mismatch");
  return { connectionString, fingerprint };
}

async function readState(client) {
  const result = await client.query(`
    SELECT
      (SELECT count(*)::integer FROM public.wafl_v2_migration_ledger) AS ledger_count,
      (SELECT count(*)::integer FROM public.wafl_v2_migration_ledger
       WHERE migration_id = 8 AND filename = '008_v2_tenant_document_number_settings_function.sql'
         AND migration_sha256 = $1) AS ledger_008_match,
      (SELECT count(*)::integer FROM public.company_settings) AS settings_total,
      (SELECT count(*)::integer FROM public.company_settings WHERE company_id = $2) AS company_a,
      (SELECT count(*)::integer FROM public.company_settings WHERE company_id = $3) AS company_b,
      (SELECT count(*)::integer FROM public.company_settings WHERE company_id = $4) AS company_h,
      (SELECT count(*)::integer FROM public.company_settings WHERE company_id = $5) AS company_c,
      (SELECT count(*)::integer FROM public.company_settings WHERE company_id <> ALL($6::text[])) AS unexpected,
      (SELECT count(*)::integer FROM (
         SELECT company_id FROM public.company_settings GROUP BY company_id HAVING count(*) > 1
       ) duplicate_rows) AS duplicates,
      (SELECT count(*)::integer FROM pg_catalog.pg_proc proc
       JOIN pg_catalog.pg_namespace namespace ON namespace.oid = proc.pronamespace
       WHERE namespace.nspname = 'public' AND proc.proname = 'wafl_v2_document_number_settings' AND proc.pronargs = 0) AS function_count,
      has_function_privilege('wafl_v2_tenant_runtime', 'public.wafl_v2_document_number_settings()', 'EXECUTE') AS runtime_execute,
      has_table_privilege('wafl_v2_tenant_runtime', 'public.company_settings', 'SELECT') AS direct_settings_select,
      (SELECT EXISTS (
         SELECT 1 FROM pg_catalog.aclexplode(COALESCE(proc.proacl, pg_catalog.acldefault('f', proc.proowner))) acl
         WHERE acl.grantee = 0 AND acl.privilege_type = 'EXECUTE'
       ) FROM pg_catalog.pg_proc proc
       JOIN pg_catalog.pg_namespace namespace ON namespace.oid = proc.pronamespace
       WHERE namespace.nspname = 'public' AND proc.proname = 'wafl_v2_document_number_settings' AND proc.pronargs = 0) AS public_execute,
      (SELECT pg_catalog.pg_get_function_result(proc.oid) FROM pg_catalog.pg_proc proc
       JOIN pg_catalog.pg_namespace namespace ON namespace.oid = proc.pronamespace
       WHERE namespace.nspname = 'public' AND proc.proname = 'wafl_v2_document_number_settings' AND proc.pronargs = 0) AS result_signature
  `, [MIGRATION_008_SHA, COMPANY_A, COMPANY_B, COMPANY_H, COMPANY_C, TARGET_COMPANIES]);
  return result.rows[0];
}

async function memberFor(client, companyId, approvedOnly = true) {
  const result = await client.query(`
    SELECT id FROM public.company_members
    WHERE company_id = $1 ${approvedOnly ? "AND status = 'approved'" : ""}
    ORDER BY created_at, id LIMIT 1
  `, [companyId]);
  return result.rows[0]?.id ?? `missing-member-${companyId.slice(-1)}`;
}

async function callSettings(client, companyId, memberId, includeClaims = true) {
  await client.query("BEGIN READ ONLY");
  try {
    await client.query("SET LOCAL ROLE wafl_v2_tenant_runtime");
    if (includeClaims) {
      await client.query(`
        SELECT set_config('wafl.company_id', $1, true),
               set_config('wafl.company_member_id', $2, true),
               set_config('wafl.access_mode', 'tenant_member', true)
      `, [companyId, memberId]);
    }
    const result = await client.query("SELECT document_code, business_timezone FROM public.wafl_v2_document_number_settings()");
    await client.query("COMMIT");
    return result.rows;
  } catch (error) { await client.query("ROLLBACK"); throw error; }
}

async function run() {
  const target = guardTarget();
  const client = new Client({ connectionString: target.connectionString, application_name: "wafl-v2-alpha27a-settings-fixture", statement_timeout: 120_000 });
  await client.connect();
  let transactionOpen = false;
  try {
    await client.query("BEGIN READ ONLY");
    const before = await readState(client);
    const companies = await client.query("SELECT id FROM public.companies WHERE id = ANY($1::text[]) ORDER BY id", [TARGET_COMPANIES]);
    await client.query("COMMIT");
    assert.equal(Number(before.ledger_count), 8, "ledger must be 8/8");
    assert.equal(Number(before.ledger_008_match), 1, "ledger 008 SHA/filename mismatch");
    assert.equal(Number(before.function_count), 1, "bounded settings function missing");
    assert.equal(before.runtime_execute, true);
    assert.equal(before.public_execute, false);
    assert.equal(before.direct_settings_select, false);
    assert.match(before.result_signature, /^TABLE\(document_code character varying, business_timezone text\)$/);
    assert.equal(Number(before.settings_total), 0, "existing settings row detected");
    assert.equal(companies.rows.length, 3, "target synthetic companies missing");

    console.log("WAFL v2 alpha.27a settings fixture dry-run");
    console.log(`Target fingerprint: ${target.fingerprint}`);
    for (const companyId of TARGET_COMPANIES) {
      console.log(`${safeCompany(companyId)}: documentCode=${DOCUMENT_CODE}; timezone=${BUSINESS_TIMEZONE}; currentRows=0`);
    }
    console.log("Planned INSERT rows: 3");
    console.log("Actual business data: false; approved synthetic dev/test fixture only");
    console.log("Production target: false");

    await client.query("BEGIN");
    transactionOpen = true;
    await client.query("LOCK TABLE public.company_settings IN SHARE ROW EXCLUSIVE MODE");
    const inside = await client.query("SELECT count(*)::integer AS count FROM public.company_settings WHERE company_id = ANY($1::text[])", [TARGET_COMPANIES]);
    if (Number(inside.rows[0]?.count) !== 0) fail("settings-row-appeared-before-insert");
    const inserted = await client.query(`
      INSERT INTO public.company_settings (company_id, document_number_prefix, business_timezone)
      VALUES ($1, $2, $3), ($4, $5, $6), ($7, $8, $9)
      RETURNING company_id
    `, [
      COMPANY_A, DOCUMENT_CODE, BUSINESS_TIMEZONE,
      COMPANY_B, DOCUMENT_CODE, BUSINESS_TIMEZONE,
      COMPANY_H, DOCUMENT_CODE, BUSINESS_TIMEZONE,
    ]);
    if (inserted.rowCount !== 3) fail(`fixture-insert-count:${inserted.rowCount}`);
    assert.deepEqual(inserted.rows.map((row) => row.company_id).sort(), [...TARGET_COMPANIES].sort());
    await client.query("COMMIT");
    transactionOpen = false;

    await client.query("BEGIN READ ONLY");
    const after = await readState(client);
    const members = {};
    for (const companyId of [...TARGET_COMPANIES, COMPANY_C]) members[companyId] = await memberFor(client, companyId, companyId !== COMPANY_C);
    await client.query("COMMIT");
    assert.equal(Number(after.settings_total), 3);
    assert.equal(Number(after.company_a), 1);
    assert.equal(Number(after.company_b), 1);
    assert.equal(Number(after.company_h), 1);
    assert.equal(Number(after.company_c), 0);
    assert.equal(Number(after.unexpected), 0);
    assert.equal(Number(after.duplicates), 0);
    assert.equal(after.direct_settings_select, false);
    assert.equal(after.public_execute, false);
    assert.match(after.result_signature, /^TABLE\(document_code character varying, business_timezone text\)$/);

    for (const companyId of TARGET_COMPANIES) {
      const rows = await callSettings(client, companyId, members[companyId]);
      assert.equal(rows.length, 1, `${safeCompany(companyId)} function row count`);
      assert.equal(rows[0].document_code, DOCUMENT_CODE);
      assert.equal(rows[0].business_timezone, BUSINESS_TIMEZONE);
    }
    for (const [companyId, foreignMemberCompany] of [
      [COMPANY_A, COMPANY_B], [COMPANY_B, COMPANY_H], [COMPANY_H, COMPANY_A],
    ]) {
      assert.equal((await callSettings(client, companyId, members[foreignMemberCompany])).length, 0, "cross-tenant claim exposed settings");
    }
    assert.equal((await callSettings(client, COMPANY_C, members[COMPANY_C])).length, 0, "Company C exposed settings");
    assert.equal((await callSettings(client, COMPANY_A, members[COMPANY_A], false)).length, 0, "missing claims exposed settings");

    console.log("ALPHA27A_SETTINGS_FIXTURE_PASS");
    console.log("Inserted settings rows: 3");
    console.log(`Company A/B/H: documentCode=${DOCUMENT_CODE}; timezone=${BUSINESS_TIMEZONE}; rows=1/1/1`);
    console.log("Company C rows/function result: 0/0");
    console.log("Cross-tenant function results: 0/0/0");
    console.log("Missing claims function result: 0");
    console.log("Direct company_settings SELECT: false");
    console.log("Migration ledger: 8/8");
    console.log("DB schema mutation this step: false");
    console.log("Dev/test fixture mutation: true; exactly 3 rows");
    console.log("Business/production/R2/Worker/PDF mutation: false");
    console.log("Issue Command runtime: NOT_RUN");
    console.log("Result: PASS");
  } catch (error) {
    if (transactionOpen) await client.query("ROLLBACK");
    throw error;
  } finally { await client.end(); }
}

run().catch((error) => {
  console.error("WAFL_V2_ALPHA27A_SETTINGS_FIXTURE_FAILED", {
    errorName: error instanceof Error ? error.name : "UnknownError",
    errorCode: typeof error === "object" && error !== null && "code" in error ? String(error.code) : "UNKNOWN",
    assertion: error instanceof Error ? error.message.slice(0, 180) : "unknown",
    committedMutationPossible: true,
  });
  process.exitCode = 1;
});
