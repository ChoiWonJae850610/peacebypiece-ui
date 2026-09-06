#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  resolveWaflDirectInputAccessoryMode,
  resolveWaflPreparedDirectInputKeyboardTarget,
  resolveWaflRegisteredInputBodyTouch,
  resolveWaflRootFirstMeasuredReveal,
  resolveWaflSheetSemanticKeyboardClass,
} from "../apps/mobile/domain/waflDirectInputKeyboardPolicy.ts";
import {
  resolveWaflPreparedGeometryRecaptureDecision,
  resolveWaflPreparedGeometryRevision,
} from "../apps/mobile/domain/waflPreparedGeometryRevisionPolicy.ts";
import { createWaflInputSheetKeyboardOwnerRegistry } from "../apps/mobile/features/inputs/waflInputSheetKeyboardOwnerRegistry.ts";

const read = (file) => fs.readFileSync(file, "utf8");
const valueField = read("apps/mobile/features/inputs/WaflSheetValueField.tsx");
const quick = read("apps/mobile/features/work-orders/documents/QuickDeliveryFoundation.tsx");
const numeric = read("apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx");

assert.match(valueField, /waflKeyboardAccessory\s*=\s*"auto"/u); // 1 default remains auto
assert.match(valueField, /waflKeyboardAccessory=\{waflKeyboardAccessory\}/u); // 2 typed policy passes through

const quickPhoneOverrides = quick.match(/keyboardType="phone-pad"[^>]*waflKeyboardAccessory="none"/gu) ?? [];
assert.equal(quickPhoneOverrides.length, 2); // 3/4 driver + address contact only
assert.match(quick, /quick-driver-contact-semantic-target[^]*?keyboardType="phone-pad"[^>]*waflKeyboardAccessory="none"/u);
assert.match(quick, /quick-address-contact-semantic-target[^]*?keyboardType="phone-pad"[^>]*waflKeyboardAccessory="none"/u);

const phoneClass = resolveWaflSheetSemanticKeyboardClass({ completionMode: "dismiss", keyboardType: "phone-pad", multiline: false });
assert.equal(phoneClass, "PHONE_NUMBER"); // 5 keyboard class unchanged
const scopedPhoneAccessory = resolveWaflDirectInputAccessoryMode({ accessoryPolicy: "none", keyboardType: "phone-pad", multiline: false });
assert.equal(scopedPhoneAccessory, "none");
assert.equal(scopedPhoneAccessory === "singleAction", false); // 6 no native accessory id attachment

assert.equal(resolveWaflSheetSemanticKeyboardClass({ completionMode: "dismiss", keyboardType: "default", multiline: false }), "TEXT");
assert.equal(resolveWaflDirectInputAccessoryMode({ accessoryPolicy: "auto", keyboardType: "default", multiline: false }), "none"); // 7 text fields unchanged

const registry = createWaflInputSheetKeyboardOwnerRegistry();
registry.register(1);
registry.update({ instanceId: 1, keyboardCapable: true, openGeneration: 1, preparedFocusReady: true, presented: true });
registry.register(2);
registry.update({ instanceId: 2, keyboardCapable: true, openGeneration: 1, preparedFocusReady: true, presented: true });
assert.equal(registry.resolve(1).foreignMutationSuppressed, true); // 8 parent mutation remains zero

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
assert.equal(addressPlan.appliedBodyScroll, 0); // 9 nested address stays root-sufficient

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
assert.equal(driverPlan.targetOffset <= 120, true); // 10 current-root baseline remains authority

const residual = resolveWaflRootFirstMeasuredReveal({
  availableForwardScroll: 80, currentOffset: 120, fieldBottom: 560, fieldTop: 508,
  keyboardTop: 552, requiredTargetOffset: 0, semanticGap: 12, viewportBottom: 680, viewportTop: 48,
});
assert.equal(residual.appliedBodyScroll <= 80, true);
assert.equal(residual.appliedBodyScroll, residual.desiredBodyScroll); // 11 residual is bounded visibility-only

const handoff = resolveWaflRegisteredInputBodyTouch({
  focusedRegistrationKey: "driver-name",
  registeredTargets: [
    { inputTarget: 101, registrationKey: "driver-name" },
    { inputTarget: 202, registrationKey: "driver-contact" },
  ],
  touchTarget: 202,
});
assert.equal(handoff.action, "handoff"); // 12 TEXT -> PHONE remains registered handoff

assert.equal(resolveWaflSheetSemanticKeyboardClass({ completionMode: "search", keyboardType: "default", multiline: false }), "SEARCH"); // 13 search unchanged
assert.match(numeric, /waflKeyboardAccessory="none"/u); // 14 numeric opt-out preserved
assert.equal(resolveWaflDirectInputAccessoryMode({ accessoryPolicy: "auto", keyboardType: "number-pad", multiline: false }), "singleAction"); // 15 ordinary scoped-out numeric/phone auto preserved

for (const forbidden of ["keyboardVerticalOffset", "phoneOffset", "contactOffset", "keyboardHeight ===", "iPhoneOffset", "setTimeout(", "debounce("]) {
  assert.equal(quick.includes(forbidden), false); // 16-19 no local geometry/timer shortcut
}

let revision = 10;
revision = resolveWaflPreparedGeometryRevision(revision, "runtimeScrollMetrics");
assert.equal(revision, 10);
const recapture = resolveWaflPreparedGeometryRecaptureDecision({
  currentGeometryRevision: 11, currentRegistryRevision: 5, dismissing: false, keyboardMode: "directInput",
  openGeneration: 1, openReady: true, rendered: true,
  snapshot: { generation: 1, geometryRevision: 10, registryRevision: 4 }, visible: true,
});
assert.deepEqual({ capture: recapture.capture, body: recapture.bodyMutation, root: recapture.rootMutation }, { capture: true, body: 0, root: 0 }); // 20 prior 262 ownership/recapture semantics

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha73d-quick-phone-accessory-geometry",
  checkpoint: "ALPHA73D_QUICK_PHONE_ACCESSORY_GEOMETRY_FIX_IPHONE_QA_REQUIRED",
  caseCount: 20,
  previousPermanentInventoryRetained: 262,
  addedPermanentChecks: 1,
  finalPermanentInventory: 263,
  physicalResultInferred: false,
}));
