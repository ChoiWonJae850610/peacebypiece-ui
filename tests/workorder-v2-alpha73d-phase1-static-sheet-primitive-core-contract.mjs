#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  resolveWaflSheetOpeningOffset,
  resolveWaflStaticSheetRestingOffset,
} from "../apps/mobile/domain/waflSheetDetentPolicy.ts";
import { resolveWaflSheetKeyboardRestoreOffset } from "../apps/mobile/domain/waflSheetKeyboardRestorePolicy.ts";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const rootPolicy = read("apps/mobile/domain/waflSheetDetentPolicy.ts");
const directPolicy = read("apps/mobile/domain/waflDirectInputKeyboardPolicy.ts");
const theme = read("apps/mobile/constants/theme.ts");
const reel = read("apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx");
const inventory = read("apps/mobile/features/inputs/waflLiveSheetInventory.ts");

for (const retired of [
  "resolveWaflSheetDragStartOffset",
  "resolveWaflSheetDragOffset",
  "resolveWaflSheetRelease",
  "shouldCaptureWaflSheetHeaderDrag",
  "shouldCaptureWaflSheetDrag",
  "dragStartRef",
  "dragVelocityRef",
  "userDraggedDuringKeyboardRef",
  "wafl-sheet-header-drag-zone",
  "resolveWaflDirectInputDragRelease",
]) assert.doesNotMatch(`${sheet}\n${rootPolicy}\n${directPolicy}`, new RegExp(retired, "u"), `retired root owner remains: ${retired}`);

for (const retiredThemeToken of [
  "dismissDistance",
  "dismissVelocity",
  "flickVelocity",
  "velocityProjectionMs",
  "maxVelocityProjection",
  "dragZoneMinHeight",
  "dragHandleHeight",
  "dragHandleWidth",
]) assert.doesNotMatch(theme, new RegExp(retiredThemeToken, "u"), `dead drag token remains: ${retiredThemeToken}`);

assert.match(sheet, /accessibilityRole="header"/u);
assert.match(sheet, /testID="wafl-sheet-fixed-header"/u);
assert.doesNotMatch(sheet, /accessibilityRole=.*adjustable|styles\.handle|onResponderGrant|onResponderMove|onResponderRelease/u);
assert.match(sheet, /resolveWaflStaticSheetRestingOffset/u);
assert.match(sheet, /resolveWaflSheetOpeningOffset\(expandedHeight\)/u);
assert.match(sheet, /Keyboard\.addListener/u);
assert.match(sheet, /resolveWaflSheetFocusRevealRestore/u);
assert.match(sheet, /animateDown\(\(\) =>/u);
assert.ok(sheet.indexOf("animateDown(() =>") < sheet.indexOf("setRendered(false)"), "close animation stays mounted until completion");
assert.match(sheet, /scrollEnabled=\{contentFit\.overflow \|\| keyboardInset > 0\}/u);
assert.match(sheet, /scrollEnabled\s*\n/u, "scrollable bodies stay enabled independently of root motion");

assert.equal(resolveWaflSheetOpeningOffset(724), 724);
assert.equal(resolveWaflStaticSheetRestingOffset({ expandedHeight: 724, visibleHeight: 480 }), 244);
assert.equal(resolveWaflStaticSheetRestingOffset({ expandedHeight: 724, visibleHeight: 900 }), 0);
assert.equal(resolveWaflSheetKeyboardRestoreOffset(244), 244);

assert.match(reel, /<WaflInputSheet/u);
assert.match(reel, /sizing="reelAdaptive"/u);
assert.doesNotMatch(reel, /onResponderGrant|resolveWaflSheetDrag/u, "reel movement cannot move the root sheet");
for (const classification of [
  "STATIC_BOTTOM_SHEET",
  "STATIC_BOTTOM_SHEET_SCROLLABLE",
  "STATIC_REEL_PICKER",
  "CENTER_DIALOG_CANDIDATE",
  "FULLSCREEN_KEEP",
  "SPECIAL_FIXED_MODAL_KEEP",
]) assert.match(inventory, new RegExp(`\\b${classification}\\b`, "u"));
assert.doesNotMatch(inventory, /A_DRAGGABLE_FREE_SETTLE|canonical header follows the finger/u);

assert.equal(fs.readdirSync(path.join(root, "db", "v2", "migrations")).filter((name) => name.endsWith(".sql")).length, 22);
assert.match(read("lib/constants/version.ts"), /2\.0\.0-alpha\.(?:72|73)/u);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha73d-phase1-static-sheet-primitive-core",
  checkpoint: "ALPHA73D_PHASE1_STATIC_SHEET_PRIMITIVE_CORE_IPHONE_QA_REQUIRED",
  commonRootDragOwners: 0,
  rootGeometry: "derived-system-only",
  reelRootDragOwners: 0,
  physicalResultInferred: false,
}));
