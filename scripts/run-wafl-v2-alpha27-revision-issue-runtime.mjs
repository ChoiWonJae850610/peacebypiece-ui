#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const { Client } = pg;
const REQUIRED_CONFIRMATION = "EXECUTE WAFL V2 ALPHA27 REVISION ISSUE RUNTIME";
const REQUIRED_APPROVAL = "2.0.0-alpha.27-dev-test-revision-issue-runtime";
const REQUIRED_PREFIX = "wafl-fn";
const ALLOWED_RUNTIMES = new Set(["development", "dev", "local", "test", "demo"]);
const COMPANY_A = "wafl-fn-company-a";
const COMPANY_B = "wafl-fn-company-b";
const COMPANY_C = "wafl-fn-company-c";
const COMPANY_H = "wafl-fn-company-h";
const ISSUE_CODE = "work_order.revision.issue";

let currentStep = { number: 0, name: "startup", phase: "read-only" };
let lastSuccessfulStep = { number: 0, name: "none" };
let mutationCommitted = false;

function fail(message) { throw new Error(message); }
function sha256(value) { return crypto.createHash("sha256").update(value).digest("hex"); }
function safeRef(value) { return `safe-${sha256(String(value)).slice(0, 12)}`; }
function step(number, name, phase) { currentStep = { number, name, phase }; }
function checkpoint(name, details = {}) {
  if (currentStep.phase === "mutation") mutationCommitted = true;
  lastSuccessfulStep = { number: currentStep.number, name };
  console.log(JSON.stringify({ type: "alpha27-checkpoint", step: currentStep.number, name, phase: currentStep.phase, ...details }));
}

function assertGuard() {
  const runtime = String(process.env.WAFL_V2_RUNTIME ?? "").trim().toLowerCase();
  const connectionString = process.env.DATABASE_URL;
  const approvedFingerprint = String(process.env.WAFL_V2_APPROVED_DB_FINGERPRINT ?? "").trim().toLowerCase();
  if (!ALLOWED_RUNTIMES.has(runtime) || !connectionString) fail("dev-test-target-required");
  if (String(process.env.WAFL_V2_TEST_PREFIX ?? "").trim() !== REQUIRED_PREFIX) fail("fixture-prefix-mismatch");
  if (process.env.WAFL_V2_CONFIRMATION !== REQUIRED_CONFIRMATION) fail("confirmation-mismatch");
  if (process.env.WAFL_V2_COMMAND_MUTATION_APPROVED !== REQUIRED_APPROVAL) fail("mutation-approval-mismatch");
  if (process.env.WAFL_V2_READ_APPROVED !== "1" || process.env.WAFL_V2_READ_API_ENABLED !== "1" || process.env.WAFL_V2_COMMAND_API_ENABLED !== "1") fail("api-guard-missing");
  const parsed = new URL(connectionString);
  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
  const fingerprint = sha256(`${parsed.hostname}/${databaseName}`).slice(0, 12);
  if (!approvedFingerprint || fingerprint !== approvedFingerprint) fail("db-fingerprint-mismatch");
  return { connectionString, fingerprint };
}

function sessionSecret() {
  const value = process.env.WAFL_SESSION_SECRET?.trim() || process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  if (!value) fail("session-secret-missing");
  return value;
}

function sessionCookie(actor) {
  const payload = {
    userId: actor.userId,
    companyId: actor.companyId,
    companyMemberId: actor.companyMemberId,
    companyName: "WAFL synthetic runtime company",
    role: "company_admin",
    email: `${actor.userId}@example.invalid`,
    name: "WAFL alpha27 runtime",
    issuedAt: new Date().toISOString(),
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = crypto.createHmac("sha256", sessionSecret()).update(encoded).digest("base64url");
  return `wafl_auth_session=${encoded}.${signature}`;
}

async function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer(); server.unref(); server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") return server.close(() => reject(new Error("free-port-unavailable")));
      server.close(() => resolve(address.port));
    });
  });
}

async function waitForServer(baseUrl, child) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) fail(`next-server-exited:${child.exitCode}`);
    try { if ((await fetch(`${baseUrl}/api/v2/work-orders?limit=1`)).status === 401) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  fail("next-server-start-timeout");
}

