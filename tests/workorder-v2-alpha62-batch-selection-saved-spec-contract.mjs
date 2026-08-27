#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import { readMobileApiSource } from "./helpers/mobile-api-source.mjs";
import { isTailscaleServePathAllowed } from "../lib/external-qa/configCore.mjs";
import {
  createStagedDeletionMessage,
  createStagedStructureSelection,
  diffStagedStructureSelection,
  summarizeStagedDeletionQuantity,
  toggleStagedStructureSelection,
} from "../apps/mobile/domain/sizeColorSelectionBatchPolicy.ts";

const read = (file) => fs.readFileSync(file, "utf8");
const existing = [
  { id: "size-l", displayName: "L", hexValue: null },
  { id: "size-xl", displayName: "XL", hexValue: null },
];
let staged = createStagedStructureSelection(existing);
staged = toggleStagedStructureSelection(staged, "L");
staged = toggleStagedStructureSelection(staged, "2XL");
const diff = diffStagedStructureSelection({
  existing,
  candidates: [{ displayName: "L", hexValue: null }, { displayName: "XL", hexValue: null }, { displayName: "2XL", hexValue: null }],
  selectedKeys: staged,
});
assert.deepEqual(diff.deletionIds, ["size-l"]);
assert.deepEqual(diff.deletedDisplayNames, ["L"]);
assert.deepEqual(diff.additions, [{ displayName: "2XL", hexValue: null }]);
const removedQuantity = summarizeStagedDeletionQuantity({
  targetKind: "size",
  deletionIds: diff.deletionIds,
  quantityCells: [
    { sizeRowId: "size-l", colorId: "navy", quantity: "30" },
    { sizeRowId: "size-xl", colorId: "navy", quantity: "90" },
  ],
});
assert.equal(removedQuantity, 30);
assert.equal(createStagedDeletionMessage({ targetKind: "size", deletedDisplayNames: ["L"], removedQuantity }), "선택한 사이즈 'L'을 삭제하시겠습니까?\n입력된 수량 30개도 함께 삭제됩니다.");
assert.equal(createStagedDeletionMessage({ targetKind: "color", deletedDisplayNames: ["회색"], removedQuantity: 0 }), "선택한 색상 '회색'을 삭제하시겠습니까?");

const editor = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx");
const controller = read("apps/mobile/features/work-orders/size-color/useSizeColorStructureEditController.ts");
const apiClient = readMobileApiSource();
const route = read("lib/domain/work-orders/command/sizeColorStructureCommandRoute.ts");
const repository = read("lib/domain/work-orders/command/sizeColorStructureCommandRepository.ts");
const sheets = read("apps/mobile/features/work-orders/size-color/MeasurementTemplateSheets.tsx");
const controlled = read("apps/mobile/components/ControlledInlineEditValue.tsx");

for (const token of ["createStagedStructureSelection", "toggleStagedStructureSelection", "diffStagedStructureSelection", "createStagedDeletionMessage"]) {
  assert.ok(editor.includes(token), `local selection staging missing ${token}`);
}
assert.ok(editor.includes("onApplySelectionBatch"));
assert.doesNotMatch(editor, /연결된 수량 셀|quantityCellCount/);
assert.ok(controller.includes("pendingStructureOperations"));
assert.match(controller, /draftBatch\.stage\("sizes"/);
assert.ok(apiClient.includes('"selection-batch"'));
assert.ok(route.includes('kind: "selection-batch"'));
for (const token of ["withWaflV2TenantWriteTransaction", "batchStructureSelectionV2", "STRUCTURE_SELECTION_BATCH_COMMAND_CODE", "ANY($3::uuid[])", "synchronizeFinishedSpecSizes", "canonicalTotalQuantity"]) {
  assert.ok(repository.includes(token), `canonical transaction batch missing ${token}`);
}
assert.doesNotMatch(sheets, /회사 스펙|v\{template\.templateVersion\}|이전 버전과/);
for (const label of ["WAFL 추천", "사용자 저장 스펙", "사용자 저장 스펙 관리", "스펙 저장"]) assert.ok(sheets.includes(label));
assert.ok(controlled.includes("numeric ? undefined"), "shared numeric inline input must not own a Done return key");
assert.equal(isTailscaleServePathAllowed(
  "/api/v2/work-orders/00000000-0000-4000-8000-000000000062/size-color/selection-batch",
  "POST",
  {
    WAFL_SERVER_RUNTIME_MODE: "dev",
    WAFL_EXTERNAL_QA_ALPHA62_SIZE_MEASUREMENT_MUTATION_ENABLED: "true",
    WAFL_V2_COMMAND_API_ENABLED: "1",
    WAFL_V2_COMMAND_MUTATION_APPROVED: "2.0.0-alpha.62-dev-test-size-measurement-runtime",
  },
), true);

console.log("WAFL v2 alpha.62 batch selection/saved spec UX contract: PASS");
