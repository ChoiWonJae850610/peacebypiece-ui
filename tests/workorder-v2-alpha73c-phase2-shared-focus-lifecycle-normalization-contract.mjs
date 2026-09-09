#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  resolveWaflDirectInputTapPersistence,
  resolveWaflInputSheetPresentation,
  shouldRestoreDirectInputKeyboard,
} from "../apps/mobile/domain/waflDirectInputKeyboardPolicy.ts";
import {
  canPublishQuickDeliveryAddressSearchResult,
  resolveQuickDeliveryAddressSearchLifecycle,
} from "../apps/mobile/domain/quickDeliveryAddressSearchLifecyclePolicy.ts";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

const restoreInput = {
  appActive: true,
  hasEditableTarget: true,
  keyboardMode: "directInput",
  mounted: true,
  restoreAlreadyAttempted: false,
  sessionState: "editing",
  visible: true,
};
assert.equal(shouldRestoreDirectInputKeyboard(restoreInput), false, "ordinary blur/hide must never auto-refocus");
assert.deepEqual(resolveWaflDirectInputTapPersistence("directInput"), {
  keyboardDismissMode: "interactive",
  keyboardShouldPersistTaps: "handled",
});
const directAuto = resolveWaflInputSheetPresentation({
  hasConfirmOwner: true,
  keyboardMode: "directInput",
  processingMessagePresent: false,
  processingPresentation: "overlay",
});
assert.equal(directAuto.renderFooterActions, false);
assert.equal(resolveWaflInputSheetPresentation({
  footerPolicy: "always",
  hasConfirmOwner: true,
  keyboardMode: "directInput",
  processingMessagePresent: false,
  processingPresentation: "overlay",
}).renderFooterActions, true, "address direct keeps Sheet-level X/V");
const cancelOnly = resolveWaflInputSheetPresentation({
  footerPolicy: "cancelOnly",
  hasConfirmOwner: false,
  keyboardMode: "directInput",
  processingMessagePresent: false,
  processingPresentation: "overlay",
});
assert.equal(cancelOnly.renderFooterActions, true);
assert.equal(cancelOnly.renderConfirmAction, false, "Address Search must not alias V to cancel");

let searchPhase = "closed";
for (const action of ["open", "focus", "blur", "submit", "close"]) {
  const transition = resolveQuickDeliveryAddressSearchLifecycle({ action, phase: searchPhase });
  assert.equal(transition.focusRequested, false, `${action} must not schedule refocus`);
  searchPhase = transition.phase;
}
assert.equal(searchPhase, "closed");
assert.equal(canPublishQuickDeliveryAddressSearchResult({ currentGeneration: 4, requestGeneration: 3, visible: true }), false);
assert.equal(canPublishQuickDeliveryAddressSearchResult({ currentGeneration: 4, requestGeneration: 4, visible: false }), false);

const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const input = read("apps/mobile/features/inputs/WaflSheetTextInput.tsx");
const actionButtons = read("apps/mobile/features/inputs/WaflSheetActionButtons.tsx");
assert.match(input, /WaflSheetBlurContext/u);
assert.match(input, /onBlurTarget\?\.\(registrationKey\)/u);
assert.match(sheet, /handleBodyTouchStart/u);
assert.match(sheet, /handleBodyScrollBeginDrag/u);
assert.match(sheet, /dismissDirectInputEditing/u);
assert.doesNotMatch(sheet, /directInputGestureActiveRef|resolveWaflDirectInputDragRelease|onResponderGrant/u, "A73D static root has no header drag/refocus branch");
assert.match(sheet, /keyboardInsetRef\.current > 0/u, "manual focus waits for keyboard geometry before reveal");
assert.match(sheet, /if \(keyboardInset > 0\) return;/u, "one keyboard generation has one normal inset reveal");
assert.match(sheet, /keyboardMode === "directInput" && keyboardInsetRef\.current > 0/u, "layout settling cannot create a second normal reveal");

assert.match(input, /WaflSheetCompletionMode = "form" \| "dismiss" \| "search"/u);
assert.match(input, /waflCompletionMode === "search" \? "search"/u);
assert.match(sheet, /target\?\.completionMode === "dismiss"/u);
assert.match(sheet, /directInputMinimalAccessoryFieldKeys\[0\] \?\? null/u, "minimal accessory mounts before first focus");
assert.match(actionButtons, /showConfirm/u);

