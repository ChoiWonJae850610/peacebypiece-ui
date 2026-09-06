#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  resolveWaflCurrentRootPlanningOffset,
  resolveWaflDirectInputReturnKeyPolicy,
  resolveWaflKeyboardRootMotionDecision,
  resolveWaflPreparedDirectInputKeyboardTarget,
} from "../apps/mobile/domain/waflDirectInputKeyboardPolicy.ts";

const read = (file) => fs.readFileSync(file, "utf8");
const policy = read("apps/mobile/domain/waflDirectInputKeyboardPolicy.ts");
const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const input = read("apps/mobile/features/inputs/WaflSheetTextInput.tsx");
const reel = read("apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx");
const quick = read("apps/mobile/features/work-orders/documents/QuickDeliveryFoundation.tsx");
const workbench = read("apps/mobile/features/work-orders/documents/WorkOrderDocumentWorkbench.tsx");
const mobileEvidence = read("apps/mobile/lib/waflInputSheetGeometryEvidence.ts");
const serverEvidence = read("lib/external-qa/inputSheetGeometryEvidence.ts");

const staticRestingOffset = 520;
const staticMotion = { active: false, generation: 1, owner: "staticRest", targetOffset: 520 };
const keyboardMotion = { active: true, generation: 2, owner: "systemKeyboard", targetOffset: 250 };

assert.equal(resolveWaflCurrentRootPlanningOffset({
  currentMotion: staticMotion,
  staticRestingOffset,
  systemKeyboardTargetOffset: null,
}), 520);
assert.equal(resolveWaflCurrentRootPlanningOffset({
  currentMotion: staticMotion,
  staticRestingOffset,
  systemKeyboardTargetOffset: 250,
}), 250);
assert.equal(resolveWaflCurrentRootPlanningOffset({
  currentMotion: keyboardMotion,
  staticRestingOffset,
  systemKeyboardTargetOffset: 280,
}), 250);
assert.equal(resolveWaflCurrentRootPlanningOffset({
  currentMotion: { ...keyboardMotion, targetOffset: -40 },
  staticRestingOffset,
  systemKeyboardTargetOffset: null,
}), 0);

const base = {
  bodyContentHeight: 980,
  bodyOffset: 0,
  bodyViewportHeight: 240,
  compactComposition: false,
  expandedHeight: 800,
  explicitSemanticRegion: true,
  fieldHeight: 50,
  fieldTop: 100,
  fieldWidth: 320,
  fieldX: 12,
  footerHeight: 0,
  headerHeight: 48,
  maximumOffset: staticRestingOffset,
  minimumBodyViewportHeight: 120,
  revealOrder: "rootFirst",
  safeBottom: 34,
  semanticGap: 12,
  semanticLayoutAtMs: 1,
  semanticLayoutRevision: 1,
  semanticScopeComplete: true,
  staticRestingOffset,
  verticalChrome: 16,
};

const alreadyVisible = resolveWaflPreparedDirectInputKeyboardTarget({
  currentRootOffset: 250,
  geometry: base,
  keyboardInset: 300,
  liveBodyOffset: 0,
});
assert.equal(alreadyVisible.currentRootOffset, 250);
assert.equal(alreadyVisible.targetOffset, 250);
assert.equal(alreadyVisible.desiredBodyScroll, 0);
assert.equal(alreadyVisible.appliedBodyScroll, 0);

const partial = resolveWaflPreparedDirectInputKeyboardTarget({
  currentRootOffset: 250,
  geometry: { ...base, fieldTop: 500 },
  keyboardInset: 300,
  liveBodyOffset: 0,
});
assert.equal(partial.targetOffset, 0);
assert.ok(partial.appliedBodyScroll > 0);
assert.equal(partial.appliedBodyScroll, Math.min(partial.desiredBodyScroll, partial.availableForwardScroll));

const nearTop = resolveWaflPreparedDirectInputKeyboardTarget({
  currentRootOffset: 250,
  geometry: { ...base, fieldTop: 10 },
  keyboardInset: 300,
  liveBodyOffset: 6,
});
assert.equal(nearTop.fieldTop, nearTop.bodyLocalTop + 4);
assert.equal(nearTop.topClippingRequirement, 0);
assert.equal(nearTop.appliedBodyScroll, 0);

const actuallyClippedAtTop = resolveWaflPreparedDirectInputKeyboardTarget({
  currentRootOffset: 250,
  geometry: { ...base, fieldTop: 10 },
  keyboardInset: 300,
  liveBodyOffset: 20,
});
assert.ok(actuallyClippedAtTop.appliedBodyScroll < 0);
assert.equal(Math.abs(actuallyClippedAtTop.appliedBodyScroll), actuallyClippedAtTop.topClippingRequirement);

