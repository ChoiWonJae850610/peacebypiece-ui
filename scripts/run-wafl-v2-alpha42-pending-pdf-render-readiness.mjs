#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

import pg from "pg";

import { deriveEmbeddedQrOpaqueToken } from "../lib/generated-documents/document-access/tokenDerivation.mjs";
import { createR2WorkerSignedUrl, normalizeWorkerBaseUrl } from "../lib/storage/r2/r2WorkerSignature.mjs";
import {
  LocalChromiumIssuedWorkOrderPdfRenderer,
  PdfPageOrientationValidationError,
} from "../lib/generated-documents/work-order-pdf/localChromiumRenderer.mts";
import {
  getLocalIssuedPdfRenderInputPath,
  readLocalIssuedPdfRenderInput,
  writeLocalIssuedPdfRenderInput,
} from "../lib/generated-documents/work-order-pdf/localRenderInputCore.mjs";
import {
  hashWorkOrderIssuedPdfSnapshot,
  serializeWorkOrderIssuedPdfSnapshot,
} from "../lib/generated-documents/work-order-pdf/snapshot.ts";
import { ALPHA42_REALISTIC_FIXTURE } from "../lib/generated-documents/work-order-pdf/realisticIssuedFixture.mjs";
import { createWorkOrderPdfStorageKey } from "../lib/workorder/pdf/workOrderPdfPolicy.ts";

const { Client } = pg;
const COMPANY_A = "wafl-fn-company-a";
const FINGERPRINT = "01e5dcc7fea3";
const TARGET_LEDGER = 12;
const GENERATION_COMMAND = "work_order.document.generate";
const EMBEDDED_TOKEN_COMMAND = "work_order.document.embedded_qr.create";
const GENERATION_IDEMPOTENCY_KEY = "alpha42-realistic-issued-embedded-qr-generation-v1";
const CONFIRMATION = "VERIFY WAFL V2 ALPHA42 PENDING PDF RENDER READINESS";
const MANIFEST_PATH = path.resolve(".tmp/wafl-v2-alpha42/pending-render-readiness-manifest.json");
const PDF_PATH = path.resolve(".tmp/wafl-v2-alpha42/pending-render-readiness.pdf");
const ORIENTATION_FAILURE_MANIFEST_PATH = path.resolve(".tmp/wafl-v2-alpha42/pending-render-orientation-failure.json");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const safeRef = (value) => sha256(String(value)).slice(0, 12);

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

function sessionSecret() {
  const value = process.env.WAFL_SESSION_SECRET?.trim() || process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  assert.ok(value, "session-secret-missing");
  return value;
}

function guard() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  assert.ok(databaseUrl, "database-url-missing");
  assert.equal(process.env.WAFL_V2_RUNTIME, "test", "dev-test-runtime-required");
  assert.equal(process.env.WAFL_V2_TEST_PREFIX, "wafl-fn", "test-prefix-mismatch");
  assert.equal(process.env.WAFL_V2_APPROVED_DB_FINGERPRINT, FINGERPRINT, "approved-fingerprint-mismatch");
  assert.equal(databaseFingerprint(databaseUrl), FINGERPRINT, "target-fingerprint-mismatch");
  assert.equal(process.env.WAFL_V2_CONFIRMATION, CONFIRMATION, "confirmation-mismatch");
  assert.ok(!process.env.WAFL_V2_ALPHA42_RUNTIME_APPROVED, "runtime-approval-forbidden-in-readiness");
  const workerUrl = process.env.R2_WORKER_UPLOAD_URL?.trim();
  const workerSecret = process.env.R2_WORKER_UPLOAD_SECRET?.trim();
  assert.ok(workerUrl && workerSecret, "r2-config-missing");
  const runtime = process.env.NEXT_PUBLIC_APP_RUNTIME_MODE?.trim()
    || process.env.WAFL_SERVER_RUNTIME_MODE?.trim()
    || process.env.NODE_ENV?.trim()
    || "unknown";
  const actual = r2Fingerprints(workerUrl, runtime);
  assert.equal(actual.environment, process.env.WAFL_PDF_R2_APPROVED_ENVIRONMENT_FINGERPRINT, "r2-environment-fingerprint-mismatch");
  assert.equal(actual.url, process.env.WAFL_PDF_R2_APPROVED_WORKER_URL_FINGERPRINT, "r2-url-fingerprint-mismatch");
  assert.equal(actual.host, process.env.WAFL_PDF_R2_APPROVED_WORKER_HOST_FINGERPRINT, "r2-host-fingerprint-mismatch");
  const viewerOrigin = new URL(process.env.WAFL_DOCUMENT_VIEWER_ORIGIN?.trim() || "");
  assert.equal(viewerOrigin.protocol, "http:", "local-viewer-origin-required");
  assert.ok(new Set(["localhost", "127.0.0.1", "::1"]).has(viewerOrigin.hostname), "production-viewer-origin-forbidden");
  return { databaseUrl, workerUrl: actual.normalized, workerSecret, viewerOrigin: viewerOrigin.origin };
}

