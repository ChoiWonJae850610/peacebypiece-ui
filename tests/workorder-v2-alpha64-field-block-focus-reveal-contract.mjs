#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { resolveWaflSheetFieldReveal } from "../apps/mobile/domain/waflSheetDetentPolicy.ts";

const read = (file) => fs.readFileSync(file, "utf8");
const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const focus = read("apps/mobile/features/inputs/WaflSheetTextInput.tsx");
const material = read("apps/mobile/features/materials/WorkOrderMaterialEditor.tsx");
const valueField = read("apps/mobile/features/inputs/WaflSheetValueField.tsx");

const alreadyVisible = resolveWaflSheetFieldReveal({
  fieldTop: 260,
  fieldBottom: 340,
  viewportTop: 180,
  viewportBottom: 600,
  keyboardTop: 610,
  semanticGap: 16,
});
assert.deepEqual(alreadyVisible, {
  requiredRise: 0,
  scrollDelta: 0,
  visibleBottom: 584,
  visibleTop: 196,
});

const blockedLowerField = resolveWaflSheetFieldReveal({
  fieldTop: 590,
  fieldBottom: 702,
  viewportTop: 180,
  viewportBottom: 680,
  keyboardTop: 620,
  semanticGap: 16,
  availableForwardScroll: 24,
});
assert.equal(blockedLowerField.requiredRise, 74);
assert.equal(blockedLowerField.scrollDelta, 98);

const oversizedMultilineField = resolveWaflSheetFieldReveal({
  fieldTop: 190,
  fieldBottom: 790,
  viewportTop: 180,
  viewportBottom: 680,
  keyboardTop: 620,
  semanticGap: 16,
});
assert.equal(oversizedMultilineField.requiredRise, 192);
assert.equal(oversizedMultilineField.scrollDelta, -6);

const upperContext = resolveWaflSheetFieldReveal({
  fieldTop: 148,
  fieldBottom: 210,
  viewportTop: 180,
  viewportBottom: 620,
  keyboardTop: 700,
  semanticGap: 16,
});
assert.equal(upperContext.scrollDelta, -48);

assert.match(focus, /export function WaflSheetFocusBlock/u);
assert.match(focus, /const mountedReveal = resolveFocusBlockRef\?\.\(\) \?\? mountedInput/u);
assert.match(focus, /revealRef: mountedReveal/u);
assert.match(sheet, /measureMountedTarget\(target\.revealRef\)/u);
assert.match(sheet, /measureHandleTarget\(target\.revealTarget\)/u);
assert.match(sheet, /resolveWaflSheetVisualRevealPlan/u);
assert.match(sheet, /resolveWaflDirectInputRevealMotion/u);
assert.match(sheet, /bodyOffsetRef\.current \+ motion\.scrollDelta/u);
assert.match(sheet, /animateTo\(motion\.targetOffset/u);
assert.match(material, /<WaflSheetFocusBlock style=\{\[styles\.field/u);
assert.match(valueField, /<WaflSheetFocusBlock style=\{styles\.field\}/u);
assert.doesNotMatch(material, /KeyboardAvoidingView|keyboardVerticalOffset|scrollTo\(/u);

console.log(JSON.stringify({
  contract: "workorder-v2-alpha64-field-block-focus-reveal",
  focusGeometryCases: 4,
  materialPairedEditorShared: true,
  localKeyboardOffsets: 0,
  productionMutation: 0,
}));
