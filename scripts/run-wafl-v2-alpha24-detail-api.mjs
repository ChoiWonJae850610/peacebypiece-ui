#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import { performance } from "node:perf_hooks";
import pg from "pg";

const { Client } = pg;
const VERSION = "2.0.0-alpha.24";
const SEED_VERSION = "2.0.0-alpha.22";
const REQUIRED_PREFIX = "wafl-fn";
const REQUIRED_CONFIRMATION = "VERIFY WAFL V2 ALPHA24 DETAIL API";
const ALLOWED_RUNTIMES = new Set(["development", "dev", "local", "test", "demo"]);
const COMPANY_FIXTURES = {
  a: { companyId: "wafl-fn-company-a", profileKey: "a500" },
  h: { companyId: "wafl-fn-company-h", profileKey: "b5000" },
  b: { companyId: "wafl-fn-company-b", profileKey: "c-b" },
  c: { companyId: "wafl-fn-company-c", profileKey: "c-c" },
};
const TAB_PATHS = [
  "materials?type=fabric",
  "materials?type=accessory",
  "size-color",
  "size-spec",
  "processes",
  "assets",
  "documents",
  "history",
];

function fail(message) {
  throw new Error(message);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function postgresUuidFromMd5(value) {
  return crypto.createHash("md5").update(value).digest("hex").replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, "$1-$2-$3-$4-$5");
}

function workOrderId(fixture, sequence = 1) {
  const seedKey = `${SEED_VERSION}:${fixture.profileKey}:${fixture.companyId}`;
  return postgresUuidFromMd5(`${seedKey}:wo:${sequence}`);
}

function percentile(values, ratio) {
  const ordered = [...values].sort((a, b) => a - b);
  if (!ordered.length) return 0;
  return ordered[Math.min(ordered.length - 1, Math.ceil(ordered.length * ratio) - 1)];
}

function metrics(values) {
  return {
    p50Ms: Number(percentile(values, 0.5).toFixed(2)),
    p95Ms: Number(percentile(values, 0.95).toFixed(2)),
    maxMs: Number(Math.max(...values).toFixed(2)),
  };
}

function databaseIdentity(connectionString) {
  const parsed = new URL(connectionString);
  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
  if (!new Set(["postgres:", "postgresql:"]).has(parsed.protocol) || !parsed.hostname || !databaseName) fail("database-url-invalid");
  return { databaseName, fingerprint: sha256(`${parsed.hostname}/${databaseName}`).slice(0, 12) };
}

function assertGuard() {
  const runtime = String(process.env.WAFL_V2_RUNTIME ?? "").trim().toLowerCase();
  const approvedFingerprint = String(process.env.WAFL_V2_APPROVED_DB_FINGERPRINT ?? "").trim().toLowerCase();
  const connectionString = process.env.DATABASE_URL;
  if (!ALLOWED_RUNTIMES.has(runtime)) fail("runtime-not-dev-test");
  if (!connectionString) fail("database-url-missing");
  if (String(process.env.WAFL_V2_TEST_PREFIX ?? "").trim() !== REQUIRED_PREFIX) fail("fixture-prefix-mismatch");
  if (process.env.WAFL_V2_READ_APPROVED !== "1") fail("read-approval-missing");
  if (process.env.WAFL_V2_CONFIRMATION !== REQUIRED_CONFIRMATION) fail("confirmation-mismatch");
  const identity = databaseIdentity(connectionString);
  if (!approvedFingerprint || approvedFingerprint !== identity.fingerprint) fail("db-fingerprint-mismatch");
  return { runtime, approvedFingerprint, connectionString, ...identity };
}

function sessionSecret() {
  const value = process.env.WAFL_SESSION_SECRET?.trim() || process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  if (!value) fail("session-secret-missing");
  return value;
}

