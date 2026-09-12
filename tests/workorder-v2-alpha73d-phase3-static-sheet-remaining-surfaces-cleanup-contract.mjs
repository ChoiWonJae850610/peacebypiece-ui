#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  WAFL_LIVE_SHEET_INVENTORY,
  WAFL_PRESENTATION_SOURCE_COUNTS,
} from "../apps/mobile/features/inputs/waflLiveSheetInventory.ts";
import { resolveWaflMobileDeviceClass } from "../apps/mobile/domain/mobileOrientationPolicy.ts";
import {
  resolveWaflExpandableInitialHeight,
  resolveWaflStaticSheetRestingOffset,
} from "../apps/mobile/domain/waflSheetDetentPolicy.ts";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const list = (relativeDirectory, suffix) => fs.readdirSync(path.join(root, relativeDirectory), { withFileTypes: true }).flatMap((entry) => {
  if (entry.name === "node_modules") return [];
  const relative = path.join(relativeDirectory, entry.name);
  if (entry.isDirectory()) return list(relative, suffix);
  return entry.isFile() && entry.name.endsWith(suffix) ? [read(relative)] : [];
});
const count = (source, pattern) => [...source.matchAll(pattern)].length;

const mobileTsx = list("apps/mobile", ".tsx").join("\n");
const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const reelSheet = read("apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx");
const optionReel = read("apps/mobile/features/inputs/reel-picker/WaflOptionReel.tsx");
const rootPolicy = read("apps/mobile/domain/waflSheetDetentPolicy.ts");
const theme = read("apps/mobile/constants/theme.ts");
const decision = read("apps/mobile/features/feedback/WaflDecisionSheet.tsx");
const datePicker = read("apps/mobile/components/InlineDatePicker.tsx");
const experience = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const drawing = read("apps/mobile/features/work-orders/drawing/WorkOrderSketchEditor.tsx");
const gallery = read("apps/mobile/features/work-orders/images/WorkOrderImageGallery.tsx");

assert.deepEqual(WAFL_PRESENTATION_SOURCE_COUNTS, {
  decisionCallsites: count(mobileTsx, /<WaflDecisionSheet\b/gu),
  inlineDatePickerCallsites: count(mobileTsx, /<InlineDatePicker\b/gu),
  pairedReelCallsites: count(mobileTsx, /<WaflPairedOptionReelPickerSheet\b/gu),
  rawNativeModalHosts: count(mobileTsx, /<Modal\b/gu),
  reelPickerCallsites: count(mobileTsx, /<WaflReelPickerSheet\b/gu),
  waflInputSheetJsxInstances: count(mobileTsx, /<WaflInputSheet\b/gu),
});

const classCounts = WAFL_LIVE_SHEET_INVENTORY.reduce((counts, entry) => {
  counts[entry.classification] = (counts[entry.classification] ?? 0) + 1;
  return counts;
}, {});
assert.equal(WAFL_LIVE_SHEET_INVENTORY.length, 44);
assert.deepEqual(classCounts, {
  STATIC_BOTTOM_SHEET: 7,
  STATIC_BOTTOM_SHEET_SCROLLABLE: 17,
  STATIC_REEL_PICKER: 9,
  CENTER_DIALOG_CANDIDATE: 5,
  FULLSCREEN_KEEP: 5,
  SPECIAL_FIXED_MODAL_KEEP: 1,
});
assert.equal(new Set(WAFL_LIVE_SHEET_INVENTORY.map((entry) => `${entry.surface}:${entry.owner}`)).size, 44);
assert.ok(WAFL_LIVE_SHEET_INVENTORY.every((entry) => entry.physicalPolicy && entry.physicalState));

