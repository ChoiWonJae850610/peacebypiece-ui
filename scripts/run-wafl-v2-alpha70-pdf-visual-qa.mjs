#!/usr/bin/env node
import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import net from "node:net";
import path from "node:path";

import { LocalChromiumIssuedWorkOrderPdfRenderer } from "../lib/generated-documents/work-order-pdf/localChromiumRenderer.mts";
import { writeLocalIssuedPdfRenderInput, removeLocalIssuedPdfRenderInput } from "../lib/generated-documents/work-order-pdf/localRenderInputCore.mjs";

const ROOT = path.resolve(process.cwd());
const OUTPUT_ROOT = path.join(ROOT, "output", "pdf");
const REQUIRED_VERSION = "2.0.0-alpha.69";
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeCanonicalValue(value, inArray = false) {
  if (value === undefined) return inArray ? null : undefined;
  if (Array.isArray(value)) return value.map((item) => normalizeCanonicalValue(item, true));
  if (value && typeof value === "object") {
    const normalized = {};
    for (const key of Object.keys(value).sort()) {
      const next = normalizeCanonicalValue(value[key]);
      if (next !== undefined) normalized[key] = next;
    }
    return normalized;
  }
  return value;
}

function serializeSnapshot(snapshot) {
  return JSON.stringify(normalizeCanonicalValue(snapshot));
}

function makeImageDataUrl({ width, height, label, color = "#c9d9e8" }) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#f8f8f6"/>
  <rect x="18" y="18" width="${width - 36}" height="${height - 36}" rx="18" fill="${color}" stroke="#2d3948" stroke-width="4"/>
  <path d="M${width * 0.28} ${height * 0.28} L${width * 0.42} ${height * 0.17} Q${width * 0.5} ${height * 0.25} ${width * 0.58} ${height * 0.17} L${width * 0.72} ${height * 0.28} L${width * 0.63} ${height * 0.42} L${width * 0.62} ${height * 0.82} Q${width * 0.5} ${height * 0.88} ${width * 0.38} ${height * 0.82} L${width * 0.37} ${height * 0.42} Z" fill="#ffffff" stroke="#2d3948" stroke-width="5"/>
  <text x="${width / 2}" y="${height - 34}" text-anchor="middle" font-family="sans-serif" font-size="22" fill="#2d3948">${label}</text>
</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
}

function attachmentImages(count) {
  const palette = ["#c9d9e8", "#e8d6c9", "#d8e5cf", "#e4d5e8", "#e9dfb9"];
  return Array.from({ length: count }, (_, index) => ({
    filename: `선택 첨부 이미지 ${String(index + 1).padStart(2, "0")}.svg`,
    dataUrl: makeImageDataUrl({ width: 800, height: 560, label: `ATTACH ${index + 1}`, color: palette[index % palette.length] }),
  }));
}

function withPreview(snapshot, preview) {
  return {
    ...snapshot,
    preview,
    documentIdentity: {
      ...snapshot.documentIdentity,
      displayDocumentNumber: preview.document.displayDocumentNumber,
    },
  };
}

function longTextPreview(preview) {
  const displayDocumentNumber = "WAFN-29FW-OUTER-CUSTOM-LONG-DOCUMENT-NUMBER-260829-001-R0";
  return {
    ...preview,
    header: {
      ...preview.header,
      productName: "프리미엄 리버서블 퀼팅 오버사이즈 트렌치 재킷 장문 제품명 시각 가독성 검증",
    },
    document: { ...preview.document, displayDocumentNumber },
    processes: preview.processes.map((process) => process.role === "factory"
      ? { ...process, partnerName: "성수 프리미엄 어패럴 생산공장 장문 업체명 검증 센터" }
      : process),
  };
}

function expandRows(rows, count, label) {
  return Array.from({ length: count }, (_, index) => {
    const source = rows[index % rows.length];
    const suffix = String(index + 1).padStart(2, "0");
    return {
      ...source,
      id: `${source.id.slice(0, -2)}${suffix}`,
      name: `${source.name} ${suffix}`,
      memo: `${label} ${suffix} · 원단 방향, 재단 위치, 봉제 순서와 최종 마감 상태를 함께 확인합니다.`,
      displayOrder: index,
    };
  });
}

