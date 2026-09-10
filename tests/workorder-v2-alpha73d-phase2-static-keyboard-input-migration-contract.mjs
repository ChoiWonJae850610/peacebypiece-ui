#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  resolveWaflSheetKeyboardClassTransition,
} from "../apps/mobile/domain/waflDirectInputKeyboardPolicy.ts";
import {
  beginWaflSheetFocusRevealCycle,
  replaceWaflSheetSystemRevealBodyDelta,
  resolveWaflSheetFocusRevealRestore,
  resolveWaflSheetKeyboardRestoreOffset,
  resolveWaflSheetSystemKeyboardTarget,
} from "../apps/mobile/domain/waflSheetKeyboardRestorePolicy.ts";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const restorePolicy = read("apps/mobile/domain/waflSheetKeyboardRestorePolicy.ts");
const rootPolicy = read("apps/mobile/domain/waflSheetDetentPolicy.ts");

assert.equal(resolveWaflSheetKeyboardRestoreOffset(244), 244);
assert.equal(resolveWaflSheetKeyboardRestoreOffset(-20), 0);
assert.equal(resolveWaflSheetKeyboardRestoreOffset(Number.NaN), 0);
assert.equal(resolveWaflSheetSystemKeyboardTarget({ requestedOffset: 120, staticRestingOffset: 244 }), 120);
assert.equal(resolveWaflSheetSystemKeyboardTarget({ requestedOffset: 300, staticRestingOffset: 244 }), 244);
assert.equal(resolveWaflSheetSystemKeyboardTarget({ requestedOffset: -30, staticRestingOffset: 244 }), 0);
assert.equal(resolveWaflSheetSystemKeyboardTarget({ requestedOffset: Number.NaN, staticRestingOffset: 244 }), 244);

let staticRest = 244;
for (let cycleIndex = 0; cycleIndex < 10; cycleIndex += 1) {
  const keyboardTarget = resolveWaflSheetSystemKeyboardTarget({
    requestedOffset: cycleIndex % 2 === 0 ? 126 : 92,
    staticRestingOffset: staticRest,
  });
  assert.ok(keyboardTarget >= 0 && keyboardTarget <= staticRest);
  staticRest = resolveWaflSheetKeyboardRestoreOffset(staticRest);
  assert.equal(staticRest, 244);
}

let bodyCycle = beginWaflSheetFocusRevealCycle({ bodyOffset: 18, focusGeneration: 1 });
let bodyReplacement = replaceWaflSheetSystemRevealBodyDelta(bodyCycle, 54);
assert.equal(bodyReplacement.appliedDelta, 54);
bodyCycle = bodyReplacement.cycle;
bodyReplacement = replaceWaflSheetSystemRevealBodyDelta(bodyCycle, 82);
assert.equal(bodyReplacement.appliedDelta, 28);
bodyCycle = bodyReplacement.cycle;
bodyReplacement = replaceWaflSheetSystemRevealBodyDelta(bodyCycle, 20);
assert.equal(bodyReplacement.appliedDelta, -62);
assert.deepEqual(resolveWaflSheetFocusRevealRestore({ cycle: bodyReplacement.cycle }), { bodyOffset: 18 });

let keyboardClass = "TEXT";
for (let cycleIndex = 0; cycleIndex < 10; cycleIndex += 1) {
  const nextClass = keyboardClass === "TEXT" ? "PHONE_NUMBER" : "TEXT";
  assert.deepEqual(resolveWaflSheetKeyboardClassTransition({
    currentFrameClass: keyboardClass,
    keyboardVisible: true,
    nextClass,
  }), { canRevealWithCurrentFrame: false, requiresFreshFrame: true });
  keyboardClass = nextClass;
}

for (const retiredRootOwner of [
  "settledOffsetRef",
  "preKeyboardSettledOffsetRef",
  "rootBaselineOffset",
  "commitSettled",
  "directInputKeyboardOffsetRef",
]) assert.doesNotMatch(`${sheet}\n${restorePolicy}`, new RegExp(retiredRootOwner, "u"));

assert.match(sheet, /const mediumOffset = [\s\S]*resolveWaflStaticSheetRestingOffset/u);
assert.match(sheet, /type WaflSheetRootAnimationOptions = \{/u);
assert.match(sheet, /readonly owner: Extract<WaflSheetRootMotionOwner, "staticRest" \| "systemKeyboard">/u);
assert.match(sheet, /rootMotionStateRef/u);
assert.match(sheet, /options\.owner === "staticRest"[\s\S]*resolveWaflSheetKeyboardRestoreOffset\(mediumOffset\)[\s\S]*resolveWaflSheetSystemKeyboardTarget/u);
assert.match(sheet, /animateTo\(restoreOffset, \{ owner: "staticRest" \}\)/u);
assert.match(sheet, /animateTo\(mergedTargetOffset, \{[\s\S]{0,100}owner: "systemKeyboard"/u);
assert.match(sheet, /applySystemBodyScrollDelta[\s\S]*applyWaflSheetSystemRevealBodyDelta/u);
assert.match(sheet, /availableForwardScroll[\s\S]*resolveWaflDirectInputRevealMotion/u);
assert.match(sheet, /pendingKeyboardClassRef[\s\S]*requiresFreshFrame/u);
assert.match(sheet, /keyboardDidShow[\s\S]*finalReconciliation: true/u);
assert.match(sheet, /target\.openGeneration !== openGenerationRef\.current/u);
assert.doesNotMatch(`${sheet}\n${rootPolicy}`, /PanResponder|wafl-sheet-header-drag-zone|resolveWaflSheetRelease/u);

assert.equal(fs.readdirSync(path.join(root, "db", "v2", "migrations")).filter((name) => name.endsWith(".sql")).length, 22);
assert.match(read("lib/constants/version.ts"), /2\.0\.0-alpha\.(?:72|73|74|75|76|77|78)/u);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha73d-phase2-static-keyboard-input-migration",
  checkpoint: "ALPHA73D_PHASE2_STATIC_KEYBOARD_INPUT_MIGRATION_IPHONE_QA_REQUIRED",
  staticRestOwnerCount: 1,
  keyboardTarget: "ephemeral-absolute",
  bodyReveal: "absolute-replacement-first",
  focusHideCycles: 10,
  keyboardClassTransitionCycles: 10,
  rootDrift: 0,
  physicalResultInferred: false,
}));
