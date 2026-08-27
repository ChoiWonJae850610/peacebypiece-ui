import assert from "node:assert/strict";
import fs from "node:fs";
import { readMobileApiSource } from "./helpers/mobile-api-source.mjs";
import path from "node:path";

import { resolveMaterialOrderPolicy } from "../apps/mobile/domain/materialOrderPolicy.ts";
import { WORK_ORDER_LOADING_MESSAGES } from "../apps/mobile/features/work-orders/loading/delayedLoadingPolicy.ts";
import { resolveWorkOrderTabVisualState } from "../apps/mobile/features/work-orders/overview/workOrderDetailPresentation.ts";
import { normalizeMaterialLine } from "../apps/mobile/lib/apiResponseNormalizer.ts";
import { isExternalQaPathAllowed, isTailscaleServePathAllowed } from "../lib/external-qa/configCore.mjs";
import { assertCanonicalWaflVersionConsistency } from "./helpers/wafl-v2-current-version.mjs";

const read = (relativePath) => fs.readFileSync(path.resolve(relativePath), "utf8");
const json = (relativePath) => JSON.parse(read(relativePath));

assertCanonicalWaflVersionConsistency();
const mobilePackage = json("apps/mobile/package.json");
const appJson = json("apps/mobile/app.json");
const easJson = json("apps/mobile/eas.json");
const detail = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const materials = read("apps/mobile/features/materials/WorkOrderMaterialsReadOnly.tsx");
const app = [
  read("apps/mobile/features/MobileWorkOrderExperience.tsx"),
  read("apps/mobile/features/materials/useWorkOrderMaterialAuthoringController.ts"),
].join("\n");
const apiClient = readMobileApiSource();
const apiResponseNormalizer = read("apps/mobile/lib/apiResponseNormalizer.ts");
const apiTypes = read("apps/mobile/domain/mobileContract.ts");
const mobileDisplay = read("apps/mobile/lib/mobileDisplay.ts");
const route = read("app/api/v2/work-orders/[workOrderId]/materials/route.ts");
const detailRead = read("lib/domain/work-orders/read/detailRoute.ts");
const detailService = read("lib/domain/work-orders/read/detailService.ts");
const externalQa = read("lib/external-qa/configCore.mjs");
const materialCache = read("apps/mobile/features/materials/materialCache.ts");
const errorPresentation = read("apps/mobile/application/errorPresentation.ts");
const materialOrderPolicy = read("apps/mobile/domain/materialOrderPolicy.ts");

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
assert.match(apiTypes, /MaterialType = "fabric" \| "accessory"/);
for (const field of [
  "name", "colorOption", "usageArea", "requiredQuantity", "allowanceQuantity", "inventoryUsageQuantity",
  "orderQuantity", "unitCode", "currency", "unitPrice", "amount", "memo", "status", "displayOrder", "locked",
]) assert.match(apiTypes, new RegExp(`readonly ${field}`), `material API field missing: ${field}`);
assert.doesNotMatch(apiTypes, /\[key:\s*string\]|:\s*any\b/);

