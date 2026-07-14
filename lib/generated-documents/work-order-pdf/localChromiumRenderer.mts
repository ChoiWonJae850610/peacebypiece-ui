import { createHash } from "node:crypto";
import { performance } from "node:perf_hooks";

import { chromium } from "@playwright/test";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

import type {
  IssuedWorkOrderPdfRenderer,
  IssuedWorkOrderPdfRenderInput,
  IssuedWorkOrderPdfRenderResult,
} from "./renderer.ts";

const PDF_HEADER = "%PDF-";
const PDF_EOF = "%%EOF";

function sha256(value: Buffer | string): string {
  return createHash("sha256").update(value).digest("hex");
}

function assertLocalRenderUrl(value: string): URL {
  const url = new URL(value);
  if (url.protocol !== "http:" || !new Set(["localhost", "127.0.0.1", "::1"]).has(url.hostname)) {
    throw new Error("PDF_LOCAL_RENDER_URL_REQUIRED");
  }
  if (url.pathname !== "/dev/workorder-preview-sample") {
    throw new Error("PDF_LOCAL_RENDER_ROUTE_INVALID");
  }
  return url;
}

async function inspectPdf(pdf: Buffer) {
  const loadingTask = getDocument({
    data: new Uint8Array(pdf),
    useSystemFonts: true,
  });
  const document = await loadingTask.promise;
  try {
    const orientations: ("landscape" | "portrait")[] = [];
    const pageTexts: string[] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1 });
      orientations.push(viewport.width > viewport.height ? "landscape" : "portrait");
      const textContent = await page.getTextContent();
      pageTexts.push(textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim());
    }
    return {
      pageCount: document.numPages,
      pageOrientations: orientations,
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
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      const consoleErrors: string[] = [];
      const failedRequests: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text().slice(0, 160));
      });
      page.on("requestfailed", (request) => {
        failedRequests.push(new URL(request.url()).pathname.slice(0, 160));
      });

      await page.goto(renderUrl.toString(), { waitUntil: "networkidle" });
      await page.emulateMedia({ media: "print" });
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all(Array.from(document.images).map((image) => image.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
            image.addEventListener("load", () => resolve(), { once: true });
            image.addEventListener("error", () => resolve(), { once: true });
          })));
      });

      const pageSnapshotSha = await page.locator("[data-wafl-pdf-snapshot-sha]")
        .getAttribute("data-wafl-pdf-snapshot-sha");
      const pageSnapshotJson = await page.locator("#wafl-pdf-snapshot").textContent();
      if (pageSnapshotSha !== input.snapshotSha256 || pageSnapshotJson !== input.canonicalSnapshotJson) {
        throw new Error("PDF_RENDER_SOURCE_SNAPSHOT_MISMATCH");
      }

      const domEvidence = await page.evaluate(() => {
        const pages = Array.from(document.querySelectorAll<HTMLElement>("[data-page-orientation]"));
        const clippingViolationCount = pages.filter((pdfPage) =>
          pdfPage.scrollWidth > pdfPage.clientWidth + 2
          || pdfPage.scrollHeight > pdfPage.clientHeight + 2).length;
        const representativeImage = document.querySelector<HTMLElement>("[role='img']");
        return {
          clippingViolationCount,
          representativeImageVisible: Boolean(representativeImage
            && representativeImage.getBoundingClientRect().width > 0
            && representativeImage.getBoundingClientRect().height > 0
            && getComputedStyle(representativeImage).backgroundImage !== "none"),
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
      if (inspection.pageCount < 1
        || inspection.pageOrientations[0] !== "landscape"
        || inspection.pageOrientations.slice(1).some((orientation) => orientation !== "portrait")) {
        throw new Error("PDF_PAGE_ORIENTATION_INVALID");
      }
      const blankPageCount = inspection.pageTexts.filter((text) => text.length === 0).length;
      const extractedText = inspection.pageTexts.join("\n");

      return {
        pdf,
        fileSizeBytes: pdf.byteLength,
        contentSha256: sha256(pdf),
        pageCount: inspection.pageCount,
        pageOrientations: inspection.pageOrientations,
        rendererVersion: input.snapshot.rendererVersion,
        dtoSchemaVersion: input.snapshot.dtoSchemaVersion,
        provider: "local-chromium",
        renderDurationMs: Number((performance.now() - started).toFixed(2)),
        extractedText,
        pageTextLengths: inspection.pageTexts.map((text) => text.length),
        blankPageCount,
        clippingViolationCount: domEvidence.clippingViolationCount,
        consoleErrorCount: consoleErrors.length,
        failedRequestCount: failedRequests.length,
        representativeImageVisible: domEvidence.representativeImageVisible,
      };
    } finally {
      await browser.close();
    }
  }
}
