#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  resolveWaflKeyboardAppearanceRevealIdentity,
  resolveWaflKeyboardAppearanceRootRevealClaim,
  resolveWaflKeyboardAppearanceRootScheduling,
  resolveWaflKeyboardFrameRevealIdentity,
} from "../apps/mobile/domain/waflDirectInputKeyboardPolicy.ts";
import { resolveWaflSheetKeyboardRestoreOffset } from "../apps/mobile/domain/waflSheetKeyboardRestorePolicy.ts";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const createSheet = read("apps/mobile/features/work-orders/create/WorkOrderCreateSheet.tsx");

const appearance = ({
  appearanceGeneration = 1,
  focusGeneration = 1,
  keyboardClass = "TEXT",
  measurementIdentity = "new-recipe:static",
  openGeneration = 1,
} = {}) => resolveWaflKeyboardAppearanceRevealIdentity({
  appearanceGeneration,
  focusGeneration,
  keyboardClass,
  measurementIdentity,
  openGeneration,
});
const frame = ({ frameHeight, frameY, keyboardClass = "TEXT" }) => resolveWaflKeyboardFrameRevealIdentity({
  focusGeneration: 1,
  frameHeight,
  frameWidth: 390,
  frameX: 0,
  frameY,
  keyboardClass,
  keyboardInset: 844 - frameY,
  measurementIdentity: "new-recipe:static",
  openGeneration: 1,
});
const empty = () => ({ appearanceIdentity: null, rootAuthorCount: 0 });
const claim = (state, appearanceIdentity, requestsRoot) => resolveWaflKeyboardAppearanceRootRevealClaim({
  appearanceIdentity,
  current: state,
  requestsRoot,
});

const frameA = frame({ frameHeight: 320, frameY: 524 });
const frameB = frame({ frameHeight: 346, frameY: 498 });
assert.notEqual(frameA, frameB);

// CASE 1/2: distinct native frames remain one appearance and one visible root author.
const initialAppearance = appearance();
let state = empty();
let rootAuthorCount = 0;
for (const nativeEvent of ["willChangeFrame", "willShow", "willChangeFrame", "didShow"]) {
  const maySchedule = resolveWaflKeyboardAppearanceRootScheduling({
    event: nativeEvent,
    keyboardVisibleAtAppearanceStart: false,
    platform: "ios",
  });
  const result = claim(state, initialAppearance, maySchedule);
  state = result.state;
  if (result.allowRootAuthor) rootAuthorCount += 1;
}
assert.equal(rootAuthorCount, 1);
assert.equal(state.rootAuthorCount, 1);

// CASE 3: a provisional event consumes nothing; one later stable/final event may own root.
state = empty();
let result = claim(state, initialAppearance, false);
assert.equal(result.allowRootAuthor, false);
assert.equal(result.state.rootAuthorCount, 0);
state = result.state;
result = claim(state, initialAppearance, true);
assert.equal(result.allowRootAuthor, true);
assert.equal(result.state.rootAuthorCount, 1);
assert.equal(claim(result.state, initialAppearance, true).allowRootAuthor, false);

// CASE 4: React keyboardInset state synchronization is body/evidence-only.
assert.equal(resolveWaflKeyboardAppearanceRootScheduling({
  event: "stateEffect",
  keyboardVisibleAtAppearanceStart: false,
  platform: "ios",
}), false);

// CASE 5: duplicate and distinct intermediate frames do not mint new appearance authority.
state = empty();
rootAuthorCount = 0;
for (const requestsRoot of [true, true, true, true, true]) {
  result = claim(state, initialAppearance, requestsRoot);
  state = result.state;
  if (result.allowRootAuthor) rootAuthorCount += 1;
}
assert.equal(rootAuthorCount, 1);

// CASE 6: hide terminates the transaction; each new explicit focus gets one fresh slot and exact rest.
let staticRest = 244;
for (let cycle = 1; cycle <= 10; cycle += 1) {
  const cycleAppearance = appearance({ appearanceGeneration: cycle, focusGeneration: cycle });
  state = empty();
  result = claim(state, cycleAppearance, true);
  assert.equal(result.allowRootAuthor, true);
  assert.equal(claim(result.state, cycleAppearance, true).allowRootAuthor, false);
  staticRest = resolveWaflSheetKeyboardRestoreOffset(staticRest);
  assert.equal(staticRest, 244);
}

// CASE 7: genuine TEXT <-> PHONE_NUMBER transitions get a new transaction, never two root authors.
const transitionIdentities = new Set();
for (let transition = 1; transition <= 10; transition += 1) {
  const keyboardClass = transition % 2 === 0 ? "TEXT" : "PHONE_NUMBER";
  const transitionAppearance = appearance({
    appearanceGeneration: transition,
    focusGeneration: transition,
    keyboardClass,
  });
  transitionIdentities.add(transitionAppearance);
  state = empty();
  result = claim(state, transitionAppearance, true);
  assert.equal(result.allowRootAuthor, true);
  assert.equal(claim(result.state, transitionAppearance, true).allowRootAuthor, false);
}
assert.equal(transitionIdentities.size, 10);

// CASE 8: LIVE owner binds root/body callbacks to current open/focus/measurement/appearance generations.
assert.match(sheet, /target\.openGeneration !== openGenerationRef\.current/u);
assert.match(sheet, /focusedTargetRef\.current\?\.focusGeneration === target\.focusGeneration/u);
assert.match(sheet, /target\.measurementIdentity === measurementIdentity/u);
assert.match(sheet, /keyboardAppearanceRootRevealStateRef\.current\.appearanceIdentity === keyboardAppearanceIdentity/u);
assert.match(sheet, /keyboardAppearanceGenerationRef\.current \+= 1/u);
assert.match(sheet, /Keyboard\.addListener\("keyboardWillShow"/u);
assert.match(sheet, /event: "stateEffect"[\s\S]*keyboardAppearanceIdentity/u);
assert.match(sheet, /refreshesCurrentFocus[\s\S]*focusGeneration: currentTarget\.focusGeneration/u);
assert.match(sheet, /revealFocusedTarget\(refreshedTarget, \{[\s\S]*allowRootAuthor: false/u);
assert.match(sheet, /claimKeyboardRootReveal\(\{[\s\S]*appearanceIdentity[\s\S]*frameIdentity/u);

assert.match(createSheet, /keyboardMode="directInput"/u);
assert.match(createSheet, /keyboardAutoExpand/u);
assert.doesNotMatch(createSheet, /onPreparedForAutoFocus/u);
assert.doesNotMatch(createSheet, /keyboardVerticalOffset|setTimeout/u);
for (const retiredOwner of ["PanResponder", "wafl-sheet-header-drag-zone", "settledOffsetRef", "preKeyboardSettledOffsetRef"]) {
  assert.doesNotMatch(sheet, new RegExp(retiredOwner, "u"));
}
assert.match(read("lib/constants/version.ts"), /2\.0\.0-alpha\.(?:72|73)/u);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha73d-phase2-new-recipe-keyboard-appearance-single-reveal",
  checkpoint: "ALPHA73D_PHASE2_NEW_RECIPE_KEYBOARD_APPEARANCE_SINGLE_REVEAL_IPHONE_REQA_REQUIRED",
  invariant: "SINGLE_VISIBLE_ROOT_REVEAL_PER_KEYBOARD_APPEARANCE",
  caseCount: 8,
  distinctNativeFrames: 2,
  rootAuthorsPerAppearance: 1,
  focusShowHideCycles: 10,
  keyboardClassTransitionCycles: 10,
  cumulativeRootDrift: 0,
  physicalResultInferred: false,
}));
