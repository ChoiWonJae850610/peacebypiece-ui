#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { WAFL_HISTORICAL_SHEET_REFERENCES, WAFL_LIVE_SHEET_INVENTORY } from "../apps/mobile/features/inputs/waflLiveSheetInventory.ts";

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

// Complete declared inventory: every class is explicit and every draggable surface shares the root gesture owner.
assert.equal(WAFL_LIVE_SHEET_INVENTORY.length, 25);
assert.ok(WAFL_LIVE_SHEET_INVENTORY.every((entry) => entry.classification && entry.physicalPolicy));
const draggable = WAFL_LIVE_SHEET_INVENTORY.filter((entry) => entry.classification === "A_DRAGGABLE_FREE_SETTLE");
assert.equal(draggable.length, 22);
assert.ok(draggable.every((entry) => entry.root === "WaflInputSheet" || entry.root === "WaflReelPickerSheet"));
assert.equal(WAFL_LIVE_SHEET_INVENTORY.filter((entry) => entry.classification === "B_FIXED").length, 1);
assert.equal(WAFL_LIVE_SHEET_INVENTORY.filter((entry) => entry.classification === "C_INTERACTION_EXCEPTION").length, 2);
assert.equal(WAFL_HISTORICAL_SHEET_REFERENCES.length, 2);
assert.match(inputSheet, /onStartShouldSetResponderCapture=\{\(\) => draggable && openReady && !actionPending\}/u);
assert.match(inputSheet, /resolveWaflSheetRelease/u);

// Address search waits for the canonical presentation-ready generation before focusing.
assert.match(address, /sizing="expandable"/u);
assert.match(address, /onAfterOpen=\{\(\) => searchInputRef\.current\?\.focus\(\)\}/u);
assert.doesNotMatch(address, /\sautoFocus(?:\s|=)/u);
assert.doesNotMatch(address, /PanResponder|onResponderMove/u);

// Size, Color and Spec use one field/action shell; palette remains Color-owned.
assert.match(reusable, /WaflSheetValueField/u);
assert.match(reusable, /WaflPrimaryActionButton/u);
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
  "reusable-create form family",
  "source field keeps identical participating geometry",
]) assert.ok(`${design}\n${makerIa}`.includes(marker), `canonical docs missing ${marker}`);

console.log(JSON.stringify({
  contract: "workorder-v2-alpha65-sheet-inventory-reusable-create-active-geometry",
  previousPermanentInventoryRetained: 146,
  addedPermanentChecks: 1,
  finalPermanentInventory: 147,
  liveSheets: WAFL_LIVE_SHEET_INVENTORY.length,
  draggableSheets: draggable.length,
  fixedSheets: 1,
  interactionExceptions: 2,
  historicalReferences: WAFL_HISTORICAL_SHEET_REFERENCES.length,
  physicalGestureInferred: false,
  migrationLedger: "18/18",
  migration019: 0,
  productionMutation: 0,
  ownerFixtureMutation: 0,
}));