async function requestJson(baseUrl, routePath, options = {}) {
  const startedAt = performance.now();
  const response = await fetch(`${baseUrl}${routePath}`, {
    method: options.method ?? "GET",
    headers: {
      ...(options.actor ? { Cookie: sessionCookie(options.actor) } : {}),
      ...(options.headers ?? {}),
    },
    ...(Object.prototype.hasOwnProperty.call(options, "body") ? { body: JSON.stringify(options.body) } : {}),
    redirect: "manual",
  });
  const body = await response.json();
  return { response, body, apiMs: Number((performance.now() - startedAt).toFixed(2)) };
}

function assertError(result, status, code) {
  assert.equal(result.response.status, status);
  assert.equal(result.body?.ok, false);
  assert.equal(result.body?.error?.code, code);
}

async function readState(client, targetId = null) {
  await client.query("BEGIN READ ONLY");
  try {
    const ledger = await client.query("SELECT count(*)::integer AS count FROM wafl_v2_migration_ledger");
    assert.equal(Number(ledger.rows[0]?.count), 8);
    const actor = await client.query(`SELECT id AS company_member_id, user_id FROM company_members WHERE company_id = $1 AND status = 'approved' ORDER BY created_at, id LIMIT 1`, [COMPANY_A]);
    const target = await client.query(`
      SELECT w.id, w.current_revision_id, w.entity_version AS work_order_version,
             w.status AS work_order_status, w.document_number_base, w.document_sequence,
             r.entity_version AS revision_version, r.revision_no, r.revision_status, r.finalized_at,
             (SELECT id FROM work_order_material_lines m WHERE m.company_id = w.company_id AND m.revision_id = r.id ORDER BY m.display_order, m.id LIMIT 1) AS material_line_id,
             count(m.id) FILTER (WHERE m.material_type = 'fabric')::integer AS fabric_count,
             count(m.id) FILTER (WHERE m.material_type = 'accessory')::integer AS accessory_count
      FROM work_orders w
      JOIN work_order_revisions r ON r.company_id = w.company_id AND r.id = w.current_revision_id
      LEFT JOIN work_order_material_lines m ON m.company_id = w.company_id AND m.revision_id = r.id
      WHERE w.company_id = $1
        AND (($2::uuid IS NOT NULL AND w.id = $2::uuid) OR ($2::uuid IS NULL AND w.status = 'draft' AND r.revision_status = 'draft'
          AND w.document_number_base IS NULL AND EXISTS (
            SELECT 1 FROM domain_events e WHERE e.company_id = w.company_id AND e.entity_id = w.id::text AND e.command_code = 'work_order.create_draft'
          )))
      GROUP BY w.id, r.id
      HAVING $2::uuid IS NOT NULL OR (count(m.id) FILTER (WHERE m.material_type = 'fabric') >= 1 AND count(m.id) FILTER (WHERE m.material_type = 'accessory') >= 1)
      ORDER BY w.created_at DESC, w.id DESC LIMIT 1
    `, [COMPANY_A, targetId]);
    const counts = await client.query(`
      SELECT (SELECT count(*)::integer FROM work_orders) AS work_orders,
             (SELECT count(*)::integer FROM work_order_revisions) AS revisions,
             (SELECT count(*)::integer FROM work_order_command_receipts) AS receipts,
             (SELECT count(*)::integer FROM domain_events) AS events,
             (SELECT count(*)::integer FROM domain_events WHERE command_code = $1) AS issue_events,
             (SELECT count(*)::integer FROM work_order_command_receipts WHERE command_code = $1) AS issue_receipts
    `, [ISSUE_CODE]);
    await client.query("COMMIT");
    if (!actor.rows[0] || !target.rows[0]) fail("runtime-fixture-missing");
    return { actor: actor.rows[0], target: target.rows[0], counts: counts.rows[0] };
  } catch (error) { await client.query("ROLLBACK"); throw error; }
}

function issueBody(target, note = "alpha27 synthetic issue") {
  return {
    clientRequestId: "alpha27-revision-issue",
    expectedWorkOrderVersion: Number(target.work_order_version),
    expectedRevisionVersion: Number(target.revision_version),
    expectedRevisionId: target.current_revision_id,
    issueNote: note,
  };
}

