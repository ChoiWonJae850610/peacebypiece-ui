#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { classifyNonJsonHttpResponse } from "../apps/mobile/domain/mobileHttpResponse.ts";
import { calendarMonthCells } from "../apps/mobile/hooks/useDatePickerState.ts";
import {
  calculateMaterialAmount,
  calculateOrderQuantity,
  formatQuantity,
  formatWon,
} from "../apps/mobile/lib/mobileDisplay.ts";
import { createExplicitMutationController } from "../apps/mobile/application/mutationController.ts";

assert.equal(calculateOrderQuantity({
  requiredQuantity: undefined,
  allowanceQuantity: "0.5",
  inventoryUsageQuantity: "0",
}), null, "missing optional runtime quantity must not throw");
assert.equal(calculateOrderQuantity({
  requiredQuantity: "10",
  allowanceQuantity: undefined,
  inventoryUsageQuantity: "0",
}), null);
assert.equal(calculateOrderQuantity({
  requiredQuantity: "10",
  allowanceQuantity: "0.5",
  inventoryUsageQuantity: undefined,
}), null);
assert.equal(calculateMaterialAmount(undefined, "12000"), null);
assert.equal(calculateMaterialAmount("10", undefined), null);
assert.equal(formatQuantity(undefined, "yd"), "미입력");
assert.equal(formatWon(undefined), "미입력");

assert.equal(calendarMonthCells(2026, 6).length, 35, "July 2026 must not render an empty sixth week");
assert.equal(calendarMonthCells(2026, 7).length, 42, "six-row months must keep all required days");
assert.deepEqual(calendarMonthCells(2026, 6).filter((day) => day !== null), Array.from({ length: 31 }, (_, index) => index + 1));

assert.deepEqual(classifyNonJsonHttpResponse(200), {
  code: "MALFORMED_RESPONSE",
  message: "서버 응답 형식이 올바르지 않습니다.",
});
assert.equal(classifyNonJsonHttpResponse(403).code, "FORBIDDEN");
assert.equal(classifyNonJsonHttpResponse(409).code, "CONFLICT");
assert.equal(classifyNonJsonHttpResponse(500).code, "INTERNAL_ERROR");
assert.notEqual(classifyNonJsonHttpResponse(403).code, "MALFORMED_RESPONSE", "a known HTTP denial must not show a malformed-response banner");

const mutation = createExplicitMutationController();
assert.equal(mutation.tryBegin(), "started");
assert.equal(mutation.tryBegin(), "duplicate-blocked", "duplicate Check must remain blocked");
mutation.complete();
assert.equal(mutation.inFlight, false);

const picker = fs.readFileSync("apps/mobile/features/inputs/reel-picker/WaflReelPickerSheet.tsx", "utf8");
const materials = fs.readFileSync("apps/mobile/features/materials/WorkOrderMaterialsReadOnly.tsx", "utf8");
const experience = fs.readFileSync("apps/mobile/features/MobileWorkOrderExperience.tsx", "utf8");
const apiClient = fs.readFileSync("apps/mobile/lib/apiClient.ts", "utf8");
const datePicker = fs.readFileSync("apps/mobile/components/InlineDatePicker.tsx", "utf8");

assert.match(picker, /selectedIndexRef/);
assert.match(picker, /\}, \[options\]\);/);
assert.doesNotMatch(picker, /\}, \[options, selectedIndex\]\);/);
assert.match(picker, /disableIntervalMomentum/);
assert.match(picker, /extraData=\{selectedIndex\}/);
assert.match(materials, /setReelTarget\(null\);\s+onSaveEdit\(patch\)/);
assert.doesNotMatch(materials, /if \(!activeEditor\) return;\s+onSaveEdit/, "picker save must resolve the live editor in the controller");
assert.match(materials, /setReelTarget\(null\);\s+onCancelEdit\(\)/);
assert.match(experience, /const closeMaterialEditorSession = useCallback/);
assert.ok((experience.match(/closeMaterialEditorSession\(\)/g) ?? []).length >= 3, "cancel, save success, and revalidation success must share exact teardown");
assert.match(apiClient, /classifyNonJsonHttpResponse\(response\.status\)/);
assert.match(apiClient, /WAFL_MOBILE_REQUEST_METRIC[\s\S]*const contentType/, "request ledger must be recorded before response content-type classification");
assert.match(datePicker, /calendarMonthCells/);
assert.doesNotMatch(datePicker, /Array\.from\(\{ length: 42 \}/);

console.log("workorder v2 alpha.54 user QA remediation contract: PASS");
