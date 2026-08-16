#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import { readMobileApiSource } from "./helpers/mobile-api-source.mjs";
import path from "node:path";

import { createInlineEditFinalizationController } from "../apps/mobile/lib/inlineEditFinalization.ts";
import { createMaterialHeaderPresentation } from "../apps/mobile/features/materials/materialHeaderLayoutModel.ts";
import { normalizeMaterialLine } from "../apps/mobile/lib/apiResponseNormalizer.ts";
import { resolveMaterialOrderPolicy } from "../apps/mobile/domain/materialOrderPolicy.ts";
import { validateMaterialDraft, validateMaterialOrderRequest } from "../apps/mobile/domain/workOrderValidation.ts";
import { calculateMaterialAmount, calculateOrderQuantity } from "../apps/mobile/lib/mobileDisplay.ts";
import { isTailscaleServePathAllowed } from "../lib/external-qa/configCore.mjs";
import { assertCanonicalWaflVersionConsistency } from "./helpers/wafl-v2-current-version.mjs";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

assertCanonicalWaflVersionConsistency();

const contract = read("apps/mobile/domain/mobileContract.ts");
const normalizer = read("apps/mobile/lib/apiResponseNormalizer.ts");
const apiClient = readMobileApiSource();
const controller = read("apps/mobile/features/work-orders/workOrderQueryController.ts");
const experience = [read("apps/mobile/features/MobileWorkOrderExperience.tsx"), read("apps/mobile/features/materials/useWorkOrderMaterialAuthoringController.ts")].join("\n");
const overview = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const materialView = read("apps/mobile/features/materials/WorkOrderMaterialsReadOnly.tsx");
const editor = read("apps/mobile/features/materials/WorkOrderMaterialEditor.tsx");
const cache = read("apps/mobile/features/materials/materialCache.ts");
const serverValidation = read("lib/domain/work-orders/command/materialValidation.ts");
const serverRepository = read("lib/domain/work-orders/command/materialCommandRepository.ts");
const readService = read("lib/domain/work-orders/read/detailService.ts");
const readRepository = read("lib/domain/work-orders/read/detailRepository.ts");
const runtimeGuard = read("lib/domain/work-orders/command/runtimeGuard.ts");
const commandService = read("lib/domain/work-orders/command/materialCommandService.ts");
const externalQa = read("lib/external-qa/configCore.mjs");
const runner = read("tools/dev/start-wafl-external-qa.ps1");
const runtimeQa = read("scripts/run-wafl-v2-alpha56-accessory-lifecycle-runtime-qa.mjs");
const historicalReadVerifier = read("tests/workorder-v2-alpha48-mobile-materials-real-read-contract.mjs");
const migration003 = read("db/v2/migrations/003_v2_revision_content.sql");
const migration009 = read("db/v2/migrations/009_v2_workorder_factory_instruction_fields.sql");
const migration013 = read("db/v2/migrations/013_v2_material_line_archive_lifecycle.sql");

assert.match(contract, /MaterialType = "fabric" \| "accessory"/);
for (const typeUse of [
  /readonly materialType: MaterialType/,
  /CreateMaterialLineInput = MaterialDraftFields/,
  /WorkOrderMaterialPage =/,
  /MaterialLineCommandResult =/,
]) assert.match(contract, typeUse);
assert.doesNotMatch(contract, /readonly materialType: "fabric"/);

