import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import seed from "../lib/domain/work-orders/measurement/waflBasicFitSeedV01.json" with { type: "json" };
import { getWaflBasicSpecTemplate, WAFL_BASIC_FIT_SEED_V01_VERSION } from "../lib/domain/work-orders/measurement/waflBasicSpecV1.ts";
import { resolveWaflRecommendedSizeLabels } from "../lib/domain/work-orders/catalog/workOrderSizeSpecRecommendationPolicy.mjs";
import { createWaflDecisionGuard } from "../apps/mobile/domain/waflDecisionPolicy.ts";
import { resolveCategoryDependentResetDecision } from "../apps/mobile/domain/categoryResetPolicy.ts";
import { resolveStagedReplacementDecision } from "../apps/mobile/domain/sizeColorSelectionBatchPolicy.ts";

const expected = {
  women_tops: {
    poms: ["body_length", "shoulder_width", "chest_width", "waist_width", "hem_width", "armhole_depth", "sleeve_length", "upper_arm_width"],
    rows: { "44": [62,37,44.5,42.5,44.5,20,57.5,16.5], "55": [63.5,38,46.5,44.5,46.5,20.5,58,17.5], "66": [65,39,48.5,46.5,48.5,21,58.5,18.5], "77": [66.5,40,51,49,51,21.5,59,19.5], "2XL": [69.5,42.5,56,54,56,23,60.5,22], FREE: [66,42,54,52,54,22.5,58.5,20.5] },
  },
  women_bottoms: {
    poms: ["body_length", "waist_width", "hip_width", "front_rise", "back_rise", "thigh_width", "knee_width", "hem_width", "inseam"],
    rows: { "44": [97,32,46,26,36,28,20,17,71.5], "55": [98,34,48,26.7,36.7,29,20.7,17.7,72], "66": [99,36,50,27.4,37.4,30,21.4,18.4,72.5], "77": [100,38,52,28.1,38.1,31,22.1,19.1,73], "24": [97,31.5,45,25.8,35.8,27.5,19.8,17,71.5], "26": [98,34,47,26.5,36.5,28.5,20.5,17.5,72], "28": [99,36.5,49,27.2,37.2,29.5,21.2,18,72.5], "30": [100,39,51,27.9,37.9,30.5,21.9,18.5,73], "32": [101,41.5,53,28.6,38.6,31.5,22.6,19,73.5], "34": [102,44,55,29.3,39.3,32.5,23.3,19.5,74], "36": [103,46.5,57,30,40,33.5,24,20,74.5], FREE: [100,35,52,28.5,38.5,31,22.5,19,73] },
  },
  women_outerwear: {
    poms: ["body_length", "shoulder_width", "chest_width", "waist_width", "hem_width", "armhole_depth", "sleeve_length", "upper_arm_width"],
    rows: { "44": [67,37.5,45,43.5,46,21.5,58.5,18], "55": [69,38.5,47,45.5,48,22,59.5,19], "66": [71,39.5,49,47.5,50,22.5,60,20], "77": [73,40.5,51.5,50,52.5,23,60.5,21], "2XL": [76,43,57,55.5,58,24.5,62,23.5], FREE: [72,44,55,53,56,24,60,22] },
  },
  women_dresses: {
    poms: ["body_length", "shoulder_width", "chest_width", "waist_width", "hip_width", "hem_width", "armhole_depth", "sleeve_length"],
    rows: { "44": [114,37.5,44,35.5,47,62,20,57], "55": [116,38.5,46,37.5,49,64,20.5,57.5], "66": [118,39.5,48,39.5,51,66,21,58], "77": [120,40.5,50.5,42,53.5,68,21.5,58.5], "2XL": [123,43,55.5,47,58.5,73,23,60], FREE: [119,42,52.5,44,55,70,22,58.5] },
  },
  men_tops: {
    poms: ["body_length", "shoulder_width", "chest_width", "waist_width", "hem_width", "armhole_depth", "sleeve_length", "upper_arm_width"],
    rows: { XS: [63,42,46,45,46,21,58,17], S: [65,43.5,49,48,49,22,59,18], M: [68,45,52,51,52,23,60,19], L: [71,46.5,55,54,55,24,61,20], XL: [74,48.5,59,58,59,25,62,21.5], "2XL": [76,50.5,63,62,63,26,63,23], FREE: [70,48,58,57,58,24.5,60,21] },
  },
  men_bottoms: {
    poms: ["body_length", "waist_width", "hip_width", "front_rise", "back_rise", "thigh_width", "knee_width", "hem_width", "inseam"],
    rows: { "24": [98.5,32.5,42,22.5,32.5,26,18.5,16,76], "26": [99,35,44.5,23,33,27.5,19,16.5,76], "28": [99.5,37.5,46.5,23.5,33.5,29,19.5,17,76], "30": [100,40,49,24.2,34.2,30.5,20,17.5,76], "32": [100.5,42.5,51.5,24.9,34.9,32,20.5,18,76], "34": [101,45,54,25.6,35.6,34,21,18.5,76], "36": [101.5,47.5,56.5,26.2,36.2,35.5,21.5,19,76], FREE: [100,39,52,29,39,33,22.5,20,74] },
  },
  men_outerwear: {
    poms: ["body_length", "shoulder_width", "chest_width", "waist_width", "hem_width", "armhole_depth", "sleeve_length", "upper_arm_width"],
    rows: { XS: [68,43,50,48,51,23,59,18.5], S: [70,44.5,52.5,50.5,53.5,24,60,19.5], M: [72,46,55,53,56,25,61,20.5], L: [74,47.5,57.5,55.5,58.5,26,62,21.5], XL: [76,49,60.5,58.5,61.5,27,63,22.5], "2XL": [78,50.5,63.5,61.5,64.5,28,64,23.5], FREE: [73,48,59,57,60,26,61,22] },
  },
};

