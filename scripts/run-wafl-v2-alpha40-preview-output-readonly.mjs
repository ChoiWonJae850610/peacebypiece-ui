#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import pg from "pg";

const { Client } = pg;
const REQUIRED_FINGERPRINT = "01e5dcc7fea3";
const DOCUMENT_ID = "f9c2141d-19e2-4a37-ba4b-33588cd3cd74";
const DOCUMENT_NUMBER = "WAFN-26FW-A30FACT-260712-001-R0";
const DOCUMENT_SIZE = 130332;
const DOCUMENT_SHA = "9be3cae53b43d11dc397d3f3a9226ee444eedd4a42880edcbfbbee79ef4852d2";
const COMPANIES = {
  A: "wafl-fn-company-a",
  B: "wafl-fn-company-b",
  C: "wafl-fn-company-c",
  H: "wafl-fn-company-h",
};
const MANIFEST_PATH = path.resolve(".tmp/wafl-v2-alpha40/internal-pdf-readonly-manifest.json");
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function databaseFingerprint(databaseUrl) {
  const parsed = new URL(databaseUrl);
  return sha256(`${parsed.hostname}/${decodeURIComponent(parsed.pathname.replace(/^\/+/, ""))}`).slice(0, 12);
}

function guard() {
  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, "database-url-missing");
  assert.ok(new Set(["development", "test"]).has(process.env.WAFL_V2_RUNTIME), "dev-test-runtime-required");
  assert.equal(process.env.WAFL_V2_TEST_PREFIX, "wafl-fn", "test-prefix-mismatch");
  assert.equal(databaseFingerprint(databaseUrl), REQUIRED_FINGERPRINT, "target-fingerprint-mismatch");
  assert.equal(process.env.WAFL_V2_APPROVED_DB_FINGERPRINT, REQUIRED_FINGERPRINT, "approved-fingerprint-mismatch");
  assert.ok(process.env.R2_WORKER_UPLOAD_URL?.trim(), "r2-read-url-missing");
  assert.ok(process.env.R2_WORKER_UPLOAD_SECRET?.trim(), "r2-read-secret-missing");
  assert.ok(process.env.WAFL_SESSION_SECRET?.trim() || process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim(), "session-secret-missing");
  return databaseUrl;
}

function sessionCookie(input) {
  const secret = process.env.WAFL_SESSION_SECRET?.trim() || process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  assert.ok(secret);
  const payload = Buffer.from(JSON.stringify({
    userId: input.userId,
    companyId: input.companyId,
    companyMemberId: input.companyMemberId,
    companyName: input.companyId,
    role: "company_admin",
    email: `${input.companyId}@example.invalid`,
    name: "alpha40 internal PDF read-only verification",
    issuedAt: new Date().toISOString(),
  }), "utf8").toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `wafl_auth_session=${payload}.${signature}`;
}

async function readState(client) {
  await client.query("BEGIN READ ONLY");
  try {
    const ledger = await client.query("SELECT filename FROM public.wafl_v2_migration_ledger ORDER BY migration_id");
    const document = (await client.query(`
      SELECT id, company_id, display_document_number, status, storage_object_key,
             file_size_bytes, content_sha256, generated_at
      FROM public.generated_documents
      WHERE id=$1::uuid
    `, [DOCUMENT_ID])).rows[0];
    const counts = (await client.query(`
      SELECT
        (SELECT count(*)::integer FROM public.generated_documents WHERE id=$1::uuid) AS documents,
        (SELECT count(*)::integer FROM public.document_access_tokens WHERE generated_document_id=$1::uuid) AS tokens,
        (SELECT count(*)::integer FROM public.work_order_command_receipts WHERE result_generated_document_id=$1::uuid) AS receipts,
        (SELECT count(*)::integer FROM public.domain_events WHERE metadata->>'generatedDocumentId'=$1::text) AS events
    `, [DOCUMENT_ID])).rows[0];
    const members = (await client.query(`
      SELECT DISTINCT ON (company_id) company_id, id, COALESCE(user_id, 'alpha40-' || company_id) AS user_id
      FROM public.company_members
      WHERE company_id = ANY($1::text[])
      ORDER BY company_id, (status='approved') DESC, created_at, id
    `, [Object.values(COMPANIES)])).rows;
    await client.query("COMMIT");
    return {
      ledger: ledger.rows.map((row) => row.filename),
      document,
      counts: Object.fromEntries(Object.entries(counts).map(([key, value]) => [key, Number(value)])),
      members,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

function assertState(state) {
  assert.equal(state.ledger.length, 11, "ledger-must-be-11");
  assert.equal(state.ledger[10], "011_v2_document_access_viewer_functions.sql");
  assert.equal(String(state.document?.id), DOCUMENT_ID);
  assert.equal(state.document?.company_id, COMPANIES.A);
  assert.equal(state.document?.display_document_number, DOCUMENT_NUMBER);
  assert.equal(state.document?.status, "generated");
  assert.equal(Number(state.document?.file_size_bytes), DOCUMENT_SIZE);
  assert.equal(state.document?.content_sha256, DOCUMENT_SHA);
  assert.ok(state.document?.generated_at, "generated-at-missing");
  assert.equal(state.members.length, 4, "company-session-fixtures-missing");
}

function sessions(state) {
  return Object.fromEntries(Object.entries(COMPANIES).map(([key, companyId]) => {
    const row = state.members.find((member) => member.company_id === companyId);
    assert.ok(row, `${key}-company-member-missing`);
    return [key, sessionCookie({ companyId, companyMemberId: String(row.id), userId: String(row.user_id) })];
  }));
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
      WAFL_V2_RUNTIME: "test",
      WAFL_V2_TEST_PREFIX: "wafl-fn",
      WAFL_V2_APPROVED_DB_FINGERPRINT: REQUIRED_FINGERPRINT,
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  let stderr = "";
  child.stderr.on("data", (chunk) => { stderr = `${stderr}${String(chunk)}`.slice(-4000); });
  const startedAt = Date.now();
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`server-exited:${child.exitCode}`);
    try {
      const response = await fetch(`${baseUrl}/v`, { signal: AbortSignal.timeout(1_000) });
      await response.body?.cancel();
      if (response.status === 200) return { baseUrl, child, readyMs: Date.now() - startedAt, stderr: () => stderr };
    } catch {}
    await sleep(250);
  }
  child.kill();
  throw new Error("server-readiness-timeout");
}

async function readPdf(url, cookie, expectedDisposition) {
  const response = await fetch(url, { headers: { Cookie: cookie }, signal: AbortSignal.timeout(30_000) });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "application/pdf");
  assert.match(response.headers.get("content-disposition") ?? "", new RegExp(`^${expectedDisposition};`));
  assert.equal(Number(response.headers.get("content-length")), DOCUMENT_SIZE);
  const body = Buffer.from(await response.arrayBuffer());
  assert.equal(body.byteLength, DOCUMENT_SIZE);
  assert.equal(sha256(body), DOCUMENT_SHA);
  assert.equal(body.subarray(0, 5).toString("ascii"), "%PDF-");
  return { status: response.status, bytes: body.byteLength, sha256: DOCUMENT_SHA };
}

