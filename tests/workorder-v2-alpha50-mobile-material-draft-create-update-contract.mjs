#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { isTailscaleServePathAllowed } from "../lib/external-qa/configCore.mjs";
import { assertCanonicalWaflVersionConsistency } from "./helpers/wafl-v2-current-version.mjs";

const read = (relativePath) => fs.readFileSync(path.resolve(relativePath), "utf8");
const json = (relativePath) => JSON.parse(read(relativePath));

assertCanonicalWaflVersionConsistency();
const mobilePackage = json("apps/mobile/package.json");
const appJson = json("apps/mobile/app.json");
const easJson = json("apps/mobile/eas.json");
const app = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const detail = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const materials = read("apps/mobile/features/materials/WorkOrderMaterialsReadOnly.tsx");
const editor = read("apps/mobile/features/materials/WorkOrderMaterialEditor.tsx");
const apiClient = read("apps/mobile/lib/apiClient.ts");
const apiTypes = read("apps/mobile/domain/mobileContract.ts");
const mobileValidation = read("apps/mobile/domain/workOrderValidation.ts");
const mobilePolicy = read("apps/mobile/domain/workOrderPolicy.ts");
const runtime = read("lib/domain/work-orders/command/runtimeGuard.ts");
const commandService = read("lib/domain/work-orders/command/commandService.ts");
const materialService = read("lib/domain/work-orders/command/materialCommandService.ts");
const collectionRoute = read("app/api/v2/work-orders/[workOrderId]/materials/route.ts");
const lineRoute = read("app/api/v2/work-orders/[workOrderId]/materials/[materialLineId]/route.ts");
const start = read("tools/dev/start-wafl-external-qa.ps1");
const alpha26 = read("tests/workorder-v2-alpha26-material-command-api-contract.mjs");
const evidence = read("docs/project/app-v2/49-mobile-material-draft-create-update-evidence.md");

assert.equal(appJson.expo.ios.bundleIdentifier, "com.wafl.app");
assert.equal(appJson.expo.android.package, "com.wafl.app");
assert.deepEqual(easJson, {
  cli: { version: "21.0.1", appVersionSource: "remote" },
  build: { development: { developmentClient: true, distribution: "internal", env: { APP_VARIANT: "development" } } },
});

assert.match(collectionRoute, /export async function POST/);
assert.match(collectionRoute, /handleAddMaterialLineV2/);
assert.match(lineRoute, /export async function PATCH/);
assert.match(lineRoute, /handlePatchMaterialLineV2/);
assert.doesNotMatch(collectionRoute + lineRoute, /export async function DELETE|handleDelete|handleRemove/);
assert.match(alpha26, /material line deletion is deferred without soft-delete schema/);
assert.match(alpha26, /hard delete is forbidden without canonical lifecycle/);

assert.match(runtime, /WAFL_V2_ALPHA50_MATERIAL_DRAFT_MUTATION_APPROVAL/);
assert.match(runtime, /2\.0\.0-alpha\.50-dev-test-mobile-material-draft-runtime/);
assert.match(runtime, /getWorkOrderV2MaterialDraftMutationRuntimeGuard/);
const genericApprovals = runtime.match(/const SUPPORTED_MUTATION_APPROVALS = new Set\(\[[\s\S]*?\]\);/)?.[0] ?? "";
assert.doesNotMatch(genericApprovals, /ALPHA50|alpha\.50/, "alpha.50 must not enable the generic Command set");
assert.match(commandService, /requireMaterialDraftMutationApproval/);
const createSlice = materialService.slice(materialService.indexOf("export async function addMaterialLine"), materialService.indexOf("export async function patchMaterialLine"));
const patchSlice = materialService.slice(materialService.indexOf("export async function patchMaterialLine"), materialService.indexOf("const TRANSITION_COMMAND_CODES"));
const transitionSlice = materialService.slice(materialService.indexOf("export async function transitionMaterialOrder"));
assert.match(createSlice, /requireMaterialDraftMutationApproval\(\)/);
assert.match(patchSlice, /requireMaterialDraftMutationApproval\(\)/);
assert.match(transitionSlice, /requireCommandMutationApproval\(WAFL_V2_ALPHA26_MUTATION_APPROVAL\)/);

