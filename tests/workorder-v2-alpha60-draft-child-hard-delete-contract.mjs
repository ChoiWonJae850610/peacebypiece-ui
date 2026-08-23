#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  reconcileSelectionAfterDelete,
  summarizeDraftStructureDeleteImpact,
} from "../apps/mobile/domain/draftChildDeletionPolicy.ts";
import { createDestructiveConfirmationActions } from "../apps/mobile/domain/destructiveConfirmationPolicy.ts";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

assert.deepEqual(
  summarizeDraftStructureDeleteImpact([
    { colorId: "navy", sizeRowId: "l", quantity: "100" },
    { colorId: "navy", sizeRowId: "xl", quantity: "100" },
  ], "size", "l"),
  { quantityCellCount: 1, removedQuantity: 100 },
);
assert.deepEqual(
  summarizeDraftStructureDeleteImpact([
    { colorId: "navy", sizeRowId: "l", quantity: "100" },
    { colorId: "navy", sizeRowId: "xl", quantity: "100" },
  ], "color", "navy"),
  { quantityCellCount: 2, removedQuantity: 200 },
);
assert.equal(reconcileSelectionAfterDelete(["l", "xl"], "l", "l"), "xl");
assert.equal(reconcileSelectionAfterDelete(["l", "xl"], "l", "xl"), "xl");
let confirmationRequests = 0;
const confirmation = createDestructiveConfirmationActions(() => { confirmationRequests += 1; });
confirmation.cancel();
assert.equal(confirmationRequests, 0);
confirmation.confirm();
assert.equal(confirmationRequests, 1);

const codes = read("lib/domain/work-orders/command/workOrderCommandCodes.ts");
const sizeRepository = read("lib/domain/work-orders/command/sizeColorStructureCommandRepository.ts");
const materialRepository = read("lib/domain/work-orders/command/materialCommandRepository.ts");
const sizeRoute = read("lib/domain/work-orders/command/sizeColorStructureCommandRoute.ts");
const materialRoute = read("lib/domain/work-orders/command/materialCommandRoute.ts");
const mobile = [
  read("apps/mobile/features/MobileWorkOrderExperience.tsx"),
  read("apps/mobile/features/materials/useWorkOrderMaterialAuthoringController.ts"),
].join("\n");
const structureEditor = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx");
const structureController = read("apps/mobile/features/work-orders/size-color/useSizeColorStructureEditController.ts");
const config = read("lib/external-qa/configCore.mjs");

for (const commandCode of [
  "work_order.size_structure.delete",
  "work_order.color_structure.delete",
  "work_order.material.delete",
]) assert.ok(codes.includes(commandCode), `missing canonical command code ${commandCode}`);

assert.match(sizeRepository, /async function deleteStructureV2/);
assert.match(sizeRepository, /DELETE FROM color_size_quantities[\s\S]+DELETE FROM \$\{config\.table\}/);
assert.match(sizeRepository, /readCanonicalQuantityTotal[\s\S]+canonicalTotalQuantity/);
assert.match(sizeRepository, /deletedQuantityCellCount[\s\S]+removedQuantity/);
assert.match(sizeRepository, /readDeleteReplay/);
assert.match(sizeRoute, /"size-delete"[\s\S]+"color-delete"/);

assert.match(materialRepository, /export async function deleteMaterialLineV2/);
assert.match(materialRepository, /resolveMaterialRemovalMode/);
assert.match(materialRepository, /metadata->>'materialLineId'/);
assert.match(materialRepository, /DELETE FROM work_order_material_lines/);
assert.match(materialRoute, /input\.kind === "delete"[\s\S]+getWorkOrderV2MaterialHardDeleteMutationRuntimeGuard/);
assert.match(read("lib/domain/work-orders/command/runtimeGuard.ts"), /getWorkOrderV2MaterialHardDeleteMutationRuntimeGuard[\s\S]+MAKER_QA_CAPABILITY\.MATERIAL_HARD_DELETE/);

assert.match(mobile, /workOrderMutationController\.deleteMaterial/);
assert.match(mobile, /workOrderMutationController\.archiveMaterial/);
assert.doesNotMatch(mobile, /materials\(workOrderId, materialType, null, "archived"\)/);
assert.match(structureEditor, /confirmWaflDestructiveAction/);
assert.match(structureEditor, /summarizeStagedDeletionQuantity[\s\S]+createStagedDeletionMessage/);
assert.doesNotMatch(structureEditor, /연결된 수량 셀|quantityCellCount/);
assert.match(structureController, /deleteSize[\s\S]+deleteColor/);
assert.match(structureController, /batchStructureSelection/);
assert.match(config, /verb === "DELETE"[\s\S]+MAKER_QA_CAPABILITY\.(?:SIZE_COLOR_HARD_DELETE|MATERIAL_HARD_DELETE)/);

console.log("WAFL v2 alpha.60 draft child hard delete contract: PASS");
