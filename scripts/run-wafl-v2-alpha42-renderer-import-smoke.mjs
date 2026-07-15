#!/usr/bin/env node
import assert from "node:assert/strict";

import {
  LocalChromiumIssuedWorkOrderPdfRenderer,
  PdfPageOrientationValidationError,
} from "../lib/generated-documents/work-order-pdf/localChromiumRenderer.mts";
import {
  classifyPdfPageOrientation,
  inspectPdfPageOrientations,
  validatePdfPageOrientations,
} from "../lib/generated-documents/work-order-pdf/pdfPageOrientation.mjs";
import {
  getLocalIssuedPdfRenderInputPath,
  readLocalIssuedPdfRenderInput,
  writeLocalIssuedPdfRenderInput,
} from "../lib/generated-documents/work-order-pdf/localRenderInputCore.mjs";

assert.equal(typeof LocalChromiumIssuedWorkOrderPdfRenderer, "function");
assert.equal(typeof PdfPageOrientationValidationError, "function");
assert.equal(typeof classifyPdfPageOrientation, "function");
assert.equal(typeof inspectPdfPageOrientations, "function");
assert.equal(typeof validatePdfPageOrientations, "function");
assert.equal(typeof getLocalIssuedPdfRenderInputPath, "function");
assert.equal(typeof readLocalIssuedPdfRenderInput, "function");
assert.equal(typeof writeLocalIssuedPdfRenderInput, "function");

const error = new PdfPageOrientationValidationError(Buffer.from("%PDF-"), {
  pdfSha256: "0".repeat(64),
  fileSizeBytes: 5,
  pageCount: 1,
  actualOrientations: ["portrait"],
  expectedOrientations: ["landscape"],
  pages: [],
  firstMismatchPageIndex: 0,
  mismatchReason: "expected-landscape-actual-portrait",
});
assert.equal(error.name, "PdfPageOrientationValidationError");
assert.equal(error.code, "PDF_PAGE_ORIENTATION_INVALID");
assert.equal(error.pdf.byteLength, 5);
assert.equal(error.evidence.firstMismatchPageIndex, 0);
assert.match(error.stack ?? "", /PdfPageOrientationValidationError/);

console.log(JSON.stringify({
  result: "ALPHA42_RENDERER_IMPORT_SMOKE_PASS",
  node: process.versions.node,
  rendererImport: true,
  inspectorImport: true,
  errorClassImport: true,
  localRenderInputCoreImport: true,
  dbQuery: 0,
  r2Request: 0,
  nextServerStart: 0,
  chromiumStart: 0,
  mutation: false,
}));
