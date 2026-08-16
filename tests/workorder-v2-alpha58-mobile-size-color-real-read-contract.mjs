import assert from "node:assert/strict";
import fs from "node:fs";
import { readMobileApiSource } from "./helpers/mobile-api-source.mjs";
import path from "node:path";

import { assertCanonicalWaflVersionConsistency } from "./helpers/wafl-v2-current-version.mjs";
import { isExternalQaPathAllowed, isTailscaleServePathAllowed } from "../lib/external-qa/configCore.mjs";
import {
  displayMeasurement,
  normalizeSameUnitCentimeterDisplay,
} from "../apps/mobile/features/work-orders/size-color/sizeColorDisplayModel.ts";
import {
  isSizeColorResponseCommitAllowed,
  readConsistentSizeColorBundle,
  shouldStartSizeColorRequest,
  sizeColorRequestKey,
} from "../apps/mobile/features/work-orders/size-color/sizeColorQueryPolicy.ts";
import {
  putBoundedSizeColorEntry,
} from "../apps/mobile/features/work-orders/size-color/sizeColorCache.ts";
import {
  WORK_ORDER_LOADING_MESSAGES,
} from "../apps/mobile/features/work-orders/loading/delayedLoadingPolicy.ts";
import {
  readOnlyBadgeLabel,
  resolveWorkOrderTabVisualState,
} from "../apps/mobile/features/work-orders/overview/workOrderDetailPresentation.ts";

const read = (relativePath) => fs.readFileSync(path.resolve(relativePath), "utf8");

assertCanonicalWaflVersionConsistency();

const contract = read("apps/mobile/domain/mobileContract.ts");
const apiClient = readMobileApiSource();
const controller = read("apps/mobile/features/work-orders/workOrderQueryController.ts");
const frozenAxisTable = read("apps/mobile/features/layout/WaflFrozenAxisTable.tsx");
const experience = [
  read("apps/mobile/features/MobileWorkOrderExperience.tsx"),
  read("apps/mobile/features/work-orders/size-color/useWorkOrderSizeSpecCoordination.ts"),
].join("\n");
const detail = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const cache = read("apps/mobile/features/work-orders/size-color/sizeColorCache.ts");
const queryPolicy = read("apps/mobile/features/work-orders/size-color/sizeColorQueryPolicy.ts");
const sizeColorController = read("apps/mobile/features/work-orders/size-color/useSizeColorReadController.ts");
const component = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorReadOnly.tsx");
const runtimeQa = read("scripts/run-wafl-v2-alpha58-size-color-real-read-runtime-qa.mjs");
const runtimeSnapshot = read("scripts/lib/alpha58-readonly-snapshot.mjs");
const runtimeEvidence = read("scripts/lib/alpha58-runtime-evidence.mjs");
const workOrderId = "11111111-2222-4333-8444-555555555555";
const sizeColorPath = `/api/v2/work-orders/${workOrderId}/size-color`;
const sizeSpecPath = `/api/v2/work-orders/${workOrderId}/size-spec`;

for (const pathname of [sizeColorPath, sizeSpecPath]) {
  assert.equal(isTailscaleServePathAllowed(pathname, "GET", {}), true, `GET ${pathname}`);
  for (const method of ["POST", "PUT", "PATCH", "DELETE", "HEAD"]) {
    assert.equal(isTailscaleServePathAllowed(pathname, method, {}), false, `${method} ${pathname}`);
  }
  assert.equal(isExternalQaPathAllowed(pathname, "GET", {}), false, "Quick Tunnel must not expose business reads");
}
for (const pathname of [
  "/api/v2/work-orders/not-a-uuid/size-color",
  "/api/v2/work-orders/11111111-2222-4333-8444-55555555555/size-spec",
  `${sizeColorPath}/extra`,
  `${sizeSpecPath}/history`,
  `/api/v2/work-orders/${workOrderId}/processes`,
  `/api/v2/work-orders/${workOrderId}/history`,
]) assert.equal(isTailscaleServePathAllowed(pathname, "GET", {}), false, `blocked nested path: ${pathname}`);
assert.equal(isTailscaleServePathAllowed(`/api/v2/work-orders/${workOrderId}/documents`, "GET", {}), true, "current document read capability remains available");

