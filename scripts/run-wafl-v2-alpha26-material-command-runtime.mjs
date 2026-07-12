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
const REQUIRED_CONFIRMATION = "EXECUTE WAFL V2 ALPHA26 MATERIAL COMMAND RUNTIME";
const REQUIRED_MUTATION_APPROVAL = "2.0.0-alpha.26-dev-test-material-command-runtime";
const ALLOWED_RUNTIMES = new Set(["development", "dev", "local", "test", "demo"]);
const COMPANY_A = "wafl-fn-company-a";
const COMPANY_B = "wafl-fn-company-b";
const COMPANY_C = "wafl-fn-company-c";
const COMPANY_H = "wafl-fn-company-h";
const COMMAND_CODES = [
  "work_order.material.create",
  "work_order.material.order_request",
  "work_order.material.order_cancel",
  "work_order.material.order_complete",
];

let currentStep = { number: 0, name: "startup", phase: "read-only" };
let lastSuccessfulStep = { number: 0, name: "none" };
let lastHttpObservation = { status: null, typedErrorCode: null, resourceRef: "none" };
let committedMutationObserved = false;

function fail(message) { throw new Error(message); }
function sha256(value) { return crypto.createHash("sha256").update(value).digest("hex"); }

function beginStep(number, name, phase) {
  currentStep = { number, name, phase };
}

function safeResourceRef(routePath) {
  return `route-${sha256(routePath).slice(0, 12)}`;
}

function sanitizeAssertionValue(value) {
  if (value === null || value === undefined || typeof value === "boolean" || typeof value === "number") return value;
  if (typeof value === "string") {
    if (/^[A-Z][A-Z0-9_]{1,63}$/.test(value)) return value;
    return `string:${value.length}:sha256-${sha256(value).slice(0, 12)}`;
  }
  if (Array.isArray(value)) return { type: "array", count: value.length };
  return { type: typeof value, keys: typeof value === "object" ? Object.keys(value).sort().slice(0, 8) : [] };
}

function runnerLocation(stack) {
  const match = String(stack ?? "").match(/run-wafl-v2-alpha26-material-command-runtime\.mjs:(\d+):(\d+)/);
  return match ? `run-wafl-v2-alpha26-material-command-runtime.mjs:${match[1]}:${match[2]}` : "run-wafl-v2-alpha26-material-command-runtime.mjs:unknown";
}

function checkpoint(name, details = {}) {
  if (currentStep.phase === "mutation") committedMutationObserved = true;
  lastSuccessfulStep = { number: currentStep.number, name };
  console.log(JSON.stringify({
    type: "alpha26-mutation-checkpoint",
    stepNumber: currentStep.number,
    stepName: name,
    phase: currentStep.phase,
    ...details,
  }));
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
  if (process.env.WAFL_V2_READ_APPROVED !== "1" || process.env.WAFL_V2_READ_API_ENABLED !== "1") fail("read-api-guard-missing");
  if (process.env.WAFL_V2_COMMAND_API_ENABLED !== "1") fail("command-api-disabled");
  if (process.env.WAFL_V2_CONFIRMATION !== REQUIRED_CONFIRMATION) fail("confirmation-mismatch");
  if (process.env.WAFL_V2_COMMAND_MUTATION_APPROVED !== REQUIRED_MUTATION_APPROVAL) fail("mutation-approval-mismatch");
  const identity = databaseIdentity(connectionString);
  if (!approvedFingerprint || approvedFingerprint !== identity.fingerprint) fail("db-fingerprint-mismatch");
  return { connectionString, fingerprint: identity.fingerprint };
}

function sessionSecret() {
  const value = process.env.WAFL_SESSION_SECRET?.trim() || process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  if (!value) fail("session-secret-missing");
  return value;
}

