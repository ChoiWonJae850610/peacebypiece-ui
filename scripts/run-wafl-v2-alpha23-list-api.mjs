#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import { performance } from "node:perf_hooks";
import pg from "pg";

const { Client } = pg;
const VERSION = "2.0.0-alpha.23";
const REQUIRED_PREFIX = "wafl-fn";
const REQUIRED_CONFIRMATION = "VERIFY WAFL V2 ALPHA23 READ API";
const ALLOWED_RUNTIMES = new Set(["development", "dev", "local", "test", "demo"]);
const COMPANY_COUNTS = {
  "wafl-fn-company-a": 500,
  "wafl-fn-company-h": 5000,
  "wafl-fn-company-b": 1800,
  "wafl-fn-company-c": 1800,
};
const ITEM_KEYS = [
  "displayDocumentNumber",
  "dueDate",
  "estimatedAmountSummary",
  "incompleteMaterialSummary",
  "latestDocumentStatus",
  "processCount",
  "productName",
  "representativeThumbnail",
  "status",
  "totalQuantity",
  "updatedAt",
  "workOrderId",
].sort();

function fail(message) {
  throw new Error(message);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function percentile(values, ratio) {
  const ordered = [...values].sort((a, b) => a - b);
  if (ordered.length === 0) return 0;
  return ordered[Math.min(ordered.length - 1, Math.ceil(ordered.length * ratio) - 1)];
}

function metrics(values) {
  return {
    p50Ms: Number(percentile(values, 0.5).toFixed(2)),
    p95Ms: Number(percentile(values, 0.95).toFixed(2)),
    maxMs: Number(Math.max(...values).toFixed(2)),
  };
}

function decodeCursorPosition(cursor) {
  if (!cursor) return { updatedAt: null, workOrderId: null };
  const [encoded] = cursor.split(".");
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (typeof payload?.u !== "string" || typeof payload?.i !== "string") fail("cursor-position-unavailable");
    return { updatedAt: payload.u, workOrderId: payload.i };
  } catch (error) {
    if (error instanceof Error && error.message === "cursor-position-unavailable") throw error;
    fail("cursor-position-unavailable");
  }
}

function loadWorkOrderListSql() {
  const repositorySource = fs.readFileSync(
    path.resolve("lib/domain/work-orders/read/listRepository.ts"),
    "utf8",
  );
  const match = repositorySource.match(/export const WORK_ORDER_V2_LIST_SQL = `([\s\S]*?)`;/);
  if (!match?.[1]) fail("work-order-list-sql-unavailable");
  return match[1];
}

function sanitizeExplainNode(node) {
  if (!node || typeof node !== "object") return null;
  const allowedKeys = [
    "Node Type",
    "Relation Name",
    "Index Name",
    "Join Type",
    "Aggregate Strategy",
    "Sort Method",
    "Sort Space Used",
    "Sort Space Type",
    "Plan Rows",
    "Actual Rows",
    "Actual Loops",
    "Actual Startup Time",
    "Actual Total Time",
    "Shared Hit Blocks",
    "Shared Read Blocks",
    "Shared Dirtied Blocks",
    "Shared Written Blocks",
    "Temp Read Blocks",
    "Temp Written Blocks",
  ];
  const sanitized = {};
  for (const key of allowedKeys) {
    if (Object.hasOwn(node, key)) sanitized[key] = node[key];
  }
  if (Array.isArray(node.Plans)) sanitized.Plans = node.Plans.map(sanitizeExplainNode);
  return sanitized;
}

function sanitizeExplainResult(result, page) {
  const root = result.rows[0]?.["QUERY PLAN"]?.[0];
  if (!root?.Plan) fail("explain-plan-unavailable");
  return {
    page,
    planningTimeMs: root["Planning Time"],
    executionTimeMs: root["Execution Time"],
    plan: sanitizeExplainNode(root.Plan),
  };
}

