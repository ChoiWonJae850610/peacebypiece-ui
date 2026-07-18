#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import process from "node:process";

import pg from "pg";

const { Client } = pg;
const VERSION = "2.0.0-alpha.46";
const REQUIRED_PREFIX = "wafl-fn";
const REQUIRED_CONFIRMATION = "EXECUTE WAFL V2 ALPHA46 QA DRAFT CREATE";
const REQUIRED_CREATE_APPROVAL = "2.0.0-alpha.25-dev-test-command-runtime";
const ALLOWED_RUNTIMES = new Set(["development", "dev", "local", "test", "demo"]);
const COMPANY_A = "wafl-fn-company-a";
const IDEMPOTENCY_KEY = "alpha46-qa-draft-a-create-v1";
const TARGET = Object.freeze({
  productName: "QA 기본정보 저장 검증 A - 저장 전",
  dueDate: "2026-09-29",
  totalQuantity: 136,
});

function fail(message) {
  throw new Error(message);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function databaseFingerprint(connectionString) {
  const parsed = new URL(connectionString);
  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
  if (!new Set(["postgres:", "postgresql:"]).has(parsed.protocol) || !parsed.hostname || !databaseName) fail("database-url-invalid");
  return sha256(`${parsed.hostname}/${databaseName}`).slice(0, 12);
}

function assertGuard() {
  const runtime = String(process.env.WAFL_V2_RUNTIME ?? "").trim().toLowerCase();
  const connectionString = process.env.DATABASE_URL?.trim();
  const approvedFingerprint = String(process.env.WAFL_V2_APPROVED_DB_FINGERPRINT ?? "").trim().toLowerCase();
  if (!ALLOWED_RUNTIMES.has(runtime)) fail("runtime-not-dev-test");
  if (!connectionString) fail("database-url-missing");
  if (String(process.env.WAFL_V2_TEST_PREFIX ?? "").trim() !== REQUIRED_PREFIX) fail("fixture-prefix-mismatch");
  if (process.env.WAFL_V2_CONFIRMATION !== REQUIRED_CONFIRMATION) fail("confirmation-mismatch");
  if (process.env.WAFL_V2_READ_API_ENABLED !== "1" || process.env.WAFL_V2_READ_APPROVED !== "1") fail("read-api-guard-missing");
  if (process.env.WAFL_V2_COMMAND_API_ENABLED !== "1") fail("command-api-disabled");
  if (process.env.WAFL_V2_COMMAND_MUTATION_APPROVED !== REQUIRED_CREATE_APPROVAL) fail("create-approval-mismatch");
  if (process.env.WAFL_EXTERNAL_QA_ALPHA46_BASIC_INFO_MUTATION_ENABLED) fail("external-alpha46-patch-flag-forbidden");
  const fingerprint = databaseFingerprint(connectionString);
  if (!approvedFingerprint || fingerprint !== approvedFingerprint) fail("db-fingerprint-mismatch");
  return { connectionString, fingerprint };
}

function sessionSecret() {
  const value = process.env.WAFL_SESSION_SECRET?.trim() || process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  if (!value) fail("session-secret-missing");
  return value;
}

function createSessionCookie(actor) {
  const payload = {
    userId: actor.userId,
    companyId: COMPANY_A,
    companyMemberId: actor.companyMemberId,
    companyName: "WAFL dev/test Company A",
    role: "company_admin",
    email: "alpha46-qa-draft-create@example.invalid",
    name: "WAFL alpha46 QA draft creator",
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
      if (response.status === 403) fail("next-server-runtime-guard-blocked");
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("next-server-")) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  fail("next-server-start-timeout");
}

async function readActor(client) {
  await client.query("BEGIN READ ONLY");
  try {
    const result = await client.query(`
      SELECT id, user_id FROM public.company_members
      WHERE company_id=$1 AND status='approved' AND user_id IS NOT NULL
      ORDER BY created_at,id LIMIT 1
    `, [COMPANY_A]);
    await client.query("COMMIT");
    const row = result.rows[0];
    if (!row?.id || !row?.user_id) fail("company-a-approved-actor-missing");
    return { companyMemberId: String(row.id), userId: String(row.user_id) };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function snapshot(client) {
  await client.query("BEGIN READ ONLY");
  try {
    const totals = await client.query(`
      SELECT
        (SELECT count(*)::integer FROM public.wafl_v2_migration_ledger) AS ledger,
        (SELECT count(*)::integer FROM public.work_orders) AS work_orders,
        (SELECT count(*)::integer FROM public.work_order_revisions) AS revisions,
        (SELECT count(*)::integer FROM public.work_order_command_receipts) AS receipts,
        (SELECT count(*)::integer FROM public.domain_events) AS events,
        (SELECT count(*)::integer FROM public.generated_documents) AS documents,
        (SELECT count(*)::integer FROM public.document_access_tokens) AS tokens
    `);
    const targets = await client.query(`
      SELECT w.id,w.current_revision_id,w.status,w.entity_version,
             w.product_name,w.due_date::text,w.total_quantity,
             r.revision_status,r.entity_version AS revision_version,
             (SELECT count(*)::integer FROM public.generated_documents d
               WHERE d.company_id=w.company_id AND d.work_order_id=w.id) AS document_count,
             (SELECT count(*)::integer FROM public.document_access_tokens t
               JOIN public.generated_documents d ON d.company_id=t.company_id AND d.id=t.generated_document_id
               WHERE d.company_id=w.company_id AND d.work_order_id=w.id) AS token_count,
             (SELECT count(*)::integer FROM public.work_order_images i
               WHERE i.company_id=w.company_id AND i.work_order_id=w.id AND i.deleted_at IS NULL) AS image_count,
             (SELECT count(*)::integer FROM public.work_order_attachments a
               WHERE a.company_id=w.company_id AND a.work_order_id=w.id AND a.deleted_at IS NULL) AS attachment_count
      FROM public.work_orders w
      JOIN public.work_order_revisions r ON r.company_id=w.company_id AND r.id=w.current_revision_id
      WHERE w.company_id=$1 AND w.product_name=$2 AND w.due_date=$3::date
        AND w.total_quantity=$4 AND w.deleted_at IS NULL
      ORDER BY w.created_at,w.id
    `, [COMPANY_A, TARGET.productName, TARGET.dueDate, TARGET.totalQuantity]);
    await client.query("COMMIT");
    return {
      totals: Object.fromEntries(Object.entries(totals.rows[0] ?? {}).map(([key, value]) => [key, Number(value)])),
      targets: targets.rows,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function createExactlyOnce(baseUrl, actor) {
  const response = await fetch(`${baseUrl}/api/v2/work-orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": IDEMPOTENCY_KEY,
      Cookie: createSessionCookie(actor),
    },
    body: JSON.stringify({
      clientRequestId: "alpha46-qa-draft-a-create-v1",
      ...TARGET,
    }),
    redirect: "manual",
  });
  const body = await response.json().catch(() => null);
  assert.equal(response.status, 201, "qa-draft-create-status-must-be-201");
  assert.equal(body?.ok, true);
  assert.equal(body?.data?.nextVersion, 1);
  assert.equal(response.headers.get("x-wafl-idempotent-replay"), "0");
  assert.equal(body?.data?.result?.status, "draft");
  assert.equal(body?.data?.result?.revisionStatus, "draft");
}

function assertDelta(before, after) {
  assert.equal(before.totals.ledger, 12);
  assert.equal(after.totals.ledger, 12);
  assert.equal(before.targets.length, 0, "qa-draft-a-must-not-exist-before-create");
  assert.equal(after.targets.length, 1, "qa-draft-a-must-exist-exactly-once");
  assert.equal(after.totals.work_orders, before.totals.work_orders + 1);
  assert.equal(after.totals.revisions, before.totals.revisions + 1);
  assert.equal(after.totals.receipts, before.totals.receipts + 1);
  assert.equal(after.totals.events, before.totals.events + 1);
  assert.equal(after.totals.documents, before.totals.documents);
  assert.equal(after.totals.tokens, before.totals.tokens);
  const target = after.targets[0];
  assert.equal(target.status, "draft");
  assert.equal(target.revision_status, "draft");
  assert.equal(Number(target.entity_version), 1);
  assert.equal(Number(target.revision_version), 1);
  assert.equal(target.product_name, TARGET.productName);
  assert.equal(target.due_date, TARGET.dueDate);
  assert.equal(Number(target.total_quantity), TARGET.totalQuantity);
  assert.equal(Number(target.document_count), 0);
  assert.equal(Number(target.token_count), 0);
  assert.equal(Number(target.image_count), 0);
  assert.equal(Number(target.attachment_count), 0);
}

async function run() {
  const guard = assertGuard();
  const client = new Client({ connectionString: guard.connectionString, application_name: "wafl-v2-alpha46-qa-draft-create" });
  await client.connect();
  let child;
  try {
    const actor = await readActor(client);
    const before = await snapshot(client);
    assert.equal(before.targets.length, 0, "qa-draft-a-already-exists");

    const port = await getFreePort();
    const baseUrl = `http://127.0.0.1:${port}`;
    child = spawn(process.execPath, [path.join("node_modules", "next", "dist", "bin", "next"), "start", "-H", "127.0.0.1", "-p", String(port)], {
      cwd: process.cwd(),
      env: { ...process.env, PORT: String(port) },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    await waitForServer(baseUrl, child);
    await createExactlyOnce(baseUrl, actor);
    if (child.exitCode === null) {
      child.kill();
      await new Promise((resolve) => child.once("exit", resolve));
    }
    child = undefined;

    const after = await snapshot(client);
    assertDelta(before, after);
    console.log(`WAFL v2 alpha.46 QA draft create: ${VERSION}`);
    console.log("Target alias: QA_DRAFT_A");
    console.log(`Approved dev/test fingerprint prefix: ${guard.fingerprint.slice(0, 6)}`);
    console.log(`Created values: ${TARGET.productName} / ${TARGET.dueDate} / ${TARGET.totalQuantity}`);
    console.log("Delta: WorkOrder +1 / revision +1 / receipt +1 / event +1");
    console.log("Generated document/token/R2 delta: 0/0/0");
    console.log("Cleanup/rollback/delete: 0/0/0");
    console.log("Production mutation: 0");
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
  console.error("WAFL v2 alpha.46 QA draft create failed", {
    errorName: error instanceof Error ? error.name : "UnknownError",
    errorCode: error instanceof Error ? error.message.split(":", 1)[0] : "UNKNOWN",
  });
  process.exitCode = 1;
});
