#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { resolveWaflDirectInputFinalReconciliation } from "../apps/mobile/domain/waflDirectInputKeyboardPolicy.ts";

const classify = (overrides = {}) => resolveWaflDirectInputFinalReconciliation({
  compactCompositionGap: 8,
  coordinatedFirstTarget: true,
  microSettlingTolerance: 8,
  minimumVisibleFieldGap: 0,
  rawSheetRise: 0,
  semanticFieldGap: 12,
  ...overrides,
});

const clear = classify();
assert.equal(clear.classification, "CLEAR");
assert.equal(clear.sheetRise, 0);
assert.equal(clear.firstTargetMiss, false);

const newRecipeSettling = classify({ rawSheetRise: 5, semanticFieldGap: 5, compactCompositionGap: 3 });
assert.equal(newRecipeSettling.classification, "MICRO_SETTLING");
assert.equal(newRecipeSettling.withinMicroSettlingTolerance, true);
assert.equal(newRecipeSettling.sheetRise, 0);
assert.equal(newRecipeSettling.firstTargetMiss, false);

const sketchTextSettling = classify({ rawSheetRise: 8, semanticFieldGap: 1, compactCompositionGap: 0 });
assert.equal(sketchTextSettling.classification, "MICRO_SETTLING");
assert.equal(sketchTextSettling.withinMicroSettlingTolerance, true);
assert.equal(sketchTextSettling.sheetRise, 0);

// Raw layout disagreement cannot override semantic visibility. This remains
// non-animated evidence rather than a false REAL_OCCLUSION classification.
const visibleLayoutDelta = classify({ rawSheetRise: 12, semanticFieldGap: 2, compactCompositionGap: 1 });
assert.equal(visibleLayoutDelta.classification, "MICRO_SETTLING");
assert.equal(visibleLayoutDelta.withinMicroSettlingTolerance, false);
assert.equal(visibleLayoutDelta.sheetRise, 0);

const fieldOcclusion = classify({ rawSheetRise: 13, semanticFieldGap: -1 });
assert.equal(fieldOcclusion.classification, "REAL_OCCLUSION");
assert.equal(fieldOcclusion.sheetRise, 13);
assert.equal(fieldOcclusion.firstTargetMiss, true);

const actionOcclusion = classify({ compactCompositionGap: -2, rawSheetRise: 0, semanticFieldGap: 6 });
assert.equal(actionOcclusion.classification, "REAL_OCCLUSION");
assert.equal(actionOcclusion.sheetRise, 2);
assert.equal(actionOcclusion.firstTargetMiss, true);

const lowerFieldAfterBoundedScroll = classify({
  compactCompositionGap: null,
  coordinatedFirstTarget: false,
  rawSheetRise: 18,
  semanticFieldGap: -18,
});
assert.equal(lowerFieldAfterBoundedScroll.classification, "REAL_OCCLUSION");
assert.equal(lowerFieldAfterBoundedScroll.sheetRise, 18);
assert.equal(lowerFieldAfterBoundedScroll.firstTargetMiss, false);

const sheet = fs.readFileSync("apps/mobile/features/inputs/WaflInputSheet.tsx", "utf8");
assert.match(sheet, /resolveWaflDirectInputFinalReconciliation\(\{/u);
assert.match(sheet, /microSettlingTolerance: WAFL_THEME\.spacing\.sm/u);
assert.match(sheet, /minimumVisibleFieldGap: 0/u);
assert.match(sheet, /compactCompositionGap[\s\S]*footer\.y[\s\S]*safeBottom/u);
assert.match(sheet, /animationOwner: rootAuthorAllowed \? "sheet-spring" : "none"/u);
assert.match(sheet, /sheetCorrection: rootAuthorAllowed \? reconciliationSheetRise : 0/u);
assert.match(sheet, /firstTargetMiss: reconciliation\.firstTargetMiss/u);
assert.match(sheet, /options\?\.finalReconciliation === true[\s\S]*reconciliation\.sheetRise === 0[\s\S]*\? currentOffset/u);

const hideSegment = sheet.slice(sheet.indexOf("const hide = (nativeEvent:"), sheet.indexOf("const change = Keyboard.addListener"));
assert.match(hideSegment, /cancelAnimationFrame\(didShowReconciliationFrameRef\.current\)/u);
assert.match(hideSegment, /pendingDidShowReconciliationRef\.current = null/u);

const closeSegment = sheet.slice(sheet.indexOf("const prepareSheetClose"), sheet.indexOf("const beginSheetClose"));
assert.match(closeSegment, /cancelAnimationFrame\(didShowReconciliationFrameRef\.current\)/u);
assert.match(closeSegment, /pendingDidShowReconciliationRef\.current = null/u);

const keyboardHandler = sheet.slice(
  sheet.indexOf('const update = ('),
  sheet.indexOf('const hide = () =>'),
);
assert.match(keyboardHandler, /resolveWaflPreparedDirectInputKeyboardTarget/u);
assert.match(keyboardHandler, /animateToOwnerRef\.current\(plan\.targetOffset/u);
assert.doesNotMatch(
  keyboardHandler.slice(
    keyboardHandler.indexOf("resolveWaflPreparedDirectInputKeyboardTarget"),
    keyboardHandler.indexOf("animateToOwnerRef.current(plan.targetOffset"),
  ),
  /requestAnimationFrame|measureInWindow|Promise|setTimeout/u,
);

const projection = fs.readFileSync("apps/mobile/features/drawing-poc/drawingRenderProjection.ts", "utf8");
assert.match(projection, /pending-text-insertion-caret/u);
assert.doesNotMatch(projection, /pending-text-anchor-marker|horizontalStart|horizontalEnd/u);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha73b6-didshow-micro-reconciliation",
  previousPermanentInventoryRetained: 236,
  addedPermanentChecks: 1,
  finalPermanentInventory: 237,
  oldTolerance: 4,
  boundedSettlingToken: 8,
  sourceEquivalentObservedDelta: "5-8",
  normalDidShowSheetRise: 0,
  realOcclusionCorrectionRetained: true,
  hideCloseStaleReconciliation: 0,
  caretRegressionRetained: true,
  physicalResultInferred: false,
}));
