#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { evaluateMaterialOrderReadiness } from "../lib/domain/work-orders/command/materialOrderReadiness.ts";
import { validateMaterialOrderRequest } from "../apps/mobile/domain/workOrderValidation.ts";
import { resolveMaterialOrderPolicy } from "../apps/mobile/domain/materialOrderPolicy.ts";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

function readiness(overrides = {}) {
  return evaluateMaterialOrderReadiness({
    requiredQuantity: "3",
    allowanceQuantity: "0.5",
    inventoryUsageQuantity: "3.5",
    orderQuantity: "0",
    unitCode: "m",
    supplierPartnerId: null,
    unitPrice: "0",
    ...overrides,
  });
}

assert.deepEqual(readiness(), {
  ready: true,
  mode: "stock-covered",
  demand: "3.5",
  orderQuantity: "0",
  blockers: [],
});
assert.equal(readiness({ inventoryUsageQuantity: "4" }).ready, true);
assert.equal(readiness({ unitPrice: null }).ready, true);
assert.equal(readiness({ unitPrice: "" }).ready, true);
assert.equal(readiness({ requiredQuantity: "0", allowanceQuantity: "0", inventoryUsageQuantity: "0" }).ready, false);
assert.ok(readiness({ requiredQuantity: "-1" }).blockers.some((blocker) => blocker.field === "requiredQuantity"));
assert.ok(readiness({ unitCode: "" }).blockers.some((blocker) => blocker.field === "unitCode"));

const positiveOrder = readiness({
  inventoryUsageQuantity: "0",
  orderQuantity: "3.5",
  supplierPartnerId: "supplier-id",
  unitPrice: "10000",
});
assert.equal(positiveOrder.ready, true);
assert.equal(positiveOrder.mode, "external-order");
assert.ok(readiness({
  inventoryUsageQuantity: "0",
  orderQuantity: "3.5",
  supplierPartnerId: null,
  unitPrice: "10000",
}).blockers.some((blocker) => blocker.field === "partnerId"));
assert.ok(readiness({
  inventoryUsageQuantity: "0",
  orderQuantity: "3.5",
  supplierPartnerId: "supplier-id",
  unitPrice: "0",
}).blockers.some((blocker) => blocker.field === "unitPrice"));
assert.ok(readiness({ orderQuantity: "1" }).blockers.some((blocker) => blocker.code === "CALCULATION_MISMATCH"));

const mobileStockCovered = {
  id: "material-id",
  materialType: "fabric",
  name: "Stock covered fabric",
  colorOption: null,
  usageArea: null,
  requiredQuantity: "3",
  allowanceQuantity: "0.5",
  inventoryUsageQuantity: "3.5",
  orderQuantity: "0",
  unitCode: "m",
  currency: "KRW",
  unitPrice: "0",
  amount: "0",
  memo: null,
  status: "editing",
  displayOrder: 0,
  locked: false,
  lifecycle: "active",
  archivedAt: null,
};
assert.ok(validateMaterialOrderRequest(mobileStockCovered).orderQuantity);
assert.ok(validateMaterialOrderRequest(mobileStockCovered).unitPrice);
assert.deepEqual(
  validateMaterialOrderRequest({
    ...mobileStockCovered,
    orderQuantity: "3.5",
    unitPrice: "10000",
  }),
  {},
);
assert.deepEqual(
  validateMaterialOrderRequest({
    ...mobileStockCovered,
    inventoryUsageQuantity: "4",
    orderQuantity: "3.5",
    unitPrice: "10000",
  }),
  {},
);
assert.ok(validateMaterialOrderRequest({
  ...mobileStockCovered,
  requiredQuantity: "0",
  allowanceQuantity: "0",
  inventoryUsageQuantity: "0",
}).orderQuantity);
assert.ok(validateMaterialOrderRequest({
  ...mobileStockCovered,
  inventoryUsageQuantity: "0",
  orderQuantity: "3.5",
  unitPrice: "0",
}).unitPrice);

const policyInput = {
  lifecycle: "active",
  currentDraft: true,
  serverLocked: false,
  canUpdate: true,
  canRequestOrder: true,
  canCompleteOrder: true,
};
const editing = resolveMaterialOrderPolicy({ ...policyInput, status: "editing" });
assert.deepEqual(editing.actions, ["request"]);
assert.equal(editing.canEdit, true);
const requested = resolveMaterialOrderPolicy({ ...policyInput, status: "requested", serverLocked: true });
assert.deepEqual(requested.actions, ["complete", "cancel"]);
assert.equal(requested.canEdit, false);
const afterCancel = resolveMaterialOrderPolicy({ ...policyInput, status: "editing" });
assert.equal(afterCancel.canEdit, true);
assert.equal(afterCancel.canRequest, true);
const completed = resolveMaterialOrderPolicy({ ...policyInput, status: "completed", serverLocked: true });
assert.deepEqual(completed.actions, []);
assert.equal(completed.locked, true);

const repository = read("lib/domain/work-orders/command/materialCommandRepository.ts");
const service = read("lib/domain/work-orders/command/materialCommandService.ts");
const fixtureScript = read("scripts/run-wafl-v2-alpha55-material-order-fixtures.mjs");
const runtimeScript = read("scripts/run-wafl-v2-alpha55-material-order-runtime-qa.mjs");
assert.match(repository, /evaluateMaterialOrderReadiness\(\{/);
assert.match(repository, /readiness\.blockers/);
assert.match(service, /외부 발주가 필요한 경우 거래처를 선택해 주세요/);
assert.match(service, /외부 발주가 필요한 경우 0보다 큰 단가를 입력해 주세요/);
assert.doesNotMatch(service, /발주수량은 0보다 커야 합니다/);
assert.match(fixtureScript, /ALPHA55_AUTO_ZERO_ORDER_LIFECYCLE/);
assert.match(fixtureScript, /zero-order-marker-conflicts-with-approved-baseline/);
assert.match(fixtureScript, /requiredQuantity: "3"/);
assert.match(fixtureScript, /inventoryUsageQuantity: "3\.5"/);
assert.match(fixtureScript, /supplier_partner_id, null/);
assert.match(runtimeScript, /ALPHA55_AUTOMATED_ZERO_ORDER_LIFECYCLE_RUNTIME_PASS/);
assert.match(runtimeScript, /\["request", "cancel", "re-request", "complete"\]/);
assert.match(runtimeScript, /workOrderVersion: 62/);

console.log("workorder v2 alpha.55 stock-covered zero-order contract: PASS");
