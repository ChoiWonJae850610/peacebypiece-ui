#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const generatedDocuments = fs.readFileSync("lib/workorder/generatedDocuments.ts", "utf8");
const attachmentTypes = fs.readFileSync("lib/workorder/persistence/attachmentTypes.ts", "utf8");
const route = fs.readFileSync("app/api/workorders/[workOrderId]/generated/workorder-pdf/route.ts", "utf8");
const viewer = fs.readFileSync("app/api/workorders/[workOrderId]/generated/workorder-pdf/[attachmentId]/view/route.ts", "utf8");
const builder = fs.readFileSync("lib/workorder/serverWorkorderPdf.ts", "utf8");

for (const token of ["workorder_incomplete_pdf", "workorder_final_pdf"]) {
  assert.match(generatedDocuments, new RegExp(token), `generatedDocuments missing ${token}`);
  assert.match(attachmentTypes, new RegExp(token), `attachmentTypes missing ${token}`);
}
assert.match(viewer, /GENERATED_DOCUMENT_TYPE\.workorderIncompletePdf/);
assert.match(viewer, /GENERATED_DOCUMENT_TYPE\.workorderFinalPdf/);

assert.match(route, /readRequestedPdfKind/);
assert.match(route, /kind === "final"/);
assert.match(route, /WORKORDER_FINAL_PDF_NOT_READY/);
assert.match(route, /getWorkOrderSizeSpec/);
assert.match(route, /checkCompanyUploadStorageQuota/);
assert.match(route, /createGeneratedWorkorderPdfStorageKey/);
assert.match(route, /renderPdfWithExternalGenerator/);
assert.match(route, /buildWorkorderFallbackPdf/);
assert.match(route, /retirePreviousFinalPdf/);
assert.match(route, /softDeleteAttachment/);
assert.match(route, /cleanupGeneratedPdfObject/);
assert.match(route, /REGISTER_CLEANUP_PENDING/);
assert.match(route, /verifyGeneratedPdfObject/);
assert.match(route, /PDF_BINARY_EMPTY/);
assert.match(route, /PDF_R2_HEAD_FAILED_/);
assert.match(route, /createR2WorkerFileUrl/);
assert.doesNotMatch(route, /signedUrl|downloadUrl|message:\s*message/);

assert.match(viewer, /getCurrentWaflSession/);
assert.match(viewer, /createCompanyApiAccessBlockedResponse/);
assert.match(viewer, /company_id = \$3/);
assert.match(viewer, /source_type = 'system'/);
assert.match(viewer, /generated_document_type IN/);
assert.match(viewer, /Content-Disposition/);
assert.match(viewer, /mode: "inline" \| "attachment"/);
assert.match(viewer, /searchParams\.get\("download"\) === "1" \? "attachment" : "inline"/);
assert.match(viewer, /Cache-Control": "no-store"/);
assert.match(viewer, /X-Content-Type-Options": "nosniff"/);
assert.doesNotMatch(viewer, /NextResponse\.redirect|signedUrl|downloadUrl|storageKey:\s*file\.storage_key|console\.error/);

assert.match(builder, /INCOMPLETE/);
assert.match(builder, /FINAL/);
assert.match(builder, /누락 항목/);
assert.match(builder, /Size specification/);
assert.match(builder, /supplier order-request PDF와 분리/);
assert.match(builder, /page-break-inside: avoid/);

console.log("workorder incomplete/final PDF contract: PASS");
