#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  canRunWaflSheetSettlingAnimation,
  shouldSuppressWaflSheetKeyboardHideGeometry,
} from "../apps/mobile/domain/waflDirectInputKeyboardPolicy.ts";

const read = (file) => fs.readFileSync(file, "utf8");

assert.equal(shouldSuppressWaflSheetKeyboardHideGeometry({
  dismissing: true,
  keyboardMode: "directInput",
  sessionState: "cancelling",
  visible: true,
}), true, "backdrop close owns keyboard-hide geometry before blur/dismiss");
assert.equal(shouldSuppressWaflSheetKeyboardHideGeometry({
  dismissing: true,
  keyboardMode: "directInput",
  sessionState: "closing",
  visible: false,
}), true, "programmatic visible=false close suppresses restore geometry");
assert.equal(shouldSuppressWaflSheetKeyboardHideGeometry({
  dismissing: false,
  keyboardMode: "directInput",
  sessionState: "confirming",
  visible: true,
}), true, "accepted confirm owns keyboard hide without a restore animation");
assert.equal(shouldSuppressWaflSheetKeyboardHideGeometry({
  dismissing: false,
  keyboardMode: "directInput",
  sessionState: "editing",
  visible: true,
}), false, "unexpected editing hide retains the bounded restore policy");

assert.equal(canRunWaflSheetSettlingAnimation({
  dismissing: true,
  keyboardMode: "directInput",
  sessionState: "cancelling",
}), false, "ordinary settle animation cannot interrupt the exit owner");
assert.equal(canRunWaflSheetSettlingAnimation({
  dismissing: false,
  keyboardMode: "directInput",
  sessionState: "confirming",
}), false, "confirm-owned hide cannot run a detent/restore animation");
assert.equal(canRunWaflSheetSettlingAnimation({
  dismissing: false,
  keyboardMode: "directInput",
  sessionState: "editing",
}), true);
assert.equal(canRunWaflSheetSettlingAnimation({
  dismissing: false,
  keyboardMode: "default",
  sessionState: "closing",
}), true, "non-direct sheets retain their established settle owner outside dismissal");

function runCloseRace({ invokeCancel }) {
  const effects = {
    animateDown: 0,
    animateTo: 0,
    keyboardDismiss: 0,
    onAfterClose: 0,
    onCancel: 0,
    rendered: true,
  };
  const operation = { finalized: false };
  const state = { dismissing: false, sessionState: "editing", visible: true };

  // The production ordering contract: ownership is claimed before keyboard side effects.
  state.dismissing = true;
  state.sessionState = invokeCancel ? "cancelling" : "closing";
  effects.keyboardDismiss += 1;
  effects.animateDown += 1;

  if (!shouldSuppressWaflSheetKeyboardHideGeometry({
    dismissing: state.dismissing,
    keyboardMode: "directInput",
    sessionState: state.sessionState,
    visible: state.visible,
  }) && canRunWaflSheetSettlingAnimation({
    dismissing: state.dismissing,
    keyboardMode: "directInput",
    sessionState: state.sessionState,
  })) effects.animateTo += 1;

  const finalize = () => {
    if (operation.finalized) return;
    operation.finalized = true;
    effects.rendered = false;
    if (invokeCancel) effects.onCancel += 1;
    effects.onAfterClose += 1;
    state.dismissing = false;
  };
  finalize();
  finalize();
  return effects;
}

assert.deepEqual(runCloseRace({ invokeCancel: true }), {
  animateDown: 1,
  animateTo: 0,
  keyboardDismiss: 1,
  onAfterClose: 1,
  onCancel: 1,
  rendered: false,
});
assert.deepEqual(runCloseRace({ invokeCancel: false }), {
  animateDown: 1,
  animateTo: 0,
  keyboardDismiss: 1,
  onAfterClose: 1,
  onCancel: 0,
  rendered: false,
});

const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const ownershipIndex = sheet.indexOf("dismissingRef.current = true;");
const prepareIndex = sheet.indexOf("prepareSheetClose(plan.sessionState, plan.blurAndDismissKeyboard);");
assert.ok(ownershipIndex >= 0 && prepareIndex > ownershipIndex,
  "close ownership must precede blur/Keyboard.dismiss preparation");
assert.match(sheet, /if \(shouldSuppressWaflSheetKeyboardHideGeometry\(\{/u);
assert.match(sheet, /if \(!canRunWaflSheetSettlingAnimation\(\{/u);
assert.match(sheet, /closeOperation\.finalized = true;/u);
assert.match(sheet, /closeOperationRef\.current\?\.id !== closeOperation\.id/u);
assert.doesNotMatch(sheet, /setTimeout\([^)]*animateDown/u, "exit completion must not be timer-owned");

console.log(JSON.stringify({
  contract: "workorder-v2-alpha68-close-animation-ownership-race-fix",
  backdropExitAnimation: 1,
  backdropRestoreAnimation: 0,
  programmaticExitAnimation: 1,
  programmaticRestoreAnimation: 0,
  closeFinalizerCalls: 1,
  physicalResultInferred: false,
}));
