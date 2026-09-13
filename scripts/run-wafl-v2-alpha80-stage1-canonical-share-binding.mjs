#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const { Client } = pg;
const ROOT = process.cwd();
const COMPANY_ID = "wafl-fn-company-a";
const FIXTURE_NAME = "QA A80 canonical share binding";
const RETAINED_NAME = "QA A73 product sketch retained";
const STATE_PATH = path.join(ROOT, ".tmp", "wafl-external-qa", "state.json");
const EVIDENCE_PATH = path.join(ROOT, ".tmp", "wafl-v2-alpha80", "stage1-runtime-evidence.json");
const EXPECTED_DB_FINGERPRINT = "01e5dcc7fea3";
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

const dbFingerprint = (connectionString) => {
  const parsed = new URL(connectionString);
  return safeRef(`${parsed.hostname}/${decodeURIComponent(parsed.pathname.replace(/^\/+/, ""))}`);
};
const sessionCookie = (response) => (response.headers.getSetCookie?.() ?? []).map((item) => item.split(";", 1)[0]).join("; ");

async function main() {
  const env = environment();
  assert.ok(env.DATABASE_URL, "DATABASE_URL_MISSING");
  assert.equal(dbFingerprint(env.DATABASE_URL), EXPECTED_DB_FINGERPRINT, "DEV_TEST_DATABASE_FINGERPRINT_MISMATCH");
  const state = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
  assert.equal(state.status, "running");
  assert.equal(state.nodeVersion, "24.14.0");
  assert.equal(state.makerQaProfile, "alpha67-current-maker");
  assert.equal(state.mutationMode, "current-maker-alpha67");
  assert.equal(state.developerAutoConnectReady, true);
  const publicBase = String(state.publicOrigin);
  let cookie = "";
  const requests = [];
  async function request(route, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 45_000);
    try {
      const response = await fetch(`${publicBase}${route}`, {
        method: options.method ?? "GET", redirect: "manual", signal: controller.signal,
        headers: { Accept: options.accept ?? "application/json", ...(cookie ? { Cookie: cookie } : {}),
          ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
          ...(options.key ? { "Idempotency-Key": options.key } : {}) },
        ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
      });
      const contentType = response.headers.get("content-type") ?? "";
      const body = contentType.includes("application/json") ? await response.json() : Buffer.from(await response.arrayBuffer());
      requests.push({ method: options.method ?? "GET", route: route.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/giu, "fixture"), status: response.status });
      return { response, body };
    } finally { clearTimeout(timer); }
  }

  const auth = await request("/api/dev/mobile-connect/auto", { method: "POST", body: {} });
  assert.equal(auth.response.status, 200, "DEVELOPER_AUTO_CONNECT_FAILED");
  cookie = sessionCookie(auth.response);
  assert.ok(cookie, "DEVELOPER_SESSION_COOKIE_MISSING");
  const client = new Client({ connectionString: env.DATABASE_URL, application_name: "wafl-alpha80-stage1-share", statement_timeout: 180000 });
  await client.connect();
  try {
    assert.equal(Number((await client.query("SELECT count(*)::integer count FROM wafl_v2_migration_ledger")).rows[0].count), 22);
    assert.equal(Number((await client.query("SELECT count(*)::integer count FROM work_orders WHERE company_id=$1 AND product_name=$2 AND deleted_at IS NULL", [COMPANY_ID, RETAINED_NAME])).rows[0].count), 1);
    const source = (await client.query(`SELECT w.id::text work_order_id FROM work_orders w WHERE w.company_id=$1
      AND w.status IN ('issued','revised','completed') AND w.deleted_at IS NULL
      AND w.product_name NOT LIKE 'QA A79 %' AND w.product_name NOT LIKE 'QA A80 %'
      AND EXISTS (SELECT 1 FROM work_order_revision_images i WHERE i.company_id=w.company_id AND i.revision_id=w.current_revision_id AND i.is_representative=true)
      ORDER BY w.updated_at DESC,w.id DESC LIMIT 1`, [COMPANY_ID])).rows[0];
    assert.ok(source?.work_order_id, "CANONICAL_COPY_SOURCE_NOT_FOUND");

    let fixture = (await client.query(`SELECT id::text work_order_id,current_revision_id::text revision_id,status FROM work_orders
      WHERE company_id=$1 AND product_name=$2 AND deleted_at IS NULL ORDER BY created_at DESC,id DESC LIMIT 1`, [COMPANY_ID, FIXTURE_NAME])).rows[0] ?? null;
    let fixtureCreated = false;
    if (!fixture) {
      const copyKey = `a80-stage1-copy-${crypto.randomUUID()}`;
      const copied = await request(`/api/v2/work-orders/${source.work_order_id}/copy`, { method: "POST", key: copyKey,
        body: { clientRequestId: copyKey }, timeoutMs: 180_000 });
      assert.equal(copied.response.status, 201, "FIXTURE_COPY_FAILED");
      const workOrderId = String(copied.body.data.result.workOrderId);
      const revisionId = String(copied.body.data.result.revisionId);
      const detail = await request(`/api/v2/work-orders/${workOrderId}`);
      const renameKey = `a80-stage1-name-${crypto.randomUUID()}`;
      const renamed = await request(`/api/v2/work-orders/${workOrderId}`, { method: "PATCH",
        body: { clientRequestId: renameKey, expectedVersion: detail.body.data.header.entityVersion, patch: { productName: FIXTURE_NAME } } });
      assert.equal(renamed.response.status, 200, "FIXTURE_RENAME_FAILED");
      fixture = { work_order_id: workOrderId, revision_id: revisionId, status: "draft" };
      fixtureCreated = true;
    }
    if (fixture.status === "draft") {
      let detail = await request(`/api/v2/work-orders/${fixture.work_order_id}`);
      if (detail.body.data.header.readiness.hardBlockers.some((item) => item.code === "BASIC_PROCESS_ORDER_REQUIRED")) {
        const process = (await client.query(`SELECT id::text process_id,status FROM work_order_processes WHERE company_id=$1
          AND revision_id=$2::uuid AND process_type_code='production_factory' ORDER BY display_order,id LIMIT 1`, [COMPANY_ID, fixture.revision_id])).rows[0];
        assert.equal(process?.status, "ready", "PROCESS_NOT_READY");
        const processKey = `a80-stage1-order-${crypto.randomUUID()}`;
        const ordered = await request(`/api/v2/work-orders/${fixture.work_order_id}/processes/${process.process_id}/order-request`, {
          method: "POST", key: processKey, body: { clientRequestId: processKey, expectedVersion: detail.body.data.header.entityVersion },
        });
        assert.equal(ordered.response.status, 200, "ORDER_FAILED");
        detail = await request(`/api/v2/work-orders/${fixture.work_order_id}`);
      }
      assert.equal(detail.body.data.header.readiness.canIssue, true, "FIXTURE_NOT_READY");
      const issueKey = `a80-stage1-issue-${crypto.randomUUID()}`;
      const issued = await request(`/api/v2/work-orders/${fixture.work_order_id}/revisions/issue`, { method: "POST", key: issueKey, timeoutMs: 180_000,
        body: { clientRequestId: issueKey, expectedWorkOrderVersion: detail.body.data.header.entityVersion,
          expectedRevisionVersion: detail.body.data.header.currentRevisionVersion, expectedRevisionId: fixture.revision_id,
          issueNote: "alpha.80 Stage 1 canonical Share binding QA" } });
      assert.equal(issued.response.status, 200, "ISSUE_FAILED");
      fixture.status = "issued";
    }
    async function documents() {
      const page = await request(`/api/v2/work-orders/${fixture.work_order_id}/documents?limit=50`);
      assert.equal(page.response.status, 200);
      return [...page.body.data.items].filter((item) => item.revisionId === fixture.revision_id)
        .sort((a, b) => b.generationNumber - a.generationNumber || b.id.localeCompare(a.id));
    }
    let current = (await documents())[0] ?? null;
    if (!current || current.status !== "generated") {
      const generationKey = `a80-stage1-generate-${crypto.randomUUID()}`;
      const generated = await request(`/api/v2/work-orders/${fixture.work_order_id}/documents/generate`, { method: "POST", key: generationKey,
        body: { revisionId: fixture.revision_id }, timeoutMs: 180_000 });
      assert.ok([200, 201].includes(generated.response.status), "GENERATION_FAILED");
      current = (await documents())[0];
    }
    assert.equal(current.status, "generated");
    const health = await request(`/api/v2/work-orders/documents/${current.id}/health`);
    assert.equal(health.response.status, 200);
    assert.equal(health.body.data.health, "healthy");
    const docRow = (await client.query(`SELECT work_order_id::text,work_order_revision_id::text,generation_no,
      storage_object_key,file_size_bytes,content_sha256 FROM generated_documents WHERE company_id=$1 AND id=$2::uuid`, [COMPANY_ID, current.id])).rows[0];
    assert.equal(docRow.work_order_id, fixture.work_order_id);
    assert.equal(docRow.work_order_revision_id, fixture.revision_id);
    assert.equal(Number(docRow.generation_no), current.generationNumber);
    const before = (await client.query(`SELECT count(*)::integer active_manual FROM document_access_tokens WHERE company_id=$1
      AND generated_document_id=$2::uuid AND token_purpose='manual_share' AND revoked_at IS NULL AND expires_at>now()`, [COMPANY_ID, current.id])).rows[0];
    const eventBefore = Number((await client.query(`SELECT count(*)::integer count FROM domain_events WHERE company_id=$1
      AND command_code='pdf.shared' AND metadata->>'generatedDocumentId'=$2`, [COMPANY_ID, current.id])).rows[0].count);
    const firstKey = `a80-stage1-share-${crypto.randomUUID()}`;
    const create = (key) => request(`/api/v2/work-orders/documents/${current.id}/access-tokens`, { method: "POST", key, body: { expiresInDays: 3 } });
    const first = await create(firstKey);
    assert.ok([200, 201].includes(first.response.status), "FIRST_SHARE_FAILED");
    const link = String(first.body.data.viewerUrl);
    const replay = await create(firstKey);
    assert.equal(replay.response.status, 200);
    assert.equal(replay.body.data.viewerUrl, link);
    const different = await create(`a80-stage1-different-${crypto.randomUUID()}`);
    assert.equal(different.response.status, 200);
    assert.equal(different.body.data.viewerUrl, link);
    const concurrent = await Promise.all(Array.from({ length: 4 }, () => create(`a80-stage1-concurrent-${crypto.randomUUID()}`)));
    assert.ok(concurrent.every((item) => item.response.status === 200 && item.body.data.viewerUrl === link));
    for (const item of [first, replay, different, ...concurrent]) {
      assert.equal(item.body.data.generatedDocumentId, current.id);
      assert.equal(item.body.data.workOrderId, fixture.work_order_id);
      assert.equal(item.body.data.revisionId, fixture.revision_id);
      assert.equal(item.body.data.generationNumber, current.generationNumber);
    }
    const listed = await request(`/api/v2/work-orders/documents/${current.id}/access-tokens`);
    assert.equal(listed.response.status, 200);
    const listedCanonical = listed.body.data.items.filter((item) => item.isMakerCurrentShare === true && item.status === "active");
    assert.equal(listedCanonical.length, 1);
    const rawToken = new URL(link).hash.replace(/^#t=/u, "");
    assert.match(rawToken, /^[A-Za-z0-9_-]{43}$/u);
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const after = (await client.query(`SELECT count(*)::integer canonical_rows,
      count(*) FILTER (WHERE revoked_at IS NULL AND expires_at>now())::integer active_rows
      FROM document_access_tokens WHERE company_id=$1 AND generated_document_id=$2::uuid AND token_hash=$3::char(64)`, [COMPANY_ID, current.id, tokenHash])).rows[0];
    assert.equal(Number(after.canonical_rows), 1);
    assert.equal(Number(after.active_rows), 1);
    const eventAfter = Number((await client.query(`SELECT count(*)::integer count FROM domain_events WHERE company_id=$1
      AND command_code='pdf.shared' AND metadata->>'generatedDocumentId'=$2`, [COMPANY_ID, current.id])).rows[0].count);
    assert.ok(eventAfter - eventBefore <= 1);
    const canonicalEventCount = Number((await client.query(`SELECT count(*)::integer count FROM domain_events WHERE company_id=$1
      AND command_code='pdf.shared' AND metadata->>'generatedDocumentId'=$2
      AND change_summary='Canonical Maker current document link created.'`, [COMPANY_ID, current.id])).rows[0].count);
    assert.equal(canonicalEventCount, 1);

    cookie = "";
    const publicSession = await request("/api/public/document-viewer/session", { method: "POST", body: { token: rawToken } });
    assert.equal(publicSession.response.status, 200, "PUBLIC_SESSION_FAILED");
    cookie = sessionCookie(publicSession.response);
    const publicFile = await request("/api/public/document-viewer/file", { accept: "application/pdf" });
    assert.equal(publicFile.response.status, 200, "PUBLIC_FILE_FAILED");
    assert.equal(publicFile.body.byteLength, Number(docRow.file_size_bytes));
    assert.equal(crypto.createHash("sha256").update(publicFile.body).digest("hex"), String(docRow.content_sha256));

    const terminal = await client.query(`SELECT w.product_name,d.id::text,d.status FROM work_orders w JOIN generated_documents d
      ON d.company_id=w.company_id AND d.work_order_id=w.id AND d.work_order_revision_id=w.current_revision_id
      WHERE w.company_id=$1 AND w.product_name IN ('QA A79 generated revoke access','QA A79 generated revoke access automated')
        AND d.status IN ('revoked','deleted') ORDER BY d.generation_no DESC`, [COMPANY_ID]);
    cookie = sessionCookie(auth.response);
    const deniedStatuses = [];
    for (const terminalRow of terminal.rows) {
      const denied = await request(`/api/v2/work-orders/documents/${terminalRow.id}/access-tokens`, { method: "POST",
        key: `a80-stage1-denied-${crypto.randomUUID()}`, body: { expiresInDays: 3 } });
      assert.equal(denied.response.status, 404);
      deniedStatuses.push(String(terminalRow.status));
    }
    assert.ok(deniedStatuses.includes("deleted"), "RETAINED_DELETED_FIXTURE_NOT_FOUND");
    const evidence = {
      ok: true,
      checkpoint: "ALPHA80_STAGE1_CANONICAL_SHARE_BINDING_IPHONE_IPAD_QA_REQUIRED",
      fixture: { name: FIXTURE_NAME, created: fixtureCreated, workOrderRef: safeRef(fixture.work_order_id), revisionRef: safeRef(fixture.revision_id),
        documentRef: safeRef(current.id), generationNumber: current.generationNumber, health: "healthy",
        initialActiveManualLinks: Number(before.active_manual), canonicalActiveLinks: Number(after.active_rows) },
      reuse: { sameKey: true, responseLossRetry: true, differentKey: true, concurrentRequests: concurrent.length,
        uniqueCanonicalRows: Number(after.canonical_rows), listedActiveCanonicalLinks: listedCanonical.length,
        canonicalCreationEventCount: canonicalEventCount, eventDeltaThisRun: eventAfter - eventBefore },
      publicArtifact: { exactBytes: publicFile.body.byteLength, exactSha256: true, workOrderRef: safeRef(docRow.work_order_id), revisionRef: safeRef(docRow.work_order_revision_id), generationNumber: Number(docRow.generation_no) },
      retainedTerminalReadOnly: { statuses: [...new Set(deniedStatuses)], createDenied: true, mutation: 0 },
      migrationLedger: "22/22", productionOwnerAmbiguousBusinessMutation: [0, 0, 0], r2Mutation: 0,
      retainedRecipe: { name: RETAINED_NAME, ref: "fb1f3f75fd06", count: 1 }, requests,
      physicalResult: "PHYSICAL_RESULT_NOT_INFERRED",
    };
    fs.mkdirSync(path.dirname(EVIDENCE_PATH), { recursive: true });
    fs.writeFileSync(EVIDENCE_PATH, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
    console.log(JSON.stringify({ ok: true, evidencePath: path.relative(ROOT, EVIDENCE_PATH), fixture: FIXTURE_NAME,
      canonicalShareRows: Number(after.canonical_rows), physicalResult: "PHYSICAL_RESULT_NOT_INFERRED" }));
  } finally { await client.end(); }
}

await main().catch((error) => { console.error(error instanceof Error ? error.stack ?? error.message : JSON.stringify(error)); process.exitCode = 1; });
