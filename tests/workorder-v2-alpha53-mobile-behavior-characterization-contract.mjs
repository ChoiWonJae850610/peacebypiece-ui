#!/usr/bin/env node
import assert from "node:assert/strict";

import { datePickerReducer } from "../apps/mobile/hooks/useDatePickerState.ts";
import {
  calculateMaterialAmount,
  calculateOrderQuantity,
  canonicalizeNumericInput,
  formatKoreanCalendarDate,
  formatQuantity,
  formatWon,
  normalizeNumericDraft,
  prepareNumericDraftOnFocus,
  stripDecimalTrailingZeros,
} from "../apps/mobile/lib/mobileDisplay.ts";
import {
  basicInfoDraftFromDetail,
  materialPatch,
  normalizeMaterialDraft,
  validateBasicInfoDraft,
  validateMaterialDraft,
} from "../apps/mobile/domain/workOrderValidation.ts";

assert.equal(prepareNumericDraftOnFocus("0"), "");
assert.equal(normalizeNumericDraft("05"), "5");
assert.equal(normalizeNumericDraft("."), "0.");
assert.equal(canonicalizeNumericInput("12.50"), "12.5");
assert.equal(stripDecimalTrailingZeros("5.0"), "5");
assert.equal(formatKoreanCalendarDate("2026-07-30"), "2026년 7월 30일");
assert.equal(formatKoreanCalendarDate("not-a-date"), "미정");
assert.equal(formatQuantity("0.500", "yd"), "0.5 yd");
assert.equal(formatWon("15000.00"), "15,000원");
assert.equal(calculateOrderQuantity({ requiredQuantity: "12", allowanceQuantity: "1.5", inventoryUsageQuantity: "2" }), "11.5");
assert.equal(calculateMaterialAmount("11.5", "15000"), "172500.00");

const detail = {
  header: { productName: "A", dueDate: "2026-07-30", totalQuantity: 10 },
};
assert.deepEqual(basicInfoDraftFromDetail(detail), { productName: "A", dueDate: "2026-07-30", totalQuantity: "10" });
assert.deepEqual(validateBasicInfoDraft({ productName: "A", dueDate: "2026-07-30", totalQuantity: "10" }), {});
assert.ok(validateBasicInfoDraft({ productName: "", dueDate: "2026-02-30", totalQuantity: "1.5" }).productName);

const material = {
  name: "Cotton",
  colorOption: "Navy",
  usageArea: "Body",
  requiredQuantity: "12.000",
  allowanceQuantity: "1.500",
  inventoryUsageQuantity: "2.000",
  orderQuantity: "11.500",
  unitCode: "yd",
  unitPrice: "15000",
  memo: "memo",
};
assert.deepEqual(validateMaterialDraft(material), {});
const normalized = normalizeMaterialDraft(material);
assert.equal(normalized.requiredQuantity, "12");
assert.equal(normalized.allowanceQuantity, "1.5");
assert.equal(normalized.orderQuantity, "11.5");
assert.deepEqual(materialPatch(normalized, { ...normalized, memo: "changed", orderQuantity: "999" }), { memo: "changed" });
assert.deepEqual(materialPatch(normalized, normalized), {});

let picker = { phase: "closed", draftValue: "", visibleYear: 2000, visibleMonth: 0, openCount: 0, closeCount: 0 };
picker = datePickerReducer(picker, { type: "open", value: "2026-07-30", today: "2026-07-23" });
assert.equal(picker.openCount, 1);
picker = datePickerReducer(picker, { type: "open", value: "2026-07-30", today: "2026-07-23" });
assert.equal(picker.openCount, 1);
picker = datePickerReducer(picker, { type: "select", value: "2026-08-01" });
assert.equal(picker.draftValue, "2026-08-01");
picker = datePickerReducer(picker, { type: "close" });
assert.equal(picker.closeCount, 1);
assert.equal(picker.phase, "closed");

console.log("workorder v2 alpha.53 mobile behavior characterization contract: PASS");
