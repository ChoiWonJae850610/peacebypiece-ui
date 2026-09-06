#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { WAFL_HISTORICAL_SHEET_REFERENCES, WAFL_LIVE_SHEET_INVENTORY, WAFL_PRESENTATION_SOURCE_COUNTS } from "../apps/mobile/features/inputs/waflLiveSheetInventory.ts";

const read = (path) => fs.readFileSync(path, "utf8");
const inputSheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const address = read("apps/mobile/features/work-orders/documents/QuickDeliveryAddressSearchSheet.tsx");
const reusable = read("apps/mobile/features/inputs/WaflReusableCreateForm.tsx");
const primaryAction = read("apps/mobile/features/inputs/WaflPrimaryActionButton.tsx");
const sizeColor = read("apps/mobile/features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx");
const spec = read("apps/mobile/features/work-orders/size-color/SpecItemSelectionSheet.tsx");
const reelInline = read("apps/mobile/features/inputs/reel-picker/ReelInlineEditValue.tsx");
const date = read("apps/mobile/components/InlineDatePicker.tsx");
const production = read("apps/mobile/features/work-orders/production/WorkOrderProductionAuthoring.tsx");
const materials = read("apps/mobile/features/materials/WorkOrderMaterialsReadOnly.tsx");
const design = read("docs/project/app-v2/11a-mobile-design-system-v2.md");
const makerIa = read("docs/project/app-v2/11b-maker-workorder-tab-ia-v2.md");

// Complete declared inventory: every class is explicit and every shared surface uses a static root family.
assert.equal(WAFL_LIVE_SHEET_INVENTORY.length, 44);
assert.ok(WAFL_LIVE_SHEET_INVENTORY.every((entry) => entry.classification && entry.physicalPolicy && entry.physicalState));
const staticRoots = WAFL_LIVE_SHEET_INVENTORY.filter((entry) => entry.root === "WaflInputSheet" || entry.root === "WaflReelPickerSheet");
assert.equal(staticRoots.length, 35);
assert.ok(staticRoots.every((entry) => ["STATIC_BOTTOM_SHEET", "STATIC_BOTTOM_SHEET_SCROLLABLE", "STATIC_REEL_PICKER", "CENTER_DIALOG_CANDIDATE"].includes(entry.classification)));
assert.deepEqual(Object.fromEntries(Object.entries(Object.groupBy(WAFL_LIVE_SHEET_INVENTORY, (entry) => entry.classification)).map(([key, value]) => [key, value.length])), {
  STATIC_BOTTOM_SHEET: 7,
  STATIC_BOTTOM_SHEET_SCROLLABLE: 17,
  STATIC_REEL_PICKER: 9,
  CENTER_DIALOG_CANDIDATE: 5,
  FULLSCREEN_KEEP: 5,
  SPECIAL_FIXED_MODAL_KEEP: 1,
});
assert.deepEqual(WAFL_PRESENTATION_SOURCE_COUNTS, {
  decisionCallsites: 3,
  inlineDatePickerCallsites: 1,
  pairedReelCallsites: 1,
  rawNativeModalHosts: 7,
  reelPickerCallsites: 8,
  waflInputSheetJsxInstances: 26,
});
assert.equal(WAFL_HISTORICAL_SHEET_REFERENCES.length, 2);
assert.match(inputSheet, /testID="wafl-sheet-fixed-header"/u);
assert.doesNotMatch(inputSheet, /onStartShouldSetResponderCapture|resolveWaflSheetRelease/u);

// A73C keeps Address Search presentation-ready while making focus an explicit user action.
assert.match(address, /sizing="expandable"/u);
assert.doesNotMatch(address, /searchInputRef|onAfterOpen=.*focus|requestAnimationFrame/u);
assert.match(address, /onSubmitEditing=\{submitSearch\}/u);
assert.doesNotMatch(address, /\sautoFocus(?:\s|=)/u);
assert.doesNotMatch(address, /PanResponder|onResponderMove/u);

// Size, Color and Spec use one field/action shell; palette remains Color-owned.
assert.match(reusable, /WaflSheetValueField/u);
assert.match(reusable, /useWaflSheetDirectInputConfirm\(props\.onCreate, disabled\)/u);
assert.doesNotMatch(reusable, /WaflPrimaryActionButton/u);
assert.match(primaryAction, /width: "100%"/u);
assert.equal((sizeColor.match(/<WaflReusableCreateForm/g) ?? []).length, 2);
assert.equal((spec.match(/<WaflReusableCreateForm/g) ?? []).length, 1);
assert.match(sizeColor, /<ColorGrid[\s\S]*<ReadOnlyColorValues/u);
assert.doesNotMatch(sizeColor, /styles\.input|styles\.primaryButton/u);

// Opening a child sheet changes paint only, never the source field footprint.
assert.match(reelInline, /editable: \{[^}]*minHeight: 36[^}]*paddingHorizontal: WAFL_THEME\.spacing\.xs[^}]*paddingVertical: 3/u);
assert.match(reelInline, /active: \{[^}]*minHeight: 36[^}]*paddingHorizontal: WAFL_THEME\.spacing\.xs[^}]*paddingVertical: 3/u);
assert.doesNotMatch(reelInline, /active: \{[^}]*borderWidth:/u);
assert.doesNotMatch(reelInline, /active: \{[^}]*width: "100%"/u);
assert.match(date, /activeAnchor: \{[^}]*minHeight: 36[^}]*paddingHorizontal: 4[^}]*paddingVertical: 6/u);
assert.match(materials, /<ReelInlineEditValue/u);
assert.match(production, /<WaflCompactSelectionField/u);

for (const marker of [
  "live sheet inventory",
  "static bottom sheet",
  "reusable-create form family",
  "source field keeps identical participating geometry",
]) assert.ok(`${design}\n${makerIa}`.includes(marker), `canonical docs missing ${marker}`);

console.log(JSON.stringify({
  contract: "workorder-v2-alpha65-sheet-inventory-reusable-create-active-geometry",
  previousPermanentInventoryRetained: 146,
  addedPermanentChecks: 1,
  finalPermanentInventory: 147,
  liveSheets: WAFL_LIVE_SHEET_INVENTORY.length,
  staticSharedSheets: staticRoots.length,
  centerDialogCandidates: 5,
  explicitExceptions: 6,
  historicalReferences: WAFL_HISTORICAL_SHEET_REFERENCES.length,
  physicalGestureInferred: false,
  migrationLedger: "18/18",
  migration019: 0,
  productionMutation: 0,
  ownerFixtureMutation: 0,
}));