function createSessionCookie(actor) {
  const payload = {
    userId: actor.userId,
    companyId: actor.companyId,
    companyMemberId: actor.companyMemberId,
    companyName: "WAFL synthetic runtime company",
    role: "company_admin",
    email: `${actor.userId}@example.invalid`,
    name: "WAFL alpha26 runtime",
    issuedAt: new Date().toISOString(),
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = crypto.createHmac("sha256", sessionSecret()).update(encoded).digest("base64url");
  return `wafl_auth_session=${encoded}.${signature}`;
}

function scopedReceiptHash(commandCode, actor, rawKey) {
  return sha256([commandCode, actor.companyId, actor.companyMemberId, rawKey].join("\0"));
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

async function readRuntimeContext(client) {
  await client.query("BEGIN READ ONLY");
  try {
    const actor = await client.query(`
      SELECT id AS company_member_id, user_id
      FROM company_members
      WHERE company_id = $1 AND status = 'approved'
      ORDER BY created_at, id
      LIMIT 1
    `, [COMPANY_A]);
    const target = await client.query(`
      SELECT w.id, w.current_revision_id, w.entity_version, r.revision_no
      FROM work_orders w
      JOIN work_order_revisions r ON r.company_id = w.company_id AND r.id = w.current_revision_id
      WHERE w.company_id = $1 AND w.status = 'draft' AND r.revision_status = 'draft'
        AND EXISTS (
          SELECT 1 FROM domain_events e
          WHERE e.company_id = w.company_id AND e.entity_type = 'work_order'
            AND e.entity_id = w.id::text AND e.command_code = 'work_order.create_draft'
        )
        AND NOT EXISTS (
          SELECT 1 FROM work_order_material_lines m
          WHERE m.company_id = w.company_id AND m.revision_id = r.id
        )
      ORDER BY w.created_at DESC, w.id DESC
      LIMIT 1
    `, [COMPANY_A]);
    const suppliers = await client.query(`
      SELECT DISTINCT ON (company_id) company_id, id
      FROM partners
      WHERE company_id IN ($1, $2) AND COALESCE(is_active, true) = true
      ORDER BY company_id, created_at, id
    `, [COMPANY_A, COMPANY_B]);
    const finalized = await client.query(`
      SELECT w.id AS work_order_id, m.id AS material_line_id, w.entity_version
      FROM work_orders w
      JOIN work_order_revisions r ON r.company_id = w.company_id AND r.id = w.current_revision_id
      JOIN work_order_material_lines m ON m.company_id = w.company_id AND m.revision_id = r.id
      WHERE w.company_id = $1 AND r.revision_status = 'finalized'
      ORDER BY w.created_at, m.display_order, m.id
      LIMIT 1
    `, [COMPANY_A]);
    await client.query("COMMIT");
    if (!actor.rows[0] || !target.rows[0] || !finalized.rows[0]) fail("runtime-fixture-missing");
    const supplierA = suppliers.rows.find((row) => row.company_id === COMPANY_A)?.id;
    const supplierB = suppliers.rows.find((row) => row.company_id === COMPANY_B)?.id;
    if (!supplierA || !supplierB) fail("runtime-supplier-fixture-missing");
    return {
      actorA: { companyId: COMPANY_A, companyMemberId: actor.rows[0].company_member_id, userId: actor.rows[0].user_id },
      target: target.rows[0],
      supplierA,
      supplierB,
      finalized: finalized.rows[0],
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function snapshotDatabase(client) {
  await client.query("BEGIN READ ONLY");
  try {
    const rows = await client.query(`
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
    return { ...rows.rows[0], schema_fingerprint: schema.rows[0]?.fingerprint ?? null };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function assertOneShotState(client, actor, revisionId) {
  await client.query("BEGIN READ ONLY");
  try {
    const receipts = await client.query(`
      SELECT count(*)::integer AS count
      FROM work_order_command_receipts
      WHERE company_id = $1 AND command_code = ANY($2::text[])
        AND idempotency_key = ANY($3::text[])
    `, [
      actor.companyId,
      COMMAND_CODES,
      [
        scopedReceiptHash("work_order.material.create", actor, "alpha26-fabric-primary-v1"),
        scopedReceiptHash("work_order.material.create", actor, "alpha26-accessory-primary-v1"),
        scopedReceiptHash("work_order.material.create", actor, "alpha26-fabric-race-v1"),
      ],
    ]);
    const lines = await client.query(`
      SELECT count(*)::integer AS count
      FROM work_order_material_lines
      WHERE company_id = $1 AND revision_id = $2::uuid
    `, [actor.companyId, revisionId]);
    await client.query("COMMIT");
    assert.equal(Number(receipts.rows[0]?.count), 0, "alpha.26 deterministic receipts must be absent before the approved run");
    assert.equal(Number(lines.rows[0]?.count), 0, "alpha.25 retained target must have no material lines before alpha.26 runtime");
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
  lastHttpObservation = {
    status: response.status,
    typedErrorCode: typeof body?.error?.code === "string" ? body.error.code : null,
    resourceRef: safeResourceRef(routePath),
  };
  return {
    response,
    body,
    apiMs: Number((performance.now() - startedAt).toFixed(2)),
    dbMs: Number(response.headers.get("X-WAFL-Command-DB-Ms") ?? 0),
    statementCount: Number(response.headers.get("X-WAFL-Command-Statement-Count") ?? 0),
    transactionCount: Number(response.headers.get("X-WAFL-Command-Transaction-Count") ?? 0),
    replay: response.headers.get("X-WAFL-Idempotent-Replay") === "1",
    bytes: Buffer.byteLength(text),
  };
}

function headers(key) {
  return { "Content-Type": "application/json", "Idempotency-Key": key };
}

function assertTypedError(result, status, code) {
  assert.equal(result.response.status, status);
  assert.equal(result.body?.ok, false);
  assert.equal(result.body?.error?.code, code);
  assert.equal(typeof result.body?.error?.message, "string");
  assert.equal(typeof result.body?.error?.correlationId, "string");
}

function materialBody(input) {
  return {
    clientRequestId: input.clientRequestId,
    expectedVersion: input.expectedVersion,
    materialType: input.materialType,
    name: input.name,
    partnerId: input.partnerId,
    colorOption: input.colorOption,
    requiredQuantity: input.requiredQuantity,
    allowanceQuantity: input.allowanceQuantity,
    inventoryUsageQuantity: "0",
    orderQuantity: input.orderQuantity,
    unitCode: input.unitCode,
    unitPrice: input.unitPrice,
    memo: "approved dev/test synthetic material command",
  };
}

async function run() {
  beginStep(1, "runtime-preconditions", "read-only");
  const guard = assertGuard();
  const client = new Client({ connectionString: guard.connectionString });
  await client.connect();
  let child;
  try {
    const context = await readRuntimeContext(client);
    const actorA = context.actorA;
    const actorB = { companyId: COMPANY_B, companyMemberId: "alpha26-cross-company-b", userId: "alpha26-cross-company-b" };
    const actorC = { companyId: COMPANY_C, companyMemberId: "alpha26-blocked-company-c", userId: "alpha26-blocked-company-c" };
    const actorH = { companyId: COMPANY_H, companyMemberId: "alpha26-cross-company-h", userId: "alpha26-cross-company-h" };
    await assertOneShotState(client, actorA, context.target.current_revision_id);
    const before = await snapshotDatabase(client);
    assert.equal(Number(before.ledger_count), 7);
    checkpoint("runtime-preconditions-complete", { ledgerCount: Number(before.ledger_count) });

    const port = await getFreePort();
    const baseUrl = `http://127.0.0.1:${port}`;
    child = spawn(process.execPath, [path.join("node_modules", "next", "dist", "bin", "next"), "start", "-H", "127.0.0.1", "-p", String(port)], {
      cwd: process.cwd(), env: { ...process.env, PORT: String(port) }, stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
    });
    await waitForServer(baseUrl, child);

    const workOrderId = context.target.id;
    const materialPath = `/api/v2/work-orders/${workOrderId}/materials`;
    let version = Number(context.target.entity_version);
    const metrics = {};

    beginStep(2, "fabric-create", "mutation");
    const fabricBody = materialBody({
      clientRequestId: "alpha26-create-fabric-primary", expectedVersion: version,
      materialType: "fabric", name: "alpha26 검증 원단", partnerId: context.supplierA,
      colorOption: "NAVY", requiredQuantity: "120.000", allowanceQuantity: "6.000",
      orderQuantity: "126.000", unitCode: "yd", unitPrice: "4800.00",
    });
    const fabric = await requestJson(baseUrl, materialPath, {
      actor: actorA, method: "POST", headers: headers("alpha26-fabric-primary-v1"), body: fabricBody,
    });
    assert.equal(fabric.response.status, 201);
    assert.equal(fabric.body?.data?.result?.materialType, "fabric");
    assert.equal(fabric.body?.data?.result?.status, "editing");
    assert.equal(fabric.body?.data?.nextVersion, ++version);
    assert.equal(fabric.transactionCount, 1);
    const fabricId = fabric.body.data.result.materialLineId;
    metrics.fabricCreate = fabric;
    checkpoint("fabric-create-complete", { createdCount: 1, nextVersion: version, httpStatus: fabric.response.status });

    const fabricReplay = await requestJson(baseUrl, materialPath, {
      actor: actorA, method: "POST", headers: headers("alpha26-fabric-primary-v1"), body: fabricBody,
    });
    assert.equal(fabricReplay.response.status, 200);
    assert.equal(fabricReplay.body?.data?.result?.materialLineId, fabricId);
    assert.equal(fabricReplay.replay, true);
    metrics.createReplay = fabricReplay;
    const fabricKeyConflict = await requestJson(baseUrl, materialPath, {
      actor: actorA, method: "POST", headers: headers("alpha26-fabric-primary-v1"),
      body: { ...fabricBody, name: "동일 key 다른 원단" },
    });
    assertTypedError(fabricKeyConflict, 409, "CONFLICT");

    beginStep(3, "accessory-create", "mutation");
    const accessory = await requestJson(baseUrl, materialPath, {
      actor: actorA, method: "POST", headers: headers("alpha26-accessory-primary-v1"),
      body: materialBody({
        clientRequestId: "alpha26-create-accessory", expectedVersion: version,
        materialType: "accessory", name: "alpha26 검증 지퍼", partnerId: context.supplierA,
        colorOption: "SILVER", requiredQuantity: "120.000", allowanceQuantity: "4.000",
        orderQuantity: "124.000", unitCode: "ea", unitPrice: "850.00",
      }),
    });
    assert.equal(accessory.response.status, 201);
    assert.equal(accessory.body?.data?.nextVersion, ++version);
    const accessoryId = accessory.body.data.result.materialLineId;
    metrics.accessoryCreate = accessory;
    checkpoint("accessory-create-complete", { createdCount: 1, nextVersion: version, httpStatus: accessory.response.status });

    const raceFabric = await requestJson(baseUrl, materialPath, {
      actor: actorA, method: "POST", headers: headers("alpha26-fabric-race-v1"),
      body: materialBody({
        clientRequestId: "alpha26-create-fabric-race", expectedVersion: version,
        materialType: "fabric", name: "alpha26 경쟁 검증 원단", partnerId: context.supplierA,
        colorOption: "BLACK", requiredQuantity: "60.000", allowanceQuantity: "3.000",
        orderQuantity: "63.000", unitCode: "yd", unitPrice: "5200.00",
      }),
    });
    assert.equal(raceFabric.response.status, 201);
    assert.equal(raceFabric.body?.data?.nextVersion, ++version);
    const raceFabricId = raceFabric.body.data.result.materialLineId;

    beginStep(4, "scalar-patch", "mutation");
    const patchFabric = await requestJson(baseUrl, `${materialPath}/${fabricId}`, {
      actor: actorA, method: "PATCH", headers: { "Content-Type": "application/json" },
      body: { clientRequestId: "alpha26-patch-fabric", expectedVersion: version, patch: { unitPrice: "5000.00", memo: "원단 수정 검증" } },
    });
    assert.equal(patchFabric.response.status, 200);
    assert.equal(patchFabric.body?.data?.nextVersion, ++version);
    metrics.materialPatch = patchFabric;
    checkpoint("scalar-patch-complete", { successCount: 1, nextVersion: version, httpStatus: patchFabric.response.status });

    beginStep(5, "patch-concurrency", "mutation");
    const patchRace = await Promise.all([
      requestJson(baseUrl, `${materialPath}/${accessoryId}`, {
        actor: actorA, method: "PATCH", headers: { "Content-Type": "application/json" },
        body: { clientRequestId: "alpha26-patch-race-a", expectedVersion: version, patch: { colorOption: "ANTIQUE-SILVER" } },
      }),
      requestJson(baseUrl, `${materialPath}/${accessoryId}`, {
        actor: actorA, method: "PATCH", headers: { "Content-Type": "application/json" },
        body: { clientRequestId: "alpha26-patch-race-b", expectedVersion: version, patch: { colorOption: "MATTE-SILVER" } },
      }),
    ]);
    assert.equal(patchRace.filter((item) => item.response.status === 200).length, 1);
    assert.equal(patchRace.filter((item) => item.response.status === 409 && item.body?.error?.code === "CONFLICT").length, 1);
    version += 1;
    checkpoint("patch-concurrency-complete", { winnerCount: 1, conflictCount: 1, nextVersion: version });

    const crossSupplier = await requestJson(baseUrl, `${materialPath}/${raceFabricId}`, {
      actor: actorA, method: "PATCH", headers: { "Content-Type": "application/json" },
      body: { clientRequestId: "alpha26-cross-supplier", expectedVersion: version, patch: { partnerId: context.supplierB } },
    });
    assertTypedError(crossSupplier, 404, "NOT_FOUND");

    beginStep(6, "order-request", "mutation");
    const requestFabric = await requestJson(baseUrl, `${materialPath}/${fabricId}/order-request`, {
      actor: actorA, method: "POST", headers: headers("alpha26-request-fabric-v1"),
      body: { clientRequestId: "alpha26-request-fabric", expectedVersion: version },
    });
    assert.equal(requestFabric.response.status, 200);
    assert.equal(requestFabric.body?.data?.result?.status, "requested");
    assert.equal(requestFabric.body?.data?.nextVersion, ++version);
    metrics.orderRequest = requestFabric;
    checkpoint("order-request-complete", { successCount: 1, nextVersion: version, httpStatus: requestFabric.response.status });

    beginStep(7, "order-cancel", "mutation");
    const cancelFabric = await requestJson(baseUrl, `${materialPath}/${fabricId}/order-cancel`, {
      actor: actorA, method: "POST", headers: headers("alpha26-cancel-fabric-v1"),
      body: { clientRequestId: "alpha26-cancel-fabric", expectedVersion: version, reason: "검증용 요청 취소" },
    });
    assert.equal(cancelFabric.response.status, 200);
    assert.equal(cancelFabric.body?.data?.result?.status, "cancelled");
    assert.equal(cancelFabric.body?.data?.nextVersion, ++version);
    metrics.orderCancel = cancelFabric;
    checkpoint("order-cancel-complete", { successCount: 1, nextVersion: version, httpStatus: cancelFabric.response.status });

    const requestRace = await Promise.all([
      requestJson(baseUrl, `${materialPath}/${accessoryId}/order-request`, {
        actor: actorA, method: "POST", headers: headers("alpha26-request-accessory-race-a"),
        body: { clientRequestId: "alpha26-request-accessory-a", expectedVersion: version },
      }),
      requestJson(baseUrl, `${materialPath}/${accessoryId}/order-request`, {
        actor: actorA, method: "POST", headers: headers("alpha26-request-accessory-race-b"),
        body: { clientRequestId: "alpha26-request-accessory-b", expectedVersion: version },
      }),
    ]);
    assert.equal(requestRace.filter((item) => item.response.status === 200).length, 1);
    assert.equal(requestRace.filter((item) => item.response.status === 409 && item.body?.error?.code === "CONFLICT").length, 1);
    version += 1;

    beginStep(8, "order-complete", "mutation");
    const completeAccessory = await requestJson(baseUrl, `${materialPath}/${accessoryId}/order-complete`, {
      actor: actorA, method: "POST", headers: headers("alpha26-complete-accessory-v1"),
      body: { clientRequestId: "alpha26-complete-accessory", expectedVersion: version },
    });
    assert.equal(completeAccessory.response.status, 200);
    assert.equal(completeAccessory.body?.data?.result?.status, "completed");
    assert.equal(completeAccessory.body?.data?.nextVersion, ++version);
    metrics.orderComplete = completeAccessory;
    checkpoint("order-complete-complete", { successCount: 1, nextVersion: version, httpStatus: completeAccessory.response.status });
    const completeReplay = await requestJson(baseUrl, `${materialPath}/${accessoryId}/order-complete`, {
      actor: actorA, method: "POST", headers: headers("alpha26-complete-accessory-v1"),
      body: { clientRequestId: "alpha26-complete-accessory-replay", expectedVersion: version - 1 },
    });
    assert.equal(completeReplay.response.status, 200);
    assert.equal(completeReplay.replay, true);
    const completeConflict = await requestJson(baseUrl, `${materialPath}/${accessoryId}/order-complete`, {
      actor: actorA, method: "POST", headers: headers("alpha26-complete-accessory-v1"),
      body: { clientRequestId: "alpha26-complete-accessory-conflict", expectedVersion: version },
    });
    assertTypedError(completeConflict, 409, "CONFLICT");
    const completedPatch = await requestJson(baseUrl, `${materialPath}/${accessoryId}`, {
      actor: actorA, method: "PATCH", headers: { "Content-Type": "application/json" },
      body: { clientRequestId: "alpha26-completed-patch", expectedVersion: version, patch: { unitPrice: "900.00" } },
    });
    assertTypedError(completedPatch, 409, "LOCKED");

    const directComplete = await requestJson(baseUrl, `${materialPath}/${raceFabricId}/order-complete`, {
      actor: actorA, method: "POST", headers: headers("alpha26-direct-complete-block"),
      body: { clientRequestId: "alpha26-direct-complete", expectedVersion: version },
    });
    assertTypedError(directComplete, 409, "INVALID_STATE_TRANSITION");

    const requestRaceFabric = await requestJson(baseUrl, `${materialPath}/${raceFabricId}/order-request`, {
      actor: actorA, method: "POST", headers: headers("alpha26-request-race-fabric-v1"),
      body: { clientRequestId: "alpha26-request-race-fabric", expectedVersion: version },
    });
    assert.equal(requestRaceFabric.response.status, 200);
    assert.equal(requestRaceFabric.body?.data?.nextVersion, ++version);

    const terminalRace = await Promise.all([
      requestJson(baseUrl, `${materialPath}/${raceFabricId}/order-cancel`, {
        actor: actorA, method: "POST", headers: headers("alpha26-terminal-cancel-v1"),
        body: { clientRequestId: "alpha26-terminal-cancel", expectedVersion: version, reason: "경쟁 취소" },
      }),
      requestJson(baseUrl, `${materialPath}/${raceFabricId}/order-complete`, {
        actor: actorA, method: "POST", headers: headers("alpha26-terminal-complete-v1"),
        body: { clientRequestId: "alpha26-terminal-complete", expectedVersion: version },
      }),
    ]);
    assert.equal(terminalRace.filter((item) => item.response.status === 200).length, 1);
    assert.equal(terminalRace.filter((item) => item.response.status === 409 && item.body?.error?.code === "CONFLICT").length, 1);
    const terminalWinner = terminalRace.find((item) => item.response.status === 200);
    version += 1;

    beginStep(9, "tenant-isolation", "read-only-validation");
    for (const actor of [actorB, actorH]) {
      const crossTenant = await requestJson(baseUrl, `${materialPath}/${fabricId}`, {
        actor, method: "PATCH", headers: { "Content-Type": "application/json" },
        body: { clientRequestId: `alpha26-cross-${actor.companyId}`, expectedVersion: version, patch: { memo: "blocked" } },
      });
      assertTypedError(crossTenant, 404, "NOT_FOUND");
    }
    const companyC = await requestJson(baseUrl, `${materialPath}/${fabricId}`, {
      actor: actorC, method: "PATCH", headers: { "Content-Type": "application/json" },
      body: { clientRequestId: "alpha26-company-c", expectedVersion: version, patch: { memo: "blocked" } },
    });
    assertTypedError(companyC, 403, "FORBIDDEN");
    checkpoint("tenant-isolation-complete", { crossCompanyNotFoundCount: 2, forbiddenCount: 1 });

    beginStep(10, "finalized-fixture", "read-only-validation");
    const finalized = await requestJson(baseUrl, `/api/v2/work-orders/${context.finalized.work_order_id}/materials/${context.finalized.material_line_id}`, {
      actor: actorA, method: "PATCH", headers: { "Content-Type": "application/json" },
      body: { clientRequestId: "alpha26-finalized", expectedVersion: Number(context.finalized.entity_version), patch: { memo: "blocked" } },
    });
    assertTypedError(finalized, 409, "LOCKED");
    checkpoint("finalized-fixture-complete", { httpStatus: finalized.response.status, typedErrorCode: finalized.body?.error?.code });

    beginStep(11, "read-regression", "read-only-validation");
    const fabricRead = await requestJson(baseUrl, `${materialPath}?type=fabric&limit=10`, { actor: actorA });
    const accessoryRead = await requestJson(baseUrl, `${materialPath}?type=accessory&limit=10`, { actor: actorA });
    assert.equal(fabricRead.response.status, 200);
    assert.equal(accessoryRead.response.status, 200);
    assert.equal(fabricRead.body?.data?.items?.length, 2);
    assert.equal(accessoryRead.body?.data?.items?.length, 1);
    assert.equal(accessoryRead.body?.data?.items?.[0]?.status, "completed");
    const detail = await requestJson(baseUrl, `/api/v2/work-orders/${workOrderId}`, { actor: actorA });
    assert.equal(detail.response.status, 200);
    assert.equal(detail.body?.data?.header?.entityVersion, version);
    const history = await requestJson(baseUrl, `/api/v2/work-orders/${workOrderId}/history?limit=30`, { actor: actorA });
    assert.equal(history.response.status, 200);
    const materialEvents = history.body?.data?.items?.filter((item) => item.commandCode.startsWith("work_order.material.")) ?? [];
    assert.equal(materialEvents.length, 11);
    assert.equal((await requestJson(baseUrl, "/api/v2/work-orders?limit=50", { actor: actorA })).response.status, 200);
    for (const lazyRoute of ["processes", "assets", "documents", "size-color", "size-spec"]) {
      assert.equal((await requestJson(baseUrl, `/api/v2/work-orders/${workOrderId}/${lazyRoute}`, { actor: actorA })).response.status, 200);
    }
    checkpoint("read-regression-complete", { materialEventCount: materialEvents.length, lazyRouteCount: 5 });

    beginStep(12, "final-ledger", "read-only-validation");
    const after = await snapshotDatabase(client);
    assert.equal(after.schema_fingerprint, before.schema_fingerprint);
    assert.equal(Number(after.ledger_count), Number(before.ledger_count));
    assert.equal(Number(after.work_order_count), Number(before.work_order_count));
    assert.equal(Number(after.revision_count), Number(before.revision_count));
    assert.equal(Number(after.fabric_count), Number(before.fabric_count) + 2);
    assert.equal(Number(after.accessory_count), Number(before.accessory_count) + 1);
    assert.equal(Number(after.receipt_count), Number(before.receipt_count) + 9);
    assert.equal(Number(after.event_count), Number(before.event_count) + 11);
    assert.equal(version, Number(context.target.entity_version) + 11);
    checkpoint("final-ledger-complete", { ledgerCount: Number(after.ledger_count), fabricDelta: 2, accessoryDelta: 1, receiptDelta: 9, eventDelta: 11, versionDelta: 11 });

    const sanitizedMetrics = Object.fromEntries(Object.entries(metrics).map(([key, value]) => [key, {
      dbMs: value.dbMs, apiMs: value.apiMs, statements: value.statementCount,
      transactions: value.transactionCount, payloadBytes: value.bytes,
    }]));
    const terminalStatus = terminalWinner?.body?.data?.result?.status;
    console.log(`WAFL v2 alpha.26 Material Command runtime: version=${VERSION}`);
    console.log(`Dev/test target fingerprint: ${guard.fingerprint}`);
    console.log(`Material command metrics (sanitized): ${JSON.stringify(sanitizedMetrics)}`);
    console.log("Reused WorkOrder/revision: one retained alpha.25 Company A synthetic draft/R0");
    console.log("Created material lines: fabric 2; accessory 1");
    console.log("Successful material patches: 2; delete/deactivate: 0");
    console.log("Successful order requests: 3; base cancels: 1; base completes: 1; terminal race winner: 1");
    console.log(`Terminal cancel-vs-complete winner status: ${terminalStatus}`);
    console.log("Idempotency create/complete replay and payload conflict: PASS");
    console.log("Optimistic concurrency patch/request/terminal single winner: PASS");
    console.log("Tenant and supplier isolation; Company C FORBIDDEN: PASS");
    console.log("Finalized/completed revision and completed-line lock: PASS");
    console.log("Audit/history events: 11 PASS");
    console.log("Alpha.23/24/25 Read and invalid-command regression: PASS");
    console.log("Mutation ledger: WorkOrder +0; revision +0; fabric +2; accessory +1; receipt +9; event +11; version transitions +11");
    console.log("Cleanup/reset/rollback: NOT_RUN by policy");
    console.log("DB migration/schema/index mutation: false");
    console.log("Dev/Test DB test-data mutation: true; three retained alpha.26 synthetic material lines, nine receipts and eleven events");
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
  const isAssertion = error?.code === "ERR_ASSERTION";
  console.error("WAFL v2 alpha.26 Material Command runtime failed", {
    errorName: error instanceof Error ? error.name : "UnknownError",
    errorCode: error instanceof Error ? error.message.split(":", 1)[0] : "UNKNOWN",
    stepName: currentStep.name,
    stepNumber: currentStep.number,
    assertionKind: isAssertion ? (error.operator ?? "assertion") : "runtime-error",
    expected: isAssertion ? sanitizeAssertionValue(error.expected) : "not-applicable",
    actual: isAssertion ? sanitizeAssertionValue(error.actual) : "not-applicable",
    httpStatus: lastHttpObservation.status,
    typedErrorCode: lastHttpObservation.typedErrorCode,
    resourceRef: lastHttpObservation.resourceRef,
    lastSuccessfulStep,
    phase: currentStep.phase,
    runnerLocation: runnerLocation(error?.stack),
  });
  console.error("Current migration ledger count: unknown");
  console.error("Schema mutation this run: false");
  console.error(`Dev/Test DB test-data mutation this run: ${committedMutationObserved ? "true" : "false"}`);
  process.exitCode = 1;
});