const workOrderId = "11111111-1111-1111-1111-111111111111";
const materialLineId = "22222222-2222-2222-2222-222222222222";
const env = {
  WAFL_SERVER_RUNTIME_MODE: "dev",
  WAFL_EXTERNAL_QA_ALPHA50_MATERIAL_DRAFT_MUTATION_ENABLED: "true",
  WAFL_V2_COMMAND_API_ENABLED: "1",
  WAFL_V2_COMMAND_MUTATION_APPROVED: "2.0.0-alpha.50-dev-test-mobile-material-draft-runtime",
};
assert.equal(isTailscaleServePathAllowed(`/api/v2/work-orders/${workOrderId}/materials`, "GET", env), true);
assert.equal(isTailscaleServePathAllowed(`/api/v2/work-orders/${workOrderId}/materials`, "POST", env), true);
assert.equal(isTailscaleServePathAllowed(`/api/v2/work-orders/${workOrderId}/materials/${materialLineId}`, "PATCH", env), true);
for (const [method, pathname] of [
  ["DELETE", `/api/v2/work-orders/${workOrderId}/materials/${materialLineId}`],
  ["POST", `/api/v2/work-orders/${workOrderId}/materials/${materialLineId}/order-request`],
  ["POST", `/api/v2/work-orders/${workOrderId}/materials/${materialLineId}/order-cancel`],
  ["POST", `/api/v2/work-orders/${workOrderId}/materials/${materialLineId}/order-complete`],
  ["POST", "/api/v2/work-orders"],
]) assert.equal(isTailscaleServePathAllowed(pathname, method, env), false, `${method} ${pathname}`);
assert.equal(isTailscaleServePathAllowed(`/api/v2/work-orders/${workOrderId}/materials`, "POST", { ...env, WAFL_SERVER_RUNTIME_MODE: "production" }), false);
assert.equal(isTailscaleServePathAllowed(`/api/v2/work-orders/${workOrderId}/materials`, "POST", {}), false);

assert.match(start, /\[switch\]\$EnableAlpha50MaterialDraftMutation/);
assert.match(start, /EXTERNAL_QA_MUTATION_MODES_ARE_MUTUALLY_EXCLUSIVE/);
for (const name of ["WAFL_V2_COMMAND_API_ENABLED", "WAFL_V2_COMMAND_MUTATION_APPROVED", "WAFL_EXTERNAL_QA_ALPHA50_MATERIAL_DRAFT_MUTATION_ENABLED"]) {
  assert.match(start, new RegExp(`\\$serverEnvironment\\.${name}`));
}
assert.match(start, /mutationMode = "material-draft-create-update"/);
const mobileEnvironment = start.slice(start.indexOf("$mobileEnvironment = @{"));
assert.doesNotMatch(mobileEnvironment, /WAFL_V2_COMMAND_MUTATION_APPROVED|WAFL_EXTERNAL_QA_ALPHA50_MATERIAL_DRAFT_MUTATION_ENABLED/);

for (const field of [
  "name", "colorOption", "usageArea", "requiredQuantity", "allowanceQuantity",
  "inventoryUsageQuantity", "unitCode", "unitPrice", "memo",
]) {
  assert.match(apiTypes, new RegExp(`readonly ${field}: string`), `mobile material field missing: ${field}`);
  assert.match(editor, new RegExp(`field="${field}"`), `editor field missing: ${field}`);
}
assert.match(apiTypes, /readonly orderQuantity: string/);
assert.doesNotMatch(editor, /field="orderQuantity"/);
assert.match(editor, /발주수량, 자동 계산, 읽기 전용/);
assert.doesNotMatch(apiTypes + editor, /partnerId|materialId|supplierPartnerId|applicationColorTarget/);
assert.match(apiClient, /export async function createWorkOrderMaterial/);
assert.match(apiClient, /method: "POST"/);
assert.match(apiClient, /"Idempotency-Key"/);
assert.match(apiClient, /export async function patchWorkOrderMaterial/);
assert.match(apiClient, /method: "PATCH"/);
assert.doesNotMatch(apiClient, /method: "DELETE"|order-request|order-cancel|order-complete/);
const saveMaterialSlice = app.slice(app.indexOf("async function saveMaterial"), app.indexOf("function reloadLatestMaterial"));
assert.match(saveMaterialSlice, /editor\.mode === "create"[\s\S]*workOrderMutationController\.createMaterial/);
assert.match(saveMaterialSlice, /:\s*await workOrderMutationController\.updateMaterial/);
assert.doesNotMatch(saveMaterialSlice, /useEffect|setInterval|setTimeout/);

