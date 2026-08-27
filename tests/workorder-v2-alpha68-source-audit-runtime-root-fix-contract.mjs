import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  acknowledgeQuantityDirtySnapshot,
  snapshotQuantityDirtyDelta,
  stageQuantityDirtyCell,
} from "../apps/mobile/features/work-orders/size-color/quantityDirtyDeltaPolicy.ts";
import {
  resolveWorkOrderSwipeIntent,
  resistedWorkOrderSwipeOffset,
  settleWorkOrderSwipe,
  WORK_ORDER_SWIPE_LEADING_WIDTH,
  WORK_ORDER_SWIPE_TRAILING_WIDTH,
  workOrderSwipeSnapOffset,
} from "../apps/mobile/features/work-orders/list/workOrderSwipePolicy.ts";
import { createImageDerivativesWithBoundedRetry } from "../lib/domain/work-orders/command/imageDerivativeRetryPolicy.ts";
import { isTailscaleServePathAllowed } from "../lib/external-qa/configCore.mjs";
import { MAKER_QA_APPROVAL } from "../lib/external-qa/makerQaCapabilities.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const runtimeEnv = {
  NODE_ENV: "development",
  WAFL_SERVER_RUNTIME_MODE: "development",
  WAFL_V2_COMMAND_API_ENABLED: "1",
  WAFL_V2_COMMAND_MUTATION_APPROVED: MAKER_QA_APPROVAL.ALPHA67_CURRENT,
  WAFL_V2_DOCUMENT_VIEWER_ENABLED: "1",
  WAFL_V2_DOCUMENT_VIEWER_MUTATION_APPROVED: MAKER_QA_APPROVAL.ALPHA67_CURRENT,
  WAFL_EXTERNAL_QA_ALPHA67_NTH_REORDER_MUTATION_ENABLED: "true",
};
const routeWorkOrderId = "11111111-2222-4333-8444-555555555555";
assert.equal(isTailscaleServePathAllowed(`/api/v2/work-orders/${routeWorkOrderId}/copy`, "POST", runtimeEnv), true);
assert.equal(isTailscaleServePathAllowed(`/api/v2/work-orders/${routeWorkOrderId}/copy`, "GET", runtimeEnv), false);
assert.equal(isTailscaleServePathAllowed(`/api/v2/work-orders/${routeWorkOrderId}/size-color/quantities/batch`, "PATCH", runtimeEnv), true);
assert.equal(isTailscaleServePathAllowed(`/api/v2/work-orders/${routeWorkOrderId}/size-color/quantities/batch`, "POST", runtimeEnv), false);

assert.equal(resolveWorkOrderSwipeIntent(0, 0), "pending", "touch-down is visually inert");
assert.equal(resolveWorkOrderSwipeIntent(7, 2), "pending", "tiny jitter is inert");
assert.equal(resolveWorkOrderSwipeIntent(14, 23), "vertical", "vertical intent belongs to list scroll");
assert.equal(resolveWorkOrderSwipeIntent(24, 4), "copy");
assert.equal(resolveWorkOrderSwipeIntent(-24, 4), "delete");
assert.equal(workOrderSwipeSnapOffset("copy"), WORK_ORDER_SWIPE_LEADING_WIDTH);
assert.equal(workOrderSwipeSnapOffset("delete"), -WORK_ORDER_SWIPE_TRAILING_WIDTH);
assert.equal(settleWorkOrderSwipe({ start: 0, dx: 12 }), null);
assert.ok(resistedWorkOrderSwipeOffset(WORK_ORDER_SWIPE_LEADING_WIDTH + 50) < WORK_ORDER_SWIPE_LEADING_WIDTH + 50);

const delta = new Map();
stageQuantityDirtyCell(delta, { colorId: "c1", sizeRowId: "s1", quantity: 10 }, 1);
stageQuantityDirtyCell(delta, { colorId: "c2", sizeRowId: "s1", quantity: 20 }, 2);
stageQuantityDirtyCell(delta, { colorId: "c1", sizeRowId: "s1", quantity: 11 }, 3);
const inFlight = snapshotQuantityDirtyDelta(delta);
assert.deepEqual(inFlight.map(({ cell }) => cell), [
  { colorId: "c1", sizeRowId: "s1", quantity: 11 },
  { colorId: "c2", sizeRowId: "s1", quantity: 20 },
]);
stageQuantityDirtyCell(delta, { colorId: "c1", sizeRowId: "s1", quantity: 12 }, 4);
acknowledgeQuantityDirtySnapshot(delta, inFlight);
assert.equal(delta.get("c1:s1")?.cell.quantity, 12, "edit made in flight remains dirty");
assert.equal(delta.has("c2:s1"), false, "unchanged committed key is cleared");

let derivativeAttempts = 0;
const derivative = await createImageDerivativesWithBoundedRetry({
  create: async () => {
    derivativeAttempts += 1;
    if (derivativeAttempts < 3) throw new Error("TRANSIENT");
    return "ready";
  },
  isRetryable: () => true,
  wait: async () => undefined,
});
assert.equal(derivative, "ready");
assert.equal(derivativeAttempts, 3);

const list = read("apps/mobile/features/work-orders/list/WorkOrderListScreen.tsx");
assert.match(list, /visibleSide!=="copy"&&styles\.swipeActionsHidden/u);
assert.match(list, /visibleSide!=="delete"&&styles\.swipeActionsHidden/u);
assert.match(list, /swipeCardLayer:\{width:"100%"\}/u);
assert.doesNotMatch(list, /pressed&&styles\.pressed\]\}>\{children\}/u);

const mobile = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const copyStart = mobile.indexOf("async function createCopyFromList");
const copyEnd = mobile.indexOf("function requestDeleteWorkOrder", copyStart);
const copy = mobile.slice(copyStart, copyEnd);
assert.match(copy, /createCopy\(item\.workOrderId/u);
assert.match(copy, /workOrderQueryController\.detail\(workOrderId\)/u);
assert.match(copy, /setPhase\("detail-ready"\)/u);
assert.match(copy, /reconcileOpenChildren\(createdWorkOrderId, loadWorkOrderChildHydration\(copiedDetail\), "복사본"\)/u);
assert.equal((copy.match(/createCopy\(item\.workOrderId/gu) ?? []).length, 1);

const controller = read("apps/mobile/features/work-orders/size-color/useSizeColorStructureEditController.ts");
assert.match(controller, /pendingQuantityCells/u);
assert.match(controller, /snapshotQuantityDirtyDelta/u);
assert.doesNotMatch(controller.slice(controller.indexOf("onSetQuantity:"), controller.indexOf("onSetMeasurementCell:")), /optimistic\.matrix\.quantityCells/u);

const route = read("lib/domain/work-orders/command/imageCommandRoute.ts");
assert.match(route, /createImageDerivativesWithBoundedRetry/u);
assert.match(route, /deleteWorkOrderImageFamilyViaWorker/u);

console.log(JSON.stringify({ contract: "workorder-v2-alpha68-source-audit-runtime-root-fix", status: "PASS" }));
