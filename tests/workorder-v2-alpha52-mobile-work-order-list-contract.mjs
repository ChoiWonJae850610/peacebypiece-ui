#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const list = fs.readFileSync("apps/mobile/features/work-orders/list/WorkOrderListScreen.tsx", "utf8");
const app = fs.readFileSync("apps/mobile/features/MobileWorkOrderExperience.tsx", "utf8");

assert.match(list, />작업지시서</);
assert.match(list, /작업지시서 목록 새로고침/);
for (const field of ["representativeThumbnail", "productName", "STATUS_LABEL", "totalQuantity", "dueDate"]) assert.match(list, new RegExp(field));
for (const hidden of ["displayDocumentNumber", "Revision", "updatedAt", "processCount", "latestDocumentStatus", "incompleteMaterialSummary", "estimatedAmountSummary"]) {
  assert.doesNotMatch(list, new RegExp(hidden), `default list card must not expose ${hidden}`);
}
assert.doesNotMatch(`${list}\n${app}`, /제작 카드 목록|제작 카드를 선택|제작 카드 상세/);
assert.match(app, /작업지시서 상세/);

console.log("workorder v2 alpha.52 mobile work-order list contract: PASS");
