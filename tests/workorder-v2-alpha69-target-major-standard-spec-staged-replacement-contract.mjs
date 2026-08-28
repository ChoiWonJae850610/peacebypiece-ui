import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  listWaflAllSystemSizeLabels,
  resolveWaflRecommendedSizeLabels,
  resolveWaflRecommendedSpecCodes,
} from "../lib/domain/work-orders/catalog/workOrderSizeSpecRecommendationPolicy.mjs";
import { workOrderMajorCategoryPickerOptions } from "../lib/domain/work-orders/catalog/workOrderCategoryPolicy.ts";
import {
  findWaflBasicSpecTemplateById,
  getWaflBasicSpecTemplate,
  WAFL_BASIC_SPEC_V1_TEMPLATE_IDS,
} from "../lib/domain/work-orders/measurement/waflBasicSpecV1.ts";
import {
  createStagedReplacementLossMessage,
  diffStagedStructureSelection,
  resolveStagedReplacementImpact,
  structureSelectionKey,
} from "../apps/mobile/domain/sizeColorSelectionBatchPolicy.ts";

const expectedSizes = new Map([
  ["여성:T", ["44", "55", "66", "77", "2XL", "FREE"]],
  ["여성:B", ["44", "55", "66", "77", "24", "26", "28", "30", "32", "34", "36", "FREE"]],
  ["여성:O", ["44", "55", "66", "77", "2XL", "FREE"]],
  ["여성:D", ["44", "55", "66", "77", "2XL", "FREE"]],
  ["남성:T", ["XS", "S", "M", "L", "XL", "2XL", "FREE"]],
  ["남성:B", ["28", "30", "32", "34", "36", "FREE"]],
  ["남성:O", ["XS", "S", "M", "L", "XL", "2XL", "FREE"]],
  ["남성:D", []],
]);
for (const [key, expected] of expectedSizes) {
  const [target, category] = key.split(":");
  assert.deepEqual(resolveWaflRecommendedSizeLabels(target, category), expected, key);
}
for (const target of ["공용", "키즈", "기타", ""]) {
  for (const category of ["T", "B", "O", "D"]) assert.deepEqual(resolveWaflRecommendedSizeLabels(target, category), []);
}
assert.deepEqual(resolveWaflRecommendedSizeLabels("여성", "T", "티셔츠"), resolveWaflRecommendedSizeLabels("여성", "T", "후드"));
assert.notEqual(structureSelectionKey("44"), structureSelectionKey("XS"));
assert.ok(listWaflAllSystemSizeLabels().includes("88"));
assert.ok(listWaflAllSystemSizeLabels().includes("25"));

assert.ok(workOrderMajorCategoryPickerOptions("", "여성").includes("원피스"));
assert.equal(workOrderMajorCategoryPickerOptions("", "남성").includes("원피스"), false);
assert.ok(workOrderMajorCategoryPickerOptions("원피스", "남성").includes("원피스"), "legacy male+dress remains representable");
assert.deepEqual(workOrderMajorCategoryPickerOptions("", "공용"), ["", "상의", "하의", "아우터", "원피스", "기타"]);

const templateCases = [
  ["여성", "T", "WAFL 추천 여성 상의 스펙"],
  ["여성", "B", "WAFL 추천 여성 하의 스펙"],
  ["여성", "O", "WAFL 추천 여성 아우터 스펙"],
  ["여성", "D", "WAFL 추천 여성 원피스 스펙"],
  ["남성", "T", "WAFL 추천 남성 상의 스펙"],
  ["남성", "B", "WAFL 추천 남성 하의 스펙"],
  ["남성", "O", "WAFL 추천 남성 아우터 스펙"],
];
for (const [target, category, name] of templateCases) {
  const template = getWaflBasicSpecTemplate(category, "후드", target);
  assert.ok(template);
  assert.equal(template.name, name);
  assert.ok(resolveWaflRecommendedSizeLabels(target, category).every((size) => template.sizes.includes(size)));
  assert.equal(findWaflBasicSpecTemplateById(template.id)?.name, name);
}
assert.equal(getWaflBasicSpecTemplate("D", null, "남성"), null);
assert.equal(getWaflBasicSpecTemplate("T", "후드", "여성").id, getWaflBasicSpecTemplate("T", "티셔츠", "여성").id);
assert.equal(getWaflBasicSpecTemplate("T", "후드", "여성").poms.some((pom) => pom.code === "hood_height"), false);
assert.ok(resolveWaflRecommendedSpecCodes("T", "후드").includes("hood_height"), "item-aware supplemental POM guidance remains");
assert.equal(getWaflBasicSpecTemplate("O", "재킷", "여성").poms.some((pom) => pom.code === "lapel_width"), false);
const mensBottom = getWaflBasicSpecTemplate("B", "데님", "남성");
for (const size of ["24", "26", "28", "30", "32", "34", "36"]) assert.equal(Object.hasOwn(mensBottom.valuesCm, size), true);
assert.ok(Object.keys(getWaflBasicSpecTemplate("T", null, "남성").valuesCm.M).length > 0);
for (const legacyId of Object.values(WAFL_BASIC_SPEC_V1_TEMPLATE_IDS)) assert.ok(findWaflBasicSpecTemplateById(legacyId), "legacy template id readable");

