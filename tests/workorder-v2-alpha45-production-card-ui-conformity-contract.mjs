import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { assertCanonicalWaflVersionConsistency } from "./helpers/wafl-v2-current-version.mjs";
import { readMobileApiSource } from "./helpers/mobile-api-source.mjs";
import { resolveWorkOrderTabVisualState } from "../apps/mobile/features/work-orders/overview/workOrderDetailPresentation.ts";

const read = (relativePath) => fs.readFileSync(path.resolve(relativePath), "utf8");

assertCanonicalWaflVersionConsistency();
const detail = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const display = read("apps/mobile/lib/workOrderDisplay.ts");
const app = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const apiClient = readMobileApiSource();
const mock = read("apps/mobile/components/ProductionCardMock.tsx");
const externalQa = read("lib/external-qa/configCore.mjs");

assert.doesNotMatch(detail, /mockProductionCard|productionCards|summaryMetrics|costMetrics|overviewInfo|nextCheckByTab|constants\/mockProductionCard/);
assert.match(detail, /WorkOrderDetailCore/);
assert.match(detail, /testID="production-card-sheet"/);
assert.match(detail, /testID="production-card-sheet"[\s\S]*styles\.hero[\s\S]*styles\.tabRailFrame[\s\S]*styles\.overviewSection/);
assert.match(detail, /productionCardSheet: \{ backgroundColor: WAFL_THEME\.color\.paper[\s\S]*borderRadius: WAFL_THEME\.radius\.cardMajor/);
assert.match(detail, /hero: \{ flexDirection: "row"/);
assert.match(detail, /miniStat: \{ backgroundColor: "#f7f0e5"/);
assert.match(detail, /tabUnderlineSelected: \{ backgroundColor: "#17263d"/);
assert.match(detail, /WaflSectionCard/);

for (const removedPrimitive of ["primaryMetrics", "primaryMetric", "sectionGrid", "countItem", "totalLine"]) {
  assert.doesNotMatch(detail, new RegExp(`styles\\.${removedPrimitive}|${removedPrimitive}:`), `dashboard primitive remains: ${removedPrimitive}`);
}
assert.doesNotMatch(detail, /서버가 계산한 읽기 전용 결과입니다/);
assert.doesNotMatch(detail, /core detail에 포함된 실제 건수만 표시합니다/);
assert.doesNotMatch(detail, />\s*Entity version\s*</);
assert.doesNotMatch(detail, /value=\{detail\.revision\.status\}/);
assert.doesNotMatch(detail, /\?\?\s*status/);
assert.doesNotMatch(detail, /formatProductType\(header\.productTypeAlias, header\.productTypeCode\)/);
assert.doesNotMatch(detail, /formatRevisionStatus|formatDocumentStatus/);
assert.match(display, /"apparel\.onepiece_set": "원피스·세트"/);
assert.match(display, /finalized: "확정됨"/);
assert.match(display, /generated: "생성 완료"/);
assert.match(display, /제품 유형 확인 필요/);

for (const field of ["header.productName", "header.totalQuantity", "header.dueDate", "header.status", "detail.amounts.estimatedTotal", "header.readiness", "detail.tabCounts"]) {
  assert.match(detail, new RegExp(field.replaceAll(".", "\\.")), `actual field missing: ${field}`);
}
assert.doesNotMatch(detail, /Revision\s*R/);
assert.doesNotMatch(detail, /value=\{header\.id\}|<Text[^>]*>\{header\.id\}<\/Text>/, "the identifier may route a read component but must not be rendered");
assert.match(detail, /대표 이미지 없음/);
assert.match(detail, /WorkOrderImageGallery/);
assert.match(apiClient, /\/assets\?limit=50/);
assert.doesNotMatch(apiClient, /\/history/, "later work must not unlock history");
assert.match(apiClient, /export async function getWorkOrderProcesses[\s\S]*method: "GET"/);
assert.match(apiClient, /target\.method/);
assert.match(apiClient, /export async function deleteWorkOrderMaterial/);
assert.match(apiClient, /method: "DELETE"/);

for (const tab of ["개요", "이미지·첨부", "사이즈·색상", "원부자재", "제작", "문서"]) assert.match(detail, new RegExp(tab));
assert.equal(resolveWorkOrderTabVisualState({ selected: false, locked: true }), "locked");
assert.equal(resolveWorkOrderTabVisualState({ selected: true, locked: false }), "active");
assert.match(detail, /disabled=\{disabled\}/);
assert.match(detail, /setActiveSection/);
assert.doesNotMatch(detail, /setActiveTab|activeTab/);
assert.match(detail, /tab\.id === "materials"/);
assert.match(detail, /activeSection === "media"[\s\S]*WorkOrderImageGallery/);

assert.match(detail, /navigationBar:[^\n]+minHeight: 44/);
assert.doesNotMatch(detail, /navigationBar:[^\n]+position:/);
assert.match(detail, /scrollContent: \{ paddingBottom: 42 \}/);
assert.doesNotMatch(detail, /accessibilityRole="header"[^>]*numberOfLines/);
assert.match(detail, /heroText:[^\n]+flexGrow: 1[^\n]+flexShrink: 1[^\n]+minWidth: 0/);
assert.match(detail, /title:[^\n]+flexShrink: 1[^\n]+minWidth: 0/);
assert.match(detail, /useWindowDimensions/);
assert.match(detail, /width < 390/);
for (const removedSection of ["문서 요약", "구성 요약", "Revision 상태", "Revision 확정", "최종 수정", "문서 상태", "문서번호", "생성 시각"]) {
  assert.doesNotMatch(detail, new RegExp(removedSection), `overview must not contain ${removedSection}`);
}
assert.match(app, /numberOfLines=\{1\} style=\{styles\.context\}/);
assert.match(app, /width >= 768/);
assert.match(app, /styles\.split/);
assert.match(app, /onReturnToList=\{returnToList\}/);
assert.match(app, /detailRequestInFlight\.current/);
assert.doesNotMatch(app, /returnToList[\s\S]{0,500}getWorkOrderList\(/);
assert.doesNotMatch(app, /setInterval|polling/i);

assert.match(externalQa, /\[0-9a-f\]\{8\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{12\}/);
assert.doesNotMatch(externalQa, /\/api\/v2\/\*/);
assert.match(mock, /export default function ProductionCardMock/);
assert.match(mock, /mockProductionCard/);

console.log("workorder v2 alpha.45 ProductionCard UI conformity contract: PASS");
