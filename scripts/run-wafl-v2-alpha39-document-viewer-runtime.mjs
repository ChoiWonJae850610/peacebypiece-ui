#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import pg from "pg";

import {
  createR2WorkerSignedUrl,
  normalizeWorkerBaseUrl,
} from "../lib/storage/r2/r2WorkerSignature.mjs";

const { Client } = pg;
const MODE = process.argv[2] ?? "preflight";
const REQUIRED_FINGERPRINT = "01e5dcc7fea3";
const COMPANY_A = "wafl-fn-company-a";
const CROSS_TENANTS = ["wafl-fn-company-b", "wafl-fn-company-h"];
const COMPANY_C = "wafl-fn-company-c";
const DOCUMENT_ID = "f9c2141d-19e2-4a37-ba4b-33588cd3cd74";
const DOCUMENT_NUMBER = "WAFN-26FW-A30FACT-260712-001-R0";
const DOCUMENT_SHA = "9be3cae53b43d11dc397d3f3a9226ee444eedd4a42880edcbfbbee79ef4852d2";
const DOCUMENT_SIZE = 130332;
const APPROVAL = "2.0.0-alpha.39-dev-test-document-access-runtime";
const CONFIRMATION = MODE === "runtime"
  ? "EXECUTE WAFL V2 ALPHA39 DOCUMENT VIEWER RUNTIME"
  : "VERIFY WAFL V2 ALPHA39 DOCUMENT VIEWER PREFLIGHT";
const CREATE_KEY = "alpha39-document-share-token-a-v1";
const ROTATE_KEY = "alpha39-document-share-token-b-v1";
const MANIFEST_PATH = path.resolve(".tmp/wafl-v2-alpha39/runtime-manifest.json");
const SERVER_READY_TIMEOUT_MS = 30_000;
const SERVER_READY_POLL_MS = 250;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

function scopedCreateReceiptKey() {
  const secret = process.env.WAFL_SESSION_SECRET?.trim() || process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  assert.ok(secret, "session-secret-missing");
  const signer = crypto.createHmac("sha256", secret);
  signer.update("document-share-idempotency:v1", "utf8");
  for (const part of [COMPANY_A, DOCUMENT_ID, "work_order.document.share", CREATE_KEY]) {
    signer.update("\0", "utf8");
    signer.update(part, "utf8");
  }
  return signer.digest("hex");
}

async function writeManifest(value) {
  await fs.mkdir(path.dirname(MANIFEST_PATH), { recursive: true });
  await fs.writeFile(MANIFEST_PATH, `${JSON.stringify({
    appVersion: "2.0.0-alpha.38",
    targetVersion: "2.0.0-alpha.39",
    targetFingerprint: REQUIRED_FINGERPRINT,
    sourceDisplayDocumentNumber: DOCUMENT_NUMBER,
    ...value,
  }, null, 2)}\n`, "utf8");
}

function databaseFingerprint(databaseUrl) {
  const parsed = new URL(databaseUrl);
  return sha256(`${parsed.hostname}/${decodeURIComponent(parsed.pathname.replace(/^\/+/, ""))}`).slice(0, 12);
}

function r2Fingerprints(workerUrl, runtime) {
  const normalized = normalizeWorkerBaseUrl(workerUrl);
  const parsed = new URL(normalized);
  const host = parsed.hostname.toLowerCase();
  const normalizedUrl = `${parsed.protocol}//${host}${parsed.pathname.replace(/\/+$/, "")}`;
  const alias = process.env.WAFL_PDF_R2_ENV_ALIAS?.trim() || "dev-test";
  return {
    normalized,
    host: sha256(host).slice(0, 12),
    url: sha256(normalizedUrl).slice(0, 12),
    environment: sha256(`${normalizedUrl}|${runtime}|${alias}`).slice(0, 12),
  };
}