const compactAddress = resolveWaflPreparedDirectInputKeyboardTarget({
  currentRootOffset: 180,
  geometry: { ...base, bodyContentHeight: 260, bodyViewportHeight: 240, compactComposition: true, fieldTop: 120 },
  keyboardInset: 300,
  liveBodyOffset: 0,
});
assert.equal(compactAddress.appliedBodyScroll, 0);

const compactNumeric = resolveWaflPreparedDirectInputKeyboardTarget({
  currentRootOffset: 180,
  geometry: { ...base, bodyContentHeight: 220, bodyViewportHeight: 220, compactComposition: true, fieldTop: 95 },
  keyboardInset: 300,
  liveBodyOffset: 0,
});
assert.equal(compactNumeric.appliedBodyScroll, 0);

const driver = resolveWaflPreparedDirectInputKeyboardTarget({
  currentRootOffset: 120,
  geometry: { ...base, fieldTop: 610 },
  keyboardInset: 300,
  liveBodyOffset: 180,
});
assert.ok(Math.abs(driver.appliedBodyScroll) <= Math.abs(driver.desiredBodyScroll));
assert.equal(driver.bodyScrollTargetOffset, 180 + driver.appliedBodyScroll);

const sameKeyboardTarget = resolveWaflKeyboardRootMotionDecision({
  currentMotion: keyboardMotion,
  requestedTargetOffset: 250,
  translatedCompletionOffset: 520,
});
assert.equal(sameKeyboardTarget.currentKeyboardTargetMatches, true);
assert.equal(sameKeyboardTarget.requestsRootAnimation, false);

assert.equal(resolveWaflDirectInputReturnKeyPolicy({
  completionMode: "form", fieldCount: 1, fieldIndex: 0, multiline: false, returnKeyPolicy: "none",
}), null);
assert.equal(resolveWaflDirectInputReturnKeyPolicy({
  completionMode: "search", fieldCount: 1, fieldIndex: 0, multiline: false, returnKeyPolicy: "auto",
}), "search");
assert.equal(resolveWaflDirectInputReturnKeyPolicy({
  completionMode: "form", fieldCount: 2, fieldIndex: 0, multiline: false, returnKeyPolicy: "auto",
}), "next");
assert.equal(resolveWaflDirectInputReturnKeyPolicy({
  completionMode: "form", fieldCount: 2, fieldIndex: 1, multiline: false, returnKeyPolicy: "auto",
}), "done");

assert.match(reel, /waflKeyboardAccessory="none"[\s\S]*waflReturnKeyPolicy="none"/u);
assert.match(input, /waflReturnKeyPolicy === "none"[\s\S]*undefined/u);
assert.match(workbench, /diagnosticSurfaceId="quick-main"/u);
assert.match(quick, /diagnosticSurfaceId="quick-address-direct"/u);
assert.match(reel, /diagnosticSurfaceId=\{renderPath === "numeric-keypad" \? "numeric-direct" : undefined\}/u);
for (const surface of ["quick-main", "quick-address-direct", "numeric-direct"]) {
  assert.equal(mobileEvidence.includes(`"${surface}"`), true);
  assert.equal(serverEvidence.includes(`"${surface}"`), true);
}
for (const evidenceField of [
  "currentRootPlanningOffset", "currentSystemKeyboardTargetOffset", "bodyScrollDesired",
  "bodyScrollTargetOffset", "topClippingRequirement", "bottomKeyboardGapRequirement",
  "accessoryMode", "returnKeyPolicy", "effectiveReturnKeyType", "keyboardType",
]) assert.equal(sheet.includes(evidenceField), true);

for (const forbidden of [
  "quickContactOffset", "numericBodyScroll = false", "keyboardHeight ===", "windowHeight === 852",
  "PanResponder", "privateKeyboardDone",
]) assert.equal(`${policy}\n${sheet}\n${input}\n${reel}\n${quick}`.includes(forbidden), false);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha73d-live-root-baseline-residual-scroll-numeric-return-key",
  checkpoint: "ALPHA73D_LIVE_ROOT_BASELINE_RESIDUAL_SCROLL_AND_NUMERIC_RETURN_KEY_FIX_IPHONE_QA_REQUIRED",
  caseCount: 20,
  previousPermanentInventoryRetained: 260,
  addedPermanentChecks: 1,
  finalPermanentInventory: 261,
  physicalResultInferred: false,
}));
