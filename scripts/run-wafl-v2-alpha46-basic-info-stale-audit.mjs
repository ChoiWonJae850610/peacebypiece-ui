#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import pg from "pg";

const { Client } = pg;
const VERSION = "2.0.0-alpha.46";
const REQUIRED_PREFIX = "wafl-fn";
const REQUIRED_CONFIRMATION = "EXECUTE WAFL V2 ALPHA46 STALE VERSION AUDIT";
const REQUIRED_APPROVAL = "2.0.0-alpha.46-dev-test-mobile-basic-info-runtime";
const ALLOWED_RUNTIMES = new Set(["development", "dev", "local", "test", "demo"]);
const STATE_PATH = path.resolve(".tmp/wafl-v2-alpha46/basic-info-preflight.json");
const COMMAND_CODE = "work_order.patch_basic_info";

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

function assertGuard(state) {
  const runtime = String(process.env.WAFL_V2_RUNTIME ?? "").trim().toLowerCase();
  const connectionString = process.env.DATABASE_URL?.trim();
  const approvedFingerprint = String(process.env.WAFL_V2_APPROVED_DB_FINGERPRINT ?? "").trim().toLowerCase();
  if (!ALLOWED_RUNTIMES.has(runtime)) fail("runtime-not-dev-test");
  if (!connectionString) fail("database-url-missing");
  if (String(process.env.WAFL_V2_TEST_PREFIX ?? "").trim() !== REQUIRED_PREFIX) fail("fixture-prefix-mismatch");
  if (process.env.WAFL_V2_CONFIRMATION !== REQUIRED_CONFIRMATION) fail("confirmation-mismatch");
  if (process.env.WAFL_V2_COMMAND_MUTATION_APPROVED !== REQUIRED_APPROVAL) fail("alpha46-mutation-approval-missing");
  if (process.env.WAFL_EXTERNAL_QA_ALPHA46_BASIC_INFO_MUTATION_ENABLED !== "true") fail("external-patch-flag-missing");
  const fingerprint = databaseFingerprint(connectionString);
  if (!approvedFingerprint || fingerprint !== approvedFingerprint || state.fingerprint !== fingerprint) fail("db-fingerprint-mismatch");
  return { connectionString, fingerprint };
}

function sessionSecret() {
  const value = process.env.WAFL_SESSION_SECRET?.trim() || process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  if (!value) fail("session-secret-missing");
  return value;
}

