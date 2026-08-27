import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { runWaflProcessingAction } from "../apps/mobile/application/waflActionExecution.ts";
import { runWorkOrderListReorderFlow } from "../apps/mobile/domain/workOrderListReorderFlow.ts";
import { createWaflActionConfirmationActions } from "../apps/mobile/domain/waflActionConfirmationPolicy.ts";
import { normalizeMaterialDraft } from "../apps/mobile/domain/workOrderValidation.ts";
import { normalizeReelValue } from "../apps/mobile/features/inputs/reel-picker/reelPickerModel.ts";
import { formatCompactKstCreatedAt, stripDecimalTrailingZeros } from "../apps/mobile/lib/mobileDisplay.ts";

const root = path.resolve(import.meta.dirname, "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

assert.equal(formatCompactKstCreatedAt("2026-08-24T14:22:31.000Z"), "26/08/24 23:22:31");
assert.equal(formatCompactKstCreatedAt("invalid"), null);

for (const [input, expected] of [
  ["180", "180"],
  ["180.000", "180"],
  ["180.250", "180.25"],
  ["2.000", "2"],
  ["2.100", "2.1"],
  ["2.125", "2.125"],
]) {
  assert.equal(normalizeReelValue(input), expected);
  assert.equal(stripDecimalTrailingZeros(input), expected);
}
const normalizedAccessory = normalizeMaterialDraft({ requiredQuantity: "180.250", allowanceQuantity: "2.100", unitCode: "개" });
assert.equal(normalizedAccessory.requiredQuantity, "180.25");
assert.equal(normalizedAccessory.allowanceQuantity, "2.1");
const normalizedFabric = normalizeMaterialDraft({ requiredQuantity: "2.125", allowanceQuantity: "0.000", unitCode: "yd" });
assert.equal(normalizedFabric.requiredQuantity, "2.125");
assert.equal(normalizedFabric.allowanceQuantity, "0");

const reorderEvents = [];
const reorderResult = await runWorkOrderListReorderFlow({
  onProcessing: (value) => reorderEvents.push(`block:${value}`),
  loadSourceCore: async () => { reorderEvents.push("load-core-without-navigation"); return { id: "source", eligible: true }; },
  validateSource: (source) => source.eligible,
  createAndOpenAuthoritativeResult: async (source) => {
    reorderEvents.push(`create-once:${source.id}`);
    reorderEvents.push("open-created-core:created");
    return { workOrderId: "created" };
  },
});
assert.deepEqual(reorderResult, { workOrderId: "created" });
assert.deepEqual(reorderEvents, ["block:true", "load-core-without-navigation", "create-once:source", "open-created-core:created", "block:false"]);
assert.equal(reorderEvents.filter((event) => event.startsWith("create-once:")).length, 1);
assert.equal(reorderEvents.some((event) => event.includes("open-source-detail")), false);

const failureEvents = [];
await assert.rejects(() => runWorkOrderListReorderFlow({
  onProcessing: (value) => failureEvents.push(`block:${value}`),
  loadSourceCore: async () => { failureEvents.push("load-failed"); throw new Error("network"); },
  validateSource: () => true,
  createAndOpenAuthoritativeResult: async () => { failureEvents.push("unexpected-create"); },
}), /network/);
assert.deepEqual(failureEvents, ["block:true", "load-failed", "block:false"]);

const successEvents = [];
await runWaflProcessingAction({
  processingMessage: "원단을 발주 중입니다.",
  successMessage: "발주 요청이 완료되었습니다.",
  onProcessing: (message) => successEvents.push(message ?? "closed"),
  onSuccess: (message) => successEvents.push(message),
  command: async () => { successEvents.push("command-once"); return true; },
});
assert.deepEqual(successEvents, ["원단을 발주 중입니다.", "command-once", "closed", "발주 요청이 완료되었습니다."]);

const failedActionEvents = [];
await assert.rejects(() => runWaflProcessingAction({
  processingMessage: "부자재 발주를 취소 중입니다.",
  successMessage: "발주 요청이 취소되었습니다.",
  onProcessing: (message) => failedActionEvents.push(message ?? "closed"),
  onSuccess: (message) => failedActionEvents.push(`false-success:${message}`),
  command: async () => { throw new Error("command-failed"); },
}), /command-failed/);
assert.deepEqual(failedActionEvents, ["부자재 발주를 취소 중입니다.", "closed"]);

let confirmationCommands = 0;
const confirmationActions = createWaflActionConfirmationActions({
  confirmLabel: "최종 생성",
  onConfirm: () => { confirmationCommands += 1; },
});
assert.equal(confirmationActions[0].text, "취소");
assert.equal(confirmationActions[0].onPress, undefined);
assert.equal(confirmationCommands, 0);
confirmationActions[1].onPress?.();
assert.equal(confirmationCommands, 1);

const experience = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const list = read("apps/mobile/features/work-orders/list/WorkOrderListScreen.tsx");
const materials = read("apps/mobile/features/materials/useWorkOrderMaterialAuthoringController.ts");
const production = read("apps/mobile/features/work-orders/production/WorkOrderProductionAuthoring.tsx");
const documents = read("apps/mobile/features/work-orders/documents/WorkOrderDocumentWorkbench.tsx");
assert.match(experience, /runWorkOrderListReorderFlow/u);
assert.doesNotMatch(experience, /pendingListReorderId/u);
assert.doesNotMatch(list, /생성 \{createdAtLabel\}/u);
assert.match(materials, /runWaflProcessingAction/u);
assert.match(production, /runWaflProcessingAction/u);
assert.match(documents, /레시피를 확정 중입니다\./u);
assert.match(experience, /레시피를 삭제 중입니다\./u);

console.log("alpha68 common action UX, list reorder shell, timestamp, and numeric polish contract passed");
