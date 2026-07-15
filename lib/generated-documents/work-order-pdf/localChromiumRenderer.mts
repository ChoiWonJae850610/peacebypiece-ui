import { createHash } from "node:crypto";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { pathToFileURL } from "node:url";

import { chromium } from "@playwright/test";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";

import type {
  IssuedWorkOrderPdfRenderer,
  IssuedWorkOrderPdfRenderInput,
  IssuedWorkOrderPdfRenderResult,
} from "./renderer.ts";
import { encodeEmbeddedQrRenderContext, WORK_ORDER_PDF_EMBEDDED_QR_HEADER } from "./embeddedQrRenderContext.mjs";
import {
  inspectPdfPageOrientations,
  validatePdfPageOrientations,
  type PdfPageOrientationEvidence,
} from "./pdfPageOrientation.mjs";

const PDF_HEADER = "%PDF-";
const PDF_EOF = "%%EOF";
const RUN_TOKEN_PATH_PATTERN = /\/dev\/workorder-pdf-render\/[a-f0-9]{32}/g;

type PdfOrientationFailureEvidence = {
  readonly pdfSha256: string;
  readonly fileSizeBytes: number;
  readonly pageCount: number;
  readonly actualOrientations: readonly string[];
  readonly expectedOrientations: readonly string[];
  readonly pages: readonly PdfPageOrientationEvidence[];
  readonly firstMismatchPageIndex: number | null;
  readonly mismatchReason: string | null;
};

export class PdfPageOrientationValidationError extends Error {
  readonly code = "PDF_PAGE_ORIENTATION_INVALID";
  readonly pdf: Buffer;
  readonly evidence: PdfOrientationFailureEvidence;

  constructor(
    pdf: Buffer,
    evidence: PdfOrientationFailureEvidence,
  ) {
    super(`${"PDF_PAGE_ORIENTATION_INVALID"}|evidence=${JSON.stringify(evidence)}`);
    this.name = "PdfPageOrientationValidationError";
    this.pdf = pdf;
    this.evidence = evidence;
  }
}

function sha256(value: Buffer | string): string {
  return createHash("sha256").update(value).digest("hex");
}

function assertLocalRenderUrl(value: string): URL {
  const url = new URL(value);
  if (url.protocol !== "http:" || !new Set(["localhost", "127.0.0.1", "::1"]).has(url.hostname)) {
    throw new Error("PDF_LOCAL_RENDER_URL_REQUIRED");
  }
  if (url.pathname !== "/dev/workorder-preview-sample"
    && !/^\/dev\/workorder-pdf-render\/[a-f0-9]{32}$/.test(url.pathname)) {
    throw new Error("PDF_LOCAL_RENDER_ROUTE_INVALID");
  }
  return url;
}

function sanitizeRenderPathname(value: string): string {
  return value.replace(RUN_TOKEN_PATH_PATTERN, "/dev/workorder-pdf-render/{runToken32}").slice(0, 240);
}

