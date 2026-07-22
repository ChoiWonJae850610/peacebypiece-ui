import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { isExternalQaPathAllowed, isTailscaleServePathAllowed } from "../lib/external-qa/configCore.mjs";

const read = (relativePath) => fs.readFileSync(path.resolve(relativePath), "utf8");
const json = (relativePath) => JSON.parse(read(relativePath));

const version = read("lib/constants/version.ts");
const mobileVersion = read("apps/mobile/constants/version.ts");
const mobilePackage = json("apps/mobile/package.json");
const mobileLock = json("apps/mobile/package-lock.json");
const appJson = json("apps/mobile/app.json");
const easJson = json("apps/mobile/eas.json");
const detail = read("apps/mobile/components/WorkOrderDetailOverview.tsx");
const materials = read("apps/mobile/components/WorkOrderMaterialsReadOnly.tsx");
const app = read("apps/mobile/components/MobileWorkOrderApp.tsx");
const apiClient = read("apps/mobile/lib/apiClient.ts");
const apiTypes = read("apps/mobile/lib/apiTypes.ts");
const mobileDisplay = read("apps/mobile/lib/mobileDisplay.ts");
const route = read("app/api/v2/work-orders/[workOrderId]/materials/route.ts");
const detailRead = read("lib/domain/work-orders/read/detailRoute.ts");
const detailService = read("lib/domain/work-orders/read/detailService.ts");
const externalQa = read("lib/external-qa/configCore.mjs");

assert.match(version, /APP_VERSION = "2\.0\.0-alpha\.52"/);
assert.match(mobileVersion, /MOBILE_APP_VERSION = "2\.0\.0-alpha\.52"/);
assert.equal(mobilePackage.version, "2.0.0-alpha.52");
assert.equal(mobileLock.version, "2.0.0-alpha.52");
assert.equal(mobileLock.packages[""].version, "2.0.0-alpha.52");
assert.equal(appJson.expo.version, "2.0.0");
assert.equal(appJson.expo.extra.appVersion, "2.0.0-alpha.52");
assert.equal(appJson.expo.extra.dataMode, "dev-test-tailscale-auto-connect");
assert.equal(appJson.expo.extra.mockOnly, false);
assert.equal(appJson.expo.ios.bundleIdentifier, "com.wafl.app");
assert.equal(appJson.expo.android.package, "com.wafl.app");
assert.deepEqual(easJson, {
  cli: { version: "21.0.1", appVersionSource: "remote" },
  build: { development: { developmentClient: true, distribution: "internal", env: { APP_VARIANT: "development" } } },
});

assert.match(route, /handleGetWorkOrderDetailTabV2\(request, workOrderId, "materials"\)/);
assert.match(detailRead, /permissionCode: "workorder\.read"/);
assert.match(detailService, /materialType !== "fabric" && materialType !== "accessory"/);
assert.match(detailService, /decodeWorkOrderTabCursor/);
assert.match(detailService, /limit: parseLimit\(input\.searchParams\.get\("limit"\)\)/);
assert.match(apiTypes, /MaterialLineStatus = "editing" \| "requested" \| "completed" \| "cancelled" \| "unknown"/);
for (const field of [
  "name", "colorOption", "usageArea", "requiredQuantity", "allowanceQuantity", "inventoryUsageQuantity",
  "orderQuantity", "unitCode", "currency", "unitPrice", "amount", "memo", "status", "displayOrder", "locked",
]) assert.match(apiTypes, new RegExp(`readonly ${field}`), `material API field missing: ${field}`);
assert.doesNotMatch(apiTypes, /\[key:\s*string\]|:\s*any\b/);

assert.match(apiClient, /export async function getWorkOrderMaterials/);
assert.match(apiClient, /type: "fabric", lifecycle, limit: "30"/);
assert.match(apiClient, /method: "GET"/);
assert.match(apiClient, /body\.data\.workOrderId !== workOrderId/);
assert.match(apiClient, /DECIMAL_PATTERN/);
assert.match(apiClient, /body\.data\.hasMore &&/);
assert.match(apiClient, /!body\.data\.hasMore && body\.data\.nextCursor !== null/);

const syntheticId = "11111111-1111-1111-1111-111111111111";
const materialsPath = `/api/v2/work-orders/${syntheticId}/materials`;
assert.equal(isTailscaleServePathAllowed(materialsPath, "GET"), true);
assert.equal(isTailscaleServePathAllowed(materialsPath, "POST"), false);
assert.equal(isTailscaleServePathAllowed(materialsPath, "PATCH"), false);
assert.equal(isExternalQaPathAllowed(materialsPath, "GET"), false, "Cloudflare Preview origin must not expose material lazy reads");
assert.doesNotMatch(externalQa, /\/api\/v2\/\*/);