for (const typeName of [
  "WorkOrderSizeRow",
  "WorkOrderColorRow",
  "WorkOrderQuantityCell",
  "WorkOrderSizeColorMatrix",
  "WorkOrderPomColumn",
  "WorkOrderSizeSpecCell",
  "WorkOrderSizeSpec",
  "WorkOrderSizeColorBundle",
]) assert.match(contract, new RegExp(`export type ${typeName}\\b`), `mobile contract missing ${typeName}`);

assert.match(apiClient, /export async function getWorkOrderSizeColor\(workOrderId: string\)/);
assert.match(apiClient, /`\/api\/v2\/work-orders\/\$\{encodeURIComponent\(workOrderId\)\}\/size-color`[\s\S]*method: "GET"/);
assert.match(apiClient, /export async function getWorkOrderSizeSpec\(workOrderId: string\)/);
assert.match(apiClient, /`\/api\/v2\/work-orders\/\$\{encodeURIComponent\(workOrderId\)\}\/size-spec`[\s\S]*method: "GET"/);
for (const validationMeaning of [
  "value.workOrderId !== workOrderId",
  "isNonEmptyString(value.revisionId)",
  "isNonNegativeSafeInteger(value.entityVersion)",
  "COLOR_HEX_PATTERN",
  "isDecimalString",
  "cellKeys.has(key)",
  "sizeIds.has(candidate.sizeRowId)",
  "colorIds.has(candidate.colorId)",
  "pomIds.has(candidate.pomColumnId)",
  'value.measurementUnit === "cm"',
  'value.measurementUnit === "inch"',
  'code: "MALFORMED_RESPONSE"',
]) assert.ok(apiClient.includes(validationMeaning), `strict response validation missing: ${validationMeaning}`);

const sizeReadClient = apiClient.slice(
  apiClient.indexOf("export async function getWorkOrderSizeColor"),
  apiClient.indexOf("export async function getWorkOrderStructureOptions"),
);
assert.doesNotMatch(sizeReadClient, /method: "(POST|PATCH|PUT|DELETE)"/);
assert.doesNotMatch(sizeReadClient, /patchWorkOrderSize|deleteWorkOrderSize|createWorkOrderSize/i);

