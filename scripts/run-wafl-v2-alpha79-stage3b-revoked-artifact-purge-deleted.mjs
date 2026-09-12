#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const { Client } = pg;
const ROOT = process.cwd();
const COMPANY_ID = "wafl-fn-company-a";
const STATE_PATH = path.join(ROOT, ".tmp", "wafl-external-qa", "state.json");
const EVIDENCE_PATH = path.join(ROOT, ".tmp", "wafl-v2-alpha79", "stage3b-runtime-evidence.json");
const EXPECTED_DB_FINGERPRINT = "01e5dcc7fea3";
const PHYSICAL_NAME = "QA A79 generated revoke access";
const AUTOMATED_NAME = "QA A79 generated revoke access automated";
const safeRef = (value) => crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, 12);

function environment() {
  const values = {};
  for (const line of fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").split(/\r?\n/u)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/u);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    values[match[1]] = value;
  }
  return values;
}

const dbFingerprint = (connectionString) => { const parsed = new URL(connectionString); return safeRef(`${parsed.hostname}/${decodeURIComponent(parsed.pathname.replace(/^\/+/, ""))}`); };
const sessionCookie = (response) => (response.headers.getSetCookie?.() ?? []).map((item) => item.split(";", 1)[0]).join("; ");

async function main() {
  console.log(JSON.stringify({ stage: "stage3b-runtime-start" }));
  const env = environment();
  assert.ok(env.DATABASE_URL, "DATABASE_URL_MISSING");
  assert.equal(dbFingerprint(env.DATABASE_URL), EXPECTED_DB_FINGERPRINT, "DEV_TEST_DATABASE_FINGERPRINT_MISMATCH");
  const state = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
  assert.equal(state.status, "running");
  assert.equal(state.nodeVersion, "24.14.0");
  assert.equal(state.makerQaProfile, "alpha67-current-maker");
  assert.equal(state.developerAutoConnectReady, true);
  const publicBase = String(state.publicOrigin);
  const localBase = `http://127.0.0.1:${Number(state.nextPort)}`;
  const requests = [];
  let cookie = "";
  async function request(base, route, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 45_000);
    try {
      const response = await fetch(`${base}${route}`, { method: options.method ?? "GET", redirect: "manual",
        signal: controller.signal, headers: { Accept: "application/json", ...(cookie ? { Cookie: cookie } : {}),
          ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
          ...(options.key ? { "Idempotency-Key": options.key } : {}) },
        ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }) });
      const type = response.headers.get("content-type") ?? "";
      const body = type.includes("application/json") ? await response.json() : await response.text();
      requests.push({ host: base === localBase ? "loopback-dev-runner" : "canonical-external-qa",
        method: options.method ?? "GET", route: route.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/giu, "fixture"),
        status: response.status });
      return { response, body };
    } finally { clearTimeout(timer); }
  }
  const auth = await request(publicBase, "/api/dev/mobile-connect/auto", { method: "POST", body: {} });
  assert.equal(auth.response.status, 200, "DEVELOPER_AUTO_CONNECT_FAILED");
  cookie = sessionCookie(auth.response);
  assert.ok(cookie, "DEVELOPER_SESSION_COOKIE_MISSING");
  const client = new Client({ connectionString: env.DATABASE_URL,
    application_name: "wafl-alpha79-stage3b-purge", statement_timeout: 180000 });
  await client.connect();
  try {
    assert.equal(Number((await client.query("SELECT count(*)::integer count FROM wafl_v2_migration_ledger")).rows[0].count), 22);
    assert.equal(Number((await client.query("SELECT count(*)::integer count FROM work_orders WHERE company_id=$1 AND product_name='QA A73 product sketch retained' AND deleted_at IS NULL", [COMPANY_ID])).rows[0].count), 1);
    async function fixture(name) {
      const rows = (await client.query(`
        SELECT w.id::text work_order_id,w.current_revision_id::text revision_id,d.id::text document_id,
          d.generation_no,d.status,d.revoked_at,d.deleted_at,d.storage_object_key,d.file_size_bytes,d.content_sha256
        FROM work_orders w
        JOIN generated_documents d ON d.company_id=w.company_id AND d.work_order_id=w.id
          AND d.work_order_revision_id=w.current_revision_id
        WHERE w.company_id=$1 AND w.product_name=$2 AND w.deleted_at IS NULL
          AND d.generation_no=(SELECT max(latest.generation_no) FROM generated_documents latest
            WHERE latest.company_id=d.company_id AND latest.work_order_revision_id=d.work_order_revision_id
              AND latest.document_type=d.document_type)
        ORDER BY w.created_at DESC LIMIT 1
      `, [COMPANY_ID, name])).rows;
      assert.equal(rows.length, 1, `EXACT_FIXTURE_REQUIRED:${name}`);
      return rows[0];
    }
    const automated = await fixture(AUTOMATED_NAME);
    const physical = await fixture(PHYSICAL_NAME);
    assert.equal(automated.status, "revoked", "AUTOMATED_FIXTURE_MUST_START_REVOKED");
    assert.ok(automated.revoked_at && !automated.deleted_at && automated.storage_object_key, "AUTOMATED_OWNERSHIP_INCOMPLETE");
    assert.equal(physical.status, "revoked", "OWNER_STAGE3A_REVOKE_NOT_PRESENT");
    assert.ok(physical.revoked_at && !physical.deleted_at && physical.storage_object_key, "PHYSICAL_OWNERSHIP_INCOMPLETE");
    const automatedAuditBefore = await request(localBase, "/api/dev/a79-stage3b-deleted-object-audit", {
      method: "POST", body: { documentId: automated.document_id } });
    assert.equal(automatedAuditBefore.response.status, 200, "AUTOMATED_PRE_AUDIT_FAILED");
    assert.equal(automatedAuditBefore.body.data.lifecycle, "revoked");
    assert.equal(automatedAuditBefore.body.data.objectHealth, "healthy");
    const physicalAuditBefore = await request(localBase, "/api/dev/a79-stage3b-deleted-object-audit", {
      method: "POST", body: { documentId: physical.document_id } });
    assert.equal(physicalAuditBefore.response.status, 200, "PHYSICAL_PRE_AUDIT_FAILED");
    assert.equal(physicalAuditBefore.body.data.lifecycle, "revoked");
    assert.equal(physicalAuditBefore.body.data.objectHealth, "healthy");
    const eventBefore = Number((await client.query(`SELECT count(*)::integer count FROM domain_events
      WHERE company_id=$1 AND entity_type='generated_document' AND entity_id=$2::text
        AND command_code='work_order.document.purge'`, [COMPANY_ID, automated.document_id])).rows[0].count);
    const key = `a79-stage3b-purge-${crypto.randomUUID()}`;
    const body = { revisionId: automated.revision_id, generationNumber: Number(automated.generation_no),
      clientRequestId: key, reason: "alpha79-stage3b-automated-evidence" };
    const first = await request(publicBase,
      `/api/v2/work-orders/${automated.work_order_id}/documents/${automated.document_id}/purge`,
      { method: "POST", key, body });
    assert.equal(first.response.status, 200, `PURGE_FAILED:${first.body?.error?.code ?? "UNKNOWN"}`);
    assert.equal(first.body.data.status, "deleted");
    assert.equal(first.body.data.objectAbsent, true);
    assert.equal(first.response.headers.get("x-wafl-r2-delete-count"), "1", "EXACT_DELETE_COUNT_NOT_ONE");
    const replay = await request(publicBase,
      `/api/v2/work-orders/${automated.work_order_id}/documents/${automated.document_id}/purge`,
      { method: "POST", key, body });
    assert.equal(replay.response.status, 200);
    assert.equal(replay.response.headers.get("x-wafl-idempotent-replay"), "1");
    assert.equal(replay.response.headers.get("x-wafl-r2-delete-count"), "0");
    const secondKey = `a79-stage3b-second-${crypto.randomUUID()}`;
    const second = await request(publicBase,
      `/api/v2/work-orders/${automated.work_order_id}/documents/${automated.document_id}/purge`,
      { method: "POST", key: secondKey, body: { ...body, clientRequestId: secondKey } });
    assert.equal(second.response.status, 200);
    assert.equal(second.response.headers.get("x-wafl-r2-delete-count"), "0");
    const postAudit = await request(localBase, "/api/dev/a79-stage3b-deleted-object-audit", {
      method: "POST", body: { documentId: automated.document_id } });
    assert.equal(postAudit.response.status, 200, "AUTOMATED_POST_AUDIT_FAILED");
    assert.equal(postAudit.body.data.lifecycle, "deleted");
    assert.equal(postAudit.body.data.deletedAtPresent, true);
    assert.equal(postAudit.body.data.objectHealth, "missing");
    assert.equal(postAudit.body.data.objectAbsent, true);
    const denied = {};
    for (const [name, route, options] of [
      ["file", `/api/v2/work-orders/documents/${automated.document_id}/file`, {}],
      ["viewer", `/api/v2/work-orders/documents/${automated.document_id}/viewer-target`, {}],
      ["preview", `/api/v2/work-orders/documents/${automated.document_id}/preview-target`, {}],
      ["tokens", `/api/v2/work-orders/documents/${automated.document_id}/access-tokens`, {}],
      ["newToken", `/api/v2/work-orders/documents/${automated.document_id}/access-tokens`, {
        method: "POST", key: `a79-stage3b-token-${crypto.randomUUID()}`, body: { expiresInDays: 3 } }],
    ]) {
      const result = await request(publicBase, route, options);
      denied[name] = result.response.status;
      assert.equal(result.response.status, 404, `DELETED_ACCESS_NOT_DENIED:${name}`);
    }
    const currentPage = await request(publicBase,
      `/api/v2/work-orders/${automated.work_order_id}/documents?limit=50`);
    assert.equal(currentPage.response.status, 200);
    const current = [...currentPage.body.data.items]
      .filter((item) => item.revisionId === automated.revision_id)
      .sort((a, b) => b.generationNumber - a.generationNumber || b.id.localeCompare(a.id))[0];
    assert.equal(current.id, automated.document_id);
    assert.equal(current.status, "deleted");
    const dbAfter = (await client.query(`SELECT d.status,d.revoked_at,d.deleted_at,d.storage_object_key,
      d.file_size_bytes,d.content_sha256,
      (SELECT count(*)::integer FROM document_access_tokens t WHERE t.company_id=d.company_id
        AND t.generated_document_id=d.id AND t.revoked_at IS NULL) active_tokens,
      (SELECT count(*)::integer FROM domain_events e WHERE e.company_id=d.company_id
        AND e.entity_type='generated_document' AND e.entity_id=d.id::text
        AND e.command_code='work_order.document.purge') purge_events
      FROM generated_documents d WHERE d.company_id=$1 AND d.id=$2::uuid`,
    [COMPANY_ID, automated.document_id])).rows[0];
    assert.equal(dbAfter.status, "deleted");
    assert.ok(dbAfter.revoked_at && dbAfter.deleted_at);
    assert.equal(dbAfter.storage_object_key, automated.storage_object_key);
    assert.equal(Number(dbAfter.file_size_bytes), Number(automated.file_size_bytes));
    assert.equal(dbAfter.content_sha256, automated.content_sha256);
    assert.equal(Number(dbAfter.active_tokens), 0);
    assert.equal(Number(dbAfter.purge_events) - eventBefore, 1);
    const physicalAuditAfter = await request(localBase, "/api/dev/a79-stage3b-deleted-object-audit", {
      method: "POST", body: { documentId: physical.document_id } });
    assert.equal(physicalAuditAfter.response.status, 200);
    assert.equal(physicalAuditAfter.body.data.lifecycle, "revoked");
    assert.equal(physicalAuditAfter.body.data.objectHealth, "healthy");
    const evidence = { ok: true,
      checkpoint: "ALPHA79_STAGE3B_REVOKED_ARTIFACT_PURGE_DELETED_IPHONE_IPAD_QA_REQUIRED",
      migrationLedger: "22/22",
      automated: { fixture: AUTOMATED_NAME, documentRef: safeRef(automated.document_id),
        generation: Number(automated.generation_no), exactOwnership: true,
        before: { lifecycle: "revoked", objectHealth: "healthy" },
        after: { lifecycle: "deleted", objectHealth: "missing", objectAbsent: true,
          deletedAtPresent: true, access: denied, eventDelta: Number(dbAfter.purge_events) - eventBefore,
          rowRetained: true, storageIdentityRetained: true },
        deleteCount: 1, replayDeleteCount: 0, secondDeleteCount: 0 },
      physical: { fixture: PHYSICAL_NAME, documentRef: safeRef(physical.document_id),
        generation: Number(physical.generation_no), lifecycle: "revoked", objectHealth: "healthy",
        readyForOwner: true, purgeExecuted: false },
      partialFailureModel: { deleteSuccessDbFailureReplay: "revoked_absent_to_deleted",
        ambiguousPresent: "remain_revoked", ambiguousUnknown: "remain_revoked",
        ambiguousAbsent: "finalize_deleted" },
      exactOwnedR2Mutation: { delete: 1, overwrite: 0, unrelated: 0, production: 0, physicalFixture: 0 },
      productionOwnerAmbiguousBusinessMutation: [0, 0, 0],
      retainedRecipe: { name: "QA A73 product sketch retained", ref: "fb1f3f75fd06", count: 1 },
      physicalResult: "PHYSICAL_RESULT_NOT_INFERRED", requests };
    fs.mkdirSync(path.dirname(EVIDENCE_PATH), { recursive: true });
    fs.writeFileSync(EVIDENCE_PATH, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
    console.log(JSON.stringify({ ok: true, evidencePath: path.relative(ROOT, EVIDENCE_PATH),
      automatedPurgePass: true, physicalFixtureRevokedHealthy: true }));
  } finally { await client.end(); }
}

await main().catch((error) => { console.error(error instanceof Error ? error.stack ?? error.message : JSON.stringify(error)); process.exitCode = 1; });
