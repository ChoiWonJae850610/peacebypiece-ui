#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");

const route = read("app/api/workorders/[workOrderId]/generated/workorder-pdf/route.ts");
const viewer = read("app/api/workorders/[workOrderId]/generated/workorder-pdf/[attachmentId]/view/route.ts");
const names = read("lib/workorder/generatedDocuments.ts");

for (const token of [
  "readRequestedPdfKind",
  "\"auto\"",
  "missingItems.length > 0 ? \"incomplete\" : \"final\"",
  "documentKind: kind",
  "WORKORDER_FINAL_PDF_NOT_READY",
  "retirePreviousFinalPdf",
  "cleanupGeneratedPdfObject",
]) {
  assert.ok(route.includes(token), `workorder PDF route missing ${token}`);
}

assert.doesNotMatch(route, /signedUrl|downloadUrl|createR2WorkerFileUrl|message:\s*message/);

for (const token of [
  "pdfErrorPage",
  "PDF 파일을 찾을 수 없습니다. 다시 만들어 주세요.",
  "text/html; charset=utf-8",
  "no-store",
  "nosniff",
  "inline;",
]) {
  assert.ok(viewer.includes(token), `workorder PDF viewer missing ${token}`);
}
assert.doesNotMatch(viewer, /jsonError\("PDF_OBJECT_MISSING"|NextResponse\.redirect|signedUrl|downloadUrl|console\.error/);

for (const token of [
  "createWorkorderPdfDisplayName",
  "작업지시서",
  "제출용",
  "미완성",
  "join(\"\") + \"_\"",
]) {
  assert.ok(names.includes(token), `workorder PDF filename policy missing ${token}`);
}
assert.doesNotMatch(names, /workorder-final|workorder-incomplete/);

console.log("workorder PDF auto output contract: PASS");
