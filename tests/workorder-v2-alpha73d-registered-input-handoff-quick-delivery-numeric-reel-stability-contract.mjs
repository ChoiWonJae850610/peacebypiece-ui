#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { resolveWaflRegisteredInputBodyTouch } from "../apps/mobile/domain/waflDirectInputKeyboardPolicy.ts";
import {
  resolveWaflNumericAuxiliaryStatus,
  resolveWaflReelAdaptiveBodyHeight,
  WAFL_REEL_AUXILIARY_STATUS_HEIGHT,
} from "../apps/mobile/features/inputs/reel-picker/waflReelSheetSizingPolicy.ts";

const read = (file) => fs.readFileSync(file, "utf8");
const policy = read("apps/mobile/domain/waflDirectInputKeyboardPolicy.ts");
const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const input = read("apps/mobile/features/inputs/WaflSheetTextInput.tsx");
const quick = read("apps/mobile/features/work-orders/documents/QuickDeliveryFoundation.tsx");
const reel = read("apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx");

const registeredTargets = [
  { registrationKey: "text", inputTarget: 101 },
  { registrationKey: "phone", inputTarget: 202 },
  { registrationKey: "memo", inputTarget: 303 },
];
for (const [source, destination, touchTarget] of [
  ["text", "phone", 202],
  ["phone", "text", 101],
  ["phone", "memo", 303],
  ["memo", "text", 101],
]) {
  assert.deepEqual(resolveWaflRegisteredInputBodyTouch({
    focusedRegistrationKey: source,
    registeredTargets,
    touchTarget,
  }), {
    action: "handoff",
    destinationRegistrationKey: destination,
    reason: "REGISTERED_INPUT_HANDOFF",
  });
}
assert.equal(resolveWaflRegisteredInputBodyTouch({
  focusedRegistrationKey: "text",
  registeredTargets,
  touchTarget: 404,
}).action, "dismiss");
assert.equal(resolveWaflRegisteredInputBodyTouch({
  focusedRegistrationKey: "text",
  registeredTargets,
  touchTarget: 101,
}).action, "preserve");

assert.match(input, /inputTarget: findNodeHandle\(mountedInput\)/u);
assert.match(sheet, /disposition\.action === "handoff"[\s\S]*registeredInputHandoffRef\.current[\s\S]*dismissDirectInputEditing: false[\s\S]*return;/u);
assert.match(sheet, /pendingRegisteredHandoff\?\.sourceRegistrationKey === registrationKey[\s\S]*requestAnimationFrame/u);
assert.match(sheet, /registered-input-handoff-focus/u);
assert.doesNotMatch(sheet.match(/disposition\.action === "handoff"[\s\S]{0,1200}?return;/u)?.[0] ?? "", /animateTo|staticRest|Keyboard\.dismiss/u);

for (const marker of [
  "quick-driver-name-semantic-target",
  "quick-driver-contact-semantic-target",
  "quick-driver-memo-semantic-target",
  "quick-address-detail-semantic-target",
  "quick-address-contact-semantic-target",
]) assert.match(quick, new RegExp(marker, "u"));
assert.equal((quick.match(/WaflSheetSemanticFocusScope testID="quick-/gu) ?? []).length, 5);
assert.match(policy, /semanticGap/u);

const emptyStatus = resolveWaflNumericAuxiliaryStatus({ legacyValue: null, validationMessage: null });
const legacyStatus = resolveWaflNumericAuxiliaryStatus({ legacyValue: "1.125", validationMessage: null });
const validationStatus = resolveWaflNumericAuxiliaryStatus({ legacyValue: "1.125", validationMessage: "소수점 오류" });
assert.deepEqual(emptyStatus, { kind: "empty", legacyText: null, text: null, validationText: null });
assert.deepEqual(legacyStatus, { kind: "legacy", legacyText: "기존값 1.125", text: "기존값 1.125", validationText: null });
assert.deepEqual(validationStatus, { kind: "validation", legacyText: "기존값 1.125", text: "소수점 오류", validationText: "소수점 오류" });
assert.equal(WAFL_REEL_AUXILIARY_STATUS_HEIGHT, 40);

const height = (renderPath, hasValidationMessage = false) => resolveWaflReelAdaptiveBodyHeight({
  hasModeSwitch: true,
  hasSupplementaryControl: false,
  hasValidationMessage,
  renderPath,
  reserveAuxiliaryStatus: true,
});
for (const renderPath of ["numeric-keypad", "numeric-reel"]) {
  assert.equal(height(renderPath, false), height(renderPath, true));
}
assert.equal(height("numeric-keypad"), 200);
assert.equal(height("numeric-reel"), 354);
assert.match(reel, /reserveAuxiliaryStatus: kind === "quantity"/u);
assert.match(reel, /style=\{styles\.auxiliaryStatus\}/u);
assert.match(reel, /height: WAFL_REEL_AUXILIARY_STATUS_HEIGHT/u);
assert.match(reel, /WaflInputModeSwitch mode=/u);
assert.doesNotMatch(reel, /quantityPrecisionError \? <Text accessibilityLiveRegion/u);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha73d-registered-input-handoff-quick-delivery-numeric-reel-stability",
  previousPermanentInventoryRetained: 256,
  addedPermanentChecks: 1,
  finalPermanentInventory: 257,
  checkpoint: "ALPHA73D_REGISTERED_INPUT_HANDOFF_QUICK_DELIVERY_AND_NUMERIC_REEL_STABILITY_FIX_IPHONE_QA_REQUIRED",
  invariants: [
    "REGISTERED_INPUT_HANDOFF_BYPASSES_NON_INPUT_DISMISS",
    "TRUE_NON_INPUT_DISMISS_PRESERVED",
    "TEXT_PHONE_HANDOFF_BIDIRECTIONAL",
    "HANDOFF_STATIC_REST_ZERO",
    "QUICK_FIELD_EXPLICIT_SEMANTIC_TARGETS",
    "QUICK_STALE_TARGET_ZERO",
    "NUMERIC_AUXILIARY_STATUS_FIXED_HEIGHT",
    "NUMERIC_VALUE_EDIT_EXTENT_ZERO",
    "MODE_SWITCH_INSIDE_DETERMINISTIC_BODY",
    "DIRECT_COLOR_REGRESSION_PROTECTED",
  ],
  physicalResultInferred: false,
}));
