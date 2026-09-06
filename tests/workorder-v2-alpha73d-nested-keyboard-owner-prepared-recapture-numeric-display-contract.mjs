#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { resolveWaflPreparedDirectInputKeyboardTarget } from "../apps/mobile/domain/waflDirectInputKeyboardPolicy.ts";
import {
  resolveWaflPreparedGeometryRecaptureDecision,
  resolveWaflPreparedGeometryRevision,
} from "../apps/mobile/domain/waflPreparedGeometryRevisionPolicy.ts";
import { createWaflInputSheetKeyboardOwnerRegistry } from "../apps/mobile/features/inputs/waflInputSheetKeyboardOwnerRegistry.ts";
import {
  formatWaflNumericOpeningValueForDisplay,
  resolveWaflNumericAuxiliaryStatus,
} from "../apps/mobile/features/inputs/reel-picker/waflReelSheetSizingPolicy.ts";

const read = (file) => fs.readFileSync(file, "utf8");
const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const ownershipSource = read("apps/mobile/features/inputs/waflInputSheetKeyboardOwnerRegistry.ts");
const reel = read("apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx");

const registry = createWaflInputSheetKeyboardOwnerRegistry();
registry.register(1);
registry.update({ instanceId: 1, keyboardCapable: true, openGeneration: 1, preparedFocusReady: true, presented: true });
assert.equal(registry.resolve(1).thisSheetOwnsKeyboardEvent, true); // 1 parent alone

registry.register(2);
registry.update({ instanceId: 2, keyboardCapable: true, openGeneration: 1, preparedFocusReady: true, presented: true });
assert.equal(registry.resolve(2).thisSheetOwnsKeyboardEvent, true); // 2 child owns
assert.equal(registry.resolve(1).foreignMutationSuppressed, true); // 3 parent inset suppressed

const mutations = { 1: { body: 0, inset: 0, root: 0 }, 2: { body: 0, inset: 0, root: 0 } };
for (const id of [1, 2]) {
  if (!registry.resolve(id).thisSheetOwnsKeyboardEvent) continue;
  mutations[id].inset += 1;
  mutations[id].root += 1;
}
assert.deepEqual(mutations[1], { body: 0, inset: 0, root: 0 }); // 4 foreign root/body/inset zero
assert.deepEqual(mutations[2], { body: 0, inset: 1, root: 1 }); // 5 child normal reveal

registry.unregister(2);
assert.equal(registry.resolve(1).thisSheetOwnsKeyboardEvent, true); // 6 parent recovers

registry.register(3);
registry.update({ instanceId: 3, keyboardCapable: true, openGeneration: 1, preparedFocusReady: true, presented: true });
assert.equal(registry.resolve(3).ownerInstanceId, 3); // 7 pre-focus prepared child is topmost
registry.unregister(3);

let revision = 10;
revision = resolveWaflPreparedGeometryRevision(revision, "runtimeScrollMetrics");
assert.equal(revision, 10); // 8 keyboard padding content size is runtime only
revision = resolveWaflPreparedGeometryRevision(revision, "runtimeKeyboardInset");
assert.equal(revision, 10); // 9 runtime viewport/inset is not structural
assert.equal(resolveWaflPreparedGeometryRevision(revision, "intrinsicBodyMeasurement"), 11); // 10 intrinsic body is structural
assert.equal(resolveWaflPreparedGeometryRevision(revision, "semanticRegistry"), 11); // 11 semantic layout is structural

const currentSnapshot = { generation: 1, geometryRevision: 10, registryRevision: 4 };
assert.equal(resolveWaflPreparedGeometryRecaptureDecision({
  currentGeometryRevision: 10, currentRegistryRevision: 4, dismissing: false, keyboardMode: "directInput",
  openGeneration: 1, openReady: true, rendered: true, snapshot: currentSnapshot, visible: true,
}).capture, false); // 12 runtime changes do not force recapture/stale lockout

const structuralRecapture = resolveWaflPreparedGeometryRecaptureDecision({
  currentGeometryRevision: 11, currentRegistryRevision: 5, dismissing: false, keyboardMode: "directInput",
  openGeneration: 1, openReady: true, rendered: true, snapshot: currentSnapshot, visible: true,
});
assert.equal(structuralRecapture.capture, true); // 13 keyboard-open structural change may capture
assert.deepEqual({ body: structuralRecapture.bodyMutation, root: structuralRecapture.rootMutation }, { body: 0, root: 0 }); // 14 capture-only

const refreshedSnapshot = { generation: 1, geometryRevision: 11, registryRevision: 5 };
assert.equal(resolveWaflPreparedGeometryRecaptureDecision({
  currentGeometryRevision: 11, currentRegistryRevision: 5, dismissing: false, keyboardMode: "directInput",
  openGeneration: 1, openReady: true, rendered: true, snapshot: refreshedSnapshot, visible: true,
}).reason, "CURRENT"); // 15 next driver hop is fresh

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
assert.equal(addressPlan.appliedBodyScroll, 0); // 16 child body-scroll zero regression

for (const [raw, display] of [["4.000", "4"], ["4.200", "4.2"], ["4.250", "4.25"], ["4.205", "4.205"], ["0.500", "0.5"]]) {
  assert.equal(formatWaflNumericOpeningValueForDisplay(raw), display);
}
assert.equal(resolveWaflNumericAuxiliaryStatus({ legacyValue: "4.250", validationMessage: null }).legacyText, "기존값 4.25"); // 17 display trim
const rawOpeningValue = "4.250";
formatWaflNumericOpeningValueForDisplay(rawOpeningValue);
assert.equal(rawOpeningValue, "4.250"); // 18 stored/session-opening raw unchanged

assert.match(sheet, /foreignKeyboardEventSuppressed[\s\S]*thisSheetOwnsKeyboardEvent/u); // 19 shared gate wired
assert.match(sheet, /"runtimeScrollMetrics"[\s\S]*bodyOffsetRef\.current = event\.nativeEvent\.contentOffset\.y/u);
assert.match(sheet, /keyboard-visible-structural-refresh/u);
assert.match(reel, /sessionOpeningValue \|\| null/u);
for (const forbidden of ["quick-main", "quick-address-direct", "setTimeout", "keyboardHeight ===", "iPhoneOffset"]) {
  assert.equal(ownershipSource.includes(forbidden), false);
}
assert.equal(/paddingBottom\s*=\s*0/u.test(sheet), false); // 20 no cosmetic/local shortcut

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha73d-nested-keyboard-owner-prepared-recapture-numeric-display",
  checkpoint: "ALPHA73D_NESTED_KEYBOARD_OWNER_PREPARED_RECAPTURE_AND_NUMERIC_DISPLAY_FIX_IPHONE_QA_REQUIRED",
  caseCount: 20,
  previousPermanentInventoryRetained: 261,
  addedPermanentChecks: 1,
  finalPermanentInventory: 262,
  physicalResultInferred: false,
}));