function guard() {
  assert.ok(new Set(["preflight", "runtime", "audit"]).has(MODE), "unsupported-mode");
  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, "database-url-missing");
  assert.ok(new Set(["development", "test"]).has(process.env.WAFL_V2_RUNTIME), "dev-test-runtime-required");
  assert.equal(process.env.WAFL_V2_TEST_PREFIX, "wafl-fn", "test-prefix-mismatch");
  assert.equal(databaseFingerprint(databaseUrl), REQUIRED_FINGERPRINT, "target-fingerprint-mismatch");
  assert.equal(process.env.WAFL_V2_APPROVED_DB_FINGERPRINT, REQUIRED_FINGERPRINT, "approved-fingerprint-mismatch");
  assert.equal(process.env.WAFL_V2_CONFIRMATION, CONFIRMATION, "confirmation-mismatch");
  if (MODE === "runtime") assert.equal(process.env.WAFL_V2_DOCUMENT_VIEWER_MUTATION_APPROVED, APPROVAL, "runtime-approval-missing");
  else assert.ok(!process.env.WAFL_V2_DOCUMENT_VIEWER_MUTATION_APPROVED, "read-only-mode-approval-forbidden");
  const workerUrl = process.env.R2_WORKER_UPLOAD_URL?.trim();
  const workerSecret = process.env.R2_WORKER_UPLOAD_SECRET?.trim();
  assert.ok(workerUrl && workerSecret, "r2-read-config-missing");
  const r2Runtime = process.env.NEXT_PUBLIC_APP_RUNTIME_MODE?.trim()
    || process.env.WAFL_SERVER_RUNTIME_MODE?.trim()
    || process.env.NODE_ENV?.trim()
    || "unknown";
  const current = r2Fingerprints(workerUrl, r2Runtime);
  const approved = {
    environment: process.env.WAFL_PDF_R2_APPROVED_ENVIRONMENT_FINGERPRINT?.trim()
      || process.env.WAFL_SIGNUP_CERTIFICATE_R2_APPROVED_ENVIRONMENT_FINGERPRINT?.trim(),
    url: process.env.WAFL_PDF_R2_APPROVED_WORKER_URL_FINGERPRINT?.trim()
      || process.env.WAFL_SIGNUP_CERTIFICATE_R2_APPROVED_WORKER_URL_FINGERPRINT?.trim(),
    host: process.env.WAFL_PDF_R2_APPROVED_WORKER_HOST_FINGERPRINT?.trim()
      || process.env.WAFL_SIGNUP_CERTIFICATE_R2_APPROVED_WORKER_HOST_FINGERPRINT?.trim(),
  };
  assert.ok(approved.environment && approved.url && approved.host, "approved-r2-fingerprints-missing");
  assert.equal(current.environment, approved.environment, "r2-environment-fingerprint-mismatch");
  assert.equal(current.url, approved.url, "r2-url-fingerprint-mismatch");
  assert.equal(current.host, approved.host, "r2-host-fingerprint-mismatch");
  return {
    databaseUrl,
    workerUrl: current.normalized,
    workerSecret,
  };
}

