#!/usr/bin/env node
import assert from "node:assert/strict";

import { createSelectionTickGate } from "../apps/mobile/features/inputs/reel-picker/reelPickerHaptics.ts";
import {
  MATERIAL_QUANTITY_MAX,
  REEL_STEPS,
  createReelWindow,
  defaultReelStep,
  materialUnitOptions,
  normalizeReelValue,
  reelIndexForValue,
  reelStepOptions,
  reelValueAtIndex,
} from "../apps/mobile/features/inputs/reel-picker/reelPickerModel.ts";
import { INITIAL_REEL_PICKER_STATE, reelPickerReducer } from "../apps/mobile/features/inputs/reel-picker/reelPickerState.ts";

assert.deepEqual(REEL_STEPS, ["0.1", "0.5", "1", "5", "10", "50"]);
assert.deepEqual(reelStepOptions().map((option) => option.value), ["0.1", "0.5", "1", "5", "10", "50"]);
assert.deepEqual(reelStepOptions(true).map((option) => option.value), ["1", "5", "10", "50"]);
for (const unit of ["개", "장", "벌", "EA", "SET"]) assert.equal(defaultReelStep(unit), "1");
for (const unit of ["m", "yd", "kg"]) assert.equal(defaultReelStep(unit), "0.1");
const canonicalUnitOrder = ["개", "장", "벌", "m", "yd", "kg"];
assert.deepEqual(materialUnitOptions("yd"), canonicalUnitOrder);
assert.deepEqual(materialUnitOptions("m"), canonicalUnitOrder, "selecting a canonical unit must not reorder the wheel");
assert.deepEqual(materialUnitOptions("kg"), canonicalUnitOrder, "unit wheel order must remain stable across selections");
assert.equal(materialUnitOptions("roll").at(-1), "roll", "current server-supported custom unit must not be discarded");

const decimalWindow = createReelWindow("0.5", "0.1", 5);
assert.equal(decimalWindow.options.length, 11);
assert.equal(reelValueAtIndex(decimalWindow, decimalWindow.selectedIndex), "0.5");
assert.equal(reelValueAtIndex(decimalWindow, decimalWindow.selectedIndex + 1), "0.6");
assert.equal(reelValueAtIndex(decimalWindow, decimalWindow.selectedIndex + 5), "1");
assert.equal(reelIndexForValue(decimalWindow, "0.7"), decimalWindow.selectedIndex + 2);
assert.equal(decimalWindow.options.some((option) => /00000000000000004/u.test(option.value)), false, "0.1 must not drift");

const halfWindow = createReelWindow("12.25", "0.5", 2);
assert.deepEqual(halfWindow.options.map((option) => option.value), ["11.25", "11.75", "12.25", "12.75", "13.25"]);
assert.equal(createReelWindow("0", "1").selectedIndex, 0);
const maxWindow = createReelWindow(MATERIAL_QUANTITY_MAX, "0.1");
assert.equal(maxWindow.selectedIndex, maxWindow.options.length - 1);
assert.ok(maxWindow.options.length <= 101, "reel window must stay bounded");
assert.equal(normalizeReelValue("0005.500"), "5.5");
assert.equal(normalizeReelValue("999999999999"), null);

let picker = reelPickerReducer(INITIAL_REEL_PICKER_STATE, { type: "open", field: "requiredQuantity", label: "필요수량", value: "10", unit: "yd" });
assert.equal(picker.openCount, 1);
picker = reelPickerReducer(picker, { type: "select-value", value: "10.5" });
picker = reelPickerReducer(picker, { type: "select-unit", unit: "m" });
const cancelled = reelPickerReducer(picker, { type: "cancel" });
assert.equal(cancelled.selectedValue, "10");
assert.equal(cancelled.selectedUnit, "yd");
assert.equal(cancelled.closeCount, 1);
picker = reelPickerReducer(cancelled, { type: "open", field: "requiredQuantity", label: "필요수량", value: "10", unit: "yd" });
picker = reelPickerReducer(picker, { type: "select-value", value: "11" });
const applied = reelPickerReducer(picker, { type: "apply" });
assert.equal(applied.selectedValue, "11");
assert.equal(applied.phase, "closed");

const tick = createSelectionTickGate(70);
assert.equal(tick(1, 100), true);
assert.equal(tick(1, 200), false);
assert.equal(tick(2, 150), false);
assert.equal(tick(2, 171), true);

console.log("workorder v2 alpha.54 reel picker model contract: PASS");
