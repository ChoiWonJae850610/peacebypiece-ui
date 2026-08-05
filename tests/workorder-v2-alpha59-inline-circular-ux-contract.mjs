#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { createInlineEditFinalizationController } from "../apps/mobile/lib/inlineEditFinalization.ts";
import {
  QUARTER_FRACTION_VALUES,
  circularLogicalIndex,
  circularRecenterIndex,
  composeQuarterQuantity,
  createCircularReelWindow,
  decomposeQuarterQuantity,
  quarterFractionOptions,
} from "../apps/mobile/features/inputs/reel-picker/reelPickerModel.ts";

const read = (file) => fs.readFileSync(file, "utf8");
const option = (value) => ({ key: value, value, label: value.toUpperCase() });

const three = [option("a"), option("b"), option("c")];
const circular = createCircularReelWindow(three, "b");
assert.equal(circular.circular, true);
assert.equal(circular.options.length, 27);
assert.equal(circularLogicalIndex(circular, circular.selectedIndex), 1);
const middleCopyStart = circular.selectedIndex - 1;
assert.equal(circularLogicalIndex(circular, middleCopyStart + 2 + 1), 0, "last must continue to first");
assert.equal(circularLogicalIndex(circular, middleCopyStart - 1), 2, "first must continue to last");
const recentered = circularRecenterIndex(circular, 1);
assert.notEqual(recentered, null);
assert.equal(circularLogicalIndex(circular, recentered), circularLogicalIndex(circular, 1));

const single = createCircularReelWindow([option("only")], "only");
assert.equal(single.circular, false);
assert.equal(single.options.length, 1);
assert.equal(circularRecenterIndex(single, 0), null);
const two = createCircularReelWindow([option("left"), option("right")], "right");
assert.equal(two.circular, true);
assert.equal(circularLogicalIndex(two, two.selectedIndex), 1);
const dynamic = createCircularReelWindow([option("new"), option("b"), option("c")], "b");
assert.equal(dynamic.options[dynamic.selectedIndex].value, "b", "dynamic lists preserve the stable selected ID");

assert.deepEqual(QUARTER_FRACTION_VALUES, ["0", "0.25", "0.5", "0.75"]);
assert.deepEqual(quarterFractionOptions().map((entry) => entry.value), ["0", "0.25", "0.5", "0.75"]);
assert.deepEqual(decomposeQuarterQuantity("2.5"), {
  integerPart: "2", fractionPart: "0.5", exactQuarter: true, preservedValue: null,
});
assert.equal(composeQuarterQuantity("2", "0.5"), "2.5");
assert.equal(composeQuarterQuantity("2", "0"), "2");
assert.deepEqual(decomposeQuarterQuantity("2.125"), {
  integerPart: "2", fractionPart: "0", exactQuarter: false, preservedValue: "2.125",
});

const finalization = createInlineEditFinalizationController("서버값");
assert.equal(finalization.requestSave(), true);
assert.equal(finalization.requestSave(), false, "submit and blur share one pending commit");
assert.deepEqual(finalization.finalize("변경값"), { shouldSave: true, value: "변경값" });
assert.deepEqual(finalization.finalize("변경값"), { shouldSave: false, value: "변경값" });

const shell = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const controlled = read("apps/mobile/components/ControlledInlineEditValue.tsx");
const overview = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const materials = read("apps/mobile/features/materials/WorkOrderMaterialsReadOnly.tsx");
const materialEditor = read("apps/mobile/features/materials/WorkOrderMaterialEditor.tsx");
const reel = read("apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx");
const structure = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx");
const experience = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const migration = read("db/v2/migrations/002_v2_work_orders_revisions.sql");
const quantityMigration = read("db/v2/migrations/003_v2_revision_content.sql");
const mobileValidation = read("apps/mobile/domain/workOrderValidation.ts");
const runtime = read("scripts/run-wafl-v2-alpha59-size-color-structure-runtime-qa.mjs");

assert.doesNotMatch(shell, /X는 변경을 취소|Check는 입력을 저장|사용법|개발 진행|공통 입력 모듈/);
assert.match(shell, />WAFL INPUT</);
assert.match(structure, /title=\{props\.kind === "size" \? "사이즈" : "색상"\}/);
assert.doesNotMatch(structure, /title=\{props\.kind === "size" \? "사이즈 이름" : "색상 이름"\}/);
assert.match(structure, /accessibilityRole="alert"/);

