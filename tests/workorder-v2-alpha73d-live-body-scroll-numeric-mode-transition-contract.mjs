#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  resolveWaflDirectInputAccessoryMode,
  resolveWaflPreparedDirectInputKeyboardTarget,
  resolveWaflPreparedModeFocusTransaction,
} from "../apps/mobile/domain/waflDirectInputKeyboardPolicy.ts";
import {
  applyWaflSheetSystemRevealBodyDelta,
  beginWaflSheetFocusRevealCycle,
  observeWaflSheetUserBodyOffset,
  resolveWaflSheetFocusRevealCycleTransfer,
} from "../apps/mobile/domain/waflSheetKeyboardRestorePolicy.ts";

const read = (file) => fs.readFileSync(file, "utf8");
const policy = read("apps/mobile/domain/waflDirectInputKeyboardPolicy.ts");
const restore = read("apps/mobile/domain/waflSheetKeyboardRestorePolicy.ts");
const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const input = read("apps/mobile/features/inputs/WaflSheetTextInput.tsx");
const reel = read("apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx");
const quick = read("apps/mobile/features/work-orders/documents/QuickDeliveryFoundation.tsx");

const structuralGeometry = {
  bodyContentHeight: 980,
  bodyOffset: 0,
  bodyViewportHeight: 240,
  compactComposition: false,
  expandedHeight: 800,
  explicitSemanticRegion: true,
  fieldHeight: 58,
  fieldTop: 650,
  fieldWidth: 320,
  fieldX: 12,
  footerHeight: 0,
  headerHeight: 48,
  maximumOffset: 360,
  minimumBodyViewportHeight: 120,
  revealOrder: "rootFirst",
  safeBottom: 34,
  semanticGap: 12,
  semanticLayoutAtMs: 1,
  semanticLayoutRevision: 1,
  semanticScopeComplete: true,
  staticRestingOffset: 360,
  verticalChrome: 16,
};

const beforeUserScroll = resolveWaflPreparedDirectInputKeyboardTarget({
  geometry: structuralGeometry,
  keyboardInset: 310,
  liveBodyOffset: 0,
});
const afterUserScroll = resolveWaflPreparedDirectInputKeyboardTarget({
  geometry: structuralGeometry,
  keyboardInset: 310,
  liveBodyOffset: 240,
});
assert.equal(afterUserScroll.capturedBodyOffset, 0);
assert.equal(afterUserScroll.liveBodyOffset, 240);
assert.equal(beforeUserScroll.fieldBottom - afterUserScroll.fieldBottom, 240);
assert.notDeepEqual(
  [beforeUserScroll.targetOffset, beforeUserScroll.appliedBodyScroll],
  [afterUserScroll.targetOffset, afterUserScroll.appliedBodyScroll],
);
assert.equal(afterUserScroll.bodyScrollTargetOffset, afterUserScroll.liveBodyOffset + afterUserScroll.appliedBodyScroll);

const upperFieldAfterUserScroll = resolveWaflPreparedDirectInputKeyboardTarget({
  geometry: { ...structuralGeometry, fieldTop: 50 },
  keyboardInset: 310,
  liveBodyOffset: 300,
});
assert.ok(upperFieldAfterUserScroll.appliedBodyScroll < 0);
assert.ok(upperFieldAfterUserScroll.bodyScrollTargetOffset < 300);

const compactAddress = resolveWaflPreparedDirectInputKeyboardTarget({
  geometry: {
    ...structuralGeometry,
    bodyContentHeight: 260,
    bodyViewportHeight: 240,
    compactComposition: true,
    fieldTop: 150,
  },
  keyboardInset: 310,
  liveBodyOffset: 0,
});
assert.equal(compactAddress.appliedBodyScroll, 0);
assert.ok(compactAddress.targetOffset < structuralGeometry.staticRestingOffset);

const driverResidual = resolveWaflPreparedDirectInputKeyboardTarget({
  geometry: structuralGeometry,
  keyboardInset: 310,
  liveBodyOffset: 200,
});
assert.ok(Math.abs(driverResidual.appliedBodyScroll) <= Math.abs(driverResidual.desiredBodyScroll));
assert.ok(driverResidual.bodyScrollTargetOffset >= 0);

let priorCycle = beginWaflSheetFocusRevealCycle({ bodyOffset: 20, focusGeneration: 1 });
priorCycle = applyWaflSheetSystemRevealBodyDelta(priorCycle, 80);
priorCycle = observeWaflSheetUserBodyOffset(priorCycle, 120);
const independent = beginWaflSheetFocusRevealCycle({
  bodyOffset: 120,
  focusGeneration: 2,
  previous: priorCycle,
  transferPrevious: false,
});
assert.deepEqual(
  [independent.bodyBaselineOffset, independent.systemBodyDelta, independent.userBodyDelta],
  [120, 0, 0],
);
assert.equal(resolveWaflSheetFocusRevealCycleTransfer({
  keyboardHiding: false,
  keyboardVisible: true,
  previous: priorCycle,
  registeredHandoffMatched: false,
}), false);
assert.equal(resolveWaflSheetFocusRevealCycleTransfer({
  keyboardHiding: false,
  keyboardVisible: true,
  previous: priorCycle,
  registeredHandoffMatched: true,
}), true);
const handoff = beginWaflSheetFocusRevealCycle({
  bodyOffset: 120,
  focusGeneration: 3,
  previous: priorCycle,
  transferPrevious: true,
});
assert.equal(handoff.lifecycle, "TRANSFERRING");
assert.equal(handoff.bodyBaselineOffset, priorCycle.bodyBaselineOffset);