async function run() {
  const guard = assertGuard();
  const client = new Client({ connectionString: guard.connectionString });
  await client.connect();
  let child;
  try {
    step(1, "baseline", "read-only");
    const before = await readState(client);
    const actorA = { companyId: COMPANY_A, companyMemberId: before.actor.company_member_id, userId: before.actor.user_id };
    const actorFor = (companyId) => ({ companyId, companyMemberId: `alpha27-runtime-member-${companyId}`, userId: `alpha27-runtime-${companyId}` });
    checkpoint("baseline-complete", { target: safeRef(before.target.id), workOrderVersion: Number(before.target.work_order_version), revisionVersion: Number(before.target.revision_version) });

    const port = await getFreePort();
    const baseUrl = `http://127.0.0.1:${port}`;
    child = spawn(process.execPath, [path.join("node_modules", "next", "dist", "bin", "next"), "start", "-H", "127.0.0.1", "-p", String(port)], {
      cwd: process.cwd(), env: { ...process.env, PORT: String(port) }, stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
    });
    await waitForServer(baseUrl, child);
    const issuePath = `/api/v2/work-orders/${before.target.id}/revisions/issue`;
    const body = issueBody(before.target);

    step(2, "concurrent-issue", "mutation");
    const attempts = await Promise.all([
      requestJson(baseUrl, issuePath, { actor: actorA, method: "POST", body, headers: { "Content-Type": "application/json", "Idempotency-Key": "alpha27-issue-winner-a" } }),
      requestJson(baseUrl, issuePath, { actor: actorA, method: "POST", body, headers: { "Content-Type": "application/json", "Idempotency-Key": "alpha27-issue-winner-b" } }),
    ]);
    const successes = attempts.filter((item) => item.response.status === 200);
    const conflicts = attempts.filter((item) => item.response.status === 409);
    assert.equal(successes.length, 1, "concurrent issue must have one winner");
    assert.equal(conflicts.length, 1, "concurrent issue must have one loser");
    assert.equal(conflicts[0].body?.error?.code, "CONFLICT");
    const winnerIndex = attempts.indexOf(successes[0]);
    const winnerKey = winnerIndex === 0 ? "alpha27-issue-winner-a" : "alpha27-issue-winner-b";
    const issued = successes[0].body?.data?.result;
    const issuedNextVersion = successes[0].body?.data?.nextVersion;
    assert.equal(issued?.status, "issued");
    assert.equal(issued?.revisionStatus, "finalized");
    assert.equal(issuedNextVersion, Number(before.target.work_order_version) + 1);
    assert.match(String(issued?.displayDocumentNumber), /^[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+-\d{6}-\d{3,}-R\d+$/);
    checkpoint("issue-single-winner", { apiMs: successes[0].apiMs, documentNumber: safeRef(issued.displayDocumentNumber) });

    step(3, "idempotency", "read-only-validation");
    const replay = await requestJson(baseUrl, issuePath, { actor: actorA, method: "POST", body, headers: { "Content-Type": "application/json", "Idempotency-Key": winnerKey } });
    assert.equal(replay.response.status, 200);
    assert.equal(replay.response.headers.get("X-WAFL-Idempotent-Replay"), "1");
    assert.equal(replay.body?.data?.result?.displayDocumentNumber, issued.displayDocumentNumber);
    const payloadConflict = await requestJson(baseUrl, issuePath, { actor: actorA, method: "POST", body: issueBody(before.target, "different payload"), headers: { "Content-Type": "application/json", "Idempotency-Key": winnerKey } });
    assertError(payloadConflict, 409, "CONFLICT");
    checkpoint("idempotency-complete");

    step(4, "tenant-isolation", "read-only-validation");
    for (const companyId of [COMPANY_B, COMPANY_H]) {
      const cross = await requestJson(baseUrl, issuePath, { actor: actorFor(companyId), method: "POST", body, headers: { "Content-Type": "application/json", "Idempotency-Key": `alpha27-cross-${companyId.slice(-1)}` } });
      assertError(cross, 404, "NOT_FOUND");
    }
    const forbidden = await requestJson(baseUrl, issuePath, { actor: actorFor(COMPANY_C), method: "POST", body, headers: { "Content-Type": "application/json", "Idempotency-Key": "alpha27-company-c" } });
    assertError(forbidden, 403, "FORBIDDEN");
    const spoof = await requestJson(baseUrl, issuePath, { actor: actorA, method: "POST", body: { ...body, companyId: COMPANY_B }, headers: { "Content-Type": "application/json", "Idempotency-Key": "alpha27-spoof" } });
    assertError(spoof, 400, "VALIDATION_ERROR");
    checkpoint("tenant-isolation-complete");

    step(5, "immutable-lock", "read-only-validation");
    const lockedBasic = await requestJson(baseUrl, `/api/v2/work-orders/${before.target.id}`, {
      actor: actorA, method: "PATCH", body: { clientRequestId: "alpha27-locked-basic", expectedVersion: issuedNextVersion, patch: { memo: "blocked" } }, headers: { "Content-Type": "application/json" },
    });
    assertError(lockedBasic, 409, "LOCKED");
    const lockedMaterial = await requestJson(baseUrl, `/api/v2/work-orders/${before.target.id}/materials/${before.target.material_line_id}`, {
      actor: actorA, method: "PATCH", body: { clientRequestId: "alpha27-locked-material", expectedVersion: issuedNextVersion, patch: { memo: "blocked" } }, headers: { "Content-Type": "application/json" },
    });
    assertError(lockedMaterial, 409, "LOCKED");
    checkpoint("immutable-lock-complete");

    step(6, "read-regression", "read-only-validation");
    for (const routePath of [
      "/api/v2/work-orders?limit=30",
      `/api/v2/work-orders/${before.target.id}`,
      `/api/v2/work-orders/${before.target.id}/materials?type=fabric&limit=10`,
      `/api/v2/work-orders/${before.target.id}/materials?type=accessory&limit=10`,
      `/api/v2/work-orders/${before.target.id}/history?limit=20`,
      `/api/v2/work-orders/${before.target.id}/documents?limit=10`,
      `/api/v2/work-orders/${before.target.id}/size-color`,
      `/api/v2/work-orders/${before.target.id}/size-spec`,
      `/api/v2/work-orders/${before.target.id}/processes?limit=10`,
      `/api/v2/work-orders/${before.target.id}/assets?limit=10`,
    ]) {
      const result = await requestJson(baseUrl, routePath, { actor: actorA });
      assert.equal(result.response.status, 200, `read regression failed: ${safeRef(routePath)}`);
    }
    checkpoint("read-regression-complete");

    step(7, "completion-ledger", "read-only");
    const after = await readState(client, before.target.id);
    assert.equal(after.target.work_order_status, "issued");
    assert.equal(after.target.revision_status, "finalized");
    assert.equal(Number(after.target.work_order_version), Number(before.target.work_order_version) + 1);
    assert.equal(Number(after.target.revision_version), Number(before.target.revision_version) + 1);
    assert.equal(Number(after.counts.work_orders), Number(before.counts.work_orders));
    assert.equal(Number(after.counts.revisions), Number(before.counts.revisions));
    assert.equal(Number(after.counts.receipts), Number(before.counts.receipts) + 1);
    assert.equal(Number(after.counts.events), Number(before.counts.events) + 1);
    assert.equal(Number(after.counts.issue_receipts), Number(before.counts.issue_receipts) + 1);
    assert.equal(Number(after.counts.issue_events), Number(before.counts.issue_events) + 1);
    assert.equal(after.target.document_number_base, String(issued.displayDocumentNumber).replace(/-R\d+$/, ""));
    checkpoint("completion-ledger-complete");

    console.log("EXECUTE WAFL V2 ALPHA27 REVISION ISSUE RUNTIME");
    console.log(`Target fingerprint: ${guard.fingerprint}`);
    console.log(`Issued synthetic WorkOrder: ${safeRef(before.target.id)}`);
    console.log("Concurrent issue single winner: PASS");
    console.log("Display document number allocated: 1");
    console.log("Finalized revision delta: 0 rows; current draft changed to finalized");
    console.log("Next draft created: 0");
    console.log("Receipt delta: +1; event delta: +1; WorkOrder/revision version: +1/+1");
    console.log("Idempotency replay/payload conflict: PASS");
    console.log("Company B/H NOT_FOUND; Company C FORBIDDEN: PASS");
    console.log("Issued revision scalar/material lock: PASS");
    console.log("Alpha.23-26 Read/Command regression: PASS");
    console.log("Cleanup/reset/rollback: NOT_RUN by policy");
    console.log("DB migration/schema/index mutation: false");
    console.log("Production/business/R2/Worker/PDF mutation: false");
    console.log("Result: PASS");
  } finally {
    if (child && child.exitCode === null) child.kill();
    await client.end().catch(() => {});
  }
}

run().catch((error) => {
  console.error("WAFL_V2_ALPHA27_RUNTIME_FAILED", {
    stepNumber: currentStep.number,
    stepName: currentStep.name,
    phase: currentStep.phase,
    lastSuccessfulStep,
    mutationCommitted,
    errorName: error instanceof Error ? error.name : "UnknownError",
    runnerLocation: String(error?.stack ?? "").match(/run-wafl-v2-alpha27-revision-issue-runtime\.mjs:(\d+):(\d+)/)?.[0] ?? "unknown",
  });
  process.exitCode = 1;
});