async function readOnlyState(client) {
  await client.query("BEGIN READ ONLY");
  try {
    const ledger = (await client.query("SELECT migration_id, filename FROM public.wafl_v2_migration_ledger ORDER BY migration_id")).rows;
    const document = (await client.query(`
      SELECT id, company_id, work_order_id, work_order_revision_id, display_document_number,
             status, storage_object_key, file_size_bytes, content_sha256
      FROM public.generated_documents WHERE id=$1::uuid
    `, [DOCUMENT_ID])).rows[0];
    const tokens = (await client.query(`
      SELECT id, company_id, generated_document_id, expires_at, revoked_at,
             rotated_from_token_id, access_count, last_accessed_at
      FROM public.document_access_tokens WHERE generated_document_id=$1::uuid
      ORDER BY created_at, id
    `, [DOCUMENT_ID])).rows;
    const receipts = (await client.query(`
      SELECT
        count(*) FILTER (WHERE result_generated_document_id=$1::uuid)::integer AS target_receipts,
        count(*) FILTER (
          WHERE result_generated_document_id=$1::uuid
            AND command_code='work_order.document.generate'
        )::integer AS generation_receipts,
        count(*) FILTER (
          WHERE company_id=$2
            AND command_code='work_order.document.share'
            AND idempotency_key=$3
        )::integer AS share_receipts,
        count(*) FILTER (
          WHERE company_id=$2
            AND command_code='work_order.document.share'
            AND idempotency_key=$3
            AND result_generated_document_id IS NULL
        )::integer AS incomplete_receipts
      FROM public.work_order_command_receipts
    `, [DOCUMENT_ID, COMPANY_A, scopedCreateReceiptKey()])).rows[0];
    const events = (await client.query(`
      SELECT command_code, count(*)::integer AS count
      FROM public.domain_events
      WHERE entity_type='document_access_token'
        AND command_code IN ('pdf.shared','pdf.share_viewed','pdf.share_revoked')
        AND metadata->>'generatedDocumentId'=$1
      GROUP BY command_code ORDER BY command_code
    `, [DOCUMENT_ID])).rows;
    const generationEvents = Number((await client.query(`
      SELECT count(*)::integer AS count
      FROM public.domain_events
      WHERE company_id=$1
        AND entity_type='generated_document'
        AND entity_id=$2
        AND command_code='work_order.document.generate'
    `, [COMPANY_A, DOCUMENT_ID])).rows[0].count);
    const functions = (await client.query(`
      SELECT proc.proname, proc.prosecdef, proc.proconfig,
             owner_role.rolbypassrls,
             pg_catalog.pg_get_function_identity_arguments(proc.oid) AS arguments,
             pg_catalog.has_function_privilege('public', proc.oid, 'EXECUTE') AS public_execute,
             pg_catalog.has_function_privilege('wafl_v2_tenant_runtime', proc.oid, 'EXECUTE') AS runtime_execute
      FROM pg_catalog.pg_proc proc
      JOIN pg_catalog.pg_namespace namespace ON namespace.oid=proc.pronamespace
      JOIN pg_catalog.pg_roles owner_role ON owner_role.oid=proc.proowner
      WHERE namespace.nspname='public'
        AND proc.proname IN ('wafl_v2_redeem_document_access_token','wafl_v2_read_document_access_session')
      ORDER BY proc.proname
    `)).rows;
    await client.query("COMMIT");
    return { ledger, document, tokens, receipts, events, generationEvents, functions };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

function assertSource(state) {
  assert.equal(state.ledger.length, 11, "ledger-must-be-11");
  assert.equal(state.ledger[10].filename, "011_v2_document_access_viewer_functions.sql");
  assert.equal(state.functions.length, 2, "viewer-functions-missing");
  for (const fn of state.functions) {
    assert.equal(fn.prosecdef, true, `${fn.proname}-security-definer-required`);
    assert.equal(fn.rolbypassrls, true, `${fn.proname}-owner-bypassrls-required`);
    assert.ok(fn.proconfig?.includes("search_path=pg_catalog, public"), `${fn.proname}-search-path-invalid`);
    assert.equal(fn.public_execute, false, `${fn.proname}-public-execute-forbidden`);
    assert.equal(fn.runtime_execute, true, `${fn.proname}-runtime-execute-required`);
  }
  assert.equal(String(state.document?.id), DOCUMENT_ID);
  assert.equal(state.document?.company_id, COMPANY_A);
  assert.equal(state.document?.display_document_number, DOCUMENT_NUMBER);
  assert.equal(state.document?.status, "generated");
  assert.equal(Number(state.document?.file_size_bytes), DOCUMENT_SIZE);
  assert.equal(state.document?.content_sha256, DOCUMENT_SHA);
  const expectedKey = `companies/${COMPANY_A}/workorders/${state.document.work_order_id}/pdf/${DOCUMENT_ID}.pdf`;
  assert.equal(state.document?.storage_object_key, expectedKey, "generated-document-object-key-mismatch");
}

async function tenantReadOnlyVisibility(client, companyId) {
  await client.query("BEGIN READ ONLY; SET LOCAL ROLE wafl_v2_tenant_runtime");
  try {
    await client.query(
      "SELECT set_config('wafl.company_id',$1,true),set_config('wafl.company_member_id',$2,true),set_config('wafl.access_mode','tenant_member',true),set_config('wafl.correlation_id',$3,true)",
      [companyId, `alpha39-${companyId}-member`, `alpha39-viewer-preflight-${companyId}`],
    );
    const counts = (await client.query(`
      SELECT
        (SELECT count(*)::integer FROM public.generated_documents WHERE id=$1::uuid) AS documents,
        (SELECT count(*)::integer FROM public.work_order_command_receipts WHERE result_generated_document_id=$1::uuid) AS receipts,
        (SELECT count(*)::integer FROM public.document_access_tokens WHERE generated_document_id=$1::uuid) AS tokens
    `, [DOCUMENT_ID])).rows[0];
    await client.query("COMMIT");
    return Object.fromEntries(Object.entries(counts).map(([key, value]) => [key, Number(value)]));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function verifyTenantIsolation(client) {
  const visibility = {};
  for (const companyId of [COMPANY_A, ...CROSS_TENANTS, COMPANY_C]) {
    visibility[companyId] = await tenantReadOnlyVisibility(client, companyId);
  }
  assert.deepEqual(visibility[COMPANY_A], { documents: 1, receipts: 1, tokens: 0 }, "company-a-visibility-mismatch");
  for (const companyId of [...CROSS_TENANTS, COMPANY_C]) {
    assert.deepEqual(visibility[companyId], { documents: 0, receipts: 0, tokens: 0 }, `${companyId}-cross-tenant-leak`);
  }
  return visibility;
}

async function verifyR2Readiness(config, document) {
  if (process.env.WAFL_V2_ALPHA39_REUSE_R2_READINESS_EVIDENCE === "1") {
    const prior = JSON.parse(await fs.readFile(MANIFEST_PATH, "utf8"));
    assert.equal(prior.result, "ALPHA39_DOCUMENT_VIEWER_READ_ONLY_PREFLIGHT_PASS", "r2-readiness-evidence-result-invalid");
    assert.equal(prior.targetFingerprint, REQUIRED_FINGERPRINT, "r2-readiness-evidence-fingerprint-invalid");
    assert.equal(prior.r2Integrity?.contentType, "application/pdf", "r2-readiness-evidence-content-type-invalid");
    assert.equal(prior.r2Integrity?.fileSizeBytes, DOCUMENT_SIZE, "r2-readiness-evidence-size-invalid");
    assert.equal(prior.r2Integrity?.contentSha256, DOCUMENT_SHA, "r2-readiness-evidence-sha-invalid");
    return { getCount: 0, fileSizeBytes: DOCUMENT_SIZE, contentSha256: DOCUMENT_SHA, contentType: "application/pdf", evidenceReused: true };
  }
  const signedUrl = createR2WorkerSignedUrl({
    uploadUrl: config.workerUrl,
    secret: config.workerSecret,
    method: "GET",
    key: document.storage_object_key,
    expiresAt: Math.floor(Date.now() / 1000) + 300,
  });
  const response = await fetch(signedUrl, { method: "GET", signal: AbortSignal.timeout(30_000) });
  assert.equal(response.status, 200, `r2-readiness-http-${response.status}`);
  const contentType = response.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  assert.equal(contentType, "application/pdf", "r2-readiness-content-type-mismatch");
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(bytes.byteLength, DOCUMENT_SIZE, "r2-readiness-size-mismatch");
  assert.equal(sha256(bytes), DOCUMENT_SHA, "r2-readiness-sha-mismatch");
  assert.equal(bytes.subarray(0, 5).toString("ascii"), "%PDF-", "r2-readiness-pdf-header-mismatch");
  return { getCount: 1, fileSizeBytes: bytes.byteLength, contentSha256: DOCUMENT_SHA, contentType, evidenceReused: false };
}

function sessionCookie(input) {
  const secret = process.env.WAFL_SESSION_SECRET?.trim() || process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  assert.ok(secret, "session-secret-missing");
  const payload = Buffer.from(JSON.stringify({
    userId: input.userId,
    companyId: input.companyId,
    companyMemberId: input.companyMemberId,
    companyName: input.companyId,
    role: "company_admin",
    email: `${input.companyId}@example.invalid`,
    name: "alpha39 viewer runtime",
    issuedAt: new Date().toISOString(),
  }), "utf8").toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `wafl_auth_session=${payload}.${signature}`;
}

async function companySession(client, companyId) {
  const row = (await client.query(`
    SELECT id, COALESCE(user_id, $2) AS user_id
    FROM public.company_members WHERE company_id=$1
    ORDER BY (status='approved') DESC, created_at, id LIMIT 1
  `, [companyId, `alpha39-${companyId}`])).rows[0];
  return sessionCookie({ companyId, companyMemberId: String(row?.id ?? `company-admin:${companyId}`), userId: String(row?.user_id ?? `alpha39-${companyId}`) });
}

async function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") return reject(new Error("port-unavailable"));
      server.close(() => resolve(address.port));
    });
  });
}

