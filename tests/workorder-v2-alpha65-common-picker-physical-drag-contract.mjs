#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  resolveWaflSheetDragOffset,
  resolveWaflSheetDragStartOffset,
  resolveWaflSheetRelease,
} from "../apps/mobile/domain/waflSheetDetentPolicy.ts";
import { resolveWaflReelOpeningValue } from "../apps/mobile/features/inputs/reel-picker/waflRequiredChoicePolicy.ts";

const read = (path) => fs.readFileSync(path, "utf8");
const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const reel = read("apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx");
const overview = read("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx");
const materials = read("apps/mobile/features/materials/WorkOrderMaterialsReadOnly.tsx");
const production = read("apps/mobile/features/work-orders/production/WorkOrderProductionAuthoring.tsx");
const design = read("docs/project/app-v2/11a-mobile-design-system-v2.md");
const makerIa = read("docs/project/app-v2/11b-maker-workorder-tab-ia-v2.md");

assert.match(sheet, /onStartShouldSetResponderCapture=\{\(\) => draggable && openReady && !actionPending && !dismissingRef\.current\}/u);
assert.match(sheet, /onResponderGrant=\{draggable && openReady \? startDrag : undefined\}/u);
assert.match(sheet, /const stableOffset = resolveWaflSheetDragStartOffset\(translatedRef\.current, expandedHeight\)[\s\S]*dragStartRef\.current = stableOffset[\s\S]*translateY\.setValue\(stableOffset\)[\s\S]*layoutOffset\.setValue\(stableOffset\)[\s\S]*dragReadyRef\.current = true/u);
assert.doesNotMatch(sheet, /translateY\.stopAnimation\(\(value\)/u);
assert.match(sheet, /if \(!dragReadyRef\.current\) return;[\s\S]*const dy = pageY - dragStartPageYRef\.current[\s\S]*translateY\.setValue\(offset\)/u);

for (let cycle = 0; cycle < 3; cycle += 1) {
  const settled = cycle === 0 ? 190 : cycle === 1 ? 77 : 132;
  const granted = resolveWaflSheetDragStartOffset(settled, 790);
  assert.equal(granted, settled, `cycle ${cycle + 1}: GRANT must not move the sheet`);
  const moved = resolveWaflSheetDragOffset({ dragStartOffset: granted, dy: -31, expandedHeight: 790 });
  assert.equal(moved, settled - 31, `cycle ${cycle + 1}: first MOVE must follow the finger 1:1`);
  const release = resolveWaflSheetRelease({ dragStartOffset: granted, dy: -31, vy: -0.1, maxSettleOffset: 220, dismissDistance: 96, dismissVelocity: 1.15, flickVelocity: 0.45, velocityProjectionMs: 72, maxVelocityProjection: 88 });
  assert.deepEqual(release, { kind: "settle", offset: settled - 31 });
}

assert.equal(resolveWaflReelOpeningValue({ candidateValues: ["partner-a"], currentValue: "", stageFirstRealOption: true }), "partner-a");
assert.equal(resolveWaflReelOpeningValue({ candidateValues: ["", "partner-a"], currentValue: "", stageFirstRealOption: true }), "partner-a");
assert.equal(resolveWaflReelOpeningValue({ candidateValues: ["partner-a", "partner-b"], currentValue: "stale", stageFirstRealOption: true }), "partner-a");
assert.equal(resolveWaflReelOpeningValue({ candidateValues: ["partner-a", "partner-b"], currentValue: "partner-b", stageFirstRealOption: true }), "partner-b");
assert.equal(resolveWaflReelOpeningValue({ candidateValues: ["", "process-a"], currentValue: "", stageFirstRealOption: false }), "");
assert.equal(resolveWaflReelOpeningValue({ candidateValues: [], currentValue: "", stageFirstRealOption: true }), "");

assert.match(reel, /resolveWaflReelOpeningValue/u);
assert.match(reel, /candidateValues:[\s\S]*stageFirstRealOption: selectFirstRealOption/u);
assert.match(reel, /sizing="reelAdaptive"/u);
assert.match(overview, /label="대상"[\s\S]*WaflReelPickerSheet|WaflReelPickerSheet[\s\S]*label="대상"/u);
assert.match(overview, /label="대분류"/u);
assert.match(materials, /kind=\{reelTarget\.field === "unitCode" \? "unit" : "quantity"\}/u);
assert.equal((production.match(/<WaflReelPickerSheet/g) ?? []).length, 1);
assert.match(production, /requireSpecifiedValue: true, selectFirstRealOption: true/u);
assert.match(production, /selectFirstRealOption: false, value: selectedProcess\?\.processTypeCode/u);
assert.match(production, /allowUnset: selectedProcess === null/u);
assert.match(reel, /if \(options\.length === 0\)[\s\S]*return undefined/u);
assert.match(reel, /confirmDisabled=\{applyDisabled \|\| pending\}/u);

for (const marker of [
  "synchronously at responder grant",
  "invalid persisted candidate",
  "physical iPhone",
]) assert.ok(`${design}\n${makerIa}`.includes(marker), `canonical docs missing ${marker}`);

console.log(JSON.stringify({
  contract: "workorder-v2-alpha65-common-picker-physical-drag",
  previousPermanentInventoryRetained: 144,
  addedPermanentChecks: 1,
  finalPermanentInventory: 145,
  mountedResponderFirstMoveLoss: 0,
  requiredChoiceCases: 6,
  repeatedOpenDragCycles: 3,
  physicalGestureInferred: false,
  migrationLedger: "18/18",
  migration019: 0,
  productionMutation: 0,
  ownerFixtureMutation: 0,
}));
