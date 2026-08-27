#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  resolveWaflDirectInputDragRelease,
  resolveWaflDirectInputKeyboardDetent,
  resolveWaflDirectInputRevealMotion,
  resolveWaflDirectInputSubmitBehavior,
  shouldRestoreDirectInputKeyboard,
} from "../apps/mobile/domain/waflDirectInputKeyboardPolicy.ts";
import { resolveWaflSheetRelease } from "../apps/mobile/domain/waflSheetDetentPolicy.ts";

const read = (file) => fs.readFileSync(file, "utf8");

const geometry = {
  currentOffset: 236,
  expandedHeight: 800,
  headerHeight: 72,
  intrinsicBodyHeight: 230,
  keyboardInset: 320,
  keyboardMode: "directInput",
  keyboardVisible: true,
  minimumBodyViewport: 180,
  restingOffset: 236,
  safeBottom: 20,
  semanticGap: 16,
};
const directInputDetent = resolveWaflDirectInputKeyboardDetent(geometry);
assert.equal(directInputDetent, 162, "201 content-aware New Recipe detent remains unchanged");

const directReveal = resolveWaflDirectInputRevealMotion({
  keyboardMode: "directInput",
  requiredRise: 50,
  scrollDelta: 24,
  targetOffset: 112,
});
assert.deepEqual(directReveal, { scrollDelta: 24, sheetRise: 0, targetOffset: 112 });
const defaultReveal = resolveWaflDirectInputRevealMotion({
  keyboardMode: "default",
  requiredRise: 50,
  scrollDelta: 24,
  targetOffset: 112,
});
assert.equal(defaultReveal.sheetRise, 50, "non-direct input keeps the existing sheet-rise owner");

const genericSettle = resolveWaflSheetRelease({
  dismissDistance: 96,
  dismissVelocity: 1.15,
  dragStartOffset: directInputDetent,
  dy: 42,
  flickVelocity: 0.45,
  maxSettleOffset: 236,
  maxVelocityProjection: 88,
  velocityProjectionMs: 72,
  vy: 0.1,
});
assert.equal(genericSettle.kind, "settle");
assert.deepEqual(resolveWaflDirectInputDragRelease({
  directInputKeyboardVisible: true,
  genericRelease: genericSettle,
  keyboardDetent: directInputDetent,
}), { commitSettled: false, kind: "settle", offset: directInputDetent });
assert.deepEqual(resolveWaflDirectInputDragRelease({
  directInputKeyboardVisible: true,
  genericRelease: { kind: "dismiss" },
  keyboardDetent: directInputDetent,
}), { kind: "dismiss" });
assert.deepEqual(resolveWaflDirectInputDragRelease({
  directInputKeyboardVisible: false,
  genericRelease: { kind: "settle", offset: 91 },
  keyboardDetent: directInputDetent,
}), { commitSettled: true, kind: "settle", offset: 91 });

const restoreBase = {
  appActive: true,
  hasEditableTarget: true,
  keyboardMode: "directInput",
  mounted: true,
  restoreAlreadyAttempted: false,
  sessionState: "editing",
  visible: true,
};
assert.equal(shouldRestoreDirectInputKeyboard({ ...restoreBase, gestureActive: false }), true);
assert.equal(shouldRestoreDirectInputKeyboard({ ...restoreBase, gestureActive: true }), false, "drag suppresses the unexpected-hide refocus loop");

assert.equal(resolveWaflDirectInputSubmitBehavior({ directInput: true, multiline: false }), "submit");
assert.equal(resolveWaflDirectInputSubmitBehavior({ directInput: true, multiline: true }), null);
assert.equal(resolveWaflDirectInputSubmitBehavior({ directInput: false, multiline: false }), null);

const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const textInput = read("apps/mobile/features/inputs/WaflSheetTextInput.tsx");
const createSheet = read("apps/mobile/features/work-orders/create/WorkOrderCreateSheet.tsx");
assert.match(sheet, /resolveWaflDirectInputRevealMotion/u);
assert.match(sheet, /motion\.sheetRise > 0/u);
assert.match(sheet, /resolveWaflDirectInputDragRelease/u);
assert.match(sheet, /directInputKeyboardDetentRef/u);
assert.match(sheet, /directInputGestureActiveRef/u);
assert.match(sheet, /gestureActive: directInputGestureActiveRef\.current/u);
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
assert.match(textInput, /if \(directInput !== null && !props\.multiline\)/u, "multiline newline semantics stay outside direct submit navigation");

console.log(JSON.stringify({
  contract: "workorder-v2-alpha68-direct-input-single-geometry-drag-submit-fix",
  directInputDetent,
  directInputSheetRise: directReveal.sheetRise,
  directInputScrollDelta: directReveal.scrollDelta,
  snapBackOffset: directInputDetent,
  submitBeforeBlur: true,
  gestureRefocusSuppressed: true,
  directInputCallsites: directCallsites.length,
  physicalResultInferred: false,
}));