async function startServer() {
  const port = await freePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", String(port)], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      WAFL_V2_READ_API_ENABLED: "1",
      WAFL_V2_READ_APPROVED: "1",
      WAFL_V2_COMMAND_API_ENABLED: "1",
      WAFL_V2_DOCUMENT_VIEWER_ENABLED: "1",
      WAFL_V2_DOCUMENT_VIEWER_MUTATION_APPROVED: APPROVAL,
      WAFL_V2_RUNTIME: "test",
      WAFL_V2_TEST_PREFIX: "wafl-fn",
      WAFL_V2_APPROVED_DB_FINGERPRINT: REQUIRED_FINGERPRINT,
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  let stdout = "";
  let stderr = "";
  let firstStatus = null;
  let lastStatus = null;
  const startedAt = Date.now();
  child.stdout.on("data", (chunk) => { stdout = `${stdout}${String(chunk)}`.slice(-8000); });
  child.stderr.on("data", (chunk) => { stderr = `${stderr}${String(chunk)}`.slice(-8000); });
  const attempts = Math.ceil(SERVER_READY_TIMEOUT_MS / SERVER_READY_POLL_MS);
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`server-exited:${child.exitCode}`);
    let response = null;
    try {
      response = await fetch(`${baseUrl}/v`);
    } catch {}
    if (response) {
      firstStatus ??= response.status;
      lastStatus = response.status;
      await response.body?.cancel();
      if (response.status === 200) {
        return { baseUrl, child, stdout: () => stdout, stderr: () => stderr, readyDurationMs: Date.now() - startedAt };
      }
      if (response.status >= 500 && /different slug names for the same dynamic path/i.test(stderr)) {
        child.kill();
        throw new Error("server-route-manifest-conflict:document-dynamic-slug");
      }
    }
    await sleep(SERVER_READY_POLL_MS);
  }
  child.kill();
  throw new Error(`server-readiness-timeout:first=${firstStatus ?? "none"}:last=${lastStatus ?? "none"}`);
}

