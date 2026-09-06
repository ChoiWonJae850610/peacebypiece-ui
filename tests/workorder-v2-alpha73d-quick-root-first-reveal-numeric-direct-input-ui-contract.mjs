#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  resolveWaflPreparedDirectInputKeyboardTarget,
  resolveWaflRootFirstMeasuredReveal,
} from "../apps/mobile/domain/waflDirectInputKeyboardPolicy.ts";
import {
  resolveWaflNumericAuxiliaryStatus,
  resolveWaflReelAdaptiveBodyHeight,
  WAFL_REEL_AUXILIARY_STATUS_HEIGHT,
} from "../apps/mobile/features/inputs/reel-picker/waflReelSheetSizingPolicy.ts";

const read = (file) => fs.readFileSync(file, "utf8");
const policy = read("apps/mobile/domain/waflDirectInputKeyboardPolicy.ts");
const sheet = read("apps/mobile/features/inputs/WaflInputSheet.tsx");
const input = read("apps/mobile/features/inputs/WaflSheetTextInput.tsx");
const reel = read("apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx");
const quick = read("apps/mobile/features/work-orders/documents/QuickDeliveryFoundation.tsx");
const workbench = read("apps/mobile/features/work-orders/documents/WorkOrderDocumentWorkbench.tsx");
const search = read("apps/mobile/features/work-orders/documents/QuickDeliveryAddressSearchSheet.tsx");

const geometry = {
  bodyContentHeight: 980,
  bodyOffset: 0,
  bodyViewportHeight: 240,
  compactComposition: false,
  expandedHeight: 800,
  explicitSemanticRegion: true,
  fieldHeight: 58,
  fieldTop: 650,
  fieldWidth: 320,
  fieldX: 12,
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
const bodyFirst = resolveWaflPreparedDirectInputKeyboardTarget({ geometry, keyboardInset: 310 });
const rootFirst = resolveWaflPreparedDirectInputKeyboardTarget({ geometry: { ...geometry, revealOrder: "rootFirst" }, keyboardInset: 310 });
assert.equal(rootFirst.revealOrder, "rootFirst");
assert.ok(rootFirst.targetOffset <= bodyFirst.targetOffset);
assert.ok(rootFirst.appliedBodyScroll < bodyFirst.appliedBodyScroll);
assert.equal(rootFirst.appliedBodyScroll, rootFirst.desiredBodyScroll);
assert.ok(rootFirst.visibleBottomAfterRootAllocation + rootFirst.appliedBodyScroll >= rootFirst.fieldBottom + geometry.semanticGap);
assert.match(policy, /rootFirstTargetOffset[\s\S]*visibleBottomAfterRootAllocation[\s\S]*desiredBodyScroll/u);

const measuredRootFirst = resolveWaflRootFirstMeasuredReveal({
  availableForwardScroll: 400,
  currentOffset: 300,
  fieldBottom: 700,
  fieldTop: 620,
  keyboardTop: 560,
  requiredTargetOffset: 260,
  semanticGap: 12,
  viewportBottom: 760,
  viewportTop: 240,
});
assert.equal(measuredRootFirst.targetOffset, 148);
assert.equal(measuredRootFirst.sheetRise, 152);
assert.equal(measuredRootFirst.appliedBodyScroll, 0);
assert.ok(measuredRootFirst.semanticFieldGap >= 12);
assert.match(sheet, /keyboardRevealOrder === "rootFirst"[\s\S]*resolveWaflRootFirstMeasuredReveal/u);

for (const source of [quick, workbench, search]) assert.match(source, /keyboardRevealOrder="rootFirst"/u);
for (const marker of ["quick-driver-name-semantic-target", "quick-driver-contact-semantic-target", "quick-driver-memo-semantic-target", "quick-address-detail-semantic-target", "quick-address-contact-semantic-target"]) {
  assert.match(quick, new RegExp(marker, "u"));
}

assert.match(input, /body-owner-absent[\s\S]*publishLayout\(null/u);
assert.match(input, /semanticFocusScope !== null && sheetLocalLayout === null\) return/u);
assert.match(input, /if \(focusedRef\.current\) registerFocusedTarget\(targetRef\.current\)/u);
assert.match(sheet, /focusSemanticTargetPending/u);
assert.match(sheet, /CANONICAL_SEMANTIC_RECT_PENDING/u);
assert.match(sheet, /rootClaim: "not-requested"/u);

assert.match(reel, /keyboardMode=\{renderPath === "numeric-keypad" \? "directInput" : "default"\}/u);
assert.match(reel, /onPreparedForAutoFocus=\{renderPath === "numeric-keypad"/u);
assert.doesNotMatch(reel, /\sautoFocus(?:\s|=)/u);
assert.match(reel, /footerPolicy=\{renderPath === "numeric-keypad" \? "hidden"/u);
assert.match(reel, /wafl-numeric-keypad-inline-actions/u);
assert.match(reel, /WaflInputModeSwitch disabled=\{pending\} mode="direct"[\s\S]*WaflSheetActionButtons/u);
assert.match(reel, /setSessionOpeningValue\(openValue\.trim\(\)\)/u);
assert.match(reel, /renderPath === "numeric-keypad"[\s\S]*sessionOpeningValue/u);
assert.match(reel, /auxiliaryStatus\.legacyText[\s\S]*auxiliaryStatus\.validationText/u);

const status = resolveWaflNumericAuxiliaryStatus({ legacyValue: "1.07", validationMessage: "입력값 확인" });
assert.equal(status.legacyText, "기존값 1.07");
assert.equal(status.validationText, "입력값 확인");
assert.equal(WAFL_REEL_AUXILIARY_STATUS_HEIGHT, 40);
const directHeight = resolveWaflReelAdaptiveBodyHeight({
  hasModeSwitch: true,
  hasSupplementaryControl: false,
  hasValidationMessage: true,
  renderPath: "numeric-keypad",
  reserveAuxiliaryStatus: true,
});
assert.equal(directHeight, 200);

for (const forbidden of ["quickDeliveryKeyboardOffset", "windowHeight === 852", "keyboardHeight ===", "setTimeout(() => keypad", "PanResponder"]) {
  assert.equal(`${policy}\n${sheet}\n${input}\n${reel}\n${quick}`.includes(forbidden), false);
}

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha73d-quick-root-first-reveal-numeric-direct-input-ui",
  checkpoint: "ALPHA73D_QUICK_ROOT_FIRST_REVEAL_AND_NUMERIC_DIRECT_INPUT_UI_FIX_IPHONE_QA_REQUIRED",
  caseCount: 20,
  previousPermanentInventoryRetained: 258,
  addedPermanentChecks: 1,
  finalPermanentInventory: 259,
  invariants: [
    "QUICK_REVEAL_ROOT_FIRST",
    "RESIDUAL_BODY_SCROLL_MINIMUM",
    "SINGLE_APPEARANCE_DECISION",
    "CANONICAL_SEMANTIC_READY_BEFORE_ROOT_CLAIM",
    "RAW_PARENT_LOCAL_FALLBACK_ZERO",
    "NUMERIC_KEYPAD_SHARED_DIRECT_INPUT",
    "NUMERIC_PREPARED_FOCUS_TRANSACTION",
    "NUMERIC_INLINE_MODE_AND_ACTION_ROW",
    "NUMERIC_REDUNDANT_FOOTER_ZERO",
    "SESSION_OPENING_LEGACY_VALUE_STABLE",
    "NUMERIC_VALIDATION_EXTENT_STABLE",
    "NO_DEVICE_SPECIFIC_REVEAL_OFFSET",
  ],
  physicalResultInferred: false,
}));
