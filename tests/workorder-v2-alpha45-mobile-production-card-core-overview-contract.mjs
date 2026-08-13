import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { assertCanonicalWaflVersionConsistency } from "./helpers/wafl-v2-current-version.mjs";
import { readMobileApiSource } from "./helpers/mobile-api-source.mjs";
import { resolveWorkOrderTabVisualState } from "../apps/mobile/features/work-orders/overview/workOrderDetailPresentation.ts";

const read = (relativePath) => fs.readFileSync(path.resolve(relativePath), "utf8");

assertCanonicalWaflVersionConsistency();
const mobilePackage = JSON.parse(read("apps/mobile/package.json"));
const appConfig = JSON.parse(read("apps/mobile/app.json"));
const easConfig = JSON.parse(read("apps/mobile/eas.json"));
const appConfigFactory = read("apps/mobile/app.config.js");
const entry = read("apps/mobile/app/index.tsx");
const app = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const list = read("apps/mobile/features/work-orders/list/WorkOrderListScreen.tsx");
const detail = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const display = read("apps/mobile/lib/workOrderDisplay.ts");
const apiClient = readMobileApiSource();
const proxy = read("proxy.ts");
const externalQa = read("lib/external-qa/configCore.mjs");
const runtime = [entry, app, list, detail, apiClient].join("\n");

assert.equal(appConfig.expo.extra.mockOnly, false);
assert.equal(appConfig.expo.extra.dataMode, "dev-test-tailscale-auto-connect");
assert.equal(appConfig.expo.owner, "lostab");
assert.equal(appConfig.expo.slug, "wafl-mobile");
assert.equal(appConfig.expo.ios.bundleIdentifier, "com.wafl.app");
assert.equal(appConfig.expo.android.package, "com.wafl.app");
assert.equal(appConfig.expo.ios.config.usesNonExemptEncryption, false);
assert.deepEqual(easConfig, {
  cli: { version: "21.0.1", appVersionSource: "remote" },
  build: { development: { developmentClient: true, distribution: "internal", env: { APP_VARIANT: "development" } } },
});
assert.match(appConfigFactory, /100\.64\.0\.0\/10/);
assert.doesNotMatch(appConfigFactory, /NSAllowsArbitraryLoads/);

const expectedDependencies = {
  expo: "~55.0.28", "expo-constants": "~55.0.17", "expo-dev-client": "~55.0.37", "expo-font": "~55.0.8",
  "expo-document-picker": "~55.0.15", "expo-image-picker": "~55.0.22", "expo-linking": "~55.0.16", "expo-router": "~55.0.17", "lucide-react-native": "^1.24.0", react: "19.2.0",
  "react-dom": "19.2.0", "react-native": "0.83.6", "react-native-safe-area-context": "~5.6.2",
  "react-native-screens": "~4.23.0", "react-native-svg": "15.15.3", "react-native-web": "0.21.0",
};
assert.deepEqual(mobilePackage.dependencies, expectedDependencies, "native/dependency baseline must remain unchanged");

assert.match(entry, /MobileWorkOrderApp/);
assert.match(app, /WorkOrderDetailOverview/);
assert.match(apiClient, /new URLSearchParams\(\{ limit: "30" \}\)/);
assert.match(apiClient, /`\/api\/v2\/work-orders\?\$\{query\.toString\(\)\}`/);
assert.match(apiClient, /\/api\/v2\/work-orders\/\$\{encodeURIComponent\(workOrderId\)\}/);
assert.match(apiClient, /credentials: "include"/);
assert.match(apiClient, /\/assets\?limit=50/);
assert.doesNotMatch(apiClient, /\/processes|\/documents|\/history/, "process/document/history remain outside the connected mobile detail");
assert.match(apiClient, /target\.method/);
assert.match(apiClient, /export async function deleteWorkOrderMaterial/);
assert.match(apiClient, /method: "DELETE"/);

assert.doesNotMatch(detail, /mockProductionCard|productionCards|summaryMetrics|costMetrics|overviewInfo|nextCheckByTab/);
assert.doesNotMatch(detail, /constants\/mockProductionCard/);
assert.ok(fs.existsSync(path.resolve("apps/mobile/components/ProductionCardMock.tsx")), "historical ProductionCardMock must remain");
assert.ok(fs.existsSync(path.resolve("apps/mobile/constants/mockProductionCard.ts")), "historical mock constants must remain");
assert.doesNotMatch(entry, /ProductionCardMock/);

