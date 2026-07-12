#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const { Client } = pg;
const VERSION = "2.0.0-alpha.25";
const REQUIRED_PREFIX = "wafl-fn";
const REQUIRED_CONFIRMATION = "VERIFY WAFL V2 ALPHA25 COMMAND PREFLIGHT";
const ALLOWED_RUNTIMES = new Set(["development", "dev", "local", "test", "demo"]);
const COMPANY_A = "wafl-fn-company-a";
const COMPANY_C = "wafl-fn-company-c";

function fail(message) {
  throw new Error(message);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function databaseIdentity(connectionString) {
  const parsed = new URL(connectionString);
  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
  if (!new Set(["postgres:", "postgresql:"]).has(parsed.protocol) || !parsed.hostname || !databaseName) {
    fail("database-url-invalid");
  }
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
    userId: `alpha25-preflight-${companyId}`,
    companyId,
    companyMemberId: `alpha25-preflight-member-${companyId}`,
    companyName: "WAFL synthetic preflight company",
    role: "company_admin",
    email: `alpha25-preflight-${companyId}@example.invalid`,
    name: "WAFL alpha25 preflight",
    issuedAt: new Date().toISOString(),
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = crypto.createHmac("sha256", sessionSecret()).update(encoded).digest("base64url");
  return `wafl_auth_session=${encoded}.${signature}`;
}

function postgresUuidFromMd5(value) {
  return crypto.createHash("md5").update(value).digest("hex").replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, "$1-$2-$3-$4-$5");
}

function seededWorkOrderId(companyId, profileKey, sequence = 1) {
  const seedKey = `2.0.0-alpha.22:${profileKey}:${companyId}`;
  return postgresUuidFromMd5(`${seedKey}:wo:${sequence}`);
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

async function snapshotDatabase(client) {
  await client.query("BEGIN READ ONLY");
  try {
    const rows = await client.query(`
      SELECT
        (SELECT count(*)::integer FROM wafl_v2_migration_ledger) AS ledger_count,
        (SELECT count(*)::integer FROM work_orders) AS work_order_count,
        (SELECT count(*)::integer FROM work_order_revisions) AS revision_count,
        (SELECT count(*)::integer FROM work_order_command_receipts) AS receipt_count,
        (SELECT count(*)::integer FROM domain_events) AS event_count
    `);
    const schema = await client.query(`
      SELECT md5(string_agg(identity, '|' ORDER BY identity)) AS fingerprint
      FROM (
        SELECT table_name || ':' || column_name || ':' || data_type || ':' || is_nullable AS identity
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name IN ('work_orders','work_order_revisions','work_order_command_receipts','domain_events')
      ) schema_rows
    `);
    await client.query("COMMIT");
    return { ...rows.rows[0], schema_fingerprint: schema.rows[0]?.fingerprint ?? null };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function requestJson(baseUrl, routePath, options = {}) {
  const headers = { ...(options.companyId ? { Cookie: createSessionCookie(options.companyId) } : {}), ...(options.headers ?? {}) };
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

async function run() {
  const guard = assertGuard();
  const client = new Client({ connectionString: guard.connectionString });
  await client.connect();
  let child;
  try {
    const before = await snapshotDatabase(client);
    assert.equal(Number(before.ledger_count), 7, "approved migration ledger must remain 7/7");

    const port = await getFreePort();
    const baseUrl = `http://127.0.0.1:${port}`;
    child = spawn(process.execPath, [path.join("node_modules", "next", "dist", "bin", "next"), "start", "-H", "127.0.0.1", "-p", String(port)], {
      cwd: process.cwd(),
      env: { ...process.env, PORT: String(port) },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    await waitForServer(baseUrl, child);

    assertTypedError(await requestJson(baseUrl, "/api/v2/work-orders", {
      method: "POST",
      body: "{}",
      headers: { "Content-Type": "application/json" },
    }), 401, "AUTH_REQUIRED");

    assertTypedError(await requestJson(baseUrl, "/api/v2/work-orders", {
      companyId: COMPANY_A,
      method: "POST",
      body: "{",
      headers: { "Content-Type": "application/json" },
    }), 400, "VALIDATION_ERROR");

    assertTypedError(await requestJson(baseUrl, "/api/v2/work-orders", {
      companyId: COMPANY_A,
      method: "POST",
      body: JSON.stringify({ clientRequestId: "alpha25-missing-key", productName: "검증 전용" }),
      headers: { "Content-Type": "application/json" },
    }), 400, "VALIDATION_ERROR");

    assertTypedError(await requestJson(baseUrl, "/api/v2/work-orders", {
      companyId: COMPANY_A,
      method: "POST",
      body: JSON.stringify({ clientRequestId: "alpha25-spoof", productName: "검증 전용", companyId: COMPANY_C }),
      headers: { "Content-Type": "application/json", "Idempotency-Key": "alpha25-spoof-key" },
    }), 400, "VALIDATION_ERROR");

    const existingAId = seededWorkOrderId(COMPANY_A, "a500");
    assertTypedError(await requestJson(baseUrl, `/api/v2/work-orders/${existingAId}`, {
      companyId: COMPANY_A,
      method: "PATCH",
      body: JSON.stringify({ clientRequestId: "alpha25-missing-version", patch: { memo: "검증 전용" } }),
      headers: { "Content-Type": "application/json" },
    }), 400, "VALIDATION_ERROR");

    assertTypedError(await requestJson(baseUrl, `/api/v2/work-orders/${existingAId}`, {
      companyId: COMPANY_A,
      method: "PATCH",
      body: JSON.stringify({ clientRequestId: "alpha25-revision-spoof", expectedVersion: 1, revisionId: existingAId, patch: { memo: "검증 전용" } }),
      headers: { "Content-Type": "application/json" },
    }), 400, "VALIDATION_ERROR");

    assertTypedError(await requestJson(baseUrl, "/api/v2/work-orders", {
      companyId: COMPANY_C,
      method: "POST",
      body: "{}",
      headers: { "Content-Type": "application/json" },
    }), 403, "FORBIDDEN");

    const list = await requestJson(baseUrl, "/api/v2/work-orders?limit=1", { companyId: COMPANY_A });
    assert.equal(list.response.status, 200);
    assert.equal(list.body?.ok, true);
    const detail = await requestJson(baseUrl, `/api/v2/work-orders/${existingAId}`, { companyId: COMPANY_A });
    assert.equal(detail.response.status, 200);
    assert.equal(detail.body?.ok, true);
    const history = await requestJson(baseUrl, `/api/v2/work-orders/${existingAId}/history?limit=1`, { companyId: COMPANY_A });
    assert.equal(history.response.status, 200);
    assert.equal(history.body?.ok, true);

    const after = await snapshotDatabase(client);
    assert.deepEqual(after, before, "read-only preflight must not change schema or rows");

    console.log(`WAFL v2 alpha.25 Command preflight: version=${VERSION}`);
    console.log(`Dev/test target fingerprint: ${guard.fingerprint}`);
    console.log("Valid create/PATCH request sent: false");
    console.log("Company C pre-mutation FORBIDDEN: PASS");
    console.log("Alpha.23/24 Read API regression: PASS");
    console.log("Migration ledger: 7/7 unchanged");
    console.log("DB migration applied: false");
    console.log("DB schema mutation: false");
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
  console.error("WAFL v2 alpha.25 Command preflight failed", {
    errorName: error instanceof Error ? error.name : "UnknownError",
    errorCode: error instanceof Error ? error.message.split(":", 1)[0] : "UNKNOWN",
  });
  process.exitCode = 1;
});
