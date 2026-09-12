#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  resolveWaflKeyboardAppearanceRevealIdentity,
  resolveWaflKeyboardAppearanceRootRevealClaim,
  resolveWaflKeyboardAppearanceRootScheduling,
  resolveWaflKeyboardTransitionTrust,
} from "../apps/mobile/domain/waflDirectInputKeyboardPolicy.ts";
import { resolveWaflSheetKeyboardRestoreOffset } from "../apps/mobile/domain/waflSheetKeyboardRestorePolicy.ts";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const createSheet = read("apps/mobile/features/work-orders/create/WorkOrderCreateSheet.tsx");
const quick = read("apps/mobile/features/work-orders/documents/QuickDeliveryFoundation.tsx");

const validFrame = {
  event: "willChangeFrame",
  frameHeight: 320,
  frameWidth: 390,
  frameY: 524,
  keyboardClassCurrent: true,
  keyboardInset: 320,
  layoutGenerationCurrent: true,
  platform: "ios",
  preparedGeometryCurrent: true,
  windowHeight: 844,
};
const appearance = ({
  appearanceGeneration = 1,
  focusGeneration = 1,
  keyboardClass = "TEXT",
  layoutGeneration = 1,
  measurementIdentity = "new-recipe:static",
  openGeneration = 1,
} = {}) => resolveWaflKeyboardAppearanceRevealIdentity({
  appearanceGeneration,
  focusGeneration,
  keyboardClass,
  layoutGeneration,
  measurementIdentity,
  openGeneration,
});
const empty = () => ({ appearanceIdentity: null, rootAuthorCount: 0 });
const claim = (state, identity, requestsRoot) => resolveWaflKeyboardAppearanceRootRevealClaim({
  appearanceIdentity: identity,
  current: state,
  requestsRoot,
});

// CASE 1: initial manual focus may schedule on the earliest trustworthy willChange frame.
const trust = resolveWaflKeyboardTransitionTrust(validFrame);
assert.deepEqual(trust, { reason: "TRUSTWORTHY_NATIVE_TRANSITION", trustworthy: true });
assert.equal(resolveWaflKeyboardAppearanceRootScheduling({
  event: "willChangeFrame",
  keyboardVisibleAtAppearanceStart: false,
  platform: "ios",
  trustworthyNativeTransition: trust.trustworthy,
}), true);
const firstAppearance = appearance();
let state = empty();
let result = claim(state, firstAppearance, true);
assert.equal(result.allowRootAuthor, true);
state = result.state;
assert.equal(claim(state, firstAppearance, true).allowRootAuthor, false);

// CASE 2: a provisional/unanchored frame cannot move body or root; a later trustworthy frame owns once.
const provisional = resolveWaflKeyboardTransitionTrust({
  ...validFrame,
  frameHeight: 300,
});
assert.equal(provisional.trustworthy, false);
assert.equal(provisional.reason, "PROVISIONAL_UNANCHORED_FRAME");
assert.equal(resolveWaflKeyboardAppearanceRootScheduling({
  event: "willChangeFrame",
  keyboardVisibleAtAppearanceStart: false,
  platform: "ios",
  trustworthyNativeTransition: provisional.trustworthy,
}), false);
state = empty();
result = claim(state, firstAppearance, false);
assert.equal(result.state.rootAuthorCount, 0);
result = claim(result.state, firstAppearance, true);
assert.equal(result.allowRootAuthor, true);
assert.equal(claim(result.state, firstAppearance, true).allowRootAuthor, false);

// CASE 3/4: state effects and delayed retries cannot bypass an existing appearance claim.
assert.equal(resolveWaflKeyboardAppearanceRootScheduling({
  event: "stateEffect",
  keyboardVisibleAtAppearanceStart: false,
  platform: "ios",
  trustworthyNativeTransition: true,
}), false);
assert.equal(claim(state = result.state, firstAppearance, true).allowRootAuthor, false);

// CASE 5: ten focus/show/hide cycles remain one author each and restore the same static rest.
let staticRest = 244;
for (let cycle = 1; cycle <= 10; cycle += 1) {
  const identity = appearance({ appearanceGeneration: cycle, focusGeneration: cycle });
  state = empty();
  result = claim(state, identity, true);
  assert.equal(result.allowRootAuthor, true);
  assert.equal(claim(result.state, identity, true).allowRootAuthor, false);
  staticRest = resolveWaflSheetKeyboardRestoreOffset(staticRest);
  assert.equal(staticRest, 244);
}

