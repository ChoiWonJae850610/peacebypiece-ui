#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  resolveWaflDirectInputMergedKeyboardTarget,
  resolveWaflKeyboardAppearanceRevealIdentity,
  resolveWaflKeyboardAppearanceRootRevealClaim,
  resolveWaflPreparedDirectInputKeyboardTarget,
} from "../apps/mobile/domain/waflDirectInputKeyboardPolicy.ts";

const root = process.cwd();
const read = (relative) => fs.readFileSync(`${root}/${relative}`, "utf8");

const base = {
  bodyOffset: 0,
  expandedHeight: 801,
  explicitSemanticRegion: false,
  footerHeight: 0,
  headerHeight: 48,
  maximumOffset: 523,
  minimumBodyViewportHeight: 120,
  safeBottom: 34,
  semanticGap: 72,
  semanticLayoutAtMs: 1,
  semanticLayoutRevision: 1,
  semanticScopeComplete: true,
  staticRestingOffset: 523,
  verticalChrome: 16,
};

// CASE 1: unrelated compact body remains advisory for an ordinary field.
const ordinary = resolveWaflPreparedDirectInputKeyboardTarget({
  geometry: {
    ...base,
    bodyContentHeight: 520,
    bodyViewportHeight: 520,
    compactComposition: true,
    fieldHeight: 52,
    fieldTop: 24,
    fieldWidth: 320,
    fieldX: 0,
  },
  keyboardInset: 308,
});
assert.equal(ordinary.compactCompositionRequired, false);
assert.equal(ordinary.requiredBottom, ordinary.focusedRequirementBottom);
assert.ok(ordinary.targetOffset > 0, "unrelated compact body must not force full expansion");

// CASE 2: iPhone 393x852 New Recipe evidence. The explicit scope includes
// product/helper/character label and both character-choice buttons.
const newRecipe = resolveWaflPreparedDirectInputKeyboardTarget({
  geometry: {
    ...base,
    bodyContentHeight: 180,
    bodyViewportHeight: 180,
    compactComposition: true,
    explicitSemanticRegion: true,
    fieldHeight: 168,
    fieldTop: 0,
    fieldWidth: 359,
    fieldX: 0,
  },
  keyboardInset: 308,
});
assert.equal(newRecipe.bodyLocalTop, 56);
assert.equal(newRecipe.fieldBottom, 224);
assert.equal(newRecipe.focusedRequirementBottom, 296);
assert.equal(newRecipe.compactCompositionBottom, 270);
assert.equal(newRecipe.requiredBottom, 296);
assert.equal(newRecipe.visibilityFloorTargetOffset, 309);
assert.equal(newRecipe.measuredTargetOffset, 197);
assert.equal(newRecipe.targetOffset, 197);
const windowHeight = 852;
const keyboardTop = windowHeight - 308;
const semanticBottomInWindow = windowHeight - base.expandedHeight
  + newRecipe.targetOffset + newRecipe.semanticContentBottom;
assert.equal(semanticBottomInWindow, 472);
assert.equal(keyboardTop - semanticBottomInWindow, 72);
assert.ok(semanticBottomInWindow + base.semanticGap <= keyboardTop, "choice row + clearance must be visible");

// CASE 3: a real persistent footer remains required independently.
const footer = resolveWaflPreparedDirectInputKeyboardTarget({
  geometry: {
    ...base,
    bodyContentHeight: 180,
    bodyViewportHeight: 180,
    compactComposition: true,
    fieldHeight: 52,
    fieldTop: 24,
    fieldWidth: 320,
    fieldX: 0,
    footerHeight: 56,
  },
  keyboardInset: 308,
});
assert.equal(footer.compactCompositionRequired, true);
assert.equal(footer.requiredBottom, footer.compactCompositionBottom);

// CASE 4/5: the strict semantic target survives floor merge and legal clamp.
assert.equal(resolveWaflDirectInputMergedKeyboardTarget({
  currentOffset: 523,
  floorTargetOffset: 309,
  measuredTargetOffset: newRecipe.targetOffset,
}), 197);
assert.equal(resolveWaflDirectInputMergedKeyboardTarget({
  currentOffset: 523,
  floorTargetOffset: 197,
  measuredTargetOffset: 197,
}), 197);

