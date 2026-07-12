#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const { Client } = pg;
const VERSION = "2.0.0-alpha.27";
const REQUIRED_PREFIX = "wafl-fn";
const REQUIRED_CONFIRMATION = "VERIFY WAFL V2 ALPHA27 REVISION ISSUE PREFLIGHT";
const ALLOWED_RUNTIMES = new Set(["development", "dev", "local", "test", "demo"]);
const COMPANY_A = "wafl-fn-company-a";
const COMPANY_B = "wafl-fn-company-b";
const COMPANY_C = "wafl-fn-company-c";
const COMPANY_H = "wafl-fn-company-h";
const EXPECTED_MIGRATIONS = [
  "001_v2_tenant_document_number_foundation.sql",
  "002_v2_work_orders_revisions.sql",
  "003_v2_revision_content.sql",
  "004_v2_assets_revision_linkage.sql",
  "005_v2_documents_access_events.sql",
  "006_v2_deferred_constraints_indexes.sql",
  "007_v2_work_order_list_material_lookup_index.sql",
  "008_v2_tenant_document_number_settings_function.sql",
];

function fail(message) { throw new Error(message); }
function sha256(value) { return crypto.createHash("sha256").update(value).digest("hex"); }

function assertGuard() {
  const runtime = String(process.env.WAFL_V2_RUNTIME ?? "").trim().toLowerCase();
  const connectionString = process.env.DATABASE_URL;
  const approvedFingerprint = String(process.env.WAFL_V2_APPROVED_DB_FINGERPRINT ?? "").trim().toLowerCase();
  if (!ALLOWED_RUNTIMES.has(runtime)) fail("runtime-not-dev-test");
  if (!connectionString) fail("database-url-missing");
  if (String(process.env.WAFL_V2_TEST_PREFIX ?? "").trim() !== REQUIRED_PREFIX) fail("fixture-prefix-mismatch");
  if (process.env.WAFL_V2_READ_APPROVED !== "1" || process.env.WAFL_V2_READ_API_ENABLED !== "1") fail("read-api-guard-missing");
  if (process.env.WAFL_V2_COMMAND_API_ENABLED !== "1") fail("command-api-disabled");
  if (process.env.WAFL_V2_CONFIRMATION !== REQUIRED_CONFIRMATION) fail("confirmation-mismatch");
  if (process.env.WAFL_V2_COMMAND_MUTATION_APPROVED) fail("mutation-approval-must-be-absent");
  const parsed = new URL(connectionString);
  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
  if (!new Set(["postgres:", "postgresql:"]).has(parsed.protocol) || !parsed.hostname || !databaseName) fail("database-url-invalid");
  const fingerprint = sha256(`${parsed.hostname}/${databaseName}`).slice(0, 12);
  if (!approvedFingerprint || approvedFingerprint !== fingerprint) fail("db-fingerprint-mismatch");
  return { connectionString, fingerprint };
}

function sessionSecret() {
  const value = process.env.WAFL_SESSION_SECRET?.trim() || process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  if (!value) fail("session-secret-missing");
  return value;
}

function createSessionCookie(companyId) {
  const payload = {
    userId: `alpha27-preflight-${companyId}`,
    companyId,
    companyMemberId: `alpha27-preflight-member-${companyId}`,
    companyName: "WAFL synthetic preflight company",
    role: "company_admin",
    email: `alpha27-preflight-${companyId}@example.invalid`,
    name: "WAFL alpha27 preflight",
    issuedAt: new Date().toISOString(),
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = crypto.createHmac("sha256", sessionSecret()).update(encoded).digest("base64url");
  return `wafl_auth_session=${encoded}.${signature}`;
}

async function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") return server.close(() => reject(new Error("free-port-unavailable")));
      server.close(() => resolve(address.port));
    });
  });
}