const waitingModeFocus = resolveWaflPreparedModeFocusTransaction({
  directInputTargetCount: 1,
  handledRequestGeneration: 0,
  hasPreparedFocusOwner: true,
  openReady: true,
  preparedLocalGeometryCount: 0,
  requestGeneration: 1,
  requiredMeasurementsComplete: false,
  visible: true,
});
assert.equal(waitingModeFocus.pending, true);
assert.equal(waitingModeFocus.ready, false);
assert.equal(waitingModeFocus.suppressStaticRest, true);
const readyModeFocus = resolveWaflPreparedModeFocusTransaction({
  directInputTargetCount: 1,
  handledRequestGeneration: 0,
  hasPreparedFocusOwner: true,
  openReady: true,
  preparedLocalGeometryCount: 1,
  requestGeneration: 1,
  requiredMeasurementsComplete: true,
  visible: true,
});
assert.equal(readyModeFocus.ready, true);
assert.equal(readyModeFocus.nextHandledRequestGeneration, 1);

assert.equal(resolveWaflDirectInputAccessoryMode({
  accessoryPolicy: "none",
  keyboardType: "decimal-pad",
  multiline: false,
}), "none");
assert.equal(resolveWaflDirectInputAccessoryMode({
  accessoryPolicy: "auto",
  keyboardType: "phone-pad",
  multiline: false,
}), "singleAction");

assert.match(policy, /liveBodyOffset[\s\S]*capturedBodyOffset/u);
assert.match(sheet, /liveBodyOffset: bodyOffsetRef\.current/gmu);
assert.match(sheet, /applySystemBodyScrollDelta\(plan\.appliedBodyScroll, false\)/u);
assert.match(sheet, /keyboardMode !== "directInput" && options\?\.finalReconciliation !== true/u);
assert.doesNotMatch(sheet, /currentSystemDelta \+ motion\.scrollDelta/u);
assert.match(restore, /registeredHandoffMatched[\s\S]*previous\.lifecycle !== "TERMINATED"/u);
assert.match(reel, /setNumericDirectFocusGeneration\(\(generation\) => generation \+ 1\)/u);
assert.match(reel, /preparedFocusRequestGeneration=\{numericDirectFocusGeneration\}/u);
assert.match(sheet, /preparedModeFocusTransaction\.suppressStaticRest/u);
assert.match(reel, /waflKeyboardAccessory="none"/u);
assert.match(input, /accessoryPolicy: waflKeyboardAccessory/u);
assert.equal((quick.match(/keyboardType="phone-pad"[^>]*waflKeyboardAccessory="none"/gu) ?? []).length, 2);
assert.equal((quick.match(/waflKeyboardAccessory="none"/gu) ?? []).length, 2);
assert.match(quick, /keyboardType="phone-pad"/u);

for (const forbidden of ["windowHeight === 852", "keyboardHeight === 308", "quickDeliveryKeyboardOffset", "setTimeout(() => keypad", "PanResponder"]) {
  assert.equal(`${policy}\n${sheet}\n${reel}\n${quick}`.includes(forbidden), false);
}

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha73d-live-body-scroll-numeric-mode-transition",
  checkpoint: "ALPHA73D_LIVE_BODY_SCROLL_AUTHORITY_AND_NUMERIC_MODE_TRANSITION_FIX_IPHONE_QA_REQUIRED",
  caseCount: 20,
  previousPermanentInventoryRetained: 259,
  addedPermanentChecks: 1,
  finalPermanentInventory: 260,
  invariants: [
    "PREPARED_STRUCTURAL_GEOMETRY_DYNAMIC_OFFSET_ZERO",
    "LIVE_BODY_OFFSET_APPEARANCE_AUTHORITY",
    "INDEPENDENT_APPEARANCE_DELTA_RESET",
    "REGISTERED_HANDOFF_CONTINUITY_PRESERVED",
    "ROOT_FIRST_RESIDUAL_BODY_SCROLL_MINIMUM",
    "DIRECT_PREPARED_PATH_LATE_ANIMATED_SCROLL_ZERO",
    "NUMERIC_MODE_FOCUS_TRANSACTION",
    "NUMERIC_ACCESSORY_OPT_OUT",
    "QUICK_PHONE_AUTO_DEFAULT_PRESERVED_OUTSIDE_SCOPED_CONTACTS",
    "NO_DEVICE_SPECIFIC_REVEAL_OFFSET",
  ],
  physicalResultInferred: false,
}));
