#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  resolveWaflDirectInputAccessoryMode,
  resolveWaflDirectInputReturnKeyPolicy,
  resolveWaflPreparedDirectInputKeyboardTarget,
  resolveWaflRegisteredInputBodyTouch,
  resolveWaflSheetSemanticKeyboardClass,
} from "../apps/mobile/domain/waflDirectInputKeyboardPolicy.ts";
import { createWaflInputSheetKeyboardOwnerRegistry } from "../apps/mobile/features/inputs/waflInputSheetKeyboardOwnerRegistry.ts";

const read = (file) => fs.readFileSync(file, "utf8");
const valueField = read("apps/mobile/features/inputs/WaflSheetValueField.tsx");
const input = read("apps/mobile/features/inputs/WaflSheetTextInput.tsx");
const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const quick = read("apps/mobile/features/work-orders/documents/QuickDeliveryFoundation.tsx");
const search = read("apps/mobile/features/work-orders/documents/QuickDeliveryAddressSearchSheet.tsx");
const numeric = read("apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx");

assert.match(valueField, /waflReturnKeyPolicy\s*=\s*"auto"/u); // 1 default remains auto
assert.match(valueField, /waflReturnKeyPolicy=\{waflReturnKeyPolicy\}/u); // 2 typed pass-through

assert.match(quick, /quick-driver-contact-semantic-target[^]*?keyboardType="phone-pad"[^>]*waflKeyboardAccessory="none"[^>]*waflReturnKeyPolicy="none"/u); // 3
assert.match(quick, /quick-address-contact-semantic-target[^]*?keyboardType="phone-pad"[^>]*waflKeyboardAccessory="none"[^>]*waflReturnKeyPolicy="none"/u); // 4
assert.equal((quick.match(/keyboardType="phone-pad"[^>]*waflKeyboardAccessory="none"[^>]*waflReturnKeyPolicy="none"/gu) ?? []).length, 2); // 5 scoped only

assert.equal(resolveWaflSheetSemanticKeyboardClass({ completionMode: "dismiss", keyboardType: "phone-pad", multiline: false }), "PHONE_NUMBER"); // 6
assert.equal(resolveWaflDirectInputReturnKeyPolicy({ completionMode: "dismiss", fieldCount: 3, fieldIndex: 1, multiline: false, returnKeyPolicy: "none" }), null); // 7 effective key absent
assert.equal(resolveWaflDirectInputAccessoryMode({ accessoryPolicy: "none", keyboardType: "phone-pad", multiline: false }), "none"); // 8 native accessory absent

assert.equal(resolveWaflDirectInputReturnKeyPolicy({ completionMode: "search", fieldCount: 1, fieldIndex: 0, multiline: false, returnKeyPolicy: "auto" }), "search"); // 9
assert.match(search, /waflCompletionMode="search"|completionMode="search"/u); // Quick Search remains search
assert.equal(resolveWaflDirectInputReturnKeyPolicy({ completionMode: "form", fieldCount: 2, fieldIndex: 0, multiline: false, returnKeyPolicy: "auto" }), "next"); // 10 ordinary text
assert.match(numeric, /waflKeyboardAccessory="none"[\s\S]*waflReturnKeyPolicy="none"/u); // 11 numeric opt-outs preserved

const handoff = resolveWaflRegisteredInputBodyTouch({
  focusedRegistrationKey: "detail",
  registeredTargets: [
    { inputTarget: 101, registrationKey: "detail" },
    { inputTarget: 202, registrationKey: "contact" },
  ],
  touchTarget: 202,
});
assert.equal(handoff.action, "handoff"); // 12 registered TEXT -> PHONE handoff

const ownerRegistry = createWaflInputSheetKeyboardOwnerRegistry();
ownerRegistry.register(1);
ownerRegistry.update({ instanceId: 1, keyboardCapable: true, openGeneration: 1, preparedFocusReady: true, presented: true });
ownerRegistry.register(2);
ownerRegistry.update({ instanceId: 2, keyboardCapable: true, openGeneration: 1, preparedFocusReady: true, presented: true });
assert.equal(ownerRegistry.resolve(1).foreignMutationSuppressed, true); // 13 nested parent mutation stays zero

const driverPlan = resolveWaflPreparedDirectInputKeyboardTarget({
  currentRootOffset: 120,
  geometry: {
    bodyContentHeight: 660, bodyOffset: 80, bodyViewportHeight: 360, compactComposition: false,
    expandedHeight: 800, explicitSemanticRegion: true, fieldHeight: 52, fieldTop: 470, fieldWidth: 320,
    fieldX: 12, footerHeight: 0, headerHeight: 48, maximumOffset: 500, minimumBodyViewportHeight: 120,
    revealOrder: "rootFirst", safeBottom: 34, semanticGap: 12, semanticLayoutAtMs: 1,
    semanticLayoutRevision: 1, semanticScopeComplete: true, staticRestingOffset: 500, verticalChrome: 16,
  },
  keyboardInset: 300,
  liveBodyOffset: 80,
});
assert.equal(driverPlan.targetOffset <= 120, true); // 14 driver planner unchanged

const addressPlan = resolveWaflPreparedDirectInputKeyboardTarget({
  currentRootOffset: 150,
  geometry: {
    bodyContentHeight: 240, bodyOffset: 0, bodyViewportHeight: 220, compactComposition: true,
    expandedHeight: 800, explicitSemanticRegion: true, fieldHeight: 104, fieldTop: 72, fieldWidth: 320,
    fieldX: 12, footerHeight: 48, headerHeight: 48, maximumOffset: 500, minimumBodyViewportHeight: 120,
    revealOrder: "rootFirst", safeBottom: 34, semanticGap: 12, semanticLayoutAtMs: 1,
    semanticLayoutRevision: 1, semanticScopeComplete: true, staticRestingOffset: 500, verticalChrome: 16,
  },
  keyboardInset: 300,
  liveBodyOffset: 0,
});
assert.equal(addressPlan.appliedBodyScroll, 0); // 15 address child planner unchanged

for (const forbidden of [
  "quickContactOffset",
  "keyboardHeight ===",
  "iPhoneOffset",
  "setTimeout(",
  "privateKeyboardDone",
]) assert.equal(`${quick}\n${valueField}`.includes(forbidden), false); // 16-19 no geometry/timer/private shortcut

assert.match(input, /waflReturnKeyPolicy === "none"[^]*?undefined/u);
assert.match(input, /waflReturnKeyPolicy !== "none"[^]*?submitInput/u);
for (const evidenceField of ["returnKeyPolicy", "effectiveReturnKeyType", "accessoryMode", "inputAccessoryNativeIdAttached"]) {
  assert.equal(sheet.includes(evidenceField), true);
}
assert.equal(fs.existsSync("tests/workorder-v2-alpha73d-quick-phone-accessory-geometry-contract.mjs"), true); // 20 prior 263 contract retained

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha73d-quick-phone-return-key-opt-out",
  checkpoint: "ALPHA73D_QUICK_PHONE_RETURN_KEY_OPT_OUT_FIX_IPHONE_QA_REQUIRED",
  caseCount: 20,
  previousPermanentInventoryRetained: 263,
  addedPermanentChecks: 1,
  finalPermanentInventory: 264,
  physicalResultInferred: false,
}));
