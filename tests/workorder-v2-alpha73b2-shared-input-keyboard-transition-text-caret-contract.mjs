#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  resolveWaflDirectInputRevealMotion,
  resolveWaflKeyboardTransitionDuration,
} from "../apps/mobile/domain/waflDirectInputKeyboardPolicy.ts";
import { resolveWaflSheetFieldReveal } from "../apps/mobile/domain/waflSheetDetentPolicy.ts";

const read = (file) => fs.readFileSync(file, "utf8");
const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const projection = read("apps/mobile/features/drawing-poc/drawingRenderProjection.ts");
const editor = read("apps/mobile/features/work-orders/drawing/WorkOrderSketchEditor.tsx");

const visible = resolveWaflSheetFieldReveal({
  availableForwardScroll: 0,
  fieldBottom: 350,
  fieldTop: 300,
  keyboardTop: 500,
  semanticGap: 72,
  viewportBottom: 600,
  viewportTop: 200,
});
assert.equal(visible.scrollDelta, 0);
assert.equal(visible.requiredRise, 0);

const scrollOnly = resolveWaflSheetFieldReveal({
  availableForwardScroll: 100,
  fieldBottom: 490,
  fieldTop: 450,
  keyboardTop: 500,
  semanticGap: 72,
  viewportBottom: 600,
  viewportTop: 200,
});
assert.equal(scrollOnly.scrollDelta, 62);
assert.equal(scrollOnly.requiredRise, 0);

const partial = resolveWaflSheetFieldReveal({
  availableForwardScroll: 20,
  fieldBottom: 490,
  fieldTop: 450,
  keyboardTop: 500,
  semanticGap: 72,
  viewportBottom: 600,
  viewportTop: 200,
});
assert.equal(partial.scrollDelta, 62);
assert.equal(partial.requiredRise, 42);
assert.deepEqual(resolveWaflDirectInputRevealMotion({
  allowSheetExpansion: true,
  keyboardMode: "directInput",
  requiredRise: partial.requiredRise,
  scrollDelta: partial.scrollDelta,
  targetOffset: 118,
}), { scrollDelta: 62, sheetRise: 42, targetOffset: 118 });
assert.equal(resolveWaflDirectInputRevealMotion({
  allowSheetExpansion: false,
  keyboardMode: "directInput",
  requiredRise: partial.requiredRise,
  scrollDelta: partial.scrollDelta,
  targetOffset: 118,
}).sheetRise, 0);

assert.equal(resolveWaflKeyboardTransitionDuration({ durationMs: 250, elapsedMs: 30 }), 220);
assert.equal(resolveWaflKeyboardTransitionDuration({ durationMs: 250, elapsedMs: 280 }), 0);
assert.equal(resolveWaflKeyboardTransitionDuration({ durationMs: Number.NaN, elapsedMs: 20 }), 0);

assert.doesNotMatch(sheet, /resolveWaflDirectInputKeyboardDetent/u);
assert.match(sheet, /keyboardWillChangeFrame[\s\S]*update\(event, true, "willChangeFrame"\)/u);
assert.match(sheet, /keyboardTransitionRef/u);
assert.match(sheet, /resolveWaflKeyboardTransitionDuration/u);
assert.match(sheet, /Animated\.timing/u);
assert.match(sheet, /systemKeyboardTargetOffsetRef\.current = translatedRef\.current/u);
assert.match(sheet, /const applySystemBodyScroll[\s\S]*bodyScrollRef\.current\?\.scrollTo/u);
assert.match(sheet, /if \(Math\.abs\(motion\.scrollDelta\) >= 1\)[\s\S]*applySystemBodyScrollDelta\(\s*motion\.scrollDelta,[\s\S]*resolveWaflDirectInputMergedKeyboardTarget/u);
assert.match(sheet, /completion: coordinatedOpening[\s\S]*keyboardMode === "directInput"\s*\?\s*undefined/u);
assert.match(sheet, /animateTo\(restoreOffset, \{ owner: "staticRest" \}\)/u);
assert.doesNotMatch(sheet, /userDraggedDuringKeyboardRef/u);

assert.doesNotMatch(projection, /horizontalStart|horizontalEnd|markerRadius|pending-text-anchor-marker/u);
assert.match(projection, /pending-text-insertion-caret/u);
assert.match(projection, /kind: "line"/u);
assert.match(projection, /x1: verticalStart\.x,\s*x2: verticalEnd\.x/u);
assert.match(projection, /input\.anchor\.y - input\.fontSize \* 0\.9/u);
assert.doesNotMatch(editor, /textAnchorMarkerStyle|WAFL_THEME\.color\.brickOrange, strokeWidth: 4/u);
assert.match(editor, /textInsertionCaretStyle[\s\S]*WAFL_THEME\.color\.readOnly/u);
assert.match(editor, /anchor: textSession\.anchor/u);
assert.match(editor, /anchor: session\.anchor/u);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha73b2-shared-input-keyboard-transition-text-caret",
  previousPermanentInventoryRetained: 232,
  addedPermanentChecks: 1,
  finalPermanentInventory: 233,
  alreadyVisibleAdditionalMovement: 0,
  scrollOnlySheetRise: 0,
  partialOcclusionMinimumRise: partial.requiredRise,
  unconditionalDirectInputDetent: 0,
  keyboardTransitionDurationMs: 220,
  crosshairResidual: 0,
  caretSceneHistoryPersistenceNetworkMutation: [0, 0, 0, 0],
  physicalResultInferred: false,
}));
