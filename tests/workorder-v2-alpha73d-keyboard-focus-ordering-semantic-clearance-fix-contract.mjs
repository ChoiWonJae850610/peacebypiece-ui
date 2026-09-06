#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  resolveWaflKeyboardAppearanceRevealIdentity,
  resolveWaflKeyboardAppearanceRootRevealClaim,
  resolveWaflKeyboardAppearanceRootScheduling,
  resolveWaflKeyboardTransitionTrust,
  resolveWaflPendingPreFocusKeyboardTransitionConsumption,
  resolveWaflPreparedDirectInputKeyboardTarget,
} from "../apps/mobile/domain/waflDirectInputKeyboardPolicy.ts";

const root = process.cwd();
const read = (relative) => fs.readFileSync(`${root}/${relative}`, "utf8");

const candidate = {
  layoutGeneration: 7,
  measurementIdentity: "new-recipe:393x852",
  openGeneration: 3,
  sheetInstanceId: 11,
};
const current = { ...candidate };
const consume = (overrides = {}) => resolveWaflPendingPreFocusKeyboardTransitionConsumption({
  candidate,
  current,
  dismissing: false,
  keyboardClassTransition: false,
  visible: true,
  ...overrides,
});

// Native iOS keyboard will-events may precede the RN onFocus owner. A current
// candidate bridges only that ordering gap and is never itself a root claim.
assert.deepEqual(consume(), { consume: true, reason: "CURRENT" });
assert.equal(consume({ visible: false }).consume, false);
assert.equal(consume({ dismissing: true }).consume, false);
assert.equal(consume({ keyboardClassTransition: true }).consume, false);
for (const [key, value] of [
  ["sheetInstanceId", 12],
  ["openGeneration", 4],
  ["layoutGeneration", 8],
  ["measurementIdentity", "stale"],
]) {
  assert.equal(consume({ current: { ...current, [key]: value } }).consume, false, `${key} must reject stale candidate`);
}

const transitionTrust = resolveWaflKeyboardTransitionTrust({
  event: "willChangeFrame",
  frameHeight: 308,
  frameWidth: 393,
  frameY: 544,
  keyboardClassCurrent: true,
  keyboardInset: 308,
  layoutGenerationCurrent: true,
  platform: "ios",
  preparedGeometryCurrent: true,
  windowHeight: 852,
});
assert.equal(transitionTrust.trustworthy, true);
assert.equal(resolveWaflKeyboardAppearanceRootScheduling({
  event: "willChangeFrame",
  keyboardVisibleAtAppearanceStart: true,
  platform: "ios",
  trustworthyNativeTransition: transitionTrust.trustworthy,
}), true);

const appearanceIdentity = resolveWaflKeyboardAppearanceRevealIdentity({
  appearanceGeneration: 4,
  focusGeneration: 9,
  keyboardClass: "TEXT",
  layoutGeneration: 7,
  measurementIdentity: current.measurementIdentity,
  openGeneration: current.openGeneration,
});
const firstClaim = resolveWaflKeyboardAppearanceRootRevealClaim({
  appearanceIdentity,
  current: { appearanceIdentity: null, rootAuthorCount: 0 },
  requestsRoot: true,
});
assert.equal(firstClaim.allowRootAuthor, true);
assert.equal(resolveWaflKeyboardAppearanceRootRevealClaim({
  appearanceIdentity,
  current: firstClaim.state,
  requestsRoot: true,
}).allowRootAuthor, false, "didShow cannot become a second writer for the same appearance");

