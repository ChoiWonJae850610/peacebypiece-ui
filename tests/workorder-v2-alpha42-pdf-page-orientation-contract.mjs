import assert from "node:assert/strict";
import fs from "node:fs";

import {
  classifyPdfPageOrientation,
  inspectPdfPageOrientations,
  validatePdfPageOrientations,
} from "../lib/generated-documents/work-order-pdf/pdfPageOrientation.mjs";

function fixture(pages) {
  const pageObjects = pages.map((page, index) => {
    const box = page.mediaBox ?? "[0 0 595 842]";
    const crop = page.cropBox ? ` /CropBox ${page.cropBox}` : "";
    const trim = page.trimBox ? ` /TrimBox ${page.trimBox}` : "";
    const rotate = page.rotate === undefined ? "" : ` /Rotate ${page.rotate}`;
    return `${index + 3} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox ${box}${crop}${trim}${rotate} >>\nendobj`;
  });
  const kids = pages.map((_, index) => `${index + 3} 0 R`).join(" ");
  return Buffer.from([
    "%PDF-1.7",
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj",
    `2 0 obj\n<< /Type /Pages /Count ${pages.length} /Kids [${kids}] >>\nendobj`,
    ...pageObjects,
    "%%EOF",
  ].join("\n"), "latin1");
}

const standard = inspectPdfPageOrientations(fixture([
  { mediaBox: "[0 0 842 595]" },
  { mediaBox: "[0 0 595 842]" },
]));
assert.deepEqual(standard.map((page) => page.classifiedOrientation), ["landscape", "portrait"]);
assert.equal(validatePdfPageOrientations(standard).valid, true);

const rotatedPortrait = inspectPdfPageOrientations(fixture([{ mediaBox: "[0 0 595 842]", rotate: 90 }]));
assert.equal(rotatedPortrait[0].classifiedOrientation, "landscape");
const rotatedLandscape = inspectPdfPageOrientations(fixture([{ mediaBox: "[0 0 842 595]", rotate: 90 }]));
assert.equal(rotatedLandscape[0].classifiedOrientation, "portrait");

const cropPreferred = inspectPdfPageOrientations(fixture([{
  mediaBox: "[0 0 842 595]",
  cropBox: "[0 0 500 700]",
  trimBox: "[5 5 495 695]",
}]));
assert.equal(cropPreferred[0].effectiveBoxSource, "cropBox");
assert.equal(cropPreferred[0].classifiedOrientation, "portrait");
assert.equal(cropPreferred[0].trimBox?.width, 490);

assert.equal(classifyPdfPageOrientation(841.91998, 594.95996), "landscape");
assert.equal(classifyPdfPageOrientation(594.95996, 841.91998), "portrait");
assert.equal(classifyPdfPageOrientation(600, 599), "square-or-unknown");
assert.throws(() => classifyPdfPageOrientation(0, 842), /PDF_PAGE_DIMENSIONS_INVALID/);
assert.throws(() => inspectPdfPageOrientations(fixture([{ rotate: 45 }])), /PDF_PAGE_ROTATE_INVALID/);
assert.throws(() => inspectPdfPageOrientations(fixture([{ mediaBox: "[0 0 0 842]" }])), /PDF_MEDIA_BOX_INVALID/);
assert.throws(() => inspectPdfPageOrientations(fixture([])), /PDF_PAGE_COUNT_INVALID|PDF_PAGE_TREE_INVALID/);

const wrongFirst = inspectPdfPageOrientations(fixture([{ mediaBox: "[0 0 595 842]" }]));
assert.deepEqual(validatePdfPageOrientations(wrongFirst), {
  valid: false,
  firstMismatchPageIndex: 0,
  mismatchReason: "expected-landscape-actual-portrait",
});
const wrongContinuation = inspectPdfPageOrientations(fixture([
  { mediaBox: "[0 0 842 595]" },
  { mediaBox: "[0 0 842 595]" },
]));
assert.equal(validatePdfPageOrientations(wrongContinuation).firstMismatchPageIndex, 1);
assert.equal(validatePdfPageOrientations([]).mismatchReason, "page-count-zero");

const rendererSource = fs.readFileSync("lib/generated-documents/work-order-pdf/localChromiumRenderer.mts", "utf8");
const smokeSource = fs.readFileSync("scripts/run-wafl-v2-alpha42-renderer-import-smoke.mjs", "utf8");
assert.match(rendererSource, /inspectPdfPageOrientations\(pdf\)/);
assert.match(rendererSource, /pdfSha256: sha256\(pdf\)/);
assert.match(rendererSource, /fileSizeBytes: pdf\.byteLength/);
assert.match(rendererSource, /firstMismatchPageIndex/);
assert.match(rendererSource, /new PdfPageOrientationValidationError\(pdf/);
assert.match(rendererSource, /readonly pdf: Buffer;/);
assert.match(rendererSource, /readonly evidence: PdfOrientationFailureEvidence;/);
assert.match(rendererSource, /this\.pdf = pdf;/);
assert.match(rendererSource, /this\.evidence = evidence;/);
assert.doesNotMatch(rendererSource, /constructor\([\s\S]{0,180}?\b(?:public|private|protected|readonly)\s+[A-Za-z_$]/);
assert.ok(rendererSource.indexOf("const inspection = await inspectPdf(pdf)") < rendererSource.indexOf("throw new PdfPageOrientationValidationError"));
assert.match(smokeSource, /localChromiumRenderer\.mts/);
assert.match(smokeSource, /pdfPageOrientation\.mjs/);
assert.match(smokeSource, /localRenderInputCore\.mjs/);
assert.match(smokeSource, /dbQuery: 0/);
assert.match(smokeSource, /r2Request: 0/);
assert.match(smokeSource, /nextServerStart: 0/);
assert.match(smokeSource, /chromiumStart: 0/);

const css = fs.readFileSync("components/workorder/preview/IssuedWorkOrderPreview.module.css", "utf8");
assert.match(css, /@page cover \{ size: A4 landscape; margin: 0; \}/);
assert.match(css, /@page content \{ size: A4 portrait; margin: 0; \}/);
assert.match(css, /\.coverPage \{ page: cover;/);
assert.match(css, /\.contentPage \{ page: content;/);
assert.doesNotMatch(rendererSource, /landscape:\s*true/);
assert.doesNotMatch(rendererSource, /format:\s*["']A4["']/);
assert.match(rendererSource, /preferCSSPageSize: input\.options\.preferCssPageSize/);

console.log("workorder v2 alpha.42 PDF page orientation contract: PASS");