function sanitizeRenderResponseBody(value: string): string {
  return value
    .replace(/https?:\/\/[^\s"'<>]+/g, "<redacted-url>")
    .replace(/\b[0-9a-f]{8}-[0-9a-f-]{27,}\b/gi, "<redacted-uuid>")
    .replace(/(?<![A-Za-z0-9_-])[A-Za-z0-9_-]{43}(?![A-Za-z0-9_-])/g, "<redacted-opaque-token>")
    .replace(/[a-f0-9]{32}/g, "{runToken32}")
    .slice(0, 1_000);
}

async function assertRenderRouteResponse(response: import("@playwright/test").Response | null, requestedUrl: URL) {
  if (!response) throw new Error(`PDF_RENDER_ROUTE_NOT_FOUND|path=${sanitizeRenderPathname(requestedUrl.pathname)}`);
  const finalUrl = new URL(response.url());
  const redirected = response.request().redirectedFrom() !== null
    || finalUrl.pathname !== requestedUrl.pathname;
  const status = response.status();
  if (!redirected && status === 200) {
    return {
      status,
      pathname: sanitizeRenderPathname(finalUrl.pathname),
      contentType: response.headers()["content-type"]?.split(";", 1)[0] ?? "unknown",
      redirected,
    };
  }
  const bodyPrefix = sanitizeRenderResponseBody(await response.text().catch(() => ""));
  const routeCode = bodyPrefix.match(/PDF_[A-Z0-9_]+/)?.[0] ?? "UNAVAILABLE";
  const typedCode = redirected
    ? "PDF_RENDER_ROUTE_REDIRECTED"
    : status === 404
      ? "PDF_RENDER_ROUTE_NOT_FOUND"
      : status === 401 || status === 403
        ? "PDF_RENDER_ROUTE_FORBIDDEN"
        : routeCode === "PDF_RENDER_INPUT_NOT_FOUND" || routeCode === "PDF_RENDER_INPUT_INVALID"
          ? routeCode
          : "PDF_RENDER_ROUTE_SERVER_ERROR";
  throw new Error([
    typedCode,
    `status=${status}`,
    `contentType=${response.headers()["content-type"]?.split(";", 1)[0] ?? "unknown"}`,
    `redirected=${redirected}`,
    `requestedPath=${sanitizeRenderPathname(requestedUrl.pathname)}`,
    `finalPath=${sanitizeRenderPathname(finalUrl.pathname)}`,
    `routeCode=${routeCode}`,
    `bodyPrefix=${JSON.stringify(bodyPrefix)}`,
  ].join("|"));
}

async function inspectPdf(pdf: Buffer) {
  GlobalWorkerOptions.workerSrc = pathToFileURL(path.join(
    process.cwd(),
    "node_modules",
    "pdfjs-dist",
    "legacy",
    "build",
    "pdf.worker.mjs",
  )).href;
  const loadingTask = getDocument({
    data: new Uint8Array(pdf),
    useSystemFonts: true,
  });
  const document = await loadingTask.promise;
  try {
    const pageOrientationEvidence = inspectPdfPageOrientations(pdf);
    if (pageOrientationEvidence.length !== document.numPages) {
      throw new Error("PDF_PAGE_INSPECTION_COUNT_MISMATCH");
    }
    const pageTexts: string[] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const textContent = await page.getTextContent();
      pageTexts.push(textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim());
    }
    return {
      pageCount: document.numPages,
      pageOrientations: pageOrientationEvidence.map((page) => page.classifiedOrientation),
      pageOrientationEvidence,
      orientationValidation: validatePdfPageOrientations(pageOrientationEvidence),
      pageTexts,
    };
  } finally {
    await document.destroy();
  }
}

export class LocalChromiumIssuedWorkOrderPdfRenderer implements IssuedWorkOrderPdfRenderer {
  async render(input: IssuedWorkOrderPdfRenderInput): Promise<IssuedWorkOrderPdfRenderResult> {
    const started = performance.now();
    const renderUrl = assertLocalRenderUrl(input.renderUrl);
    if (sha256(Buffer.from(input.canonicalSnapshotJson, "utf8")) !== input.snapshotSha256) {
      throw new Error("PDF_SNAPSHOT_HASH_MISMATCH");
    }
    if (!input.snapshot.rendererVersion || input.snapshot.dtoSchemaVersion < 1) {
      throw new Error("PDF_RENDER_VERSION_MISMATCH");
    }

    const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim() || undefined;
    const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
    try {
      const page = await browser.newPage({
        viewport: { width: 1440, height: 900 },
        ...(input.embeddedQrContext ? {
          extraHTTPHeaders: {
            [WORK_ORDER_PDF_EMBEDDED_QR_HEADER]: encodeEmbeddedQrRenderContext(input.embeddedQrContext),
          },
        } : {}),
      });
      const consoleErrors: string[] = [];
      const failedRequests: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text().slice(0, 160));
      });
      page.on("requestfailed", (request) => {
        failedRequests.push(new URL(request.url()).pathname.slice(0, 160));
      });
      page.on("response", (response) => {
        if (response.status() >= 400) {
          failedRequests.push(new URL(response.url()).pathname.slice(0, 160));
        }
      });

      const response = await page.goto(renderUrl.toString(), { waitUntil: "domcontentloaded" });
      const routeEvidence = await assertRenderRouteResponse(response, renderUrl);
      await page.locator('[data-wafl-pdf-ready="true"]').waitFor({ state: "attached" });
      await page.locator("[data-page-orientation]").first().waitFor({ state: "attached" });
      await page.emulateMedia({ media: "print" });
      const readyEvidence = await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all(Array.from(document.images).map((image) => image.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
            image.addEventListener("load", () => resolve(), { once: true });
            image.addEventListener("error", () => resolve(), { once: true });
          })));
        return {
          fontStatus: document.fonts.status,
          incompleteImageCount: Array.from(document.images).filter((image) => !image.complete).length,
          pageRootCount: document.querySelectorAll("[data-page-orientation]").length,
          ready: document.querySelector('[data-wafl-pdf-ready="true"]') !== null,
        };
      });
      if (!readyEvidence.ready
        || readyEvidence.fontStatus !== "loaded"
        || readyEvidence.incompleteImageCount !== 0
        || readyEvidence.pageRootCount < 1) {
        throw new Error("PDF_RENDER_READY_INVALID");
      }
      if (consoleErrors.length || failedRequests.length) throw new Error("PDF_RENDER_RESOURCE_ERROR");

      const pageSnapshotSha = await page.locator("[data-wafl-pdf-snapshot-sha]")
        .getAttribute("data-wafl-pdf-snapshot-sha");
      const pageSnapshotJson = await page.locator("#wafl-pdf-snapshot").textContent();
      if (pageSnapshotSha !== input.snapshotSha256 || pageSnapshotJson !== input.canonicalSnapshotJson) {
        throw new Error("PDF_RENDER_SOURCE_SNAPSHOT_MISMATCH");
      }

      const domEvidence = await page.evaluate(() => {
        const pages = Array.from(document.querySelectorAll<HTMLElement>("[data-page-orientation]"));
        const coverPage = pages[0];
        const coverStyle = coverPage ? getComputedStyle(coverPage) : null;
        const coverMinHeight = coverStyle ? Number.parseFloat(coverStyle.minHeight) : Number.NaN;
        const coverHeight = coverPage?.getBoundingClientRect().height ?? 0;
        const coverFragmentationOverflowPx = Number.isFinite(coverMinHeight)
          ? Math.max(0, coverHeight - coverMinHeight)
          : Number.POSITIVE_INFINITY;
        const clippingViolationCount = pages.filter((pdfPage) =>
          pdfPage.scrollWidth > pdfPage.clientWidth + 2
          || pdfPage.scrollHeight > pdfPage.clientHeight + 2).length;
        const rowSplitViolationCount = pages.reduce((count, pdfPage) => {
          const pageBounds = pdfPage.getBoundingClientRect();
          return count + Array.from(pdfPage.querySelectorAll<HTMLTableRowElement>("tr"))
            .filter((row) => {
              const rowBounds = row.getBoundingClientRect();
              return rowBounds.top < pageBounds.top - 2 || rowBounds.bottom > pageBounds.bottom + 2;
            }).length;
        }, 0);
        const representativeImage = document.querySelector<HTMLImageElement>('img[data-wafl-representative-image="true"]');
        const embeddedQr = document.querySelector<HTMLElement>('[data-wafl-embedded-qr="true"]');
        return {
          clippingViolationCount,
          coverFragmentationOverflowPx,
          coverFragmentationViolationCount: coverFragmentationOverflowPx > 2 ? 1 : 0,
          rowSplitViolationCount,
          representativeImageVisible: Boolean(representativeImage
            && representativeImage.complete
            && representativeImage.naturalWidth > 0
            && representativeImage.naturalHeight > 0
            && representativeImage.getBoundingClientRect().width > 0
            && representativeImage.getBoundingClientRect().height > 0),
          embeddedQrVisible: Boolean(embeddedQr
            && embeddedQr.getBoundingClientRect().width > 0
            && embeddedQr.getBoundingClientRect().height > 0),
        };
      });

      const bytes = await page.pdf({
        printBackground: input.options.printBackground,
        preferCSSPageSize: input.options.preferCssPageSize,
        tagged: true,
      });
      const pdf = Buffer.from(bytes);
      if (pdf.byteLength <= 0 || pdf.byteLength > input.options.maxFileSizeBytes) {
        throw new Error("PDF_FILE_SIZE_INVALID");
      }
      if (!pdf.subarray(0, PDF_HEADER.length).toString("ascii").startsWith(PDF_HEADER)) {
        throw new Error("PDF_HEADER_INVALID");
      }
      if (!pdf.subarray(Math.max(0, pdf.length - 2048)).toString("latin1").includes(PDF_EOF)) {
        throw new Error("PDF_EOF_INVALID");
      }

      const inspection = await inspectPdf(pdf);
      if (!inspection.orientationValidation.valid) {
        throw new PdfPageOrientationValidationError(pdf, {
          pdfSha256: sha256(pdf),
          fileSizeBytes: pdf.byteLength,
          pageCount: inspection.pageCount,
          actualOrientations: inspection.pageOrientations,
          expectedOrientations: inspection.pageOrientationEvidence.map((page) => page.expectedOrientation),
          pages: inspection.pageOrientationEvidence,
          firstMismatchPageIndex: inspection.orientationValidation.firstMismatchPageIndex,
          mismatchReason: inspection.orientationValidation.mismatchReason,
        });
      }
      const blankPageCount = inspection.pageTexts.filter((text) => text.length === 0).length;
      const extractedText = inspection.pageTexts.join("\n");

      return {
        pdf,
        fileSizeBytes: pdf.byteLength,
        contentSha256: sha256(pdf),
        pageCount: inspection.pageCount,
        pageOrientations: inspection.pageOrientations as ("landscape" | "portrait")[],
        pageOrientationEvidence: inspection.pageOrientationEvidence,
        rendererVersion: input.snapshot.rendererVersion,
        dtoSchemaVersion: input.snapshot.dtoSchemaVersion,
        provider: "local-chromium",
        renderDurationMs: Number((performance.now() - started).toFixed(2)),
        renderRouteStatus: routeEvidence.status,
        renderRoutePathname: routeEvidence.pathname,
        renderRouteContentType: routeEvidence.contentType,
        renderRouteRedirected: routeEvidence.redirected,
        extractedText,
        pageTextLengths: inspection.pageTexts.map((text) => text.length),
        blankPageCount,
        clippingViolationCount: domEvidence.clippingViolationCount,
        coverFragmentationOverflowPx: Number(domEvidence.coverFragmentationOverflowPx.toFixed(3)),
        coverFragmentationViolationCount: domEvidence.coverFragmentationViolationCount,
        rowSplitViolationCount: domEvidence.rowSplitViolationCount,
        consoleErrorCount: consoleErrors.length,
        failedRequestCount: failedRequests.length,
        representativeImageVisible: domEvidence.representativeImageVisible,
        embeddedQrVisible: domEvidence.embeddedQrVisible,
      };
    } finally {
      await browser.close();
    }
  }
}