function databaseIdentity(connectionString) {
  const parsed = new URL(connectionString);
  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
  if (!new Set(["postgres:", "postgresql:"]).has(parsed.protocol) || !parsed.hostname || !databaseName) {
    fail("database-url-invalid");
  }
  return {
    databaseName,
    fingerprint: sha256(`${parsed.hostname}/${databaseName}`).slice(0, 12),
  };
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
    userId: `alpha23-reader-${companyId}`,
    companyId,
    companyMemberId: `alpha23-member-${companyId}`,
    companyName: "WAFL synthetic runtime company",
    role: "company_admin",
    email: `alpha23-${companyId}@example.invalid`,
    name: "WAFL alpha23 reader",
    issuedAt: new Date().toISOString(),
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = crypto.createHmac("sha256", sessionSecret()).update(encoded).digest("base64url");
  return `wafl_auth_session=${encoded}.${signature}`;
}

function signCursorPayload(payload) {
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = crypto.createHmac("sha256", sessionSecret()).update(`work-order-list:${encoded}`).digest("base64url");
  return `${encoded}.${signature}`;
}

function scopeHash(companyId) {
  return crypto.createHmac("sha256", sessionSecret())
    .update(`work-order-list-scope:${companyId}:company`)
    .digest("base64url")
    .slice(0, 24);
}

async function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close(() => reject(new Error("free-port-unavailable")));
        return;
      }
      const port = address.port;
      server.close(() => resolve(port));
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
      if (response.status === 403) {
        const body = await response.text();
        fail(`next-server-runtime-guard-blocked:${body.slice(0, 160)}`);
      }
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("next-server-")) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  fail("next-server-start-timeout");
}