const baseLine = {
  id: "22222222-2222-4222-8222-222222222222",
  materialType: "accessory",
  name: "지퍼",
  colorOption: "NAVY",
  usageArea: "앞중심",
  requiredQuantity: "2.000",
  allowanceQuantity: "0.500",
  inventoryUsageQuantity: "0.500",
  orderQuantity: "2.000",
  unitCode: "개",
  currency: "KRW",
  unitPrice: "1500.00",
  amount: "3000.00",
  memo: "부자재 메모",
  status: "editing",
  displayOrder: 1,
  locked: false,
  deletable: true,
  lifecycle: "active",
  archivedAt: null,
};
assert.equal(normalizeMaterialLine(baseLine)?.materialType, "accessory");
assert.equal(normalizeMaterialLine({ ...baseLine, materialType: "fabric" })?.materialType, "fabric");
assert.equal(normalizeMaterialLine({ ...baseLine, materialType: "submaterial" }), null);
assert.match(normalizer, /value === "fabric" \|\| value === "accessory"/);
assert.match(apiClient, /type: materialType, lifecycle, limit: "30"/);
assert.match(apiClient, /body\.data\.materialType !== materialType/);
assert.match(apiClient, /line\?\.materialType !== materialType/);
assert.match(controller, /materials\(workOrderId: string, materialType: MaterialType/);

assert.match(cache, /materialCacheKey\(workOrderId: string, materialType: MaterialType\)/);
assert.match(cache, /return `\$\{workOrderId\}:\$\{materialType\}`/);
assert.match(experience, /const \[activeMaterialType, setActiveMaterialType\] = useState<MaterialType>\("fabric"\)/);
assert.match(experience, /loadMaterials\(workOrderId: string, materialType: MaterialType/);
assert.match(experience, /page\.materialType !== materialType/);
assert.match(experience, /function beginMaterialCreate\(materialType: MaterialType = activeMaterialType\)/);
assert.match(experience, /materialType,\s*base,/);
assert.match(experience, /materialType: line\.materialType/);
assert.match(experience, /materialType: editor\.materialType/);
assert.match(experience, /saved\.result\.materialType !== editor\.materialType/);
assert.match(experience, /result\.result\.materialType !== line\.materialType/);
assert.match(experience, /materialCacheKey\(detail\.header\.id, "fabric"\)/);
assert.match(experience, /materialCacheKey\(detail\.header\.id, "accessory"\)/);
assert.doesNotMatch(experience, /materialCreateDraft\("fabric"\)/);

assert.match(overview, /id: "materials", label: "원부자재"/);
assert.match(overview, /<WaflMaterialsCategorySwitch/);
assert.match(overview, /renderMaterialSection\(activeMaterialCategory\)/);
assert.match(overview, /props\.onOpenMaterials\(resolved\.materialFocus \?\? undefined\)/);
assert.match(overview, /materialType=\{materialType\}/);
assert.match(materialView, /materialType === "accessory" \? "부자재" : "원단"/);
assert.match(editor, /state\.materialType === "accessory" \? "부자재" : "원단"/);
assert.match(materialView, /material-header-badge-cluster/);
assert.match(materialView, /field="unitCode"[\s\S]*field="name"|field="name"[\s\S]*field="unitCode"/);
assert.match(materialView, /numberOfLines=\{MATERIAL_HEADER_NAME_MAX_LINES\}/);
assert.match(materialView, /field="memo"[\s\S]*multiline/);
assert.match(materialView, /expanded \? \([\s\S]*expandedPanel/);
assert.match(materialView, /calculateOrderQuantity\(calculationDraft\)/);
assert.match(materialView, /calculateMaterialAmount\(calculatedOrderQuantity, calculationDraft\.unitPrice\)/);
assert.doesNotMatch(`${materialView}\n${editor}`, /field="orderQuantity"[\s\S]{0,120}(TextInput|onChange)/);

const draft = {
  name: "지퍼",
  colorOption: "NAVY",
  usageArea: "앞중심",
  partnerId: "partner-1",
  requiredQuantity: "3.000",
  allowanceQuantity: "0.500",
  inventoryUsageQuantity: "0.500",
  orderQuantity: "3.000",
  unitCode: "개",
  unitPrice: "1200",
  memo: "메모",
};
assert.deepEqual(validateMaterialDraft(draft, "accessory"), {});
assert.match(validateMaterialDraft({ ...draft, name: "" }, "accessory").name, /부자재명/);
assert.equal(calculateOrderQuantity(draft), "3.5");
assert.equal(calculateMaterialAmount("3.5", draft.unitPrice), "4200.00");
draft.orderQuantity = "3.500";
assert.deepEqual(validateMaterialOrderRequest({ ...baseLine, ...draft }), {});
assert.ok(validateMaterialOrderRequest({
  ...baseLine,
  materialType: "accessory",
  requiredQuantity: "2",
  allowanceQuantity: "0",
  inventoryUsageQuantity: "2",
  orderQuantity: "0",
  unitPrice: "0",
}).orderQuantity);
assert.ok(validateMaterialOrderRequest({
  ...baseLine,
  materialType: "accessory",
  requiredQuantity: "0",
  allowanceQuantity: "0",
  inventoryUsageQuantity: "0",
  orderQuantity: "0",
}).orderQuantity);

for (const status of ["editing", "requested", "completed"]) {
  const policy = resolveMaterialOrderPolicy({
    status,
    lifecycle: "active",
    currentDraft: true,
    serverLocked: status !== "editing",
    canUpdate: true,
    canRequestOrder: true,
    canCompleteOrder: true,
  });
  if (status === "editing") assert.deepEqual(policy.actions, ["request"]);
  if (status === "requested") assert.deepEqual(policy.actions, ["complete", "cancel"]);
  if (status === "completed") assert.deepEqual(policy.actions, []);
}
const legacy = resolveMaterialOrderPolicy({
  status: "cancelled",
  lifecycle: "active",
  currentDraft: true,
  serverLocked: true,
  canUpdate: true,
  canRequestOrder: true,
  canCompleteOrder: true,
});
assert.equal(legacy.legacyCancelled, true);
assert.equal(legacy.canEdit, false);
assert.deepEqual(legacy.actions, []);

const finalization = createInlineEditFinalizationController("");
finalization.observe("ㅎㅏㄴㄱㅡㄹ 조합 중");
assert.equal(finalization.requestSave(), true);
assert.equal(finalization.requestSave(), false);
assert.deepEqual(finalization.finalize("한글 완료"), { shouldSave: true, value: "한글 완료" });
const header = createMaterialHeaderPresentation({
  name: "아주 긴 부자재 이름".repeat(8),
  unitCode: "개",
  statusLabel: "발주요청",
});
assert.equal(header.maxNameLines, 2);
assert.deepEqual(header.badgeCluster.map((item) => item.kind), ["unit", "status"]);

assert.match(migration003, /material_type text NOT NULL/);
assert.match(migration003, /CHECK \(material_type IN \('fabric', 'accessory'\)\)/);
for (const column of [
  "name", "color_option", "usage_area", "required_quantity", "allowance_quantity",
  "inventory_usage_quantity", "order_quantity", "unit_code", "unit_price", "amount",
  "memo", "display_order", "image_id", "entity_version",
]) assert.match(`${migration003}\n${migration009}`, new RegExp(`\\b${column}\\b`));
assert.match(migration013, /ADD COLUMN archived_at timestamptz/);
assert.match(serverValidation, /materialType은 fabric 또는 accessory/);
assert.match(readService, /materialType !== "fabric" && materialType !== "accessory"/);
assert.match(readRepository, /m\.material_type = \$6/);
assert.match(serverRepository, /materialType === "fabric" \? "원단 line 생성" : "부자재 line 생성"/);
assert.match(serverRepository, /materialType === "fabric" \? "원단 line 수정" : "부자재 line 수정"/);

const workOrderId = "11111111-1111-4111-8111-111111111111";
const materialLineId = "22222222-2222-4222-8222-222222222222";
const alpha56Env = {
  WAFL_SERVER_RUNTIME_MODE: "dev",
  WAFL_EXTERNAL_QA_ALPHA56_ACCESSORY_LIFECYCLE_PARITY_MUTATION_ENABLED: "true",
  WAFL_V2_COMMAND_API_ENABLED: "1",
  WAFL_V2_COMMAND_MUTATION_APPROVED: "2.0.0-alpha.56-dev-test-accessory-lifecycle-parity-runtime",
};
const collectionPath = `/api/v2/work-orders/${workOrderId}/materials`;
const itemPath = `${collectionPath}/${materialLineId}`;
assert.equal(isTailscaleServePathAllowed(collectionPath, "GET", alpha56Env), true);
assert.equal(isTailscaleServePathAllowed(collectionPath, "POST", alpha56Env), true);
assert.equal(isTailscaleServePathAllowed(itemPath, "PATCH", alpha56Env), true);
for (const suffix of ["archive", "restore", "order-request", "order-cancel", "order-complete"]) {
  assert.equal(isTailscaleServePathAllowed(`${itemPath}/${suffix}`, "POST", alpha56Env), true);
}
assert.equal(isTailscaleServePathAllowed(`${itemPath}/archive`, "DELETE", alpha56Env), false);
assert.equal(isTailscaleServePathAllowed(collectionPath, "POST", { ...alpha56Env, WAFL_SERVER_RUNTIME_MODE: "production" }), false);
assert.match(runtimeGuard, /WAFL_V2_ALPHA56_ACCESSORY_LIFECYCLE_PARITY_MUTATION_APPROVAL/);
assert.match(commandService, /requireMaterialOrderMutationApproval\(\)/);
assert.match(runtimeGuard, /getWorkOrderV2MaterialOrderMutationRuntimeGuard[\s\S]*MAKER_QA_CAPABILITY\.MATERIAL_ORDER/);
assert.match(externalQa, /MAKER_QA_CAPABILITY\.LEGACY_MATERIAL_ARCHIVE/);
assert.match(runner, /"accessory-lifecycle-parity"/);
assert.match(runner, /EnableAlpha56AccessoryLifecycleParityMutation/);
assert.match(runner, /mutationMode = "accessory-lifecycle-parity"/);

for (const marker of [
  "ALPHA56_AUTO_ACCESSORY_LIFECYCLE",
  "ALPHA56_AUTO_ACCESSORY_ZERO_ORDER",
  "ALPHA56_DEVICE_ACCESSORY_LIFECYCLE",
]) assert.match(runtimeQa, new RegExp(marker));
assert.match(runtimeQa, /assertStartingBaseline\(before\)/);
assert.ok(
  runtimeQa.indexOf("assertStartingBaseline(before)") < runtimeQa.indexOf('command: "normal-create"'),
  "exact baseline guard must precede the first write",
);
assert.match(runtimeQa, /\[109, 109, 87, 8, 142, 54, 13, 2\]/);
assert.match(runtimeQa, /\[125, 125, 103, 11, 158, 67, 13, 2\]/);
assert.match(runtimeQa, /legacyFingerprint/);
assert.match(runtimeQa, /fabricFingerprint/);
assert.equal((runtimeQa.match(/\/api\/dev\/mobile-connect\/auto/g) ?? []).length, 1);
assert.match(runtimeQa, /const auth = await jsonRequest\("\/api\/dev\/mobile-connect\/auto", \{ method: "POST" \}\)/);
assert.match(runtimeQa, /assert\.equal\(auth\.response\.status, 200\)/);
assert.match(runtimeQa, /assert\.equal\(auth\.body\?\.connected, true\)/);
assert.doesNotMatch(runtimeQa, /bootstrap.*fallback|404.*(?:allow|ignore|success)/i);
assert.match(runtimeQa, /duplicateAutomaticUnknownMutation: 0/);
assert.match(runtimeQa, /hardDeleteMutation: 0/);
assert.match(runtimeQa, /requestLedger\.length, 17/);
assert.match(runtimeQa, /method === "PATCH"\)\.length, 3/);
assert.match(runtimeQa, /normal-memo-update"\)\.length, 1/);
assert.doesNotMatch(runtimeQa, /\bDELETE\b|\bTRUNCATE\b|\bDROP\b|\bALTER TABLE\b/i);

assert.match(historicalReadVerifier, /type: materialType, lifecycle, limit: "30"/);
assert.doesNotMatch(historicalReadVerifier, /type: "fabric", lifecycle, limit: "30"/);

console.log("PASS workorder-v2-alpha56-accessory-lifecycle-parity-contract");
