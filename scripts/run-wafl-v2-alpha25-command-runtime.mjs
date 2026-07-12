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
const VERSION = "2.0.0-alpha.25";
const REQUIRED_PREFIX = "wafl-fn";
const REQUIRED_CONFIRMATION = "EXECUTE WAFL V2 ALPHA25 COMMAND RUNTIME";
const REQUIRED_MUTATION_APPROVAL = "2.0.0-alpha.25-dev-test-command-runtime";
const ALLOWED_RUNTIMES = new Set(["development", "dev", "local", "test", "demo"]);
const COMPANY_A = "wafl-fn-company-a";
const COMPANY_B = "wafl-fn-company-b";
const COMPANY_C = "wafl-fn-company-c";
const COMPANY_H = "wafl-fn-company-h";
const IDEMPOTENCY_KEY = "alpha25-command-runtime-v1";
const CREATE_COMMAND_CODE = "work_order.create_draft";

function fail(message) {
  throw new Error(message);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

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
  if (process.env.WAFL_V2_CONFIRMATION !== REQUIRED_CONFIRMATION) fail("confirmation-mismatch");
  if (process.env.WAFL_V2_COMMAND_MUTATION_APPROVED !== REQUIRED_MUTATION_APPROVAL) fail("mutation-approval-missing");
  if (process.env.WAFL_V2_READ_APPROVED !== "1" || process.env.WAFL_V2_READ_API_ENABLED !== "1" || process.env.WAFL_V2_COMMAND_API_ENABLED !== "1") fail("api-guard-missing");
  const identity = databaseIdentity(connectionString);
  if (!approvedFingerprint || approvedFingerprint !== identity.fingerprint) fail("db-fingerprint-mismatch");
  return { connectionString, fingerprint: identity.fingerprint };
}

function sessionSecret() {
  const value = process.env.WAFL_SESSION_SECRET?.trim() || process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  if (!value) fail("session-secret-missing");
  return value;
}