// CASE 6: duplicate callbacks cannot author a second root for the appearance.
const appearanceIdentity = resolveWaflKeyboardAppearanceRevealIdentity({
  appearanceGeneration: 1,
  focusGeneration: 1,
  keyboardClass: "TEXT",
  layoutGeneration: 1,
  measurementIdentity: "new-recipe:explicit-semantic",
  openGeneration: 1,
});
const first = resolveWaflKeyboardAppearanceRootRevealClaim({
  appearanceIdentity,
  current: { appearanceIdentity: null, rootAuthorCount: 0 },
  requestsRoot: true,
});
assert.equal(first.allowRootAuthor, true);
assert.equal(resolveWaflKeyboardAppearanceRootRevealClaim({
  appearanceIdentity,
  current: first.state,
  requestsRoot: true,
}).allowRootAuthor, false);

// CASE 7/8: warm calculations remain deterministic; small semantic scopes do
// not inherit the New Recipe composition policy.
assert.deepEqual(resolveWaflPreparedDirectInputKeyboardTarget({
  geometry: {
    ...base,
    bodyContentHeight: 180,
    bodyViewportHeight: 180,
    compactComposition: true,
    explicitSemanticRegion: true,
    fieldHeight: 168,
    fieldTop: 0,
    fieldWidth: 359,
    fieldX: 0,
  },
  keyboardInset: 308,
}), newRecipe);
assert.equal(ordinary.explicitSemanticRegion, false);

const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const policy = read("apps/mobile/domain/waflDirectInputKeyboardPolicy.ts");
const create = read("apps/mobile/features/work-orders/create/WorkOrderCreateSheet.tsx");
assert.match(policy, /compactCompositionRequired = geometry\.compactComposition[\s\S]*geometry\.footerHeight > 0/u);
assert.match(sheet, /explicitSemanticRegion: target\.semanticScope/u);
assert.match(sheet, /explicitSemanticPlan[\s\S]*measuredMergedTargetOffset[\s\S]*resolveWaflDirectInputMergedKeyboardTarget/u);
assert.match(sheet, /resultingSemanticBottomInWindow[\s\S]*finalKeyboardClearance/u);
assert.match(create, /<WaflSheetSemanticFocusScope[\s\S]*<WaflSheetValueField[\s\S]*<WorkOrderCharacterChoice[\s\S]*<\/WaflSheetSemanticFocusScope>/u);
assert.doesNotMatch(create, /(keyboardVerticalOffset|setTimeout|hard.?coded)/u);
for (const retiredOwner of ["PanResponder", "wafl-sheet-header-drag-zone", "settledOffsetRef", "preKeyboardSettledOffsetRef"]) {
  assert.doesNotMatch(sheet, new RegExp(retiredOwner, "u"));
}

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha73d-compact-semantic-target-formula-under-reveal",
  checkpoint: "ALPHA73D_COMPACT_SEMANTIC_TARGET_FORMULA_UNDER_REVEAL_IPHONE_REQA_REQUIRED",
  caseCount: 8,
  numericEvidence: {
    bodyContentHeight: 180,
    bodyViewportHeight: 180,
    compactCompositionBottom: newRecipe.compactCompositionBottom,
    expandedHeight: 801,
    finalKeyboardClearance: keyboardTop - semanticBottomInWindow,
    finalRootTranslateY: newRecipe.targetOffset,
    focusedRequirementBottom: newRecipe.focusedRequirementBottom,
    headerHeight: 48,
    keyboardInset: 308,
    keyboardTop,
    measuredTargetOffset: newRecipe.measuredTargetOffset,
    resultingSemanticBottomInWindow: semanticBottomInWindow,
    semanticScope: { x: 0, y: 0, width: 359, height: 168 },
    staticRestingOffset: 523,
    visibilityFloorTargetOffset: newRecipe.visibilityFloorTargetOffset,
    windowHeight,
  },
  invariants: [
    "EXPLICIT_SEMANTIC_REGION_OWNS_REQUIRED_BOTTOM",
    "FOOTERLESS_SEMANTIC_COMPOSITION_SUPPORTED",
    "UNRELATED_COMPACT_BODY_NOT_REQUIRED",
    "NEW_RECIPE_CHOICE_ROW_CLEARANCE",
    "STRICTER_TARGET_SURVIVES_MERGE_AND_CLAMP",
    "SINGLE_ROOT_REVEAL_PRESERVED",
    "NO_LOCAL_MAGIC_OFFSET",
  ],
  physicalResultInferred: false,
}));