for (const state of ["editing", "saving", "validation-error", "conflict", "locked", "save-error", "refresh-error"]) {
  assert.match(editor + app, new RegExp(`"${state}"`), `material editor state missing: ${state}`);
}
assert.match(editor, /원단 추가/);
assert.match(editor, /원단 수정/);
assert.match(editor, /추가 취소/);
assert.match(editor, /저장 전/);
assert.match(editor, /계속 편집|최신 내용 불러오기/);
assert.match(app, /저장하지 않은 변경사항이 있습니다/);
assert.match(app, /계속 편집/);
assert.match(app, /변경사항 버리기/);
assert.match(app, /materialMutation\.inFlight/);
assert.match(app, /editor\.committedNextVersion !== null/);
assert.match(app, /selectedWorkOrderId\.current !== input\.workOrderId/);
assert.match(app, /materialSessionGeneration\.current !== input\.sessionGeneration/);
assert.match(app, /materialEditorRef\.current\?\.token !== input\.token/);
assert.match(app, /Promise\.all\(\[[\s\S]{0,300}workOrderQueryController\.detail[\s\S]{0,300}workOrderQueryController\.materials/);
assert.match(mobileValidation, /if \(field === "orderQuantity"\) continue/);
assert.match(app, /refreshed\.header\.entityVersion !== page\.entityVersion/);
assert.match(app, /input\.expectedVersion !== null && refreshed\.header\.entityVersion !== input\.expectedVersion/);
assert.match(app, /putBoundedMaterialEntry/);
assert.match(app, /entityVersion: page\.entityVersion/);
assert.match(mobilePolicy, /detail\.header\.status === "draft"/);
assert.match(mobilePolicy, /detail\.revision\.status === "draft"/);
assert.match(mobilePolicy, /line\.status === "editing"/);
assert.doesNotMatch(app + editor, /setInterval|automaticSave|autoSave|order-request|order-cancel|order-complete/);

assert.match(materials, /accessibilityLabel="원단 추가"/);
assert.match(materials, /<Plus /);
assert.match(materials, /field="name" label="원단명"/);
assert.doesNotMatch(materials, /PencilLine|editActionButton/);
assert.match(materials, /line\.status === "editing"/);
const readOnlyAction = materials.slice(materials.indexOf("function ReadOnlyActionButton"), materials.indexOf("function MaterialCard"));
assert.match(readOnlyAction, /accessibilityState=\{\{ disabled: true \}\}/);
assert.match(readOnlyAction, /\n\s+disabled\n/);
assert.doesNotMatch(readOnlyAction, /onPress=/);
assert.match(materials, /caption: "발주"/);
assert.match(materials, /caption: "삭제"/);
assert.match(detail, /canEditMaterials/);
assert.match(detail, /materialEditor\?\.mode === "create"/);
assert.match(detail, /onRequestSectionChange/);
assert.match(detail, /WorkOrderMaterialEditor/);

assert.equal(mobilePackage.dependencies["@react-native-async-storage/async-storage"], undefined);
assert.doesNotMatch(editor + app + apiClient, /mockProductionCard|mockMaterial|productionCards/);
assert.doesNotMatch(editor, /console\.(?:log|debug|info|warn|error)/);
assert.equal(((app + apiClient).match(/console\.(?:log|debug|info|warn|error)/g) ?? []).length, 3, "only bounded external-QA metrics may log");
assert.equal(((app + apiClient).match(/console\.info/g) ?? []).length, 3);
for (const metric of ["WAFL_MATERIAL_SAVE_METRIC", "WAFL_OVERVIEW_SAVE_METRIC", "WAFL_MOBILE_REQUEST_METRIC"]) assert.match(app + apiClient, new RegExp(metric));

for (const token of [
  "material POST create | 1",
  "material PATCH | 2",
  "automatic save `0`",
  "duplicate handler wiring `0`",
  "HTTP `409` / `CONFLICT` exactly once",
  "material DELETE | 0",
  "order request/cancel/complete | 0",
  "interaction step unresolved",
]) assert.ok(evidence.includes(token), `alpha.50 evidence missing ${token}`);

console.log("workorder v2 alpha.50 mobile material draft create/update contract: PASS");
