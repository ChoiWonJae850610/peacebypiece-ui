#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  canonicalizeNumericInput,
  normalizeNumericDraft,
  prepareNumericDraftOnFocus,
  shouldSelectNumericValueOnFocus,
  stripDecimalTrailingZeros,
} from "../apps/mobile/lib/mobileDisplay.ts";

const controlled = fs.readFileSync("apps/mobile/components/ControlledInlineEditValue.tsx", "utf8");
const materials = fs.readFileSync("apps/mobile/components/WorkOrderMaterialsReadOnly.tsx", "utf8");
const overview = fs.readFileSync("apps/mobile/components/WorkOrderDetailOverview.tsx", "utf8");
const app = fs.readFileSync("apps/mobile/components/MobileWorkOrderApp.tsx", "utf8");
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

assert.match(controlled, /numeric \? normalizeNumericDraft\(nextValue\) : nextValue/);
assert.match(controlled, /prepareNumericDraftOnFocus\(activation\.value\)/);
assert.match(controlled, /activation\.onChange\(preparedValue\)/);
assert.match(controlled, /focusFrame = requestAnimationFrame/);
assert.doesNotMatch(controlled, /selection=\{selection\}/);
assert.match(controlled, /placeholder=\{emptyNumericDraft \? "0" : placeholder\}/);
assert.match(controlled, /onPress=\{onSave\}/);
assert.match(controlled, /const saveDisabled = !dirty \|\| saving \|\| emptyNumericDraft/);
assert.match(controlled, /disabled=\{saveDisabled\}/);
assert.doesNotMatch(`${controlled}\n${app}`, /setInterval|automatic.?save/i);
assert.match(app, /saveRequestInFlight\.current/);
assert.match(app, /materialSaveRequestInFlight\.current/);
assert.doesNotMatch(materials, /field="orderQuantity"/);
assert.match(materials, /material-order-quantity-calculated/);
assert.match(overview, /keyboardType="number-pad"/);
assert.match(materials, /keyboardType="decimal-pad"/);
assert.match(materials, /keyboardType="number-pad"/);
assert.match(visibilityDate, /material-quantity-row-expanded/);
assert.match(visibilityDate, /an open picker must not reopen/);

console.log("workorder v2 alpha.52 mobile numeric draft contract: PASS");
