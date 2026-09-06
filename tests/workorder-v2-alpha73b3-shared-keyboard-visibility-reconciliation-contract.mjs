#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  resolveWaflDirectInputKeyboardVisibilityFloor,
  resolveWaflDirectInputMergedKeyboardTarget,
  resolveWaflDirectInputRevealMotion,
} from "../apps/mobile/domain/waflDirectInputKeyboardPolicy.ts";

const read = (file) => fs.readFileSync(file, "utf8");
const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const createSheet = read("apps/mobile/features/work-orders/create/WorkOrderCreateSheet.tsx");
const sketch = read("apps/mobile/features/work-orders/drawing/WorkOrderSketchEditor.tsx");
const quickDelivery = read("apps/mobile/features/work-orders/documents/QuickDeliveryFoundation.tsx");
const reel = read("apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx");
const projection = read("apps/mobile/features/drawing-poc/drawingRenderProjection.ts");

const floor = resolveWaflDirectInputKeyboardVisibilityFloor({
  currentOffset: 300,
  expandedHeight: 760,
  headerHeight: 64,
  keyboardInset: 310,
  maximumOffset: 300,
  minimumBodyViewportHeight: 120,
  verticalChrome: 16,
});
assert.deepEqual(floor, {
  requiredVisibleHeight: 200,
  targetOffset: 250,
  usableBodyViewportHeight: 120,
});

const alreadyRevealed = resolveWaflDirectInputKeyboardVisibilityFloor({
  currentOffset: 180,
  expandedHeight: 760,
  headerHeight: 64,
  keyboardInset: 310,
  maximumOffset: 300,
  minimumBodyViewportHeight: 120,
  verticalChrome: 16,
});
assert.equal(alreadyRevealed.targetOffset, 180);
assert.equal(alreadyRevealed.usableBodyViewportHeight, 190);

assert.equal(resolveWaflDirectInputMergedKeyboardTarget({
  currentOffset: 300,
  floorTargetOffset: 250,
  measuredTargetOffset: 210,
}), 210);
assert.equal(resolveWaflDirectInputMergedKeyboardTarget({
  currentOffset: 300,
  floorTargetOffset: 250,
  measuredTargetOffset: null,
}), 250);

assert.deepEqual(resolveWaflDirectInputRevealMotion({
  availableForwardScroll: 20,
  allowSheetExpansion: true,
  bodyOffset: 0,
  keyboardMode: "directInput",
  requiredRise: 60,
  scrollDelta: 80,
  targetOffset: 190,
}), { scrollDelta: 20, sheetRise: 60, targetOffset: 190 });
assert.equal(resolveWaflDirectInputRevealMotion({
  allowSheetExpansion: true,
  bodyOffset: 15,
  keyboardMode: "directInput",
  requiredRise: 0,
  scrollDelta: -40,
  targetOffset: 300,
}).scrollDelta, -15);

assert.doesNotMatch(sheet, /resolveWaflDirectInputKeyboardDetent/u);
assert.match(sheet, /keyboardWillChangeFrame[\s\S]*update\(event, true, "willChangeFrame"\)/u);
assert.match(sheet, /resolveWaflDirectInputKeyboardVisibilityFloor/u);
assert.match(sheet, /measurements === null[\s\S]*fallbackToInputTarget\(\)[\s\S]*visibilityFloor\.targetOffset/u);
assert.match(sheet, /resolveWaflDirectInputMergedKeyboardTarget/u);
assert.match(sheet, /availableForwardScroll[\s\S]*resolveWaflDirectInputRevealMotion/u);
assert.match(sheet, /keyboardDidShow[\s\S]*didShowReconciliationIdentityRef[\s\S]*requestAnimationFrame[\s\S]*finalReconciliation: true/u);
assert.match(sheet, /keyboardInsetOverride: finalInset/u);
assert.match(sheet, /openGeneration[\s\S]*focusGeneration[\s\S]*measurementIdentity/u);
assert.match(sheet, /keyboardTransition: options\?\.keyboardTransition/u);
assert.match(sheet, /completion: coordinatedOpening[\s\S]*keyboardMode === "directInput"\s*\?\s*undefined/u);
assert.match(sheet, /resolveWaflSheetKeyboardRestoreOffset\(mediumOffset\)/u);
assert.doesNotMatch(sheet, /userDraggedDuringKeyboardRef/u);

assert.match(sketch, /keyboardMode="directInput"/u);
assert.match(sketch, /sizing="adaptiveExpandable"/u);
assert.match(createSheet, /WAFL_TEXT_ENTRY_FORM_SIZING/u);
assert.match(createSheet, /keyboardMode="directInput"/u);
assert.match(quickDelivery, /keyboardMode="directInput"/u);
assert.match(quickDelivery, /keyboardType="phone-pad"/u);
assert.match(reel, /keyboardType=\{integerOnly \? "number-pad" : "decimal-pad"\}/u);

assert.match(projection, /pending-text-insertion-caret/u);
assert.doesNotMatch(projection, /pending-text-anchor-marker|horizontalStart|horizontalEnd/u);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha73b3-shared-keyboard-visibility-reconciliation",
  previousPermanentInventoryRetained: 233,
  addedPermanentChecks: 1,
  finalPermanentInventory: 234,
  visibilityFloor: floor,
  mergedTargetOffset: 210,
  availableForwardScroll: 20,
  appliedBodyScroll: 20,
  residualSheetRise: 60,
  explicitDidShowReconciliation: 1,
  measurementFailureFloorFallback: 1,
  legacyDirectInputDetent: 0,
  caretRegression: "neutral-vertical-world-caret-retained",
  physicalResultInferred: false,
}));