// Explicit product semantic scopes use the shared semantic gap, while normal
// fields retain the broader default focus context. This normalizes clearance
// without a New Recipe or Spec Save local Y offset.
const semanticGap = 12;
const newRecipe = resolveWaflPreparedDirectInputKeyboardTarget({
  geometry: {
    bodyContentHeight: 180,
    bodyOffset: 0,
    bodyViewportHeight: 180,
    compactComposition: true,
    expandedHeight: 801,
    explicitSemanticRegion: true,
    fieldHeight: 168,
    fieldTop: 0,
    fieldWidth: 359,
    fieldX: 0,
    footerHeight: 0,
    headerHeight: 48,
    maximumOffset: 523,
    minimumBodyViewportHeight: 120,
    safeBottom: 34,
    semanticGap,
    semanticLayoutAtMs: 1,
    semanticLayoutRevision: 1,
    semanticScopeComplete: true,
    staticRestingOffset: 523,
    verticalChrome: 16,
  },
  keyboardInset: 308,
});
const keyboardTop = 544;
const semanticBottomInWindow = 852 - 801 + newRecipe.targetOffset + newRecipe.semanticContentBottom;
assert.equal(keyboardTop - semanticBottomInWindow, semanticGap);
assert.ok(newRecipe.targetOffset > 197, "normalized semantic gap must remove the former oversized clearance");

const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const policy = read("apps/mobile/domain/waflDirectInputKeyboardPolicy.ts");
const create = read("apps/mobile/features/work-orders/create/WorkOrderCreateSheet.tsx");
const templates = read("apps/mobile/features/work-orders/size-color/MeasurementTemplateSheets.tsx");

assert.match(policy, /resolveWaflPendingPreFocusKeyboardTransitionConsumption/u);
assert.match(sheet, /event: "pendingPreFocusTransition"[\s\S]*NATIVE_WILL_EVENT_AWAITING_FOCUS_OWNER/u);
assert.match(sheet, /pendingPreFocusKeyboardTransitionRef\.current = null;[\s\S]*resolveWaflPendingPreFocusKeyboardTransitionConsumption/u);
assert.match(sheet, /event: "pendingPreFocusTransitionConsumed"/u);
assert.match(sheet, /keyboardTransition: pendingTransition\.transition/u);
assert.match(sheet, /claimKeyboardRootReveal\(\{[\s\S]*appearanceIdentity,[\s\S]*frameIdentity/u);
assert.match(sheet, /target\.semanticScope[\s\S]*WAFL_THEME\.sheet\.focusRevealGap[\s\S]*effectiveFocusRevealContext/u);
assert.match(create, /<WaflSheetSemanticFocusScope[\s\S]*<WorkOrderCharacterChoice[\s\S]*<\/WaflSheetSemanticFocusScope>/u);
assert.match(templates, /<WaflSheetSemanticFocusScope[^>]*testID="spec-save-new-semantic-reveal-scope">[\s\S]*<WaflSheetValueField[\s\S]*\{modeSelector\}[\s\S]*<\/WaflSheetSemanticFocusScope>/u);
assert.doesNotMatch(create, /autoCorrect=/u);
for (const forbidden of [
  "pendingPreFocusSetTimeout",
  "newRecipeKeyboardOffset",
  "specSaveKeyboardOffset",
  "PanResponder",
  "wafl-sheet-header-drag-zone",
]) assert.doesNotMatch(sheet, new RegExp(forbidden, "u"));

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha73d-keyboard-focus-ordering-semantic-clearance-fix",
  previousPermanentInventoryRetained: 254,
  addedPermanentChecks: 1,
  finalPermanentInventory: 255,
  checkpoint: "ALPHA73D_KEYBOARD_FOCUS_ORDERING_AND_SEMANTIC_CLEARANCE_FIX_IPHONE_QA_REQUIRED",
  numericEvidence: {
    keyboardTop,
    normalizedSemanticGap: semanticGap,
    rootTarget: newRecipe.targetOffset,
    semanticBottomInWindow,
  },
  invariants: [
    "NATIVE_WILL_BEFORE_RN_FOCUS_BRIDGED",
    "PENDING_TRANSITION_EPHEMERAL_NON_AUTHOR",
    "FOCUS_CONSUMES_MATCHING_TRANSITION_ONCE",
    "STALE_PENDING_TRANSITION_MUTATION_ZERO",
    "SINGLE_ROOT_REVEAL_PRESERVED",
    "SHARED_SEMANTIC_CLEARANCE_NORMALIZED",
    "SPEC_SAVE_NAME_AND_MODE_REGION_REQUIRED",
    "NO_LOCAL_MAGIC_OFFSET",
  ],
  physicalResultInferred: false,
}));
