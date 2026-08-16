import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const workbench = read("apps/mobile/features/work-orders/documents/WorkOrderDocumentWorkbench.tsx");
const quickUi = read("apps/mobile/features/work-orders/documents/QuickDeliveryFoundation.tsx");
const quickPolicy = read("apps/mobile/features/work-orders/documents/quickDeliveryPolicy.ts");
const viewer = read("app/v/DocumentViewerClient.tsx");
const route = read("lib/generated-documents/document-access/routeHelpers.ts");
const repository = read("lib/generated-documents/document-access/repository.ts");
const service = read("lib/generated-documents/document-access/service.ts");
const migrationInventory = fs.readdirSync(path.join(root, "db/v2/migrations"));
const fixture = read("scripts/prepare-wafl-v2-alpha64-document-attachments-owner-fixture.mjs");

for (const copy of ["생성 전 확인", "작업지시서를 생성할까요?", "생산 구분 · 미지정", "사이즈·색상별 수량", "전달 첨부"]) {
  assert.match(workbench, new RegExp(copy), `workbench copy:${copy}`);
}
assert.match(workbench, /if \(!detail\.header\.readiness\.canIssue\)[\s\S]*hardBlockers[\s\S]*return;/);
assert.match(workbench, /<CompactAction disabled=\{busy\} emphasis="primary" icon=\{FileText\} label="작업지시서 생성"/);
assert.doesNotMatch(workbench, /disabled=\{busy \|\| !detail\.header\.readiness\.canIssue\}/);
assert.match(workbench, /documentQuantityDisclosureRows/);
assert.match(workbench, /DOCUMENT_QUANTITY_INLINE_LIMIT/);
assert.match(workbench, /전체보기 \{quantityRows\.length\}개/);

assert.match(workbench, /const selectedAttachments = useMemo\(\(\) => attachments\.filter/);
assert.match(workbench, /const changed = attachments\.filter/);
assert.doesNotMatch(workbench, /const changed = supportedAttachments\.filter/);
assert.match(workbench, /PDF 본문 이미지 · 전달 첨부/);
assert.match(workbench, /선택한 모든 파일은 공유 Viewer의 전달 첨부/);

for (const token of ["status === \"requested\"", "line.partnerId", "orderQuantity", "unitCode", "Map<string, QuickDeliveryGroup>"]) {
  assert.match(quickPolicy, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `quick policy:${token}`);
}
assert.match(quickPolicy, /QUICK_DELIVERY_PERSISTENCE_DEFERRED/);
for (const copy of ["퀵 전달할 발주 항목이 없습니다.", "출발지", "도착지", "최근 이용 기사 없음", "퀵 전달 요청 미리보기", "미리보기만 제공됩니다"]) {
  assert.match(quickUi, new RegExp(copy), `quick UI:${copy}`);
}
assert.match(quickUi, /MaterialPartnerPickerSheet/);
assert.match(quickUi, /quickDeliveryFactoryOptions/);
assert.match(quickUi, /MaterialPartnerPickerSheet allowUnset[\s\S]*onSwitchToDirectInput=\{openDirectEditor\}/);
assert.match(quickUi, /presentQuickDeliveryLocation/);
assert.doesNotMatch(quickUi, /allowDirectInput|onDirectInput|WAFL_DIRECT_PARTNER_INPUT_VALUE/);
assert.doesNotMatch(quickUi, /fetch\(|requestJson|POST|PATCH|DELETE|PDF/);

assert.match(repository, /snapshot[\s\S]*assetManifest/);
assert.match(repository, /assetType !== "attachment" \|\| row\.includeInDocument !== true/);
assert.match(route, /createDocumentViewerAttachmentRef/);
assert.match(route, /handlePublicDocumentAttachment/);
assert.match(route, /inlineSafe[\s\S]*application\/pdf/);
assert.match(service, /readPublicDocumentAttachment/);
assert.match(service, /body\.byteLength !== input\.sizeBytes/);
assert.match(service, /sha256[\s\S]*input\.contentSha256/);
assert.match(viewer, /전달 첨부/);
assert.match(viewer, /metadata\.attachments\.map/);
assert.match(viewer, /attachment\.inlineUrl[\s\S]*attachment\.downloadUrl/);

const migration017Name = migrationInventory.find((name) => /^017_/.test(name));
if (migration017Name) {
  const migration017 = read(`db/v2/migrations/${migration017Name}`);
  assert.match(migration017, /spec_item/u, "migration 017 may be owned only by the later Spec Item catalog delta");
  assert.doesNotMatch(migration017, /quick.?delivery|delivery_address|address_search|generated_documents/iu, "Quick Delivery must remain local-only and migration-free");
}
for (const token of ["QA A64 작업지시서 R0 문서UI2 ", "application/pdf", "status === \"requested\"", "OLD_OWNER_FIXTURE_MUTATED", "generatedDocuments: generated", "factoryOptionCount"]) {
  assert.match(fixture, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `fixture:${token}`);
}
assert.match(fixture, /assert\.equal\(generated, 0\)/);
assert.match(fixture, /await oldOwnerAudit\(client\)[\s\S]*assert\.deepEqual\(after, baseline/);
for (const source of [workbench, quickUi, quickPolicy, viewer]) assert.doesNotMatch(source, /ProductionCardMock|mockProductionCard|quickDeliveryRequests/);

console.log("workorder-v2-alpha64-document-attachments-quick-delivery-contract: PASS");