assert.equal(WAFL_BASIC_FIT_SEED_V01_VERSION, "WAFL_BASIC_FIT_SEED_V0_1");
assert.deepEqual(Object.keys(seed.templates), Object.keys(expected));
for (const [key, fixture] of Object.entries(expected)) {
  assert.deepEqual(seed.templates[key].poms, fixture.poms, `${key} POM order`);
  assert.deepEqual(seed.templates[key].valuesCm, fixture.rows, `${key} all exact rows`);
  for (const row of Object.values(fixture.rows)) assert.equal(row.length, fixture.poms.length, `${key} row width`);
}

assert.deepEqual(resolveWaflRecommendedSizeLabels("남성", "B"), ["28", "30", "32", "34", "36", "FREE"]);
const menBottom = getWaflBasicSpecTemplate("B", null, "남성");
assert.deepEqual(menBottom.sizes, ["24", "26", "28", "30", "32", "34", "36", "FREE"]);
assert.equal(menBottom.valuesCm[32]["허리단면"], 42.5);
assert.equal(menBottom.valuesCm[32]["힙단면"], 51.5);
assert.equal(menBottom.valuesCm[32]["앞밑위"], 24.9);

const targetDecision = resolveCategoryDependentResetDecision({ changed: true, hasDependents: true, kind: "targetAudience" });
assert.deepEqual(targetDecision, { title: "성별을 변경할까요?", helper: "적용 중인 사이즈와 스펙 정보가 초기화됩니다.", safeLabel: "취소", actionLabel: "변경" });
assert.equal(resolveCategoryDependentResetDecision({ changed: false, hasDependents: true, kind: "targetAudience" }), null);
assert.equal(resolveCategoryDependentResetDecision({ changed: true, hasDependents: false, kind: "categoryMajor" }), null);
assert.equal(resolveCategoryDependentResetDecision({ changed: true, hasDependents: true, kind: "categoryMajor" }).title, "대분류를 변경할까요?");
const sizeDecision = resolveStagedReplacementDecision({ targetKind: "size", impact: { hasLoss: true, removedQuantity: 0, removedMeasurementValueCount: 1 } });
assert.deepEqual(sizeDecision, { title: "사이즈를 변경할까요?", helper: "적용 중인 스펙 정보가 함께 삭제됩니다.", safeLabel: "취소", actionLabel: "변경" });
assert.equal(resolveStagedReplacementDecision({ targetKind: "color", impact: { hasLoss: false, removedQuantity: 0, removedMeasurementValueCount: 0 } }), null);
assert.equal(resolveStagedReplacementDecision({ targetKind: "color", impact: { hasLoss: true, removedQuantity: 1, removedMeasurementValueCount: 0 } }).helper, "입력된 수량 정보가 함께 삭제됩니다.");

let cancels = 0;
let commands = 0;
const cancelGuard = createWaflDecisionGuard(() => { cancels += 1; }, () => { commands += 1; });
assert.equal(cancelGuard.dismiss(), true);
assert.equal(cancelGuard.apply("action"), false);
assert.deepEqual({ cancels, commands }, { cancels: 1, commands: 0 });
const actionGuard = createWaflDecisionGuard(() => { cancels += 1; }, () => { commands += 1; });
assert.equal(actionGuard.apply("action"), true);
assert.equal(actionGuard.apply("action"), false);
assert.equal(commands, 1);

const inputSheet = readFileSync(new URL("../apps/mobile/features/inputs/WaflInputSheet.tsx", import.meta.url), "utf8");
const decisionChoiceBody = readFileSync(new URL("../apps/mobile/features/feedback/WaflDecisionChoiceBody.tsx", import.meta.url), "utf8");
const structureEditor = readFileSync(new URL("../apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx", import.meta.url), "utf8");
const templateSheets = readFileSync(new URL("../apps/mobile/features/work-orders/size-color/MeasurementTemplateSheets.tsx", import.meta.url), "utf8");
assert.match(inputSheet, /renderedChildren = decision \? <WaflDecisionChoiceBody/u);
assert.doesNotMatch(inputSheet, /<WaflDecisionOverlay/u);
assert.match(decisionChoiceBody, /WaflOptionReel/u);
assert.doesNotMatch(decisionChoiceBody, /\bModal\b|styles\.card|confirmAction/u);
assert.match(structureEditor, /resolveStagedReplacementDecision/u);
assert.doesNotMatch(structureEditor, /치수 \$\{|삭제 후 적용|createStagedReplacementLossMessage/u);
assert.match(templateSheets, /processingMessage=\{props\.pending && selected\?\.sourceKind === "system" \? "스펙 정보를 불러오는 중입니다\." : null\}/u);
assert.match(templateSheets, /processingHelper=\{props\.pending && selected\?\.sourceKind === "system" \? "잠시만 기다려 주세요\." : null\}/u);

console.log("alpha69 exact V0.1 starter seed, same-sheet decision choice, and spec blocker contract: PASS");
