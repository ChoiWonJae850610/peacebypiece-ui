#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  resolveWaflCoordinatedDirectInputEntrance,
  resolveWaflPreparedDirectInputKeyboardTarget,
} from "../apps/mobile/domain/waflDirectInputKeyboardPolicy.ts";

const read = (file) => fs.readFileSync(file, "utf8");
const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const textInput = read("apps/mobile/features/inputs/WaflSheetTextInput.tsx");
const projection = read("apps/mobile/features/drawing-poc/drawingRenderProjection.ts");

const common = {
  bodyOffset: 0,
  expandedHeight: 760,
  fieldHeight: 80,
  fieldTop: 20,
  footerHeight: 0,
  headerHeight: 80,
  maximumOffset: 200,
  minimumBodyViewportHeight: 112,
  staticRestingOffset: 200,
  safeBottom: 16,
  semanticGap: 72,
  verticalChrome: 16,
};

const compact = resolveWaflPreparedDirectInputKeyboardTarget({
  geometry: {
    ...common,
    bodyContentHeight: 180,
    bodyViewportHeight: 260,
    compactComposition: true,
  },
  keyboardInset: 340,
});
assert.equal(compact.appliedBodyScroll, 0);
assert.equal(compact.compactCompositionBottom, 284);
assert.equal(compact.visibilityFloorTargetOffset, 200);
assert.equal(compact.targetOffset, 160, "Phase 4 reveals the compact semantic target instead of unrelated body composition");

const scrollFirst = resolveWaflPreparedDirectInputKeyboardTarget({
  geometry: {
    ...common,
    bodyContentHeight: 900,
    bodyViewportHeight: 250,
    compactComposition: false,
    fieldHeight: 60,
    fieldTop: 550,
  },
  keyboardInset: 340,
});
assert.equal(scrollFirst.availableForwardScroll, 650);
assert.equal(scrollFirst.appliedBodyScroll, 550);
assert.equal(scrollFirst.targetOffset, 200);

const partialScroll = resolveWaflPreparedDirectInputKeyboardTarget({
  geometry: {
    ...common,
    bodyContentHeight: 700,
    bodyViewportHeight: 250,
    compactComposition: false,
    fieldHeight: 60,
    fieldTop: 550,
  },
  keyboardInset: 340,
});
assert.equal(partialScroll.availableForwardScroll, 450);
assert.equal(partialScroll.appliedBodyScroll, 450);
assert.equal(partialScroll.targetOffset, 100);

assert.deepEqual(resolveWaflCoordinatedDirectInputEntrance({
  directInputTargetCount: 1,
  hasPreparedAutoFocusOwner: true,
  keyboardMode: "directInput",
  preparedLocalGeometryCount: 0,
}), { eligible: true, prepared: false });
assert.deepEqual(resolveWaflCoordinatedDirectInputEntrance({
  directInputTargetCount: 1,
  hasPreparedAutoFocusOwner: true,
  keyboardMode: "directInput",
  preparedLocalGeometryCount: 1,
}), { eligible: true, prepared: true });

assert.match(textInput, /readonly sheetLocalLayout: LayoutRectangle \| null/u);
assert.match(textInput, /rawParentLocalLayoutRef\.current = nextLayout;[\s\S]*normalizeCurrentLayout\("parent-layout"\)/u);
assert.match(textInput, /block\.measureLayout\([\s\S]*publishLayout\(\{ x, y, width, height \}, reason\)/u);
assert.match(textInput, /layoutRef\.current = nextLayout;[\s\S]*for \(const listener of layoutListenersRef\.current\) listener\(\)/u);
assert.match(textInput, /const revealBlock = semanticFocusScope \?\? focusBlock/u);
assert.match(textInput, /const sheetLocalLayout = revealBlock\?\.resolveLayout\(\) \?\? null/u);
assert.match(textInput, /registerEditableTarget\?\.\(\{[\s\S]*?sheetLocalLayout,/u);
assert.match(sheet, /preparedLocalGeometryCount: directInputPreparedGeometryCount/u);
assert.match(sheet, /setDirectInputPreparedGeometryCount\(next\.filter\(\(item\) => item\.sheetLocalLayout !== null\)\.length\)/u);
assert.match(sheet, /preparedDirectInputGeometryRef\.current = snapshot/u);
assert.match(sheet, /capturePreparedDirectInputGeometry\(generation\);[\s\S]*onPreparedForAutoFocus\?\.\(\)/u);

const keyboardHandler = sheet.slice(
  sheet.indexOf('const update = ('),
  sheet.indexOf('const hide = () =>'),
);
assert.match(keyboardHandler, /resolveWaflPreparedDirectInputKeyboardTarget/u);
assert.match(keyboardHandler, /animateToOwnerRef\.current\(plan\.targetOffset/u);
assert.ok(
  keyboardHandler.indexOf("resolveWaflPreparedDirectInputKeyboardTarget")
    < keyboardHandler.indexOf("animateToOwnerRef.current(plan.targetOffset"),
);
const firstTargetSegment = keyboardHandler.slice(
  keyboardHandler.indexOf("resolveWaflPreparedDirectInputKeyboardTarget"),
  keyboardHandler.indexOf("animateToOwnerRef.current(plan.targetOffset"),
);
assert.doesNotMatch(firstTargetSegment, /requestAnimationFrame|measureInWindow|Promise|setTimeout/u);
assert.match(sheet, /coordinatedFirstTargetIdentityRef\.current === focusedIdentity\) return/u);
assert.match(sheet, /keyboardDidShow[\s\S]*finalReconciliation: true/u);
assert.match(sheet, /coordinatedEntrancePhaseRef\.current === "keyboardTransition"[\s\S]*return;[\s\S]*revealFocusedTarget\(\)/u);
assert.match(projection, /pending-text-insertion-caret/u);
assert.doesNotMatch(projection, /pending-text-anchor-marker|horizontalStart|horizontalEnd/u);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha73b5-prepared-local-geometry-sync-target",
  previousPermanentInventoryRetained: 235,
  addedPermanentChecks: 1,
  finalPermanentInventory: 236,
  preparedBeforeFocus: true,
  preparedMeansGeometryComplete: true,
  firstTargetSynchronousInKeyboardEvent: true,
  normalFirstTargetAsyncWindowMeasurement: 0,
  compactCompositionFirstTarget: compact.targetOffset,
  longFormScrollFirstTarget: scrollFirst.targetOffset,
  partialScrollResidualRiseTarget: partialScroll.targetOffset,
  didShowSafetyReconciliationRetained: true,
  physicalResultInferred: false,
}));