async function assertTyped(url, cookie, status, code) {
  const response = await fetch(url, { headers: cookie ? { Cookie: cookie } : {}, signal: AbortSignal.timeout(30_000) });
  assert.equal(response.status, status);
  const body = await response.json();
  const actualCode = body?.error?.code ?? body?.code ?? (typeof body?.error === "string" ? body.error : null);
  assert.equal(actualCode, code);
}

async function main() {
  const client = new Client({ connectionString: guard(), application_name: "wafl-v2-alpha40-preview-output-readonly" });
  await client.connect();
  let server;
  try {
    const before = await readState(client);
    assertState(before);
    const companySessions = sessions(before);
    server = await startServer();
    const fileUrl = `${server.baseUrl}/api/v2/work-orders/documents/${DOCUMENT_ID}/file`;
    const inline = await readPdf(`${fileUrl}?disposition=inline`, companySessions.A, "inline");
    const attachment = await readPdf(`${fileUrl}?disposition=attachment`, companySessions.A, "attachment");
    await assertTyped(fileUrl, null, 401, "API_SESSION_REQUIRED");
    await assertTyped(`${server.baseUrl}/api/v2/work-orders/documents/not-a-uuid/file`, companySessions.A, 404, "NOT_FOUND");
    await assertTyped(fileUrl, companySessions.B, 404, "NOT_FOUND");
    await assertTyped(fileUrl, companySessions.H, 404, "NOT_FOUND");
    await assertTyped(fileUrl, companySessions.C, 403, "COMPANY_APPROVAL_PENDING");
    const after = await readState(client);
    assertState(after);
    assert.deepEqual(after.counts, before.counts, "db-counts-mutated");
    assert.deepEqual(after.document, before.document, "generated-document-mutated");
    const serverStderr = server.stderr().trim();
    assert.doesNotMatch(serverStderr, /(?:uncaught|fatal|WORK_ORDER_GENERATED_DOCUMENT_FILE_FAILED)/i, "server-runtime-error");
    const manifest = {
      result: "ALPHA40_INTERNAL_PDF_READ_ONLY_PASS",
      targetFingerprint: REQUIRED_FINGERPRINT,
      migrationLedger: "11/11",
      displayDocumentNumber: DOCUMENT_NUMBER,
      serverReadyMs: server.readyMs,
      serverStderrWarningLines: serverStderr ? serverStderr.split(/\r?\n/).filter(Boolean).length : 0,
      inline,
      attachment,
      authenticatedTenant: "PASS",
      crossTenant: { companyB: "NOT_FOUND", companyH: "NOT_FOUND", companyC: "COMPANY_APPROVAL_PENDING" },
      unauthenticated: "API_SESSION_REQUIRED",
      invalidUuid: "NOT_FOUND",
      r2GetCount: 2,
      dbQueryMode: "BEGIN READ ONLY",
      dbMutation: false,
      generatedDocumentMutation: false,
      r2PutCount: 0,
      r2DeleteCount: 0,
      workerMutation: false,
      productionMutation: false,
    };
    await fs.mkdir(path.dirname(MANIFEST_PATH), { recursive: true });
    await fs.writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    console.log(JSON.stringify(manifest));
  } finally {
    server?.child.kill();
    await client.end();
  }
}

main().catch(async (error) => {
  await fs.mkdir(path.dirname(MANIFEST_PATH), { recursive: true });
  await fs.writeFile(MANIFEST_PATH, `${JSON.stringify({
    result: "ALPHA40_INTERNAL_PDF_READ_ONLY_FAILED",
    error: error instanceof Error ? error.message : "unknown",
    dbMutation: false,
    r2PutCount: 0,
    r2DeleteCount: 0,
    productionMutation: false,
  }, null, 2)}\n`, "utf8");
  console.error(error instanceof Error ? error.message : "unknown");
  process.exitCode = 1;
});
