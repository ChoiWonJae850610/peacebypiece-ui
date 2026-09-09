#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  resolveWaflKeyboardFrameRevealIdentity,
  resolveWaflKeyboardFrameRootRevealClaim,
} from "../apps/mobile/domain/waflDirectInputKeyboardPolicy.ts";
import { resolveWaflSheetKeyboardRestoreOffset } from "../apps/mobile/domain/waflSheetKeyboardRestorePolicy.ts";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const createSheet = read("apps/mobile/features/work-orders/create/WorkOrderCreateSheet.tsx");

const frame = ({ focusGeneration = 1, keyboardClass = "TEXT", openGeneration = 1 } = {}) => (
  resolveWaflKeyboardFrameRevealIdentity({
    focusGeneration,
    frameHeight: keyboardClass === "PHONE_NUMBER" ? 332 : 346,
    frameWidth: 390,
    frameX: 0,
    frameY: keyboardClass === "PHONE_NUMBER" ? 512 : 498,
    keyboardClass,
    keyboardInset: keyboardClass === "PHONE_NUMBER" ? 332 : 346,
    measurementIdentity: "new-recipe:static",
    openGeneration,
  })
);
const empty = () => ({ frameIdentity: null, rootAuthorCount: 0 });
const claim = (state, frameIdentity, requestsRoot) => resolveWaflKeyboardFrameRootRevealClaim({
  current: state,
  frameIdentity,
  requestsRoot,
});

// Case 1: willChange owns the one root target; didShow for that frame is body/assertion only.
let state = empty();
let result = claim(state, frame(), true);
assert.equal(result.allowRootAuthor, true);
state = result.state;
result = claim(state, frame(), true);
assert.equal(result.allowRootAuthor, false);
assert.equal(result.state.rootAuthorCount, 1);

// Case 2: no prepared root target at willChange leaves the one ownership slot to didShow.
state = empty();
result = claim(state, frame(), false);
assert.equal(result.allowRootAuthor, false);
assert.equal(result.state.rootAuthorCount, 0);
state = result.state;
result = claim(state, frame(), true);
assert.equal(result.allowRootAuthor, true);
assert.equal(result.state.rootAuthorCount, 1);

// Case 3: duplicate native willChange/didShow/final callbacks cannot exceed one author.
state = empty();
let authorCount = 0;
for (const requestsRoot of [true, true, true, true]) {
  result = claim(state, frame(), requestsRoot);
  state = result.state;
  if (result.allowRootAuthor) authorCount += 1;
}
assert.equal(authorCount, 1);

// Case 4: ten independent focus/show/hide appearances restore the same static root without drift.
let staticRest = 244;
for (let cycle = 1; cycle <= 10; cycle += 1) {
  state = empty();
  result = claim(state, frame({ focusGeneration: cycle }), true);
  assert.equal(result.allowRootAuthor, true);
  assert.equal(claim(result.state, frame({ focusGeneration: cycle }), true).allowRootAuthor, false);
  staticRest = resolveWaflSheetKeyboardRestoreOffset(staticRest);
  assert.equal(staticRest, 244);
}

// Case 5: TEXT <-> PHONE_NUMBER gets a fresh identity, once, without reusing an outgoing frame.
state = empty();
authorCount = 0;
for (let transition = 1; transition <= 10; transition += 1) {
  const keyboardClass = transition % 2 === 0 ? "TEXT" : "PHONE_NUMBER";
  const incoming = frame({ focusGeneration: transition, keyboardClass });
  result = claim(state, incoming, true);
  state = result.state;
  if (result.allowRootAuthor) authorCount += 1;
  assert.equal(claim(state, incoming, true).allowRootAuthor, false);
}
assert.equal(authorCount, 10);

// Case 6: source generations guard stale callbacks; a materially new lifecycle identity owns its own slot.
assert.match(sheet, /target\.openGeneration !== openGenerationRef\.current/u);
assert.match(sheet, /focusedTargetRef\.current\?\.focusGeneration === target\.focusGeneration/u);
assert.match(sheet, /target\.measurementIdentity === measurementIdentity/u);
assert.notEqual(frame({ focusGeneration: 1 }), frame({ focusGeneration: 2 }));
assert.notEqual(frame({ keyboardClass: "TEXT" }), frame({ keyboardClass: "PHONE_NUMBER" }));

assert.match(createSheet, /keyboardMode="directInput"/u);
assert.match(createSheet, /keyboardAutoExpand/u);
assert.doesNotMatch(createSheet, /onPreparedForAutoFocus/u);
assert.match(sheet, /keyboardWillChangeFrame[\s\S]*resolveWaflKeyboardFrameRevealIdentity/u);
assert.match(sheet, /keyboardDidShow[\s\S]*keyboardAppearanceIdentity: appearanceIdentity[\s\S]*keyboardFrameIdentity: frameIdentity/u);
assert.match(sheet, /claimKeyboardRootReveal\(\{[\s\S]*appearanceIdentity[\s\S]*frameIdentity/u);
assert.match(sheet, /rootAuthorCount: 0/u);
for (const retiredOwner of ["PanResponder", "wafl-sheet-header-drag-zone", "settledOffsetRef", "preKeyboardSettledOffsetRef"]) {
  assert.doesNotMatch(sheet, new RegExp(retiredOwner, "u"));
}
assert.match(read("lib/constants/version.ts"), /2\.0\.0-alpha\.(?:72|73|74|75|76)/u);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha73d-phase2-new-recipe-single-reveal-blocker",
  checkpoint: "ALPHA73D_PHASE2_NEW_RECIPE_SINGLE_REVEAL_BLOCKER_IPHONE_REQA_REQUIRED",
  invariant: "SINGLE_ROOT_REVEAL_PER_KEYBOARD_FRAME",
  caseCount: 6,
  duplicateFrameRootAuthorCount: 1,
  focusShowHideCycles: 10,
  keyboardClassTransitionCycles: 10,
  cumulativeRootDrift: 0,
  physicalResultInferred: false,
}));
