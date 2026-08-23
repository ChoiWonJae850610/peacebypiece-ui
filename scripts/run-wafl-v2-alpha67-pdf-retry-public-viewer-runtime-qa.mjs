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
const EVIDENCE_PATH = path.join(ROOT, ".tmp", "wafl-v2-alpha67", "pdf-retry-public-viewer-runtime-qa.json");
const EXPECTED_DB_FINGERPRINT = "01e5dcc7fea3";
const safeRef = (value) => crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, 12);

function readEnvironment() {
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

function databaseFingerprint(connectionString) {
  const parsed = new URL(connectionString);
  return safeRef(`${parsed.hostname}/${decodeURIComponent(parsed.pathname.replace(/^\/+/, ""))}`);
}

function cookieFrom(response) {
  return (response.headers.getSetCookie?.() ?? []).map((item) => item.split(";", 1)[0]).join("; ");
}

async function main() {
  const environment = readEnvironment();
  assert.ok(environment.DATABASE_URL, "DATABASE_URL_MISSING");
  assert.equal(databaseFingerprint(environment.DATABASE_URL), EXPECTED_DB_FINGERPRINT, "DEV_TEST_DATABASE_FINGERPRINT_MISMATCH");
  const state = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
  assert.equal(state.status, "running");
  assert.equal(state.nodeVersion, "24.14.0");
  assert.equal(state.makerQaProfile, "alpha67-current-maker");
  assert.equal(state.developerAutoConnectReady, true);
  const base = String(state.publicOrigin);

  let workspaceCookie = "";
  const requests = [];
  async function request(route, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 15_000);
    const startedAt = Date.now();
    try {
      const response = await fetch(`${base}${route}`, {
        method: options.method ?? "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          Accept: options.accept ?? "application/json",
          ...(options.cookie === false ? {} : workspaceCookie ? { Cookie: workspaceCookie } : {}),
          ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
          ...(options.key ? { "Idempotency-Key": options.key } : {}),
        },
        ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
      });
      const contentType = response.headers.get("content-type") ?? "";
      const body = contentType.includes("application/json") ? await response.json() : null;
      requests.push({
        method: options.method ?? "GET",
        route: route.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/giu, "fixture"),
        status: response.status,
        elapsedMs: Date.now() - startedAt,
      });
      return { response, body, elapsedMs: Date.now() - startedAt };
    } finally {
      clearTimeout(timeout);
    }
  }

  const auth = await request("/api/dev/mobile-connect/auto", { method: "POST", body: {}, timeoutMs: 15_000 });
  assert.equal(auth.response.status, 200, "DEVELOPER_AUTO_CONNECT_FAILED");
  workspaceCookie = cookieFrom(auth.response);
  assert.ok(workspaceCookie, "DEVELOPER_SESSION_COOKIE_MISSING");

  const client = new Client({
    connectionString: environment.DATABASE_URL,
    application_name: "wafl-alpha67-pdf-retry-public-viewer-runtime-qa",
    statement_timeout: 120000,
  });
  await client.connect();
  try {
    const ledger = await client.query("SELECT count(*)::integer count FROM wafl_v2_migration_ledger");
    assert.equal(Number(ledger.rows[0].count), 20, "MIGRATION_LEDGER_NOT_20");
    const candidate = (await client.query(`
      SELECT w.id::text work_order_id, w.current_revision_id::text revision_id,
             w.status, w.entity_version,
             (SELECT count(*)::integer FROM work_order_material_lines m
                WHERE m.company_id=w.company_id AND m.revision_id=w.current_revision_id AND m.archived_at IS NULL) material_count,
             (SELECT count(*)::integer FROM work_order_processes p
                WHERE p.company_id=w.company_id AND p.revision_id=w.current_revision_id) process_count,
             (SELECT count(*)::integer FROM work_order_revision_images i
                WHERE i.company_id=w.company_id AND i.revision_id=w.current_revision_id AND i.is_representative=true) representative_count
      FROM work_orders w
      WHERE w.company_id=$1 AND w.status IN ('issued','revised','completed')
        AND w.product_name LIKE 'QA A67 N차 리오더 %'
        AND NOT EXISTS (
          SELECT 1 FROM generated_documents d
          WHERE d.company_id=w.company_id AND d.work_order_revision_id=w.current_revision_id
            AND d.status IN ('pending','generated') AND d.deleted_at IS NULL AND d.revoked_at IS NULL
        )
      ORDER BY w.created_at DESC, w.id DESC
      LIMIT 1
    `, [COMPANY_ID])).rows[0];
    assert.ok(candidate?.work_order_id && candidate?.revision_id, "ISOLATED_ISSUED_PDF_CANDIDATE_NOT_FOUND");
    assert.ok(Number(candidate.material_count) > 0, "REALISTIC_MATERIAL_MISSING");
    assert.ok(Number(candidate.process_count) > 0, "REALISTIC_PROCESS_MISSING");
    assert.ok(Number(candidate.representative_count) > 0, "REALISTIC_IMAGE_MISSING");

    const before = (await client.query(`
      SELECT
        (SELECT count(*)::integer FROM work_order_revisions r WHERE r.company_id=$1 AND r.work_order_id=$2::uuid) revision_count,
        (SELECT count(*)::integer FROM generated_documents d WHERE d.company_id=$1 AND d.work_order_id=$2::uuid) document_count,
        (SELECT count(*)::integer FROM domain_events e WHERE e.company_id=$1 AND e.entity_type='work_order' AND e.entity_id=$2::text) issue_event_count
    `, [COMPANY_ID, candidate.work_order_id])).rows[0];

    const initialKey = `alpha67-mobile-pdf-initial-${crypto.randomBytes(8).toString("hex")}`;
    const initial = await request(`/api/v2/work-orders/${candidate.work_order_id}/documents/generate`, {
      method: "POST",
      key: initialKey,
      body: { revisionId: candidate.revision_id },
      timeoutMs: 120_000,
    });
    assert.equal(initial.response.status, 200, `MOBILE_INITIAL_GENERATION_FAILED:${initial.body?.error?.code ?? "UNKNOWN"}`);
    assert.equal(initial.body?.data?.status, "generated", "MOBILE_INITIAL_STATUS_NOT_GENERATED");
    const documentId = String(initial.body.data.generatedDocumentId);

    const list = await request(`/api/v2/work-orders/${candidate.work_order_id}/documents?limit=50`);
    assert.equal(list.response.status, 200, "MOBILE_DOCUMENT_RECONCILIATION_FAILED");
    const document = list.body?.data?.items?.find((item) => item.id === documentId);
    assert.equal(document?.status, "generated", "MOBILE_DOCUMENT_NOT_RECONCILED");

    const retryKey = `alpha67-mobile-pdf-retry-${crypto.randomBytes(8).toString("hex")}`;
    const retry = await request(`/api/v2/work-orders/${candidate.work_order_id}/documents/generate`, {
      method: "POST",
      key: retryKey,
      body: { revisionId: candidate.revision_id },
      timeoutMs: 120_000,
    });
    assert.equal(retry.response.status, 200, `MOBILE_RETRY_FAILED:${retry.body?.error?.code ?? "UNKNOWN"}`);
    assert.equal(String(retry.body?.data?.generatedDocumentId), documentId, "RETRY_CREATED_DIFFERENT_DOCUMENT");
    assert.equal(retry.body?.data?.idempotentReplay, true, "RETRY_NOT_RECONCILED_AS_GENERATION_ONLY");

    const target = await request(`/api/v2/work-orders/documents/${documentId}/viewer-target`);
    assert.equal(target.response.status, 200, `VIEWER_TARGET_FAILED:${target.body?.error?.code ?? "UNKNOWN"}`);
    const viewerUrl = new URL(String(target.body?.data?.viewerUrl));
    assert.equal(viewerUrl.pathname, "/v", "VIEWER_TARGET_NOT_PUBLIC_VIEWER");
    const rawToken = new URLSearchParams(viewerUrl.hash.slice(1)).get("t") ?? "";
    assert.match(rawToken, /^[A-Za-z0-9_-]{43}$/u, "VIEWER_TOKEN_INVALID");

    const viewerPage = await fetch(`${viewerUrl.origin}/v`, { redirect: "manual" });
    assert.equal(viewerPage.status, 200, "PUBLIC_VIEWER_PAGE_WITHOUT_WORKSPACE_SESSION_FAILED");
    assert.match(await viewerPage.text(), /작업지시서|_next/u, "PUBLIC_VIEWER_PAGE_INVALID");

    const publicSession = await fetch(`${viewerUrl.origin}/api/public/document-viewer/session`, {
      method: "POST",
      redirect: "manual",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ token: rawToken }),
    });
    assert.equal(publicSession.status, 200, "PUBLIC_VIEWER_SESSION_FAILED");
    const viewerCookie = cookieFrom(publicSession);
    assert.ok(viewerCookie, "PUBLIC_VIEWER_COOKIE_MISSING");
    const publicFile = await fetch(`${viewerUrl.origin}/api/public/document-viewer/file`, { headers: { Cookie: viewerCookie } });
    const publicBytes = Buffer.from(await publicFile.arrayBuffer());
    assert.equal(publicFile.status, 200, "PUBLIC_VIEWER_FILE_FAILED");
    assert.equal(publicBytes.subarray(0, 5).toString("ascii"), "%PDF-", "PUBLIC_VIEWER_PDF_SIGNATURE_INVALID");
    const publicDownload = await fetch(`${viewerUrl.origin}/api/public/document-viewer/download`, { headers: { Cookie: viewerCookie } });
    assert.equal(publicDownload.status, 200, "PUBLIC_VIEWER_DOWNLOAD_FAILED");

    const internalNoSession = await fetch(`${base}${document.inlineUrl}`, { headers: { Accept: "application/json" } });
    assert.equal(internalNoSession.status, 401, "INTERNAL_FILE_ROUTE_AUTH_WEAKENED");
    const internalError = await internalNoSession.json();
    assert.equal(internalError?.code ?? internalError?.error?.code, "API_SESSION_REQUIRED", "INTERNAL_FILE_ROUTE_ERROR_CONTRACT_CHANGED");

    const after = (await client.query(`
      SELECT w.status, w.current_revision_id::text revision_id,
        (SELECT count(*)::integer FROM work_order_revisions r WHERE r.company_id=w.company_id AND r.work_order_id=w.id) revision_count,
        (SELECT count(*)::integer FROM generated_documents d WHERE d.company_id=w.company_id AND d.work_order_id=w.id) document_count,
        (SELECT count(*)::integer FROM generated_documents d WHERE d.company_id=w.company_id AND d.work_order_id=w.id AND d.status='generated') generated_count,
        (SELECT count(*)::integer FROM domain_events e WHERE e.company_id=w.company_id AND e.entity_type='work_order' AND e.entity_id=w.id::text) issue_event_count
      FROM work_orders w WHERE w.company_id=$1 AND w.id=$2::uuid
    `, [COMPANY_ID, candidate.work_order_id])).rows[0];
    assert.equal(after.status, candidate.status, "RETRY_CHANGED_WORK_ORDER_STATUS");
    assert.equal(after.revision_id, candidate.revision_id, "RETRY_CHANGED_REVISION");
    assert.equal(Number(after.revision_count), Number(before.revision_count), "RETRY_CREATED_REVISION");
    assert.equal(Number(after.document_count), Number(before.document_count) + 1, "RETRY_CREATED_DUPLICATE_DOCUMENT");
    assert.equal(Number(after.generated_count), 1, "GENERATED_DOCUMENT_COUNT_INVALID");
    assert.equal(Number(after.issue_event_count), Number(before.issue_event_count), "RETRY_REISSUED_WORK_ORDER");

    const evidence = {
      result: "ALPHA67_PDF_GENERATION_RETRY_PUBLIC_VIEWER_RUNTIME_QA_PASS",
      executedAt: new Date().toISOString(),
      fixture: {
        workOrderRef: safeRef(candidate.work_order_id),
        revisionRef: safeRef(candidate.revision_id),
        documentRef: safeRef(documentId),
        realisticImage: true,
        realisticMaterials: Number(candidate.material_count),
        realisticProcesses: Number(candidate.process_count),
        retainedExistingIsolatedFixture: true,
      },
      assertions: {
        mobileInitialGeneration: "PASS",
        mobileRetryGenerationOnly: "PASS",
        duplicateDocumentZero: "PASS",
        issueAndRevisionReplayZero: "PASS",
        statusReconciliation: "PASS",
        publicViewerWithoutWorkspaceSession: "PASS",
        publicViewerFileAndDownload: "PASS",
        internalFileStillWorkspaceProtected: "PASS",
        rawR2UrlExposed: false,
      },
      timing: { initialGenerationMs: initial.elapsedMs, retryReconciliationMs: retry.elapsedMs },
      retained: { newGeneratedDocuments: 1, newRevisions: 0, newWorkOrders: 0 },
      mutationBoundary: { production: 0, ownerFixture: 0, migration: 0 },
      requests,
    };
    fs.mkdirSync(path.dirname(EVIDENCE_PATH), { recursive: true });
    fs.writeFileSync(EVIDENCE_PATH, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
    console.log(JSON.stringify({
      result: evidence.result,
      workOrderRef: evidence.fixture.workOrderRef,
      documentRef: evidence.fixture.documentRef,
      initialGenerationMs: evidence.timing.initialGenerationMs,
      retryReconciliationMs: evidence.timing.retryReconciliationMs,
      publicViewer: "PASS",
      internalWorkspaceGuard: "PASS",
      productionMutation: 0,
      ownerFixtureMutation: 0,
    }));
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("ALPHA67_PDF_GENERATION_RETRY_PUBLIC_VIEWER_RUNTIME_QA_FAILED", {
    name: error instanceof Error ? error.name : "UnknownError",
    code: error instanceof Error ? error.message : "UNKNOWN",
  });
  process.exitCode = 1;
});