function createSessionCookie(input) {
  const payload = {
    userId: input.userId,
    companyId: input.companyId,
    companyMemberId: input.companyMemberId,
    companyName: "WAFL synthetic command company",
    role: "company_admin",
    email: `alpha25-command-${input.companyId}@example.invalid`,
    name: "WAFL alpha25 command actor",
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
  return postgresUuidFromMd5(`2.0.0-alpha.22:${profileKey}:${companyId}:wo:${sequence}`);
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

async function readActor(client, companyId) {
  await client.query("BEGIN READ ONLY");
  try {
    const result = await client.query(`
      SELECT id, user_id
      FROM company_members
      WHERE company_id = $1 AND status = 'approved' AND user_id IS NOT NULL
      ORDER BY created_at ASC, id ASC
      LIMIT 1
    `, [companyId]);
    await client.query("COMMIT");
    const row = result.rows[0];
    if (!row?.id || !row?.user_id) fail(`approved-member-missing:${companyId}`);
    return { companyId, companyMemberId: String(row.id), userId: String(row.user_id) };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function snapshotDatabase(client) {
  await client.query("BEGIN READ ONLY");
  try {
    const result = await client.query(`
      SELECT
        (SELECT count(*)::integer FROM wafl_v2_migration_ledger) AS ledger_count,
        (SELECT count(*)::integer FROM work_orders) AS work_order_count,
        (SELECT count(*)::integer FROM work_order_revisions) AS revision_count,
        (SELECT count(*)::integer FROM work_order_command_receipts) AS receipt_count,
        (SELECT count(*)::integer FROM domain_events) AS event_count,
        (SELECT count(*)::integer FROM work_order_material_lines) AS material_count,
        (SELECT count(*)::integer FROM work_order_processes) AS process_count,
        (SELECT count(*)::integer FROM work_order_images) AS image_count,
        (SELECT count(*)::integer FROM generated_documents) AS document_count
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
    return { ...result.rows[0], schema_fingerprint: schema.rows[0]?.fingerprint ?? null };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function assertReceiptAbsent(client, actor) {
  const scopedHash = sha256([CREATE_COMMAND_CODE, actor.companyId, actor.companyMemberId, IDEMPOTENCY_KEY].join("\0"));
  await client.query("BEGIN READ ONLY");
  try {
    const result = await client.query(`
      SELECT count(*)::integer AS count
      FROM work_order_command_receipts
      WHERE company_id = $1 AND command_code = $2 AND idempotency_key = $3
    `, [actor.companyId, CREATE_COMMAND_CODE, scopedHash]);
    await client.query("COMMIT");
    assert.equal(Number(result.rows[0]?.count), 0, "alpha.25 deterministic receipt must be absent before the one approved run");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function requestJson(baseUrl, routePath, options = {}) {
  const startedAt = performance.now();
  const headers = {
    ...(options.actor ? { Cookie: createSessionCookie(options.actor) } : {}),
    ...(options.headers ?? {}),
  };
  const response = await fetch(`${baseUrl}${routePath}`, {
    method: options.method ?? "GET",
    headers,
    ...(Object.prototype.hasOwnProperty.call(options, "body") ? { body: JSON.stringify(options.body) } : {}),
    redirect: "manual",
  });
  const text = await response.text();
  let body;
  try { body = JSON.parse(text); } catch { fail(`invalid-json-response:${response.status}`); }
  return {
    response,
    body,
    apiMs: Number((performance.now() - startedAt).toFixed(2)),
    bytes: Buffer.byteLength(text),
    statementCount: Number(response.headers.get("x-wafl-command-statement-count") ?? "0"),
    transactionCount: Number(response.headers.get("x-wafl-command-transaction-count") ?? "0"),
    dbMs: Number(response.headers.get("x-wafl-command-db-ms") ?? "0"),
    replay: response.headers.get("x-wafl-idempotent-replay") === "1",
  };
}

function assertTypedError(result, status, code) {
  assert.equal(result.response.status, status);
  assert.equal(result.body?.ok, false);
  assert.equal(result.body?.error?.code, code);
  assert.equal(typeof result.body?.error?.message, "string");
  assert.equal(typeof result.body?.error?.correlationId, "string");
}

function commandHeaders() {
  return { "Content-Type": "application/json", "Idempotency-Key": IDEMPOTENCY_KEY };
}

async function run() {
  const guard = assertGuard();
  const client = new Client({ connectionString: guard.connectionString });
  await client.connect();
  let child;
  try {
    const actorA = await readActor(client, COMPANY_A);
    const actorB = { companyId: COMPANY_B, companyMemberId: "alpha25-cross-company-b", userId: "alpha25-cross-company-b" };
    const actorC = { companyId: COMPANY_C, companyMemberId: "alpha25-blocked-company-c", userId: "alpha25-blocked-company-c" };
    const actorH = { companyId: COMPANY_H, companyMemberId: "alpha25-cross-company-h", userId: "alpha25-cross-company-h" };
    await assertReceiptAbsent(client, actorA);
    const before = await snapshotDatabase(client);
    assert.equal(Number(before.ledger_count), 7);

    const port = await getFreePort();
    const baseUrl = `http://127.0.0.1:${port}`;
    child = spawn(process.execPath, [path.join("node_modules", "next", "dist", "bin", "next"), "start", "-H", "127.0.0.1", "-p", String(port)], {
      cwd: process.cwd(), env: { ...process.env, PORT: String(port) }, stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
    });
    await waitForServer(baseUrl, child);

    const createBody = {
      clientRequestId: "alpha25-command-create-v1",
      productName: "WAFL alpha.25 Command 검증 제작 카드",
      productTypeCode: "apparel.top",
      seasonCode: "26SS",
      itemCode: "A25-CMD",
      dueDate: "2026-08-31",
      totalQuantity: 120,
      memo: "approved dev/test synthetic Command runtime",
    };
    const created = await requestJson(baseUrl, "/api/v2/work-orders", { actor: actorA, method: "POST", headers: commandHeaders(), body: createBody });
    assert.equal(created.response.status, 201);
    assert.equal(created.body?.ok, true);
    assert.equal(created.body?.data?.result?.status, "draft");
    assert.equal(created.body?.data?.result?.revisionStatus, "draft");
    assert.equal(created.body?.data?.result?.revisionNumber, 0);
    assert.equal(created.body?.data?.result?.displayDocumentNumber, null);
    assert.equal(created.body?.data?.nextVersion, 1);
    assert.equal(created.replay, false);
    assert.equal(created.transactionCount, 1);
    const workOrderId = created.body.data.result.workOrderId;
    const revisionId = created.body.data.result.revisionId;

    const replay = await requestJson(baseUrl, "/api/v2/work-orders", { actor: actorA, method: "POST", headers: commandHeaders(), body: createBody });
    assert.equal(replay.response.status, 200);
    assert.equal(replay.body?.data?.result?.workOrderId, workOrderId);
    assert.equal(replay.body?.data?.result?.revisionId, revisionId);
    assert.equal(replay.replay, true);

    const keyConflict = await requestJson(baseUrl, "/api/v2/work-orders", {
      actor: actorA,
      method: "POST",
      headers: commandHeaders(),
      body: { ...createBody, productName: "동일 key 다른 payload" },
    });
    assertTypedError(keyConflict, 409, "CONFLICT");

    const updated = await requestJson(baseUrl, `/api/v2/work-orders/${workOrderId}`, {
      actor: actorA,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: {
        clientRequestId: "alpha25-command-patch-v1",
        expectedVersion: 1,
        patch: { productName: "WAFL alpha.25 Command 검증 제작 카드 수정", totalQuantity: 144 },
      },
    });
    assert.equal(updated.response.status, 200);
    assert.equal(updated.body?.data?.nextVersion, 2);
    assert.equal(updated.body?.data?.result?.revisionId, revisionId);

    const competitors = await Promise.all([
      requestJson(baseUrl, `/api/v2/work-orders/${workOrderId}`, {
        actor: actorA, method: "PATCH", headers: { "Content-Type": "application/json" },
        body: { clientRequestId: "alpha25-command-race-a", expectedVersion: 2, patch: { seasonCode: "26FW-A" } },
      }),
      requestJson(baseUrl, `/api/v2/work-orders/${workOrderId}`, {
        actor: actorA, method: "PATCH", headers: { "Content-Type": "application/json" },
        body: { clientRequestId: "alpha25-command-race-b", expectedVersion: 2, patch: { seasonCode: "26FW-B" } },
      }),
    ]);
    assert.equal(competitors.filter((item) => item.response.status === 200).length, 1);
    assert.equal(competitors.filter((item) => item.response.status === 409 && item.body?.error?.code === "CONFLICT").length, 1);
    const winner = competitors.find((item) => item.response.status === 200);
    const loser = competitors.find((item) => item.response.status === 409);
    assert.equal(winner?.body?.data?.nextVersion, 3);

    for (const actor of [actorB, actorH]) {
      const crossTenant = await requestJson(baseUrl, `/api/v2/work-orders/${workOrderId}`, {
        actor, method: "PATCH", headers: { "Content-Type": "application/json" },
        body: { clientRequestId: `alpha25-cross-${actor.companyId}`, expectedVersion: 3, patch: { memo: "blocked" } },
      });
      assertTypedError(crossTenant, 404, "NOT_FOUND");
    }
    const companyC = await requestJson(baseUrl, `/api/v2/work-orders/${workOrderId}`, {
      actor: actorC, method: "PATCH", headers: { "Content-Type": "application/json" },
      body: { clientRequestId: "alpha25-company-c", expectedVersion: 3, patch: { memo: "blocked" } },
    });
    assertTypedError(companyC, 403, "FORBIDDEN");

    const finalizedId = seededWorkOrderId(COMPANY_A, "a500");
    const finalized = await requestJson(baseUrl, `/api/v2/work-orders/${finalizedId}`, {
      actor: actorA, method: "PATCH", headers: { "Content-Type": "application/json" },
      body: { clientRequestId: "alpha25-finalized-block", expectedVersion: 1, patch: { memo: "blocked" } },
    });
    assertTypedError(finalized, 409, "LOCKED");

    const detail = await requestJson(baseUrl, `/api/v2/work-orders/${workOrderId}`, { actor: actorA });
    assert.equal(detail.response.status, 200);
    assert.equal(detail.body?.data?.header?.entityVersion, 3);
    assert.equal(detail.body?.data?.header?.productName, "WAFL alpha.25 Command 검증 제작 카드 수정");
    assert.ok(new Set(["26FW-A", "26FW-B"]).has(detail.body?.data?.header?.seasonCode));

    const listFirst = await requestJson(baseUrl, "/api/v2/work-orders?limit=50", { actor: actorA });
    assert.equal(listFirst.response.status, 200);
    assert.ok(listFirst.body?.data?.items?.some((item) => item.workOrderId === workOrderId));
    const firstIds = listFirst.body.data.items.map((item) => item.workOrderId);
    if (listFirst.body.data.nextCursor) {
      const listSecond = await requestJson(baseUrl, `/api/v2/work-orders?limit=50&cursor=${encodeURIComponent(listFirst.body.data.nextCursor)}`, { actor: actorA });
      assert.equal(listSecond.response.status, 200);
      const secondIds = listSecond.body.data.items.map((item) => item.workOrderId);
      assert.equal(firstIds.filter((id) => secondIds.includes(id)).length, 0);
    }

    const history = await requestJson(baseUrl, `/api/v2/work-orders/${workOrderId}/history?limit=10`, { actor: actorA });
    assert.equal(history.response.status, 200);
    assert.equal(history.body?.data?.items?.length, 3);
    assert.deepEqual(new Set(history.body.data.items.map((item) => item.commandCode)), new Set(["work_order.create_draft", "work_order.patch_basic_info"]));

    for (const routePath of [
      `materials?type=fabric`,
      "processes",
      "assets",
      "documents",
    ]) {
      const lazy = await requestJson(baseUrl, `/api/v2/work-orders/${workOrderId}/${routePath}`, { actor: actorA });
      assert.equal(lazy.response.status, 200);
      const collection = lazy.body?.data?.items ?? lazy.body?.data?.processes ?? [];
      assert.equal(collection.length, 0);
    }

    const after = await snapshotDatabase(client);
    assert.equal(after.schema_fingerprint, before.schema_fingerprint);
    assert.equal(Number(after.ledger_count), Number(before.ledger_count));
    assert.equal(Number(after.work_order_count), Number(before.work_order_count) + 1);
    assert.equal(Number(after.revision_count), Number(before.revision_count) + 1);
    assert.equal(Number(after.receipt_count), Number(before.receipt_count) + 1);
    assert.equal(Number(after.event_count), Number(before.event_count) + 3);
    for (const key of ["material_count", "process_count", "image_count", "document_count"]) {
      assert.equal(Number(after[key]), Number(before[key]), `${key} must not change`);
    }

    const metrics = {
      create: { dbMs: created.dbMs, apiMs: created.apiMs, statements: created.statementCount, transactions: created.transactionCount, payloadBytes: created.bytes },
      replay: { dbMs: replay.dbMs, apiMs: replay.apiMs, statements: replay.statementCount, transactions: replay.transactionCount, payloadBytes: replay.bytes },
      update: { dbMs: updated.dbMs, apiMs: updated.apiMs, statements: updated.statementCount, transactions: updated.transactionCount, payloadBytes: updated.bytes },
      idempotencyConflict: { apiMs: keyConflict.apiMs, payloadBytes: keyConflict.bytes },
      concurrencyWinner: { dbMs: winner?.dbMs ?? 0, apiMs: winner?.apiMs ?? 0, statements: winner?.statementCount ?? 0 },
      concurrencyConflict: { apiMs: loser?.apiMs ?? 0, payloadBytes: loser?.bytes ?? 0 },
    };
    console.log(`WAFL v2 alpha.25 Command runtime: version=${VERSION}`);
    console.log(`Dev/test target fingerprint: ${guard.fingerprint}`);
    console.log(`Command metrics (sanitized): ${JSON.stringify(metrics)}`);
    console.log("Created synthetic WorkOrders: 1");
    console.log("Updated synthetic WorkOrders: 1 unique row; 2 successful version transitions");
    console.log("Idempotency single effect/different payload conflict: PASS");
    console.log("Optimistic concurrency single winner: PASS");
    console.log("Tenant isolation and Company C FORBIDDEN: PASS");
    console.log("Revision immutability: PASS");
    console.log("Audit/history events: 3 PASS");
    console.log("Alpha.23/24 Read API regression: PASS");
    console.log("Cleanup/reset/rollback: NOT_RUN by policy");
    console.log("DB migration/schema/index mutation: false");
    console.log("Dev/Test DB test-data mutation: true; one retained alpha.25 synthetic WorkOrder/R0/receipt and three events");
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
  console.error("WAFL v2 alpha.25 Command runtime failed", {
    errorName: error instanceof Error ? error.name : "UnknownError",
    errorCode: error instanceof Error ? error.message.split(":", 1)[0] : "UNKNOWN",
  });
  process.exitCode = 1;
});