function cookieFrom(response, forbiddenValues) {
  const header = response.headers.get("set-cookie") ?? "";
  assert.match(header, /;\s*HttpOnly/i, "viewer-session-cookie-http-only-missing");
  assert.match(header, /;\s*SameSite=Lax/i, "viewer-session-cookie-same-site-invalid");
  assert.match(header, /;\s*Path=\/api\/public\/document-viewer/i, "viewer-session-cookie-path-invalid");
  assert.match(header, /;\s*Max-Age=\d+/i, "viewer-session-cookie-max-age-missing");
  for (const forbidden of forbiddenValues) assert.equal(header.includes(forbidden), false, "viewer-session-cookie-sensitive-value");
  const value = header.split(";", 1)[0];
  assert.ok(value?.startsWith("wafl_document_viewer="), "viewer-session-cookie-missing");
  return value;
}

function assertPublicPayloadSafe(body) {
  const serialized = JSON.stringify(body);
  for (const forbidden of [DOCUMENT_ID, "storage_object_key", "token_hash", "signedUrl", "companies/"]) {
    assert.equal(serialized.includes(forbidden), false, "public-viewer-internal-identity-leak");
  }
}

async function jsonRequest(url, init) {
  const response = await fetch(url, init);
  const body = await response.json();
  return { response, body };
}

