#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  getWorkOrderWorkflowPresentation,
  matchesWorkOrderStatusFilter,
  WORK_ORDER_STATUS_FILTER_OPTIONS,
  WORK_ORDER_STATUS_LABEL,
} from "../apps/mobile/features/work-orders/list/workOrderListStatusPolicy.ts";

const display = fs.readFileSync("apps/mobile/lib/mobileDisplay.ts", "utf8");
const controlled = fs.readFileSync("apps/mobile/components/ControlledInlineEditValue.tsx", "utf8");
const datePicker = fs.readFileSync("apps/mobile/components/InlineDatePicker.tsx", "utf8");
const overview = fs.readFileSync("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx", "utf8");
const materials = fs.readFileSync("apps/mobile/features/materials/WorkOrderMaterialsReadOnly.tsx", "utf8");
const editor = fs.readFileSync("apps/mobile/features/materials/WorkOrderMaterialEditor.tsx", "utf8");
const list = fs.readFileSync("apps/mobile/features/work-orders/list/WorkOrderListScreen.tsx", "utf8");
const app = fs.readFileSync("apps/mobile/features/MobileWorkOrderExperience.tsx", "utf8");
const apiClient = fs.readFileSync("apps/mobile/lib/apiClient.ts", "utf8");
const listService = fs.readFileSync("lib/domain/work-orders/read/listService.ts", "utf8");
const listRepository = fs.readFileSync("lib/domain/work-orders/read/listRepository.ts", "utf8");
const validation = fs.readFileSync("lib/domain/work-orders/command/materialValidation.ts", "utf8");
const repository = fs.readFileSync("lib/domain/work-orders/command/materialCommandRepository.ts", "utf8");
const mobileValidation = fs.readFileSync("apps/mobile/domain/workOrderValidation.ts", "utf8");

for (const source of [overview, materials, editor]) assert.doesNotMatch(source, /\bKRW\b/);
assert.match(display, /stripDecimalTrailingZeros/);
assert.match(display, /formatWon/);
assert.match(display, /calculateOrderQuantity/);
assert.match(display, /calculateMaterialAmount/);

assert.match(controlled, /accessibilityLabel="변경 취소"/);
assert.match(controlled, /accessibilityLabel="변경 저장"/);
assert.match(controlled, /<X /);
assert.match(controlled, /<Check /);
assert.doesNotMatch(controlled, />\s*취소\s*</);
assert.doesNotMatch(controlled, />\s*완료\s*</);
assert.match(materials, /<Plus /);
assert.match(materials, /accessibilityLabel="원단 추가"/);

assert.doesNotMatch(materials, /field="orderQuantity"/);
assert.doesNotMatch(editor, /field="orderQuantity"/);
assert.match(materials, /material-order-quantity-calculated/);
assert.match(mobileValidation, /if \(field === "orderQuantity"\) continue/);
assert.match(repository, /function canonicalOrderQuantity/);
assert.match(repository, /scaled\(input\.requiredQuantity\) \+ scaled\(input\.allowanceQuantity\) - scaled\(input\.inventoryUsageQuantity\)/);
assert.match(repository, /order_quantity = \$20::numeric/);
assert.match(repository, /amount = round\([\s\S]*\$20::numeric \* \(CASE WHEN \$23 THEN \$24::numeric ELSE unit_price END\)/);
assert.match(validation, /canonicalOrderQuantity/);

assert.doesNotMatch(overview, /Revision\s*R/);
assert.doesNotMatch(list, /Revision\s*R/);
assert.match(datePicker, /accessibilityLabel="납기일 월간 달력"/);
assert.match(datePicker, /이전 달/);
assert.match(datePicker, /다음 달/);
assert.doesNotMatch(datePicker, /DateTimePicker|toISOString/);

assert.match(list, /작업지시서 검색/);
assert.deepEqual(
  WORK_ORDER_STATUS_FILTER_OPTIONS.map(({ id, label }) => [id, label]),
  [
    ["all", "전체"],
    ["draft", "작성 중"],
    ["delivery", "전달·발행"],
    ["progress", "진행 중"],
    ["completed", "완료"],
    ["hold_cancel", "보류·취소"],
  ],
);
assert.equal(matchesWorkOrderStatusFilter("issued", "progress"), true);
assert.equal(matchesWorkOrderStatusFilter("issued", "delivery"), false);
assert.deepEqual(getWorkOrderWorkflowPresentation("issued"), {
  filter: "progress",
  label: "진행 중",
  variant: "progress",
});
assert.equal(WORK_ORDER_STATUS_LABEL.issued, "진행 중");
assert.notEqual(WORK_ORDER_STATUS_LABEL.issued, "발행됨");
assert.match(list, /WORK_ORDER_STATUS_FILTER_OPTIONS\.map/);
assert.match(list, /matchesWorkOrderStatusFilter\(item\.status, statusFilter\)/);
assert.match(list, /getWorkOrderWorkflowPresentation\(item\.status\)/);
assert.doesNotMatch(list, />발행됨</);
assert.match(listService, /new Set\(\["limit", "cursor", "q", "status"\]\)/);
assert.match(listService, /query parameter는 한 번만 사용할 수 있습니다/);
assert.match(listService, /filterHash/);
assert.match(listRepository, /w\.product_name ILIKE/);
assert.match(listRepository, /w\.document_number_base ILIKE/);
assert.match(listRepository, /w\.status = ANY/);

assert.match(app, /WAFL_MATERIAL_SAVE_METRIC/);
assert.match(app, /WAFL_OVERVIEW_SAVE_METRIC/);
assert.match(apiClient, /WAFL_MOBILE_REQUEST_METRIC/);
for (const source of [app, apiClient]) assert.doesNotMatch(source, /console\.(?:log|info|warn|error)\([^\n]*(?:cookie|token|session|email)/i);
assert.doesNotMatch(`${app}\n${materials}\n${repository}`, /setInterval|automatic.?save/i);

console.log("workorder v2 alpha.52 mobile QA correction contract: PASS");
