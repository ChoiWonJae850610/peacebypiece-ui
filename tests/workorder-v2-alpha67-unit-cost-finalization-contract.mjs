#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { formatEstimatedUnitCost } from "../apps/mobile/lib/mobileDisplay.ts";

const overview = fs.readFileSync("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx", "utf8");

assert.equal(formatEstimatedUnitCost("531750.00", 530), "1,003원");
assert.equal(formatEstimatedUnitCost("100.00", 6), "17원");
assert.equal(formatEstimatedUnitCost("1.00", 2), "1원", "canonical KRW rounding is half-up");
assert.equal(formatEstimatedUnitCost("531750.00", 0), "미산정");
assert.equal(formatEstimatedUnitCost("531750.00", null), "미산정");
assert.equal(formatEstimatedUnitCost("531750.00", undefined), "미산정");
assert.equal(formatEstimatedUnitCost(null, 530), "미산정");

assert.match(overview, /label="예상 1벌 원가"/u);
assert.match(overview, /formatEstimatedUnitCost\(detail\.amounts\.estimatedTotal, header\.totalQuantity\)/u);
assert.doesNotMatch(overview, /label="1벌 원가"|formatWon\(detail\.amounts\.unitPrice\)/u);
for (const preserved of ["원단", "부자재", "공정", "예상 총원가"]) {
  assert.match(overview, new RegExp(`label="${preserved}"`, "u"));
}

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha67-unit-cost-finalization",
  previousPermanentInventoryRetained: 179,
  addedPermanentChecks: 1,
  finalPermanentInventory: 180,
  physicalResultRequired: false,
}));