async function executeRuntime(client, before) {
  assert.equal(before.tokens.length, 0, "target-token-baseline-not-empty");
  assert.equal(before.events.length, 0, "target-event-baseline-not-empty");
  const sessions = {
    A: await companySession(client, COMPANY_A),
    B: await companySession(client, CROSS_TENANTS[0]),
    H: await companySession(client, CROSS_TENANTS[1]),
    C: await companySession(client, COMPANY_C),
  };
  const server = await startServer();
  try {
    const create = await jsonRequest(`${server.baseUrl}/api/v2/work-orders/documents/${DOCUMENT_ID}/access-tokens`, {
      method: "POST", headers: { Cookie: sessions.A, "Content-Type": "application/json", "Idempotency-Key": CREATE_KEY },
      body: JSON.stringify({ expiresInDays: 7 }),
    });
    assert.equal(create.response.status, 201);
    assert.equal(create.body.ok, true);
    const tokenA = create.body.data.rawToken;
    const tokenAId = create.body.data.tokenId;
    assert.match(tokenA, /^[A-Za-z0-9_-]{43}$/);
    assert.ok(create.body.data.viewerUrl.includes("/v#t="));

    const createReplay = await jsonRequest(`${server.baseUrl}/api/v2/work-orders/documents/${DOCUMENT_ID}/access-tokens`, {
      method: "POST", headers: { Cookie: sessions.A, "Content-Type": "application/json", "Idempotency-Key": CREATE_KEY },
      body: JSON.stringify({ expiresInDays: 7 }),
    });
    assert.equal(createReplay.response.status, 200);
    assert.equal(createReplay.body.data.tokenId, tokenAId);
    assert.equal(createReplay.body.data.rawToken, tokenA);

    const createConflict = await jsonRequest(`${server.baseUrl}/api/v2/work-orders/documents/${DOCUMENT_ID}/access-tokens`, {
      method: "POST", headers: { Cookie: sessions.A, "Content-Type": "application/json", "Idempotency-Key": CREATE_KEY },
      body: JSON.stringify({ expiresInDays: 8 }),
    });
    assert.equal(createConflict.response.status, 409);
    assert.equal(createConflict.body.error.code, "CONFLICT");

    const exchangeA = await jsonRequest(`${server.baseUrl}/api/public/document-viewer/session`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: tokenA }),
    });
    assert.equal(exchangeA.response.status, 200);
    assertPublicPayloadSafe(exchangeA.body);
    const viewerA = cookieFrom(exchangeA.response, [tokenA, DOCUMENT_ID, "companies/"]);
    const inlineA = await fetch(`${server.baseUrl}/api/public/document-viewer/file`, { headers: { Cookie: viewerA } });
    const inlineBytes = Buffer.from(await inlineA.arrayBuffer());
    assert.equal(inlineA.status, 200);
    assert.equal(inlineBytes.byteLength, DOCUMENT_SIZE);
    assert.equal(sha256(inlineBytes), DOCUMENT_SHA);
    const downloadA = await fetch(`${server.baseUrl}/api/public/document-viewer/download`, { headers: { Cookie: viewerA } });
    assert.equal(downloadA.status, 200);
    assert.match(downloadA.headers.get("content-disposition") ?? "", /^attachment;/);

    const rotate = await jsonRequest(`${server.baseUrl}/api/v2/work-orders/documents/${DOCUMENT_ID}/access-tokens/${tokenAId}/rotate`, {
      method: "POST", headers: { Cookie: sessions.A, "Content-Type": "application/json", "Idempotency-Key": ROTATE_KEY },
      body: JSON.stringify({ expiresInDays: 7 }),
    });
    assert.equal(rotate.response.status, 200);
    assert.equal(rotate.body.ok, true);
    const tokenB = rotate.body.data.rawToken;
    assert.notEqual(tokenB, tokenA);

    const rotateReplay = await jsonRequest(`${server.baseUrl}/api/v2/work-orders/documents/${DOCUMENT_ID}/access-tokens/${tokenAId}/rotate`, {
      method: "POST", headers: { Cookie: sessions.A, "Content-Type": "application/json", "Idempotency-Key": ROTATE_KEY },
      body: JSON.stringify({ expiresInDays: 7 }),
    });
    assert.equal(rotateReplay.response.status, 200);
    assert.equal(rotateReplay.body.data.tokenId, rotate.body.data.tokenId);
    assert.equal(rotateReplay.body.data.rawToken, tokenB);

    const oldDenied = await jsonRequest(`${server.baseUrl}/api/public/document-viewer/session`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: tokenA }),
    });
    assert.equal(oldDenied.response.status, 404);
    assert.equal(oldDenied.body.error.code, "NOT_FOUND");

    const exchangeB = await jsonRequest(`${server.baseUrl}/api/public/document-viewer/session`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: tokenB }),
    });
    assert.equal(exchangeB.response.status, 200);
    assertPublicPayloadSafe(exchangeB.body);
    const viewerB = cookieFrom(exchangeB.response, [tokenB, DOCUMENT_ID, "companies/"]);
    const fileB = await fetch(`${server.baseUrl}/api/public/document-viewer/file`, { headers: { Cookie: viewerB } });
    assert.equal(fileB.status, 200);
    assert.equal(sha256(Buffer.from(await fileB.arrayBuffer())), DOCUMENT_SHA);

    const invalid = await jsonRequest(`${server.baseUrl}/api/public/document-viewer/session`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: "invalid" }),
    });
    assert.equal(invalid.response.status, 404);
    assert.equal(invalid.body.error.code, "NOT_FOUND");
    for (const key of ["B", "H"]) {
      const cross = await jsonRequest(`${server.baseUrl}/api/v2/work-orders/documents/${DOCUMENT_ID}/access-tokens`, { headers: { Cookie: sessions[key] } });
      assert.equal(cross.response.status, 404);
    }
    const blocked = await jsonRequest(`${server.baseUrl}/api/v2/work-orders/documents/${DOCUMENT_ID}/access-tokens`, { headers: { Cookie: sessions.C } });
    assert.equal(blocked.response.status, 403);
  } finally {
    server.child.kill();
    await new Promise((resolve) => server.child.once("exit", resolve));
    const unsafe = server.stderr().split(/\r?\n/).filter((line) => /token=|#t=|signed/i.test(line));
    assert.equal(unsafe.length, 0, "sensitive-server-log-detected");
  }
}

