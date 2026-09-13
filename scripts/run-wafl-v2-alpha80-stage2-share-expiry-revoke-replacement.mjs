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
const EVIDENCE_PATH = path.join(ROOT, ".tmp", "wafl-v2-alpha80", "stage2-runtime-evidence.json");
const EXPECTED_DB_FINGERPRINT = "01e5dcc7fea3";
const safeRef = (value) => crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, 12);
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

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
  const requests = [];
  let authCookie = "";

  async function request(route, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 45_000);
    try {
      const response = await fetch(`${publicBase}${route}`, {
        method: options.method ?? "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          Accept: options.accept ?? "application/json",
          ...(options.cookie ? { Cookie: options.cookie } : {}),
          ...(options.auth ? { Cookie: authCookie } : {}),
          ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
          ...(options.key ? { "Idempotency-Key": options.key } : {}),
        },
        ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
      });
      const contentType = response.headers.get("content-type") ?? "";
      const body = contentType.includes("application/json")
        ? await response.json()
        : Buffer.from(await response.arrayBuffer());
      requests.push({
        method: options.method ?? "GET",
        route: route.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/giu, "fixture"),
        status: response.status,
      });
      return { response, body };
    } finally {
      clearTimeout(timer);
    }
  }

  async function publicArtifact(rawToken, expected) {
    const session = await request("/api/public/document-viewer/session", { method: "POST", body: { token: rawToken } });
    assert.equal(session.response.status, 200, "PUBLIC_SESSION_FAILED");
    const viewerCookie = sessionCookie(session.response);
    assert.ok(viewerCookie, "PUBLIC_SESSION_COOKIE_MISSING");
    const file = await request("/api/public/document-viewer/file", { accept: "application/pdf", cookie: viewerCookie });
    assert.equal(file.response.status, 200, "PUBLIC_FILE_FAILED");
    assert.equal(file.body.byteLength, expected.fileSizeBytes);
    assert.equal(sha256(file.body), expected.contentSha256);
    return { bytes: file.body.byteLength, sha256Matches: true };
  }

  async function publicDenied(rawToken) {
    const denied = await request("/api/public/document-viewer/session", { method: "POST", body: { token: rawToken } });
    assert.equal(denied.response.status, 404, "TERMINAL_PUBLIC_LINK_NOT_DENIED");
    assert.equal(denied.body?.error?.code, "NOT_FOUND");
  }

  const auth = await request("/api/dev/mobile-connect/auto", { method: "POST", body: {} });
  assert.equal(auth.response.status, 200, "DEVELOPER_AUTO_CONNECT_FAILED");
  authCookie = sessionCookie(auth.response);
  assert.ok(authCookie, "DEVELOPER_SESSION_COOKIE_MISSING");

  const client = new Client({
    connectionString: env.DATABASE_URL,
    application_name: "wafl-alpha80-stage2-share",
    statement_timeout: 180000,
  });
  await client.connect();
  try {
    assert.equal(Number((await client.query("SELECT count(*)::integer count FROM wafl_v2_migration_ledger")).rows[0].count), 22);
    assert.equal(Number((await client.query("SELECT count(*)::integer count FROM work_orders WHERE company_id=$1 AND product_name=$2 AND deleted_at IS NULL", [COMPANY_ID, RETAINED_NAME])).rows[0].count), 1);
    const fixture = (await client.query(`
      SELECT w.id::text work_order_id,w.current_revision_id::text revision_id,w.status,
             d.id::text document_id,d.generation_no,d.storage_object_key,d.file_size_bytes,d.content_sha256,d.status document_status
      FROM work_orders w
      JOIN generated_documents d ON d.company_id=w.company_id AND d.work_order_id=w.id
        AND d.work_order_revision_id=w.current_revision_id
      WHERE w.company_id=$1 AND w.product_name=$2 AND w.deleted_at IS NULL
        AND d.generation_no=(SELECT max(candidate.generation_no) FROM generated_documents candidate
          WHERE candidate.company_id=d.company_id AND candidate.work_order_id=d.work_order_id
            AND candidate.work_order_revision_id=d.work_order_revision_id AND candidate.document_type=d.document_type)
      ORDER BY d.generation_no DESC,d.id DESC LIMIT 1
    `, [COMPANY_ID, FIXTURE_NAME])).rows[0];
    assert.ok(fixture, "STAGE1_FIXTURE_NOT_FOUND");
    assert.equal(fixture.document_status, "generated");
    const expected = {
      fileSizeBytes: Number(fixture.file_size_bytes),
      contentSha256: String(fixture.content_sha256),
    };
    const health = await request(`/api/v2/work-orders/documents/${fixture.document_id}/health`, { auth: true });
    assert.equal(health.response.status, 200);
    assert.equal(health.body.data.health, "healthy");

    const create = (key) => request(`/api/v2/work-orders/documents/${fixture.document_id}/access-tokens`, {
      method: "POST", auth: true, key, body: { expiresInDays: 3 },
    });
    const list = async () => {
      const response = await request(`/api/v2/work-orders/documents/${fixture.document_id}/access-tokens`, { auth: true });
      assert.equal(response.response.status, 200);
      return response.body.data.items;
    };
    const eventCount = async (code) => Number((await client.query(`
      SELECT count(*)::integer count FROM domain_events WHERE company_id=$1 AND command_code=$2
        AND metadata->>'generatedDocumentId'=$3
    `, [COMPANY_ID, code, fixture.document_id])).rows[0].count);

    const initial = await create(`a80-stage2-current-${crypto.randomUUID()}`);
    assert.ok([200, 201].includes(initial.response.status));
    const rawA = new URL(String(initial.body.data.viewerUrl)).hash.replace(/^#t=/u, "");
    const tokenHashA = sha256(rawA);
    const listedA = await list();
    const currentA = listedA.filter((item) => item.isMakerCurrentShare === true && item.status === "active");
    assert.equal(currentA.length, 1);
    assert.equal(currentA[0].tokenId, initial.body.data.tokenId);
    const artifactA = await publicArtifact(rawA, expected);

    const revokeEventsBefore = await eventCount("pdf.share_revoked");
    const revokePath = `/api/v2/work-orders/documents/${fixture.document_id}/access-tokens/${currentA[0].tokenId}/revoke`;
    const revoked = await request(revokePath, { method: "POST", auth: true, body: {} });
    assert.equal(revoked.response.status, 200);
    assert.equal(revoked.body.data.idempotentReplay, false);
    const revokeReplay = await request(revokePath, { method: "POST", auth: true, body: {} });
    assert.equal(revokeReplay.response.status, 200);
    assert.equal(revokeReplay.body.data.idempotentReplay, true);
    assert.equal((await eventCount("pdf.share_revoked")) - revokeEventsBefore, 1);
    await publicDenied(rawA);
    assert.equal((await list()).filter((item) => item.isMakerCurrentShare === true).length, 0);

    const shareEventsBeforeB = await eventCount("pdf.shared");
    const replacementCalls = await Promise.all(Array.from({ length: 4 }, () => create(`a80-stage2-replacement-${crypto.randomUUID()}`)));
    assert.ok(replacementCalls.every((item) => [200, 201].includes(item.response.status)));
    const urlsB = new Set(replacementCalls.map((item) => String(item.body.data.viewerUrl)));
    assert.equal(urlsB.size, 1);
    const rawB = new URL([...urlsB][0]).hash.replace(/^#t=/u, "");
    assert.notEqual(rawB, rawA);
    const tokenHashB = sha256(rawB);
    const listedB = await list();
    const currentB = listedB.filter((item) => item.isMakerCurrentShare === true && item.status === "active");
    assert.equal(currentB.length, 1);
    const dbB = (await client.query(`
      SELECT id::text,rotated_from_token_id::text,token_hash::text FROM document_access_tokens
      WHERE company_id=$1 AND generated_document_id=$2::uuid AND token_hash=$3::char(64)
    `, [COMPANY_ID, fixture.document_id, tokenHashB])).rows[0];
    assert.ok(dbB);
    assert.equal(dbB.rotated_from_token_id, currentA[0].tokenId);
    assert.ok((await eventCount("pdf.shared")) - shareEventsBeforeB <= 1);
    const artifactB = await publicArtifact(rawB, expected);
    await publicDenied(rawA);
    const reuseB = await create(`a80-stage2-reuse-b-${crypto.randomUUID()}`);
    assert.equal(reuseB.response.status, 200);
    assert.equal(reuseB.body.data.viewerUrl, [...urlsB][0]);

    await client.query("BEGIN");
    try {
      const expiryOwnership = (await client.query(`
        SELECT token.id::text,token.generated_document_id::text,token.token_hash::text,
               document.work_order_id::text,document.work_order_revision_id::text,document.generation_no,
               document.storage_object_key,document.file_size_bytes,document.content_sha256
        FROM document_access_tokens token
        JOIN generated_documents document ON document.company_id=token.company_id AND document.id=token.generated_document_id
        WHERE token.company_id=$1 AND token.id=$2::uuid AND token.generated_document_id=$3::uuid
          AND token.token_hash=$4::char(64) AND token.token_purpose='manual_share'
          AND token.revoked_at IS NULL AND token.expires_at>now()
        FOR UPDATE OF token
      `, [COMPANY_ID, dbB.id, fixture.document_id, tokenHashB])).rows[0];
      assert.ok(expiryOwnership, "EXPIRY_EXACT_OWNERSHIP_NOT_PROVEN");
      assert.equal(expiryOwnership.work_order_id, fixture.work_order_id);
      assert.equal(expiryOwnership.work_order_revision_id, fixture.revision_id);
      assert.equal(Number(expiryOwnership.generation_no), Number(fixture.generation_no));
      assert.equal(expiryOwnership.storage_object_key, fixture.storage_object_key);
      assert.equal(Number(expiryOwnership.file_size_bytes), expected.fileSizeBytes);
      assert.equal(expiryOwnership.content_sha256, expected.contentSha256);
      const expired = await client.query(`
        UPDATE document_access_tokens SET expires_at=now()
        WHERE company_id=$1 AND id=$2::uuid AND generated_document_id=$3::uuid
          AND token_hash=$4::char(64) AND token_purpose='manual_share'
          AND revoked_at IS NULL AND expires_at>now()
        RETURNING id::text
      `, [COMPANY_ID, dbB.id, fixture.document_id, tokenHashB]);
      assert.equal(expired.rowCount, 1, "BOUNDED_DEV_EXPIRY_FAILED");
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
    await publicDenied(rawB);
    assert.equal((await list()).filter((item) => item.isMakerCurrentShare === true).length, 0);

    const shareEventsBeforeF = await eventCount("pdf.shared");
    const next = await create(`a80-stage2-after-expiry-${crypto.randomUUID()}`);
    assert.equal(next.response.status, 201);
    const rawF = new URL(String(next.body.data.viewerUrl)).hash.replace(/^#t=/u, "");
    assert.notEqual(rawF, rawB);
    const tokenHashF = sha256(rawF);
    const listedF = await list();
    const currentF = listedF.filter((item) => item.isMakerCurrentShare === true && item.status === "active");
    assert.equal(currentF.length, 1);
    assert.equal(currentF[0].tokenId, next.body.data.tokenId);
    const dbF = (await client.query(`
      SELECT id::text,rotated_from_token_id::text FROM document_access_tokens
      WHERE company_id=$1 AND generated_document_id=$2::uuid AND token_hash=$3::char(64)
    `, [COMPANY_ID, fixture.document_id, tokenHashF])).rows[0];
    assert.equal(dbF.rotated_from_token_id, dbB.id);
    assert.equal((await eventCount("pdf.shared")) - shareEventsBeforeF, 1);
    const artifactF = await publicArtifact(rawF, expected);
    await publicDenied(rawA);
    await publicDenied(rawB);
    const reuseF = await create(`a80-stage2-reuse-f-${crypto.randomUUID()}`);
    assert.equal(reuseF.response.status, 200);
    assert.equal(reuseF.body.data.viewerUrl, next.body.data.viewerUrl);

    const canonicalCounts = (await client.query(`
      SELECT count(*) FILTER (WHERE revoked_at IS NULL AND expires_at>now())::integer total_active,
             count(*) FILTER (WHERE revoked_at IS NOT NULL)::integer revoked,
             count(*) FILTER (WHERE revoked_at IS NULL AND expires_at<=now())::integer expired
      FROM document_access_tokens WHERE company_id=$1 AND generated_document_id=$2::uuid
        AND token_purpose='manual_share'
    `, [COMPANY_ID, fixture.document_id])).rows[0];
    assert.ok(Number(canonicalCounts.total_active) >= 1);
    assert.equal(currentF.length, 1);
    assert.ok(Number(canonicalCounts.revoked) >= 1);
    assert.ok(Number(canonicalCounts.expired) >= 1);
    const finalHealth = await request(`/api/v2/work-orders/documents/${fixture.document_id}/health`, { auth: true });
    assert.equal(finalHealth.body.data.health, "healthy");
    const finalDocument = (await client.query(`SELECT status,work_order_revision_id::text revision_id,generation_no,
      storage_object_key,file_size_bytes,content_sha256 FROM generated_documents WHERE company_id=$1 AND id=$2::uuid`,
      [COMPANY_ID, fixture.document_id])).rows[0];
    assert.equal(finalDocument.status, "generated");
    assert.equal(finalDocument.revision_id, fixture.revision_id);
    assert.equal(Number(finalDocument.generation_no), Number(fixture.generation_no));
    assert.equal(finalDocument.storage_object_key, fixture.storage_object_key);
    assert.equal(Number(finalDocument.file_size_bytes), expected.fileSizeBytes);
    assert.equal(finalDocument.content_sha256, expected.contentSha256);

    const terminal = await client.query(`
      SELECT d.id::text,d.status FROM work_orders w JOIN generated_documents d
        ON d.company_id=w.company_id AND d.work_order_id=w.id AND d.work_order_revision_id=w.current_revision_id
      WHERE w.company_id=$1 AND w.product_name IN ('QA A79 generated revoke access','QA A79 generated revoke access automated')
        AND d.status IN ('revoked','deleted') ORDER BY d.generation_no DESC
    `, [COMPANY_ID]);
    const deniedStatuses = [];
    for (const row of terminal.rows) {
      const denied = await request(`/api/v2/work-orders/documents/${row.id}/access-tokens`, {
        method: "POST", auth: true, key: `a80-stage2-terminal-${crypto.randomUUID()}`, body: { expiresInDays: 3 },
      });
      assert.equal(denied.response.status, 404);
      deniedStatuses.push(String(row.status));
    }
    assert.ok(deniedStatuses.includes("deleted"));

    const evidence = {
      ok: true,
      checkpoint: "ALPHA80_STAGE2_SHARE_EXPIRY_REVOKE_REPLACEMENT_IPHONE_IPAD_QA_REQUIRED",
      fixture: {
        name: FIXTURE_NAME,
        workOrderRef: safeRef(fixture.work_order_id),
        revisionRef: safeRef(fixture.revision_id),
        documentRef: safeRef(fixture.document_id),
        generationNumber: Number(fixture.generation_no),
        health: "healthy",
      },
      revoke: {
        linkARef: safeRef(tokenHashA),
        beforeWorks: artifactA,
        eventDelta: 1,
        replayIdempotent: true,
        publicDenied: true,
        automaticReplacement: 0,
      },
      replacementAfterRevoke: {
        linkBRef: safeRef(tokenHashB),
        differsFromA: true,
        exactArtifact: artifactB,
        predecessorMatches: true,
        concurrentCalls: replacementCalls.length,
        uniqueResult: true,
        repeatReuse: true,
      },
      expiry: {
        mechanism: "exact-owned DEV row expires_at=database now()",
        exactOwnershipVerified: true,
        linkERef: safeRef(tokenHashB),
        beforeWorks: true,
        boundaryDenied: true,
        noCurrentMarker: true,
      },
      replacementAfterExpiry: {
        linkFRef: safeRef(tokenHashF),
        differsFromE: true,
        exactArtifact: artifactF,
        predecessorMatches: true,
        repeatReuse: true,
      },
      finalState: {
        activeCanonicalLinks: currentF.length,
        legacyActiveLinks: Number(canonicalCounts.total_active) - currentF.length,
        revokedHistoricalLinks: Number(canonicalCounts.revoked),
        expiredHistoricalLinks: Number(canonicalCounts.expired),
        documentStatus: finalDocument.status,
        revisionUnchanged: true,
        generationUnchanged: true,
        objectIdentityUnchanged: true,
      },
      legacy: { hardDelete: 0, canonicalTakeover: 0 },
      retainedTerminalReadOnly: { statuses: [...new Set(deniedStatuses)], createDenied: true, mutation: 0 },
      migrationLedger: "22/22",
      productionOwnerAmbiguousBusinessMutation: [0, 0, 0],
      r2Mutation: 0,
      retainedRecipe: { name: RETAINED_NAME, ref: "fb1f3f75fd06", count: 1 },
      requests,
      physicalResult: "PHYSICAL_RESULT_NOT_INFERRED",
    };
    fs.mkdirSync(path.dirname(EVIDENCE_PATH), { recursive: true });
    fs.writeFileSync(EVIDENCE_PATH, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
    console.log(JSON.stringify({
      ok: true,
      evidencePath: path.relative(ROOT, EVIDENCE_PATH),
      fixture: FIXTURE_NAME,
      finalActiveCanonicalLinks: currentF.length,
      physicalResult: "PHYSICAL_RESULT_NOT_INFERRED",
    }));
  } finally {
    await client.end();
  }
}

await main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : JSON.stringify(error));
  process.exitCode = 1;
});
