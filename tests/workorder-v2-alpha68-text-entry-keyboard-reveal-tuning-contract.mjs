#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { WAFL_THEME } from "../apps/mobile/constants/theme.ts";
import {
  resolveWaflSheetFieldReveal,
  resolveWaflSheetFocusExpansion,
} from "../apps/mobile/domain/waflSheetDetentPolicy.ts";
import { resolveWaflSheetKeyboardRestoreOffset } from "../apps/mobile/domain/waflSheetKeyboardRestorePolicy.ts";

const read = (file) => fs.readFileSync(file, "utf8");
const clearance = WAFL_THEME.sheet.textEntryFocusRevealClearance;
assert.equal(clearance, 72);
assert.ok(clearance > WAFL_THEME.sheet.focusRevealContext);
assert.ok(clearance < WAFL_THEME.sheet.numericFocusRevealContext);

const reveal = (overrides = {}) => resolveWaflSheetFieldReveal({
  availableForwardScroll: 0,
  fieldBottom: 500,
  fieldTop: 440,
  keyboardTop: 500,
  semanticGap: clearance,
  viewportBottom: 700,
  viewportTop: 200,
  ...overrides,
});

const touching = reveal();
assert.equal(Math.max(0, clearance - (500 - 500)), clearance);
assert.equal(touching.requiredRise, clearance);
assert.equal(touching.scrollDelta, clearance);

const enoughRoom = reveal({ fieldBottom: 420 });
assert.equal(Math.max(0, clearance - (500 - 420)), 0);
assert.equal(enoughRoom.requiredRise, 0);
assert.equal(enoughRoom.scrollDelta, 0);

const partiallyScrollable = reveal({ availableForwardScroll: 28 });
assert.equal(partiallyScrollable.requiredRise, clearance - 28);
assert.equal(partiallyScrollable.scrollDelta, clearance);

for (const currentOffset of [24, 80, 240]) {
  const plan = resolveWaflSheetFocusExpansion({
    currentOffset,
    focusedBottom: 500,
    keyboardTop: 500,
    revealContext: clearance,
  });
  assert.equal(plan.requiredRise, clearance);
  assert.equal(plan.targetOffset, Math.max(0, currentOffset - clearance));
}

const restingOffset = 318;
for (let cycle = 0; cycle < 3; cycle += 1) {
  assert.equal(resolveWaflSheetKeyboardRestoreOffset({ settledOffset: restingOffset, userDragged: false }), restingOffset);
}
assert.equal(resolveWaflSheetKeyboardRestoreOffset({ settledOffset: restingOffset, userDragged: true }), null);

const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
assert.match(sheet, /intrinsicBodyContentHeightRef\.current - viewport\.height - bodyOffsetRef\.current/u);
assert.doesNotMatch(sheet, /availableForwardScroll:[^\n]*bodyContentHeightRef\.current/u);
assert.match(sheet, /allowExpansion && keyboardAutoExpand && keyboardInset > 0/u);

const inventory = [
  ["apps/mobile/features/work-orders/create/WorkOrderCreateSheet.tsx", 1],
  ["apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx", 1],
  ["apps/mobile/features/work-orders/size-color/SpecItemSelectionSheet.tsx", 1],
  ["apps/mobile/features/work-orders/size-color/MeasurementTemplateSheets.tsx", 1],
  ["apps/mobile/features/work-orders/overview/WorkOrderOverviewPickerSheets.tsx", 2],
  ["apps/mobile/features/work-orders/documents/QuickDeliveryFoundation.tsx", 1],
];
for (const [file, expected] of inventory) {
  const source = read(file);
  assert.equal((source.match(/WAFL_THEME\.sheet\.textEntryFocusRevealClearance/gu) ?? []).length, expected, `${file} text-entry reveal ownership`);
}

const reel = read("apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx");
assert.match(reel, /keyboardFocusRevealContext=\{renderPath === "numeric-keypad" \? WAFL_THEME\.sheet\.numericFocusRevealContext : undefined\}/u);
assert.doesNotMatch(reel, /textEntryFocusRevealClearance/u);
const decision = read("apps/mobile/features/feedback/WaflDecisionSheet.tsx");
assert.doesNotMatch(decision, /textEntryFocusRevealClearance/u);

console.log(JSON.stringify({
  contract: "workorder-v2-alpha68-text-entry-keyboard-reveal-tuning",
  clearance,
  equivalentTextEntryOwners: inventory.reduce((sum, [, count]) => sum + count, 0),
  intrinsicKeyboardPaddingCountedAsScroll: false,
  keyboardCycles: 3,
  nonTextPolicyChanged: false,
  overLiftWhenAlreadyClear: 0,
  physicalResultInferred: false,
}));
