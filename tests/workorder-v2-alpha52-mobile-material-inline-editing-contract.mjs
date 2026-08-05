#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

import { resolveMaterialOrderPolicy } from "../apps/mobile/domain/materialOrderPolicy.ts";

const materials = fs.readFileSync("apps/mobile/features/materials/WorkOrderMaterialsReadOnly.tsx", "utf8");
const overview = fs.readFileSync("apps/mobile/features/work-orders/overview/WorkOrderDetailOverview.tsx", "utf8");
const app = fs.readFileSync("apps/mobile/features/MobileWorkOrderExperience.tsx", "utf8");
const runtimeGuard = fs.readFileSync("lib/domain/work-orders/command/runtimeGuard.ts", "utf8");
const qaConfig = fs.readFileSync("lib/external-qa/configCore.mjs", "utf8");
const runner = fs.readFileSync("tools/dev/start-wafl-external-qa.ps1", "utf8");
const validation = fs.readFileSync("apps/mobile/domain/workOrderValidation.ts", "utf8");
const policy = fs.readFileSync("apps/mobile/domain/workOrderPolicy.ts", "utf8");
const fieldPolicy = fs.readFileSync("apps/mobile/features/materials/materialFieldPolicy.ts", "utf8");
const historicalEvidence = fs.readFileSync("docs/project/app-v2/51-mobile-core-inline-ux-calculation-list-date-evidence.md", "utf8");

assert.doesNotMatch(materials, /PencilLine|editActionButton|>수정</);
assert.match(overview, /materialEditor\?\.mode === "create"/);
assert.doesNotMatch(overview, /props\.materialEditor \? \(/);
for (const field of ["name", "colorOption", "usageArea", "requiredQuantity", "allowanceQuantity", "unitCode", "unitPrice", "memo"]) {
  assert.match(materials, new RegExp(`field=\"${field}\"`), `inline material field missing ${field}`);
}
assert.doesNotMatch(materials, /field="inventoryUsageQuantity"/);
assert.match(fieldPolicy, /MOBILE_MATERIAL_INVENTORY_USAGE_VISIBLE = false/);
assert.match(historicalEvidence, /required\/allowance\/inventory quantities/);
assert.doesNotMatch(materials, /field="orderQuantity"/);
assert.match(materials, /material-order-quantity-calculated/);
assert.match(materials, /발주수량, 자동 계산, 읽기 전용/);
assert.match(validation, /if \(field === "orderQuantity" \|\| field === "inventoryUsageQuantity"\) continue/);
assert.match(materials, /const fieldEditable = canEdit && orderPolicy\.canEdit/);
assert.match(policy, /resolveMaterialOrderPolicy/);
const editablePolicy = resolveMaterialOrderPolicy({
  status: "editing",
  lifecycle: "active",
  currentDraft: true,
  serverLocked: false,
  canUpdate: true,
  canRequestOrder: true,
  canCompleteOrder: true,
});
assert.equal(editablePolicy.canEdit, true);
for (const input of [
  { status: "requested", lifecycle: "active", serverLocked: true },
  { status: "completed", lifecycle: "active", serverLocked: true },
  { status: "cancelled", lifecycle: "active", serverLocked: true },
  { status: "editing", lifecycle: "archived", serverLocked: false },
]) {
  assert.equal(resolveMaterialOrderPolicy({
    ...input,
    currentDraft: true,
    canUpdate: true,
    canRequestOrder: true,
    canCompleteOrder: true,
  }).canEdit, false);
}
assert.match(app, /await workOrderMutationController\.updateMaterial/);
assert.match(app, /await workOrderMutationController\.createMaterial/);
assert.match(app, /requestArchiveMaterial/);
assert.doesNotMatch(materials, /onRestore|restoreButton|archivedSection/);
assert.match(app, /materialMutation\.inFlight/);
assert.doesNotMatch(materials, /onPress=\{onEdit\}/);
for (const source of [runtimeGuard, qaConfig, runner]) assert.match(source, /2\.0\.0-alpha\.52-dev-test-mobile-core-inline-runtime/);
assert.match(runner, /EnableAlpha52CoreInlineMutation/);
assert.match(runner, /core-inline-overview-material-patch/);
assert.match(qaConfig, /WAFL_EXTERNAL_QA_ALPHA52_CORE_INLINE_MUTATION_ENABLED/);
assert.doesNotMatch(qaConfig, /ALPHA52[\s\S]{0,300}(?:POST|DELETE|archive|restore)/);

console.log("workorder v2 alpha.52 mobile material inline editing contract: PASS");
