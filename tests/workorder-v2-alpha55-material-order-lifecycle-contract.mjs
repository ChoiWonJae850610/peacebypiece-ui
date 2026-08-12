#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { resolveMaterialOrderPolicy } from "../apps/mobile/domain/materialOrderPolicy.ts";
import { validateMaterialOrderRequest } from "../apps/mobile/domain/workOrderValidation.ts";
import { evaluateMaterialOrderReadiness } from "../lib/domain/work-orders/command/materialOrderReadiness.ts";
import { isTailscaleServePathAllowed } from "../lib/external-qa/configCore.mjs";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const editing = resolveMaterialOrderPolicy({
  status: "editing",
  lifecycle: "active",
  currentDraft: true,
  serverLocked: false,
  canUpdate: true,
  canRequestOrder: true,
  canCompleteOrder: true,
});
assert.equal(editing.label, "발주 전");
assert.equal(editing.canEdit, true);
assert.deepEqual(editing.actions, ["request"]);

const requested = resolveMaterialOrderPolicy({
  status: "requested",
  lifecycle: "active",
  currentDraft: true,
  serverLocked: true,
  canUpdate: true,
  canRequestOrder: true,
  canCompleteOrder: true,
});
assert.equal(requested.canEdit, false);
assert.deepEqual(requested.actions, ["complete", "cancel"]);

const completed = resolveMaterialOrderPolicy({
  status: "completed",
  lifecycle: "active",
  currentDraft: true,
  serverLocked: true,
  canUpdate: true,
  canRequestOrder: true,
  canCompleteOrder: true,
});
assert.equal(completed.label, "발주완료");
assert.equal(completed.locked, true);
assert.deepEqual(completed.actions, []);

const legacyCancelled = resolveMaterialOrderPolicy({
  status: "cancelled",
  lifecycle: "active",
  currentDraft: true,
  serverLocked: true,
  canUpdate: true,
  canRequestOrder: true,
  canCompleteOrder: true,
});
assert.equal(legacyCancelled.label, "과거 취소");
assert.equal(legacyCancelled.legacyCancelled, true);
assert.equal(legacyCancelled.canEdit, false);
assert.deepEqual(legacyCancelled.actions, []);

const archived = resolveMaterialOrderPolicy({
  status: "editing",
  lifecycle: "archived",
  currentDraft: true,
  serverLocked: true,
  canUpdate: true,
  canRequestOrder: true,
  canCompleteOrder: true,
});
assert.equal(archived.canEdit, false);
assert.deepEqual(archived.actions, []);

const permissionDenied = resolveMaterialOrderPolicy({
  status: "requested",
  lifecycle: "active",
  currentDraft: true,
  serverLocked: true,
  canUpdate: false,
  canRequestOrder: false,
  canCompleteOrder: false,
});
assert.deepEqual(permissionDenied.actions, []);

const validLine = {
  name: "QA fabric",
  colorOption: undefined,
  usageArea: undefined,
  partnerId: "partner-1",
  requiredQuantity: "2.000",
  allowanceQuantity: "0.500",
  inventoryUsageQuantity: "0.500",
  orderQuantity: "2.500",
  unitCode: "yd",
  unitPrice: "15000.00",
  memo: undefined,
};
assert.deepEqual(validateMaterialOrderRequest(validLine), {});
assert.ok(validateMaterialOrderRequest({ ...validLine, orderQuantity: "3.000" }).orderQuantity);
assert.ok(validateMaterialOrderRequest({ ...validLine, unitCode: "" }).unitCode);
assert.doesNotThrow(() => validateMaterialOrderRequest({ ...validLine, memo: undefined }));
assert.equal(evaluateMaterialOrderReadiness({
  requiredQuantity: "3",
  allowanceQuantity: "0.5",
  inventoryUsageQuantity: "3.5",
  orderQuantity: "0",
  unitCode: "m",
  supplierPartnerId: null,
  unitPrice: "0",
}).ready, true);

