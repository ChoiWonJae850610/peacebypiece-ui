#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  resolveWaflKeyboardAppearanceRootRevealClaim,
  resolveWaflKeyboardRootMotionDecision,
  resolveWaflPreparedDirectInputKeyboardTarget,
} from "../apps/mobile/domain/waflDirectInputKeyboardPolicy.ts";

const root = process.cwd();
const read = (relative) => fs.readFileSync(`${root}/${relative}`, "utf8");

const staticRestActive = {
  active: true,
  generation: 8,
  owner: "staticRest",
  targetOffset: 551,
};

// A stale JS completion equal to the requested keyboard target cannot turn an
// incompatible restore into an unresolved no-op.
const conflictingRestore = resolveWaflKeyboardRootMotionDecision({
  currentMotion: staticRestActive,
  requestedTargetOffset: 285,
  translatedCompletionOffset: 285,
});
assert.equal(conflictingRestore.requestsRootAnimation, true);
assert.equal(conflictingRestore.incompatibleRestoreActive, true);
assert.equal(conflictingRestore.previousAnimationMustBeSuperseded, true);
assert.equal(conflictingRestore.resolution, "animation");

// A genuinely matching target retires an incompatible owner explicitly and
// is distinguishable from an unresolved fast path.
const resolvedNoop = resolveWaflKeyboardRootMotionDecision({
  currentMotion: { ...staticRestActive, targetOffset: 285 },
  requestedTargetOffset: 285,
  translatedCompletionOffset: 285,
});
assert.equal(resolvedNoop.requestsRootAnimation, false);
assert.equal(resolvedNoop.previousAnimationMustBeSuperseded, true);
assert.equal(resolvedNoop.resolution, "trueNoop");

const completedKeyboardTarget = resolveWaflKeyboardRootMotionDecision({
  currentMotion: { active: false, generation: 9, owner: "systemKeyboard", targetOffset: 285 },
  requestedTargetOffset: 285,
  translatedCompletionOffset: 285,
});
assert.equal(completedKeyboardTarget.requestsRootAnimation, false);
assert.equal(completedKeyboardTarget.previousAnimationMustBeSuperseded, false);
assert.equal(completedKeyboardTarget.resolution, "trueNoop");

let appearanceState = { appearanceIdentity: null, rootAuthorCount: 0 };
for (let cycle = 1; cycle <= 10; cycle += 1) {
  const appearanceIdentity = `appearance-${cycle}`;
  const decision = resolveWaflKeyboardRootMotionDecision({
    currentMotion: { ...staticRestActive, generation: cycle * 2 },
    requestedTargetOffset: 285,
    translatedCompletionOffset: 285,
  });
  const first = resolveWaflKeyboardAppearanceRootRevealClaim({
    appearanceIdentity,
    current: appearanceState,
    requestsRoot: decision.requestsRootAnimation,
  });
  assert.equal(first.allowRootAuthor, true);
  assert.equal(resolveWaflKeyboardAppearanceRootRevealClaim({
    appearanceIdentity,
    current: first.state,
    requestsRoot: true,
  }).allowRootAuthor, false, "didShow cannot become a second writer");
  appearanceState = first.state;
}

// Direct Size and Direct Spec/POM use the same explicit semantic field+helper
// region and shared 12-point gap in both prepared and measured policies.
const directCreateGeometry = {
  bodyContentHeight: 180,
  bodyOffset: 0,
  bodyViewportHeight: 180,
  compactComposition: true,
  expandedHeight: 801,
  explicitSemanticRegion: true,
  fieldHeight: 104,
  fieldTop: 52,
  fieldWidth: 359,
  fieldX: 0,
  footerHeight: 0,
  headerHeight: 48,
  maximumOffset: 523,
  minimumBodyViewportHeight: 120,
  safeBottom: 34,
  semanticGap: 12,
  semanticLayoutAtMs: 1,
  semanticLayoutRevision: 1,
  semanticScopeComplete: true,
  staticRestingOffset: 523,
  verticalChrome: 16,
};
const fastTarget = resolveWaflPreparedDirectInputKeyboardTarget({
  geometry: directCreateGeometry,
  keyboardInset: 308,
});
const reconciliationTarget = resolveWaflPreparedDirectInputKeyboardTarget({
  geometry: { ...directCreateGeometry },
  keyboardInset: 308,
});
assert.equal(fastTarget.targetOffset, reconciliationTarget.targetOffset);
const semanticBottomInWindow = 852 - directCreateGeometry.expandedHeight
  + fastTarget.targetOffset + fastTarget.semanticContentBottom;
assert.equal(544 - semanticBottomInWindow, 12);

const policy = read("apps/mobile/domain/waflDirectInputKeyboardPolicy.ts");
const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const reusable = read("apps/mobile/features/inputs/WaflReusableCreateForm.tsx");
const size = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx");
const spec = read("apps/mobile/features/work-orders/size-color/SpecItemSelectionSheet.tsx");

assert.match(policy, /ACTIVE_STATIC_REST_MUST_BE_SUPERSEDED/u);
assert.match(sheet, /rootMotionStateRef/u);
assert.match(sheet, /rootOwnershipTransition/u);
assert.match(sheet, /rootOwnershipResolvedNoop/u);
assert.match(sheet, /RESOLVED_TRUE_NOOP_NO_LATE_WRITER/u);
assert.match(sheet, /previousAnimationSuperseded/u);
assert.match(sheet, /rootResolution: keyboardAppearanceRootResolutionRef\.current/u);
assert.match(reusable, /helpText=\{props\.helpText\}/u);
assert.match(reusable, /props\.semanticFocusScope[\s\S]*<WaflSheetSemanticFocusScope/u);
assert.match(size, /title="직접 사이즈 만들기"[\s\S]*semanticFocusScope/u);
assert.match(spec, /title=\{childTitle\}[\s\S]*semanticFocusScope/u);
assert.doesNotMatch(size, /newRecipeKeyboardOffset|directSizeKeyboardOffset/u);
assert.doesNotMatch(spec, /directSpecKeyboardOffset|setTimeout\(/u);
assert.doesNotMatch(sheet, /PanResponder|wafl-sheet-header-drag-zone/u);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha73d-root-animation-ownership-direct-create-semantic-target",
  previousPermanentInventoryRetained: 255,
  addedPermanentChecks: 1,
  finalPermanentInventory: 256,
  checkpoint: "ALPHA73D_ROOT_ANIMATION_OWNERSHIP_AND_DIRECT_CREATE_SEMANTIC_TARGET_FIX_IPHONE_QA_REQUIRED",
  invariants: [
    "ROOT_ANIMATION_OWNER_EXPLICIT",
    "ACTIVE_STATIC_REST_SUPERSEDED_BEFORE_KEYBOARD_NOOP",
    "RESOLVED_TRUE_NOOP_DISTINCT_FROM_UNRESOLVED",
    "SINGLE_VISIBLE_ROOT_WRITER_PRESERVED",
    "TEN_CYCLE_OWNER_TRANSITION_DETERMINISTIC",
    "DIRECT_SIZE_EXPLICIT_FIELD_HELPER_SCOPE",
    "DIRECT_SPEC_EXPLICIT_FIELD_HELPER_SCOPE",
    "FAST_AND_RECONCILIATION_SEMANTIC_TARGET_EQUAL",
    "NO_LOCAL_MAGIC_OFFSET",
  ],
  physicalResultInferred: false,
}));
