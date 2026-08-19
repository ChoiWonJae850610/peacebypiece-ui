#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { createInlineEditFinalizationController } from "../apps/mobile/lib/inlineEditFinalization.ts";
import {
  calculateOrderQuantity,
  normalizeNumericCommitValue,
  prepareNumericDraftOnFocus,
} from "../apps/mobile/lib/mobileDisplay.ts";
import {
  decodeWorkOrderCategory,
  encodeWorkOrderProductType,
  WORK_ORDER_CATEGORY_MAJORS,
  WORK_ORDER_TARGET_AUDIENCES,
  workOrderMajorCategoryPickerOptions,
} from "../apps/mobile/domain/workOrderCategoryPolicy.ts";

const read = (file) => fs.readFileSync(file, "utf8");
const controlled = read("apps/mobile/components/ControlledInlineEditValue.tsx");
const reel = read("apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx");
const overview = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const gallery = read("apps/mobile/features/work-orders/images/WorkOrderImageGallery.tsx");
const materials = read("apps/mobile/features/materials/WorkOrderMaterialsReadOnly.tsx");
const materialEditor = read("apps/mobile/features/materials/WorkOrderMaterialEditor.tsx");
const experience = [
  read("apps/mobile/features/MobileWorkOrderExperience.tsx"),
  read("apps/mobile/features/materials/useWorkOrderMaterialAuthoringController.ts"),
].join("\n");
const validation = read("apps/mobile/domain/workOrderValidation.ts");

assert.deepEqual(["", ...WORK_ORDER_TARGET_AUDIENCES], ["", "여성", "남성", "공용", "키즈", "기타"]);
assert.deepEqual(["", ...WORK_ORDER_CATEGORY_MAJORS], ["", "상의", "하의", "아우터", "원피스", "셋업", "기타"]);
assert.deepEqual(workOrderMajorCategoryPickerOptions(""), ["", "상의", "하의", "아우터", "원피스", "기타"]);
assert.deepEqual(workOrderMajorCategoryPickerOptions("셋업"), ["", "셋업", "상의", "하의", "아우터", "원피스", "기타"]);
const other = encodeWorkOrderProductType({ targetAudience: "기타", categoryMajor: "기타" });
assert.equal(other, "wafl-c1|X|X");
assert.deepEqual(decodeWorkOrderCategory({ productTypeCode: other, itemCode: null, seasonCode: null }), {
  targetAudience: "기타",
  categoryMajor: "기타",
  categoryDetail: "",
  seasonCode: "",
});

assert.equal(prepareNumericDraftOnFocus("0"), "");
assert.equal(normalizeNumericCommitValue(""), "0");
assert.equal(normalizeNumericCommitValue("00081"), "81");
assert.equal(normalizeNumericCommitValue("08161"), "8161");
assert.equal(calculateOrderQuantity({
  requiredQuantity: "3",
  allowanceQuantity: "1.5",
  inventoryUsageQuantity: "2",
}), "4.5");

const blurSubmit = createInlineEditFinalizationController("old");
blurSubmit.observe("new");
assert.equal(blurSubmit.requestSave(), true);
assert.equal(blurSubmit.requestSave(), false);
assert.deepEqual(blurSubmit.finalize("new"), { shouldSave: true, value: "new" });
assert.deepEqual(blurSubmit.finalize("new"), { shouldSave: false, value: "new" });

for (const testId of [
  "overview-inline-target-audience",
  "overview-inline-category-major",
  "overview-inline-category-detail",
  "overview-inline-season",
]) assert.match(overview, new RegExp(testId));
assert.match(overview, /label="총 수량"[\s\S]{0,140}header\.totalQuantity\.toLocaleString/);
assert.doesNotMatch(overview, /overview-inline-total-quantity|field="totalQuantity"/);
assert.match(overview, /<InlineDatePicker[\s\S]*label="납기"|label="납기"[\s\S]*<InlineDatePicker/);
assert.equal((overview.match(/commitMode="blur-submit"/g) ?? []).length, 3);
assert.equal((overview.match(/kind="option"/g) ?? []).length, 2);
assert.match(overview, /options=\{\["", \.\.\.WORK_ORDER_TARGET_AUDIENCES\]\}/);
assert.match(overview, /options=\{workOrderMajorCategoryPickerOptions\(props\.draft\.categoryMajor\)\}/);

assert.match(reel, /renderPath === "single-choice-reel" \? \(/);
assert.match(reel, /kind !== "unit" && !optionOnly/);
assert.match(reel, /label: option\.label \|\| WAFL_UNSET_PLACEHOLDER/);
assert.doesNotMatch(reel.slice(reel.indexOf('{renderPath === "single-choice-reel" ? ('), reel.indexOf(') : renderPath === "numeric-reel"')), /stepOptions|keyboardType|toggleMode/);

assert.match(controlled, /commitMode\?: "explicit" \| "blur-submit"/);
assert.match(controlled, /onSubmitEditing=\{inlineCommit && !multiline \? handleSubmitEditing : undefined\}/);
assert.match(controlled, /if \(inlineCommit\) finalizationRef\.current\.requestSave\(\)/);
assert.match(controlled, /!\s*inlineCommit \? <View style=\{styles\.actions\}>/);
assert.doesNotMatch(`${controlled}\n${gallery}\n${materials}\n${experience}`, /setInterval|setTimeout\([^,]+,\s*\d+\).*save/is);

assert.doesNotMatch(gallery, /work-order-factory-delivery-memo|saveMemoInline|FACTORY_DELIVERY_MEMO_MAX_LENGTH|공장 전달 메모/);

assert.match(materials, /commitMode=\{\["name", "colorOption", "unitPrice", "usageArea", "memo"\]\.includes\(field\) \? "blur-submit" : "explicit"\}/);
assert.match(materials, /const fieldEditable = canEdit && orderPolicy\.canEdit/);
assert.doesNotMatch(materials, /field="orderQuantity"/);

assert.match(materialEditor, /prepareNumericDraftOnFocus\(state\.draft\[field\]\)/);
assert.match(materialEditor, /normalizeNumericCommitValue\(state\.draft\[field\]\)/);
assert.match(validation, /normalizeNumericCommitValue\(draft\.totalQuantity\)/);
assert.match(validation, /normalizeNumericCommitValue\(draft\.unitPrice\)/);
assert.match(experience, /inlineRollback[\s\S]*\["name", "colorOption", "unitPrice", "usageArea", "memo"\]\.includes\(inlineOwner\.field\)/);
assert.match(experience, /ownsMaterialInlineEditSession\(materialInlineSessionRef\.current, inlineOwner\)/);
assert.match(experience, /rollbackBasicInline/);
assert.match(experience, /Object\.keys\(patch\)\.length === 0[\s\S]*cancelBasicInfoEdit\(\)/);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha57-v10-qa-fix",
  basicAffordance: 6,
  categoryOptionReels: 2,
  inlineActionClusters: 0,
  duplicatePatch: 0,
  emptyNumericCommit: "0",
}));