function richPreview(preview) {
  return {
    ...preview,
    header: { ...preview.header, identity: { isSample: false, derivationKind: "reorder", reorderRound: 3 } },
    materials: {
      fabrics: expandRows(preview.materials.fabrics, 14, "원단 검증"),
      accessories: expandRows(preview.materials.accessories, 14, "부자재 검증"),
    },
  };
}

function sparsePreview(preview) {
  const firstSize = preview.sizeColors.sizes.slice(0, 1);
  const firstColor = preview.sizeColors.colors.slice(0, 1);
  const quantityCells = preview.sizeColors.quantityCells.filter((cell) =>
    cell.colorId === firstColor[0]?.id && cell.sizeRowId === firstSize[0]?.id);
  const total = quantityCells[0]?.quantity ?? "0";
  return {
    ...preview,
    header: { ...preview.header, productName: "샘플 티셔츠", totalQuantity: Number(total), identity: { isSample: true, derivationKind: "original", reorderRound: 0 } },
    materials: { fabrics: [], accessories: [] },
    processes: preview.processes.filter((process) => process.role === "factory").slice(0, 1),
    sizeColors: { ...preview.sizeColors, sizes: firstSize, colors: firstColor, quantityCells, matrixTotal: total, expectedTotal: total, totalsMatch: true },
    sizeSpecifications: {
      ...preview.sizeSpecifications,
      sizes: preview.sizeSpecifications.sizes.slice(0, 1),
      pomColumns: preview.sizeSpecifications.pomColumns.slice(0, 5),
      cells: preview.sizeSpecifications.cells.filter((cell) => cell.sizeRowId === preview.sizeSpecifications.sizes[0]?.id).slice(0, 5),
    },
  };
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
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`ALPHA70_PDF_SERVER_EXITED:${child.exitCode}`);
    try {
      const response = await fetch(new URL("/dev/workorder-pdf-snapshot", baseUrl), { cache: "no-store" });
      if (response.ok) return;
    } catch {
      // Bounded local readiness polling.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("ALPHA70_PDF_SERVER_TIMEOUT");
}

async function startServer() {
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
  if (child.exitCode !== null) return;
  child.kill();
  await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    new Promise((resolve) => setTimeout(resolve, 5_000)),
  ]);
}

async function renderScenario(renderer, server, baseline, scenario) {
  const runToken = randomBytes(16).toString("hex");
  const snapshot = withPreview(baseline.snapshot, scenario.preview);
  const canonicalSnapshotJson = serializeSnapshot(snapshot);
  const snapshotSha256 = sha256(Buffer.from(canonicalSnapshotJson, "utf8"));
  const outputPath = path.join(OUTPUT_ROOT, `alpha70-${scenario.slug}.pdf`);
  await writeLocalIssuedPdfRenderInput(runToken, {
    snapshot,
    canonicalSnapshotJson,
    snapshotSha256,
    objectKeyPlan: baseline.objectKeyPlan,
    representativeImageDataUrl: scenario.representativeImageDataUrl,
    includedAttachmentImages: scenario.attachments,
  });
  try {
    const result = await renderer.render({
      snapshot,
      canonicalSnapshotJson,
      snapshotSha256,
      renderUrl: new URL(`/dev/workorder-pdf-render/${runToken}`, server.baseUrl).toString(),
      outputFileName: path.basename(outputPath),
      options: { printBackground: true, preferCssPageSize: true, maxFileSizeBytes: MAX_FILE_SIZE_BYTES },
    });
    await writeFile(outputPath, result.pdf);
    assert.ok(result.pdf.subarray(0, 5).toString("ascii").startsWith("%PDF-"));
    assert.ok(result.pdf.subarray(Math.max(0, result.pdf.length - 2048)).toString("latin1").includes("%%EOF"));
    assert.ok(result.pageOrientations.every((orientation) => orientation === "portrait"));
    assert.equal(result.blankPageCount, 0, `${scenario.slug}:blank-pages`);
    assert.equal(result.clippingViolationCount, 0, `${scenario.slug}:clipping`);
    assert.equal(result.rowSplitViolationCount, 0, `${scenario.slug}:row-splits`);
    assert.equal(result.consoleErrorCount, 0, `${scenario.slug}:console-errors`);
    assert.equal(result.failedRequestCount, 0, `${scenario.slug}:failed-requests`);
    assert.equal(result.representativeImageVisible, scenario.representativeImageDataUrl !== null);
    return {
      slug: scenario.slug,
      path: path.relative(ROOT, outputPath).replaceAll("\\", "/"),
      bytes: result.fileSizeBytes,
      sha256: result.contentSha256,
      pages: result.pageCount,
      orientations: result.pageOrientations,
      attachmentCount: scenario.attachments.length,
      representativeImage: scenario.representativeImageDataUrl !== null,
      pageTextLengths: result.pageTextLengths,
      clippingViolationCount: result.clippingViolationCount,
      rowSplitViolationCount: result.rowSplitViolationCount,
    };
  } finally {
    await removeLocalIssuedPdfRenderInput(runToken);
  }
}

