import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { createFirstPendingIntentController } from "../apps/mobile/application/firstPendingIntent.ts";
import { hasCategoryDependentWorkOrderData } from "../apps/mobile/domain/categoryResetPolicy.ts";
import { materialPartnerOptionsFor } from "../apps/mobile/domain/partnerSelectionPolicy.ts";
import { getWaflBasicSpecTemplate } from "../lib/domain/work-orders/measurement/waflBasicSpecV1.ts";

const root = path.resolve(import.meta.dirname, "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

for (const scenario of ["tab", "field", "back"]) {
  const controller = createFirstPendingIntentController();
  const events = [];
  assert.equal(controller.capture({ key: `${scenario}:first`, isValid: () => true, run: () => events.push("first") }), true);
  assert.equal(controller.capture({ key: `${scenario}:second`, isValid: () => true, run: () => events.push("second") }), false);
  assert.equal(controller.replay(), true);
  assert.deepEqual(events, ["first"]);
  assert.equal(controller.replay(), false);
}
const failureController = createFirstPendingIntentController();
let failureReplay = 0;
failureController.capture({ key: "failure", isValid: () => true, run: () => { failureReplay += 1; } });
failureController.drop();
assert.equal(failureController.replay(), false);
assert.equal(failureReplay, 0);
const missingTarget = createFirstPendingIntentController();
missingTarget.capture({ key: "missing-field", isValid: () => false, run: () => { throw new Error("must not run"); } });
assert.equal(missingTarget.replay(), false);

const partners = [
  { id: "fabric", name: "Fabric", capabilityTypes: ["fabric"], processCodes: [] },
  { id: "accessory", name: "Accessory", capabilityTypes: ["subsidiary"], processCodes: [] },
  { id: "production", name: "Production", capabilityTypes: ["factory"], processCodes: [] },
  { id: "process", name: "Process", capabilityTypes: ["outsourcing"], processCodes: ["PRINT"] },
  { id: "multi", name: "Multi", capabilityTypes: ["fabric", "subsidiary"], processCodes: [] },
];
assert.deepEqual(materialPartnerOptionsFor(partners, "fabric").map((item) => item.id), ["fabric", "multi"]);
assert.deepEqual(materialPartnerOptionsFor(partners, "accessory").map((item) => item.id), ["accessory", "multi"]);

const expectedTemplates = new Map([
  ["T", "WAFL 기본 상의 스펙"],
  ["B", "WAFL 기본 하의 스펙"],
  ["D", "WAFL 기본 원피스 스펙"],
  ["O", "WAFL 기본 아우터 스펙"],
]);
for (const [category, name] of expectedTemplates) {
  const template = getWaflBasicSpecTemplate(category);
  assert.equal(template?.categoryCode, category);
  assert.equal(template?.name, name);
  assert.ok((template?.poms.length ?? 0) > 0);
}
assert.equal(getWaflBasicSpecTemplate(null), null);

assert.equal(hasCategoryDependentWorkOrderData({ itemCode: null, totalQuantity: 0, sizeCount: 0, colorCount: 0, allocationCount: 0, specPomCount: 0, specCellCount: 0, sourceTemplateId: null }), false);
for (const patch of [
  { itemCode: "티셔츠" }, { totalQuantity: 1 }, { sizeCount: 1 }, { colorCount: 1 },
  { allocationCount: 1 }, { specPomCount: 1 }, { specCellCount: 1 }, { sourceTemplateId: "template" },
]) {
  assert.equal(hasCategoryDependentWorkOrderData({ itemCode: null, totalQuantity: 0, sizeCount: 0, colorCount: 0, allocationCount: 0, specPomCount: 0, specCellCount: 0, sourceTemplateId: null, ...patch }), true);
}

const experience = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const documents = read("apps/mobile/features/work-orders/documents/WorkOrderDocumentWorkbench.tsx");
const materials = read("apps/mobile/features/materials/useWorkOrderMaterialAuthoringController.ts");
const production = read("apps/mobile/features/work-orders/production/WorkOrderProductionAuthoring.tsx");
const deleteRoute = read("lib/domain/work-orders/command/draftDeleteRoute.ts");
const lineage = read("lib/domain/work-orders/read/lineageRepository.ts");
const reorder = read("lib/domain/work-orders/command/reorderCommandRepository.ts");
const command = read("lib/domain/work-orders/command/commandRepository.ts");
const partnerRepo = read("lib/domain/work-orders/read/materialPartnerRepository.ts");
const productionOptions = read("lib/domain/work-orders/read/productionOptionsRepository.ts");
const runtimeIntegration = read("scripts/run-wafl-v2-alpha68-confirm-pending-lineage-runtime.mjs");

assert.match(experience, /WaflDecisionSheet decision=\{actionConfirmation\}/u);
assert.match(experience, /변경사항을 저장 중입니다\./u);
assert.match(experience, /잠시만 기다려 주세요\./u);
assert.doesNotMatch(experience, /저장이 끝난 뒤 이동해 주세요/u);
assert.match(documents, /onRequestActionConfirmation\(\{/u);
assert.doesNotMatch(documents, /confirmWaflAction\(/u);
assert.doesNotMatch(materials, /confirmWaflAction\(/u);
assert.doesNotMatch(production, /confirmWaflAction\(/u);
assert.match(deleteRoute, /work_order\.reorder_deleted/u);
assert.match(deleteRoute, /DELETE FROM work_orders/u);
assert.match(lineage, /'deleted'::text AS status/u);
assert.match(reorder, /metadata->>'reorderRound'/u);
assert.match(command, /resetCategoryDependents/u);
for (const table of ["work_order_size_spec_values", "work_order_size_specs", "color_size_quantities", "work_order_colors", "work_order_sizes"]) assert.match(command, new RegExp(`DELETE FROM ${table}`));
assert.doesNotMatch(command, /DELETE FROM work_order_material_lines[\s\S]{0,300}resetCategoryDependents/u);
assert.match(partnerRepo, /capability_types/u);
assert.match(productionOptions, /pi\.item_type='factory'/u);
assert.match(productionOptions, /pi\.item_type='outsourcing'/u);
assert.match(runtimeIntegration, /failed reset must leave no mixed partial state/u);
assert.match(runtimeIntegration, /materialsPreserved/u);
assert.match(runtimeIntegration, /tombstoneTransactionRolledBack/u);
assert.match(runtimeIntegration, /triggerDisabled: false/u);

console.log("alpha68 confirmation, first pending intent, tombstone lineage, partner filtering, basic spec, and category reset contract passed");
