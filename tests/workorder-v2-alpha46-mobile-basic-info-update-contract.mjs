#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { assertCanonicalWaflVersionConsistency } from "./helpers/wafl-v2-current-version.mjs";

const read = (relativePath) => fs.readFileSync(path.resolve(relativePath), "utf8");
assertCanonicalWaflVersionConsistency();
const appConfig = JSON.parse(read("apps/mobile/app.json"));
const easConfig = JSON.parse(read("apps/mobile/eas.json"));
const appConfigFactory = read("apps/mobile/app.config.js");
const app = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const detail = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const client = read("apps/mobile/lib/apiClient.ts");
const types = read("apps/mobile/domain/mobileContract.ts");
const policy = read("apps/mobile/domain/workOrderPolicy.ts");

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

for (const label of ["제품명", "납기", "총 수량", "취소", "완료", "저장 중", "저장됨"]) {
  assert.match(`${app}\n${detail}`, new RegExp(label), `mobile basic-info UI missing ${label}`);
}
assert.doesNotMatch(detail, /BasicInfoEditor|기본정보 수정|PencilLine/);
assert.match(detail, /overview-inline-product-name/);
for (const field of ["productName", "dueDate", "totalQuantity"]) assert.match(app, new RegExp(field));
for (const forbiddenEditField of ["productTypeCode", "seasonCode", "itemCode", "factoryDeliveryMemo"]) {
  const patchBlock = app.match(/const patch:[\s\S]*?if \(Object\.keys\(patch\)\.length === 0\) return;/)?.[0] ?? "";
  assert.doesNotMatch(patchBlock, new RegExp(forbiddenEditField));
}
assert.match(policy, /detail\.header\.status === "draft"/);
assert.match(policy, /detail\.revision\.status === "draft"/);
assert.match(policy, /permissionCodes\?\.includes\(UPDATE_PERMISSION\)/);
assert.match(app, /expectedVersion: detail\.header\.entityVersion/);
assert.match(app, /clientRequestId: nextClientRequestId\(\)/);
const basicInfoClient = client.slice(client.indexOf("export async function patchWorkOrderBasicInfo"));
assert.doesNotMatch(basicInfoClient, /idempotencyKey|Idempotency-Key/);
assert.match(app, /Object\.keys\(patch\)\.length === 0/);
assert.match(app, /overviewMutation\.inFlight/);
assert.match(app, /const saved = await workOrderMutationController\.updateOverview/);
assert.match(app, /const refreshed = await workOrderQueryController\.detail/);
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
