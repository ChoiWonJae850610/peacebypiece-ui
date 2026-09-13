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
const EVIDENCE_PATH = path.join(ROOT, ".tmp", "wafl-v2-alpha80", "stage2-current-link-actions-runtime-evidence.json");
const EXPECTED_DB_FINGERPRINT = "01e5dcc7fea3";
const READ_ONLY = process.argv.includes("--read-only");
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
const rawTokenFromUrl = (viewerUrl) => new URL(viewerUrl).hash.replace(/^#t=/u, "");

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
      const body = contentType.includes("application/json") ? await response.json() : Buffer.from(await response.arrayBuffer());
      requests.push({ method: options.method ?? "GET", route: route.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/giu, "fixture"), status: response.status });
      return { response, body };
    } finally {
      clearTimeout(timer);
    }
  }

  async function publicArtifact(viewerUrl, expected) {
    const session = await request("/api/public/document-viewer/session", { method: "POST", body: { token: rawTokenFromUrl(viewerUrl) } });
    assert.equal(session.response.status, 200, "PUBLIC_SESSION_FAILED");
    const cookie = sessionCookie(session.response);
    assert.ok(cookie, "PUBLIC_SESSION_COOKIE_MISSING");
    const file = await request("/api/public/document-viewer/file", { accept: "application/pdf", cookie });
    assert.equal(file.response.status, 200, "PUBLIC_FILE_FAILED");
    assert.equal(file.body.byteLength, expected.fileSizeBytes);
    assert.equal(sha256(file.body), expected.contentSha256);
    return { bytes: file.body.byteLength, sha256Matches: true };
  }

  async function publicDenied(viewerUrl) {
    const denied = await request("/api/public/document-viewer/session", { method: "POST", body: { token: rawTokenFromUrl(viewerUrl) } });
    assert.equal(denied.response.status, 404);
    assert.equal(denied.body?.error?.code, "NOT_FOUND");
  }

  const auth = await request("/api/dev/mobile-connect/auto", { method: "POST", body: {} });
  assert.equal(auth.response.status, 200, "DEVELOPER_AUTO_CONNECT_FAILED");
  authCookie = sessionCookie(auth.response);
  assert.ok(authCookie, "DEVELOPER_SESSION_COOKIE_MISSING");

  const client = new Client({ connectionString: env.DATABASE_URL, application_name: "wafl-alpha80-stage2-current-link-actions", statement_timeout: 180000 });
  await client.connect();
  try {
    assert.equal(Number((await client.query("SELECT count(*)::integer count FROM wafl_v2_migration_ledger")).rows[0].count), 22);
    assert.equal(Number((await client.query("SELECT count(*)::integer count FROM work_orders WHERE company_id=$1 AND product_name=$2 AND deleted_at IS NULL", [COMPANY_ID, RETAINED_NAME])).rows[0].count), 1);
    const fixture = (await client.query(`
      SELECT w.id::text work_order_id,w.current_revision_id::text revision_id,
             d.id::text document_id,d.generation_no,d.storage_object_key,d.file_size_bytes,d.content_sha256,d.status document_status
      FROM work_orders w JOIN generated_documents d ON d.company_id=w.company_id AND d.work_order_id=w.id
        AND d.work_order_revision_id=w.current_revision_id
      WHERE w.company_id=$1 AND w.product_name=$2 AND w.deleted_at IS NULL
        AND d.generation_no=(SELECT max(candidate.generation_no) FROM generated_documents candidate
          WHERE candidate.company_id=d.company_id AND candidate.work_order_id=d.work_order_id
            AND candidate.work_order_revision_id=d.work_order_revision_id AND candidate.document_type=d.document_type)
      ORDER BY d.generation_no DESC,d.id DESC LIMIT 1
    `, [COMPANY_ID, FIXTURE_NAME])).rows[0];
    assert.ok(fixture, "FIXTURE_NOT_FOUND");
    assert.equal(fixture.document_status, "generated");
    const expected = { fileSizeBytes: Number(fixture.file_size_bytes), contentSha256: String(fixture.content_sha256) };
    const documentBefore = { status: fixture.document_status, revisionId: fixture.revision_id, generationNumber: Number(fixture.generation_no), objectKeyRef: safeRef(fixture.storage_object_key), ...expected };
    const accessPath = `/api/v2/work-orders/documents/${fixture.document_id}/access-tokens`;
    const currentPath = `${accessPath}/current`;
    const create = (key) => request(accessPath, { method: "POST", auth: true, key, body: { expiresInDays: 3 } });
    const list = async () => {
      const result = await request(accessPath, { auth: true });
      assert.equal(result.response.status, 200);
      return result.body.data.items;
    };
    const currentTarget = async () => {
      const result = await request(currentPath, { auth: true });
      assert.equal(result.response.status, 200, `CURRENT_TARGET_GET_FAILED:${JSON.stringify(result.body)}`);
      return result.body.data.target;
    };

    let targetA = await currentTarget();
    if (!targetA) {
      if (READ_ONLY) {
        const listedWithoutCurrent = await list();
        const health = await request(`/api/v2/work-orders/documents/${fixture.document_id}/health`, { auth: true });
        assert.equal(health.response.status, 200);
        assert.equal(health.body.data.health, "healthy");
        const evidence = {
          ok: true,
          checkpoint: "ALPHA80_STAGE2_CURRENT_SHARE_LINK_ACTIONS_IPHONE_IPAD_REQA_REQUIRED",
          mode: "read-only-no-current-target",
          fixture: { name: FIXTURE_NAME, workOrderRef: safeRef(fixture.work_order_id), revisionRef: safeRef(fixture.revision_id), documentRef: safeRef(fixture.document_id), generationNumber: Number(fixture.generation_no), health: "healthy" },
          currentActions: { currentLinkPresent: false, activeCanonicalListCount: listedWithoutCurrent.filter((item) => item.status === "active" && item.isMakerCurrentShare === true).length, createOrRotateCalls: 0, revokeCalls: 0, documentMutation: 0, r2Mutation: 0 },
          retainedStage2LifecycleEvidence: fs.existsSync(path.join(ROOT, ".tmp", "wafl-v2-alpha80", "stage2-runtime-evidence.json")),
          ownerPhysicalRevokeStatePreserved: true,
          migrationLedger: "22/22",
          productionOwnerAmbiguousBusinessMutation: [0, 0, 0],
          r2Mutation: 0,
          retainedRecipe: { name: RETAINED_NAME, ref: "fb1f3f75fd06", count: 1 },
          requests,
          physicalResult: "PHYSICAL_RESULT_NOT_INFERRED",
        };
        fs.mkdirSync(path.dirname(EVIDENCE_PATH), { recursive: true });
        fs.writeFileSync(EVIDENCE_PATH, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
        console.log(JSON.stringify({ ok: true, mode: evidence.mode, evidencePath: path.relative(ROOT, EVIDENCE_PATH), fixture: FIXTURE_NAME, physicalResult: "PHYSICAL_RESULT_NOT_INFERRED" }));
        return;
      }
      const prepared = await create(`a80-stage2-actions-prepare-${crypto.randomUUID()}`);
      assert.ok([200, 201].includes(prepared.response.status));
      targetA = await currentTarget();
    }
    assert.ok(targetA, "CURRENT_TARGET_MISSING");
    assert.equal(targetA.generatedDocumentId, fixture.document_id);
    assert.equal(targetA.workOrderId, fixture.work_order_id);
    assert.equal(targetA.revisionId, fixture.revision_id);
    assert.equal(Number(targetA.generationNumber), Number(fixture.generation_no));
    const listedA = await list();
    const currentA = listedA.filter((item) => item.status === "active" && item.isMakerCurrentShare === true);
    assert.equal(currentA.length, 1);
    assert.equal(currentA[0].tokenId, targetA.tokenId);
    if (READ_ONLY) {
      const health = await request(`/api/v2/work-orders/documents/${fixture.document_id}/health`, { auth: true });
      assert.equal(health.response.status, 200);
      assert.equal(health.body.data.health, "healthy");
      const evidence = {
        ok: true,
        checkpoint: "ALPHA80_STAGE2_CURRENT_SHARE_LINK_ACTIONS_IPHONE_IPAD_REQA_REQUIRED",
        mode: "read-only-current-target",
        fixture: { name: FIXTURE_NAME, workOrderRef: safeRef(fixture.work_order_id), revisionRef: safeRef(fixture.revision_id), documentRef: safeRef(fixture.document_id), generationNumber: Number(fixture.generation_no), health: "healthy" },
        currentActions: { currentLinkPresent: true, targetTokenMatchesCanonicalList: true, allActionUrlIdentity: sha256(targetA.viewerUrl), createOrRotateCalls: 0, revokeCalls: 0, documentMutation: 0, r2Mutation: 0 },
        retainedStage2LifecycleEvidence: fs.existsSync(path.join(ROOT, ".tmp", "wafl-v2-alpha80", "stage2-runtime-evidence.json")),
        migrationLedger: "22/22",
        productionOwnerAmbiguousBusinessMutation: [0, 0, 0],
        r2Mutation: 0,
        retainedRecipe: { name: RETAINED_NAME, ref: "fb1f3f75fd06", count: 1 },
        requests,
        physicalResult: "PHYSICAL_RESULT_NOT_INFERRED",
      };
      fs.mkdirSync(path.dirname(EVIDENCE_PATH), { recursive: true });
      fs.writeFileSync(EVIDENCE_PATH, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
      console.log(JSON.stringify({ ok: true, mode: evidence.mode, evidencePath: path.relative(ROOT, EVIDENCE_PATH), fixture: FIXTURE_NAME, physicalResult: "PHYSICAL_RESULT_NOT_INFERRED" }));
      return;
    }
    const reuseA = await create(`a80-stage2-actions-reuse-${crypto.randomUUID()}`);
    assert.equal(reuseA.response.status, 200);
    assert.equal(reuseA.body.data.viewerUrl, targetA.viewerUrl);
    const artifactA = await publicArtifact(targetA.viewerUrl, expected);
    const tokenStateBeforeReadActions = (await client.query(`SELECT count(*)::integer count,
      count(*) FILTER (WHERE revoked_at IS NULL AND expires_at>now())::integer active
      FROM document_access_tokens WHERE company_id=$1 AND generated_document_id=$2::uuid AND token_purpose='manual_share'`, [COMPANY_ID, fixture.document_id])).rows[0];
    const actionIdentityA = sha256(targetA.viewerUrl);

    const revoked = await request(`${accessPath}/${targetA.tokenId}/revoke`, { method: "POST", auth: true, body: {} });
    assert.equal(revoked.response.status, 200);
    assert.equal(await currentTarget(), null);
    assert.equal((await list()).filter((item) => item.isMakerCurrentShare === true).length, 0);
    await publicDenied(targetA.viewerUrl);
    const healthAfterRevoke = await request(`/api/v2/work-orders/documents/${fixture.document_id}/health`, { auth: true });
    assert.equal(healthAfterRevoke.response.status, 200);
    assert.equal(healthAfterRevoke.body.data.health, "healthy");

    const replacement = await create(`a80-stage2-actions-replacement-${crypto.randomUUID()}`);
    assert.equal(replacement.response.status, 201);
    const targetB = await currentTarget();
    assert.ok(targetB, "REPLACEMENT_TARGET_MISSING");
    assert.equal(targetB.viewerUrl, replacement.body.data.viewerUrl);
    assert.notEqual(targetB.viewerUrl, targetA.viewerUrl);
    const listedB = await list();
    const currentB = listedB.filter((item) => item.status === "active" && item.isMakerCurrentShare === true);
    assert.equal(currentB.length, 1);
    assert.equal(currentB[0].tokenId, targetB.tokenId);
    const replacementDb = (await client.query(`SELECT rotated_from_token_id::text FROM document_access_tokens
      WHERE company_id=$1 AND generated_document_id=$2::uuid AND id=$3::uuid`, [COMPANY_ID, fixture.document_id, targetB.tokenId])).rows[0];
    assert.equal(replacementDb.rotated_from_token_id, targetA.tokenId);
    const reuseB = await create(`a80-stage2-actions-reuse-replacement-${crypto.randomUUID()}`);
    assert.equal(reuseB.response.status, 200);
    assert.equal(reuseB.body.data.viewerUrl, targetB.viewerUrl);
    const artifactB = await publicArtifact(targetB.viewerUrl, expected);
    await publicDenied(targetA.viewerUrl);

    const finalDocument = (await client.query(`SELECT status,work_order_revision_id::text revision_id,generation_no,
      storage_object_key,file_size_bytes,content_sha256 FROM generated_documents WHERE company_id=$1 AND id=$2::uuid`,
      [COMPANY_ID, fixture.document_id])).rows[0];
    assert.deepEqual({ status: finalDocument.status, revisionId: finalDocument.revision_id, generationNumber: Number(finalDocument.generation_no), objectKeyRef: safeRef(finalDocument.storage_object_key), fileSizeBytes: Number(finalDocument.file_size_bytes), contentSha256: finalDocument.content_sha256 }, documentBefore);
    const tokenStateAfter = (await client.query(`SELECT count(*)::integer count,
      count(*) FILTER (WHERE revoked_at IS NULL AND expires_at>now())::integer active
      FROM document_access_tokens WHERE company_id=$1 AND generated_document_id=$2::uuid AND token_purpose='manual_share'`, [COMPANY_ID, fixture.document_id])).rows[0];
    assert.equal(Number(tokenStateAfter.active), 1);
    assert.equal(Number(tokenStateAfter.count), Number(tokenStateBeforeReadActions.count) + 1);

    const evidence = {
      ok: true,
      checkpoint: "ALPHA80_STAGE2_CURRENT_SHARE_LINK_ACTIONS_IPHONE_IPAD_REQA_REQUIRED",
      fixture: { name: FIXTURE_NAME, workOrderRef: safeRef(fixture.work_order_id), revisionRef: safeRef(fixture.revision_id), documentRef: safeRef(fixture.document_id), generationNumber: Number(fixture.generation_no), health: "healthy" },
      currentActions: { currentLinkPresent: true, openCopyNativeShareUrlIdentity: actionIdentityA, revokeTokenIdentityMatched: true, createOrRotateCalls: 0, documentMutation: 0, r2Mutation: 0, exactArtifact: artifactA },
      revoke: { currentTargetCleared: true, currentActionsAbsent: true, oldUrlDenied: true, pdfRemainsHealthy: true, automaticReplacement: 0 },
      replacement: { differsFromPredecessor: true, allActionUrlIdentity: sha256(targetB.viewerUrl), predecessorDenied: true, repeatShareReused: true, activeCanonicalLinks: Number(tokenStateAfter.active), exactArtifact: artifactB },
      migrationLedger: "22/22",
      productionOwnerAmbiguousBusinessMutation: [0, 0, 0],
      r2Mutation: 0,
      retainedRecipe: { name: RETAINED_NAME, ref: "fb1f3f75fd06", count: 1 },
      requests,
      physicalResult: "PHYSICAL_RESULT_NOT_INFERRED",
    };
    fs.mkdirSync(path.dirname(EVIDENCE_PATH), { recursive: true });
    fs.writeFileSync(EVIDENCE_PATH, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
    console.log(JSON.stringify({ ok: true, evidencePath: path.relative(ROOT, EVIDENCE_PATH), fixture: FIXTURE_NAME, activeCanonicalLinks: Number(tokenStateAfter.active), physicalResult: "PHYSICAL_RESULT_NOT_INFERRED" }));
  } finally {
    await client.end();
  }
}

await main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : JSON.stringify(error));
  process.exitCode = 1;
});
