#!/usr/bin/env node
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
const app = read("apps/mobile/components/MobileWorkOrderApp.tsx");
const detail = read("apps/mobile/components/WorkOrderDetailOverview.tsx");
const client = read("apps/mobile/lib/apiClient.ts");
const types = read("apps/mobile/lib/apiTypes.ts");

assert.match(version, /APP_VERSION = "2\.0\.0-alpha\.49"/);
assert.match(mobileVersion, /MOBILE_APP_VERSION = "2\.0\.0-alpha\.49"/);
assert.equal(mobilePackage.version, "2.0.0-alpha.49");
assert.equal(mobileLock.version, "2.0.0-alpha.49");
assert.equal(mobileLock.packages[""].version, "2.0.0-alpha.49");
assert.equal(appConfig.expo.version, "2.0.0");
assert.equal(appConfig.expo.extra.appVersion, "2.0.0-alpha.49");
assert.equal(appConfig.expo.extra.mockOnly, false);
assert.equal(appConfig.expo.extra.dataMode, "dev-test-tailscale-auto-connect");
assert.equal(appConfig.expo.ios.bundleIdentifier, "com.wafl.app");
assert.equal(appConfig.expo.android.package, "com.wafl.app");
assert.deepEqual(easConfig, {
  cli: { version: "21.0.1", appVersionSource: "remote" },
  build: { development: { developmentClient: true, distribution: "internal", env: { APP_VARIANT: "development" } } },
});
assert.match(appConfigFactory, /100\.64\.0\.0\/10/);
assert.doesNotMatch(appConfigFactory, /NSAllowsArbitraryLoads/);

for (const label of ["기본정보 수정", "제품명", "납기", "총수량", "취소", "저장", "저장 중", "저장됨"]) {
  assert.match(`${app}\n${detail}`, new RegExp(label), `mobile basic-info UI missing ${label}`);
}
for (const field of ["productName", "dueDate", "totalQuantity"]) assert.match(app, new RegExp(field));
for (const forbiddenEditField of ["productTypeCode", "seasonCode", "itemCode", "factoryDeliveryMemo"]) {
  const patchBlock = app.match(/const patch:[\s\S]*?if \(Object\.keys\(patch\)\.length === 0\) return;/)?.[0] ?? "";
  assert.doesNotMatch(patchBlock, new RegExp(forbiddenEditField));
}
assert.match(app, /detail\.header\.status === "draft"/);
assert.match(app, /detail\.revision\.status === "draft"/);
assert.match(app, /permissionCodes\?\.includes\("workorder\.update"\)/);
assert.match(app, /expectedVersion: detail\.header\.entityVersion/);
assert.match(app, /clientRequestId: nextClientRequestId\(\)/);
assert.doesNotMatch(client, /Idempotency-Key/);
assert.match(app, /Object\.keys\(patch\)\.length === 0/);
assert.match(app, /saveRequestInFlight\.current/);
assert.match(app, /const saved = await patchWorkOrderBasicInfo/);
assert.match(app, /const refreshed = await getWorkOrderDetail/);
assert.match(app, /refreshed\.header\.entityVersion !== saved\.nextVersion/);
assert.match(app, /setItems\(\(current\) => current\.map/);
assert.doesNotMatch(app.match(/async function saveBasicInfo\(\)[\s\S]*?\n  function reloadLatestBasicInfo/)?.[0] ?? "", /getWorkOrderList\(/);

assert.match(client, /method: "GET" \| "POST" \| "PATCH"/);
assert.match(client, /export async function patchWorkOrderBasicInfo/);
assert.match(client, /method: "PATCH"/);
assert.match(client, /credentials: "include"/);
assert.match(client, /"Cache-Control": "no-store"/);
assert.match(client, /Content-Type/);
assert.match(types, /fieldErrors: readonly MobileFieldError\[\]/);
assert.match(types, /entityVersion: number \| null/);
assert.doesNotMatch(client, /method: "(?:PUT|DELETE)"/);
assert.doesNotMatch(client, /function requestMutation|arbitrary/i);
assert.doesNotMatch(`${app}\n${detail}`, /setInterval|polling/i);
assert.doesNotMatch(detail, /constants\/mockProductionCard|mockProductionCard/);

console.log("workorder v2 alpha.46 mobile basic-info update contract: PASS");
