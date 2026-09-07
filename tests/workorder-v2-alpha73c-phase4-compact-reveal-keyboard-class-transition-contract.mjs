#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  resolveWaflPreparedDirectInputKeyboardTarget,
  resolveWaflSheetKeyboardClassTransition,
  resolveWaflSheetSemanticKeyboardClass,
} from "../apps/mobile/domain/waflDirectInputKeyboardPolicy.ts";
import {
  beginWaflSheetFocusRevealCycle,
  markWaflSheetFocusRevealCycleDismissing,
  replaceWaflSheetSystemRevealBodyDelta,
} from "../apps/mobile/domain/waflSheetKeyboardRestorePolicy.ts";

assert.equal(resolveWaflSheetSemanticKeyboardClass({ multiline: false }), "TEXT");
assert.equal(resolveWaflSheetSemanticKeyboardClass({ keyboardType: "phone-pad", multiline: false }), "PHONE_NUMBER");
assert.equal(resolveWaflSheetSemanticKeyboardClass({ keyboardType: "decimal-pad", multiline: false }), "PHONE_NUMBER");
assert.equal(resolveWaflSheetSemanticKeyboardClass({ multiline: true }), "MULTILINE");
assert.equal(resolveWaflSheetSemanticKeyboardClass({ completionMode: "search", multiline: false }), "SEARCH");
assert.equal(resolveWaflSheetKeyboardClassTransition({ currentFrameClass: "TEXT", keyboardVisible: true, nextClass: "TEXT" }).requiresFreshFrame, false);
let alternatingClass = "TEXT";
for (let cycleIndex = 0; cycleIndex < 10; cycleIndex += 1) {
  const nextClass = alternatingClass === "TEXT" ? "PHONE_NUMBER" : "TEXT";
  const transition = resolveWaflSheetKeyboardClassTransition({
    currentFrameClass: alternatingClass,
    keyboardVisible: true,
    nextClass,
  });
  assert.equal(transition.requiresFreshFrame, true);
  assert.equal(transition.canRevealWithCurrentFrame, false);
  alternatingClass = nextClass;
}

const compact = resolveWaflPreparedDirectInputKeyboardTarget({
  geometry: {
    bodyContentHeight: 520,
    bodyOffset: 0,
    bodyViewportHeight: 620,
    compactComposition: true,
    expandedHeight: 760,
    explicitSemanticRegion: false,
    fieldHeight: 52,
    fieldTop: 24,
    footerHeight: 0,
    headerHeight: 64,
    maximumOffset: 260,
    minimumBodyViewportHeight: 96,
    staticRestingOffset: 220,
    safeBottom: 34,
    semanticGap: 24,
    verticalChrome: 32,
  },
  keyboardInset: 300,
});
assert.equal(compact.compactCompositionBottom, 634, "composition remains evidence only");
assert.equal(compact.compactCompositionRequired, false, "ordinary footerless compact body remains unrelated evidence");
assert.ok(compact.targetOffset > 0, "semantic compact reveal must not force full expansion");

let cycle = beginWaflSheetFocusRevealCycle({ bodyOffset: 10, focusGeneration: 1 });
let replacement = replaceWaflSheetSystemRevealBodyDelta(cycle, 50);
assert.equal(replacement.appliedDelta, 50);
cycle = replacement.cycle;
replacement = replaceWaflSheetSystemRevealBodyDelta(cycle, 90);
assert.equal(replacement.appliedDelta, 40, "absolute reveal target replaces rather than adds");
cycle = replacement.cycle;
replacement = replaceWaflSheetSystemRevealBodyDelta(cycle, 30);
assert.equal(replacement.appliedDelta, -60, "higher field removes obsolete system compensation");

const dismissing = markWaflSheetFocusRevealCycleDismissing(cycle);
const transferred = beginWaflSheetFocusRevealCycle({
  bodyOffset: 100,
  focusGeneration: 2,
  previous: dismissing,
  transferPrevious: true,
});
assert.equal(transferred.lifecycle, "TRANSFERRING");
assert.equal(transferred.bodyBaselineOffset, 10);
const fresh = beginWaflSheetFocusRevealCycle({
  bodyOffset: 22,
  focusGeneration: 3,
  previous: dismissing,
  transferPrevious: false,
});
assert.equal(fresh.lifecycle, "ACTIVE");
assert.equal(fresh.bodyBaselineOffset, 22, "terminated/dismissing cycles are not inherited blindly");
assert.equal(fresh.systemBodyDelta, 0);

const sheet = fs.readFileSync("apps/mobile/features/inputs/WaflInputSheet.tsx", "utf8");
const input = fs.readFileSync("apps/mobile/features/inputs/WaflSheetTextInput.tsx", "utf8");
assert.match(input, /keyboardClass: WaflSheetSemanticKeyboardClass/u);
assert.match(sheet, /pendingKeyboardClassRef/u);
assert.match(sheet, /resolveWaflSheetKeyboardClassTransition/u);
assert.match(sheet, /!keyboardClassTransition[\s\S]{0,220}revealFocusedTarget\(activeTarget, \{ keyboardAppearanceIdentity: appearanceIdentity \}\)/u, "old keyboard frame cannot reveal a new keyboard class");
assert.match(sheet, /applySystemBodyScrollDelta\(plan\.appliedBodyScroll/u);
assert.match(sheet, /applyWaflSheetSystemRevealBodyDelta/u);
assert.match(sheet, /markWaflSheetFocusRevealCycleDismissing/u);
assert.match(sheet, /markWaflSheetFocusRevealCycleTerminated/u);
assert.match(sheet, /compactCompositionGap[\s\S]{0,180}footer !== null/u);
assert.doesNotMatch(sheet, /keyboardClassTransition[\s\S]{0,300}(setTimeout|keyboardVerticalOffset)/u);

assert.equal(fs.readdirSync("db/v2/migrations").filter((name) => name.endsWith(".sql")).length, 22);
assert.match(fs.readFileSync("lib/constants/version.ts", "utf8"), /2\.0\.0-alpha\.(?:72|73|74)/u);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha73c-phase4-compact-reveal-keyboard-class-transition",
  compactSemanticReveal: true,
  absoluteSystemRevealReplacement: true,
  keyboardClasses: ["TEXT", "PHONE_NUMBER", "MULTILINE", "SEARCH"],
  oldKeyboardFrameReveal: 0,
  addressDirectAlternatingCycles: 10,
  physicalResultInferred: false,
}));
