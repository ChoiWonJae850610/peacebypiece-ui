#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { WAFL_THEME } from "../apps/mobile/constants/theme.ts";
import {
  isValidWaflSheetWindowMeasurement,
  resolveWaflSheetVisualRevealPlan,
} from "../apps/mobile/domain/waflSheetDetentPolicy.ts";
import { resolveWaflSheetKeyboardRestoreOffset } from "../apps/mobile/domain/waflSheetKeyboardRestorePolicy.ts";

const read = (file) => fs.readFileSync(file, "utf8");
const windowBounds = { windowHeight: 844, windowWidth: 390 };
const validField = { x: 24, y: 612, width: 342, height: 48 };

assert.equal(WAFL_THEME.sheet.textEntryFocusRevealClearance, 72);
assert.equal(isValidWaflSheetWindowMeasurement({ measurement: validField, target: "field", ...windowBounds }), true);
assert.equal(isValidWaflSheetWindowMeasurement({ measurement: { ...validField, height: 0 }, target: "field", ...windowBounds }), false);
assert.equal(isValidWaflSheetWindowMeasurement({ measurement: { ...validField, width: Number.NaN }, target: "field", ...windowBounds }), false);
assert.equal(isValidWaflSheetWindowMeasurement({ measurement: { ...validField, y: 2_000 }, target: "field", ...windowBounds }), false);
assert.equal(isValidWaflSheetWindowMeasurement({ measurement: { x: 0, y: 0, width: 390, height: 0 }, target: "viewport", ...windowBounds }), false);

const base = {
  bodyOffset: 0,
  expectedVisualSheetTop: 200,
  fieldHeight: 48,
  intrinsicBodyContentHeight: 180,
  keyboardInset: 344,
  keyboardTop: 500,
  measuredFieldTop: 430,
  measuredSheetTop: 200,
  measuredViewportTop: 300,
  semanticGap: 72,
  settledOffset: 200,
  translatedOffset: 200,
  viewportHeight: 340,
};
const shortForm = resolveWaflSheetVisualRevealPlan(base);
const longForm = resolveWaflSheetVisualRevealPlan({ ...base, intrinsicBodyContentHeight: 520 });
const partialForm = resolveWaflSheetVisualRevealPlan({ ...base, intrinsicBodyContentHeight: 360 });
assert.equal(shortForm.requiredRise, 50);
assert.equal(shortForm.targetOffset, 150);
assert.equal(longForm.requiredRise, 0);
assert.equal(longForm.scrollDelta, 50);
assert.equal(partialForm.requiredRise, 30);

let translatedOffset = base.translatedOffset;
let animateToCalls = 0;
let scrollToCalls = 0;
if (shortForm.requiredRise > 0 && shortForm.targetOffset < translatedOffset) {
  animateToCalls += 1;
  translatedOffset = shortForm.targetOffset;
} else if (Math.abs(shortForm.scrollDelta) >= 1) {
  scrollToCalls += 1;
}
assert.equal(animateToCalls, 1);
assert.equal(translatedOffset, 150);
assert.equal(scrollToCalls, 0);

for (let cycle = 0; cycle < 3; cycle += 1) {
  assert.equal(resolveWaflSheetKeyboardRestoreOffset({ settledOffset: 200, userDragged: false }), 200);
}
assert.equal(resolveWaflSheetKeyboardRestoreOffset({ settledOffset: 200, userDragged: true }), null);

const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const focus = read("apps/mobile/features/inputs/WaflSheetTextInput.tsx");
assert.match(focus, /readonly inputRef: TextInput/u);
assert.match(focus, /readonly revealRef: View \| TextInput/u);
assert.match(focus, /const mountedReveal = resolveFocusBlockRef\?\.\(\) \?\? mountedInput/u);
assert.match(sheet, /measureMountedTarget\(target\.revealRef\)/u);
assert.match(sheet, /measureMountedTarget\(resolveBodyViewportMeasureRef\(\)\)/u);
assert.match(sheet, /measureMountedTarget\(sheetRef\.current\)/u);
assert.equal((sheet.match(/UIManager\.measureInWindow\(/gu) ?? []).length, 1, "numeric handle must be bounded fallback only");
assert.match(sheet, /const primary = await measureFromRefs\(\)/u);
assert.match(sheet, /const retry = await measureFromRefs\(\)/u);
assert.match(sheet, /return measureFromHandles\(\)/u);
assert.match(sheet, /focusedTargetRef\.current\?\.focusGeneration === target\.focusGeneration/u);
assert.match(sheet, /target\.openGeneration === openGenerationRef\.current/u);
assert.match(sheet, /revealRunGenerationRef\.current === runGeneration/u);
assert.match(sheet, /resolveWaflDirectInputRevealMotion/u);
assert.match(sheet, /motion\.sheetRise > 0/u);
assert.match(sheet, /animateTo\(motion\.targetOffset/u);
assert.match(sheet, /bodyScrollRef\.current\?\.scrollTo/u);
assert.doesNotMatch(sheet, /textEntryFocusRevealClearance\s*=\s*(100|112)/u);

const inventory = [
  ["apps/mobile/features/work-orders/create/WorkOrderCreateSheet.tsx", 1],
  ["apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx", 1],
  ["apps/mobile/features/work-orders/size-color/SpecItemSelectionSheet.tsx", 1],
  ["apps/mobile/features/work-orders/size-color/MeasurementTemplateSheets.tsx", 1],
  ["apps/mobile/features/work-orders/overview/WorkOrderOverviewPickerSheets.tsx", 2],
  ["apps/mobile/features/work-orders/documents/QuickDeliveryFoundation.tsx", 1],
];
for (const [file, expected] of inventory) {
  assert.equal((read(file).match(/WAFL_THEME\.sheet\.textEntryFocusRevealClearance/gu) ?? []).length, expected, file);
}
assert.doesNotMatch(read("apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx"), /resolveBodyViewportMeasureRef/u);
assert.doesNotMatch(read("apps/mobile/features/feedback/WaflDecisionSheet.tsx"), /resolveBodyViewportMeasureRef/u);

console.log(JSON.stringify({
  contract: "workorder-v2-alpha68-ref-measurement-physical-reveal-fix",
  measurementOwner: "mounted-ref-primary",
  invalidMeasurementCases: 4,
  boundedRefAttempts: 2,
  numericFallbackAttempts: 1,
  revealCases: { short: shortForm.requiredRise, long: longForm.requiredRise, partial: partialForm.requiredRise },
  animateToCalls,
  translatedOffset,
  equivalentTextEntryOwners: 7,
  keyboardCycles: 3,
  physicalResultInferred: false,
}));
