import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const importSource = (file) => import(pathToFileURL(path.join(root, file)).href);

const { calculateOrderQuantity, calculateMaterialAmount } = await importSource("apps/mobile/lib/mobileDisplay.ts");
const { reconcileQuantityCell, promoteSizeColorBundleVersion } = await importSource(
  "apps/mobile/features/work-orders/size-color/sizeColorReconciliation.ts",
);
const { isTailscaleServePathAllowed } = await importSource("lib/external-qa/configCore.mjs");
const { MOBILE_MATERIAL_CORE_FIELD_ORDER, MOBILE_MATERIAL_INVENTORY_USAGE_VISIBLE } = await importSource(
  "apps/mobile/features/materials/materialFieldPolicy.ts",
);
const {
  buildNamedSemanticMarker,
  createCompiledSemanticViews,
  inspectCompiledSemantic,
  serializeRuntimeResult,
} = await importSource("scripts/lib/alpha58-runtime-evidence.mjs");

assert.equal(calculateOrderQuantity({
  requiredQuantity: "10.5",
  allowanceQuantity: "1.25",
  inventoryUsageQuantity: "7",
}), "11.75");
assert.equal(calculateMaterialAmount("11.75", "2000"), "23500.00");

const bundle = {
  matrix: {
    workOrderId: "work-order",
    revisionId: "revision",
    sizes: [{ id: "size", code: "S", displayLabel: "S", displayOrder: 0 }],
    colors: [{ id: "color", displayName: "NAVY", hexValue: null, displayOrder: 0 }],
    quantityCells: [],
    matrixTotal: "0",
    expectedTotal: "3",
    totalsMatch: false,
    memoFallback: null,
    entityVersion: 4,
  },
  specifications: {
    workOrderId: "work-order",
    revisionId: "revision",
    measurementUnit: "cm",
    templateId: null,
    sizes: [],
    pomColumns: [],
    cells: [],
    entityVersion: 4,
  },
};
const reconciled = reconcileQuantityCell(bundle, "color", "size", 3);
assert.equal(reconciled.matrix.quantityCells.length, 1);
assert.equal(reconciled.matrix.matrixTotal, "3");
assert.equal(reconciled.matrix.totalsMatch, true);
const promoted = promoteSizeColorBundleVersion(reconciled, 5);
assert.equal(promoted.matrix.entityVersion, 5);
assert.equal(promoted.specifications.entityVersion, 5);

const uuid = "11111111-1111-4111-8111-111111111111";
const approvalEnv = {
  WAFL_EXTERNAL_QA_ALPHA59_SIZE_COLOR_STRUCTURE_MUTATION_ENABLED: "true",
  WAFL_V2_COMMAND_API_ENABLED: "1",
  WAFL_V2_COMMAND_MUTATION_APPROVED: "2.0.0-alpha.59-dev-test-size-color-structure-runtime",
  WAFL_RUNTIME_ENV: "dev",
};
const quantityPath = `/api/v2/work-orders/${uuid}/size-color/quantities/${uuid}/${uuid}`;
assert.equal(isTailscaleServePathAllowed(quantityPath, "PATCH", approvalEnv), true);
for (const method of ["GET", "POST", "PUT", "DELETE"]) {
  assert.equal(isTailscaleServePathAllowed(quantityPath, method, approvalEnv), false);
}
assert.equal(isTailscaleServePathAllowed(quantityPath, "PATCH", { ...approvalEnv, WAFL_SERVER_RUNTIME_MODE: "production" }), false);
const materialPath = `/api/v2/work-orders/${uuid}/materials/${uuid}`;
assert.equal(isTailscaleServePathAllowed(`/api/v2/work-orders/${uuid}/materials`, "POST", approvalEnv), true);
assert.equal(isTailscaleServePathAllowed(materialPath, "PATCH", approvalEnv), true);
assert.equal(isTailscaleServePathAllowed(`${materialPath}/order-request`, "POST", approvalEnv), true);
assert.equal(isTailscaleServePathAllowed(`${materialPath}/archive`, "POST", approvalEnv), false);
assert.equal(isTailscaleServePathAllowed(`${materialPath}/restore`, "POST", approvalEnv), false);

const overview = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
for (const copy of ["비용 구성", "원단", "부자재", "공정", "예상 1벌 원가", "예상 총원가"]) {
  assert.match(overview, new RegExp(copy));
}
for (const stale of ["원단 총액", "부자재 총액", "공정 총액", "한벌 단가", "총 예상"]) {
  assert.doesNotMatch(overview, new RegExp(stale));
}

const gallery = read("apps/mobile/features/work-orders/images/WorkOrderImageGallery.tsx");
assert.doesNotMatch(gallery, />대표 아님</);
assert.match(gallery, /\{memoLength\}자 \/ \{FACTORY_DELIVERY_MEMO_MAX_LENGTH\}자/);

const materialView = read("apps/mobile/features/materials/WorkOrderMaterialsReadOnly.tsx");
const materialEditor = read("apps/mobile/features/materials/WorkOrderMaterialEditor.tsx");
for (const source of [materialView, materialEditor]) {
  assert.doesNotMatch(source, /label="재고사용"|field="inventoryUsageQuantity"/);
}
assert.deepEqual(MOBILE_MATERIAL_CORE_FIELD_ORDER, [
  "partner", "colorOption", "requiredQuantity", "unitPrice", "allowanceQuantity",
]);
assert.equal(MOBILE_MATERIAL_INVENTORY_USAGE_VISIBLE, false);