async function snapshotDatabase(client) {
  await client.query("BEGIN READ ONLY");
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
          AND table_name IN (
            'work_orders', 'work_order_revisions', 'work_order_material_lines',
            'work_order_processes', 'work_order_images', 'generated_documents'
          )
      ) schema_rows
  `);
  await client.query("COMMIT");
  return { ...result.rows[0], schema_fingerprint: schema.rows[0]?.fingerprint ?? null };
}

function assertNoForbiddenPayload(value) {
  const forbiddenKeys = new Set([
    "attachments",
    "images",
    "materials",
    "processes",
    "quantitycells",
    "rawtoken",
    "sizespec",
    "snapshot",
    "storageobjectkey",
    "thumbnailobjectkey",
    "tokenhash",
  ]);
  const visit = (current) => {
    if (Array.isArray(current)) {
      for (const item of current) visit(item);
      return;
    }
    if (!current || typeof current !== "object") return;
    for (const [key, child] of Object.entries(current)) {
      const normalizedKey = key.replaceAll("_", "").replaceAll("-", "").toLowerCase();
      assert.equal(forbiddenKeys.has(normalizedKey), false, `list payload exposed forbidden key: ${key}`);
      visit(child);
    }
  };
  visit(value);
}

function assertListItem(item) {
  assert.deepEqual(Object.keys(item).sort(), ITEM_KEYS, "list item field set drifted");
  assert.equal(typeof item.workOrderId, "string");
  assert.equal(typeof item.productName, "string");
  assert.equal(typeof item.totalQuantity, "number");
  assert.equal(typeof item.processCount, "number");
  assert.deepEqual(Object.keys(item.estimatedAmountSummary).sort(), ["currency", "estimatedTotal"]);
  assert.deepEqual(
    Object.keys(item.incompleteMaterialSummary).sort(),
    ["incompleteAccessoryCount", "incompleteFabricCount"],
  );
  if (item.representativeThumbnail !== null) {
    assert.deepEqual(Object.keys(item.representativeThumbnail).sort(), ["altText", "imageId", "thumbnailUrl"]);
    assert.equal(item.representativeThumbnail.thumbnailUrl, null, "synthetic metadata must not claim an R2 thumbnail URL");
  }
  assertNoForbiddenPayload(item);
}

async function requestList(baseUrl, companyId, query = "") {
  const startedAt = performance.now();
  const response = await fetch(`${baseUrl}/api/v2/work-orders${query ? `?${query}` : ""}`, {
    headers: { Cookie: createSessionCookie(companyId) },
  });
  const text = await response.text();
  const apiMs = performance.now() - startedAt;
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    fail(`invalid-json-response:${response.status}`);
  }
  return {
    response,
    body,
    bytes: Buffer.byteLength(text),
    apiMs,
    queryCount: Number(response.headers.get("x-wafl-list-query-count") ?? "0"),
    listDbMs: Number(response.headers.get("x-wafl-list-db-ms") ?? "0"),
    transactionMs: Number(response.headers.get("x-wafl-list-transaction-ms") ?? "0"),
  };
}

function assertTypedError(result, status, code) {
  assert.equal(result.response.status, status);
  assert.equal(result.body?.ok, false);
  assert.equal(result.body?.error?.code, code);
  assert.equal(typeof result.body?.error?.message, "string");
  assert.equal(typeof result.body?.error?.retryable, "boolean");
  assert.equal(typeof result.body?.error?.correlationId, "string");
}

async function traverseCompany(baseUrl, companyId, expectedCount) {
  const ids = new Set();
  const apiTimes = [];
  const listDbTimes = [];
  const transactionTimes = [];
  let cursor = null;
  let firstCursor = null;
  let pages = 0;
  let maxPayloadBytes = 0;
  const pageDescriptors = [];

  do {
    const query = new URLSearchParams({ limit: "50" });
    if (cursor) query.set("cursor", cursor);
    const position = decodeCursorPosition(cursor);
    const queryString = query.toString();
    const result = await requestList(baseUrl, companyId, queryString);
    assert.equal(result.response.status, 200);
    assert.equal(result.body?.ok, true);
    assert.deepEqual(Object.keys(result.body.data).sort(), ["hasMore", "items", "limit", "nextCursor"]);
    assert.equal(result.body.data.limit, 50);
    assert.equal(result.queryCount, 2, "repository bounded statement count exceeded the contract");
    for (const item of result.body.data.items) {
      assertListItem(item);
      assert.equal(ids.has(item.workOrderId), false, `duplicate WorkOrder: ${item.workOrderId}`);
      ids.add(item.workOrderId);
    }
    apiTimes.push(result.apiMs);
    listDbTimes.push(result.listDbMs);
    transactionTimes.push(result.transactionMs);
    maxPayloadBytes = Math.max(maxPayloadBytes, result.bytes);
    pages += 1;
    pageDescriptors.push({
      page: pages,
      query: queryString,
      cursorUpdatedAt: position.updatedAt,
      cursorWorkOrderId: position.workOrderId,
    });
    cursor = result.body.data.nextCursor;
    if (pages === 1) firstCursor = cursor;
    assert.equal(result.body.data.hasMore, cursor !== null);
    if (pages > Math.ceil(expectedCount / 50) + 1) fail(`cursor-traversal-unbounded:${companyId}`);
  } while (cursor);

  const missingCount = expectedCount - ids.size;
  const duplicateCount = 0;
  assert.equal(ids.size, expectedCount);
  assert.equal(pages, Math.ceil(expectedCount / 50));
  assert.ok(maxPayloadBytes <= 200 * 1024, `50-row payload budget exceeded: ${maxPayloadBytes}`);

  return {
    companyId,
    rows: ids.size,
    pages,
    duplicateCount,
    missingCount,
    firstCursor,
    ids,
    api: metrics(apiTimes),
    listDb: metrics(listDbTimes),
    transaction: metrics(transactionTimes),
    apiOutlierOver500Ms: apiTimes.filter((value) => value > 500).length,
    queryCount: 2,
    maxPayloadBytes,
    pageDescriptors,
  };
}

async function measureCompanyAPages(baseUrl, companyId, pageDescriptors) {
  assert.equal(pageDescriptors.length, 10, "company A performance sample requires the same 10 cursor pages");
  const listDbTimes = [];
  const apiTimes = [];
  const transactionTimes = [];
  const pageSamples = pageDescriptors.map(({ page }) => ({ page, listDbMs: [] }));
  let slowest = { page: 0, listDbMs: -1, descriptor: null };

  for (let round = 0; round < 3; round += 1) {
    for (const descriptor of pageDescriptors) {
      const result = await requestList(baseUrl, companyId, descriptor.query);
      assert.equal(result.response.status, 200);
      assert.equal(result.body?.ok, true);
      assert.equal(result.body?.data?.limit, 50);
      assert.equal(result.queryCount, 2, "repository bounded statement count exceeded the contract during performance sampling");
      listDbTimes.push(result.listDbMs);
      apiTimes.push(result.apiMs);
      transactionTimes.push(result.transactionMs);
      pageSamples[descriptor.page - 1].listDbMs.push(result.listDbMs);
      if (result.listDbMs > slowest.listDbMs) {
        slowest = { page: descriptor.page, listDbMs: result.listDbMs, descriptor };
      }
    }
  }

  return {
    samples: listDbTimes.length,
    listDb: metrics(listDbTimes),
    api: metrics(apiTimes),
    transaction: metrics(transactionTimes),
    outlierOver100Ms: listDbTimes.filter((value) => value > 100).length,
    apiOutlierOver500Ms: apiTimes.filter((value) => value > 500).length,
    pageSamples,
    slowest,
  };
}

async function explainCompanyAPages(database, firstPage, slowestPage) {
  const listSql = loadWorkOrderListSql();
  const explainSql = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${listSql}`;
  const explainPage = async (descriptor) => {
    await database.query("BEGIN READ ONLY");
    try {
      await database.query("SET LOCAL ROLE wafl_v2_tenant_runtime");
      await database.query(
        `SELECT set_config('wafl.company_id', $1, true),
                set_config('wafl.company_member_id', $2, true),
                set_config('wafl.access_mode', 'tenant_member', true),
                set_config('wafl.correlation_id', $3, true)`,
        ["wafl-fn-company-a", "alpha23-member-wafl-fn-company-a", "alpha23-read-only-explain"],
      );
      const result = await database.query(explainSql, [
        "wafl-fn-company-a",
        descriptor.cursorUpdatedAt,
        descriptor.cursorWorkOrderId,
        null,
        51,
      ]);
      await database.query("ROLLBACK");
      return sanitizeExplainResult(result, descriptor.page);
    } catch (error) {
      try { await database.query("ROLLBACK"); } catch { /* read-only transaction already closed */ }
      throw error;
    }
  };

  return {
    firstPage: await explainPage(firstPage),
    slowestPage: await explainPage(slowestPage),
  };
}