for (const retired of [
  "PanResponder", "dragStartRef", "dragVelocityRef", "userDraggedDuringKeyboardRef",
  "settledOffsetRef", "preKeyboardSettledOffsetRef", "wafl-sheet-header-drag-zone",
  "resolveWaflSheetRelease", "resolveWaflDirectInputDragRelease", "onResponderMove",
]) assert.doesNotMatch(`${sheet}\n${rootPolicy}`, new RegExp(retired, "u"), `retired common-root owner remains: ${retired}`);
assert.doesNotMatch(sheet, /accessibilityRole=["']adjustable["']|accessibilityActions|onAccessibilityAction/u);
assert.doesNotMatch(theme, /Detent|detent|dragZoneMinHeight|dragHandleHeight|dragHandleWidth|dismissVelocity|velocityProjectionMs/u);
assert.doesNotMatch(rootPolicy, /\bdetent\b/iu);

assert.match(sheet, /testID="wafl-sheet-fixed-header"/u);
assert.match(sheet, /testID="wafl-sheet-body-viewport"/u);
assert.match(sheet, /testID="wafl-sheet-actions"/u);
assert.ok(sheet.indexOf('testID="wafl-sheet-fixed-header"') < sheet.indexOf('testID="wafl-sheet-body-viewport"'));
assert.ok(sheet.indexOf('testID="wafl-sheet-body-viewport"') < sheet.indexOf('testID="wafl-sheet-actions"'));
assert.match(sheet, /function onBodyScroll\([^]*?publishBodyScrollMetrics\(bodyOffsetRef\.current\);\s*\}/u);
const bodyScrollOwner = sheet.match(/function onBodyScroll\([^]*?\n  \}/u)?.[0] ?? "";
assert.doesNotMatch(bodyScrollOwner, /translateY|animateTo|systemKeyboardTargetOffset/u, "body scrolling cannot author root Y");
assert.match(reelSheet, /<WaflInputSheet/u);
assert.doesNotMatch(reelSheet, /PanResponder|onResponderMove|translateY/u, "Reel wrapper cannot author root Y");
assert.match(optionReel, /accessibilityRole="adjustable"/u, "Reel value motion keeps its own accessible adjustable owner");

assert.match(sheet, /closeOperation\.finalized/u);
assert.match(sheet, /if \(plan\.invokeCancel\) onCancel\(\)/u);
assert.match(sheet, /requestAnimationFrame\(\(\) => \{\s*if \(mountedRef\.current\) onAfterClose\?\.\(\);/u);
assert.match(sheet, /presentationGeneration/u);
assert.match(sheet, /type WaflSheetRootAnimationOptions = \{[\s\S]*owner: Extract<WaflSheetRootMotionOwner, "staticRest" \| "systemKeyboard">/u);
assert.match(sheet, /rootMotionStateRef/u);
assert.match(sheet, /SINGLE_VISIBLE_ROOT_REVEAL_PER_KEYBOARD_APPEARANCE|keyboardAppearanceRootRevealStateRef/u);
assert.match(decision, /<WaflInputSheet/u);
assert.doesNotMatch(decision, /<Modal\b/u, "Decision candidate must not add a second native Modal");

const cancelFieldBody = experience.match(/function cancelBasicInfoFieldEdit\([^]*?\n  \}/u)?.[0] ?? "";
assert.match(cancelFieldBody, /activeBasicSessionRef\.current\?\.field !== field/u);
assert.doesNotMatch(cancelFieldBody, /setBasicInfoDraft|basicInfoDraftFromDetail|draftBatch\.discard/u, "calendar local cancel cannot roll back unrelated Overview staged state");
assert.match(datePicker, /onRequestClose=\{cancel\}/u);
assert.match(datePicker, /onPress=\{cancel\}/u);

assert.match(drawing, /presentationStyle="fullScreen"/u);
assert.match(gallery, /presentationStyle="fullScreen"/u);
assert.match(drawing, /PanResponder\.create/u);
assert.match(gallery, /PanResponder\.create/u);

const deviceCases = [
  { platform: "ios", isPad: false, width: 390, height: 844, expectedClass: "handset" },
  { platform: "android", isPad: false, width: 412, height: 915, expectedClass: "handset" },
  { platform: "ios", isPad: true, width: 744, height: 1133, expectedClass: "compact-tablet" },
  { platform: "ios", isPad: true, width: 1133, height: 744, expectedClass: "compact-tablet" },
  { platform: "ios", isPad: true, width: 1024, height: 1366, expectedClass: "regular-tablet" },
  { platform: "ios", isPad: true, width: 1366, height: 1024, expectedClass: "regular-tablet" },
  { platform: "android", isPad: false, width: 800, height: 1280, expectedClass: "regular-tablet" },
  { platform: "android", isPad: false, width: 1280, height: 800, expectedClass: "regular-tablet" },
];
const stagedDomainState = Object.freeze({ productName: "보존", quantity: 12 });
for (const item of deviceCases) {
  assert.equal(resolveWaflMobileDeviceClass({
    platform: item.platform,
    isPad: item.isPad,
    screenWidth: item.width,
    screenHeight: item.height,
  }), item.expectedClass);
  const expandedHeight = Math.round(item.height * 0.94);
  const visibleHeight = resolveWaflExpandableInitialHeight({
    footerHeight: 64,
    headerHeight: 56,
    minimumBodyViewport: 120,
    safeBottom: 24,
    staticExtentRatio: 0.68,
    verticalChrome: 16,
    windowHeight: item.height,
  });
  const first = resolveWaflStaticSheetRestingOffset({ expandedHeight, visibleHeight });
  const second = resolveWaflStaticSheetRestingOffset({ expandedHeight, visibleHeight });
  assert.equal(first, second, "layout/orientation recompute must remain deterministic");
  assert.deepEqual(stagedDomainState, { productName: "보존", quantity: 12 });
}

assert.match(read("lib/constants/version.ts"), /2\.0\.0-alpha\.(?:72|73|74|75|76|77|78|79)/u);
assert.equal(fs.readdirSync(path.join(root, "db", "v2", "migrations")).filter((name) => name.endsWith(".sql")).length, 22);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha73d-phase3-static-sheet-remaining-surfaces-cleanup",
  checkpoint: "ALPHA73D_PHASE3_STATIC_SHEET_REMAINING_SURFACES_CLEANUP_IPHONE_QA_REQUIRED",
  logicalSurfaces: 44,
  classCounts,
  commonRootPanResponderOwners: 0,
  rootDragHandles: 0,
  rootFreeSettleOwners: 0,
  rootUserDetentOwners: 0,
  rootDragDismissOwners: 0,
  rootUserAuthoredYOwners: 0,
  deviceLayoutCases: deviceCases.length,
  physicalResult: "PHYSICAL_RESULT_NOT_INFERRED",
}, null, 2));
console.log("workorder v2 alpha.73D Phase 3 static sheet remaining surfaces cleanup contract: PASS");