async function readPendingState(client) {
  await client.query("BEGIN READ ONLY");
  try {
    const ledger = (await client.query("SELECT migration_id,filename FROM public.wafl_v2_migration_ledger ORDER BY migration_id")).rows;
    const actor = (await client.query(`
      SELECT id FROM public.company_members
      WHERE company_id=$1 AND status='approved' AND user_id IS NOT NULL
      ORDER BY created_at,id LIMIT 1
    `, [COMPANY_A])).rows[0];
    assert.ok(actor, "company-a-actor-missing");
    await client.query("SET LOCAL ROLE wafl_v2_tenant_runtime");
    await client.query(
      "SELECT set_config('wafl.company_id',$1,true),set_config('wafl.company_member_id',$2,true),set_config('wafl.access_mode','tenant_member',true),set_config('wafl.correlation_id',$3,true)",
      [COMPANY_A, String(actor.id), "alpha42-pending-render-readiness"],
    );
    const rows = (await client.query(`
      SELECT w.id AS work_order_id,w.status,w.entity_version AS work_order_version,w.document_number_base,
             r.id AS revision_id,r.revision_status,r.entity_version AS revision_version,
             g.id AS generated_document_id,g.status AS generated_status,g.generation_no,
             g.snapshot,g.renderer_version,g.dto_schema_version,g.storage_object_key,g.file_size_bytes,g.content_sha256,g.generated_at,
             t.id AS token_id,t.token_hash,t.token_purpose,t.expires_at,t.access_count,t.revoked_at,
             i.storage_object_key AS image_key,i.size_bytes AS image_size,i.content_sha256 AS image_sha,i.mime_type AS image_mime,
             (SELECT count(*)::integer FROM public.work_order_material_lines x WHERE x.company_id=w.company_id AND x.revision_id=r.id) AS materials,
             (SELECT count(*)::integer FROM public.work_order_colors x WHERE x.company_id=w.company_id AND x.revision_id=r.id) AS colors,
             (SELECT count(*)::integer FROM public.work_order_sizes x WHERE x.company_id=w.company_id AND x.revision_id=r.id) AS sizes,
             (SELECT count(*)::integer FROM public.color_size_quantities x WHERE x.company_id=w.company_id AND x.revision_id=r.id) AS matrix_rows,
             (SELECT coalesce(sum(quantity),0)::integer FROM public.color_size_quantities x WHERE x.company_id=w.company_id AND x.revision_id=r.id) AS matrix_total,
             (SELECT count(*)::integer FROM public.work_order_processes x WHERE x.company_id=w.company_id AND x.revision_id=r.id) AS processes,
             (SELECT count(*)::integer FROM public.work_order_command_receipts x WHERE x.company_id=w.company_id AND x.work_order_id=w.id) AS receipts,
             (SELECT count(*)::integer FROM public.work_order_command_receipts x WHERE x.company_id=w.company_id AND x.work_order_id=w.id AND (x.result_revision_id IS NULL OR x.result_entity_version IS NULL)) AS incomplete_receipts,
             (SELECT count(*)::integer FROM public.domain_events e WHERE e.company_id=w.company_id AND (e.entity_id=w.id::text OR e.entity_id=g.id::text)) AS events
      FROM public.work_orders w
      JOIN public.work_order_revisions r ON r.company_id=w.company_id AND r.id=w.current_revision_id
      JOIN public.generated_documents g ON g.company_id=w.company_id AND g.work_order_revision_id=r.id
      JOIN public.document_access_tokens t ON t.company_id=g.company_id AND t.generated_document_id=g.id AND t.token_purpose='embedded_qr'
      JOIN public.work_order_revision_images ri ON ri.company_id=r.company_id AND ri.revision_id=r.id AND ri.is_representative=true
      JOIN public.work_order_images i ON i.company_id=ri.company_id AND i.id=ri.image_id
      WHERE w.company_id=$1 AND w.legacy_source_id=$2
    `, [COMPANY_A, ALPHA42_REALISTIC_FIXTURE.legacySourceId])).rows;
    const a30 = (await client.query(`
      SELECT w.status,w.entity_version AS work_order_version,r.revision_status,r.entity_version AS revision_version,
             g.status AS generated_status,g.file_size_bytes,g.content_sha256,
             (SELECT count(*)::integer FROM public.document_access_tokens t WHERE t.company_id=g.company_id AND t.generated_document_id=g.id AND t.token_purpose='manual_share') AS manual_tokens
      FROM public.work_orders w
      JOIN public.work_order_revisions r ON r.company_id=w.company_id AND r.id=w.current_revision_id
      JOIN LATERAL (SELECT company_id,id,status,file_size_bytes,content_sha256 FROM public.generated_documents WHERE company_id=w.company_id AND work_order_id=w.id ORDER BY generation_no DESC LIMIT 1) g ON true
      WHERE w.company_id=$1 AND w.item_code='A30FACT' AND w.deleted_at IS NULL
    `, [COMPANY_A])).rows;
    await client.query("COMMIT");
    return { ledger, rows, a30 };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  }
}

