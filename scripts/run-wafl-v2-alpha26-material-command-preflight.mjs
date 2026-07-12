#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const { Client } = pg;
const VERSION = "2.0.0-alpha.26";
const REQUIRED_PREFIX = "wafl-fn";
const REQUIRED_CONFIRMATION = "VERIFY WAFL V2 ALPHA26 MATERIAL COMMAND PREFLIGHT";
const ALLOWED_RUNTIMES = new Set(["development", "dev", "local", "test", "demo"]);
const COMPANY_A = "wafl-fn-company-a";
const COMPANY_C = "wafl-fn-company-c";

function fail(message) { throw new Error(message); }
function sha256(value) { return crypto.createHash("sha256").update(value).digest("hex"); }

function databaseIdentity(connectionString) {
  const parsed = new URL(connectionString);
  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
  if (!new Set(["postgres:", "postgresql:"]).has(parsed.protocol) || !parsed.hostname || !databaseName) fail("database-url-invalid");
  return { fingerprint: sha256(`${parsed.hostname}/${databaseName}`).slice(0, 12) };
}

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
  const identity = databaseIdentity(connectionString);
  if (!approvedFingerprint || approvedFingerprint !== identity.fingerprint) fail("db-fingerprint-mismatch");
  return { connectionString, fingerprint: identity.fingerprint };
}

function sessionSecret() {
  const value = process.env.WAFL_SESSION_SECRET?.trim() || process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  if (!value) fail("session-secret-missing");
  return value;
}

function createSessionCookie(companyId) {
  const payload = {
    userId: `alpha26-preflight-${companyId}`,
    companyId,
    companyMemberId: `alpha26-preflight-member-${companyId}`,
    companyName: "WAFL synthetic preflight company",
    role: "company_admin",
    email: `alpha26-preflight-${companyId}@example.invalid`,
    name: "WAFL alpha26 preflight",
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
      if (response.status === 403) fail(`next-server-runtime-guard-blocked:${response.status}`);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("next-server-")) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  fail("next-server-start-timeout");
}

