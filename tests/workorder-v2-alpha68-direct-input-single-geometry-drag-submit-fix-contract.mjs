#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  resolveWaflDirectInputRevealMotion,
  resolveWaflDirectInputSubmitBehavior,
  shouldRestoreDirectInputKeyboard,
} from "../apps/mobile/domain/waflDirectInputKeyboardPolicy.ts";

const read = (file) => fs.readFileSync(file, "utf8");

const directReveal = resolveWaflDirectInputRevealMotion({
  allowSheetExpansion: true,
  keyboardMode: "directInput",
  requiredRise: 50,
  scrollDelta: 24,
  targetOffset: 112,
});
assert.deepEqual(directReveal, { scrollDelta: 24, sheetRise: 50, targetOffset: 112 });
const defaultReveal = resolveWaflDirectInputRevealMotion({
  allowSheetExpansion: true,
  keyboardMode: "default",
  requiredRise: 50,
  scrollDelta: 24,
  targetOffset: 112,
});
assert.equal(defaultReveal.sheetRise, 50, "non-direct input keeps the existing sheet-rise owner");

const restoreBase = {
  appActive: true,
  hasEditableTarget: true,
  keyboardMode: "directInput",
  mounted: true,
  restoreAlreadyAttempted: false,
  sessionState: "editing",
  visible: true,
};
assert.equal(shouldRestoreDirectInputKeyboard(restoreBase), false, "A73C supersedes locked auto-refocus with manual focus");

assert.equal(resolveWaflDirectInputSubmitBehavior({ directInput: true, multiline: false }), "submit");
assert.equal(resolveWaflDirectInputSubmitBehavior({ directInput: true, multiline: true }), null);
assert.equal(resolveWaflDirectInputSubmitBehavior({ directInput: false, multiline: false }), null);

const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const textInput = read("apps/mobile/features/inputs/WaflSheetTextInput.tsx");
const createSheet = read("apps/mobile/features/work-orders/create/WorkOrderCreateSheet.tsx");
assert.match(sheet, /resolveWaflDirectInputRevealMotion/u);
assert.match(sheet, /resolveWaflDirectInputMergedKeyboardTarget/u);
assert.match(sheet, /requiredRise: motion\.sheetRise/u);
assert.match(sheet, /mergedTargetOffset < currentOffset/u);
assert.match(sheet, /systemKeyboardTargetOffsetRef/u);
assert.doesNotMatch(sheet, /resolveWaflDirectInputKeyboardDetent/u, "A73B2 supersedes the unconditional keyboard detent with measured minimum correction");
assert.doesNotMatch(sheet, /resolveWaflDirectInputDragRelease|directInputGestureActiveRef|userDraggedDuringKeyboardRef/u);
assert.match(textInput, /resolveWaflDirectInputSubmitBehavior/u);
assert.doesNotMatch(textInput, /blurAndSubmit/u);
assert.match(createSheet, /submitBehavior="submit"/u);

const disabledStart = sheet.indexOf("if (disabled || !canonicalConfirm)");
const confirmingStart = sheet.indexOf('directInputSessionStateRef.current = "confirming"', disabledStart);
const blurStart = sheet.indexOf("?.inputRef.blur()", confirmingStart);
assert.ok(disabledStart >= 0 && confirmingStart > disabledStart && blurStart > confirmingStart, "validation/disabled branch precedes confirm blur");
const disabledBranch = sheet.slice(disabledStart, confirmingStart);
assert.doesNotMatch(disabledBranch, /\.blur\(\)|Keyboard\.dismiss\(\)/u, "invalid native Done keeps keyboard and focus");

const directCallsites = [
  "apps/mobile/features/work-orders/create/WorkOrderCreateSheet.tsx",
  "apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx",
  "apps/mobile/features/work-orders/size-color/SpecItemSelectionSheet.tsx",
  "apps/mobile/features/work-orders/overview/WorkOrderOverviewPickerSheets.tsx",
  "apps/mobile/features/work-orders/size-color/MeasurementTemplateSheets.tsx",
  "apps/mobile/features/work-orders/documents/WorkOrderDocumentWorkbench.tsx",
  "apps/mobile/features/work-orders/documents/QuickDeliveryFoundation.tsx",
];
for (const file of directCallsites) {
  assert.match(read(file), /keyboardMode=(?:"directInput"|\{props\.reusableCreate \? "directInput" : "default"\})/u, file);
}
const quickDelivery = read("apps/mobile/features/work-orders/documents/QuickDeliveryFoundation.tsx");
assert.match(quickDelivery, /keyboardType="phone-pad"/u);
assert.match(
  textInput,
  /if \(directInput !== null && !props\.multiline && waflReturnKeyPolicy !== "none"\)/u,
  "multiline newline semantics and explicit numeric return-key opt-out stay outside direct submit navigation",
);

console.log(JSON.stringify({
  contract: "workorder-v2-alpha68-direct-input-single-geometry-drag-submit-fix",
  directInputMeasuredMinimumSheetRise: directReveal.sheetRise,
  directInputScrollDelta: directReveal.scrollDelta,
  submitBeforeBlur: true,
  rootDragOwnerRetired: true,
  directInputCallsites: directCallsites.length,
  physicalResultInferred: false,
}));
