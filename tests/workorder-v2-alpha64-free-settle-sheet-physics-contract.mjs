#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { resolveWaflSheetRelease } from "../apps/mobile/domain/waflSheetDetentPolicy.ts";

const base = {
  maxSettleOffset: 220,
  dismissDistance: 96,
  dismissVelocity: 1.15,
  flickVelocity: 0.45,
  velocityProjectionMs: 72,
  maxVelocityProjection: 88,
};
assert.deepEqual(resolveWaflSheetRelease({ ...base, dragStartOffset: 180, dy: -37, vy: -0.2 }), { kind: "settle", offset: 143 });
assert.deepEqual(resolveWaflSheetRelease({ ...base, dragStartOffset: 80, dy: 29, vy: 0.1 }), { kind: "settle", offset: 109 });
const flick = resolveWaflSheetRelease({ ...base, dragStartOffset: 180, dy: -20, vy: -0.7 });
assert.equal(flick.kind, "settle");
assert.ok(flick.offset > 0 && flick.offset < 160, "flick projection must remain continuous rather than fixed-detent snapping");
assert.deepEqual(resolveWaflSheetRelease({ ...base, dragStartOffset: 12, dy: -80, vy: -0.2 }), { kind: "settle", offset: 0 });
assert.equal(resolveWaflSheetRelease({ ...base, dragStartOffset: 220, dy: 100, vy: 0.2 }).kind, "dismiss");

const sheet = fs.readFileSync("apps/mobile/features/inputs/WaflInputSheet.tsx", "utf8");
for (const owner of ["settledOffsetRef", "maxSettleOffset: mediumOffset", "commitSettled", "settledOffsetRef.current = mediumOffset"]) {
  assert.ok(sheet.includes(owner), `free-settle owner missing ${owner}`);
}
assert.doesNotMatch(sheet, /release\.detent/u);

console.log(JSON.stringify({
  contract: "workorder-v2-alpha64-free-settle-sheet-physics",
  previousPermanentInventoryRetained: 122,
  addedPermanentChecks: 1,
  finalPermanentInventory: 123,
  fixedReleaseDetents: 0,
  openSessionSettledOffsetOwner: 1,
}));
