import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync, spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import net from "node:net";
import path from "node:path";

import { LocalChromiumIssuedWorkOrderPdfRenderer } from "../lib/generated-documents/work-order-pdf/localChromiumRenderer.mts";
import { LocalFilesystemGeneratedDocumentObjectStore } from "../lib/generated-documents/work-order-pdf/localFilesystemObjectStore.mts";

const ROOT = path.resolve(process.cwd());
const REQUIRED_VERSION = "2.0.0-alpha.37";
const REQUIRED_TEXT = [
  "작업지시서",
  "리넨 라운드 셔츠 원피스",
  "WAFN-26FW-O-LNDRS-260713-001-R0",
  "개정차수",
  "발주수량",
  "원단",
  "부자재",
  "색상·사이즈 수량",
  "사이즈 스펙",
  "제작 공정·추가 공정",
  "IVORY",
  "NAVY",
  "BLACK",
  "144",
];

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeExtractedText(value) {
  return value.replace(/\s*·\s*/g, "·");
}

function readAppVersion() {
  const source = execFileSync(process.execPath, ["-e", "process.stdout.write(require('fs').readFileSync('lib/constants/version.ts','utf8'))"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  return source.match(/APP_VERSION\s*=\s*["']([^"']+)/)?.[1] ?? "unknown";
}

function readHead() {
  return execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim();
}

function assertLocalUrl(raw) {
  const url = new URL(raw);
  assert.equal(url.protocol, "http:");
  assert.ok(new Set(["localhost", "127.0.0.1", "::1"]).has(url.hostname));
  return url;
}

async function reservePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close((error) => error ? reject(error) : resolve(port));
    });
  });
}

async function waitForServer(baseUrl, child) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (child?.exitCode !== null && child?.exitCode !== undefined) {
      throw new Error(`PDF_LOCAL_SERVER_EXITED_${child.exitCode}`);
    }
    try {
      const response = await fetch(new URL("/dev/workorder-pdf-snapshot", baseUrl), { cache: "no-store" });
      if (response.ok) return;
    } catch {
      // Server startup is polled without printing raw network details.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("PDF_LOCAL_SERVER_START_TIMEOUT");
}

async function startServer() {
  if (process.env.WAFL_ALPHA37_BASE_URL) {
    const baseUrl = assertLocalUrl(process.env.WAFL_ALPHA37_BASE_URL);
    await waitForServer(baseUrl, null);
    return { baseUrl, child: null };
  }

  const port = await reservePort();
  const baseUrl = new URL(`http://127.0.0.1:${port}`);
  const nextBin = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");
  const child = spawn(process.execPath, [nextBin, "start", "-H", "127.0.0.1", "-p", String(port)], {
    cwd: ROOT,
    env: { ...process.env, NODE_ENV: "production" },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  child.stdout?.resume();
  child.stderr?.resume();
  await waitForServer(baseUrl, child);
  return { baseUrl, child };
}

async function stopServer(child) {
  if (!child || child.exitCode !== null) return;
  child.kill();
  await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    new Promise((resolve) => setTimeout(resolve, 5_000)),
  ]);
}

function sanitizedResult(result) {
  return {
    pdfSha256: result.contentSha256,
    fileSizeBytes: result.fileSizeBytes,
    pageCount: result.pageCount,
    pageOrientations: result.pageOrientations,
    renderDurationMs: result.renderDurationMs,
    pageTextLengths: result.pageTextLengths,
    blankPageCount: result.blankPageCount,
    clippingViolationCount: result.clippingViolationCount,
    consoleErrorCount: result.consoleErrorCount,
    failedRequestCount: result.failedRequestCount,
    representativeImageVisible: result.representativeImageVisible,
  };
}

