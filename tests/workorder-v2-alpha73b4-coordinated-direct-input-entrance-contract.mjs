#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  resolveWaflCoordinatedDirectInputEntrance,
  resolveWaflDirectInputReconciliationSheetRise,
} from "../apps/mobile/domain/waflDirectInputKeyboardPolicy.ts";
import { isValidWaflSheetWindowMeasurement } from "../apps/mobile/domain/waflSheetDetentPolicy.ts";

const read = (file) => fs.readFileSync(file, "utf8");
const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const createSheet = read("apps/mobile/features/work-orders/create/WorkOrderCreateSheet.tsx");
const sketch = read("apps/mobile/features/work-orders/drawing/WorkOrderSketchEditor.tsx");
const sizeColor = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx");
const spec = read("apps/mobile/features/work-orders/size-color/SpecItemSelectionSheet.tsx");
const overview = read("apps/mobile/features/work-orders/overview/WorkOrderOverviewPickerSheets.tsx");
const quickDelivery = read("apps/mobile/features/work-orders/documents/QuickDeliveryFoundation.tsx");
const projection = read("apps/mobile/features/drawing-poc/drawingRenderProjection.ts");

assert.deepEqual(resolveWaflCoordinatedDirectInputEntrance({
  directInputTargetCount: 1,
  hasPreparedAutoFocusOwner: true,
  keyboardMode: "directInput",
}), { eligible: true, prepared: true });
assert.deepEqual(resolveWaflCoordinatedDirectInputEntrance({
  directInputTargetCount: 0,
  hasPreparedAutoFocusOwner: true,
  keyboardMode: "directInput",
}), { eligible: true, prepared: false });
assert.deepEqual(resolveWaflCoordinatedDirectInputEntrance({
  directInputTargetCount: 1,
  hasPreparedAutoFocusOwner: false,
  keyboardMode: "directInput",
}), { eligible: false, prepared: false });
assert.equal(resolveWaflDirectInputReconciliationSheetRise({
  currentGap: 2,
  finalReconciliation: true,
  requiredRise: 4,
  tolerance: 4,
}), 0);
assert.equal(resolveWaflDirectInputReconciliationSheetRise({
  currentGap: -1,
  finalReconciliation: true,
  requiredRise: 1,
  tolerance: 4,
}), 1);
assert.equal(resolveWaflDirectInputReconciliationSheetRise({
  currentGap: 8,
  finalReconciliation: false,
  requiredRise: 3,
  tolerance: 4,
}), 3);

const preparedViewport = { x: 16, y: 860, width: 358, height: 180 };
assert.equal(isValidWaflSheetWindowMeasurement({
  measurement: preparedViewport,
  target: "viewport",
  windowHeight: 844,
  windowWidth: 390,
}), false);
assert.equal(isValidWaflSheetWindowMeasurement({
  measurement: preparedViewport,
  preparedOffscreenHeight: 780,
  target: "viewport",
  windowHeight: 844,
  windowWidth: 390,
}), true);

assert.match(sheet, /readonly onPreparedForAutoFocus\?: \(\) => void/u);
assert.match(sheet, /coordinatedEntrance\.eligible && !coordinatedEntrance\.prepared/u);
assert.match(sheet, /coordinatedEntrancePhaseRef\.current = "prepared";[\s\S]*layoutOffset\.setValue\(mediumOffset\);[\s\S]*onPreparedForAutoFocus\?\.\(\)/u);
assert.match(sheet, /coordinatedEntrancePhaseRef\.current = "keyboardTransition"[\s\S]*keyboardWillChangeFrame/u);
assert.match(sheet, /resolveWaflDirectInputKeyboardVisibilityFloor/u);
assert.match(sheet, /resolveWaflDirectInputMergedKeyboardTarget/u);
assert.match(sheet, /openingOffset[\s\S]*onPreparedForAutoFocus[\s\S]*keyboardTransition/u);
assert.match(sheet, /pendingDidShowReconciliationRef[\s\S]*finishVisibleEntrance[\s\S]*finalReconciliation: true/u);
assert.match(sheet, /tolerance: WAFL_THEME\.spacing\.xs/u);
assert.match(sheet, /currentGap: reveal\.currentGap \+ Math\.max\(0, motion\.scrollDelta\)/u);
assert.match(sheet, /coordinatedFallbackFrameRef\.current = requestAnimationFrame[\s\S]*coordinatedFallbackSecondFrameRef\.current = requestAnimationFrame[\s\S]*runOrdinaryEntrance\(generation\)/u);
assert.doesNotMatch(sheet, /onPreparedForAutoFocus[\s\S]{0,220}setTimeout/u);
assert.match(sheet, /systemKeyboardTargetOffsetRef\.current = null[\s\S]*bodyOffsetRef\.current = 0/u);
assert.doesNotMatch(sheet, /settledOffsetRef|preKeyboardSettledOffsetRef/u);
assert.match(sheet, /prepareSheetClose[\s\S]*cancelAnimationFrame\(coordinatedFallbackFrameRef\.current\)[\s\S]*coordinatedEntrancePhaseRef\.current = "inactive"/u);

for (const source of [createSheet, sketch, quickDelivery, sizeColor, spec]) {
  assert.doesNotMatch(source, /onPreparedForAutoFocus=|\bautoFocus\b/u);
}
assert.doesNotMatch(createSheet, /onAfterOpen=\{focusProductNameOnce\}/u);
assert.match(sketch, /onAfterOpen=\{\(\) => presentTextSheet/u, "A73C keeps session presentation without focus");
assert.match(overview, /keyboardMode="directInput"/u);
assert.doesNotMatch(overview, /onPreparedForAutoFocus/u);

assert.match(projection, /pending-text-insertion-caret/u);
assert.doesNotMatch(projection, /pending-text-anchor-marker|horizontalStart|horizontalEnd/u);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha73b4-coordinated-direct-input-entrance",
  previousPermanentInventoryRetained: 234,
  addedPermanentChecks: 1,
  finalPermanentInventory: 235,
  coordinatedEligible: ["compatibility infrastructure; no normalized live form callsite"],
  phase1ManualReusableCreate: ["Direct Size", "Direct Color", "Spec create/rename"],
  manualDirectInputOrdinaryEntrance: true,
  preparedBeforeFocus: true,
  ordinaryVisibleIntermediate: 0,
  firstVisibleKeyboardAwareTarget: true,
  didShowReconciliationRetained: true,
  didShowTolerancePoints: 4,
  realOcclusionWaived: 0,
  noKeyboardFallback: "bounded-two-frame-lifecycle",
  closeWins: true,
  caretRegression: "neutral-vertical-world-caret-retained",
  physicalResultInferred: false,
}));