async function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") return server.close(() => reject(new Error("port-unavailable")));
      server.close(() => resolve(address.port));
    });
  });
}

function sanitizeServerOutput(value) {
  return String(value)
    .replace(/https?:\/\/[^\s"'<>]+/g, "<redacted-url>")
    .replace(/\b[0-9a-f]{8}-[0-9a-f-]{27,}\b/gi, "<redacted-uuid>")
    .replace(/(?<![A-Za-z0-9_-])[A-Za-z0-9_-]{43}(?![A-Za-z0-9_-])/g, "<redacted-opaque-token>")
    .replace(/[a-f0-9]{32}/g, "{runToken32}")
    .slice(-1_000);
}

async function startServer() {
  const port = await freePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", String(port)], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      WAFL_V2_COMMAND_API_ENABLED: "0",
      WAFL_V2_COMMAND_MUTATION_APPROVED: "",
      WAFL_V2_DOCUMENT_VIEWER_MUTATION_APPROVED: "",
      WAFL_V2_ALPHA42_RUNTIME_APPROVED: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => { stdout = `${stdout}${String(chunk)}`.slice(-4_000); });
  child.stderr.on("data", (chunk) => { stderr = `${stderr}${String(chunk)}`.slice(-4_000); });
  for (let attempt = 0; attempt < 240; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`server-exited:${child.exitCode}`);
    try {
      const response = await fetch(`${baseUrl}/v`, { redirect: "manual" });
      if (response.status === 200) return { baseUrl, child, stdout: () => stdout, stderr: () => stderr };
    } catch {}
    await sleep(250);
  }
  child.kill();
  throw new Error("server-ready-timeout");
}

async function stopServer(server) {
  if (!server?.child) return;
  server.child.kill();
  await Promise.race([new Promise((resolve) => server.child.once("exit", resolve)), sleep(3_000)]);
}