async function main() {
  const appVersion = readAppVersion();
  assert.equal(appVersion, REQUIRED_VERSION, "APP_VERSION must be alpha.37 before local runtime verification");
  const sourceHead = readHead();
  const runId = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  const artifactRoot = path.join(ROOT, ".tmp", "wafl-v2-alpha37", runId);
  await mkdir(artifactRoot, { recursive: true });

  const server = await startServer();
  try {
    const snapshotResponse = await fetch(new URL("/dev/workorder-pdf-snapshot", server.baseUrl), { cache: "no-store" });
    assert.equal(snapshotResponse.status, 200);
    const foundation = await snapshotResponse.json();
    assert.equal(sha256(Buffer.from(foundation.canonicalSnapshotJson, "utf8")), foundation.snapshotSha256);
    assert.equal(foundation.snapshot.rendererVersion, "wafl-work-instruction-pdf/1");
    assert.equal(foundation.snapshot.dtoSchemaVersion, 1);
    assert.equal(foundation.snapshot.documentIdentity.documentType, "factory_instruction");
    assert.match(foundation.objectKeyPlan, /^companies\/[^/]+\/workorders\/[^/]+\/pdf\/[^/]+\.pdf$/);

    const secondSnapshotResponse = await fetch(new URL("/dev/workorder-pdf-snapshot", server.baseUrl), { cache: "no-store" });
    const secondFoundation = await secondSnapshotResponse.json();
    assert.equal(secondFoundation.snapshotSha256, foundation.snapshotSha256);
    assert.equal(secondFoundation.canonicalSnapshotJson, foundation.canonicalSnapshotJson);

    const renderer = new LocalChromiumIssuedWorkOrderPdfRenderer();
    const renderInput = {
      snapshot: foundation.snapshot,
      canonicalSnapshotJson: foundation.canonicalSnapshotJson,
      snapshotSha256: foundation.snapshotSha256,
      renderUrl: new URL("/dev/workorder-preview-sample", server.baseUrl).toString(),
      outputFileName: "sample-issued-workorder.pdf",
      options: {
        printBackground: true,
        preferCssPageSize: true,
        maxFileSizeBytes: 10 * 1024 * 1024,
      },
    };
    const first = await renderer.render(renderInput);
    const second = await renderer.render(renderInput);

    for (const result of [first, second]) {
      const extractedText = normalizeExtractedText(result.extractedText);
      assert.ok(result.pdf.subarray(0, 5).toString("ascii").startsWith("%PDF-"));
      assert.match(result.contentSha256, /^[0-9a-f]{64}$/);
      assert.equal(result.pageCount, 3);
      assert.deepEqual(result.pageOrientations, ["landscape", "portrait", "portrait"]);
      assert.equal(result.blankPageCount, 0);
      assert.equal(result.clippingViolationCount, 0);
      assert.equal(result.consoleErrorCount, 0);
      assert.equal(result.failedRequestCount, 0);
      assert.equal(result.representativeImageVisible, true);
      for (const expected of REQUIRED_TEXT) assert.ok(extractedText.includes(expected), `PDF_TEXT_MISSING:${expected}`);
    }
    assert.equal(first.pageCount, second.pageCount);
    assert.deepEqual(first.pageOrientations, second.pageOrientations);
    const sizeDeltaRatio = Math.abs(first.fileSizeBytes - second.fileSizeBytes) / Math.max(first.fileSizeBytes, 1);
    assert.ok(sizeDeltaRatio <= 0.02, `PDF_REPEAT_SIZE_DELTA:${sizeDeltaRatio}`);

    const objectStore = new LocalFilesystemGeneratedDocumentObjectStore(path.join(artifactRoot, "object-store"));
    await objectStore.putPdf({
      key: foundation.objectKeyPlan,
      body: first.pdf,
      contentType: "application/pdf",
      fileSizeBytes: first.fileSizeBytes,
      contentSha256: first.contentSha256,
    });
    const storedHead = await objectStore.headPdf(foundation.objectKeyPlan);
    const storedPdf = await objectStore.getPdf(foundation.objectKeyPlan);
    assert.ok(storedHead && storedPdf);
    assert.equal(storedHead.contentSha256, first.contentSha256);
    assert.equal(storedPdf.byteLength, first.fileSizeBytes);

    const pdfArtifactPath = path.join(artifactRoot, "sample-issued-workorder.pdf");
    await writeFile(pdfArtifactPath, storedPdf);
    const manifest = {
      runId,
      appVersion,
      sourceHead,
      scenario: "deterministic-sample",
      workOrderId: foundation.snapshot.workOrderId,
      revisionId: foundation.snapshot.revisionId,
      displayDocumentNumber: foundation.snapshot.documentIdentity.displayDocumentNumber,
      documentType: foundation.snapshot.documentIdentity.documentType,
      rendererVersion: first.rendererVersion,
      dtoSchemaVersion: first.dtoSchemaVersion,
      snapshotSha256: foundation.snapshotSha256,
      snapshotSha256Repeat: secondFoundation.snapshotSha256,
      pdfSha256: first.contentSha256,
      pdfSha256Repeat: second.contentSha256,
      fileSizeBytes: first.fileSizeBytes,
      fileSizeBytesRepeat: second.fileSizeBytes,
      pageCount: first.pageCount,
      pageCountRepeat: second.pageCount,
      pageOrientations: first.pageOrientations,
      pageOrientationsRepeat: second.pageOrientations,
      objectKeyPlan: foundation.objectKeyPlan,
      provider: first.provider,
      assetResolution: foundation.assetResolution,
      validation: {
        requiredTextCount: REQUIRED_TEXT.length,
        blankPageCount: first.blankPageCount,
        clippingViolationCount: first.clippingViolationCount,
        consoleErrorCount: first.consoleErrorCount,
        failedRequestCount: first.failedRequestCount,
        representativeImageVisible: first.representativeImageVisible,
      },
      actualIssuedScenario: {
        result: "SKIPPED_WITH_REASON",
        reason: "alpha.37 local foundation does not load DB credentials; accepted alpha.28/30 immutable Preview read evidence is preserved",
      },
      DBMutation: false,
      R2Mutation: false,
      WorkerExecution: false,
      productionMutation: false,
      result: "PASS",
      failureCode: null,
    };
    const manifestPath = path.join(artifactRoot, "manifest.json");
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

    const manifestRoundTrip = JSON.parse(await readFile(manifestPath, "utf8"));
    assert.equal(manifestRoundTrip.result, "PASS");
    console.log(JSON.stringify({
      result: "ALPHA37_PDF_FOUNDATION_PASS",
      manifestPath: path.relative(ROOT, manifestPath).replaceAll("\\", "/"),
      pdfArtifactPath: path.relative(ROOT, pdfArtifactPath).replaceAll("\\", "/"),
      snapshotSha256: foundation.snapshotSha256,
      objectKeyPlan: foundation.objectKeyPlan,
      first: sanitizedResult(first),
      second: sanitizedResult(second),
      DBMutation: false,
      R2Mutation: false,
      WorkerExecution: false,
      productionMutation: false,
    }, null, 2));
  } finally {
    await stopServer(server.child);
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    result: "ALPHA37_PDF_FOUNDATION_FAILED",
    code: error instanceof Error ? error.message.slice(0, 240) : "UNKNOWN",
    DBMutation: false,
    R2Mutation: false,
    WorkerExecution: false,
    productionMutation: false,
  }));
  process.exitCode = 1;
});
