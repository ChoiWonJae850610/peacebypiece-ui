#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const detail = fs.readFileSync("apps/mobile/components/WorkOrderDetailOverview.tsx", "utf8");
const app = fs.readFileSync("apps/mobile/components/MobileWorkOrderApp.tsx", "utf8");
const datePicker = fs.readFileSync("apps/mobile/components/InlineDatePicker.tsx", "utf8");

assert.doesNotMatch(detail, /BasicInfoEditor|기본정보 수정|editEntry|PencilLine/);
for (const testId of ["overview-inline-product-name", "overview-inline-total-quantity"]) assert.match(detail, new RegExp(testId));
assert.match(datePicker, /testID="overview-inline-due-date"/);
assert.match(detail, /<InlineDatePicker/);
for (const field of ["productName", "totalQuantity", "dueDate"]) assert.match(detail, new RegExp(`onBeginEdit\\(\"${field}\"\\)`));
assert.match(detail, /ControlledInlineEditValue/);
assert.match(detail, /onSave=\{props\.onSave\}/);
assert.match(detail, /onCancel=\{props\.onCancelEdit\}/);
assert.match(app, /expectedVersion: detail\.header\.entityVersion/);
assert.match(app, /saveRequestInFlight\.current/);
assert.match(app, /const refreshed = await getWorkOrderDetail/);
assert.match(app, /현재 필드 편집을 완료해 주세요/);
assert.match(app, /저장하지 않은 변경사항이 있습니다/);
assert.doesNotMatch(`${detail}\n${app}`, /setInterval|auto.?save|automatic.?save/i);

console.log("workorder v2 alpha.52 mobile overview inline editing contract: PASS");