async function main() {
  const config = guard();
  const client = new Client({ connectionString: config.databaseUrl, application_name: "alpha42-pending-pdf-render-readiness" });
  await client.connect();
  let server;
  try {
    const state = await readPendingState(client);
    assert.equal(state.ledger.length, TARGET_LEDGER, "ledger-count-mismatch");
    assert.equal(state.ledger[TARGET_LEDGER - 1]?.filename, "012_v2_document_access_token_purpose.sql", "migration-012-missing");
    assert.equal(state.rows.length, 1, "pending-target-count-mismatch");
    assert.equal(state.a30.length, 1, "a30fact-count-mismatch");
    const row = state.rows[0];
    assert.equal(row.status, "issued");
    assert.equal(row.revision_status, "finalized");
    assert.equal(Number(row.work_order_version), 2);
    assert.equal(Number(row.revision_version), 2);
    assert.ok(row.document_number_base, "document-number-missing");
    assert.equal(row.generated_status, "pending");
    assert.equal(row.storage_object_key, null);
    assert.equal(row.file_size_bytes, null);
    assert.equal(row.content_sha256, null);
    assert.equal(row.generated_at, null);
    assert.equal(row.token_purpose, "embedded_qr");
    assert.equal(Number(row.access_count), 0);
    assert.equal(row.revoked_at, null);
    assert.equal(Number(row.materials), 6);
    assert.equal(Number(row.colors), 3);
    assert.equal(Number(row.sizes), 3);
    assert.equal(Number(row.matrix_rows), 9);
    assert.equal(Number(row.matrix_total), 144);
    assert.equal(Number(row.processes), 4);
    assert.equal(Number(row.receipts), 3);
    assert.equal(Number(row.incomplete_receipts), 0);
    assert.equal(Number(row.events), 2);

    const snapshot = row.snapshot;
    assert.ok(snapshot && typeof snapshot === "object", "pending-snapshot-missing");
    assert.equal(String(snapshot.workOrderId), String(row.work_order_id), "pending-snapshot-workorder-mismatch");
    assert.equal(String(snapshot.revisionId), String(row.revision_id), "pending-snapshot-revision-mismatch");
    assert.equal(snapshot.rendererVersion, row.renderer_version, "pending-renderer-version-mismatch");
    assert.equal(Number(snapshot.dtoSchemaVersion), Number(row.dto_schema_version), "pending-dto-version-mismatch");
    const canonicalSnapshotJson = serializeWorkOrderIssuedPdfSnapshot(snapshot);
    const snapshotSha256 = hashWorkOrderIssuedPdfSnapshot(snapshot);
    assert.equal(sha256(Buffer.from(canonicalSnapshotJson, "utf8")), snapshotSha256, "pending-snapshot-sha-mismatch");

    const rawToken = deriveEmbeddedQrOpaqueToken(sessionSecret(), {
      companyId: COMPANY_A,
      generatedDocumentId: String(row.generated_document_id),
      commandCode: EMBEDDED_TOKEN_COMMAND,
      idempotencyKey: GENERATION_IDEMPOTENCY_KEY,
    });
    assert.equal(sha256(Buffer.from(rawToken, "utf8")), String(row.token_hash).trim(), "EMBEDDED_QR_TOKEN_REDERIVATION_MISMATCH");

    const imageResponse = await fetch(createR2WorkerSignedUrl({
      uploadUrl: config.workerUrl,
      secret: config.workerSecret,
      method: "GET",
      key: row.image_key,
      contentType: "application/octet-stream",
      expiresAt: Math.floor(Date.now() / 1_000) + 300,
    }));
    assert.equal(imageResponse.status, 200, `image-r2-http-${imageResponse.status}`);
    assert.equal(imageResponse.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase(), "image/png");
    const imageBytes = Buffer.from(await imageResponse.arrayBuffer());
    assert.equal(imageBytes.byteLength, 53_366);
    assert.equal(imageBytes.byteLength, Number(row.image_size));
    assert.equal(sha256(imageBytes), "3a7b170f5f4d2809dddf7b239f9a0b02260578b1aff9b2902d941fe0f25147b9");
    assert.equal(sha256(imageBytes), row.image_sha);
    assert.deepEqual([...imageBytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    const representativeImageDataUrl = `data:image/png;base64,${imageBytes.toString("base64")}`;
    const objectKeyPlan = createWorkOrderPdfStorageKey({
      companyId: COMPANY_A,
      workOrderId: String(row.work_order_id),
      pdfId: String(row.generated_document_id),
    });
    const runToken = crypto.randomBytes(16).toString("hex");
    const inputPath = await writeLocalIssuedPdfRenderInput(runToken, {
      snapshot,
      canonicalSnapshotJson,
      snapshotSha256,
      objectKeyPlan,
      representativeImageDataUrl,
    });
    const readBack = await readLocalIssuedPdfRenderInput(runToken);
    assert.equal(readBack.snapshotSha256, snapshotSha256);
    assert.equal(readBack.canonicalSnapshotJson, canonicalSnapshotJson);
    assert.equal(readBack.objectKeyPlan, objectKeyPlan);
    assert.ok(readBack.representativeImageDataUrl?.startsWith("data:image/png;base64,"));

    server = await startServer();
    const viewerUrl = `${config.viewerOrigin}/v#t=${rawToken}`;
    const renderer = new LocalChromiumIssuedWorkOrderPdfRenderer();
    let pdf;
    try {
      pdf = await renderer.render({
        snapshot,
        canonicalSnapshotJson,
        snapshotSha256,
        outputFileName: `${snapshot.displayDocumentNumber}.pdf`,
        renderUrl: `${server.baseUrl}/dev/workorder-pdf-render/${runToken}`,
        embeddedQrContext: {
          viewerUrl,
          expiresAt: new Date(row.expires_at).toISOString(),
          label: "문서 보기",
          purpose: "embedded_qr",
        },
        options: { printBackground: true, preferCssPageSize: true, maxFileSizeBytes: 10 * 1024 * 1024 },
      });
    } catch (error) {
      if (error instanceof PdfPageOrientationValidationError) {
        await fs.mkdir(path.dirname(PDF_PATH), { recursive: true });
        await fs.writeFile(PDF_PATH, error.pdf);
        await fs.writeFile(ORIENTATION_FAILURE_MANIFEST_PATH, `${JSON.stringify({
          result: "PDF_PAGE_ORIENTATION_INVALID",
          ...error.evidence,
          localPdfArtifact: ".tmp/wafl-v2-alpha42/pending-render-readiness.pdf",
          dbMutation: false,
          r2Put: 0,
          r2Delete: 0,
          rawTokenPersisted: false,
          viewerUrlPersisted: false,
        }, null, 2)}\n`, "utf8");
      }
      throw new Error([
        error instanceof Error ? error.message : "PDF_RENDER_UNKNOWN_ERROR",
        `nextStdout=${JSON.stringify(sanitizeServerOutput(server.stdout()))}`,
        `nextStderr=${JSON.stringify(sanitizeServerOutput(server.stderr()))}`,
      ].join("|"));
    }
    assert.equal(pdf.renderRouteStatus, 200);
    assert.equal(pdf.renderRouteContentType, "text/html");
    assert.equal(pdf.renderRouteRedirected, false);
    assert.equal(pdf.renderRoutePathname, "/dev/workorder-pdf-render/{runToken32}");
    assert.ok(pdf.fileSizeBytes > 0);
    assert.match(pdf.contentSha256, /^[0-9a-f]{64}$/);
    assert.equal(pdf.pageCount, 3);
    assert.equal(pdf.pageOrientations[0], "landscape");
    assert.ok(pdf.pageOrientations.slice(1).every((orientation) => orientation === "portrait"));
    assert.equal(pdf.blankPageCount, 0);
    assert.equal(pdf.clippingViolationCount, 0);
    assert.ok(pdf.coverFragmentationOverflowPx <= 2);
    assert.equal(pdf.coverFragmentationViolationCount, 0);
    assert.equal(pdf.rowSplitViolationCount, 0);
    assert.equal(pdf.consoleErrorCount, 0);
    assert.equal(pdf.failedRequestCount, 0);
    assert.equal(pdf.representativeImageVisible, true);
    assert.equal(pdf.embeddedQrVisible, true);
    for (const text of ["작업지시서", ALPHA42_REALISTIC_FIXTURE.productName, "IVORY", "NAVY", "BLACK", "144"]) {
      assert.ok(pdf.extractedText.includes(text), `pdf-text-missing:${text}`);
    }
    for (let pageNumber = 1; pageNumber <= pdf.pageCount; pageNumber += 1) {
      const footer = `${pageNumber} / ${pdf.pageCount}`;
      assert.equal(pdf.extractedText.split(footer).length - 1, 1, `pdf-page-footer-count-mismatch:${pageNumber}`);
    }

    await fs.mkdir(path.dirname(PDF_PATH), { recursive: true });
    await fs.writeFile(PDF_PATH, pdf.pdf);
    const a30 = state.a30[0];
    const safeManifest = {
      result: "ALPHA42_PENDING_PDF_LOCAL_RENDER_READINESS_PASS",
      appVersion: "2.0.0-alpha.41",
      targetFingerprint: FINGERPRINT,
      ledger: "12/12",
      workOrderRef: safeRef(row.work_order_id),
      revisionRef: safeRef(row.revision_id),
      generatedDocumentRef: safeRef(row.generated_document_id),
      pendingDocumentReused: true,
      embeddedTokenReused: true,
      tokenRederivationHashMatch: true,
      tokenAccessCount: 0,
      snapshotSha256,
      rendererVersion: snapshot.rendererVersion,
      dtoSchemaVersion: snapshot.dtoSchemaVersion,
      renderInputPath: ".tmp/wafl-v2-alpha38/render-input/{runToken32}.json",
      renderInputExists: true,
      renderInputJsonParse: "PASS",
      renderInputFields: ["snapshot", "canonicalSnapshotJson", "snapshotSha256", "objectKeyPlan", "representativeImageDataUrl"],
      representativeImage: { r2GetCount: 1, mimeType: "image/png", fileSizeBytes: imageBytes.byteLength, contentSha256: sha256(imageBytes), pngSignature: true },
      renderRoute: { pathname: pdf.renderRoutePathname, status: pdf.renderRouteStatus, contentType: pdf.renderRouteContentType, redirected: pdf.renderRouteRedirected },
      pdf: {
        fileSizeBytes: pdf.fileSizeBytes,
        contentSha256: pdf.contentSha256,
        pageCount: pdf.pageCount,
        pageOrientations: pdf.pageOrientations,
        pageOrientationEvidence: pdf.pageOrientationEvidence,
        representativeImageVisible: pdf.representativeImageVisible,
        embeddedQrVisible: pdf.embeddedQrVisible,
        blankPageCount: pdf.blankPageCount,
        clippingViolationCount: pdf.clippingViolationCount,
        coverFragmentationOverflowPx: pdf.coverFragmentationOverflowPx,
        coverFragmentationViolationCount: pdf.coverFragmentationViolationCount,
        rowSplitViolationCount: pdf.rowSplitViolationCount,
        consoleErrorCount: pdf.consoleErrorCount,
        failedRequestCount: pdf.failedRequestCount,
      },
      retainedBaseline: { receipts: 3, events: 2, generatedStatus: "pending", tokenAccessCount: 0 },
      pdfR2Object: "ABSENT_BY_READ_ONLY_AUDIT_20260715_191508",
      a30Fact: `${a30.status}/${a30.revision_status} ${a30.work_order_version}/${a30.revision_version}; ${a30.generated_status}; manual tokens ${a30.manual_tokens}; unchanged`,
      dbMutation: false,
      r2Put: 0,
      r2Delete: 0,
      productionMutation: false,
      rawTokenPersisted: false,
      viewerUrlPersisted: false,
    };
    await fs.writeFile(MANIFEST_PATH, `${JSON.stringify(safeManifest, null, 2)}\n`, "utf8");
    console.log("ALPHA42 PENDING PDF LOCAL RENDER READINESS: PASS");
    console.log(JSON.stringify({
      ...safeManifest,
      localPdfArtifact: ".tmp/wafl-v2-alpha42/pending-render-readiness.pdf",
      nextStdoutTail: sanitizeServerOutput(server.stdout()),
      nextStderrTail: sanitizeServerOutput(server.stderr()),
    }));
    assert.equal(getLocalIssuedPdfRenderInputPath(runToken), inputPath);
  } finally {
    await stopServer(server);
    await client.end();
  }
}

main().catch((error) => {
  console.error("ALPHA42 PENDING PDF LOCAL RENDER READINESS: FAILED", {
    name: error instanceof Error ? error.name : "UnknownError",
    message: error instanceof Error ? error.message : "unknown",
  });
  process.exitCode = 1;
});