assert.match(detail, /SECTION_TABS/);
assert.match(detail, /id: "fabric", label: "원단"/);
assert.match(detail, /setActiveSection\("fabric"\)[\s\S]{0,120}props\.onOpenMaterials\(\)/);
assert.match(detail, /accessibilityState=\{\{ disabled: true \}\}/);
for (const disabledTab of ["media", "sizes", "accessory", "flow", "output"]) {
  assert.match(detail, new RegExp(`id: "${disabledTab}"`), `future tab missing: ${disabledTab}`);
}
assert.match(detail, /WorkOrderMaterialsReadOnly/);
assert.match(detail, /key=\{props\.materialIdentityKey\}/);
assert.doesNotMatch(detail, /mockProductionCard|constants\/mockProductionCard/);

for (const state of ["not-loaded", "loading", "loaded", "empty", "error", "retrying", "loading-more"]) {
  assert.match(materials + app, new RegExp(`"${state}"`), `material state missing: ${state}`);
}
assert.match(materials, /원단 정보를 불러오는 중/);
assert.match(materials, /등록된 원단이 없습니다/);
assert.match(materials, /원단 정보를 불러오지 못했습니다/);
assert.match(materials, /다시 시도/);
assert.match(materials, /더 보기/);
assert.match(materials, /expandedIds\.has\(line\.id\)/);
assert.match(materials, /exactHexColor\(line\.colorOption\)/);
for (const label of ["원단명 미입력", "사용부위", "필요수량", "발주수량", "재고사용", "로스·여유", "단가", "금액", "메모"]) {
  assert.match(materials, new RegExp(label), `material display missing: ${label}`);
}
for (const status of ["입력 중", "발주 요청", "발주 완료", "요청 취소", "상태 확인 필요"]) {
  assert.match(materials, new RegExp(status), `material status label missing: ${status}`);
}
assert.match(materials, /card: \{[^\n]*borderLeftWidth: 4[^\n]*borderRadius: 8/);
for (const accent of ["cardEditing", "cardRequested", "cardCompleted", "cardCancelled", "cardUnknown"]) {
  assert.match(materials, new RegExp(`${accent}: \\{[^\\n]*borderLeftColor`), `material status accent missing: ${accent}`);
}
for (const badge of ["statusBadgeEditing", "statusBadgeRequested", "statusBadgeCompleted", "statusBadgeCancelled", "statusBadgeUnknown"]) {
  assert.match(materials, new RegExp(`${badge}: \\{[^\\n]*backgroundColor`), `material status badge tone missing: ${badge}`);
}
assert.match(materials, /materialTitleRow[\s\S]{0,500}unitChip/);
assert.match(materials, /testID="material-core-row"[\s\S]{0,900}label="거래처" value="—"[\s\S]{0,900}>색상·옵션<[\s\S]{0,900}label="단가"/);
assert.equal((materials.match(/label="필요수량"/g) ?? []).length, 2, "compact and expanded 필요수량 source slots must both exist");
assert.match(materials, /activeQuantityField \? \([\s\S]*material-quantity-row-expanded[\s\S]*\) : \([\s\S]*styles\.coreRow/, "compact and expanded quantity slots must be mutually exclusive");
assert.match(materials, /expandedPanel[\s\S]{0,900}label="필요수량"[\s\S]{0,900}label="로스·여유"[\s\S]{0,900}label="재고사용"/);
assert.match(materials, /readOnlyRows[\s\S]{0,1600}field="usageArea" label="사용부위"[\s\S]{0,1600}field="memo" label="메모"/);
assert.match(materials, /testID="material-order-action-row"[\s\S]{0,1200}testID="material-order-summary-lines"[\s\S]{0,800}발주수량[\s\S]{0,500}단가[\s\S]{0,500}testID="material-order-summary-amount"[\s\S]{0,300}금액/);
assert.match(materials, /materialOrderActionRow: \{[^\n]*flexDirection: "row"[^\n]*minHeight: 38[^\n]*paddingVertical: 4/);
assert.match(materials, /materialOrderLineStack: \{[^\n]*flex: 1[^\n]*minWidth: 0/);
assert.match(materials, /materialOrderActions: \{[^\n]*flexDirection: "row"[^\n]*flexShrink: 0/);
assert.match(materials, /function materialActions[\s\S]{0,1200}caption: "완료"[\s\S]{0,300}caption: "취소"[\s\S]{0,300}caption: "삭제"[\s\S]{0,600}caption: "발주"[\s\S]{0,300}caption: "삭제"/);
const readOnlyActionButton = materials.slice(materials.indexOf("function ReadOnlyActionButton"), materials.indexOf("function MaterialCard"));
assert.match(readOnlyActionButton, /accessibilityState=\{\{ disabled: true \}\}/);
assert.match(readOnlyActionButton, /\n\s+disabled\n/);
assert.doesNotMatch(readOnlyActionButton, /onPress=/);
assert.doesNotMatch(materials, /\bKRW\b|line\.currency/);
assert.match(mobileDisplay, /if \(!matched\) return "미입력"/);
assert.match(mobileDisplay, /\$\{grouped\}원/);
assert.match(mobileDisplay, /replace\(\/0\+\$\/, ""\)/);
assert.doesNotMatch(`${materials}\n${mobileDisplay}`, /toFixed\(3\)|minimumFractionDigits:\s*3|toFixed\(2\)|minimumFractionDigits:\s*2/);
assert.doesNotMatch(materials, /styles\.listHeading|listHeading:/);
assert.match(mobileDisplay, /const DECIMAL_PATTERN = \/\^\(-\?\)\(\\d\+\)/);
assert.doesNotMatch(materials, /Number\(line\.|parseFloat\(line\.|parseInt\(line\./);
const materialCardBody = materials.slice(materials.indexOf("function MaterialCard"), materials.indexOf("export default function WorkOrderMaterialsReadOnly"));
const materialSummaryBody = materialCardBody.slice(materialCardBody.indexOf("<Pressable"), materialCardBody.indexOf("testID=\"material-order-action-row\""));
assert.equal((materialSummaryBody.match(/<Pressable/g) ?? []).length, 1, "material summary card must not nest pressable controls");

assert.match(app, /const MATERIAL_CACHE_LIMIT = 6/);
assert.match(app, /materialCacheRef\.current\[workOrderId\]/);
assert.match(app, /if \(materialRequests\.current\.has\(workOrderId\)\) return/);
assert.match(app, /action === "initial" && existing && existing\.status !== "not-loaded"/);
assert.match(app, /action === "retry" && existing\?\.status !== "error"/);
assert.match(app, /materialSessionGeneration\.current !== sessionGeneration/);
assert.match(app, /materialRequests\.current\.get\(workOrderId\) !== requestToken/);
assert.match(app, /page\.workOrderId !== workOrderId/);
assert.match(app, /new Set\(merged\.map\(\(line\) => line\.id\)\)/);
assert.match(app, /materialCache\[detail\.header\.id\]/);
assert.match(app, /onOpenMaterials=\{\(\) => void loadMaterials\(detail\.header\.id, "initial"\)\}/);
assert.match(app, /onRetryMaterials=\{\(\) => void loadMaterials\(detail\.header\.id, "retry"\)\}/);
assert.match(app, /onLoadMoreMaterials=\{\(\) => void loadMaterials\(detail\.header\.id, "more"\)\}/);
for (const errorBoundary of ["status === 401", "status === 403", "status === 404", "status === 409"]) {
  assert.match(app, new RegExp(errorBoundary.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `error boundary missing: ${errorBoundary}`);
}
assert.doesNotMatch(app + materials, /setInterval|setTimeout\([^)]*getWorkOrderMaterials|polling/i);
assert.doesNotMatch(app + materials, /mockProductionCard|mockMaterial|productionCards/);
assert.doesNotMatch(materials, /console\.(?:log|debug|info|warn|error)/);
assert.equal((app.match(/console\.(?:log|debug|info|warn|error)/g) ?? []).length, 2, "only bounded save metrics may log in external QA");
assert.equal((app.match(/console\.info/g) ?? []).length, 2);
assert.match(app, /WAFL_MATERIAL_SAVE_METRIC/);
assert.match(app, /WAFL_OVERVIEW_SAVE_METRIC/);

const materialUiSlice = [materials, detail].join("\n");
assert.doesNotMatch(materials, /createWorkOrderMaterial|patchWorkOrderMaterial|POST|PUT|DELETE|order-request|order-cancel|order-complete/);
assert.doesNotMatch(materialUiSlice, /<Image\b|Image\s*from\s*["']react-native/);
assert.equal(mobilePackage.dependencies["@react-native-async-storage/async-storage"], undefined);

console.log("workorder v2 alpha.48 mobile materials real read contract: PASS");