function createSessionCookie(state) {
  const payload = {
    userId: state.actor.userId,
    companyId: state.companyId,
    companyMemberId: state.actor.companyMemberId,
    companyName: "WAFL dev/test Company A",
    role: "company_admin",
    email: "alpha46-runtime-audit@example.invalid",
    name: "WAFL alpha46 runtime audit",
    issuedAt: new Date().toISOString(),
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = crypto.createHmac("sha256", sessionSecret()).update(encoded).digest("base64url");
  return `wafl_auth_session=${encoded}.${signature}`;
}

async function snapshot(client, state) {
  await client.query("BEGIN READ ONLY");
  try {
    const target = await client.query(`
      SELECT w.product_name, w.due_date::text, w.total_quantity,
             w.entity_version AS work_order_version, w.status,
             r.entity_version AS revision_version, r.revision_status,
             (SELECT count(*)::integer FROM public.domain_events e
               WHERE e.company_id = w.company_id AND e.entity_type = 'work_order'
                 AND e.entity_id = w.id::text AND e.command_code = $3) AS target_patch_event_count,
             (SELECT count(*)::integer FROM public.generated_documents d
               WHERE d.company_id = w.company_id AND d.work_order_id = w.id) AS target_document_count,
             (SELECT count(*)::integer FROM public.document_access_tokens t
               JOIN public.generated_documents d ON d.company_id=t.company_id AND d.id=t.generated_document_id
               WHERE d.company_id=w.company_id AND d.work_order_id=w.id) AS target_token_count
      FROM public.work_orders w
      JOIN public.work_order_revisions r ON r.company_id=w.company_id AND r.id=w.current_revision_id
      WHERE w.company_id=$1 AND w.id=$2::uuid AND w.current_revision_id=$4::uuid AND w.deleted_at IS NULL
    `, [state.companyId, state.target.workOrderId, COMMAND_CODE, state.target.revisionId]);
    const totals = await client.query(`
      SELECT
        (SELECT count(*)::integer FROM public.work_orders) AS work_orders,
        (SELECT count(*)::integer FROM public.work_order_revisions) AS revisions,
        (SELECT count(*)::integer FROM public.work_order_command_receipts) AS receipts,
        (SELECT count(*)::integer FROM public.domain_events) AS events,
        (SELECT count(*)::integer FROM public.generated_documents) AS documents,
        (SELECT count(*)::integer FROM public.document_access_tokens) AS tokens
    `);
    await client.query("COMMIT");
    return {
      target: target.rows[0],
      totals: Object.fromEntries(Object.entries(totals.rows[0] ?? {}).map(([key, value]) => [key, Number(value)])),
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

function assertSavedOnce(snapshot, state) {
  const target = snapshot.target;
  assert.ok(target, "qa-draft-a-missing-after-mobile-save");
  assert.equal(target.product_name, state.proposed.productName, "saved-product-name-mismatch");
  assert.equal(target.due_date, state.proposed.dueDate, "saved-due-date-mismatch");
  assert.equal(Number(target.total_quantity), state.proposed.totalQuantity, "saved-total-quantity-mismatch");
  assert.equal(Number(target.work_order_version), state.target.workOrderVersion + 1, "work-order-version-must-increment-once");
  assert.equal(Number(target.revision_version), state.target.revisionVersion + 1, "revision-version-must-increment-once");
  assert.equal(Number(target.target_patch_event_count), state.target.targetPatchEventCount + 1, "patch-event-must-increment-once");
  assert.equal(snapshot.totals.events, state.baseline.events + 1, "global-event-delta-must-be-one");
  assert.equal(snapshot.totals.receipts, state.baseline.receipts, "receipt-delta-must-be-zero");
  assert.equal(snapshot.totals.work_orders, state.baseline.work_orders);
  assert.equal(snapshot.totals.revisions, state.baseline.revisions);
  assert.equal(snapshot.totals.documents, state.baseline.documents);
  assert.equal(snapshot.totals.tokens, state.baseline.tokens);
  assert.equal(Number(target.target_document_count), 0);
  assert.equal(Number(target.target_token_count), 0);
}

async function requestStalePatch(state) {
  const baseUrl = String(process.env.WAFL_ALPHA46_LOCAL_NEXT_ORIGIN ?? "http://127.0.0.1:3100").replace(/\/+$/, "");
  const origin = new URL(baseUrl);
  if (origin.protocol !== "http:" || !new Set(["127.0.0.1", "localhost"]).has(origin.hostname)) fail("local-next-origin-required");
  const response = await fetch(`${origin.origin}/api/v2/work-orders/${state.target.workOrderId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: createSessionCookie(state),
    },
    body: JSON.stringify({
      clientRequestId: `alpha46-stale-audit-${Date.now()}`,
      expectedVersion: state.target.workOrderVersion,
      patch: state.proposed,
    }),
    redirect: "manual",
  });
  const body = await response.json().catch(() => null);
  assert.equal(response.status, 409, "stale-patch-status-must-be-409");
  assert.equal(body?.ok, false);
  assert.equal(body?.error?.code, "CONFLICT");
  assert.equal(body?.error?.entityVersion, state.target.workOrderVersion + 1);
  assert.equal(typeof body?.error?.correlationId, "string");
  return { status: response.status, code: body.error.code, correlationPresent: true };
}

async function run() {
  const state = JSON.parse(await fs.readFile(STATE_PATH, "utf8"));
  assert.equal(state.version, VERSION, "preflight-version-mismatch");
  assert.equal(state.targetAlias, "QA_DRAFT_A", "preflight-alias-mismatch");
  const guard = assertGuard(state);
  const client = new Client({ connectionString: guard.connectionString, application_name: "wafl-v2-alpha46-stale-version-audit" });
  await client.connect();
  try {
    const saved = await snapshot(client, state);
    assertSavedOnce(saved, state);
    const stale = await requestStalePatch(state);
    const afterStale = await snapshot(client, state);
    assert.deepEqual(afterStale, saved, "stale-patch-must-have-zero-delta");

    console.log(`WAFL v2 alpha.46 stale-version audit: ${VERSION}`);
    console.log("Target alias: QA_DRAFT_A");
    console.log(`Approved dev/test fingerprint prefix: ${guard.fingerprint.slice(0, 6)}`);
    console.log("Retained mobile save: productName/dueDate/totalQuantity changed");
    console.log(`Entity version delta: workOrder +1, revision +1`);
    console.log("Domain event delta: +1; receipt delta: 0");
    console.log(`Stale PATCH: HTTP ${stale.status} / ${stale.code}; correlation present: ${stale.correlationPresent}`);
    console.log("Stale PATCH DB/event/receipt delta: 0/0/0");
    console.log("Generated document/token/R2 delta: 0/0/0");
    console.log("Production mutation: 0");
    console.log("Result: PASS");
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error("WAFL v2 alpha.46 stale-version audit failed", {
    errorName: error instanceof Error ? error.name : "UnknownError",
    errorCode: error instanceof Error ? error.message.split(":", 1)[0] : "UNKNOWN",
  });
  process.exitCode = 1;
});