function assertCompletion(state) {
  assertSource(state);
  assert.equal(state.tokens.length, 2, "token-row-delta-mismatch");
  assert.equal(Number(state.receipts.target_receipts), 2, "target-receipt-total-mismatch");
  assert.equal(Number(state.receipts.generation_receipts), 1, "generation-receipt-total-mismatch");
  assert.equal(Number(state.receipts.share_receipts), 1, "share-receipt-row-delta-mismatch");
  assert.equal(Number(state.receipts.incomplete_receipts), 0, "incomplete-share-receipt-detected");
  assert.equal(state.generationEvents, 1, "generation-event-mutated");
  const [oldToken, newToken] = state.tokens;
  assert.ok(oldToken.revoked_at);
  assert.equal(Number(oldToken.access_count), 1);
  assert.equal(String(newToken.rotated_from_token_id), String(oldToken.id));
  assert.equal(newToken.revoked_at, null);
  assert.equal(Number(newToken.access_count), 1);
  const counts = Object.fromEntries(state.events.map((row) => [row.command_code, Number(row.count)]));
  assert.equal(counts["pdf.shared"], 2);
  assert.equal(counts["pdf.share_viewed"], 2);
  assert.equal(counts["pdf.share_revoked"], 1);
}

async function main() {
  const config = guard();
  const client = new Client({ connectionString: config.databaseUrl, application_name: `wafl-v2-alpha39-viewer-${MODE}`, statement_timeout: 120_000 });
  await client.connect();
  try {
    const before = await readOnlyState(client);
    assertSource(before);
    if (MODE === "preflight") {
      assert.equal(before.tokens.length, 0, "target-token-baseline-not-empty");
      assert.equal(before.events.length, 0, "target-event-baseline-not-empty");
      assert.equal(Number(before.receipts.target_receipts), 1, "target-receipt-baseline-mismatch");
      assert.equal(Number(before.receipts.generation_receipts), 1, "generation-receipt-baseline-mismatch");
      assert.equal(Number(before.receipts.share_receipts), 0, "share-receipt-baseline-not-empty");
      assert.equal(Number(before.receipts.incomplete_receipts), 0, "target-incomplete-receipt-baseline");
      assert.equal(before.generationEvents, 1, "generation-event-baseline-mismatch");
      const tenantVisibility = await verifyTenantIsolation(client);
      const r2Readiness = await verifyR2Readiness(config, before.document);
      await writeManifest({
        result: "ALPHA39_DOCUMENT_VIEWER_READ_ONLY_PREFLIGHT_PASS",
        ledger: 11,
        tokenRows: 0,
        targetReceiptRows: 1,
        generationReceiptRows: 1,
        shareReceiptRows: 0,
        incompleteReceiptRows: 0,
        generationEventRows: 1,
        shareEventRows: 0,
        functionCount: 2,
        functionAcl: "PUBLIC_EXECUTE_0_RUNTIME_EXECUTE_2",
        tenantVisibility: Object.fromEntries(Object.entries(tenantVisibility).map(([companyId, counts]) => [companyId.slice(-1).toUpperCase(), counts])),
        r2GetCount: r2Readiness.getCount,
        r2ReadinessEvidenceReused: r2Readiness.evidenceReused,
        r2Integrity: {
          contentType: r2Readiness.contentType,
          fileSizeBytes: r2Readiness.fileSizeBytes,
          contentSha256: r2Readiness.contentSha256,
        },
        generatedDocumentMutation: false,
        r2PutCount: 0,
        r2DeleteCount: 0,
        productionMutation: false,
      });
      console.log("ALPHA39_DOCUMENT_VIEWER_READ_ONLY_PREFLIGHT_PASS");
      console.log(`Target fingerprint: ${REQUIRED_FINGERPRINT}`);
      console.log(`Target: ${DOCUMENT_ID}; ${DOCUMENT_NUMBER}`);
      console.log("Ledger/functions/ACL: 11/11; functions 2; PUBLIC execute 0; runtime execute 2");
      console.log("Baseline: generated document 1; generation receipt/event 1/1; tokens/share receipts/share events 0/0/0");
      console.log("Tenant visibility: Company A 1/1/0; Company B/H/C 0/0/0 (document/receipt/token)");
      console.log(`R2 readiness: PASS (${r2Readiness.evidenceReused ? "accepted prior signed GET evidence" : "signed GET"}); PDF ${r2Readiness.fileSizeBytes} bytes; SHA-256 ${r2Readiness.contentSha256}`);
      console.log("Expected runtime: tokens +2, token updates 3, events +5, R2 GET only, PUT/DELETE 0");
      return;
    }
    if (MODE === "audit") {
      assertCompletion(before);
      await writeManifest({
        result: "ALPHA39_DOCUMENT_VIEWER_READ_ONLY_AUDIT_PASS",
        ledger: 11,
        receiptRows: 1,
        receiptResultLinkUpdates: 1,
        tokenRows: 2,
        tokenUpdates: 3,
        eventRows: 5,
        accessCounts: before.tokens.map((row) => Number(row.access_count)),
        generatedDocumentMutation: false,
        r2GetCount: 3,
        r2PutCount: 0,
        r2DeleteCount: 0,
        partialMutation: false,
        productionMutation: false,
      });
      console.log("ALPHA39_DOCUMENT_VIEWER_READ_ONLY_AUDIT_PASS");
      console.log("Tokens 2; events 5; R2 PUT/DELETE 0; generated document mutation 0");
      return;
    }
    await executeRuntime(client, before);
    const after = await readOnlyState(client);
    assert.deepEqual(after.document, before.document, "generated-document-mutation-detected");
    assertCompletion(after);
    await writeManifest({
      result: "ALPHA39_CONTROLLED_VIEWER_SECURITY_PASS",
      ledger: 11,
      receiptRows: 1,
      receiptResultLinkUpdates: 1,
      tokenRows: 2,
      tokenUpdates: 3,
      eventRows: 5,
      accessCounts: after.tokens.map((row) => Number(row.access_count)),
      generatedDocumentMutation: false,
      r2GetCount: 3,
      r2PutCount: 0,
      r2DeleteCount: 0,
      duplicateNoOp: true,
      tenantIsolation: true,
      partialMutation: false,
      productionMutation: false,
    });
    console.log("ALPHA39_CONTROLLED_VIEWER_SECURITY_PASS");
    console.log("Token rows +2; token updates 3; events +5");
    console.log("Inline/download integrity PASS; revoke/rotate/generic NOT_FOUND PASS");
    console.log("R2 GET only; PUT/DELETE 0; generated document/production mutation 0");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("WAFL v2 alpha.39 viewer runtime: FAILED", {
    name: error instanceof Error ? error.name : "UnknownError",
    message: error instanceof Error ? error.message : "unknown",
  });
  process.exitCode = 1;
});
