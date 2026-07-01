#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");

const quotaRepository = read("lib/billing/companyStorageQuotaRepository.ts");
const uploadRoute = read("app/api/workorders/attachments/upload/route.ts");
const completeRoute = read("app/api/workorders/attachments/upload/complete/route.ts");
const pdfRoute = read("app/api/workorders/[workOrderId]/generated/order-request-pdf/route.ts");
const companyFileUploadRoute = read("app/api/admin/company-files/upload/route.ts");
const companyFileMetadataRoute = read("app/api/admin/company-files/route.ts");

for (const token of [
  "checkCompanyUploadStorageQuota",
  "getCurrentCompanySubscription",
  "evaluateStorageQuotaForUpload",
  "replaceableBytes",
]) {
  assert.ok(quotaRepository.includes(token), `quota repository missing ${token}`);
}

for (const [label, source] of [
  ["workorder attachment upload request", uploadRoute],
  ["workorder attachment upload complete", completeRoute],
  ["generated PDF storage", pdfRoute],
]) {
  assert.ok(source.includes("checkCompanyUploadStorageQuota"), `${label} must use company quota preflight`);
  assert.ok(source.includes("STORAGE_QUOTA_UPLOAD_ERROR_CODES"), `${label} must use shared quota error codes`);
  assert.ok(source.includes("STORAGE_QUOTA_UPLOAD_ERROR_CODES.exceeded"), `${label} must return safe exceeded code`);
  assert.ok(source.includes("status: 409"), `${label} must block over-quota growth with conflict`);
  assert.ok(source.includes("incomingSizeBytes"), `${label} must calculate incoming growth bytes`);
}

assert.ok(
  pdfRoute.indexOf("checkCompanyUploadStorageQuota") < pdfRoute.lastIndexOf("putR2Object("),
  "generated PDF quota check must run before R2 PUT",
);

assert.ok(companyFileUploadRoute.includes("checkCompanyFileUploadStorageQuota"), "company file upload preflight must remain guarded");
assert.ok(companyFileMetadataRoute.includes("checkCompanyFileUploadStorageQuota"), "company file metadata save must remain guarded");

for (const source of [uploadRoute, completeRoute, pdfRoute]) {
  assert.ok(!source.includes("DATABASE_URL"), "routes must not expose DB URL");
  assert.ok(!source.includes("signedUrl"), "routes must not expose signed URL for quota errors");
}

console.log("storage quota upload guard contract passed");
