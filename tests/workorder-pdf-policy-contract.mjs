#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const policy = fs.readFileSync("lib/workorder/pdf/workOrderPdfPolicy.ts", "utf8");
const generatedDocuments = fs.readFileSync("lib/workorder/generatedDocuments.ts", "utf8");
const route = fs.readFileSync("app/api/workorders/[workOrderId]/generated/order-request-pdf/route.ts", "utf8");
const r2Keys = fs.readFileSync("lib/storage/r2/r2Keys.ts", "utf8");
const integration = fs.readFileSync("scripts/run-pdf-r2-lifecycle-integration.mjs", "utf8");
const fixtureGenerator = fs.readFileSync("scripts/generate-pdf-r2-fixtures.mjs", "utf8");
const reconciliation = fs.readFileSync("scripts/run-pdf-r2-reconciliation-dry-run.mjs", "utf8");
const cleanupPlan = fs.readFileSync("scripts/run-pdf-r2-exact-cleanup-plan.mjs", "utf8");

assert.match(policy, /WORK_ORDER_PDF_DOCUMENT_TYPES/);
assert.match(policy, /internal/);
assert.match(policy, /vendor_share/);
assert.match(policy, /kakao_share/);
assert.match(policy, /costs/);
assert.match(policy, /vendor_share:[\s\S]*?generatedAt/);
assert.doesNotMatch(policy.match(/vendor_share:[\s\S]*?],/)?.[0] ?? "", /costs/);
assert.doesNotMatch(policy.match(/kakao_share:[\s\S]*?],/)?.[0] ?? "", /costs/);
assert.match(policy, /companies\/\$\{companyId\}\/workorders\/\$\{workOrderId\}\/pdf\/\$\{pdfId\}\.pdf/);
assert.match(policy, /WORK_ORDER_PDF_DUE_DATE_REQUIRED/);

assert.match(generatedDocuments, /createWorkOrderPdfStorageKey/);
assert.doesNotMatch(generatedDocuments, /\/attachments\/\$\{fileId\}\.pdf/);

assert.match(r2Keys, /WORK_ORDER_PDF_KEY_PATTERN/);
assert.match(r2Keys, /directory: "design" \| "attachments" \| "pdf" \| "generated\/order-request"/);

assert.match(route, /validateWorkOrderPdfDueDate/);
assert.match(route, /WORK_ORDER_PDF_DOCUMENT_TYPES\.vendorShare/);
assert.match(route, /deleteR2ObjectViaWorker/);
assert.match(route, /deleteR2Object\(/);
assert.match(route, /REGISTER_CLEANUP_PENDING/);
assert.doesNotMatch(route, /message:\s*toErrorMessage/);

assert.match(integration, /WAFL_PDF_R2_LIFECYCLE_INTEGRATION_APPROVED/);
assert.match(integration, /RUN_PDF_R2_LIFECYCLE_DEV_TEST/);
assert.match(integration, /EXPECTED_WORKER_VERSION = "0\.13\.71"/);
assert.match(integration, /pdfUpload/);
assert.match(integration, /trash/);
assert.match(integration, /restore/);
assert.match(integration, /regeneration/);
assert.match(integration, /permanentDelete/);
assert.match(integration, /missingDetection/);
assert.match(integration, /orphanDetection/);
assert.match(integration, /uploadDbFailureCleanup/);
assert.match(integration, /residualDbRows/);
assert.match(integration, /residualR2Objects/);
assert.doesNotMatch(integration, /APPROVAL_REQUIRED";\nconsole\.log\("Reason: dev\/test DB\/R2 integration requires explicit approval env and confirmation\."\);\nconsole\.log\("Residual DB Rows: NOT_RUN"/);

assert.match(fixtureGenerator, /valid-1mb\.pdf/);
assert.match(fixtureGenerator, /valid-5mb\.pdf/);
assert.match(fixtureGenerator, /valid-10mb\.pdf/);
assert.match(fixtureGenerator, /invalid-over-10mb\.pdf/);
assert.match(reconciliation, /Manifest:/);
assert.match(reconciliation, /NO_MANIFEST/);
assert.match(cleanupPlan, /wouldDeleteR2ExactKeys/);
assert.match(cleanupPlan, /prefix delete and bucket-wide cleanup are forbidden/);

console.log("workorder PDF policy contract passed");
