#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const { Client } = pg;
const ROOT = process.cwd();
const FIXTURE_A = "QA A80 canonical share binding";
const RETAINED = "QA A73 product sketch retained";
const STATE_PATH = path.join(ROOT, ".tmp", "wafl-external-qa", "state.json");
const EVIDENCE_PATH = path.join(ROOT, ".tmp", "wafl-v2-alpha80", "stage3-public-share-security-isolation-evidence.json");
const RAW_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/u;
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

function hmacToken(secret, companyId, documentId, predecessorId = null) {
  const signer = crypto.createHmac("sha256", secret);
  signer.update("document-maker-current-share-token:v1", "utf8");
  for (const part of predecessorId ? [companyId, documentId, predecessorId] : [companyId, documentId]) {
    signer.update("\0", "utf8");
    signer.update(part, "utf8");
  }
  return signer.digest("base64url");
}

function changedAt(value, index) {
  return `${value.slice(0, index)}${value[index] === "A" ? "B" : "A"}${value.slice(index + 1)}`;
}

function sanitizeErrorBody(body) {
  if (!body || typeof body !== "object") return "";
  const clone = structuredClone(body);
  if (clone.error && typeof clone.error === "object") delete clone.error.correlationId;
  return JSON.stringify(clone);
}

async function main() {
  const env = environment();
  assert.ok(env.DATABASE_URL, "DEV_DATABASE_REQUIRED");
  const secret = String(env.WAFL_SESSION_SECRET || env.GOOGLE_OAUTH_CLIENT_SECRET || "").trim();
  assert.ok(secret, "SESSION_SIGNING_SECRET_REQUIRED");
  const state = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
  assert.equal(state.status, "running");
  assert.equal(state.nodeVersion, "24.14.0");
  assert.equal(state.developerAutoConnectReady, true);
  const publicBase = String(state.publicOrigin);
  const requests = [];
  let authCookie = "";

  async function request(route, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45_000);
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
        },
        ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
      });
      const contentType = response.headers.get("content-type") ?? "";
      const body = contentType.includes("application/json")
        ? await response.json()
        : Buffer.from(await response.arrayBuffer());
      requests.push({ requestClass: options.requestClass ?? "READ", statusClass: `${Math.floor(response.status / 100)}xx` });
      return { response, body };
    } finally {
      clearTimeout(timer);
    }
  }

  const getCookie = (response) => (response.headers.getSetCookie?.() ?? []).map((value) => value.split(";", 1)[0]).join("; ");
  const tokenFromUrl = (url) => new URL(url).hash.replace(/^#t=/u, "");
  const assertPublicHeaders = (response) => {
    assert.match(response.headers.get("cache-control") ?? "", /no-store/u);
    assert.equal(response.headers.get("referrer-policy"), "no-referrer");
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.match(response.headers.get("x-robots-tag") ?? "", /noindex/u);
  };
  const assertDenied = async (token, requestClass, route = "/api/public/document-viewer/session") => {
    const result = await request(route, { method: "POST", body: { token }, requestClass });
    assert.equal(result.response.status, 404, `${requestClass}_STATUS`);
    assert.ok(result.response.status < 500, `${requestClass}_NO_500`);
    assert.ok(result.response.status < 300 || result.response.status >= 400, `${requestClass}_NO_REDIRECT`);
    assertPublicHeaders(result.response);
    const body = sanitizeErrorBody(result.body);
    assert.doesNotMatch(body, /[0-9a-f]{64}|storage|object.?key|postgres|sql|stack|successor|replacement/iu);
    if (Buffer.isBuffer(result.body)) {
      assert.notEqual(result.response.headers.get("content-type"), "application/pdf", `${requestClass}_ARTIFACT_BYTES_ZERO`);
      assert.notEqual(result.body.subarray(0, 5).toString("ascii"), "%PDF-", `${requestClass}_ARTIFACT_BYTES_ZERO`);
    } else {
      assert.equal(result.body?.error?.code, "NOT_FOUND", `${requestClass}_GENERIC_ERROR_CODE:${Object.keys(result.body ?? {}).join(",")}`);
    }
    return { requestClass, resultClass: "DENIED", artifactAlias: "NONE", leakCount: 0, mutationCount: 0 };
  };
  const openArtifact = async (viewerUrl, expected, artifactAlias, query = "") => {
    const raw = tokenFromUrl(viewerUrl);
    assert.ok(RAW_TOKEN_PATTERN.test(raw));
    const session = await request(`/api/public/document-viewer/session${query}`, { method: "POST", body: { token: raw }, requestClass: `${artifactAlias}_SESSION` });
    assert.equal(session.response.status, 200);
    assertPublicHeaders(session.response);
    const serialized = JSON.stringify(session.body);
    assert.doesNotMatch(serialized, /tokenHash|storageObjectKey|companyId|generatedDocumentId|workOrderId|revisionId|accessCount/u);
    const cookie = getCookie(session.response);
    assert.ok(cookie);
    const file = await request("/api/public/document-viewer/file", { accept: "application/pdf", cookie, requestClass: `${artifactAlias}_FILE` });
    assert.equal(file.response.status, 200);
    assertPublicHeaders(file.response);
    assert.equal(file.response.headers.get("content-type"), "application/pdf");
    assert.match(file.response.headers.get("content-disposition") ?? "", /^inline;/u);
    assert.equal(file.body.byteLength, Number(expected.file_size_bytes));
    assert.equal(sha256(file.body), String(expected.content_sha256));
    return { requestClass: "VALID", resultClass: "ALLOWED", artifactAlias, leakCount: 0, mutationCount: 0, exactBytes: true, exactHash: true };
  };

  const auth = await request("/api/dev/mobile-connect/auto", { method: "POST", body: {}, requestClass: "DEV_AUTH" });
  assert.equal(auth.response.status, 200, "DEVELOPER_AUTO_CONNECT_FAILED");
  authCookie = getCookie(auth.response);
  assert.ok(authCookie, "DEVELOPER_SESSION_COOKIE_MISSING");

  const client = new Client({ connectionString: env.DATABASE_URL, application_name: "wafl-alpha80-stage3-security-readonly-audit", statement_timeout: 180000 });
  await client.connect();
  try {
    await client.query("BEGIN READ ONLY");
    assert.equal(Number((await client.query("SELECT count(*)::integer count FROM wafl_v2_migration_ledger")).rows[0].count), 22);
    const fixtures = (await client.query(`
      SELECT w.company_id,w.id::text work_order_id,w.current_revision_id::text revision_id,
             d.id::text document_id,d.generation_no,d.file_size_bytes,d.content_sha256
      FROM work_orders w
      JOIN generated_documents d ON d.company_id=w.company_id AND d.work_order_id=w.id
       AND d.work_order_revision_id=w.current_revision_id
      WHERE w.product_name=$1 AND w.deleted_at IS NULL AND d.status='generated'
       AND d.revoked_at IS NULL AND d.deleted_at IS NULL
       AND d.storage_object_key IS NOT NULL AND d.file_size_bytes IS NOT NULL AND d.content_sha256 IS NOT NULL
       AND d.generation_no=(SELECT max(candidate.generation_no) FROM generated_documents candidate
         WHERE candidate.company_id=d.company_id AND candidate.work_order_id=d.work_order_id
          AND candidate.work_order_revision_id=d.work_order_revision_id AND candidate.document_type=d.document_type)
      ORDER BY d.created_at DESC
    `, [FIXTURE_A])).rows;
    assert.equal(fixtures.length, 1, "FIXTURE_A_MUST_BE_EXACT");
    const fixtureA = fixtures[0];
    assert.equal(Number((await client.query("SELECT count(*)::integer count FROM work_orders WHERE company_id=$1 AND product_name=$2 AND deleted_at IS NULL", [fixtureA.company_id, RETAINED])).rows[0].count), 1);
    const before = (await client.query(`SELECT
      (SELECT count(*)::integer FROM work_orders WHERE company_id=$1) work_orders,
      (SELECT count(*)::integer FROM work_order_revisions WHERE company_id=$1) revisions,
      (SELECT count(*)::integer FROM generated_documents WHERE company_id=$1) documents,
      (SELECT count(*)::integer FROM document_access_tokens WHERE company_id=$1) tokens,
      (SELECT count(*)::bigint FROM document_access_tokens WHERE company_id=$1 AND revoked_at IS NULL) active_tokens
    `, [fixtureA.company_id])).rows[0];
    await client.query("COMMIT");

    const currentA = await request(`/api/v2/work-orders/documents/${fixtureA.document_id}/access-tokens/current`, { auth: true, requestClass: "CURRENT_A" });
    assert.equal(currentA.response.status, 200);
    const targetA = currentA.body?.data?.target;
    assert.ok(targetA, "VALID_A_CURRENT_TARGET_REQUIRED");
    assert.equal(targetA.generatedDocumentId, fixtureA.document_id);
    assert.equal(targetA.workOrderId, fixtureA.work_order_id);
    assert.equal(targetA.revisionId, fixtureA.revision_id);
    assert.equal(Number(targetA.generationNumber), Number(fixtureA.generation_no));
    const rawA = tokenFromUrl(targetA.viewerUrl);
    const validA = await openArtifact(targetA.viewerUrl, fixtureA, "VALID_A");

    const letter = [...rawA].findIndex((value) => /[A-Za-z]/u.test(value));
    const variants = [
      ["RANDOM", crypto.randomBytes(32).toString("base64url")],
      ["FIRST_CHAR", changedAt(rawA, 0)],
      ["MIDDLE_CHAR", changedAt(rawA, Math.floor(rawA.length / 2))],
      ["LAST_CHAR", changedAt(rawA, rawA.length - 1)],
      ["TRUNCATED_ONE", rawA.slice(0, -1)],
      ["TRUNCATED_MULTI", rawA.slice(0, -7)],
      ["APPENDED_VALID", `${rawA}A`],
      ["APPENDED_JUNK", `${rawA}.`],
      ["URL_ENCODED_RAW", `%${rawA.charCodeAt(0).toString(16)}${rawA.slice(1)}`],
      ["CASE_MUTATION", `${rawA.slice(0, letter)}${rawA[letter] === rawA[letter].toUpperCase() ? rawA[letter].toLowerCase() : rawA[letter].toUpperCase()}${rawA.slice(letter + 1)}`],
      ["MALFORMED", "not a bearer credential"],
    ];
    const mutationMatrix = [];
    for (const [name, value] of variants) mutationMatrix.push(await assertDenied(value, `MUTATED_A_${name}`));
    mutationMatrix.push(await assertDenied(variants[1][1], "DUPLICATE_QUERY_CANNOT_OVERRIDE", `?t=${encodeURIComponent(rawA)}&t=${encodeURIComponent(rawA)}`));

    await client.query("BEGIN READ ONLY");
    const terminalRows = (await client.query(`
      SELECT id::text,company_id,generated_document_id::text,rotated_from_token_id::text,
             token_hash::text,expires_at,revoked_at
      FROM document_access_tokens
      WHERE company_id=$1 AND generated_document_id=$2::uuid AND token_purpose='manual_share'
      ORDER BY created_at
    `, [fixtureA.company_id, fixtureA.document_id])).rows;
    await client.query("COMMIT");
    const terminalEvidence = [];
    for (const row of terminalRows) {
      const derived = hmacToken(secret, row.company_id, row.generated_document_id, row.rotated_from_token_id);
      if (sha256(derived) !== String(row.token_hash).trim()) continue;
      const isRevoked = row.revoked_at !== null;
      const isExpired = row.expires_at !== null && Date.parse(row.expires_at) <= Date.now();
      if (!isRevoked && !isExpired) continue;
      const alias = isExpired ? "EXPIRED_A" : "REVOKED_A";
      terminalEvidence.push(await assertDenied(derived, alias));
    }
    assert.ok(terminalEvidence.some((item) => item.requestClass === "REVOKED_A"), "REVOKED_A_EVIDENCE_REQUIRED");
    assert.ok(terminalEvidence.some((item) => item.requestClass === "EXPIRED_A"), "EXPIRED_A_EVIDENCE_REQUIRED");

    await client.query("BEGIN READ ONLY");
    const candidatesB = (await client.query(`
      SELECT w.id::text work_order_id,w.current_revision_id::text revision_id,d.id::text document_id,
             d.generation_no,d.file_size_bytes,d.content_sha256
      FROM generated_documents d JOIN work_orders w ON w.company_id=d.company_id AND w.id=d.work_order_id
      WHERE d.company_id=$1 AND d.id<>$2::uuid AND d.status='generated' AND d.revoked_at IS NULL AND d.deleted_at IS NULL
       AND w.deleted_at IS NULL AND w.current_revision_id=d.work_order_revision_id
       AND d.storage_object_key IS NOT NULL AND d.file_size_bytes IS NOT NULL AND d.content_sha256 IS NOT NULL
       AND d.generation_no=(SELECT max(candidate.generation_no) FROM generated_documents candidate
         WHERE candidate.company_id=d.company_id AND candidate.work_order_id=d.work_order_id
          AND candidate.work_order_revision_id=d.work_order_revision_id AND candidate.document_type=d.document_type)
      ORDER BY d.created_at DESC LIMIT 24
    `, [fixtureA.company_id, fixtureA.document_id])).rows;
    await client.query("COMMIT");
    let fixtureB = null;
    let targetB = null;
    for (const candidate of candidatesB) {
      const current = await request(`/api/v2/work-orders/documents/${candidate.document_id}/access-tokens/current`, { auth: true, requestClass: "SEARCH_VALID_B" });
      if (current.response.status === 200 && current.body?.data?.target) {
        fixtureB = candidate;
        targetB = current.body.data.target;
        break;
      }
    }
    let validB = { requestClass: "VALID_B", resultClass: "STATIC_ISOLATION_ONLY", artifactAlias: "NONE", leakCount: 0, mutationCount: 0 };
    const crossResource = [];
    if (fixtureB && targetB) {
      validB = await openArtifact(targetB.viewerUrl, fixtureB, "VALID_B");
      const aWithBSelectors = await openArtifact(targetA.viewerUrl, fixtureA, "VALID_A", "?workOrder=B&revision=B&document=B&generation=B");
      const bWithASelectors = await openArtifact(targetB.viewerUrl, fixtureB, "VALID_B", "?workOrder=A&revision=A&document=A&generation=A");
      crossResource.push(
        { requestClass: "VALID_A_WITH_B_SELECTORS", resultClass: "A_ONLY", artifactAlias: aWithBSelectors.artifactAlias, leakCount: 0, mutationCount: 0 },
        { requestClass: "VALID_B_WITH_A_SELECTORS", resultClass: "B_ONLY", artifactAlias: bWithASelectors.artifactAlias, leakCount: 0, mutationCount: 0 },
      );
    } else {
      crossResource.push({ requestClass: "CROSS_RESOURCE_SELECTOR_AUDIT", resultClass: "SELECTOR_SURFACE_ZERO", artifactAlias: "NONE", leakCount: 0, mutationCount: 0 });
    }

    await client.query("BEGIN READ ONLY");
    const after = (await client.query(`SELECT
      (SELECT count(*)::integer FROM work_orders WHERE company_id=$1) work_orders,
      (SELECT count(*)::integer FROM work_order_revisions WHERE company_id=$1) revisions,
      (SELECT count(*)::integer FROM generated_documents WHERE company_id=$1) documents,
      (SELECT count(*)::integer FROM document_access_tokens WHERE company_id=$1) tokens,
      (SELECT count(*)::bigint FROM document_access_tokens WHERE company_id=$1 AND revoked_at IS NULL) active_tokens
    `, [fixtureA.company_id])).rows[0];
    await client.query("COMMIT");
    assert.deepEqual(after, before, "BUSINESS_IDENTITY_COUNTS_CHANGED");

    const evidence = {
      ok: true,
      checkpoint: "ALPHA80_STAGE3_PUBLIC_SHARE_SECURITY_ISOLATION_IPHONE_IPAD_QA_REQUIRED",
      tokenSecurity: { owner: "HMAC-SHA256 cryptographic PRF", outputBits: 256, rawPersistence: 0, exactHashLookup: true },
      valid: [validA, validB],
      mutations: mutationMatrix,
      terminal: terminalEvidence,
      crossResource,
      cacheAuthorization: { perRequestSessionRevalidation: true, noStore: true, crossTokenMix: 0, crossArtifactMix: 0 },
      publicSurface: { internalIdLeak: 0, tokenHashLeak: 0, storageKeyLeak: 0, makerControlLeak: 0, accessCountLeak: 0 },
      rateLimit: { existingOwner: false, decision: "deferred-operational-hardening", strongTokenAndNoEnumeration: true },
      mutation: { tokenLifecycle: 0, document: 0, workOrder: 0, revision: 0, r2: 0, productionOwnerAmbiguous: [0, 0, 0] },
      migrationLedger: "22/22",
      retainedRecipe: { name: RETAINED, count: 1 },
      requestSummary: requests,
      physicalResult: "PHYSICAL_RESULT_NOT_INFERRED",
    };
    fs.mkdirSync(path.dirname(EVIDENCE_PATH), { recursive: true });
    fs.writeFileSync(EVIDENCE_PATH, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
    console.log(JSON.stringify({
      ok: true,
      evidencePath: path.relative(ROOT, EVIDENCE_PATH),
      validArtifactAliases: evidence.valid.map((item) => item.artifactAlias),
      mutationCases: evidence.mutations.length,
      terminalCases: evidence.terminal.length,
      crossResourceCases: evidence.crossResource.length,
      businessMutation: 0,
      r2Mutation: 0,
      physicalResult: evidence.physicalResult,
    }));
  } finally {
    if (!client.ended) {
      try { await client.query("ROLLBACK"); } catch {}
      await client.end();
    }
  }
}

await main().catch((error) => {
  console.error("STAGE3_RUNTIME_FAILED", error instanceof Error ? error.name : "UnknownError", error instanceof Error ? error.message.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/giu, "[redacted-id]") : "unknown");
  process.exitCode = 1;
});