for (const actualField of [
  "header.productName", "header.status", "header.totalQuantity", "header.dueDate",
  "detail.amounts.unitPrice", "detail.amounts.fabricTotal", "detail.amounts.accessoryTotal", "detail.amounts.processTotal",
  "detail.amounts.estimatedTotal", "header.readiness.hardBlockers", "header.readiness.warnings", "detail.tabCounts",
]) assert.match(detail, new RegExp(actualField.replaceAll(".", "\\.")), `missing actual core mapping: ${actualField}`);
assert.doesNotMatch(detail, /Revision\s*R/);

assert.doesNotMatch(detail, /header\.id/);
assert.doesNotMatch(detail, /header\.entityVersion|Entity version/);
assert.match(display, /"apparel\.onepiece_set": "원피스·세트"/);
assert.match(display, /finalized: "확정됨"/);
assert.match(display, /generated: "생성 완료"/);
assert.match(detail, /대표 이미지 없음/);
assert.match(detail, /WorkOrderImageGallery/);
assert.match(detail, /1벌 원가/);
assert.doesNotMatch(detail, /한 벌 예상/);
assert.match(detail, /발행 준비 가능/);
assert.match(detail, /발행 전 확인/);
assert.match(detail, /비용 구성/);
for (const removedOverviewLabel of ["문서 요약", "구성 요약", "Revision 상태", "Revision 확정", "최종 수정", "문서 상태", "문서번호", "생성 시각"]) {
  assert.doesNotMatch(detail, new RegExp(`>[\\s\\S]*?${removedOverviewLabel}[\\s\\S]*?<`), `overview must not render ${removedOverviewLabel}`);
}

for (const label of ["개요", "이미지·첨부", "사이즈·색상", "원단", "부자재", "제작", "문서"]) {
  assert.match(detail, new RegExp(`(?:label=|label: )["']${label}["']`), `tab must be visible: ${label}`);
}
assert.equal(resolveWorkOrderTabVisualState({ selected: false, locked: true }), "locked");
assert.equal(resolveWorkOrderTabVisualState({ selected: true, locked: false }), "active");
assert.match(detail, /const locked = tab\.id === "flow" \|\| tab\.id === "output"/);
assert.match(detail, /disabled=\{disabled\}/);
assert.match(detail, /tab\.id === "fabric" \|\| tab\.id === "accessory"/);
assert.match(detail, /activeSection === "media"[\s\S]*WorkOrderImageGallery/);
assert.match(detail, /setActiveSection/);
assert.doesNotMatch(detail, /setActiveTab|activeTab/);

for (const forbiddenAction of ["저장", "수정", "발주", "완료", "삭제", "공유", "출력", "Preview", "카메라", "첨부 버튼"]) {
  assert.doesNotMatch(detail, new RegExp(`>\\s*${forbiddenAction}\\s*<`), `live detail must not expose ${forbiddenAction}`);
}
assert.doesNotMatch(runtime, /setInterval|polling/i);
assert.match(app, /useWindowDimensions/);
assert.match(app, /width >= 768/);
assert.match(app, /styles\.split/);
assert.match(app, /detailRequestInFlight\.current/);
assert.match(app, /if \(detailRequestInFlight\.current\) return/);
assert.match(app, /onReturnToList=\{returnToList\}/);
assert.match(app, /accessibilityLabel="작업지시서 목록으로 돌아가기"/);
assert.match(app, /accessibilityLabel="작업지시서 목록으로"/);
assert.doesNotMatch(app, /returnToList[\s\S]{0,500}getWorkOrderList\(/, "returning to list must not refetch automatically");
assert.match(list, /현재 표시 작업지시서/);
assert.match(list, /accessibilityLabel="작업지시서 검색"/);

assert.match(proxy, /isExternalQaPathAllowed/);
assert.match(externalQa, /\[0-9a-f\]\{8\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{12\}/);
assert.doesNotMatch(externalQa, /\/api\/v2\/\*/);
assert.doesNotMatch(runtime, /https:\/\/[a-z0-9-]{12,}\.trycloudflare\.com/);
assert.doesNotMatch(runtime, /companyId\s*:\s*["'][^"']+["']|userId\s*:\s*["'][^"']+["']/);

console.log("workorder v2 alpha.45 mobile ProductionCard core overview contract: PASS");
