import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { assertCanonicalWaflVersionConsistency } from "./helpers/wafl-v2-current-version.mjs";

const read = (relativePath) => fs.readFileSync(path.resolve(relativePath), "utf8");

assertCanonicalWaflVersionConsistency();
const mobilePackage = JSON.parse(read("apps/mobile/package.json"));
const appConfig = JSON.parse(read("apps/mobile/app.json"));
const easConfig = JSON.parse(read("apps/mobile/eas.json"));

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

const expectedDependencies = {
  expo: "~55.0.28", "expo-constants": "~55.0.17", "expo-dev-client": "~55.0.37", "expo-font": "~55.0.8",
  "expo-linking": "~55.0.16", "expo-router": "~55.0.17", "lucide-react-native": "^1.24.0", react: "19.2.0",
  "react-dom": "19.2.0", "react-native": "0.83.6", "react-native-safe-area-context": "~5.6.2",
  "react-native-screens": "~4.23.0", "react-native-svg": "15.15.3", "react-native-web": "0.21.0",
};
assert.deepEqual(mobilePackage.dependencies, expectedDependencies, "native/dependency baseline must not change");

const entry = read("apps/mobile/app/index.tsx");
const app = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const apiClient = read("apps/mobile/lib/apiClient.ts");
const list = read("apps/mobile/features/work-orders/list/WorkOrderListScreen.tsx");
const detail = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const errorPresentation = read("apps/mobile/application/errorPresentation.ts");
const mobileRuntime = [entry, app, apiClient, list, detail, errorPresentation].join("\n");

assert.match(entry, /MobileWorkOrderApp/);
assert.doesNotMatch(entry, /ProductionCardMock/);
assert.match(apiClient, /credentials: "include"/);
assert.match(apiClient, /\/api\/auth\/me/);
assert.match(apiClient, /new URLSearchParams\(\{ limit: "30" \}\)/);
assert.match(apiClient, /`\/api\/v2\/work-orders\?\$\{query\.toString\(\)\}`/);
assert.match(apiClient, /\/api\/v2\/work-orders\/\$\{encodeURIComponent\(workOrderId\)\}/);
assert.match(apiClient, /\/api\/dev\/mobile-connect\/exchange/);
assert.match(apiClient, /\/api\/dev\/mobile-connect\/disconnect/);
assert.doesNotMatch(apiClient, /method: "(PUT|DELETE)"/);
assert.doesNotMatch(apiClient, /\/processes|\/assets|\/documents|\/history|\/size-color|\/size-spec/);
assert.doesNotMatch(mobileRuntime, /<Image\b|Image\s*from\s*["']react-native/);
assert.doesNotMatch(app, /setInterval|setTimeout\s*\(.*getWorkOrder|poll/i);
assert.match(app, /useWindowDimensions/);
assert.match(app, /width >= 768/);
assert.match(app, /"booting"[\s\S]*"session-checking"[\s\S]*"developer-auto-connecting"[\s\S]*"disconnected-auto-failed"[\s\S]*"manual-code-entry"[\s\S]*"connecting-manual"[\s\S]*"authenticated-loading-list"[\s\S]*"list-ready"[\s\S]*"detail-loading"[\s\S]*"detail-ready"[\s\S]*"recoverable-error"[\s\S]*"session-expired"/);
for (const forbidden of ["저장", "수정", "발주", "삭제"]) assert.doesNotMatch(detail, new RegExp(`>${forbidden}<`));
assert.match(list, /현재 불러온 작업지시서/);
assert.match(list, /representativeThumbnail \? "이미지 있음" : "이미지 없음"/);
assert.match(detail, /작업지시서 · 읽기 전용/);
assert.match(app, /자동으로 다시 요청하지 않습니다/);
assert.match(errorPresentation, /목록으로 돌아가 다른 작업지시서를 선택하세요/);
assert.match(app, /accessibilityLabel="작업지시서 목록으로 돌아가기"/);
assert.match(app, /accessibilityLabel="작업지시서 목록으로"/);
assert.match(app, /returnToList/);
assert.match(app, /detailRequestInFlight\.current/);
assert.match(app, /if \(detailRequestInFlight\.current\) return/);
assert.match(app, /onReturnToList=\{returnToList\}/);
assert.doesNotMatch(app, /returnToList[\s\S]{0,500}getWorkOrderList\(/, "returning from detail error must preserve the loaded list without refetch");
assert.doesNotMatch(mobileRuntime, /companyId\s*:\s*["'][^"']+["']|userId\s*:\s*["'][^"']+["']|https:\/\/[a-z0-9-]{12,}\.trycloudflare\.com/);

const appConfigFactory = read("apps/mobile/app.config.js");
assert.match(appConfigFactory, /100\.64\.0\.0\/10/);
assert.doesNotMatch(appConfigFactory, /NSAllowsArbitraryLoads/);

console.log("workorder v2 alpha.44 mobile real read contract: PASS");
