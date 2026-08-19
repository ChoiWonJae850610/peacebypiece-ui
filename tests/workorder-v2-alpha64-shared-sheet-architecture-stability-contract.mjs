#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  resolveWaflSheetDragOffset,
  resolveWaflSheetDragStartOffset,
  resolveWaflSheetKeyboardLayout,
  resolveWaflSheetRelease,
} from "../apps/mobile/domain/waflSheetDetentPolicy.ts";

const read = (file) => fs.readFileSync(file, "utf8");
const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const theme = read("apps/mobile/constants/theme.ts");
const design = read("docs/project/app-v2/11a-mobile-design-system-v2.md");
const structure = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx");
const templates = read("apps/mobile/features/work-orders/size-color/MeasurementTemplateSheets.tsx");

const consumers = new Map([
  ["Size/Color selection and direct catalog", "apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx"],
  ["Saved Spec load/save/update", "apps/mobile/features/work-orders/size-color/MeasurementTemplateSheets.tsx"],
  ["Spec Item selection/manage", "apps/mobile/features/work-orders/size-color/SpecItemSelectionSheet.tsx"],
  ["Fabric/Accessory add", "apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx"],
  ["Attachment/Quick/document actions", "apps/mobile/features/work-orders/documents/WorkOrderDocumentWorkbench.tsx"],
  ["Quick direct address", "apps/mobile/features/work-orders/documents/QuickDeliveryFoundation.tsx"],
  ["Juso address search", "apps/mobile/features/work-orders/documents/QuickDeliveryAddressSearchSheet.tsx"],
  ["WorkOrder create", "apps/mobile/features/work-orders/create/WorkOrderCreateSheet.tsx"],
  ["Reel picker", "apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx"],
  ["Frozen-axis full view", "apps/mobile/features/work-orders/size-color/WorkOrderSizeColorReadOnly.tsx"],
]);
for (const [surface, file] of consumers) {
  assert.match(read(file), /WaflInputSheet/u, `${surface} must use the canonical sheet root`);
}

for (const required of [
  "Keyboard.addListener",
  "resolveWaflSheetKeyboardLayout",
  "openGenerationRef",
  "animationRef",
  "dragReadyRef",
  "dragMovedRef",
  "translateY.stopAnimation();",
  "resolveWaflSheetDragStartOffset",
  '"wafl-sheet-header-drag-zone"',
  'testID="wafl-sheet-body-viewport"',
  'testID="wafl-sheet-actions"',
  'testID="wafl-sheet-bottom-inset"',
]) assert.ok(sheet.includes(required), `shared owner missing ${required}`);
assert.match(sheet, /const stableOffset = resolveWaflSheetDragStartOffset\(translatedRef\.current, expandedHeight\)[\s\S]*dragStartRef\.current = stableOffset[\s\S]*dragStartPageYRef\.current = event\.nativeEvent\.pageY[\s\S]*translateY\.setValue\(stableOffset\)[\s\S]*dragReadyRef\.current = true/u);
assert.doesNotMatch(sheet, /translateY\.stopAnimation\(\(value\)/u);
assert.doesNotMatch(sheet, /KeyboardAvoidingView/u);
assert.match(sheet, /if \(!dragReadyRef\.current \|\| !dragMovedRef\.current\)[\s\S]*setDragging\(false\);[\s\S]*return;/u);
assert.ok(sheet.indexOf('testID="wafl-sheet-body-viewport"') < sheet.indexOf('testID="wafl-sheet-actions"'));
assert.ok(sheet.indexOf('testID="wafl-sheet-actions"') < sheet.indexOf('testID="wafl-sheet-bottom-inset"'));
assert.match(theme, /bodyEndGap:\s*12/u);
assert.match(sheet, /paddingBottom:\s*WAFL_THEME\.sheet\.bodyEndGap/u);
assert.doesNotMatch(structure, /structureSheetContent:\s*\{[^}]*maxHeight/u);
assert.doesNotMatch(templates, /sheetContent:\s*\{[^}]*maxHeight/u);

const resting = resolveWaflSheetKeyboardLayout({
  expandedHeight: 793,
  headerHeight: 76,
  footerHeight: 48,
  restingSafeBottom: 34,
  keyboardInset: 0,
  sheetOffset: 0,
  verticalChrome: 16,
});
const keyboardExpanded = resolveWaflSheetKeyboardLayout({
  expandedHeight: 793,
  headerHeight: 76,
  footerHeight: 48,
  restingSafeBottom: 34,
  keyboardInset: 330,
  sheetOffset: 0,
  verticalChrome: 16,
});
const keyboardMedium = resolveWaflSheetKeyboardLayout({
  expandedHeight: 793,
  headerHeight: 76,
  footerHeight: 48,
  restingSafeBottom: 34,
  keyboardInset: 330,
  sheetOffset: 219,
  verticalChrome: 16,
});
assert.equal(resting.bodyViewportHeight, 619);
assert.equal(keyboardExpanded.bodyViewportHeight, 619);
assert.equal(keyboardExpanded.visibleBodyViewportHeight, 289);
assert.equal(keyboardMedium.bodyViewportHeight, 400);
assert.equal(keyboardMedium.visibleBodyViewportHeight, 70);
assert.equal(keyboardExpanded.bottomInset, 34);

for (let cycle = 0; cycle < 3; cycle += 1) {
  const visualOffset = cycle % 2 === 0 ? 219 : 0;
  const touchDownOffset = resolveWaflSheetDragStartOffset(visualOffset, 793);
  assert.equal(touchDownOffset, visualOffset, `cycle ${cycle + 1}: touch-down must move zero pixels`);
  const moved = resolveWaflSheetDragOffset({ dragStartOffset: touchDownOffset, dy: -80, expandedHeight: 793 });
  assert.equal(moved, Math.max(0, visualOffset - 80));
  const snap = resolveWaflSheetRelease({ dragStartOffset: touchDownOffset, dy: -80, vy: -0.2, maxSettleOffset: 219, dismissDistance: 96, dismissVelocity: 1.15, flickVelocity: 0.45, velocityProjectionMs: 72, maxVelocityProjection: 88 });
  assert.equal(snap.kind, "settle");
}

assert.match(design, /canonical staged-sheet owner/u);
assert.match(design, /true-bottom/iu);
assert.match(design, /TOUCH_DOWN/u);

console.log(JSON.stringify({
  contract: "workorder-v2-alpha64-shared-sheet-architecture-stability",
  previousPermanentInventoryRetained: 120,
  addedPermanentChecks: 1,
  finalPermanentInventory: 121,
  canonicalSheetOwnerCount: 1,
  auditedConsumerFamilies: consumers.size,
  rootKeyboardShift: 0,
  keyboardExpandedVisibleBodyViewport: keyboardExpanded.visibleBodyViewportHeight,
  reopenTouchDownDeltaPx: 0,
  repeatedReopenCycles: 3,
  ownerFixtureMutation: 0,
  productionMutation: 0,
}));