assert.match(apiClient, /export async function getWorkOrderMaterials/);
assert.match(apiClient, /type: materialType, lifecycle, limit: "30"/);
assert.match(apiClient, /method: "GET"/);
assert.match(apiClient, /body\.data\.workOrderId !== workOrderId/);
assert.match(apiResponseNormalizer, /const DECIMAL_PATTERN/);
assert.match(apiResponseNormalizer, /decimalFields\.some\(\(field\) => typeof field !== "string" \|\| !DECIMAL_PATTERN\.test\(field\)\)/);
assert.match(apiClient, /from "\.\/apiResponseNormalizer"/);
assert.match(apiClient, /body\.data\.items\.map\(normalizeMaterialLine\)/);
assert.doesNotMatch(apiClient, /const DECIMAL_PATTERN/);
const normalizedMaterial = normalizeMaterialLine({
  id: "22222222-2222-4222-8222-222222222222",
  materialType: "fabric",
  name: "Cotton",
  requiredQuantity: "10.000",
  allowanceQuantity: "0.500",
  inventoryUsageQuantity: "0.000",
  orderQuantity: "10.500",
  unitCode: "yd",
  currency: "KRW",
  unitPrice: "15000.00",
  amount: "157500.00",
  status: "editing",
  displayOrder: 1,
  editable: true,
  locked: false,
  deletable: true,
  lifecycle: "active",
  archivedAt: null,
});
assert.ok(normalizedMaterial);
assert.equal(normalizedMaterial.colorOption, null);
assert.equal(normalizedMaterial.usageArea, null);
assert.equal(normalizedMaterial.memo, null);
assert.equal(normalizeMaterialLine({ ...normalizedMaterial, materialType: "accessory" })?.materialType, "accessory");
assert.equal(normalizeMaterialLine({ ...normalizedMaterial, requiredQuantity: "10.0.0" }), null);
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
assert.match(detail, /id: "materials", label: "원부자재"/);
assert.match(detail, /<WaflMaterialsCategorySwitch/);
assert.match(detail, /renderMaterialSection\(activeMaterialCategory\)/);
assert.match(detail, /props\.onOpenMaterials\(resolved\.materialFocus \?\? undefined\)/);
assert.equal(resolveWorkOrderTabVisualState({ selected: false, locked: true }), "locked");
assert.equal(resolveWorkOrderTabVisualState({ selected: false, locked: false }), "inactive");
assert.match(detail, /disabled=\{disabled\}/);
for (const visibleTab of ["media", "sizes", "materials", "output"]) {
  assert.match(detail, new RegExp(`id: "${visibleTab}"`), `visible tab missing: ${visibleTab}`);
}
assert.match(detail, /WorkOrderMaterialsReadOnly/);
assert.match(detail, /key=\{props\.materialIdentityKeys\[materialType\]\}/);
assert.doesNotMatch(detail, /mockProductionCard|constants\/mockProductionCard/);

