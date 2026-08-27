import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { canExecuteMaterialOrderInteraction } from "../apps/mobile/domain/materialOrderInteractionPolicy.ts";
import { createDraftDeleteConfirmationActions } from "../apps/mobile/domain/draftDeleteConfirmationPolicy.ts";
import { formatCompactKstCreatedAt } from "../apps/mobile/lib/mobileDisplay.ts";
import { isExternalQaPathAllowed, isTailscaleServePathAllowed } from "../lib/external-qa/configCore.mjs";
import { MAKER_QA_APPROVAL } from "../lib/external-qa/makerQaCapabilities.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

// Reorder is not an interaction veto. Canonical policy, current selection,
// and the exactly-one mutation controller are the only execution boundaries.
assert.equal(canExecuteMaterialOrderInteraction({ hasDetail: true, policyAllowed: true, mutationInFlight: false, selectedWorkOrderMatches: true }), true);
assert.equal(canExecuteMaterialOrderInteraction({ hasDetail: true, policyAllowed: true, mutationInFlight: true, selectedWorkOrderMatches: true }), false);
assert.equal(canExecuteMaterialOrderInteraction({ hasDetail: true, policyAllowed: true, mutationInFlight: false, selectedWorkOrderMatches: false }), false);
const materialController = read("apps/mobile/features/materials/useWorkOrderMaterialAuthoringController.ts");
const materialExecution = materialController.slice(materialController.indexOf("async function executeMaterialOrder"), materialController.indexOf("function requestMaterialOrderAction"));
assert.doesNotMatch(materialExecution, /derivationKind\s*===\s*["']reorder/u);
assert.match(materialController, /requestFeatureTransition\(\(\) => \{ void executeMaterialOrder\(line, action\); \}\)/u);
assert.doesNotMatch(materialController, /confirmWaflAction/u);

// Cancel has no callback and therefore cannot mutate; confirm executes the
// supplied command exactly once per native alert action.
let deleteCalls = 0;
const actions = createDraftDeleteConfirmationActions(() => { deleteCalls += 1; });
assert.equal(actions.length, 2);
assert.equal(actions[0].style, "cancel");
assert.equal(actions[0].onPress, undefined);
assert.equal(deleteCalls, 0);
actions[1].onPress?.();
assert.equal(deleteCalls, 1);

const env = {
  NODE_ENV: "development",
  WAFL_SERVER_RUNTIME_MODE: "development",
  WAFL_V2_COMMAND_API_ENABLED: "1",
  WAFL_V2_COMMAND_MUTATION_APPROVED: MAKER_QA_APPROVAL.ALPHA67_CURRENT,
  WAFL_V2_DOCUMENT_VIEWER_ENABLED: "1",
  WAFL_V2_DOCUMENT_VIEWER_MUTATION_APPROVED: MAKER_QA_APPROVAL.ALPHA67_CURRENT,
  WAFL_EXTERNAL_QA_ALPHA67_NTH_REORDER_MUTATION_ENABLED: "true",
};
const workOrderId = "11111111-2222-4333-8444-555555555555";
const deletePath = `/api/v2/work-orders/${workOrderId}`;
assert.equal(isTailscaleServePathAllowed(deletePath, "DELETE", env), true);
assert.equal(isExternalQaPathAllowed(deletePath, "DELETE", env), true);
assert.equal(isTailscaleServePathAllowed(deletePath, "PUT", env), false);
assert.equal(isExternalQaPathAllowed("/api/v2/work-orders/private", "DELETE", env), false);
const deleteRoute = read("lib/domain/work-orders/command/draftDeleteRoute.ts");
assert.match(deleteRoute, /target\.status !== "draft" \|\| target\.revision_status !== "draft"/u);
assert.match(deleteRoute, /deleteWorkOrderImageFamilyViaWorker/u);
assert.match(deleteRoute, /deleteR2ObjectViaWorker/u);

// Created time is authoritative, KST, and second-precise.
assert.equal(formatCompactKstCreatedAt("2026-08-24T12:16:45.000Z"), "26/08/24 21:16:45");
assert.equal(formatCompactKstCreatedAt("invalid"), null);
const listRepository = read("lib/domain/work-orders/read/listRepository.ts");
assert.match(listRepository, /w\.created_at, w\.updated_at/u);
assert.match(listRepository, /createdAt: toIsoDateTime\(row\.created_at\)/u);
assert.match(listRepository, /ORDER BY w\.updated_at DESC, w\.id DESC/u);
const listScreen = read("apps/mobile/features/work-orders/list/WorkOrderListScreen.tsx");
assert.match(listScreen, /style=\{styles\.createdAt\}>\{createdAtLabel\}/u);
assert.doesNotMatch(listScreen, /생성 \{createdAtLabel\}/u);
assert.doesNotMatch(listScreen, /formatCompactKstCreatedAt\(item\.updatedAt\)/u);

// Reorder tap now enters the same blocker as Copy and opens from the
// authoritative core detail before optional projections.
const mobile = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
assert.doesNotMatch(mobile, /<WorkOrderReorderCreateSheet/u);
assert.match(mobile, /copyPending \|\| reorderPending/u);
assert.match(mobile, /"work-order-creation-blocker"/u);
const reorderFlow = mobile.slice(mobile.indexOf("async function executeReorderCreation"), mobile.indexOf("async function createCopyFromList"));
assert.equal((reorderFlow.match(/createReorder\(source\.header\.id/gu) ?? []).length, 1);
assert.match(reorderFlow, /runWorkOrderListReorderFlow/u);
assert.ok(reorderFlow.indexOf("runWorkOrderListReorderFlow") < reorderFlow.indexOf("createAndOpenAuthoritativeResult: executeReorderCreation"));
const hydration = mobile.slice(mobile.indexOf("async function hydrateCommittedReorder"), mobile.indexOf("async function createWorkOrderDraftFromMobile"));
assert.ok(hydration.indexOf("workOrderQueryController.detail(committed.workOrderId)") < hydration.indexOf("reconcileOpenChildren(committed.workOrderId, loadWorkOrderChildHydration(reorderedDetail)"));
assert.ok(hydration.indexOf("setPhase(\"detail-ready\")") < hydration.indexOf("reconcileOpenChildren(committed.workOrderId, loadWorkOrderChildHydration(reorderedDetail)"));

const integration = read("scripts/run-wafl-v2-alpha68-draft-delete-runtime.mjs");
assert.match(integration, /const created = await request\("\/api\/v2\/work-orders", \{ method: "POST"/u);
assert.match(integration, /exactOwnedImageFamilyDeleteCompletedBeforeResponse: true/u);
assert.match(integration, /assert\.equal\(replay\.response\.status, 404\)/u);
assert.match(deleteRoute, /if \(target\.status !== "draft" \|\| target\.revision_status !== "draft"\) throw new Error\("LOCKED"\)/u);

console.log(JSON.stringify({ contract: "workorder-v2-alpha68-draft-delete-reorder-tap-created-at-ux", status: "PASS" }));
