import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { assertCanonicalWaflVersionConsistency } from "./helpers/wafl-v2-current-version.mjs";
import { readMobileApiSource } from "./helpers/mobile-api-source.mjs";
import { resolveWorkOrderTabVisualState } from "../apps/mobile/features/work-orders/overview/workOrderDetailPresentation.ts";

const read = (relativePath) => fs.readFileSync(path.resolve(relativePath), "utf8");

assertCanonicalWaflVersionConsistency();
const detail = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const app = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const apiClient = readMobileApiSource();
const externalQa = read("lib/external-qa/configCore.mjs");
const mock = read("apps/mobile/components/ProductionCardMock.tsx");

assert.match(detail, /testID="production-card-sheet"/);
assert.match(detail, /styles\.hero[\s\S]*styles\.tabRailFrame[\s\S]*WaflMetricGrid[\s\S]*title="비용 구성"[\s\S]*WaflReadinessActionRow/);

for (const removedSection of ["문서 요약", "구성 요약"]) {
  assert.doesNotMatch(detail, new RegExp(removedSection), `removed section remains: ${removedSection}`);
}
for (const removedRow of ["Revision 상태", "Revision 확정", "최종 수정", "Entity version", "문서 상태", "문서번호", "생성 시각"]) {
  assert.doesNotMatch(detail, new RegExp(removedRow), `removed overview row remains: ${removedRow}`);
}
for (const removedPrimitive of ["InfoRow", "countList", "countRow", "countLabel", "countValue", "overviewColumns", "overviewColumn"]) {
  assert.doesNotMatch(detail, new RegExp(`${removedPrimitive}|styles\\.${removedPrimitive}`), `removed primitive remains: ${removedPrimitive}`);
}

for (const actualField of [
  "header.productName", "header.status", "header.totalQuantity", "header.dueDate", "header.readiness.issues",
  "detail.amounts.fabricTotal", "detail.amounts.accessoryTotal", "detail.amounts.processTotal",
  "detail.amounts.estimatedTotal", "formatEstimatedUnitCost", "detail.tabCounts.images",
  "detail.tabCounts.sizes", "detail.tabCounts.colors", "detail.tabCounts.fabric", "detail.tabCounts.accessory",
  "detail.tabCounts.documents",
]) assert.match(detail, new RegExp(actualField.replaceAll(".", "\\.")), `required actual overview source missing: ${actualField}`);

assert.match(detail, /useWindowDimensions/);
assert.match(detail, /const compactPhoneHero = phone && width < 390/);
assert.match(detail, /mediaFrameCompactPhone: \{ height: 90, width: 72 \}/);
assert.match(detail, /heroText:[^\n]+flexGrow: 1[^\n]+flexShrink: 1[^\n]+minWidth: 0/);
assert.match(detail, /title:[^\n]+flexShrink: 1[^\n]+minWidth: 0/);
assert.doesNotMatch(detail, /accessibilityRole="header"[^>]*numberOfLines/);
assert.match(detail, /scrollContent: \{ paddingBottom: 42 \}/);

for (const label of ["개요", "이미지", "사이즈·색상", "원부자재", "제작", "문서"]) {
  assert.match(detail, new RegExp(label), `tab label/count location missing: ${label}`);
}
assert.equal(resolveWorkOrderTabVisualState({ selected: false, locked: true }), "locked");
assert.equal(resolveWorkOrderTabVisualState({ selected: false, locked: false }), "inactive");
assert.match(detail, /disabled=\{disabled\}/);
assert.match(detail, /tab\.count\(detail\)/);
assert.match(detail, /setActiveSection/);
assert.doesNotMatch(detail, /setActiveTab|activeTab/);

assert.doesNotMatch(detail, /mockProductionCard|summaryMetrics|costMetrics|overviewInfo|nextCheckByTab|constants\/mockProductionCard/);
assert.doesNotMatch(detail, /value=\{header\.id\}|<Text[^>]*>\{header\.id\}<\/Text>|Entity version|value=\{header\.document/, "routing/projection fields must not be rendered as overview rows");
assert.doesNotMatch(detail, /value=\{detail\.revision\.status\}/, "revision status must not return as a duplicate overview row");
assert.doesNotMatch(detail, /core detail|server calculated|internal status/i);
assert.match(detail, /WorkOrderImageGallery/);
assert.match(apiClient, /\/assets\?limit=50/);
assert.doesNotMatch(apiClient, /\/history/, "history remains locked");
assert.match(apiClient, /export async function getWorkOrderProcesses[\s\S]*method: "GET"/);
assert.match(apiClient, /target\.method/);
assert.match(apiClient, /export async function deleteWorkOrderMaterial/);
assert.match(apiClient, /method: "DELETE"/);
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