async function main() {
  const guard = assertGuard();
  if (!fs.existsSync(path.resolve(".next/BUILD_ID"))) fail("next-production-build-required");
  console.log(`WAFL v2 ${VERSION} WorkOrder list API runtime verification`);
  console.log(`Target guard: PASS runtime=${guard.runtime} fingerprint=${guard.fingerprint}`);
  console.log("Production target: blocked");
  console.log("Operation: authenticated read-only HTTP verification; no migration/seed/cleanup/reset/rollback SQL");

  const database = new Client({
    connectionString: guard.connectionString,
    application_name: "wafl-v2-alpha23-read-api-verify",
    statement_timeout: 120_000,
    query_timeout: 120_000,
  });
  await database.connect();
  let server = null;
  const serverOutput = [];
  try {
    const target = await database.query("SELECT current_database() AS database_name, current_user AS role_name");
    assert.equal(target.rows[0]?.database_name, guard.databaseName, "connected database mismatch");
    const before = await snapshotDatabase(database);
    assert.equal(Number(before.ledger_count), 7, "migration ledger must remain 7/7 after approved index 007");
    assert.equal(Number(before.work_order_count), 10900, "expected alpha.22 synthetic WorkOrder baseline missing");

    const port = await getFreePort();
    const baseUrl = `http://127.0.0.1:${port}`;
    server = spawn(
      process.execPath,
      [path.resolve("node_modules/next/dist/bin/next"), "start", "-H", "127.0.0.1", "-p", String(port)],
      {
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
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
      },
    );
    const capture = (chunk) => {
      serverOutput.push(String(chunk).replace(/\x1b\[[0-9;]*m/g, "").trim());
      if (serverOutput.length > 20) serverOutput.shift();
    };
    server.stdout?.on("data", capture);
    server.stderr?.on("data", capture);
    await waitForServer(baseUrl, server);

    const unauthenticated = await fetch(`${baseUrl}/api/v2/work-orders?limit=1`);
    const unauthBody = await unauthenticated.json();
    assertTypedError({ response: unauthenticated, body: unauthBody }, 401, "AUTH_REQUIRED");

    const defaultPage = await requestList(baseUrl, "wafl-fn-company-a");
    assert.equal(defaultPage.response.status, 200);
    assert.equal(defaultPage.body.data.limit, 30);
    assert.ok(defaultPage.bytes <= 150 * 1024, `30-row payload budget exceeded: ${defaultPage.bytes}`);
    assert.equal(defaultPage.queryCount, 2);

    const invalidCursor = await requestList(baseUrl, "wafl-fn-company-a", "cursor=not-a-cursor");
    assertTypedError(invalidCursor, 400, "CURSOR_INVALID");
    const now = Date.now();
    const cursorBase = { u: new Date(now).toISOString(), i: "00000000-0000-4000-8000-000000000001", s: scopeHash("wafl-fn-company-a") };
    const expiredCursor = signCursorPayload({ ...cursorBase, v: 1, exp: now - 1 });
    assertTypedError(await requestList(baseUrl, "wafl-fn-company-a", `cursor=${encodeURIComponent(expiredCursor)}`), 400, "CURSOR_INVALID");
    const versionCursor = signCursorPayload({ ...cursorBase, v: 2, exp: now + 60_000 });
    assertTypedError(await requestList(baseUrl, "wafl-fn-company-a", `cursor=${encodeURIComponent(versionCursor)}`), 400, "CURSOR_INVALID");
    assertTypedError(await requestList(baseUrl, "wafl-fn-company-a", "limit=51"), 400, "LIMIT_EXCEEDED");

    const companyA = await traverseCompany(baseUrl, "wafl-fn-company-a", COMPANY_COUNTS["wafl-fn-company-a"]);
    const companyH = await traverseCompany(baseUrl, "wafl-fn-company-h", COMPANY_COUNTS["wafl-fn-company-h"]);
    const companyAPerformance = await measureCompanyAPages(
      baseUrl,
      "wafl-fn-company-a",
      companyA.pageDescriptors,
    );
    const companyB = await requestList(baseUrl, "wafl-fn-company-b", "limit=50");
    const companyC = await requestList(baseUrl, "wafl-fn-company-c", "limit=50");
    assert.equal(companyB.response.status, 200);
    assertTypedError(companyC, 403, "FORBIDDEN");
    const bIds = companyB.body.data.items.map((item) => item.workOrderId);
    for (const id of [...companyH.ids, ...bIds]) assert.equal(companyA.ids.has(id), false, "cross-company row leaked into company A");

    assertTypedError(
      await requestList(baseUrl, "wafl-fn-company-a", `cursor=${encodeURIComponent(companyH.firstCursor)}`),
      400,
      "CURSOR_INVALID",
    );
    for (const foreignCompanyId of ["wafl-fn-company-b", "wafl-fn-company-c"]) {
      const foreignCursor = signCursorPayload({
        ...cursorBase,
        v: 1,
        exp: now + 60_000,
        s: scopeHash(foreignCompanyId),
      });
      assertTypedError(
        await requestList(baseUrl, "wafl-fn-company-a", `cursor=${encodeURIComponent(foreignCursor)}`),
        400,
        "CURSOR_INVALID",
      );
    }
    const hId = [...companyH.ids][0];
    assertTypedError(
      await requestList(baseUrl, "wafl-fn-company-a", `workOrderId=${encodeURIComponent(hId)}`),
      400,
      "VALIDATION_ERROR",
    );
    assertTypedError(
      await requestList(baseUrl, "wafl-fn-company-a", "companyId=wafl-fn-company-h"),
      400,
      "VALIDATION_ERROR",
    );

    console.log(`Company A listDb page samples (sanitized): ${JSON.stringify(companyAPerformance.pageSamples)}`);
    console.log(`Company A listDb 30-sample metrics: ${JSON.stringify({
      samples: companyAPerformance.samples,
      ...companyAPerformance.listDb,
      outlierOver100Ms: companyAPerformance.outlierOver100Ms,
    })}`);
    console.log(`Company A API 30-sample metrics (sanitized): ${JSON.stringify({
      samples: companyAPerformance.samples,
      ...companyAPerformance.api,
      outlierOver500Ms: companyAPerformance.apiOutlierOver500Ms,
    })}`);
    console.log(`Company A transaction 30-sample metrics (sanitized): ${JSON.stringify({
      samples: companyAPerformance.samples,
      ...companyAPerformance.transaction,
    })}`);
    console.log(`Company H API traversal metrics (sanitized): ${JSON.stringify({
      samples: companyH.pages,
      ...companyH.api,
      outlierOver500Ms: companyH.apiOutlierOver500Ms,
    })}`);
    console.log(`Company H transaction traversal metrics (sanitized): ${JSON.stringify({
      samples: companyH.pages,
      ...companyH.transaction,
    })}`);
    const explain = await explainCompanyAPages(
      database,
      companyA.pageDescriptors[0],
      companyAPerformance.slowest.descriptor,
    );
    console.log(`Company A first-page EXPLAIN (sanitized): ${JSON.stringify(explain.firstPage)}`);
    console.log(`Company A slowest-page EXPLAIN (sanitized): ${JSON.stringify(explain.slowestPage)}`);
    if (companyAPerformance.listDb.p95Ms > 100) {
      fail(`company A DB p95 budget failed: ${companyAPerformance.listDb.p95Ms}`);
    }
    assert.ok(companyH.listDb.p95Ms <= 200, `company H DB p95 budget failed: ${companyH.listDb.p95Ms}`);
    assert.ok(companyAPerformance.api.p95Ms <= 500, `company A API p95 budget failed: ${companyAPerformance.api.p95Ms}`);
    assert.ok(companyH.api.p95Ms <= 500, `company H API p95 budget failed: ${companyH.api.p95Ms}`);

    const after = await snapshotDatabase(database);
    assert.deepEqual(after, before, "read-only API verification changed DB schema or row counts");

    const printable = ({ ids, firstCursor, pageDescriptors, ...result }) => ({
      ...result,
      firstCursor: firstCursor ? "present" : null,
    });
    console.log(`Cursor 500: ${JSON.stringify(printable(companyA))}`);
    console.log(`Cursor 5000: ${JSON.stringify(printable(companyH))}`);
    console.log(`Company B authenticated first page: rows=${companyB.body.data.items.length}`);
    console.log("Company C authenticated access policy: FORBIDDEN (approval_pending)");
    console.log(`Default 30 payload bytes: ${defaultPage.bytes}`);
    console.log("Tenant isolation: PASS");
    console.log("Typed errors: AUTH_REQUIRED/FORBIDDEN/CURSOR_INVALID/LIMIT_EXCEEDED/VALIDATION_ERROR PASS");
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