assert.match(overview, /accessibilityLabel="제품명"[\s\S]{0,180}commitMode="blur-submit"/);
for (const field of ["name", "colorOption", "unitPrice"]) {
  assert.match(materials, new RegExp(`commitMode=\\{\\["name", "colorOption", "unitPrice"[\\s\\S]{0,180}includes\\(field\\)`));
  assert.match(experience, new RegExp(`\\["name", "colorOption", "unitPrice"[\\s\\S]{0,180}includes\\(inlineOwner\\.field\\)`));
  assert.ok(field.length > 0);
}
assert.match(materials, /MaterialInlineField[^\n]+field="unitPrice"[^\n]+keyboardType="number-pad"/);
assert.match(materialEditor, /<EditorField field="unitPrice" keyboardType="number-pad"/);
assert.doesNotMatch(`${materials}\n${materialEditor}\n${reel}`, /reelTarget\.field === "unitPrice"|kind="currency"|"currency" \|/);
assert.match(controlled, /if \(result\.value === activationValueRef\.current\)[\s\S]{0,100}onCancel\(\)/);
assert.match(controlled, /\{!inlineCommit \? <View style=\{styles\.actions\}>/);
const submitBlock = controlled.slice(controlled.indexOf("function handleSubmitEditing"), controlled.indexOf("function handleCancel"));
assert.match(submitBlock, /requestSave\(\)/);
assert.match(submitBlock, /inputRef\.current\.blur\(\)/);
assert.match(experience, /rollbackBasicInline\(true\)/);
assert.match(experience, /await refreshInlineMaterial\(error\.entityVersion\)/);

assert.match(reel, /createCircularReelWindow/);
assert.match(reel, /circularRecenterIndex/);
assert.match(reel, /CircularOptionReelColumn[^\n]*accessibilityLabel="원단·부자재 단위 릴"/);
assert.match(overview, /field="targetAudience"[\s\S]{0,180}kind="option"/);
assert.match(overview, /field="categoryMajor"[\s\S]{0,180}kind="option"/);
assert.match(structure, /<WaflOptionReel/);
assert.match(reel, /platformReelHaptics\.selectionChanged/);
assert.match(reel, /logicalOption\?\.label[\s\S]{0,180}now: logicalIndex \+ 1/);

assert.match(reel, /kind === "quantity" \? <View style=\{styles\.intervalReel\}>[\s\S]{0,120}>소수</);
assert.match(reel, /composeQuarterQuantity/);
assert.match(reel, /기존값 \{quantityParts\.preservedValue\}/);
assert.doesNotMatch(QUARTER_FRACTION_VALUES.join("/"), /(?:^|\/)1(?:\/|$)|(?:^|\/)5(?:\/|$)|(?:^|\/)10(?:\/|$)/);

const materialAddStyle = materials.match(/addButton:\s*\{[^}]+\}/)?.[0] ?? "";
const structureActionStyle = structure.match(/structureAction:\s*\{[^}]+\}/)?.[0] ?? "";
for (const token of ['backgroundColor: "#17263d"', "borderRadius: 8", "minHeight: 44"]) {
  assert.ok(materialAddStyle.includes(token), `material add grammar missing ${token}`);
  assert.ok(structureActionStyle.includes(token), `size/color action must reuse ${token}`);
}
assert.doesNotMatch(structure, /structureCard:|fontSize: 2[0-9].*count|textDecorationLine: "underline"/);

assert.match(migration, /total_quantity integer NOT NULL/);
assert.match(migration, /total_quantity_snapshot integer NOT NULL/);
assert.match(quantityMigration, /quantity integer NOT NULL/);
assert.match(mobileValidation, /if \(!\/\^\\d\+\$\/\.test\(totalQuantity\)\)/);
assert.match(overview, /label="총 수량"[\s\S]{0,120}header\.totalQuantity\.toLocaleString/);
assert.doesNotMatch(overview, /field="totalQuantity"|onBeginEdit\("totalQuantity"\)|overview-inline-total-quantity/);
assert.match(runtime, /TOTAL_QUANTITY_DECIMAL_MIGRATION_REQUIRED/);

assert.match(structure, /onAddSizes|onAddColors|COLOR_PALETTE_PRESETS|CUSTOM_COLOR_GROUPS/);
assert.doesNotMatch(structure, /delete|archive|restore/i);

console.log("workorder v2 alpha.59 inline circular UX contract: PASS");
