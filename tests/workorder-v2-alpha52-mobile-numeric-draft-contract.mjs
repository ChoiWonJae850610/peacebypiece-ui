#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  canonicalizeNumericInput,
  normalizeNumericCommitValue,
  normalizeNumericDraft,
  prepareNumericDraftOnFocus,
  shouldSelectNumericValueOnFocus,
  stripDecimalTrailingZeros,
} from "../apps/mobile/lib/mobileDisplay.ts";

const controlled = fs.readFileSync("apps/mobile/components/ControlledInlineEditValue.tsx", "utf8");
const materials = fs.readFileSync("apps/mobile/features/materials/WorkOrderMaterialsReadOnly.tsx", "utf8");
const reelSheet = fs.readFileSync("apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx", "utf8");
const overview = fs.readFileSync("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx", "utf8");
const app = fs.readFileSync("apps/mobile/features/MobileWorkOrderExperience.tsx", "utf8");
const visibilityDate = fs.readFileSync("tests/workorder-v2-alpha52-mobile-inline-visibility-date-picker-contract.mjs", "utf8");

assert.equal(normalizeNumericDraft(""), "");
assert.equal(normalizeNumericDraft("050"), "50");
assert.equal(normalizeNumericDraft("0101"), "101");
assert.equal(normalizeNumericDraft("03550"), "3550");
assert.equal(normalizeNumericDraft("000"), "0");
assert.equal(normalizeNumericDraft("0."), "0.");
assert.equal(normalizeNumericDraft("0.5"), "0.5");
assert.equal(normalizeNumericDraft("0.05"), "0.05");
assert.equal(normalizeNumericDraft("."), "0.");
assert.equal(normalizeNumericDraft(".5"), "0.5");
assert.equal(canonicalizeNumericInput(".5"), "0.5");
assert.equal(canonicalizeNumericInput("12.50"), "12.5");
assert.equal(stripDecimalTrailingZeros("00012.500"), "12.5");
assert.equal(shouldSelectNumericValueOnFocus("0"), true);
assert.equal(shouldSelectNumericValueOnFocus("0.000"), true);
assert.equal(shouldSelectNumericValueOnFocus("0.05"), false);
assert.equal(prepareNumericDraftOnFocus("0"), "");
assert.equal(prepareNumericDraftOnFocus("0.000"), "");
assert.equal(prepareNumericDraftOnFocus("0.05"), "0.05");
assert.equal(normalizeNumericCommitValue(""), "0");
assert.equal(normalizeNumericCommitValue("00081"), "81");

assert.match(controlled, /const normalized = normalizeNumericDraft\(nextValue\)/);
assert.match(controlled, /\^\\d\*\(\?:\\\.\\d\*\)\?\$\/u\.test\(normalized\) \? normalized : value/);
assert.match(controlled, /prepareNumericDraftOnFocus\(activation\.value\)/);
assert.match(controlled, /activation\.onChange\(preparedValue\)/);
assert.match(controlled, /focusFrame = requestAnimationFrame/);
assert.doesNotMatch(controlled, /selection=\{selection\}/);
assert.match(controlled, /placeholder=\{emptyNumericDraft \? "0" : placeholder\}/);
assert.match(controlled, /onPress=\{handleSaveRequest\}/);
assert.match(controlled, /const saveDisabled = \(!dirty && !nativeDirty\) \|\| saving \|\| finalizing/);
assert.match(controlled, /disabled=\{saveDisabled\}/);
assert.doesNotMatch(`${controlled}\n${app}`, /setInterval|automatic.?save/i);
assert.match(app, /overviewMutation\.inFlight/);
assert.match(app, /materialMutation\.inFlight/);
assert.doesNotMatch(materials, /field="orderQuantity"/);
assert.match(materials, /material-order-quantity-calculated/);
assert.match(overview, /label="총 수량"[\s\S]{0,140}header\.totalQuantity\.toLocaleString/);
assert.doesNotMatch(overview, /field="totalQuantity"|kind="integer"/);
assert.match(materials, /MaterialInlineField[^\n]+field="unitPrice"[^\n]+label="단가"[^\n]+testID="material-inline-unit-price"/);
assert.match(materials, /MaterialInlineField[^\n]+field="unitPrice"[^\n]+keyboardType="number-pad"/);
assert.doesNotMatch(materials, /reelTarget\.field === "unitPrice"/);
assert.match(reelSheet, /keyboardType=\{integerOnly \? "number-pad" : "decimal-pad"\}/);
assert.match(visibilityDate, /material-quantity-row-expanded/);
assert.match(visibilityDate, /an open picker must not reopen/);

console.log("workorder v2 alpha.52 mobile numeric draft contract: PASS");