async function readSnapshot(client) {
  await client.query("BEGIN READ ONLY");
  try {
    const counts = await client.query(`
      SELECT
        (SELECT count(*)::integer FROM wafl_v2_migration_ledger) AS ledger_count,
        (SELECT count(*)::integer FROM work_orders) AS work_order_count,
        (SELECT count(*)::integer FROM work_order_revisions) AS revision_count,
        (SELECT count(*)::integer FROM work_order_material_lines WHERE material_type = 'fabric') AS fabric_count,
        (SELECT count(*)::integer FROM work_order_material_lines WHERE material_type = 'accessory') AS accessory_count,
        (SELECT count(*)::integer FROM work_order_command_receipts) AS receipt_count,
        (SELECT count(*)::integer FROM domain_events) AS event_count
    `);
    const schema = await client.query(`
      SELECT md5(string_agg(identity, '|' ORDER BY identity)) AS fingerprint
      FROM (
        SELECT table_name || ':' || column_name || ':' || data_type || ':' || is_nullable AS identity
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name IN ('work_orders','work_order_revisions','work_order_material_lines','work_order_command_receipts','domain_events')
      ) schema_rows
    `);
    await client.query("COMMIT");
    return { ...counts.rows[0], schema_fingerprint: schema.rows[0]?.fingerprint ?? null };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function readPreflightTarget(client) {
  await client.query("BEGIN READ ONLY");
  try {
    const target = await client.query(`
      SELECT w.id, w.current_revision_id, w.entity_version, r.revision_no,
             EXISTS (
               SELECT 1 FROM partners p
               WHERE p.company_id = w.company_id AND COALESCE(p.is_active, true) = true
             ) AS supplier_available
      FROM work_orders w
      JOIN work_order_revisions r
        ON r.company_id = w.company_id AND r.id = w.current_revision_id
      WHERE w.company_id = $1 AND w.status = 'draft' AND r.revision_status = 'draft'
        AND EXISTS (
          SELECT 1 FROM domain_events e
          WHERE e.company_id = w.company_id AND e.entity_type = 'work_order'
            AND e.entity_id = w.id::text AND e.command_code = 'work_order.create_draft'
        )
      ORDER BY w.created_at DESC, w.id DESC
      LIMIT 1
    `, [COMPANY_A]);
    const finalized = await client.query(`
      SELECT count(*)::integer AS count
      FROM work_orders w
      JOIN work_order_revisions r ON r.company_id = w.company_id AND r.id = w.current_revision_id
      WHERE w.company_id = $1 AND r.revision_status = 'finalized'
    `, [COMPANY_A]);
    await client.query("COMMIT");
    const row = target.rows[0];
    if (!row) fail("alpha25-retained-draft-target-missing");
    if (!row.supplier_available) fail("company-a-supplier-fixture-missing");
    if (Number(finalized.rows[0]?.count ?? 0) < 1) fail("finalized-revision-fixture-missing");
    return row;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function requestJson(baseUrl, routePath, options = {}) {
  const headers = {
    ...(options.companyId ? { Cookie: createSessionCookie(options.companyId) } : {}),
    ...(options.headers ?? {}),
  };
  const response = await fetch(`${baseUrl}${routePath}`, {
    method: options.method ?? "GET",
    headers,
    ...(Object.prototype.hasOwnProperty.call(options, "body") ? { body: options.body } : {}),
    redirect: "manual",
  });
  const text = await response.text();
  let body;
  try { body = JSON.parse(text); } catch { fail(`invalid-json-response:${response.status}`); }
  return { response, body };
}

function assertTypedError(result, status, code) {
  assert.equal(result.response.status, status);
  assert.equal(result.body?.ok, false);
  assert.equal(result.body?.error?.code, code);
  assert.equal(typeof result.body?.error?.message, "string");
  assert.equal(typeof result.body?.error?.correlationId, "string");
}

function validMaterialBody(version) {
  return {
    clientRequestId: "alpha26-preflight-material",
    expectedVersion: Number(version),
    materialType: "fabric",
    name: "검증 전용 원단",
    requiredQuantity: "10.000",
    allowanceQuantity: "1.000",
    inventoryUsageQuantity: "0",
    orderQuantity: "11.000",
    unitCode: "yd",
    unitPrice: "1000.00",
  };
}

async function run() {
  const guard = assertGuard();
  const client = new Client({ connectionString: guard.connectionString });
  await client.connect();
  let child;
  try {
    const before = await readSnapshot(client);
    assert.equal(Number(before.ledger_count), 7, "approved migration ledger must remain 7/7");
    const target = await readPreflightTarget(client);
    const materialPath = `/api/v2/work-orders/${target.id}/materials`;

    const port = await getFreePort();
    const baseUrl = `http://127.0.0.1:${port}`;
    child = spawn(process.execPath, [path.join("node_modules", "next", "dist", "bin", "next"), "start", "-H", "127.0.0.1", "-p", String(port)], {
      cwd: process.cwd(), env: { ...process.env, PORT: String(port) },
      stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
    });
    await waitForServer(baseUrl, child);

    assertTypedError(await requestJson(baseUrl, materialPath, {
      method: "POST", body: "{}", headers: { "Content-Type": "application/json" },
    }), 401, "AUTH_REQUIRED");
    assertTypedError(await requestJson(baseUrl, materialPath, {
      companyId: COMPANY_A, method: "POST", body: "{", headers: { "Content-Type": "application/json" },
    }), 400, "VALIDATION_ERROR");
    assertTypedError(await requestJson(baseUrl, materialPath, {
      companyId: COMPANY_A, method: "POST", body: JSON.stringify(validMaterialBody(target.entity_version)),
      headers: { "Content-Type": "application/json" },
    }), 400, "VALIDATION_ERROR");
    assertTypedError(await requestJson(baseUrl, materialPath, {
      companyId: COMPANY_A, method: "POST",
      body: JSON.stringify({ ...validMaterialBody(target.entity_version), expectedVersion: undefined }),
      headers: { "Content-Type": "application/json", "Idempotency-Key": "alpha26-preflight-key" },
    }), 400, "VALIDATION_ERROR");
    for (const invalid of [
      { materialType: "trim" },
      { requiredQuantity: "-1" },
      { unitCode: "" },
      { unitPrice: "NaN" },
      { companyId: COMPANY_C },
    ]) {
      assertTypedError(await requestJson(baseUrl, materialPath, {
        companyId: COMPANY_A, method: "POST",
        body: JSON.stringify({ ...validMaterialBody(target.entity_version), ...invalid }),
        headers: { "Content-Type": "application/json", "Idempotency-Key": `alpha26-invalid-${Object.keys(invalid)[0]}` },
      }), 400, "VALIDATION_ERROR");
    }
    assertTypedError(await requestJson(baseUrl, `${materialPath}/00000000-0000-0000-0000-000000000000`, {
      companyId: COMPANY_A, method: "PATCH",
      body: JSON.stringify({ clientRequestId: "alpha26-direct-status", expectedVersion: target.entity_version, patch: { status: "completed" } }),
      headers: { "Content-Type": "application/json" },
    }), 400, "VALIDATION_ERROR");
    assertTypedError(await requestJson(baseUrl, materialPath, {
      companyId: COMPANY_C, method: "POST", body: "{}", headers: { "Content-Type": "application/json" },
    }), 403, "FORBIDDEN");

    assert.equal((await requestJson(baseUrl, "/api/v2/work-orders?limit=1", { companyId: COMPANY_A })).response.status, 200);
    assert.equal((await requestJson(baseUrl, `/api/v2/work-orders/${target.id}`, { companyId: COMPANY_A })).response.status, 200);
    assert.equal((await requestJson(baseUrl, `${materialPath}?type=fabric&limit=3`, { companyId: COMPANY_A })).response.status, 200);
    assert.equal((await requestJson(baseUrl, `${materialPath}?type=accessory&limit=3`, { companyId: COMPANY_A })).response.status, 200);
    assert.equal((await requestJson(baseUrl, `/api/v2/work-orders/${target.id}/history?limit=3`, { companyId: COMPANY_A })).response.status, 200);

    assertTypedError(await requestJson(baseUrl, "/api/v2/work-orders", {
      companyId: COMPANY_A, method: "POST", body: JSON.stringify({ clientRequestId: "alpha26-alpha25-create-regression", productName: "검증" }),
      headers: { "Content-Type": "application/json" },
    }), 400, "VALIDATION_ERROR");
    assertTypedError(await requestJson(baseUrl, `/api/v2/work-orders/${target.id}`, {
      companyId: COMPANY_A, method: "PATCH", body: JSON.stringify({ clientRequestId: "alpha26-alpha25-patch-regression", patch: { memo: "검증" } }),
      headers: { "Content-Type": "application/json" },
    }), 400, "VALIDATION_ERROR");

    const after = await readSnapshot(client);
    assert.deepEqual(after, before, "read-only preflight must not change schema or rows");

    console.log(`WAFL v2 alpha.26 Material Command preflight: version=${VERSION}`);
    console.log(`Dev/test target fingerprint: ${guard.fingerprint}`);
    console.log("Target: Company A retained alpha.25 synthetic WorkOrder/R0 current draft");
    console.log("Supplier fixture: Company A tenant-scoped partner available");
    console.log("Valid material create/PATCH/order transition sent: false");
    console.log("DELETE/deactivate implemented: false; schema has no material-line soft-delete lifecycle");
    console.log("Company C pre-mutation FORBIDDEN: PASS");
    console.log("Finalized revision fixture read-only precondition: PASS");
    console.log("Alpha.23/24/25 Read and invalid-command regression: PASS");
    console.log("Planned retained delta: WorkOrder +0; revision +0; fabric +2; accessory +1; receipt +9; event +11; version transitions +11");
    console.log("Planned successful commands: create 3; patch 2; delete 0; order request 3; order cancel base 1; order complete base 1; cancel-vs-complete race winner 1");
    console.log("Race branch accounting: cancel or complete receives the single additional winner; combined delta remains exact");
    console.log("Cleanup/reset/rollback: NOT_RUN by policy");
    console.log("Migration ledger: 7/7 unchanged");
    console.log("DB migration/schema/index mutation: false");
    console.log("Dev/Test DB test-data mutation: false");
    console.log("Business/R2/Worker/PDF mutation: false");
    console.log("Production access/mutation: false");
    console.log("Result: PASS");
  } finally {
    if (child && child.exitCode === null) {
      child.kill();
      await new Promise((resolve) => child.once("exit", resolve));
    }
    await client.end();
  }
}

run().catch((error) => {
  console.error("WAFL v2 alpha.26 Material Command preflight failed", {
    errorName: error instanceof Error ? error.name : "UnknownError",
    errorCode: error instanceof Error ? error.message.split(":", 1)[0] : "UNKNOWN",
  });
  process.exitCode = 1;
});