const quantityCells = [
  { sizeRowId: "size-32", colorId: "navy", quantity: "12" },
  { sizeRowId: "size-34", colorId: "black", quantity: "0" },
];
const blankMeasurements = [{ sizeRowId: "size-32", decimalValue: null }];
assert.deepEqual(resolveStagedReplacementImpact({ targetKind: "size", deletionIds: ["size-34"], quantityCells, measurementCells: blankMeasurements }), {
  removedQuantity: 0, removedMeasurementValueCount: 0, hasLoss: false,
});
assert.deepEqual(resolveStagedReplacementImpact({ targetKind: "color", deletionIds: ["black"], quantityCells, measurementCells: [] }), {
  removedQuantity: 0, removedMeasurementValueCount: 0, hasLoss: false,
});
const quantityImpact = resolveStagedReplacementImpact({ targetKind: "color", deletionIds: ["navy"], quantityCells, measurementCells: [] });
assert.equal(quantityImpact.hasLoss, true);
assert.equal(quantityImpact.removedQuantity, 12);
const measurementImpact = resolveStagedReplacementImpact({ targetKind: "size", deletionIds: ["size-34"], quantityCells, measurementCells: [{ sizeRowId: "size-34", decimalValue: "0" }, { sizeRowId: "size-34", decimalValue: "" }] });
assert.equal(measurementImpact.removedMeasurementValueCount, 1);
assert.match(createStagedReplacementLossMessage({ targetKind: "size", deletedDisplayNames: ["32"], impact: { removedQuantity: 12, removedMeasurementValueCount: 8, hasLoss: true } }), /수량 12개와 치수 8개/);

const replacement = diffStagedStructureSelection({
  existing: ["32", "34", "36"].map((displayName) => ({ id: `size-${displayName}`, displayName, hexValue: null })),
  candidates: ["30", "32", "34", "36"].map((displayName) => ({ displayName, hexValue: null })),
  selectedKeys: ["30", "34", "36"].map(structureSelectionKey),
});
assert.deepEqual(replacement.additions, [{ displayName: "30", hexValue: null }]);
assert.deepEqual(replacement.deletionIds, ["size-32"]);

const editor = readFileSync(new URL("../apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx", import.meta.url), "utf8");
const overview = readFileSync(new URL("../apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx", import.meta.url), "utf8");
assert.match(overview, /value === "남성" && props\.draft\.categoryMajor === "원피스"[\s\S]*categoryMajor: "", categoryDetail: ""/u);
assert.match(overview, /workOrderMajorCategoryPickerOptions\(props\.draft\.categoryMajor, props\.draft\.targetAudience/u);
const applyBatchSource = editor.slice(editor.indexOf("const applyBatch"), editor.indexOf("const structureBusy"));
assert.doesNotMatch(applyBatchSource, /confirmWaflDestructiveAction/u, "selection apply has no second global modal");
assert.match(editor, /WaflDecisionChoiceState/u);
assert.match(editor, /resolveStagedReplacementDecision/u);
assert.match(editor, /다른 WAFL 사이즈 보기/u);
assert.match(editor, /resolveReplacementConfirmation/u);
assert.match(editor, /if \(impact\) setReplacementDecision/u);
assert.match(editor, /else void props\.onApply\(diff\)/u, "zero-loss replacement executes immediately");

console.log("alpha69 target-major Size/standard-spec and same-sheet staged replacement contract: PASS");
