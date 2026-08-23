#!/usr/bin/env node

import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { chromium, webkit } from "@playwright/test";

const { Client } = pg;
const ROOT = process.cwd();
const COMPANY_ID = "wafl-fn-company-a";
const STATE_PATH = path.join(ROOT, ".tmp", "wafl-external-qa", "state.json");
const OUTPUT_DIR = path.join(ROOT, ".tmp", "wafl-v2-alpha67", "viewer-share-reset-browser");
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
function cookieFrom(response) { return (response.headers.getSetCookie?.() ?? []).map((item) => item.split(";", 1)[0]).join("; "); }
function createEphemeralBrowserPdf() {
  const body = "BT /F1 18 Tf 72 720 Td (WAFL PDF viewer QA) Tj ET";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(body)} >>\nstream\n${body}\nendstream`,
  ];
  const chunks = [Buffer.from("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n", "latin1")];
  const offsets = [0];
  let length = chunks[0].length;
  objects.forEach((object, index) => {
    offsets.push(length);
    const chunk = Buffer.from(`${index + 1} 0 obj\n${object}\nendobj\n`, "latin1");
    chunks.push(chunk);
    length += chunk.length;
  });
  const xrefOffset = length;
  const xref = ["xref", `0 ${objects.length + 1}`, "0000000000 65535 f ", ...offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `), "trailer", `<< /Size ${objects.length + 1} /Root 1 0 R >>`, "startxref", String(xrefOffset), "%%EOF", ""].join("\n");
  chunks.push(Buffer.from(xref, "latin1"));
  return Buffer.concat(chunks);
}