assert.match(controller, /sizeColor\(workOrderId: string\)[\s\S]*getWorkOrderSizeColor/);
assert.match(controller, /sizeSpec\(workOrderId: string\)[\s\S]*getWorkOrderSizeSpec/);
const selectItem = experience.slice(experience.indexOf("async function selectItem"), experience.indexOf("function clearDetailAndReturnToList"));
assert.doesNotMatch(selectItem, /\.sizeColor\(|\.sizeSpec\(/, "detail open must not eager-load size/color");
assert.match(experience, /useSizeColorReadController/);
assert.doesNotMatch(experience, /sizeColorCacheRef|sizeColorRequests|sizeColorRequestSequence|sizeColorSessionGeneration/);
assert.match(queryPolicy, /readConsistentSizeColorBundle/);
assert.match(sizeColorController, /workOrderQueryController\.sizeColor/);
assert.match(sizeColorController, /workOrderQueryController\.sizeSpec/);

assert.notEqual(sizeColorRequestKey(workOrderId, 1), sizeColorRequestKey(workOrderId, 2));
assert.equal(shouldStartSizeColorRequest("initial", "not-loaded", false), true);
assert.equal(shouldStartSizeColorRequest("initial", "loaded", false), false);
assert.equal(shouldStartSizeColorRequest("retry", "error", false), true);
assert.equal(shouldStartSizeColorRequest("initial", "not-loaded", true), false);
const requestIdentity = {
  workOrderId,
  entityVersion: 2,
  cacheKey: sizeColorRequestKey(workOrderId, 2),
  requestToken: 1,
  sessionGeneration: 1,
};
assert.equal(isSizeColorResponseCommitAllowed(requestIdentity, {
  selectedWorkOrderId: workOrderId,
  selectedEntityVersion: 2,
  activeRequestToken: 1,
  sessionGeneration: 1,
}), true);
assert.equal(isSizeColorResponseCommitAllowed(requestIdentity, {
  selectedWorkOrderId: workOrderId,
  selectedEntityVersion: 3,
  activeRequestToken: 1,
  sessionGeneration: 1,
}), false);
const revisionId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
let commandCalls = 0;
const consistentBundle = await readConsistentSizeColorBundle({
  workOrderId,
  expectedEntityVersion: 2,
  readMatrix: async () => ({ workOrderId, revisionId, entityVersion: 2, expectedTotal: 15, totalsMatch: true }),
  readSpecifications: async () => ({ workOrderId, revisionId, entityVersion: 2 }),
});
assert.equal(consistentBundle.matrix.expectedTotal, 15);
assert.equal(consistentBundle.matrix.totalsMatch, true);
assert.equal(commandCalls, 0);

let boundedCache = {};
for (let index = 0; index < 7; index += 1) {
  boundedCache = putBoundedSizeColorEntry(boundedCache, `key-${index}`, {
    status: "loaded",
    bundle: null,
    errorMessage: null,
    touchedAt: index,
  });
}
assert.equal(Object.keys(boundedCache).length, 6);
assert.equal("key-0" in boundedCache, false);
assert.match(cache, /"not-loaded" \| "loading" \| "retrying" \| "refreshing" \| "empty" \| "loaded" \| "error"/);

assert.match(detail, /tab\.id === "sizes"/);
assert.match(detail, /openSection\("sizes"\)/);
assert.match(detail, /props\.sizeColor\.onOpen\(\)/);
assert.match(detail, /import WorkOrderSizeColorStructureEditor from/);
const sizeColorEditor = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx");
assert.match(sizeColorEditor, /import WorkOrderSizeColorReadOnly from/);
assert.equal(resolveWorkOrderTabVisualState({ selected: false, locked: true }), "locked");
assert.equal(resolveWorkOrderTabVisualState({ selected: true, locked: false }), "active");
assert.equal(readOnlyBadgeLabel(false), "읽기 전용");
assert.equal(readOnlyBadgeLabel(true), null);
assert.doesNotMatch(detail, /locked=\{locked\}/, "current cumulative Maker tabs must not inherit the old flow/output lock");
assert.doesNotMatch(detail, /제작과 문서는 다음 단계에서 연결합니다/);
assert.equal(WORK_ORDER_LOADING_MESSAGES.sizeColor, "사이즈·색상 정보를 불러오는 중입니다.");

for (const stateMeaning of [
  "다시 시도",
  "등록된 사이즈와 색상이 없습니다",
  "색상은 있지만 등록된 사이즈",
  "사이즈는 있지만 등록된 색상",
  "색상×사이즈",
  "저장된 총수량",
  "완성 스펙",
  "기존 수량 메모",
]) assert.ok(component.includes(stateMeaning), `read-only UI meaning missing: ${stateMeaning}`);
assert.doesNotMatch(component, /합계 일치|색상×사이즈 생산수량 · 총/);
assert.match(component, /<WaflFrozenAxisTable/);
assert.match(frozenAxisTable, /<ScrollView horizontal/);

const measurementCell = (decimalValue, displayValue = decimalValue) => ({
  sizeRowId: "size-1",
  pomColumnId: "pom-1",
  decimalValue,
  displayValue,
});
assert.equal(normalizeSameUnitCentimeterDisplay("50.0000"), "50");
assert.equal(normalizeSameUnitCentimeterDisplay("50.5000"), "50.5");
assert.equal(normalizeSameUnitCentimeterDisplay("50.2500"), "50.25");
assert.equal(normalizeSameUnitCentimeterDisplay("50.1250"), "50.125");
assert.equal(normalizeSameUnitCentimeterDisplay("0.0000"), "0");
assert.equal(normalizeSameUnitCentimeterDisplay("50.1234000"), "50.1234");
assert.equal(normalizeSameUnitCentimeterDisplay("50.1251"), "50.1251");
assert.equal(normalizeSameUnitCentimeterDisplay("31.75 cm"), "31.75 cm");
assert.equal(normalizeSameUnitCentimeterDisplay("1/8"), "1/8");
assert.equal(normalizeSameUnitCentimeterDisplay(""), "-");
assert.equal(normalizeSameUnitCentimeterDisplay(undefined), "-");
assert.equal(displayMeasurement(measurementCell("50.0000"), "cm", "cm"), "50");
assert.equal(displayMeasurement(measurementCell("50.5000"), "cm", "cm"), "50.5");
assert.equal(displayMeasurement(measurementCell("50.2500"), "cm", "cm"), "50.25");
assert.equal(displayMeasurement(measurementCell("50.1250"), "cm", "cm"), "50.125");
assert.equal(displayMeasurement(measurementCell("31.75", "31.75 cm"), "cm", "cm"), "31.75 cm");
assert.equal(displayMeasurement(measurementCell("0.125", "1/8"), "inch", "inch"), "1/8");
assert.equal(displayMeasurement(measurementCell("2.54"), "cm", "inch"), "1");
assert.equal(displayMeasurement(measurementCell("1"), "cm", "inch"), "3/8");
assert.equal(displayMeasurement(measurementCell("31.75"), "cm", "inch"), "12 1/2");
assert.equal(displayMeasurement(measurementCell("1"), "inch", "cm"), "2.5");
assert.equal(displayMeasurement(measurementCell("12.5"), "inch", "cm"), "31.8");
assert.equal(displayMeasurement(undefined, "cm", "inch"), "-");

assert.ok(component.includes("완성 스펙 표시 단위"));
assert.ok(component.includes("단위를 변경하면 화면에 즉시 반영되고 작업지시서에 저장됩니다."));
const componentImports = component.match(/^import .*$/gm)?.join("\n") ?? "";
assert.doesNotMatch(componentImports, /workOrderQueryController|fetch|axios/i);
assert.match(componentImports, /getMeasurementTemplates, patchCompanyMeasurementTemplate/);
assert.match(component, /edit\?\.canEdit/);
assert.match(component, /edit\?\.canEdit \? <QuantityCellEditor[\s\S]*: <Text/);
assert.doesNotMatch(component, /AsyncStorage|SecureStore|fetch\(|axios/i);
const boundarySource = sizeColorController.slice(
  sizeColorController.indexOf("export type SizeColorReadBoundary"),
  sizeColorController.indexOf("type ActiveIdentity"),
);
assert.doesNotMatch(boundarySource, /save|edit|add|delete|create|update|mutation/i);
assert.match(runtimeSnapshot, /BEGIN READ ONLY/);
assert.ok(runtimeQa.indexOf("const before = await snapshotSizeColorTables") < runtimeQa.indexOf('routeKind: "size-color-target"'));
assert.match(runtimeQa, /mutationMode, "read-only"/);
assert.match(runtimeQa, /commandApi, "blocked"/);
assert.match(runtimeQa, /workOrderVersionDelta: 0/);
assert.match(runtimeQa, /sizeColorSpecTableDelta: 0/);
assert.match(runtimeQa, /리넨 라운드 셔츠 원피스/);
assert.match(runtimeQa, /ALPHA58_FINAL_UX_CLEANUP_IPHONE_REQA_REQUIRED/);
assert.match(runtimeQa, /verifyMeasurementConversionContract/);
assert.match(runtimeQa, /serializeMutationObservation/);
assert.match(runtimeEvidence, /status: "NOT_OBSERVED"/);
assert.doesNotMatch(runtimeQa, /r2PutDelete:\s*0|productionMutation:\s*0/);
assert.doesNotMatch(runtimeQa, /INSERT|UPDATE|DELETE FROM|COMMIT.*mutation|method: "(PUT|PATCH|DELETE)"/);

console.log("workorder v2 alpha.58 mobile size/color real read contract: PASS");
