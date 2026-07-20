import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const read = (relativePath) => fs.readFileSync(path.resolve(relativePath), "utf8");

const version = read("lib/constants/version.ts");
const mobileVersion = read("apps/mobile/constants/version.ts");
const mobilePackage = JSON.parse(read("apps/mobile/package.json"));
const mobileLock = JSON.parse(read("apps/mobile/package-lock.json"));
const appConfig = JSON.parse(read("apps/mobile/app.json"));
const easConfig = JSON.parse(read("apps/mobile/eas.json"));
const appConfigFactory = read("apps/mobile/app.config.js");
const entry = read("apps/mobile/app/index.tsx");
const app = read("apps/mobile/components/MobileWorkOrderApp.tsx");
const list = read("apps/mobile/components/WorkOrderListScreen.tsx");
const detail = read("apps/mobile/components/WorkOrderDetailOverview.tsx");
const display = read("apps/mobile/lib/workOrderDisplay.ts");
const apiClient = read("apps/mobile/lib/apiClient.ts");
const proxy = read("proxy.ts");
const externalQa = read("lib/external-qa/configCore.mjs");
const runtime = [entry, app, list, detail, apiClient].join("\n");

assert.match(version, /APP_VERSION = "2\.0\.0-alpha\.51"/);
assert.match(mobileVersion, /MOBILE_APP_VERSION = "2\.0\.0-alpha\.51"/);
assert.equal(mobilePackage.version, "2.0.0-alpha.51");
assert.equal(mobileLock.version, "2.0.0-alpha.51");
assert.equal(mobileLock.packages[""].version, "2.0.0-alpha.51");
assert.equal(appConfig.expo.version, "2.0.0");
assert.equal(appConfig.expo.extra.appVersion, "2.0.0-alpha.51");
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
  "expo-linking": "~55.0.16", "expo-router": "~55.0.17", "lucide-react-native": "^1.24.0", react: "19.2.0",
  "react-dom": "19.2.0", "react-native": "0.83.6", "react-native-safe-area-context": "~5.6.2",
  "react-native-screens": "~4.23.0", "react-native-svg": "15.15.3", "react-native-web": "0.21.0",
};
assert.deepEqual(mobilePackage.dependencies, expectedDependencies, "native/dependency baseline must remain unchanged");

assert.match(entry, /MobileWorkOrderApp/);
assert.match(app, /WorkOrderDetailOverview/);
assert.match(apiClient, /\/api\/v2\/work-orders\?limit=30/);
assert.match(apiClient, /\/api\/v2\/work-orders\/\$\{encodeURIComponent\(workOrderId\)\}/);
assert.match(apiClient, /credentials: "include"/);
assert.doesNotMatch(apiClient, /\/processes|\/assets|\/documents|\/history|\/size-color|\/size-spec/);
assert.doesNotMatch(apiClient, /method: "(?:PUT|DELETE)"/);

assert.doesNotMatch(detail, /mockProductionCard|productionCards|summaryMetrics|costMetrics|overviewInfo|nextCheckByTab/);
assert.doesNotMatch(detail, /constants\/mockProductionCard/);
assert.ok(fs.existsSync(path.resolve("apps/mobile/components/ProductionCardMock.tsx")), "historical ProductionCardMock must remain");
assert.ok(fs.existsSync(path.resolve("apps/mobile/constants/mockProductionCard.ts")), "historical mock constants must remain");
assert.doesNotMatch(entry, /ProductionCardMock/);

for (const actualField of [
  "header.productName", "header.status", "header.totalQuantity", "header.dueDate", "header.currentRevisionNumber",
  "header.productTypeAlias", "header.productTypeCode", "header.seasonCode", "header.itemCode",
  "detail.amounts.unitPrice", "detail.amounts.fabricTotal", "detail.amounts.accessoryTotal", "detail.amounts.processTotal",
  "detail.amounts.estimatedTotal", "header.readiness.hardBlockers", "header.readiness.warnings", "detail.tabCounts",
]) assert.match(detail, new RegExp(actualField.replaceAll(".", "\\.")), `missing actual core mapping: ${actualField}`);

assert.doesNotMatch(detail, /header\.id/);
assert.doesNotMatch(detail, /header\.entityVersion|Entity version/);
assert.match(display, /"apparel\.onepiece_set": "원피스·세트"/);
assert.match(display, /finalized: "확정됨"/);
assert.match(display, /generated: "생성 완료"/);
assert.match(detail, /대표 이미지 준비 중/);
assert.doesNotMatch(runtime, /<Image\b|Image\s*from\s*["']react-native/);
assert.match(detail, /한벌 단가/);
assert.doesNotMatch(detail, /한 벌 예상/);
assert.match(detail, /발행 준비 가능/);
assert.match(detail, /발행 전 확인/);
assert.match(detail, /금액 요약/);
for (const removedOverviewLabel of ["기본 정보", "문서 요약", "구성 요약", "Revision 상태", "Revision 확정", "최종 수정", "문서 상태", "문서번호", "생성 시각"]) {
  assert.doesNotMatch(detail, new RegExp(`>[\\s\\S]*?${removedOverviewLabel}[\\s\\S]*?<`), `overview must not render ${removedOverviewLabel}`);
}

for (const label of ["개요", "이미지·첨부", "사이즈·색상", "원단", "부자재", "제작 플로우", "출력·공유"]) {
  assert.match(detail, new RegExp(`(?:label: |>)["']?${label}`), `tab must be visible: ${label}`);
}
assert.match(detail, /accessibilityState=\{\{ disabled: true \}\}/);
assert.match(detail, /disabled\s*\n/);
assert.match(detail, /다른 탭은 다음 단계에서 연결 예정입니다/);
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
assert.match(app, /accessibilityLabel="제작 카드 목록으로 돌아가기"/);
assert.match(app, /accessibilityLabel="제작 카드 목록으로"/);
assert.doesNotMatch(app, /returnToList[\s\S]{0,500}getWorkOrderList\(/, "returning to list must not refetch automatically");
assert.match(list, /현재 불러온 카드/);
assert.doesNotMatch(list, /검색/);

assert.match(proxy, /isExternalQaPathAllowed/);
assert.match(externalQa, /\[0-9a-f\]\{8\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{12\}/);
assert.doesNotMatch(externalQa, /\/api\/v2\/\*/);
assert.doesNotMatch(runtime, /https:\/\/[a-z0-9-]{12,}\.trycloudflare\.com/);
assert.doesNotMatch(runtime, /companyId\s*:\s*["'][^"']+["']|userId\s*:\s*["'][^"']+["']/);

console.log("workorder v2 alpha.45 mobile ProductionCard core overview contract: PASS");