function createSessionCookie(companyId) {
  const payload = {
    userId: `alpha24-reader-${companyId}`,
    companyId,
    companyMemberId: `alpha24-member-${companyId}`,
    companyName: "WAFL synthetic runtime company",
    role: "company_admin",
    email: `alpha24-${companyId}@example.invalid`,
    name: "WAFL alpha24 reader",
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

async function snapshotDatabase(client) {
  await client.query("BEGIN READ ONLY");
  try {
    const result = await client.query(`
      SELECT
        (SELECT count(*)::integer FROM wafl_v2_migration_ledger) AS ledger_count,
        (SELECT count(*)::integer FROM work_orders) AS work_order_count,
        (SELECT count(*)::integer FROM work_order_revisions) AS revision_count,
        (SELECT count(*)::integer FROM work_order_material_lines) AS material_count,
        (SELECT count(*)::integer FROM work_order_processes) AS process_count,
        (SELECT count(*)::integer FROM generated_documents) AS document_count,
        (SELECT count(*)::integer FROM domain_events) AS event_count
    `);
    const schema = await client.query(`
      SELECT md5(string_agg(identity, '|' ORDER BY identity)) AS fingerprint
      FROM (
        SELECT table_name || ':' || column_name || ':' || data_type || ':' || is_nullable AS identity
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name IN ('work_orders','work_order_revisions','work_order_material_lines','work_order_processes','work_order_images','generated_documents')
      ) schema_rows
    `);
    await client.query("COMMIT");
    return { ...result.rows[0], schema_fingerprint: schema.rows[0]?.fingerprint ?? null };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function requestJson(baseUrl, companyId, routePath, authenticated = true) {
  const startedAt = performance.now();
  const response = await fetch(`${baseUrl}${routePath}`, {
    headers: authenticated ? { Cookie: createSessionCookie(companyId) } : {},
  });
  const text = await response.text();
  const apiMs = performance.now() - startedAt;
  let body;
  try { body = JSON.parse(text); } catch { fail(`invalid-json-response:${response.status}`); }
  return {
    response, body, bytes: Buffer.byteLength(text), apiMs,
    statementCount: Number(response.headers.get("x-wafl-detail-statement-count") ?? "0"),
    dbMs: Number(response.headers.get("x-wafl-detail-db-ms") ?? "0"),
    transactionMs: Number(response.headers.get("x-wafl-detail-transaction-ms") ?? "0"),
  };
}

function assertTypedError(result, status, code) {
  assert.equal(result.response.status, status);
  assert.equal(result.body?.ok, false);
  assert.equal(result.body?.error?.code, code);
  assert.equal(typeof result.body?.error?.message, "string");
  assert.equal(typeof result.body?.error?.correlationId, "string");
}

function assertSafePayload(value) {
  const forbiddenKeys = new Set([
    "snapshot", "storageobjectkey", "thumbnailobjectkey", "rawtoken", "tokenhash",
    "signedurl", "metadata", "actormemberid", "systemactorid", "privilegedreason",
  ]);
  const visit = (current) => {
    if (Array.isArray(current)) return current.forEach(visit);
    if (!current || typeof current !== "object") return;
    for (const [key, child] of Object.entries(current)) {
      const normalized = key.replaceAll("_", "").replaceAll("-", "").toLowerCase();
      assert.equal(forbiddenKeys.has(normalized), false, `forbidden response key: ${key}`);
      if (normalized.endsWith("url")) assert.equal(child, null, `${key} must stay null until controlled file delivery exists`);
      visit(child);
    }
  };
  visit(value);
}

function assertSuccess(result) {
  assert.equal(result.response.status, 200);
  assert.equal(result.body?.ok, true);
  assert.equal(result.statementCount, 2, "detail repository bounded statement count drifted");
  assert.ok(result.bytes <= 300 * 1024, `detail/tab payload budget exceeded: ${result.bytes}`);
  assertSafePayload(result.body.data);
}

async function traverseCollection(baseUrl, fixture, id, tabPath, expectedCount) {
  const ids = new Set();
  let cursor = null;
  let pages = 0;
  do {
    const separator = tabPath.includes("?") ? "&" : "?";
    const cursorQuery = cursor ? `&cursor=${encodeURIComponent(cursor)}` : "";
    const result = await requestJson(baseUrl, fixture.companyId, `/api/v2/work-orders/${id}/${tabPath}${separator}limit=3${cursorQuery}`);
    assertSuccess(result);
    for (const item of result.body.data.items) {
      assert.equal(ids.has(item.id), false, "duplicate lazy collection row");
      ids.add(item.id);
    }
    cursor = result.body.data.nextCursor;
    assert.equal(result.body.data.hasMore, cursor !== null);
    pages += 1;
    if (pages > 10) fail("lazy-cursor-unbounded");
  } while (cursor);
  assert.equal(ids.size, expectedCount);
  return { rows: ids.size, pages, duplicateCount: 0, missingCount: expectedCount - ids.size };
}

async function measureRoute(baseUrl, fixture, id, label, suffix, samples = 10) {
  const apiTimes = [];
  const dbTimes = [];
  const transactionTimes = [];
  let maxPayloadBytes = 0;
  for (let index = 0; index < samples; index += 1) {
    const result = await requestJson(baseUrl, fixture.companyId, `/api/v2/work-orders/${id}${suffix}`);
    assertSuccess(result);
    apiTimes.push(result.apiMs);
    dbTimes.push(result.dbMs);
    transactionTimes.push(result.transactionMs);
    maxPayloadBytes = Math.max(maxPayloadBytes, result.bytes);
  }
  return {
    label, samples,
    api: metrics(apiTimes), db: metrics(dbTimes), transaction: metrics(transactionTimes),
    apiOutlierOver500Ms: apiTimes.filter((value) => value > 500).length,
    dbOutlierOver250Ms: dbTimes.filter((value) => value > 250).length,
    maxPayloadBytes,
  };
}

async function main() {
  const guard = assertGuard();
  console.log(`WAFL v2 ${VERSION} WorkOrder detail/lazy API runtime verification`);
  console.log(`Target guard: PASS runtime=${guard.runtime} fingerprint=${guard.fingerprint}`);
  console.log("Production target: blocked");
  console.log("Operation: authenticated read-only HTTP verification; no migration/seed/cleanup/reset/rollback/schema validation SQL");
  if (!process.env.NEXT_RUNTIME && !process.env.NODE_ENV) process.env.NODE_ENV = "production";

  const database = new Client({
    connectionString: guard.connectionString,
    application_name: "wafl-v2-alpha24-detail-api-verify",
    statement_timeout: 120_000,
    query_timeout: 120_000,
  });
  await database.connect();
  let server = null;
  const serverOutput = [];
  try {
    const target = await database.query("SELECT current_database() AS database_name");
    assert.equal(target.rows[0]?.database_name, guard.databaseName, "connected database mismatch");
    const before = await snapshotDatabase(database);
    assert.equal(Number(before.ledger_count), 7, "migration ledger must remain 7/7");
    assert.equal(Number(before.work_order_count), 10900, "alpha.22 synthetic baseline missing");

    const port = await getFreePort();
    const baseUrl = `http://127.0.0.1:${port}`;
    server = spawn(process.execPath, [path.resolve("node_modules/next/dist/bin/next"), "start", "-H", "127.0.0.1", "-p", String(port)], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NODE_ENV: "production",
        WAFL_V2_READ_API_ENABLED: "1",
        WAFL_V2_READ_APPROVED: "1",
        WAFL_V2_RUNTIME: guard.runtime,
        WAFL_V2_APPROVED_DB_FINGERPRINT: guard.approvedFingerprint,
        WAFL_V2_TEST_PREFIX: REQUIRED_PREFIX,
      },
      stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
    });
    const capture = (chunk) => {
      serverOutput.push(String(chunk).replace(/\x1b\[[0-9;]*m/g, "").trim());
      if (serverOutput.length > 20) serverOutput.shift();
    };
    server.stdout?.on("data", capture);
    server.stderr?.on("data", capture);
    await waitForServer(baseUrl, server);

    const aId = workOrderId(COMPANY_FIXTURES.a);
    const hId = workOrderId(COMPANY_FIXTURES.h);
    const bId = workOrderId(COMPANY_FIXTURES.b);
    const cId = workOrderId(COMPANY_FIXTURES.c);

    const unauth = await requestJson(baseUrl, COMPANY_FIXTURES.a.companyId, `/api/v2/work-orders/${aId}`, false);
    assertTypedError(unauth, 401, "AUTH_REQUIRED");
    const invalidId = await requestJson(baseUrl, COMPANY_FIXTURES.a.companyId, "/api/v2/work-orders/not-a-uuid");
    assertTypedError(invalidId, 404, "NOT_FOUND");
    const companyC = await requestJson(baseUrl, COMPANY_FIXTURES.c.companyId, `/api/v2/work-orders/${cId}`);
    assertTypedError(companyC, 403, "FORBIDDEN");

    const listRegression = await requestJson(baseUrl, COMPANY_FIXTURES.a.companyId, "/api/v2/work-orders?limit=1");
    assert.equal(listRegression.response.status, 200, "alpha.23 list API regression failed");

    for (const [fixture, id] of [[COMPANY_FIXTURES.a, aId], [COMPANY_FIXTURES.h, hId], [COMPANY_FIXTURES.b, bId]]) {
      const core = await requestJson(baseUrl, fixture.companyId, `/api/v2/work-orders/${id}`);
      assertSuccess(core);
      assert.deepEqual(Object.keys(core.body.data).sort(), ["amounts", "header", "revision", "tabCounts"]);
    }

    for (const tabPath of TAB_PATHS) {
      const own = await requestJson(baseUrl, COMPANY_FIXTURES.a.companyId, `/api/v2/work-orders/${aId}/${tabPath}`);
      assertSuccess(own);
      const cross = await requestJson(baseUrl, COMPANY_FIXTURES.a.companyId, `/api/v2/work-orders/${hId}/${tabPath}`);
      assertTypedError(cross, 404, "NOT_FOUND");
    }
    const crossCore = await requestJson(baseUrl, COMPANY_FIXTURES.a.companyId, `/api/v2/work-orders/${hId}`);
    assertTypedError(crossCore, 404, "NOT_FOUND");

    const badCursor = await requestJson(baseUrl, COMPANY_FIXTURES.a.companyId, `/api/v2/work-orders/${aId}/materials?type=accessory&cursor=not-a-cursor`);
    assertTypedError(badCursor, 400, "CURSOR_INVALID");
    const badLimit = await requestJson(baseUrl, COMPANY_FIXTURES.a.companyId, `/api/v2/work-orders/${aId}/assets?limit=51`);
    assertTypedError(badLimit, 400, "LIMIT_EXCEEDED");
    const badType = await requestJson(baseUrl, COMPANY_FIXTURES.a.companyId, `/api/v2/work-orders/${aId}/materials?type=trim`);
    assertTypedError(badType, 400, "VALIDATION_ERROR");

    const accessoryCursor = await traverseCollection(baseUrl, COMPANY_FIXTURES.a, aId, "materials?type=accessory", 10);
    const assetCursor = await traverseCollection(baseUrl, COMPANY_FIXTURES.a, aId, "assets", 2);

    const measurementSpecs = [
      ["core", ""],
      ["materials-fabric", "/materials?type=fabric"],
      ["materials-accessory", "/materials?type=accessory"],
      ["size-color", "/size-color"],
      ["size-spec", "/size-spec"],
      ["processes", "/processes"],
      ["assets", "/assets"],
      ["documents", "/documents"],
      ["history", "/history"],
    ];
    const routeMetrics = [];
    for (const [label, suffix] of measurementSpecs) {
      routeMetrics.push(await measureRoute(baseUrl, COMPANY_FIXTURES.a, aId, label, suffix));
    }
    routeMetrics.push(await measureRoute(baseUrl, COMPANY_FIXTURES.h, hId, "company-h-core", ""));

    for (const result of routeMetrics) {
      console.log(`Route metrics (sanitized): ${JSON.stringify(result)}`);
    }
    console.log(`Accessory cursor: ${JSON.stringify(accessoryCursor)}`);
    console.log(`Asset cursor: ${JSON.stringify(assetCursor)}`);

    for (const result of routeMetrics) {
      assert.ok(result.db.p95Ms <= 250, `${result.label} DB p95 budget failed: ${result.db.p95Ms}`);
      assert.ok(result.api.p95Ms <= 500, `${result.label} API p95 budget failed: ${result.api.p95Ms}`);
    }

    const after = await snapshotDatabase(database);
    assert.deepEqual(after, before, "read-only detail verification changed DB schema or row counts");
    console.log("Company A/H/B authenticated detail read: PASS");
    console.log("Company C authenticated access policy: FORBIDDEN (approval_pending)");
    console.log("Cross-company core/tab IDs: NOT_FOUND");
    console.log("Lazy endpoint isolation and forbidden field scanner: PASS");
    console.log("Typed errors: AUTH_REQUIRED/FORBIDDEN/NOT_FOUND/CURSOR_INVALID/LIMIT_EXCEEDED/VALIDATION_ERROR PASS");
    console.log("DB schema mutation: false");
    console.log("Dev/Test seed mutation: false");
    console.log("Business data mutation: false");
    console.log("R2 mutation: false");
    console.log("Production mutation: false");
    console.log("Result: PASS");
  } catch (error) {
    console.error("Result: FAIL");
    console.error(error instanceof Error ? error.message : String(error));
    if (serverOutput.length > 0) console.error(`Next server tail: ${serverOutput.join(" | ").slice(-1200)}`);
    process.exitCode = 1;
  } finally {
    if (server && server.exitCode === null) {
      server.kill();
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    await database.end();
  }
}

await main();
