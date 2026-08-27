#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { createWorkOrderDraftBatchCoordinator } from "../apps/mobile/application/draftBatchCoordinator.ts";
import {
  applyLocalSelectionBatchProjection,
  resolveTemplateModifiedAfterSizeReconcile,
} from "../apps/mobile/features/work-orders/size-color/localSizeColorDraftPolicy.ts";
import { isMeasurementSnapshotModified } from "../apps/mobile/domain/measurementPolicy.ts";

const read = (path) => fs.readFileSync(path, "utf8");
const template = {
  templateId: "template-1",
  templateVersion: 1,
  sizes: ["XS", "S", "M", "L"].map((code) => ({ code, displayLabel: code })),
  poms: [{ code: "chest", displayName: "가슴" }, { code: "length", displayName: "총장" }],
  values: ["XS", "S", "M", "L"].flatMap((sizeCode, sizeIndex) => [
    { sizeCode, pomCode: "chest", decimalValue: String(40 + sizeIndex * 2) },
    { sizeCode, pomCode: "length", decimalValue: String(60 + sizeIndex * 2) },
  ]),
};
const emptyBundle = {
  matrix: {
    workOrderId: "work-order", revisionId: "revision", sizes: [], colors: [], quantityCells: [],
    matrixTotal: "0", expectedTotal: "0", workOrderTotal: "0", revisionTotal: "0",
    projectionsMatch: true, totalsMatch: true, memoFallback: null, entityVersion: 1,
  },
  specifications: {
    workOrderId: "work-order", revisionId: "revision", genderCode: null, categoryCode: "T",
    measurementUnit: "cm", templateId: template.templateId, templateVersion: template.templateVersion,
    templateName: "기본", sourceTemplateModified: false, sizes: [],
    pomColumns: [
      { id: "pom-chest", code: "chest", displayName: "가슴", displayOrder: 0 },
      { id: "pom-length", code: "length", displayName: "총장", displayOrder: 1 },
    ],
    cells: [], entityVersion: 1,
  },
};

const projected = applyLocalSelectionBatchProjection({
  bundle: emptyBundle,
  targetKind: "size",
  additions: ["XS", "S", "M"].map((displayName, index) => ({ tempId: `local-size-${index + 1}`, displayName, hexValue: null })),
  deletionIds: [],
  template,
});
assert.deepEqual(projected.matrix.sizes.map((size) => size.displayLabel), ["XS", "S", "M"]);
assert.deepEqual(projected.specifications.sizes.map((size) => size.displayLabel), ["XS", "S", "M"]);
assert.equal(projected.specifications.cells.length, 6, "all three local sizes project template values in one pass");
assert.equal(projected.specifications.sourceTemplateModified, false);

const manual = {
  ...projected,
  specifications: {
    ...projected.specifications,
    sourceTemplateModified: true,
    cells: projected.specifications.cells.map((cell) => cell.sizeRowId === "local-size-3" && cell.pomColumnId === "pom-chest"
      ? { ...cell, decimalValue: "99", displayValue: "99" }
      : cell),
  },
};
const withLaterSize = applyLocalSelectionBatchProjection({
  bundle: manual,
  targetKind: "size",
  additions: [{ tempId: "local-size-4", displayName: "L", hexValue: null }],
  deletionIds: [],
  template,
});
assert.equal(withLaterSize.specifications.cells.find((cell) => cell.sizeRowId === "local-size-3" && cell.pomColumnId === "pom-chest")?.decimalValue, "99");
assert.equal(withLaterSize.specifications.cells.filter((cell) => cell.sizeRowId === "local-size-4").length, 2);
assert.equal(withLaterSize.specifications.sourceTemplateModified, true, "automatic reconcile never clears existing modified truth");

const custom = applyLocalSelectionBatchProjection({
  bundle: emptyBundle,
  targetKind: "size",
  additions: [{ tempId: "local-size-custom", displayName: "CUSTOM", hexValue: null }],
  deletionIds: [],
  template,
});
assert.equal(custom.specifications.cells.length, 0, "unsupported custom size does not invent values");
const colors = applyLocalSelectionBatchProjection({
  bundle: emptyBundle,
  targetKind: "color",
  additions: [
    { tempId: "local-color-1", displayName: "블랙", hexValue: "#111111" },
    { tempId: "local-color-2", displayName: "화이트", hexValue: "#FFFFFF" },
  ],
  deletionIds: [],
  template,
});
assert.deepEqual(colors.matrix.colors.map((color) => color.displayName), ["블랙", "화이트"]);

