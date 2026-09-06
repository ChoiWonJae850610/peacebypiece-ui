#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  resolveWaflSheetOpeningOffset,
  resolveWaflStaticSheetRestingOffset,
} from "../apps/mobile/domain/waflSheetDetentPolicy.ts";

assert.equal(resolveWaflSheetOpeningOffset(700), 700);
assert.equal(resolveWaflStaticSheetRestingOffset({ expandedHeight: 700, visibleHeight: 510 }), 190);
assert.equal(resolveWaflStaticSheetRestingOffset({ expandedHeight: 700, visibleHeight: 900 }), 0);

const sheet = fs.readFileSync("apps/mobile/features/inputs/WaflInputSheet.tsx", "utf8");
const policy = fs.readFileSync("apps/mobile/domain/waflSheetDetentPolicy.ts", "utf8");
for (const retired of ["resolveWaflSheetRelease", "resolveWaflSheetDragStartOffset", "resolveWaflSheetDragOffset", "dragStartRef", "dragVelocityRef", "wafl-sheet-header-drag-zone"]) {
  assert.doesNotMatch(`${sheet}\n${policy}`, new RegExp(retired, "u"));
}
assert.match(sheet, /const mediumOffset = [\s\S]*resolveWaflStaticSheetRestingOffset/u, "derived static rest remains the keyboard restore authority");
assert.doesNotMatch(sheet, /settledOffsetRef|preKeyboardSettledOffsetRef/u);
assert.match(sheet, /testID="wafl-sheet-fixed-header"/u);

console.log(JSON.stringify({
  contract: "workorder-v2-alpha64-free-settle-sheet-physics",
  previousPermanentInventoryRetained: 122,
  addedPermanentChecks: 1,
  finalPermanentInventory: 123,
  previousSafetyIntent: "superseded-by-static-root",
  userRootMotionOwners: 0,
  derivedStaticRestingOwner: 1,
}));
