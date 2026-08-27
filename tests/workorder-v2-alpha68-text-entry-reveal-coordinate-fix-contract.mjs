#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { WAFL_THEME } from "../apps/mobile/constants/theme.ts";
import {
  resolveWaflSheetFieldReveal,
  resolveWaflSheetVisualRevealPlan,
} from "../apps/mobile/domain/waflSheetDetentPolicy.ts";
import { resolveWaflSheetKeyboardRestoreOffset } from "../apps/mobile/domain/waflSheetKeyboardRestorePolicy.ts";

const read = (file) => fs.readFileSync(file, "utf8");
const clearance = WAFL_THEME.sheet.textEntryFocusRevealClearance;
assert.equal(clearance, 72, "coordinate repair must not retune the accepted semantic clearance");

const base = {
  bodyOffset: 0,
  expectedVisualSheetTop: 250,
  fieldHeight: 48,
  intrinsicBodyContentHeight: 180,
  keyboardInset: 344,
  keyboardTop: 500,
  measuredFieldTop: 230,
  measuredSheetTop: 50,
  measuredViewportTop: 100,
  semanticGap: clearance,
  settledOffset: 200,
  translatedOffset: 200,
  viewportHeight: 340,
};

// Before the repair, a native-driven 200-point transform omitted from the
// raw measurement makes an actually occluded field look safely above the
// keyboard and produces no rise.
const legacyRaw = resolveWaflSheetFieldReveal({
  availableForwardScroll: 0,
  fieldBottom: base.measuredFieldTop + base.fieldHeight,
  fieldTop: base.measuredFieldTop,
  keyboardTop: base.keyboardTop,
  semanticGap: clearance,
  viewportBottom: base.measuredViewportTop + base.viewportHeight,
  viewportTop: base.measuredViewportTop,
});
assert.equal(legacyRaw.requiredRise, 0);

const normalized = resolveWaflSheetVisualRevealPlan(base);
assert.equal(normalized.coordinateSpace, "visual-window");
assert.equal(normalized.sheetCoordinateCorrection, 200);
assert.equal(normalized.visualFieldTop, 430);
assert.equal(normalized.visualFieldBottom, 478);
assert.equal(normalized.visualViewportTop, 300);
assert.equal(normalized.visualKeyboardTop, 500);
assert.equal(normalized.currentGap, 22);
assert.equal(normalized.requiredRise, 50);
assert.equal(normalized.scrollDelta, 50);
assert.equal(normalized.targetOffset, 150);

// If the platform already reports transformed window coordinates, the sheet
// anchor correction is exactly zero and the transform is not double-applied.
const alreadyVisual = resolveWaflSheetVisualRevealPlan({
  ...base,
  measuredFieldTop: 430,
  measuredSheetTop: 250,
  measuredViewportTop: 300,
});
assert.equal(alreadyVisual.sheetCoordinateCorrection, 0);
assert.equal(alreadyVisual.visualFieldTop, normalized.visualFieldTop);
assert.equal(alreadyVisual.requiredRise, normalized.requiredRise);

const transformZero = resolveWaflSheetVisualRevealPlan({
  ...base,
  expectedVisualSheetTop: 50,
  settledOffset: 0,
  translatedOffset: 0,
});
assert.equal(transformZero.sheetCoordinateCorrection, 0);
assert.equal(transformZero.requiredRise, 0);

const shortForm = normalized;
assert.equal(shortForm.availableForwardScroll, 0);
assert.equal(shortForm.requiredRise, 50);
const longForm = resolveWaflSheetVisualRevealPlan({ ...base, intrinsicBodyContentHeight: 520 });
assert.equal(longForm.availableForwardScroll, 180);
assert.equal(longForm.requiredRise, 0);
assert.equal(longForm.scrollDelta, 50);
const partial = resolveWaflSheetVisualRevealPlan({ ...base, intrinsicBodyContentHeight: 360 });
assert.equal(partial.availableForwardScroll, 20);
assert.equal(partial.requiredRise, 30);
assert.equal(partial.scrollDelta, 50);

// A stale first visual frame is corrected by its sheet anchor, and the one
// bounded post-animation remeasure converges without cumulative drift.
const afterLift = resolveWaflSheetVisualRevealPlan({
  ...base,
  expectedVisualSheetTop: 200,
  settledOffset: 200,
  translatedOffset: normalized.targetOffset,
});
assert.equal(afterLift.sheetCoordinateCorrection, 150);
assert.equal(afterLift.requiredRise, 0);
assert.equal(afterLift.targetOffset, normalized.targetOffset);
for (let cycle = 0; cycle < 3; cycle += 1) {
  assert.equal(resolveWaflSheetKeyboardRestoreOffset({ settledOffset: 200, userDragged: false }), 200);
}
assert.equal(resolveWaflSheetKeyboardRestoreOffset({ settledOffset: 200, userDragged: true }), null);

const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
assert.equal((sheet.match(/UIManager\.measureInWindow\(/gu) ?? []).length, 1, "numeric-handle measurement is fallback-only");
assert.match(sheet, /measureMountedTarget\(target\.revealRef\)/u);
assert.match(sheet, /measureMountedTarget\(resolveBodyViewportMeasureRef\(\)\)/u);
assert.match(sheet, /measureMountedTarget\(sheetRef\.current\)/u);
assert.match(sheet, /expectedVisualSheetTop:\s*window\.height - expandedHeight \+ translatedRef\.current/u);
assert.match(sheet, /completion:\s*\(\) => requestAnimationFrame\(\(\) => requestAnimationFrame\(\(\) => \{ void measureAndScrollFieldBlock\(false\); \}\)\)/u);
assert.doesNotMatch(sheet, /translatedRef\.current \+ fieldPageY|fieldPageY \+ translatedRef\.current/u);

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
assert.doesNotMatch(read("apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx"), /resolveWaflSheetVisualRevealPlan/u);
assert.doesNotMatch(read("apps/mobile/features/feedback/WaflDecisionSheet.tsx"), /resolveWaflSheetVisualRevealPlan/u);

console.log(JSON.stringify({
  contract: "workorder-v2-alpha68-text-entry-reveal-coordinate-fix",
  coordinateRoot: "A-native-transform-measurement",
  legacyRequiredRise: legacyRaw.requiredRise,
  normalizedRequiredRise: normalized.requiredRise,
  scrollCapacityCases: { long: longForm.requiredRise, partial: partial.requiredRise, short: shortForm.requiredRise },
  boundedRemeasureFrames: 2,
  equivalentTextEntryOwners: inventory.reduce((sum, [, count]) => sum + count, 0),
  keyboardCycles: 3,
  physicalResultInferred: false,
}));