const create = read("apps/mobile/features/work-orders/create/WorkOrderCreateSheet.tsx");
const overviewPicker = read("apps/mobile/features/work-orders/overview/WorkOrderOverviewPickerSheets.tsx");
const overview = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const structure = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx");
const spec = read("apps/mobile/features/work-orders/size-color/SpecItemSelectionSheet.tsx");
const sketch = read("apps/mobile/features/work-orders/drawing/WorkOrderSketchEditor.tsx");
for (const [label, source] of [
  ["New Recipe", create],
  ["Overview direct", overviewPicker],
  ["Size/Color", structure],
  ["Spec/POM", spec],
]) {
  assert.doesNotMatch(source, /onPreparedForAutoFocus|\bautoFocus\b/u, `${label} must open before explicit field focus`);
}
assert.doesNotMatch(sketch, /onPreparedForAutoFocus/u);
assert.match(sketch, /onAfterOpen=\{\(\) => presentTextSheet/u, "Sketch session identity is presented without focusing");

const overviewChildRegion = overview.slice(overview.indexOf("categoryReelField === \"targetAudience\""), overview.indexOf("const productNameInline"));
assert.doesNotMatch(overviewChildRegion, /props\.onCancelEdit\(\)/u, "child X must not roll back the whole Overview draft");

const quick = read("apps/mobile/features/work-orders/documents/QuickDeliveryFoundation.tsx");
const addressSearch = read("apps/mobile/features/work-orders/documents/QuickDeliveryAddressSearchSheet.tsx");
assert.doesNotMatch(quick, /requestAnimationFrame|detailAddressInputRef|onPreparedForAutoFocus/u);
assert.match(quick, /useWaflSheetFocusLifecycle/u, "nested triggers must dismiss the active parent/child focus through the shared owner");
assert.match(quick, /footerPolicy="always"/u);
assert.ok((quick.match(/completionMode="dismiss"/gu) ?? []).length >= 5, "Quick field completion must consistently dismiss field editing");
assert.match(addressSearch, /footerPolicy="cancelOnly"/u);
assert.match(addressSearch, /keyboardMode="directInput"/u);
assert.match(addressSearch, /onSubmitEditing=\{submitSearch\}/u);
assert.match(addressSearch, /waflCompletionMode="search"/u);
assert.doesNotMatch(addressSearch, /onAfterOpen=.*focus|onConfirm=\{props\.onCancel\}/u);
assert.match(addressSearch, /canPublishQuickDeliveryAddressSearchResult/u);
assert.match(addressSearch, /resolveQuickDeliveryAddressSearchLifecycle/u, "blur/search/close actions use the deterministic crash-path guard");

const material = read("apps/mobile/features/materials/WorkOrderMaterialEditor.tsx");
assert.match(material, /<WaflSheetFocusBlock[\s\S]*?<WaflSheetTextInput[\s\S]*?WaflCharacterCounter/u, "material multiline semantic block includes label, input and counter");
assert.match(material, /field="usageArea"[\s\S]*?multiline/u);
assert.match(material, /field="memo"[\s\S]*?multiline/u);
assert.doesNotMatch(material, /keyboardVerticalOffset|keyboardFocusRevealContext|hard-?coded.*offset/iu, "Material adds no feature-local keyboard offset");

const reel = read("apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx");
assert.match(reel, /keyboardMode=\{renderPath === "numeric-keypad" \? "directInput" : "default"\}/u, "numeric direct input must use the shared direct-input lifecycle");
assert.match(reel, /onPreparedForAutoFocus=\{renderPath === "numeric-keypad"/u, "the later A73D numeric migration owns picker focus through one prepared transaction");
assert.doesNotMatch(reel, /\sautoFocus(?:\s|=)/u, "the superseded raw PICKER autofocus contract must not return");
assert.equal(fs.readdirSync(path.join(root, "db", "v2", "migrations")).filter((name) => name.endsWith(".sql")).length, 22);
assert.match(read("lib/constants/version.ts"), /2\.0\.0-alpha\.(?:72|73|74|75|76)/u);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha73c-phase2-shared-focus-lifecycle-normalization",
  manualFocusSurfaces: 10,
  overviewWholeDraftRollbackFromChildCancel: 0,
  ordinaryAutoRefocus: 0,
  stableFirstFocusAccessory: true,
  addressSearchExplicitSubmit: true,
  physicalResultInferred: false,
}));
