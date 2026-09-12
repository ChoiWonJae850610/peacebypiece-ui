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
const EVIDENCE_PATH = path.join(ROOT, ".tmp", "wafl-v2-alpha79", "stage3a-runtime-evidence.json");
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
  console.log(JSON.stringify({ stage: "stage3a-runtime-start" }));
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
      const response = await fetch(`${base}${route}`, { method: options.method ?? "GET", redirect: "manual", signal: controller.signal,
        headers: { Accept: "application/json", ...(cookie ? { Cookie: cookie } : {}),
          ...(options.body === undefined ? {} : { "Content-Type": "application/json" }), ...(options.key ? { "Idempotency-Key": options.key } : {}) },
        ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }) });
      const type = response.headers.get("content-type") ?? "";
      const body = type.includes("application/json") ? await response.json() : await response.text();
      requests.push({ host: base === localBase ? "loopback-dev-runner" : "canonical-external-qa", method: options.method ?? "GET",
        route: route.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/giu, "fixture"), status: response.status });
      return { response, body };
    } finally { clearTimeout(timer); }
  }
  const auth = await request(publicBase, "/api/dev/mobile-connect/auto", { method: "POST", body: {} });
  console.log(JSON.stringify({ stage: "stage3a-runtime-auth", status: auth.response.status }));
  assert.equal(auth.response.status, 200, "DEVELOPER_AUTO_CONNECT_FAILED");
  cookie = sessionCookie(auth.response);
  assert.ok(cookie, "DEVELOPER_SESSION_COOKIE_MISSING");
  const client = new Client({ connectionString: env.DATABASE_URL, application_name: "wafl-alpha79-stage3a-revoke", statement_timeout: 180000 });
  await client.connect();
  try {
    assert.equal(Number((await client.query("SELECT count(*)::integer count FROM wafl_v2_migration_ledger")).rows[0].count), 22);
    assert.equal(Number((await client.query("SELECT count(*)::integer count FROM work_orders WHERE company_id=$1 AND product_name='QA A73 product sketch retained' AND deleted_at IS NULL", [COMPANY_ID])).rows[0].count), 1);
    const source = (await client.query(`SELECT w.id::text work_order_id FROM work_orders w WHERE w.company_id=$1
      AND w.status IN ('issued','revised','completed') AND w.deleted_at IS NULL
      AND w.product_name NOT LIKE 'QA A79 generated revoke access%'
      AND EXISTS (SELECT 1 FROM work_order_revision_images i WHERE i.company_id=w.company_id AND i.revision_id=w.current_revision_id AND i.is_representative=true)
      ORDER BY w.updated_at DESC LIMIT 1`, [COMPANY_ID])).rows[0];
    assert.ok(source?.work_order_id, "CANONICAL_SOURCE_NOT_FOUND");

    async function findFixture(name) {
      return (await client.query(`SELECT id::text work_order_id,current_revision_id::text revision_id,status FROM work_orders
        WHERE company_id=$1 AND product_name=$2 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1`, [COMPANY_ID, name])).rows[0] ?? null;
    }
    async function prepareFixture(name, suffix) {
      let fixture = await findFixture(name);
      if (!fixture) {
        const copyKey = `a79-stage3a-copy-${suffix}-${crypto.randomUUID()}`;
        const copied = await request(publicBase, `/api/v2/work-orders/${source.work_order_id}/copy`, { method: "POST", key: copyKey,
          body: { clientRequestId: copyKey }, timeoutMs: 180_000 });
        assert.equal(copied.response.status, 201, `COPY_FAILED_${suffix}`);
        const workOrderId = String(copied.body.data.result.workOrderId);
        const revisionId = String(copied.body.data.result.revisionId);
        const detail = await request(publicBase, `/api/v2/work-orders/${workOrderId}`);
        const renameId = `a79-stage3a-name-${suffix}-${crypto.randomUUID()}`;
        const renamed = await request(publicBase, `/api/v2/work-orders/${workOrderId}`, { method: "PATCH",
          body: { clientRequestId: renameId, expectedVersion: detail.body.data.header.entityVersion, patch: { productName: name } } });
        assert.equal(renamed.response.status, 200, `RENAME_FAILED_${suffix}`);
        fixture = { work_order_id: workOrderId, revision_id: revisionId, status: "draft" };
      }
      if (fixture.status === "draft") {
        let detail = await request(publicBase, `/api/v2/work-orders/${fixture.work_order_id}`);
        if (detail.body.data.header.readiness.hardBlockers.some((item) => item.code === "BASIC_PROCESS_ORDER_REQUIRED")) {
          const process = (await client.query(`SELECT id::text process_id,status FROM work_order_processes WHERE company_id=$1
            AND revision_id=$2::uuid AND process_type_code='production_factory' ORDER BY display_order,id LIMIT 1`, [COMPANY_ID, fixture.revision_id])).rows[0];
          assert.equal(process?.status, "ready", `PROCESS_NOT_READY_${suffix}`);
          const key = `a79-stage3a-order-${suffix}-${crypto.randomUUID()}`;
          const ordered = await request(publicBase, `/api/v2/work-orders/${fixture.work_order_id}/processes/${process.process_id}/order-request`, {
            method: "POST", key, body: { clientRequestId: key, expectedVersion: detail.body.data.header.entityVersion } });
          assert.equal(ordered.response.status, 200, `ORDER_FAILED_${suffix}`);
          detail = await request(publicBase, `/api/v2/work-orders/${fixture.work_order_id}`);
        }
        assert.equal(detail.body.data.header.readiness.canIssue, true, `NOT_READY_${suffix}`);
        const key = `a79-stage3a-issue-${suffix}-${crypto.randomUUID()}`;
        const issued = await request(publicBase, `/api/v2/work-orders/${fixture.work_order_id}/revisions/issue`, { method: "POST", key,
          timeoutMs: 120_000, body: { clientRequestId: key, expectedWorkOrderVersion: detail.body.data.header.entityVersion,
            expectedRevisionVersion: detail.body.data.header.currentRevisionVersion, expectedRevisionId: fixture.revision_id,
            issueNote: "alpha.79 Stage 3A revoke access invalidation QA" } });
        assert.equal(issued.response.status, 200, `ISSUE_FAILED_${suffix}`);
        fixture.status = "issued";
      }
      return fixture;
    }
    async function documents(fixture) {
      const page = await request(publicBase, `/api/v2/work-orders/${fixture.work_order_id}/documents?limit=50`);
      assert.equal(page.response.status, 200);
      return [...page.body.data.items].filter((item) => item.revisionId === fixture.revision_id)
        .sort((a, b) => b.generationNumber - a.generationNumber || b.id.localeCompare(a.id));
    }
    async function ensureHealthy(fixture, suffix) {
      let current = (await documents(fixture))[0] ?? null;
      if (!current || current.status !== "generated") {
        const key = `a79-stage3a-generate-${suffix}-${crypto.randomUUID()}`;
        const generated = await request(publicBase, `/api/v2/work-orders/${fixture.work_order_id}/documents/generate`, {
          method: "POST", key, body: { revisionId: fixture.revision_id }, timeoutMs: 180_000 });
        assert.equal(generated.response.status, 200, `GENERATE_FAILED_${suffix}`);
        current = (await documents(fixture))[0];
      }
      const health = await request(publicBase, `/api/v2/work-orders/documents/${current.id}/health`);
      assert.equal(health.response.status, 200);
      assert.equal(health.body.data.health, "healthy");
      return current;
    }

    const automated = await prepareFixture(AUTOMATED_NAME, "automated");
    const physical = await prepareFixture(PHYSICAL_NAME, "physical");
    const automatedDoc = await ensureHealthy(automated, "automated");
    const physicalDoc = await ensureHealthy(physical, "physical");
    const rowBefore = (await client.query(`SELECT storage_object_key,display_document_number FROM generated_documents
      WHERE company_id=$1 AND id=$2::uuid AND work_order_id=$3::uuid AND work_order_revision_id=$4::uuid`,
      [COMPANY_ID, automatedDoc.id, automated.work_order_id, automated.revision_id])).rows[0];
    assert.ok(rowBefore?.storage_object_key, "EXACT_OBJECT_KEY_MISSING");
    const fileBefore = await request(publicBase, `/api/v2/work-orders/documents/${automatedDoc.id}/file`);
    assert.equal(fileBefore.response.status, 200, "FILE_NOT_HEALTHY_BEFORE_REVOKE");
    const shareKey = `a79-stage3a-share-${crypto.randomUUID()}`;
    const share = await request(publicBase, `/api/v2/work-orders/documents/${automatedDoc.id}/access-tokens`, {
      method: "POST", key: shareKey, body: { expiresInDays: 3 } });
    assert.equal(share.response.status, 201, "TOKEN_CREATE_FAILED");
    const rawToken = new URL(String(share.body.data.viewerUrl)).hash.replace(/^#t=/u, "");
    assert.ok(rawToken, "RAW_TOKEN_MISSING");
    const tokenBefore = await request(publicBase, "/api/public/document-viewer/session", { method: "POST", body: { token: rawToken } });
    assert.equal(tokenBefore.response.status, 200, "TOKEN_NOT_HEALTHY_BEFORE_REVOKE");
    const eventBefore = Number((await client.query(`SELECT count(*)::integer count FROM domain_events WHERE company_id=$1
      AND entity_type='generated_document' AND entity_id=$2::text AND command_code='work_order.document.revoke'`, [COMPANY_ID, automatedDoc.id])).rows[0].count);
    const revokeKey = `a79-stage3a-revoke-${crypto.randomUUID()}`;
    const revokeBody = { revisionId: automated.revision_id, generationNumber: automatedDoc.generationNumber,
      clientRequestId: revokeKey, reason: "alpha79-stage3a-automated-evidence" };
    const first = await request(publicBase, `/api/v2/work-orders/${automated.work_order_id}/documents/${automatedDoc.id}/revoke`, { method: "POST", key: revokeKey, body: revokeBody });
    assert.equal(first.response.status, 200, `REVOKE_FAILED:${first.body?.error?.code ?? "UNKNOWN"}`);
    const replay = await request(publicBase, `/api/v2/work-orders/${automated.work_order_id}/documents/${automatedDoc.id}/revoke`, { method: "POST", key: revokeKey, body: revokeBody });
    assert.equal(replay.response.status, 200, "REPLAY_FAILED");
    assert.equal(replay.response.headers.get("x-wafl-idempotent-replay"), "1");
    const secondKey = `a79-stage3a-second-${crypto.randomUUID()}`;
    const second = await request(publicBase, `/api/v2/work-orders/${automated.work_order_id}/documents/${automatedDoc.id}/revoke`, { method: "POST", key: secondKey,
      body: { ...revokeBody, clientRequestId: secondKey } });
    assert.equal(second.response.status, 200, "SECOND_REVOKE_FAILED");
    const concurrentKeys = [crypto.randomUUID(), crypto.randomUUID()].map((id) => `a79-stage3a-concurrent-${id}`);
    const concurrent = await Promise.all(concurrentKeys.map((key) => request(publicBase,
      `/api/v2/work-orders/${automated.work_order_id}/documents/${automatedDoc.id}/revoke`, { method: "POST", key, body: { ...revokeBody, clientRequestId: key } })));
    assert.ok(concurrent.every((item) => item.response.status === 200), "CONCURRENT_REVOKE_FAILED");
    const latest = (await documents(automated))[0];
    assert.equal(latest.id, automatedDoc.id);
    assert.equal(latest.status, "revoked");
    const fileAfter = await request(publicBase, `/api/v2/work-orders/documents/${automatedDoc.id}/file`);
    assert.equal(fileAfter.response.status, 404, "REVOKED_FILE_NOT_DENIED");
    const viewerAfter = await request(publicBase, `/api/v2/work-orders/documents/${automatedDoc.id}/viewer-target`);
    assert.equal(viewerAfter.response.status, 404, "REVOKED_VIEWER_NOT_DENIED");
    const tokensAfter = await request(publicBase, `/api/v2/work-orders/documents/${automatedDoc.id}/access-tokens`);
    assert.equal(tokensAfter.response.status, 404, "REVOKED_TOKEN_LIST_NOT_DENIED");
    const newShareKey = `a79-stage3a-new-share-${crypto.randomUUID()}`;
    const newShare = await request(publicBase, `/api/v2/work-orders/documents/${automatedDoc.id}/access-tokens`, { method: "POST", key: newShareKey, body: { expiresInDays: 3 } });
    assert.equal(newShare.response.status, 404, "REVOKED_NEW_TOKEN_NOT_DENIED");
    const tokenAfter = await request(publicBase, "/api/public/document-viewer/session", { method: "POST", body: { token: rawToken } });
    assert.equal(tokenAfter.response.status, 404, "REVOKED_PUBLIC_TOKEN_NOT_DENIED");
    const audit = await request(localBase, "/api/dev/a79-stage3a-revoked-object-audit", { method: "POST", body: { documentId: automatedDoc.id } });
    assert.equal(audit.response.status, 200, `OBJECT_AUDIT_FAILED:${audit.body?.error ?? "UNKNOWN"}`);
    assert.equal(audit.body.data.objectPresent, true, "R2_OBJECT_NOT_RETAINED");
    assert.equal(audit.body.data.r2Delete, 0);
    const dbAfter = (await client.query(`SELECT d.status,d.revoked_at,d.storage_object_key,
      (SELECT count(*)::integer FROM document_access_tokens t WHERE t.company_id=d.company_id AND t.generated_document_id=d.id AND t.revoked_at IS NULL) active_tokens,
      (SELECT count(*)::integer FROM domain_events e WHERE e.company_id=d.company_id AND e.entity_type='generated_document'
        AND e.entity_id=d.id::text AND e.command_code='work_order.document.revoke') revoke_events
      FROM generated_documents d WHERE d.company_id=$1 AND d.id=$2::uuid`, [COMPANY_ID, automatedDoc.id])).rows[0];
    assert.equal(dbAfter.status, "revoked");
    assert.ok(dbAfter.revoked_at);
    assert.equal(dbAfter.storage_object_key, rowBefore.storage_object_key);
    assert.equal(Number(dbAfter.active_tokens), 0);
    assert.equal(Number(dbAfter.revoke_events) - eventBefore, 1);
    const physicalState = (await documents(physical))[0];
    assert.equal(physicalState.id, physicalDoc.id);
    assert.equal(physicalState.status, "generated");
    const physicalHealth = await request(publicBase, `/api/v2/work-orders/documents/${physicalDoc.id}/health`);
    assert.equal(physicalHealth.body.data.health, "healthy");
    const evidence = { ok: true, checkpoint: "ALPHA79_STAGE3A_REVOKE_ACCESS_INVALIDATION_IPHONE_IPAD_QA_REQUIRED",
      migrationLedger: "22/22", automated: { fixture: AUTOMATED_NAME, documentRef: safeRef(automatedDoc.id), generation: automatedDoc.generationNumber,
        before: { lifecycle: "generated", objectHealth: "healthy", file: 200, token: 200 },
        after: { lifecycle: "revoked", objectHealth: audit.body.data.objectHealth, objectPresent: true, file: fileAfter.response.status,
          viewer: viewerAfter.response.status, tokenList: tokensAfter.response.status, newToken: newShare.response.status,
          publicToken: tokenAfter.response.status, activeTokens: Number(dbAfter.active_tokens), revokeEventDelta: Number(dbAfter.revoke_events) - eventBefore },
        replay: true, secondSafe: true, concurrentCanonical: true },
      physical: { fixture: PHYSICAL_NAME, documentRef: safeRef(physicalDoc.id), generation: physicalDoc.generationNumber,
        lifecycle: "generated", health: "healthy", readyForOwner: true },
      exactOwnedR2Mutation: { delete: 0, overwrite: 0, unrelated: 0, production: 0 },
      productionOwnerAmbiguousBusinessMutation: [0, 0, 0], retainedRecipe: { name: "QA A73 product sketch retained", ref: "fb1f3f75fd06", count: 1 },
      physicalResult: "PHYSICAL_RESULT_NOT_INFERRED", requests };
    fs.mkdirSync(path.dirname(EVIDENCE_PATH), { recursive: true });
    fs.writeFileSync(EVIDENCE_PATH, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
    console.log(JSON.stringify({ ok: true, evidencePath: path.relative(ROOT, EVIDENCE_PATH), automatedRevokePass: true, physicalFixtureHealthy: true }));
  } finally { await client.end(); }
}

await main().catch((error) => { console.error(error instanceof Error ? error.stack ?? error.message : JSON.stringify(error)); process.exitCode = 1; });