assert.equal(resolveTemplateModifiedAfterSizeReconcile(false), false);
assert.equal(resolveTemplateModifiedAfterSizeReconcile(true), true);
assert.equal(isMeasurementSnapshotModified({ sourceTemplateId: "template", sourceTemplateVersion: 1, sourceApplyEntityVersion: 5, latestContentEntityVersion: null }), false);
assert.equal(isMeasurementSnapshotModified({ sourceTemplateId: "template", sourceTemplateVersion: 1, sourceApplyEntityVersion: 5, latestContentEntityVersion: 6 }), true);

let overviewWrites = 0;
let overviewPayload = null;
let localOverviewDraft = { categoryMajor: "하의", categoryDetail: "", resetCategoryDependents: true };
const coordinator = createWorkOrderDraftBatchCoordinator();
coordinator.register("overview", async () => { overviewWrites += 1; overviewPayload = { ...localOverviewDraft }; return true; });
coordinator.stage("overview");
await new Promise((resolve) => setTimeout(resolve, 30));
assert.equal(overviewWrites, 0, "confirmed category reset remains local inside Overview");
localOverviewDraft = { ...localOverviewDraft, categoryDetail: "팬츠" };
coordinator.stage("overview");
assert.equal(overviewWrites, 0, "same-tab field transition does not flush");
assert.equal((await coordinator.flushSection("overview", "tab-change")).committed, true);
assert.equal(overviewWrites, 1);
assert.deepEqual(overviewPayload, { categoryMajor: "하의", categoryDetail: "팬츠", resetCategoryDependents: true }, "latest local draft owns the one boundary save");

const experience = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const createSheet = read("apps/mobile/features/work-orders/create/WorkOrderCreateSheet.tsx");
const categoryConfirm = experience.slice(experience.indexOf("title: \"대분류를 변경합니다\""), experience.indexOf("return \"confirmation\" as const"));
assert.match(categoryConfirm, /categoryResetIntentRef\.current/u);
assert.doesNotMatch(categoryConfirm, /flushSection\("overview"/u);
assert.match(experience, /if \(!draftBatch\.isDirty\("overview"\)\)[\s\S]{0,220}basicInfoDraftFromDetail/u);
assert.match(createSheet, /processingMessage=\{props\.pending \? "새 레시피를 생성 중입니다\." : null\}/u);
assert.match(experience, /copyPending \|\| reorderPending \? "레시피를 생성 중입니다\."/u);

const controller = read("apps/mobile/features/work-orders/size-color/useSizeColorStructureEditController.ts");
assert.match(controller, /applyLocalSelectionBatchProjection/u);
assert.match(controller, /getMeasurementTemplateContent/u);
assert.doesNotMatch(controller, /for \(const addition of additions\)[\s\S]{0,220}stageAddSize/u);
const commandCodes = read("lib/domain/work-orders/command/workOrderCommandCodes.ts");
const modifiedCodes = commandCodes.match(/MEASUREMENT_SNAPSHOT_CONTENT_COMMAND_CODES[\s\S]+?\] as const/u)?.[0] ?? "";
assert.doesNotMatch(modifiedCodes, /sizeCreate|sizePatch|sizeDelete|sizeReorder/u);

const templateRepository = read("lib/domain/work-orders/measurement/templateRepository.ts");
assert.match(templateRepository, /readCompatibleMeasurementTemplateContent/u);
assert.match(templateRepository, /size_spec_template_values/u);
const valueField = read("apps/mobile/features/inputs/WaflSheetValueField.tsx");
const inputSheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const sheetTextInput = read("apps/mobile/features/inputs/WaflSheetTextInput.tsx");
assert.match(createSheet, /submitBehavior="submit"/u);
assert.match(createSheet, /keyboardMode="directInput"/u);
assert.match(inputSheet, /directInputConfirmRef\.current/u);
assert.match(inputSheet, /Keyboard\.dismiss\(\)/u);
assert.match(sheetTextInput, /directInput\.submitInput\(registrationKey\)/u);
assert.match(valueField, /submitBehavior\?: TextInputProps\["submitBehavior"\]/u);
assert.match(valueField, /submitBehavior=\{submitBehavior\}/u);

const production = read("apps/mobile/features/work-orders/production/WorkOrderProductionAuthoring.tsx");
assert.match(production, /async function switchCategory/u);
assert.match(production, /flushSection\("production", "explicit"\)/u);

console.log(JSON.stringify({
  contract: "workorder-v2-alpha68-category-size-spec-keyboard-fix",
  atomicSizes: projected.matrix.sizes.length,
  immediateProjectedCells: projected.specifications.cells.length,
  overviewBoundaryWrites: overviewWrites,
  physicalResultInferred: false,
}));