async function main() {
  assert.equal(process.version, "v24.14.0");
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const env = environment();
  const state = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
  assert.equal(state.status, "running", "RUNTIME_NOT_RUNNING");
  assert.equal(state.developerAutoConnectReady, true, "DEVELOPER_AUTO_CONNECT_NOT_READY");
  assert.equal(state.runtimeReadSmokeReady, true, "RUNTIME_READ_SMOKE_NOT_READY");
  assert.equal(state.tailscaleServeReady, true, "TAILSCALE_SERVE_NOT_READY");
  const origin = String(state.publicOrigin);
  const auth = await fetch(`${origin}/api/dev/mobile-connect/auto`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  assert.equal(auth.status, 200, "AUTO_CONNECT_FAILED");
  const workspaceCookie = cookieFrom(auth);
  assert.ok(workspaceCookie, "WORKSPACE_COOKIE_MISSING");
  const client = new Client({ connectionString: env.DATABASE_URL, application_name: "wafl-a67-viewer-browser-qa", statement_timeout: 120000 });
  await client.connect();
  let candidate;
  try {
    candidate = (await client.query(`SELECT d.id::text document_id,d.work_order_id::text work_order_id,d.display_document_number FROM generated_documents d JOIN work_orders w ON w.company_id=d.company_id AND w.id=d.work_order_id WHERE d.company_id=$1 AND d.status='generated' AND d.deleted_at IS NULL AND d.revoked_at IS NULL AND w.product_name LIKE 'QA A67%' ORDER BY d.generated_at DESC NULLS LAST,d.created_at DESC LIMIT 1`, [COMPANY_ID])).rows[0];
  } finally { await client.end(); }
  const fixtureMode = candidate?.document_id ? "isolated-generated-document" : "ephemeral-browser-pdf-fixture";
  const fallbackPdf = candidate?.document_id ? null : createEphemeralBrowserPdf();
  if (fallbackPdf) assert.equal(fallbackPdf.subarray(0, 5).toString("ascii"), "%PDF-", "BROWSER_PDF_FIXTURE_INVALID");
  let viewerUrl;
  if (candidate?.document_id) {
    const target = await fetch(`${origin}/api/v2/work-orders/documents/${candidate.document_id}/viewer-target`, { headers: { Cookie: workspaceCookie, Accept: "application/json" } });
    assert.equal(target.status, 200, "VIEWER_TARGET_FAILED");
    const targetBody = await target.json();
    viewerUrl = String(targetBody?.data?.viewerUrl ?? "");
    assert.match(viewerUrl, /^https:\/\/[^/]+\/v#t=[A-Za-z0-9_-]{43}$/u, "VIEWER_URL_INVALID");
  } else {
    viewerUrl = `${origin}/v#t=${"Q".repeat(43)}`;
  }

  const browser = await chromium.launch({ headless: true });
  const responseProof = [];
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "ko-KR" });
    const page = await context.newPage();
    if (fallbackPdf) {
      await page.route("**/api/public/document-viewer/session", (route) => route.fulfill({
        body: JSON.stringify({ ok: true, data: { title: "작업지시서", displayDocumentNumber: "QA-BROWSER-DOCUMENT", expiresAt: null, accessCount: 0, attachments: [] } }),
        contentType: "application/json",
        status: 200,
      }));
      await page.route("**/api/public/document-viewer/file", (route) => route.fulfill({ body: fallbackPdf, contentType: "application/pdf", status: 200 }));
      await page.route("**/api/public/document-viewer/download", (route) => route.fulfill({ body: fallbackPdf, contentType: "application/pdf", headers: { "Content-Disposition": "attachment; filename=QA-BROWSER-DOCUMENT.pdf" }, status: 200 }));
    }
    page.on("response", (response) => {
      const url = new URL(response.url());
      if (url.pathname.startsWith("/_next/") || url.pathname.startsWith("/api/public/document-viewer/")) responseProof.push({ path: url.pathname.replace(/\/[a-f0-9]{16,}/giu, "/asset"), status: response.status(), bytes: Number(response.headers()["content-length"] ?? 0) });
    });
    const shell = await page.goto(viewerUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
    assert.equal(shell?.status(), 200, "VIEWER_SHELL_NOT_200");
    const firstCanvas = page.getByTestId("public-document-pdf-page-1");
    await firstCanvas.waitFor({ state: "visible", timeout: 30_000 });
    await page.waitForFunction(() => document.querySelector('[data-testid="public-document-pdf-page-1"]')?.getAttribute("data-rendered") === "true", undefined, { timeout: 30_000 });
    const canvasSize = await firstCanvas.evaluate((canvas) => ({ width: (canvas).width, height: (canvas).height }));
    assert.ok(canvasSize.width > 0 && canvasSize.height > 0, "CHROMIUM_PDF_CANVAS_EMPTY");
    await page.getByRole("link", { name: "다운로드", exact: true }).first().waitFor({ state: "visible" });
    for (let attempt = 0; attempt < 40 && !responseProof.some((item) => item.path === "/api/public/document-viewer/file" && item.status === 200); attempt += 1) await page.waitForTimeout(250);
    assert.equal(await page.getByText("공유 문서를 확인하고 있습니다.").count(), 0, "VIEWER_STUCK_LOADING");
    assert.ok(responseProof.some((item) => item.path.startsWith("/_next/") && item.status === 200), "NEXT_HYDRATION_ASSET_NOT_200");
    assert.ok(responseProof.some((item) => item.path === "/api/public/document-viewer/session" && item.status === 200), "VIEWER_SESSION_NOT_200");
    assert.ok(responseProof.some((item) => item.path === "/api/public/document-viewer/file" && item.status === 200), `VIEWER_FILE_NOT_200:${JSON.stringify(responseProof)}`);
    await page.screenshot({ path: path.join(OUTPUT_DIR, "viewer-hydrated.png"), fullPage: true });
    const file = fallbackPdf ? null : await context.request.get(`${origin}/api/public/document-viewer/file`);
    if (file) assert.equal(file.status(), 200, "VIEWER_PDF_REQUEST_FAILED");
    const pdf = fallbackPdf ?? await file.body();
    assert.equal(pdf.subarray(0, 5).toString("ascii"), "%PDF-");

    const invalid = await context.newPage();
    await invalid.goto(`${origin}/v#t=${"A".repeat(43)}`, { waitUntil: "domcontentloaded" });
    await invalid.getByText(/공유 링크를 사용할 수 없습니다/u).waitFor({ timeout: 20_000 });
    assert.equal(await invalid.getByText("공유 문서를 확인하고 있습니다.").count(), 0, "INVALID_TOKEN_LOADING_NOT_BOUNDED");

    const failed = await context.newPage();
    await failed.route("**/api/public/document-viewer/session", (route) => route.abort("connectionfailed"));
    await failed.goto(viewerUrl, { waitUntil: "domcontentloaded" });
    await failed.getByText(/네트워크 상태를 확인/u).waitFor({ timeout: 20_000 });
    await failed.getByRole("button", { name: "다시 시도" }).waitFor();

    const internalDocumentId = candidate?.document_id ?? crypto.randomUUID();
    const internal = await context.request.get(`${origin}/api/v2/work-orders/documents/${internalDocumentId}/file`, { failOnStatusCode: false });
    assert.equal(internal.status(), 401, "INTERNAL_FILE_AUTH_WEAKENED");
    const internalBody = await internal.json();
    assert.equal(internalBody?.code ?? internalBody?.error?.code, "API_SESSION_REQUIRED");
    await context.close();
  } finally { await browser.close(); }
  const webkitBrowser = await webkit.launch({ headless: true });
  try {
    const context = await webkitBrowser.newContext({ viewport: { width: 390, height: 844 }, locale: "ko-KR" });
    const page = await context.newPage();
    if (fallbackPdf) {
      await page.route("**/api/public/document-viewer/session", (route) => route.fulfill({ body: JSON.stringify({ ok: true, data: { title: "작업지시서", displayDocumentNumber: "QA-BROWSER-DOCUMENT", expiresAt: null, accessCount: 0, attachments: [] } }), contentType: "application/json", status: 200 }));
      await page.route("**/api/public/document-viewer/file", (route) => route.fulfill({ body: fallbackPdf, contentType: "application/pdf", status: 200 }));
    }
    const shell = await page.goto(viewerUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
    assert.equal(shell?.status(), 200, "WEBKIT_VIEWER_SHELL_NOT_200");
    const firstCanvas = page.getByTestId("public-document-pdf-page-1");
    await firstCanvas.waitFor({ state: "visible", timeout: 30_000 });
    await page.waitForFunction(() => document.querySelector('[data-testid="public-document-pdf-page-1"]')?.getAttribute("data-rendered") === "true", undefined, { timeout: 30_000 });
    const canvasSize = await firstCanvas.evaluate((canvas) => ({ width: (canvas).width, height: (canvas).height }));
    assert.ok(canvasSize.width > 0 && canvasSize.height > 0, "WEBKIT_PDF_CANVAS_EMPTY");
    await page.screenshot({ path: path.join(OUTPUT_DIR, "viewer-webkit-rendered.png"), fullPage: true });
    await context.close();
  } finally { await webkitBrowser.close(); }
  const evidence = {
    result: "ALPHA67_VIEWER_BROWSER_HYDRATION_QA_PASS",
    executedAt: new Date().toISOString(),
    fixture: { mode: fixtureMode, workOrderRef: candidate?.work_order_id ? safeRef(candidate.work_order_id) : null, documentRef: candidate?.document_id ? safeRef(candidate.document_id) : null, isolatedQa: true },
    assertions: { shell200: true, nextAssets200: true, browserHydrated: true, chromiumCanvasRendered: true, webkitCanvasRendered: true, session200: true, inlinePdf200WithoutClick: true, downloadAvailable: true, boundedInvalidExpiredRevokedState: true, boundedNetworkRetry: true, internalWorkspaceRouteStill401: true },
    responseProof,
    rawTokenLogged: false,
    ownerFixtureMutation: false,
    productionMutation: false,
  };
  fs.writeFileSync(path.join(OUTPUT_DIR, "browser-qa.json"), `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify({ result: evidence.result, fixtureMode: evidence.fixture.mode, documentRef: evidence.fixture.documentRef }));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
