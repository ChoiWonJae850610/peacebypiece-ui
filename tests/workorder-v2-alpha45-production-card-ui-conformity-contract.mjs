import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const read = (relativePath) => fs.readFileSync(path.resolve(relativePath), "utf8");

const version = read("lib/constants/version.ts");
const detail = read("apps/mobile/components/WorkOrderDetailOverview.tsx");
const display = read("apps/mobile/lib/workOrderDisplay.ts");
const app = read("apps/mobile/components/MobileWorkOrderApp.tsx");
const apiClient = read("apps/mobile/lib/apiClient.ts");
const mock = read("apps/mobile/components/ProductionCardMock.tsx");
const externalQa = read("lib/external-qa/configCore.mjs");

assert.match(version, /APP_VERSION = "2\.0\.0-alpha\.49"/);
assert.doesNotMatch(detail, /mockProductionCard|productionCards|summaryMetrics|costMetrics|overviewInfo|nextCheckByTab|constants\/mockProductionCard/);
assert.match(detail, /WorkOrderDetailCore/);
assert.match(detail, /testID="production-card-sheet"/);
assert.match(detail, /testID="production-card-sheet"[\s\S]*styles\.hero[\s\S]*styles\.tabRailFrame[\s\S]*styles\.overviewSection/);
assert.match(detail, /productionCardSheet: \{ backgroundColor: "#fffdf8"[\s\S]*borderRadius: 14/);
assert.match(detail, /hero: \{ flexDirection: "row"/);
assert.match(detail, /miniStat: \{ backgroundColor: "#f7f0e5"/);
assert.match(detail, /tabUnderlineSelected: \{ backgroundColor: "#17263d"/);
assert.match(detail, /sectionBlock: \{ borderTopColor: "#eee3d5", borderTopWidth: 1/);

for (const removedPrimitive of ["primaryMetrics", "primaryMetric", "sectionGrid", "countItem", "totalLine"]) {
  assert.doesNotMatch(detail, new RegExp(`styles\\.${removedPrimitive}|${removedPrimitive}:`), `dashboard primitive remains: ${removedPrimitive}`);
}
assert.doesNotMatch(detail, /서버가 계산한 읽기 전용 결과입니다/);
assert.doesNotMatch(detail, /core detail에 포함된 실제 건수만 표시합니다/);
assert.doesNotMatch(detail, />\s*Entity version\s*</);
assert.doesNotMatch(detail, /value=\{detail\.revision\.status\}/);
assert.doesNotMatch(detail, /\?\?\s*status/);
assert.match(detail, /formatProductType\(header\.productTypeAlias, header\.productTypeCode\)/);
assert.doesNotMatch(detail, /formatRevisionStatus|formatDocumentStatus/);
assert.match(display, /"apparel\.onepiece_set": "원피스·세트"/);
assert.match(display, /finalized: "확정됨"/);
assert.match(display, /generated: "생성 완료"/);
assert.match(display, /제품 유형 확인 필요/);

for (const field of ["header.productName", "header.totalQuantity", "header.dueDate", "header.status", "header.currentRevisionNumber", "detail.amounts.estimatedTotal", "header.readiness", "detail.tabCounts"]) {
  assert.match(detail, new RegExp(field.replaceAll(".", "\\.")), `actual field missing: ${field}`);
}
assert.doesNotMatch(detail, /header\.id/);
assert.match(detail, /대표 이미지 준비 중/);
assert.doesNotMatch(detail, /<Image\b|Image\s*from\s*["']react-native/);
assert.doesNotMatch(apiClient, /\/processes|\/assets|\/documents|\/history|\/size-color|\/size-spec/);
assert.doesNotMatch(apiClient, /method: "(?:PUT|DELETE)"/);

for (const tab of ["개요", "이미지·첨부", "사이즈·색상", "원단", "부자재", "제작 플로우", "출력·공유"]) assert.match(detail, new RegExp(tab));
assert.match(detail, /accessibilityState=\{\{ disabled: true \}\}/);
assert.match(detail, /disabled\s*\n/);
assert.match(detail, /setActiveSection/);
assert.doesNotMatch(detail, /setActiveTab|activeTab/);
assert.match(detail, /다른 탭은 다음 단계에서 연결 예정입니다/);

assert.match(detail, /navigationBar:[^\n]+minHeight: 44/);
assert.doesNotMatch(detail, /navigationBar:[^\n]+position:/);
assert.match(detail, /scrollContent: \{ paddingBottom: 42 \}/);
assert.doesNotMatch(detail, /accessibilityRole="header"[^>]*numberOfLines/);
assert.match(detail, /heroText:[^\n]+flexGrow: 1[^\n]+flexShrink: 1[^\n]+minWidth: 0/);
assert.match(detail, /title:[^\n]+flexShrink: 1[^\n]+minWidth: 0/);
assert.match(detail, /useWindowDimensions/);
assert.match(detail, /width < 390/);
for (const removedSection of ["기본 정보", "문서 요약", "구성 요약", "Revision 상태", "Revision 확정", "최종 수정", "문서 상태", "문서번호", "생성 시각"]) {
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
