#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { resolveWaflSheetFocusExpansion, resolveWaflSheetKeyboardLayout } from "../apps/mobile/domain/waflSheetDetentPolicy.ts";

const layout = resolveWaflSheetKeyboardLayout({ expandedHeight: 793, headerHeight: 76, footerHeight: 48, restingSafeBottom: 34, keyboardInset: 330, sheetOffset: 160, verticalChrome: 16 });
assert.equal(layout.bottomInset, 34);
assert.equal(layout.bodyViewportHeight, 459);
assert.equal(layout.visibleBodyViewportHeight, 129);
assert.equal(layout.keyboardOcclusion, 296);
assert.deepEqual(resolveWaflSheetFocusExpansion({ currentOffset: 180, focusedBottom: 690, keyboardTop: 520, revealContext: 56 }), { requiredRise: 226, targetOffset: 0 });
assert.deepEqual(resolveWaflSheetFocusExpansion({ currentOffset: 180, focusedBottom: 420, keyboardTop: 520, revealContext: 56 }), { requiredRise: 0, targetOffset: 180 });

const sheet = fs.readFileSync("apps/mobile/features/inputs/WaflInputSheet.tsx", "utf8");
for (const owner of ["preKeyboardSettledOffsetRef", "resolveWaflSheetKeyboardRestoreOffset", "userDraggedDuringKeyboardRef", "UIManager.measureInWindow", "resolveWaflSheetVisualRevealPlan", "reveal.targetOffset"]) assert.ok(sheet.includes(owner), `keyboard owner missing ${owner}`);
assert.match(sheet, /paddingBottom: WAFL_THEME\.sheet\.bodyEndGap \+ keyboardInset/u);
assert.match(sheet, /style=\{\{ height: keyboardLayout\.bottomInset \}\}/u);
assert.doesNotMatch(sheet, /Math\.max\(safeBottom, keyboardInset\)/u);

console.log(JSON.stringify({
  contract: "workorder-v2-alpha64-keyboard-focus-sheet-actions",
  previousPermanentInventoryRetained: 123,
  addedPermanentChecks: 1,
  finalPermanentInventory: 124,
  keyboardLiftedSheetActions: 0,
  minimalFocusExpansionOwner: 1,
  manualDragRestoreOverride: 1,
}));