const quantityRoute = read("app/api/v2/work-orders/[workOrderId]/size-color/quantities/[colorId]/[sizeRowId]/route.ts");
assert.match(quantityRoute, /handleUpsertColorSizeQuantityV2/);
assert.doesNotMatch(quantityRoute, /\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b/i);
const repository = read("lib/domain/work-orders/command/sizeColorStructureCommandRepository.ts");
for (const marker of [
  "COLOR_SIZE_QUANTITY_UPSERT_COMMAND_CODE",
  "color_size_quantities",
  "current_revision_id",
  "work_order_command_receipts",
  "domain_events",
  "advanceVersions",
]) {
  assert.match(repository, new RegExp(marker));
}
assert.match(repository, /projectionPlan\.semantic === "no-op"/);
assert.match(repository, /projectionPlan\.semantic === "reconcile"/);
const materialRepository = read("lib/domain/work-orders/command/materialCommandRepository.ts");
const canonicalFormula = materialRepository.slice(
  materialRepository.indexOf("function canonicalOrderQuantity"),
  materialRepository.indexOf("function assertMaterialOrderReady"),
);
assert.match(canonicalFormula, /scaled\(input\.requiredQuantity\) \+ scaled\(input\.allowanceQuantity\)/);
assert.doesNotMatch(canonicalFormula, /- scaled\(input\.inventoryUsageQuantity\)/);

const readController = read("apps/mobile/features/work-orders/size-color/useSizeColorReadController.ts");
assert.match(readController, /status: action === "retry" \? "retrying" : action === "refresh" \? "refreshing"/);
assert.match(readController, /reconcileMutation/);
const readView = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorReadOnly.tsx");
assert.match(readView, /onSetQuantity/);
assert.match(readView, /!\s*state\.bundle/);
assert.match(readView, /색상값|QuantityCellEditor/);

const runtimeQa = read("scripts/run-wafl-v2-alpha59-size-color-structure-runtime-qa.mjs");
for (const marker of [
  "PRIMARY_DRAFT_PRODUCT",
  "quantityCreateUpdateRead",
  "materialCreatePatchFormula",
  "accessoryCreatePatchFormula",
  "nonzeroInventoryUseRows",
  "cleanupSyntheticQuantity",
  "cleanupSyntheticMaterials",
  "historicalRequestedCompletedCancelledMutation: 0",
  "userCreatedQaRowsDeletedOrRewritten: 0",
  "ALPHA59_CARET_MATRIX_TOTAL_IPHONE_REQA_REQUIRED",
]) {
  assert.match(runtimeQa, new RegExp(marker));
}
assert.ok(
  runtimeQa.indexOf("const before = await snapshot") < runtimeQa.indexOf("const sizeCreateIdentity"),
  "before snapshot must precede every exact synthetic write",
);

const compiledFixture = [
  'function wrapped(){return "\\ube44\\uc6a9"+" "+"\\uad6c\\uc131"}',
  'const counter=n+"\\uc790"+" / "+500+"\\uc790";',
  'const optional="\\uc0c9\\uc0c1\\uac12"+"("+"\\uc120\\ud0dd"+")";',
].join("\n");
const compiledViews = createCompiledSemanticViews(compiledFixture);
assert.equal(inspectCompiledSemantic(compiledViews, "비용 구성").passed, true);
assert.equal(inspectCompiledSemantic(compiledViews, ["자", "/", "500", "자"], { maxGap: 24 }).passed, true);
assert.equal(inspectCompiledSemantic(compiledViews, "색상값(선택)").passed, true);
assert.equal(inspectCompiledSemantic(compiledViews, "대표 아님").passed, false);
const namedMarker = buildNamedSemanticMarker({
  key: "fixture",
  meaning: "compiled representation normalization",
  source: "contract fixture",
  expectedSemantic: "비용 구성",
  normalizedCompiledCheck: "unicode and concatenation neutral",
  passed: true,
  normalizedEvidence: "비용구성",
  absenceReason: null,
});
assert.deepEqual(Object.keys(namedMarker), [
  "key",
  "meaning",
  "source",
  "expectedSemantic",
  "normalizedCompiledCheck",
  "passed",
  "normalizedEvidence",
  "absenceReason",
]);
assert.match(serializeRuntimeResult({ markerMap: { fixture: namedMarker } }), /"markerMap"/);

for (const markerKey of [
  "costCompositionHierarchy",
  "nonRepresentativeVisibleCopyAbsent",
  "factoryMemoCounter",
  "draftQuantityCellEdit",
  "issuedQuantityMatrixReadOnly",
  "loadingStateSeparation",
  "readOnlyColorValues",
  "materialAccessoryFieldOrder",
  "mobileInventoryUseHidden",
  "requiredPlusAllowanceCalculation",
  "productionBlocked",
]) {
  assert.match(runtimeQa, new RegExp(`key: "${markerKey}"`));
}
for (const evidenceField of [
  "meaning",
  "source",
  "expectedSemantic",
  "normalizedCompiledCheck",
  "normalizedEvidence",
  "absenceReason",
]) {
  assert.match(runtimeQa, new RegExp(evidenceField));
}
assert.match(runtimeQa, /const logIssues = logIssueCounts\(state\)/);
assert.match(runtimeQa, /appendOnlyLedger/);
assert.match(runtimeQa, /failedMarkerKeys/);
assert.match(runtimeQa, /runtimeGateFailures/);
assert.ok(
  runtimeQa.indexOf("fs.writeFileSync(RESULT_PATH") < runtimeQa.indexOf("runtimeGateFailures.length,\n      0,"),
  "marker map, cleanup, and log evidence must serialize before the aggregate final assertion",
);
assert.doesNotMatch(runtimeQa, /assert\.ok\(Object\.values\(markers\)\.every\(Boolean\)/);

console.log("workorder-v2 alpha.59 QA remediation contract: PASS");
