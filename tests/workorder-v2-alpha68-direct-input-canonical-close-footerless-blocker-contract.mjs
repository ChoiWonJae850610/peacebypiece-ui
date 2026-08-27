#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  resolveWaflInputSheetPresentation,
  resolveWaflSheetClosePlan,
} from "../apps/mobile/domain/waflDirectInputKeyboardPolicy.ts";

const read = (file) => fs.readFileSync(file, "utf8");

assert.deepEqual(resolveWaflSheetClosePlan({
  actionPending: false,
  alreadyClosing: false,
  keyboardMode: "directInput",
  reason: "userCancel",
}), {
  accepted: true,
  blurAndDismissKeyboard: true,
  invokeCancel: true,
  sessionState: "cancelling",
});
assert.deepEqual(resolveWaflSheetClosePlan({
  actionPending: true,
  alreadyClosing: false,
  keyboardMode: "directInput",
  reason: "programmatic",
}), {
  accepted: true,
  blurAndDismissKeyboard: true,
  invokeCancel: false,
  sessionState: "closing",
}, "parent/nested visible=false must close the keyboard even while the accepted command is pending");
assert.equal(resolveWaflSheetClosePlan({
  actionPending: false,
  alreadyClosing: true,
  keyboardMode: "directInput",
  reason: "userCancel",
}).accepted, false, "onPressIn plus onPress must not start two close transactions");
assert.equal(resolveWaflSheetClosePlan({
  actionPending: false,
  alreadyClosing: false,
  keyboardMode: "default",
  reason: "userCancel",
}).blurAndDismissKeyboard, false, "non-direct sheets retain their existing keyboard ownership");

assert.deepEqual(resolveWaflInputSheetPresentation({
  hasConfirmOwner: true,
  keyboardMode: "directInput",
  processingMessagePresent: false,
  processingPresentation: "overlay",
}), {
  renderFooterActions: false,
  replaceSheetDuringProcessing: false,
}, "direct input keeps its confirm owner without footer geometry");
assert.deepEqual(resolveWaflInputSheetPresentation({
  hasConfirmOwner: true,
  keyboardMode: "default",
  processingMessagePresent: false,
  processingPresentation: "overlay",
}), {
  renderFooterActions: true,
  replaceSheetDuringProcessing: false,
}, "non-direct footer behavior remains unchanged");
assert.equal(resolveWaflInputSheetPresentation({
  hasConfirmOwner: true,
  keyboardMode: "directInput",
  processingMessagePresent: true,
  processingPresentation: "replaceSheet",
}).replaceSheetDuringProcessing, true);
assert.equal(resolveWaflInputSheetPresentation({
  hasConfirmOwner: true,
  keyboardMode: "directInput",
  processingMessagePresent: true,
  processingPresentation: "overlay",
}).replaceSheetDuringProcessing, false, "replace-sheet must be opt-in");

const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const reusableCreate = read("apps/mobile/features/inputs/WaflReusableCreateForm.tsx");
const createSheet = read("apps/mobile/features/work-orders/create/WorkOrderCreateSheet.tsx");
const nestedHandoff = read("apps/mobile/features/inputs/useWaflNestedSheetHandoff.ts");

assert.match(sheet, /const prepareSheetClose = useCallback/u);
assert.match(sheet, /beginSheetClose\("userCancel"\)/u);
assert.match(sheet, /beginSheetClose\("programmatic"\)/u);
assert.match(sheet, /onPressIn=\{keyboardMode === "directInput" \? cancel : undefined\}/u);
assert.match(sheet, /onPress=\{cancel\}/u);
assert.match(sheet, /const hasConfirmOwner = Boolean\(onConfirm\)/u);
assert.match(sheet, /const hasActions = sheetPresentation\.renderFooterActions/u);
assert.match(sheet, /const effectiveFooterHeight = hasActions \? footerHeight : 0/u);
assert.match(sheet, /accessibilityElementsHidden=\{replacesSheetDuringProcessing\}/u);
assert.match(sheet, /pointerEvents=\{replacesSheetDuringProcessing \? "none" : "auto"\}/u);
assert.match(sheet, /processingReplacedSheet: \{ opacity: 0 \}/u);
assert.match(sheet, /!replacesSheetDuringProcessing && directInputMinimalAccessoryAction !== null/u);
assert.match(sheet, /const wasReplacingSheet = replaceSheetActiveRef\.current/u);
assert.match(sheet, /directInputSessionStateRef\.current = "editing"/u, "failed replace-sheet processing restores the editing session");

assert.match(createSheet, /processingPresentation="replaceSheet"/u);
assert.match(createSheet, /processingMessage=\{props\.pending \? "새 레시피를 생성 중입니다\." : null\}/u);
assert.match(createSheet, /value=\{props\.productName\}/u, "form value remains parent-owned for failure recovery");
assert.doesNotMatch(reusableCreate, /WaflPrimaryActionButton/u);
assert.doesNotMatch(reusableCreate, /label="추가"/u);
assert.match(reusableCreate, /useWaflSheetDirectInputConfirm\(props\.onCreate, disabled\)/u);
assert.match(reusableCreate, /props\.onBack/u, "nested back remains available");
assert.match(nestedHandoff, /setVisible\(false\)/u);
assert.match(nestedHandoff, /finishClose/u);

console.log(JSON.stringify({
  contract: "workorder-v2-alpha68-direct-input-canonical-close-footerless-blocker",
  canonicalCloseOwner: true,
  backdropFirstTouch: true,
  programmaticKeyboardClose: true,
  directInputFooterRender: 0,
  reusableCreateCtaRender: 0,
  replaceSheetOptIn: "New Recipe",
  physicalResultInferred: false,
}));
