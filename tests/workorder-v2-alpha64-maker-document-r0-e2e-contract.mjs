import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { isExternalQaPathAllowed, isTailscaleServePathAllowed } from "../lib/external-qa/configCore.mjs";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const env = {
  WAFL_SERVER_RUNTIME_MODE: "dev",
  WAFL_EXTERNAL_QA_ALPHA64_DOCUMENT_R0_MUTATION_ENABLED: "true",
  WAFL_V2_COMMAND_API_ENABLED: "1",
  WAFL_V2_COMMAND_MUTATION_APPROVED: "2.0.0-alpha.64-dev-test-maker-document-r0-runtime",
  WAFL_V2_DOCUMENT_VIEWER_ENABLED: "1",
  WAFL_V2_DOCUMENT_VIEWER_MUTATION_APPROVED: "2.0.0-alpha.64-dev-test-maker-document-r0-runtime",
};

const readiness = read("lib/domain/work-orders/issueReadiness.ts");
const issue = read("lib/domain/work-orders/command/issueRepository.ts");
const detail = read("lib/domain/work-orders/read/detailRepository.ts");
for (const code of ["PRODUCT_NAME_REQUIRED", "PRODUCT_TYPE_REQUIRED", "SEASON_REQUIRED", "ITEM_REQUIRED", "DUE_DATE_REQUIRED", "TOTAL_QUANTITY_REQUIRED", "QUANTITY_TOTAL_MISMATCH", "COMPANY_DOCUMENT_CODE_REQUIRED", "REPRESENTATIVE_IMAGE_REQUIRED", "MATERIAL_MISSING_WARNING", "ACCESSORY_MISSING_WARNING"]) assert.match(readiness, new RegExp(code));
assert.match(issue, /evaluateWorkOrderIssueReadiness/);
assert.match(detail, /evaluateWorkOrderIssueReadiness/);

const migration = read("db/v2/migrations/016_v2_r0_document_snapshot_and_managed_qr.sql");
assert.match(migration, /ADD COLUMN supplier_name_snapshot text/);
assert.match(migration, /ALTER COLUMN expires_at DROP NOT NULL/);
assert.match(migration, /token_purpose = 'manual_share' AND expires_at IS NOT NULL/);
assert.match(migration, /token\.expires_at IS NULL OR token\.expires_at > pg_catalog\.now\(\)/);
assert.doesNotMatch(migration.replace(/^\s*--.*$/gm, ""), /\b(?:DROP TABLE|TRUNCATE|DELETE FROM)\b/i);
assert.match(issue, /SELECT material\.id AS material_id, partner\.name AS supplier_name/);
assert.match(issue, /SET supplier_name_snapshot = snapshot\.supplier_name/);
assert.match(issue, /SET LOCAL ROLE wafl_v2_tenant_runtime/);
assert.match(read("lib/domain/work-orders/read/previewRepository.ts"), /partnerName: text\(m\.supplier_name_snapshot\)/);

const generation = read("lib/generated-documents/work-order-pdf/generationService.ts");
for (const token of ["status='generated'", "status='failed'", "R2WorkerGeneratedDocumentObjectStore", "LocalChromiumIssuedWorkOrderPdfRenderer", "includedAttachmentImages", "PDF_R2_VALIDATION_FAILED"]) assert.match(generation, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
assert.doesNotMatch(generation, /createEmbeddedQrAccessToken|embeddedQrPolicy|embeddedQrContext/u);
assert.match(generation, /status='generated'.*CONFLICT/s);
assert.doesNotMatch(generation, /deletePdf\(/);

const document = read("components/workorder/preview/IssuedWorkOrderDocument.tsx");
assert.match(document, /partnerName/);
assert.match(document, /includedAttachmentImages/);
assert.doesNotMatch(document, /row\.(?:unitPrice|amount|inventoryUsageQuantity|status)/);

const mobile = read("apps/mobile/features/work-orders/documents/WorkOrderDocumentWorkbench.tsx");
for (const token of ["issueWorkOrderR0", "generateWorkOrderR0", "createDocumentShare", "revokeDocumentAccessToken", "setAttachmentOutputInclude", "보기", "저장", "공유"]) assert.match(mobile, new RegExp(token));
assert.match(mobile, /createDocumentShare\(generated\.id, 3,/);
assert.doesNotMatch(mobile, />PDF QR<|title="PDF QR"/u);
assert.match(read("apps/mobile/lib/api/documentsApi.ts"), /output-include/);
assert.doesNotMatch(mobile, /ProductionCardMock/);
assert.match(read("apps/mobile/lib/apiClient.ts"), /documentsApi/);
assert.match(read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx"), /WorkOrderDocumentWorkbench/);

const runtimeRunner = read("scripts/run-wafl-v2-alpha64-document-r0-e2e.mjs");
assert.match(runtimeRunner, /resumedCompletedFixture = automatedRow\.status === "issued"/);
assert.match(runtimeRunner, /RESUMED_EMBEDDED_QR_NOT_REVOKED/);
assert.match(runtimeRunner, /RESUMED_MANUAL_SHARE_NOT_REVOKED/);
assert.match(runtimeRunner, /currentMakerProfileGenerationReplay: "PASS"/);
assert.match(runtimeRunner, /OWNER_ATTACHMENT_INCLUDE_STATE_INVALID/);
assert.doesNotMatch(runtimeRunner, /ownerAttachment\.includeInDocument, false/);
assert.doesNotMatch(runtimeRunner, /if \(resumedCompletedFixture\)[\s\S]*?revokeDocumentAccessToken/);

const uuid = "10000000-0000-4000-8000-000000000001";
for (const [route, method] of [
  [`/api/v2/work-orders/${uuid}/documents`, "GET"],
  [`/api/v2/work-orders/${uuid}/documents/generate`, "POST"],
  [`/api/v2/work-orders/${uuid}/revisions/issue`, "POST"],
  [`/api/v2/work-orders/${uuid}/attachments/${uuid}/output-include`, "PATCH"],
  [`/api/v2/work-orders/documents/${uuid}/access-tokens`, "POST"],
  [`/api/v2/work-orders/documents/${uuid}/access-tokens/${uuid}/revoke`, "POST"],
  [`/api/v2/work-orders/documents/${uuid}/file`, "GET"],
  ["/api/public/document-viewer/session", "POST"],
  ["/api/public/document-viewer/attachment", "GET"],
]) {
  assert.equal(isTailscaleServePathAllowed(route, method, env), true, `tailscale-route:${method}:${route}`);
}
assert.equal(isTailscaleServePathAllowed(`/api/v2/work-orders/${uuid}/documents/generate`, "POST", { ...env, WAFL_SERVER_RUNTIME_MODE: "production" }), false);
assert.equal(isExternalQaPathAllowed(`/api/v2/work-orders/${uuid}/documents/generate`, "POST", env), true);

console.log("workorder-v2-alpha64-maker-document-r0-e2e-contract: PASS");