// CASE 6: TEXT <-> PHONE_NUMBER gets fresh identities without stale outgoing authority.
const classIdentities = new Set();
for (let transition = 1; transition <= 10; transition += 1) {
  const identity = appearance({
    appearanceGeneration: transition,
    focusGeneration: transition,
    keyboardClass: transition % 2 === 0 ? "TEXT" : "PHONE_NUMBER",
  });
  classIdentities.add(identity);
  result = claim(empty(), identity, true);
  assert.equal(result.allowRootAuthor, true);
  assert.equal(claim(result.state, identity, true).allowRootAuthor, false);
}
assert.equal(classIdentities.size, 10);

// CASE 7: stale layout/open/focus/measurement evidence cannot enter the fast path.
assert.equal(resolveWaflKeyboardTransitionTrust({
  ...validFrame,
  layoutGenerationCurrent: false,
}).reason, "LAYOUT_GENERATION_STALE");
assert.notEqual(appearance({ layoutGeneration: 1 }), appearance({ layoutGeneration: 2 }));
assert.notEqual(appearance({ focusGeneration: 1 }), appearance({ focusGeneration: 2 }));
assert.notEqual(appearance({ measurementIdentity: "a" }), appearance({ measurementIdentity: "b" }));
assert.notEqual(appearance({ openGeneration: 1 }), appearance({ openGeneration: 2 }));

// CASE 8: an already-visible field consumes no root slot.
result = claim(empty(), firstAppearance, false);
assert.equal(result.allowRootAuthor, false);
assert.equal(result.state.rootAuthorCount, 0);

// LIVE owner: trustworthy event gates both body scroll and the only root animation.
assert.match(sheet, /resolveWaflKeyboardTransitionTrust\(\{/u);
assert.match(sheet, /const rootMotionDecision = resolveKeyboardRootMotion\(plan\.targetOffset\)/u);
assert.match(sheet, /const noOpResolved = canScheduleRoot && !rootRequested/u);
assert.match(sheet, /const adoptFastPath = canScheduleRoot && \(rootClaimGranted \|\| noOpResolved\)/u);
assert.match(sheet, /const appliedBodyScroll = adoptFastPath && frameChanged/u);
assert.match(sheet, /if \(rootClaimGranted\) \{[\s\S]*rootAnimationScheduled[\s\S]*animateToOwnerRef\.current/u);
assert.match(sheet, /NO_LATE_SECOND_STAGE_AFTER_FAST_PATH/u);
assert.match(sheet, /layoutGeneration: activeTarget\.layoutGeneration/u);
assert.match(sheet, /target\.layoutGeneration === layoutGenerationRef\.current\.generation/u);
assert.match(sheet, /EXPO_PUBLIC_WAFL_EXTERNAL_QA[\s\S]*WAFL_KEYBOARD_REVEAL_EVIDENCE/u);
assert.match(sheet, /event: "measurementRetry"[\s\S]*PRIMARY_MEASURE_INVALID/u);
assert.match(sheet, /event: "finalVisibilityReconciliation"/u);
assert.match(sheet, /Keyboard\.addListener\("keyboardWillShow"/u);
assert.match(sheet, /Keyboard\.addListener\("keyboardWillChangeFrame"/u);
assert.match(sheet, /Keyboard\.addListener\("keyboardDidShow"/u);

// Product-local offsets/timeouts remain absent.
assert.doesNotMatch(createSheet, /keyboardVerticalOffset|setTimeout/u);
assert.doesNotMatch(quick, /keyboardVerticalOffset|quick.*offset/i);
for (const retiredOwner of ["PanResponder", "wafl-sheet-header-drag-zone", "settledOffsetRef", "preKeyboardSettledOffsetRef"]) {
  assert.doesNotMatch(sheet, new RegExp(retiredOwner, "u"));
}
assert.match(read("lib/constants/version.ts"), /2\.0\.0-alpha\.(?:72|73|74|75|76|77|78|79)/u);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha73d-keyboard-reveal-latency-evidence-safe-fast-path",
  checkpoint: "ALPHA73D_KEYBOARD_REVEAL_LATENCY_EVIDENCE_SAFE_FAST_PATH_IPHONE_REQA_REQUIRED",
  caseCount: 8,
  diagnosis: ["A", "D"],
  earlyTrustworthyRootSchedule: true,
  provisionalVisibleRootRise: 0,
  rootAuthorsPerAppearanceMax: 1,
  focusShowHideCycles: 10,
  keyboardClassTransitionCycles: 10,
  cumulativeRootDrift: 0,
  physicalResultInferred: false,
}));
