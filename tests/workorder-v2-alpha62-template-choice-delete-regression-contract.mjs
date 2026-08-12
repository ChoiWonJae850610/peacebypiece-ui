#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isTailscaleServePathAllowed } from "../lib/external-qa/configCore.mjs";

const read = (file) => readFileSync(file, "utf8");
const sheets = read("apps/mobile/features/work-orders/size-color/MeasurementTemplateSheets.tsx");
const choiceButtons = read("apps/mobile/features/inputs/WaflChoiceButtons.tsx");
const controller = read("apps/mobile/features/work-orders/size-color/useSizeColorStructureEditController.ts");
const route = read("lib/domain/work-orders/command/sizeColorStructureCommandRoute.ts");
const guard = read("lib/domain/work-orders/command/runtimeGuard.ts");
const runner = read("scripts/run-wafl-v2-alpha62-size-color-delete-runtime-qa.mjs");

assert.match(choiceButtons, /function WaflChoiceButtons<T extends string>/);
assert.equal((sheets.match(/<WaflChoiceButtons/g) ?? []).length, 2);
assert.match(sheets, /import WaflChoiceButtons/);
assert.doesNotMatch(sheets, /WaflOptionReel/);
for (const label of ["WAFL 추천", "저장 스펙", "새 스펙 저장", "기존 스펙 업데이트"]) assert.ok(sheets.includes(label));
assert.doesNotMatch(sheets, /v\{template\.templateVersion\}|새 버전 저장|이전 버전과/);
assert.match(sheets, /<TemplateGroup[\s\S]+items=\{source === "system" \? recommended : company\}/);
assert.match(sheets, /<TemplateGroup[\s\S]+items=\{props\.companyTemplates\}/);
assert.match(sheets, /template\.sizeCount.+template\.pomCount.+template\.valueCount/);

assert.match(route, /getWorkOrderV2SizeColorHardDeleteMutationRuntimeGuard/);
assert.match(guard, /getWorkOrderV2SizeColorHardDeleteMutationRuntimeGuard/);
assert.match(guard, /WAFL_V2_ALPHA60_DRAFT_CHILD_HARD_DELETE_MUTATION_APPROVAL[\s\S]+WAFL_V2_ALPHA62_MEASUREMENT_MUTATION_APPROVAL/);
assert.match(controller, /deleteSize\([\s\S]+workOrderId, sizeRowId/);
assert.match(controller, /deleteColor\([\s\S]+workOrderId, colorId/);
assert.match(controller, /quantityCells\.filter\(\(cell\) => cell\.sizeRowId !== sizeRowId\)/);
assert.match(controller, /quantityCells\.filter\(\(cell\) => cell\.colorId !== colorId\)/);

const workOrderId = "00000000-0000-4000-8000-000000000062";
const childId = "00000000-0000-4000-8000-000000000063";
const env = {
  WAFL_SERVER_RUNTIME_MODE: "dev",
  WAFL_EXTERNAL_QA_ALPHA62_SIZE_MEASUREMENT_MUTATION_ENABLED: "true",
  WAFL_V2_COMMAND_API_ENABLED: "1",
  WAFL_V2_COMMAND_MUTATION_APPROVED: "2.0.0-alpha.62-dev-test-size-measurement-runtime",
};
for (const kind of ["sizes", "colors"]) {
  assert.equal(isTailscaleServePathAllowed(`/api/v2/work-orders/${workOrderId}/size-color/${kind}/${childId}`, "DELETE", env), true);
}
assert.equal(isTailscaleServePathAllowed(`/api/v2/work-orders/${workOrderId}/materials/${childId}`, "DELETE", env), true);
assert.equal(isTailscaleServePathAllowed(`/api/v2/work-orders/${workOrderId}/size-color/sizes/${childId}`, "DELETE", { ...env, WAFL_SERVER_RUNTIME_MODE: "production" }), false);
for (const token of ["sizeDelete.metric.requestCount", "colorDelete.metric.requestCount", "deletedQuantityCellCount", "removedQuantity", "finished spec must use WorkOrder Size identity", "makerAuthoringComposition", "businessResidual: 0"]) assert.ok(runner.includes(token), `delete runtime evidence missing ${token}`);
console.log("workorder v2 alpha.62 template-choice/delete regression contract: PASS");