for (const state of ["not-loaded", "loading", "loaded", "empty", "error", "retrying", "loading-more"]) {
  assert.match(materials + app, new RegExp(`"${state}"`), `material state missing: ${state}`);
}
assert.match(materials, /materialType === "accessory" \? "부자재" : "원단"/);
assert.equal(WORK_ORDER_LOADING_MESSAGES.fabric, "원단 정보를 불러오는 중입니다.");
assert.equal(WORK_ORDER_LOADING_MESSAGES.accessory, "부자재 정보를 불러오는 중입니다.");
assert.match(materials, /scope=\{materialType\}/);
assert.match(materials, /등록된 \{materialSubject\}/);
assert.match(materials, /\$\{materialLabel\} 정보를 불러오지 못했습니다/);
assert.match(materials, /다시 시도/);
assert.match(materials, /더 보기/);
assert.match(materials, /expandedIds\.has\(line\.id\)/);
assert.match(materials, /exactHexColor\(line\.colorOption\)/);
for (const label of ["materialNameLabel", "사용부위", "필요수량", "발주수량", "로스·여유", "단가", "금액", "메모"]) {
  assert.match(materials, new RegExp(label), `material display missing: ${label}`);
}
assert.doesNotMatch(materials, /재고사용/);
assert.match(read("docs/project/app-v2/47-mobile-materials-real-read-evidence.md"), /재고사용/);
for (const status of ["발주 전", "발주요청", "발주완료", "과거 취소", "상태 확인 필요"]) {
  assert.match(materialOrderPolicy, new RegExp(status), `material status label missing: ${status}`);
}
assert.match(materials, /card: \{[^\n]*borderLeftWidth: WAFL_THEME\.accentCard\.width[^\n]*borderRadius: WAFL_THEME\.radius\.cardCompact/);
for (const accent of ["cardEditing", "cardRequested", "cardCompleted", "cardCancelled", "cardUnknown"]) {
  assert.match(materials, new RegExp(`${accent}: \\{[^\\n]*borderLeftColor`), `material status accent missing: ${accent}`);
}
for (const badge of ["statusBadgeEditing", "statusBadgeRequested", "statusBadgeCompleted", "statusBadgeCancelled", "statusBadgeUnknown"]) {
  assert.match(materials, new RegExp(`${badge}: \\{[^\\n]*backgroundColor`), `material status badge tone missing: ${badge}`);
}
assert.match(materials, /materialIdentity[\s\S]{0,1800}headerBadgeCluster[\s\S]{0,500}unitChip[\s\S]{0,500}statusBadge/);
assert.match(materials, /testID="material-core-row"[\s\S]{0,1600}MOBILE_MATERIAL_FIELD_LABELS\.partner[\s\S]{0,1600}line\.partnerId[\s\S]{0,1600}>색상·옵션</);
assert.match(materials, /MaterialPartnerPickerSheet/);
assert.equal((materials.match(/label="필요수량"/g) ?? []).length, 1, "필요수량 must keep one geometry-neutral compact slot");
assert.doesNotMatch(materials, /material-quantity-row-expanded|activeQuantityField/, "quantity editing must not expand the material card");
assert.match(materials, /testID="material-core-row"[\s\S]{0,2600}label="필요수량"[\s\S]{0,2600}label="단가"[\s\S]{0,2600}label="로스·여유"/);
const usageAreaFieldIndex = materials.search(
  /field\s*=\s*["']usageArea["']\s+label\s*=\s*["']사용부위["']/,
);
const memoFieldIndex = materials.search(
  /field\s*=\s*["']memo["']\s+label\s*=\s*["']메모["']/,
);
assert.ok(usageAreaFieldIndex >= 0, "material usage-area field must remain present");
assert.ok(memoFieldIndex >= 0, "material memo field must remain present");
assert.ok(usageAreaFieldIndex < memoFieldIndex, "material usage-area field must precede the memo field");
assert.match(materials, /testID="material-order-action-row"[\s\S]{0,1200}testID="material-order-summary-lines"[\s\S]{0,800}발주수량[\s\S]{0,500}단가[\s\S]{0,500}testID="material-order-summary-amount"[\s\S]{0,300}금액/);
assert.match(materials, /materialOrderActionRow: \{[^\n]*flexDirection: "row"[^\n]*minHeight: 38[^\n]*paddingVertical: 4/);
assert.match(materials, /materialOrderLineStack: \{[^\n]*flex: 1[^\n]*minWidth: 0/);
assert.match(materials, /materialOrderActions: \{[^\n]*flexDirection: "row"[^\n]*flexShrink: 0/);
assert.match(materials, /MATERIAL_ORDER_ACTION_VIEW[\s\S]{0,900}request:[\s\S]{0,240}caption: "발주"[\s\S]{0,300}complete:[\s\S]{0,240}caption: "완료"[\s\S]{0,300}cancel:[\s\S]{0,240}caption: "취소"/);
const materialOrderActionButton = materials.slice(materials.indexOf("function MaterialOrderActionButton"), materials.indexOf("function MaterialCard"));
assert.match(materialOrderActionButton, /<WaflCompactCardAction/u);
assert.match(materialOrderActionButton, /onPress=\{onPress\}/);
const compactCardAction = fs.readFileSync("apps/mobile/features/layout/WaflCompactEntityCard.tsx", "utf8");
assert.match(compactCardAction, /accessibilityRole="button"/u);
assert.match(compactCardAction, /accessibilityState=\{\{ busy, disabled: busy \}\}/u);
assert.match(compactCardAction, /disabled=\{busy\}/u);
assert.match(materials, /orderPolicy\.actions\.map/);
assert.match(materials, /actions\.map\(\(action\) =>/);
assert.match(materials, /onPress=\{\(\) => onOrderAction\(action\.kind\)\}/);
const legacyCancelledPolicy = resolveMaterialOrderPolicy({
  status: "cancelled",
  lifecycle: "active",
  currentDraft: true,
  serverLocked: true,
  canUpdate: true,
  canRequestOrder: true,
  canCompleteOrder: true,
});
assert.equal(legacyCancelledPolicy.label, "과거 취소");
assert.equal(legacyCancelledPolicy.locked, true);
assert.equal(legacyCancelledPolicy.canEdit, false);
assert.deepEqual(legacyCancelledPolicy.actions, []);
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
assert.match(materialCardBody, /return \(\s*<WaflCompactEntityCard style=\{materialAccent\(orderPolicy\.tone\)\}>/);
assert.match(materialSummaryBody, /accessibilityState=\{\{ expanded \}\}[\s\S]{0,240}onPress=\{onToggle\}/);
assert.match(materialSummaryBody, /testID="material-memo-disclosure"/);

assert.match(materialCache, /const MATERIAL_CACHE_LIMIT = 12/);
assert.match(materialCache, /materialCacheKey\(workOrderId: string, materialType: MaterialType\)/);
assert.match(app, /materialCacheRef\.current\[cacheKey\]/);
assert.match(app, /if \(materialRequests\.current\.has\(cacheKey\)\) return/);
assert.match(app, /action === "initial" && existing && existing\.status !== "not-loaded"/);
assert.match(app, /action === "retry" && existing\?\.status !== "error"/);
assert.match(app, /materialSessionGeneration\.current !== sessionGeneration/);
assert.match(app, /materialRequests\.current\.get\(cacheKey\) !== requestToken/);
assert.match(app, /page\.workOrderId !== workOrderId/);
assert.match(app, /page\.materialType !== materialType/);
assert.match(app, /new Set\(merged\.map\(\(line\) => line\.id\)\)/);
assert.match(app, /materialCache\[materialCacheKey\(detail\.header\.id, "fabric"\)\]/);
assert.match(app, /materialCache\[materialCacheKey\(detail\.header\.id, "accessory"\)\]/);
assert.match(app, /onOpenMaterials=\{\(materialFocus\) =>/);
assert.match(app, /materialAuthoring\.loadMaterials\(detail\.header\.id, "fabric", "initial"\)/);
assert.match(app, /materialAuthoring\.loadMaterials\(detail\.header\.id, "accessory", "initial"\)/);
assert.match(app, /onRetryMaterials=\{\(materialType\) => void materialAuthoring\.loadMaterials\(detail\.header\.id, materialType, "retry"\)\}/);
assert.match(app, /onLoadMoreMaterials=\{\(materialType\) => void materialAuthoring\.loadMaterials\(detail\.header\.id, materialType, "more"\)\}/);
for (const errorBoundary of ["status === 401", "status === 403", "status === 404", "status === 409"]) {
  assert.match(`${app}\n${errorPresentation}`, new RegExp(errorBoundary.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `error boundary missing: ${errorBoundary}`);
}
assert.doesNotMatch(app + materials, /setInterval|setTimeout\([^)]*getWorkOrderMaterials|polling/i);
assert.doesNotMatch(app + materials, /mockProductionCard|mockMaterial|productionCards/);
assert.doesNotMatch(materials, /console\.(?:log|debug|info|warn|error)/);
assert.equal((app.match(/console\.(?:log|debug|info|warn|error)/g) ?? []).length, 1, "only the bounded overview save metric may log in external QA");
assert.equal((app.match(/console\.info/g) ?? []).length, 1);
assert.match(app, /WAFL_OVERVIEW_SAVE_METRIC/);

const materialUiSlice = [materials, detail].join("\n");
assert.doesNotMatch(materials, /createWorkOrderMaterial|patchWorkOrderMaterial|POST|PUT|DELETE|order-request|order-cancel|order-complete/);
assert.doesNotMatch(materialUiSlice, /<Image\b|Image\s*from\s*["']react-native/);
assert.equal(mobilePackage.dependencies["@react-native-async-storage/async-storage"], undefined);

console.log("workorder v2 alpha.48 mobile materials real read contract: PASS");
