import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const read = (relativePath) => fs.readFileSync(path.resolve(relativePath), "utf8");

const version = read("lib/constants/version.ts");
const detail = read("apps/mobile/components/WorkOrderDetailOverview.tsx");
const app = read("apps/mobile/components/MobileWorkOrderApp.tsx");
const apiClient = read("apps/mobile/lib/apiClient.ts");
const externalQa = read("lib/external-qa/configCore.mjs");
const mock = read("apps/mobile/components/ProductionCardMock.tsx");

assert.match(version, /APP_VERSION = "2\.0\.0-alpha\.52"/);
assert.match(detail, /testID="production-card-sheet"/);
assert.match(detail, /styles\.hero[\s\S]*styles\.summaryGrid[\s\S]*styles\.tabRailFrame[\s\S]*ReadinessPanel[\s\S]*title="금액 요약"/);

for (const removedSection of ["기본 정보", "문서 요약", "구성 요약"]) {
  assert.doesNotMatch(detail, new RegExp(removedSection), `removed section remains: ${removedSection}`);
}
for (const removedRow of ["Revision 상태", "Revision 확정", "최종 수정", "Entity version", "문서 상태", "문서번호", "생성 시각"]) {
  assert.doesNotMatch(detail, new RegExp(removedRow), `removed overview row remains: ${removedRow}`);
}
for (const removedPrimitive of ["InfoRow", "countList", "countRow", "countLabel", "countValue", "overviewColumns", "overviewColumn"]) {
  assert.doesNotMatch(detail, new RegExp(`${removedPrimitive}|styles\\.${removedPrimitive}`), `removed primitive remains: ${removedPrimitive}`);
}

for (const actualField of [
  "header.productName", "header.status", "header.productTypeAlias", "header.productTypeCode",
  "header.seasonCode", "header.itemCode", "header.totalQuantity", "header.dueDate", "header.readiness.hardBlockers",
  "header.readiness.warnings", "detail.amounts.fabricTotal", "detail.amounts.accessoryTotal", "detail.amounts.processTotal",
  "detail.amounts.unitPrice", "detail.amounts.estimatedTotal", "detail.tabCounts.images", "detail.tabCounts.attachments",
  "detail.tabCounts.sizes", "detail.tabCounts.colors", "detail.tabCounts.fabric", "detail.tabCounts.accessory",
  "detail.tabCounts.processes", "detail.tabCounts.documents",
]) assert.match(detail, new RegExp(actualField.replaceAll(".", "\\.")), `required actual overview source missing: ${actualField}`);

assert.match(detail, /useWindowDimensions/);
assert.match(detail, /const compactPhoneHero = phone && width < 390/);
assert.match(detail, /mediaFrameCompactPhone: \{ height: 90, width: 72 \}/);
assert.match(detail, /heroText:[^\n]+flexGrow: 1[^\n]+flexShrink: 1[^\n]+minWidth: 0/);
assert.match(detail, /title:[^\n]+flexShrink: 1[^\n]+minWidth: 0/);
assert.doesNotMatch(detail, /accessibilityRole="header"[^>]*numberOfLines/);
assert.match(detail, /scrollContent: \{ paddingBottom: 42 \}/);

for (const label of ["개요", "이미지·첨부", "사이즈·색상", "원단", "부자재", "제작 플로우", "출력·공유"]) {
  assert.match(detail, new RegExp(label), `tab label/count location missing: ${label}`);
}
assert.match(detail, /accessibilityState=\{\{ disabled: true \}\}/);
assert.match(detail, /tab\.count\(detail\)/);
assert.match(detail, /setActiveSection/);
assert.doesNotMatch(detail, /setActiveTab|activeTab/);

assert.doesNotMatch(detail, /mockProductionCard|summaryMetrics|costMetrics|overviewInfo|nextCheckByTab|constants\/mockProductionCard/);
assert.doesNotMatch(detail, /header\.id|entityVersion|header\.document/);
assert.doesNotMatch(detail, /value=\{detail\.revision\.status\}/, "revision status must not return as a duplicate overview row");
assert.doesNotMatch(detail, /core detail|server calculated|internal status/i);
assert.doesNotMatch(detail, /<Image\b|Image\s*from\s*["']react-native/);
assert.doesNotMatch(apiClient, /\/processes|\/assets|\/documents|\/history|\/size-color|\/size-spec/);
assert.doesNotMatch(apiClient, /method: "(?:PUT|DELETE)"/);
assert.doesNotMatch(app, /setInterval|polling/i);
assert.match(app, /detailRequestInFlight\.current/);
assert.match(app, /onReturnToList=\{returnToList\}/);
assert.doesNotMatch(app, /returnToList[\s\S]{0,500}getWorkOrderList\(/);
assert.match(app, /width >= 768/);
assert.match(app, /styles\.split/);
assert.match(externalQa, /\[0-9a-f\]\{8\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{12\}/);
assert.doesNotMatch(externalQa, /\/api\/v2\/\*/);
assert.match(mock, /export default function ProductionCardMock/);
assert.match(mock, /function OverviewTab/);

console.log("workorder v2 alpha.45 ProductionCard information architecture contract: PASS");
