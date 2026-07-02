#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");

const route = read("app/api/workorders/[workOrderId]/generated/workorder-pdf/route.ts");
const viewer = read("app/api/workorders/[workOrderId]/generated/workorder-pdf/[attachmentId]/view/route.ts");
const integration = read("scripts/run-pdf-r2-lifecycle-integration.mjs");
const pipeline = read("tools/pipeline/peacebypiece-auto-pipeline.ps1");
const verifySafe = read("tools/pipeline/verify-safe.ps1");

for (const token of [
  "verifyGeneratedPdfObject",
  "PDF_BINARY_EMPTY",
  "PDF_R2_HEAD_FAILED_",
  "PDF_R2_OBJECT_EMPTY",
  "await verifyGeneratedPdfObject({ storageKey, expectedSizeBytes: pdf.byteLength })",
  "await cleanupGeneratedPdfObject(storageKey)",
  "exposeStorageKey?: boolean",
  "storageKey: input.exposeStorageKey === true ? input.storageKey : \"\"",
  "exposeStorageKey: true",
]) {
  assert.ok(route.includes(token), `workorder PDF route missing durable completion token: ${token}`);
}

assert.match(route, /putGeneratedPdfObject[\s\S]*verifyGeneratedPdfObject[\s\S]*repository\.createAttachment/);
assert.doesNotMatch(route, /repository\.createAttachment[\s\S]*verifyGeneratedPdfObject/);
assert.doesNotMatch(route, /signedUrl|downloadUrl|message:\s*message/);

for (const token of [
  "createPdfDisposition",
  "mode: \"inline\" | \"attachment\"",
  "download\") === \"1\" ? \"attachment\" : \"inline\"",
  "Content-Disposition",
  "PDF 파일을 찾을 수 없습니다. 다시 만들어 주세요.",
]) {
  assert.ok(viewer.includes(token), `workorder PDF viewer missing safe view/download token: ${token}`);
}
assert.doesNotMatch(viewer, /NextResponse\.redirect|signedUrl|downloadUrl|storageKey:\s*file\.storage_key|console\.error/);

for (const token of [
  "incompletePdfBinary",
  "incompletePdfR2Put",
  "incompletePdfR2Head",
  "incompleteDownload",
  "finalPdfBinary",
  "finalPdfR2Put",
  "finalPdfR2Head",
  "finalDownload",
  "orderRequestTypeIsolation",
  "previousFinalPreservation",
  "documentTypeIsolation",
  "verifyPdfObject",
  "workorder_incomplete_pdf",
  "workorder_final_pdf",
  "order_request_pdf",
  "residualDbRows",
  "residualR2Objects",
]) {
  assert.ok(integration.includes(token), `PDF/R2 integration missing ${token}`);
}
assert.doesNotMatch(integration, /prefix delete|bucket-wide|ListObjectsV2|DROP TABLE|TRUNCATE/i);

assert.match(pipeline, /78\. Workorder PDF Live R2 Integration Verification/);
assert.match(pipeline, /RunWorkorderPdfLiveIntegrationVerification/);
assert.match(pipeline, /AddWorkorderPdfLiveIntegrationRepoStateSections/);
assert.match(verifySafe, /workorder-pdf-live-integration/);

console.log("workorder PDF live integration contract: PASS");