async function waitForServer(baseUrl, child, timeoutMs = 60_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (child.exitCode !== null) fail(`next-server-exited:${child.exitCode}`);
    try {
      const response = await fetch(`${baseUrl}/api/v2/work-orders?limit=1`, { redirect: "manual" });
      if (response.status === 401) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  fail("next-server-start-timeout");
}

async function requestJson(baseUrl, routePath, companyId) {
  const response = await fetch(`${baseUrl}${routePath}`, {
    headers: companyId ? { Cookie: createSessionCookie(companyId) } : {},
    redirect: "manual",
  });
  const body = await response.json();
  return { response, body };
}

async function readPreflight(client) {
  await client.query("BEGIN READ ONLY");
  try {
    const ledger = await client.query("SELECT filename FROM wafl_v2_migration_ledger ORDER BY filename");
    assert.deepEqual(ledger.rows.map((row) => row.filename), EXPECTED_MIGRATIONS);
    const privileges = await client.query(`
      SELECT has_table_privilege('wafl_v2_tenant_runtime', 'company_settings', 'SELECT') AS company_settings_select,
             has_function_privilege('wafl_v2_tenant_runtime', 'allocate_work_order_document_sequence(text,date)', 'EXECUTE') AS allocator_execute,
             has_function_privilege('wafl_v2_tenant_runtime', 'wafl_v2_document_number_settings()', 'EXECUTE') AS settings_execute
    `);
    assert.equal(privileges.rows[0]?.company_settings_select, false, "tenant runtime must not directly read company_settings");
    assert.equal(privileges.rows[0]?.allocator_execute, true, "tenant runtime must execute atomic number allocator");
    assert.equal(privileges.rows[0]?.settings_execute, true, "tenant runtime must execute the bounded number settings function");
    const target = await client.query(`
      SELECT w.id, w.current_revision_id, w.entity_version AS work_order_version,
             r.entity_version AS revision_version, r.revision_no,
             w.product_name, w.product_type_code, w.season_code, w.item_code,
             w.due_date, w.total_quantity, w.document_number_base,
             COALESCE(NULLIF(cs.document_number_prefix, ''), NULLIF(cs.company_code, '')) AS company_code,
             COALESCE(NULLIF(cs.business_timezone, ''), 'Asia/Seoul') AS business_timezone,
             count(m.id) FILTER (WHERE m.material_type = 'fabric')::integer AS fabric_count,
             count(m.id) FILTER (WHERE m.material_type = 'accessory')::integer AS accessory_count
      FROM work_orders w
      JOIN work_order_revisions r ON r.company_id = w.company_id AND r.id = w.current_revision_id
      JOIN company_settings cs ON cs.company_id = w.company_id
      LEFT JOIN work_order_material_lines m ON m.company_id = w.company_id AND m.revision_id = r.id
      WHERE w.company_id = $1 AND w.status = 'draft' AND r.revision_status = 'draft'
        AND w.document_number_base IS NULL
        AND EXISTS (
          SELECT 1 FROM domain_events e
          WHERE e.company_id = w.company_id AND e.entity_type = 'work_order'
            AND e.entity_id = w.id::text AND e.command_code = 'work_order.create_draft'
        )
      GROUP BY w.id, r.id, cs.document_number_prefix, cs.company_code, cs.business_timezone
      HAVING count(m.id) FILTER (WHERE m.material_type = 'fabric') >= 1
         AND count(m.id) FILTER (WHERE m.material_type = 'accessory') >= 1
      ORDER BY w.created_at DESC, w.id DESC
      LIMIT 1
    `, [COMPANY_A]);
    const row = target.rows[0];
    if (!row) fail("issuable-alpha25-retained-target-missing");
    for (const [field, value] of Object.entries({
      product_name: row.product_name,
      product_type_code: row.product_type_code,
      season_code: row.season_code,
      item_code: row.item_code,
      due_date: row.due_date,
      company_code: row.company_code,
    })) assert.ok(String(value ?? "").trim(), `issue-precondition-missing:${field}`);
    assert.ok(Number(row.total_quantity) > 0, "issue-precondition-missing:total_quantity");
    const counts = await client.query(`
      SELECT (SELECT count(*)::integer FROM work_orders) AS work_orders,
             (SELECT count(*)::integer FROM work_order_revisions) AS revisions,
             (SELECT count(*)::integer FROM work_order_command_receipts) AS receipts,
             (SELECT count(*)::integer FROM domain_events) AS events,
             (SELECT count(*)::integer FROM document_number_sequences) AS sequence_rows
    `);
    await client.query("COMMIT");
    return { target: row, counts: counts.rows[0] };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function run() {
  const guard = assertGuard();
  const client = new Client({ connectionString: guard.connectionString });
  await client.connect();
  let child;
  try {
    const before = await readPreflight(client);
    const port = await getFreePort();
    const baseUrl = `http://127.0.0.1:${port}`;
    child = spawn(process.execPath, [path.join("node_modules", "next", "dist", "bin", "next"), "start", "-H", "127.0.0.1", "-p", String(port)], {
      cwd: process.cwd(), env: { ...process.env, PORT: String(port) }, stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
    });
    await waitForServer(baseUrl, child);
    const detailPath = `/api/v2/work-orders/${before.target.id}`;
    const detailA = await requestJson(baseUrl, detailPath, COMPANY_A);
    assert.equal(detailA.response.status, 200);
    assert.ok(detailA.body?.data?.header, "detail response must include the canonical data.header DTO");
    assert.equal(detailA.body.data.header.id, before.target.id);
    for (const companyId of [COMPANY_B, COMPANY_H]) {
      const cross = await requestJson(baseUrl, detailPath, companyId);
      assert.equal(cross.response.status, 404);
      assert.equal(cross.body?.error?.code, "NOT_FOUND");
    }
    const blocked = await requestJson(baseUrl, "/api/v2/work-orders?limit=1", COMPANY_C);
    assert.equal(blocked.response.status, 403);
    assert.equal(blocked.body?.error?.code, "FORBIDDEN");
    for (const lazy of ["materials?type=fabric&limit=5", "materials?type=accessory&limit=5", "history?limit=5", "documents?limit=5"]) {
      const result = await requestJson(baseUrl, `${detailPath}/${lazy}`, COMPANY_A);
      assert.equal(result.response.status, 200, `lazy read failed: ${lazy}`);
    }
    const after = await readPreflight(client);
    assert.deepEqual(after.counts, before.counts, "preflight must not mutate database counts");
    assert.equal(after.target.id, before.target.id, "preflight target must remain stable");

    console.log(`WAFL v2 ${VERSION} revision issue preflight`);
    console.log(`Target fingerprint: ${guard.fingerprint}`);
    console.log("Migration ledger: 8/8");
    console.log(`Issue target: safe-${sha256(before.target.id).slice(0, 12)} / R${before.target.revision_no}`);
    console.log(`Expected versions: WorkOrder ${before.target.work_order_version}; revision ${before.target.revision_version}`);
    console.log(`Materials: fabric ${before.target.fabric_count}; accessory ${before.target.accessory_count}`);
    console.log("Document number currently allocated: false");
    console.log("Company C pre-mutation FORBIDDEN: PASS");
    console.log("Company B/H cross-company Read: NOT_FOUND");
    console.log("Alpha.23-26 Read regression: PASS");
    console.log("Valid issue Command sent: false");
    console.log("DB schema mutation: false");
    console.log("Dev/Test DB test-data mutation: false");
    console.log("Production/business/R2/Worker/PDF access or mutation: false");
    console.log("Result: PASS");
  } finally {
    if (child && child.exitCode === null) child.kill();
    await client.end().catch(() => {});
  }
}

run().catch((error) => {
  console.error("WAFL_V2_ALPHA27_PREFLIGHT_FAILED", {
    errorName: error instanceof Error ? error.name : "UnknownError",
    errorCode: typeof error === "object" && error !== null && "code" in error ? String(error.code) : "UNKNOWN",
    assertion: error instanceof Error ? error.message.slice(0, 160) : "unknown",
    runnerLocation: String(error?.stack ?? "").match(/run-wafl-v2-alpha27-revision-issue-preflight\.mjs:(\d+):(\d+)/)?.[0] ?? "unknown",
  });
  process.exitCode = 1;
});