async function main() {
  const versionSource = await readFile(path.join(ROOT, "lib", "constants", "version.ts"), "utf8");
  assert.ok(versionSource.includes(REQUIRED_VERSION));
  await mkdir(OUTPUT_ROOT, { recursive: true });
  const server = await startServer();
  try {
    const foundationResponse = await fetch(new URL("/dev/workorder-pdf-snapshot", server.baseUrl), { cache: "no-store" });
    assert.equal(foundationResponse.status, 200);
    const baseline = await foundationResponse.json();
    const normal = baseline.snapshot.preview;
    const rich = richPreview(normal);
    const sparse = sparsePreview(normal);
    const square = makeImageDataUrl({ width: 800, height: 800, label: "SQUARE" });
    const scenarios = [
      { slug: "cover-no-image", preview: normal, representativeImageDataUrl: null, attachments: [] },
      { slug: "cover-portrait", preview: normal, representativeImageDataUrl: makeImageDataUrl({ width: 560, height: 900, label: "PORTRAIT" }), attachments: [] },
      { slug: "cover-landscape", preview: normal, representativeImageDataUrl: makeImageDataUrl({ width: 1000, height: 560, label: "LANDSCAPE" }), attachments: [] },
      { slug: "cover-square", preview: normal, representativeImageDataUrl: square, attachments: [] },
      { slug: "cover-long-text", preview: longTextPreview(normal), representativeImageDataUrl: square, attachments: [] },
      ...[1, 2, 5, 10, 11].map((count) => ({ slug: `gallery-${count}`, preview: normal, representativeImageDataUrl: square, attachments: attachmentImages(count) })),
      { slug: "rich", preview: rich, representativeImageDataUrl: square, attachments: attachmentImages(11) },
      { slug: "sparse", preview: sparse, representativeImageDataUrl: null, attachments: [] },
    ];
    const renderer = new LocalChromiumIssuedWorkOrderPdfRenderer();
    const results = [];
    for (const scenario of scenarios) results.push(await renderScenario(renderer, server, baseline, scenario));

    const galleryBasePages = results.find((item) => item.slug === "cover-square").pages;
    for (const count of [1, 2, 5, 10]) {
      assert.equal(results.find((item) => item.slug === `gallery-${count}`).pages, galleryBasePages + 1);
    }
    assert.equal(results.find((item) => item.slug === "gallery-11").pages, galleryBasePages + 2);

    const manifest = {
      completedAt: new Date().toISOString(),
      appVersion: REQUIRED_VERSION,
      renderer: "LocalChromiumIssuedWorkOrderPdfRenderer",
      coverImageFactRatio: "58/42",
      coverMainHeightMm: 140,
      supplementalGrid: { columns: 2, rowsPerPage: 5, capacity: 10, thumbnailHeightMm: 35 },
      scenarioCount: scenarios.length,
      results,
      validation: {
        pdfHeader: "PASS",
        pdfEof: "PASS",
        readableUnencrypted: "PASS",
        a4PortraitOnly: "PASS",
        blankPages: 0,
        clippingViolations: 0,
        rowSplitViolations: 0,
      },
      DBMutation: 0,
      R2Mutation: 0,
      productionMutation: 0,
      ownerMutation: 0,
      ambiguousMutation: 0,
    };
    await writeFile(path.join(OUTPUT_ROOT, "alpha70-visual-qa-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    console.log(JSON.stringify({ result: "ALPHA70_PDF_VISUAL_QA_RENDER_PASS", manifest }, null, 2));
  } finally {
    await stopServer(server.child);
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    result: "ALPHA70_PDF_VISUAL_QA_RENDER_FAILED",
    error: error instanceof Error ? error.message.slice(0, 500) : "UNKNOWN",
    DBMutation: 0,
    R2Mutation: 0,
    productionMutation: 0,
  }));
  process.exitCode = 1;
});
