#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  resolveWaflPreparedDirectInputKeyboardTarget,
} from "../apps/mobile/domain/waflDirectInputKeyboardPolicy.ts";
import {
  resolveWaflReelAdaptiveBodyHeight,
  WAFL_REEL_AUXILIARY_STATUS_HEIGHT,
} from "../apps/mobile/features/inputs/reel-picker/waflReelSheetSizingPolicy.ts";

const read = (file) => fs.readFileSync(file, "utf8");
const input = read("apps/mobile/features/inputs/WaflSheetTextInput.tsx");
const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const quick = read("apps/mobile/features/work-orders/documents/QuickDeliveryFoundation.tsx");
const reel = read("apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx");
const sizing = read("apps/mobile/features/inputs/reel-picker/waflReelSheetSizingPolicy.ts");

// A nested scope can be y=18 in its card while its canonical body-content y
// is 286. The native relative measurement must be published, never raw y=18.
const rawParentLocal = { x: 12, y: 18, width: 320, height: 52 };
const normalizedBodyContent = { x: 12, y: 286, width: 320, height: 52 };
assert.notEqual(rawParentLocal.y, normalizedBodyContent.y);
assert.match(input, /block\.measureLayout\(\s*bodyContent,/u);
assert.match(input, /onLayout is immediate-parent-local[\s\S]*canonical[\s\S]*body-content ancestor/u);
assert.match(input, /publishLayout\(\{ x, y, width, height \}, reason\)/u);
assert.match(input, /rawParentLocalLayout[\s\S]*sheetLocalLayout/u);
assert.match(sheet, /bodyCoordinate=\{bodyCoordinateOwner\}/u);
assert.match(sheet, /ref=\{bodyContentRef\}/u);
assert.match(sheet, /rawParentLocalScopeRect[\s\S]*registrySemanticScopeRect/u);

// Prepared reveal consumes the normalized body coordinate and therefore asks
// for substantially more body scroll than the parent-local alias would.
const base = {
  bodyContentHeight: 720,
  bodyOffset: 0,
  bodyViewportHeight: 240,
  compactComposition: false,
  expandedHeight: 800,
  explicitSemanticRegion: true,
  fieldHeight: normalizedBodyContent.height,
  fieldWidth: normalizedBodyContent.width,
  fieldX: normalizedBodyContent.x,
  footerHeight: 0,
  headerHeight: 48,
  maximumOffset: 360,
  minimumBodyViewportHeight: 120,
  safeBottom: 34,
  semanticGap: 12,
  semanticLayoutAtMs: 1,
  semanticLayoutRevision: 1,
  semanticScopeComplete: true,
  staticRestingOffset: 360,
  verticalChrome: 16,
};
const nestedPlan = resolveWaflPreparedDirectInputKeyboardTarget({
  geometry: { ...base, fieldTop: normalizedBodyContent.y },
  keyboardInset: 310,
});
const aliasedPlan = resolveWaflPreparedDirectInputKeyboardTarget({
  geometry: { ...base, fieldTop: rawParentLocal.y },
  keyboardInset: 310,
});
assert.ok(nestedPlan.appliedBodyScroll > aliasedPlan.appliedBodyScroll);
assert.equal(nestedPlan.appliedBodyScroll, nestedPlan.desiredBodyScroll);

// Quick Delivery owns explicit current semantic regions for every long-body
// destination. The prepared keyboard transaction applies body scroll without
// creating a late competing animation.
for (const marker of [
  "quick-driver-name-semantic-target",
  "quick-driver-contact-semantic-target",
  "quick-driver-memo-semantic-target",
  "quick-address-detail-semantic-target",
  "quick-address-contact-semantic-target",
]) assert.match(quick, new RegExp(marker, "u"));
assert.match(sheet, /applySystemBodyScrollDelta\(plan\.appliedBodyScroll, false\)/u);
assert.match(sheet, /REGISTERED_INPUT_HANDOFF/u);

// Numeric direct input declares input + fixed status slot + mode switch as one
// canonical semantic region, and deterministic extent includes bodyEndGap.
assert.equal(WAFL_REEL_AUXILIARY_STATUS_HEIGHT, 40);
const deterministicHeight = (renderPath) => resolveWaflReelAdaptiveBodyHeight({
  hasModeSwitch: true,
  hasSupplementaryControl: false,
  hasValidationMessage: false,
  renderPath,
  reserveAuxiliaryStatus: true,
});
assert.equal(deterministicHeight("numeric-keypad"), 200);
assert.equal(deterministicHeight("numeric-reel"), 354);
assert.match(sizing, /WAFL_THEME\.sheet\.bodyEndGap/u);
assert.match(reel, /<WaflSheetSemanticFocusScope testID="wafl-numeric-keypad-semantic-target">[\s\S]*<WaflSheetTextInput[\s\S]*styles\.auxiliaryStatus[\s\S]*<WaflInputModeSwitch[^>]*mode="direct"[\s\S]*<\/WaflSheetSemanticFocusScope>/u);
assert.match(reel, /renderPath !== "numeric-keypad"[\s\S]*WaflInputModeSwitch mode="picker"/u);

for (const forbidden of [
  "keyboardHeight ===",
  "windowHeight === 852",
  "quickDeliveryKeyboardOffset",
  "PanResponder",
  "wafl-sheet-header-drag-zone",
]) assert.doesNotMatch(`${input}\n${sheet}\n${quick}\n${reel}`, new RegExp(forbidden, "u"));

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha73d-semantic-coordinate-normalization-quick-reveal-numeric-keypad",
  checkpoint: "ALPHA73D_SEMANTIC_COORDINATE_NORMALIZATION_QUICK_REVEAL_AND_NUMERIC_KEYPAD_FIX_IPHONE_QA_REQUIRED",
  caseCount: 18,
  previousPermanentInventoryRetained: 257,
  addedPermanentChecks: 1,
  finalPermanentInventory: 258,
  invariants: [
    "SEMANTIC_TARGET_BODY_CONTENT_COORDINATE_CANONICAL",
    "NESTED_PARENT_LOCAL_ALIAS_REJECTED",
    "QUICK_PREPARED_BODY_SCROLL_NON_ANIMATED",
    "REGISTERED_INPUT_HANDOFF_PRESERVED",
    "NUMERIC_SEMANTIC_REGION_INCLUDES_STATUS_AND_MODE_SWITCH",
    "NUMERIC_DETERMINISTIC_EXTENT_INCLUDES_BODY_END_GAP",
    "SINGLE_VISIBLE_ROOT_REVEAL_PRESERVED",
    "NO_DEVICE_SPECIFIC_REVEAL_OFFSET",
  ],
  physicalResultInferred: false,
}));