const repository = read("lib/domain/work-orders/command/materialCommandRepository.ts");
const transitionContract = read("lib/domain/work-orders/contracts/state-transitions.ts");
const detailRepository = read("lib/domain/work-orders/read/detailRepository.ts");
const runtimeGuard = read("lib/domain/work-orders/command/runtimeGuard.ts");
const runner = read("tools/dev/start-wafl-external-qa.ps1");
const apiClient = read("apps/mobile/lib/apiClient.ts");
const mutationController = read("apps/mobile/features/work-orders/workOrderMutationController.ts");
const experience = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const materialView = read("apps/mobile/features/materials/WorkOrderMaterialsReadOnly.tsx");
const fixtureRunner = read("scripts/run-wafl-v2-alpha55-material-order-fixtures.mjs");
const runtimeQa = read("scripts/run-wafl-v2-alpha55-material-order-runtime-qa.mjs");
const workOrderId = "11111111-1111-1111-1111-111111111111";
const materialLineId = "22222222-2222-2222-2222-222222222222";
const alpha55RuntimeEnv = {
  WAFL_SERVER_RUNTIME_MODE: "dev",
  WAFL_EXTERNAL_QA_ALPHA55_MATERIAL_ORDER_LIFECYCLE_MUTATION_ENABLED: "true",
  WAFL_V2_COMMAND_API_ENABLED: "1",
  WAFL_V2_COMMAND_MUTATION_APPROVED: "2.0.0-alpha.55-dev-test-mobile-material-order-lifecycle-runtime",
};
for (const kind of ["request", "cancel", "complete"]) {
  const pathname = `/api/v2/work-orders/${workOrderId}/materials/${materialLineId}/order-${kind}`;
  assert.equal(isTailscaleServePathAllowed(pathname, "POST", alpha55RuntimeEnv), true);
  assert.equal(isTailscaleServePathAllowed(pathname, "POST", { ...alpha55RuntimeEnv, WAFL_SERVER_RUNTIME_MODE: "production" }), false);
  assert.equal(isTailscaleServePathAllowed(pathname, "GET", alpha55RuntimeEnv), false);
}
assert.equal(
  isTailscaleServePathAllowed(
    `/api/v2/work-orders/${workOrderId}/materials/${materialLineId}`,
    "PATCH",
    alpha55RuntimeEnv,
  ),
  true,
);
assert.equal(
  isTailscaleServePathAllowed(
    `/api/v2/work-orders/${workOrderId}/materials`,
    "POST",
    alpha55RuntimeEnv,
  ),
  true,
);
assert.equal(
  isTailscaleServePathAllowed(
    `/api/v2/work-orders/${workOrderId}/materials`,
    "POST",
    { ...alpha55RuntimeEnv, WAFL_SERVER_RUNTIME_MODE: "production" },
  ),
  false,
);

const transitionConfig = repository.match(/const TRANSITION_CONFIG = \{[\s\S]*?\n\} as const;/)?.[0] ?? "";
assert.match(transitionConfig, /request:[\s\S]*from: "editing"[\s\S]*to: "requested"/);
assert.match(transitionConfig, /cancel:[\s\S]*from: "requested"[\s\S]*to: "editing"/);
assert.match(transitionConfig, /complete:[\s\S]*from: "requested"[\s\S]*to: "completed"/);
assert.doesNotMatch(transitionConfig, /to: "cancelled"/, "new commands must not create cancelled operational rows");
assert.match(repository, /cancelled_at = CASE WHEN \$10 = 'cancel' THEN now\(\)/);
assert.match(repository, /changedFields: input\.kind === "cancel" \? \["status", "cancelledAt"\]/);
assert.match(transitionContract, /from: "cancelled", allowedTo: \[\], editable: false/);
assert.match(detailRepository, /locked: input\.lifecycle === "archived" \|\| status !== "editing"/);

assert.match(runtimeGuard, /2\.0\.0-alpha\.55-dev-test-mobile-material-order-lifecycle-runtime/);
assert.match(runner, /EnableAlpha55MaterialOrderLifecycleMutation/);
assert.match(runner, /material-order-request-cancel-complete/);
assert.match(apiClient, /export async function transitionWorkOrderMaterialOrder/);
assert.match(apiClient, /normalized\.result\.status !== expectedStatus/);
assert.match(mutationController, /transitionMaterialOrder\(/);
assert.match(experience, /materialOrderMutation\.tryBegin\(\) !== "started"/);
assert.match(experience, /finally \{[\s\S]*materialOrderMutation\.complete\(\)/);
assert.match(experience, /validateMaterialOrderRequest\(line\)/);
assert.match(experience, /closeMaterialEditorSession\(\)/);
assert.match(materialView, /accessibilityLabel=\{action\.label\}/);
assert.match(materialView, /onPress=\{onPress\}/, "order action intent must be wired to an enabled press handler");
for (const marker of [
  "ALPHA55_AUTO_MATERIAL_ORDER_LIFECYCLE",
  "ALPHA55_DEVICE_MATERIAL_ORDER_LIFECYCLE",
]) {
  assert.match(fixtureRunner, new RegExp(marker));
  assert.match(runtimeQa, new RegExp(marker));
}
assert.match(fixtureRunner, /CREATE WAFL ALPHA55 SYNTHETIC MATERIAL ORDER FIXTURES/);
assert.match(fixtureRunner, /EXPECTED_PARTIAL_BASELINE/);
assert.match(fixtureRunner, /reusedExistingApprovedFixture = AUTO_MARKER/);
assert.match(fixtureRunner, /markersToCreate = \[DEVICE_MARKER\]/);
assert.match(fixtureRunner, /fixture-marker-set-conflicts-with-approved-resume-baseline/);
assert.doesNotMatch(fixtureRunner, /result\?\.name/);
assert.match(fixtureRunner, /created\.id, response\.payload\.data\.result\.materialLineId/);
assert.match(fixtureRunner, /assertDelta\(before, after/);
assert.match(fixtureRunner, /legacyFingerprint/);
assert.doesNotMatch(fixtureRunner, /\bDELETE\b|\bTRUNCATE\b|\bDROP\b|\bALTER TABLE\b/i);
assert.match(runtimeQa, /request[\s\S]*cancel[\s\S]*controlled-edit[\s\S]*re-request[\s\S]*complete/);
assert.match(runtimeQa, /receiptDelta: 0/);
assert.match(runtimeQa, /legacyCancelledUnchanged: true/);
assert.match(runtimeQa, /newCancelledRows: 0/);
assert.match(runtimeQa, /duplicateAutomaticUnknownMutation: 0/);

console.log("workorder v2 alpha.55 material order lifecycle contract: PASS");
