import type { UserProfile, WorkOrder, WorkflowAction } from "@/types/workorder";
import type { InventoryChangeInput, InspectionCompleteInput } from "@/lib/hooks/workorder/useWorkOrderActionTypes";
import {
  applyInventoryAdjustmentToWorkOrder,
  applyWorkflowActionToWorkOrder,
  buildInventoryChanges,
  completeInspectionForWorkOrder,
  patchWorkOrder,
  updateManagerForWorkOrder,
} from "@/lib/workorder/actions";
import {
  createInspectionCompleteHistoryLog,
  createInventoryHistoryLog,
  createManagerChangeHistoryLog,
  createStatusHistoryLog,
} from "@/lib/workorder/history/builders";
import { pruneDraftRows, shouldPruneDraftRowsForWorkflowState } from "@/lib/workorder/draftRows";
import { isSameComparableText } from "@/lib/utils/compare";
import { defaultActionFlowText, defaultHistoryText, type ActionFlowHistoryText, type ActionFlowText, type WorkOrderActionFlowResult } from "@/lib/workorder/actionFlow/shared";

export function buildWorkflowActionResult(payload: {
  workOrder: WorkOrder;
  action: WorkflowAction;
  actorName: string;
  historyText?: ActionFlowHistoryText;
  workflowStateLabels?: Record<string, string>;
}): WorkOrderActionFlowResult {
  const targetWorkOrder = shouldPruneDraftRowsForWorkflowState(payload.action.nextState)
    ? pruneDraftRows(payload.workOrder)
    : payload.workOrder;

  return {
    nextWorkOrder: applyWorkflowActionToWorkOrder(targetWorkOrder, payload.action),
    historyLogs: [
      createStatusHistoryLog(
        payload.actorName,
        payload.workOrder.id,
        payload.workflowStateLabels?.[payload.workOrder.workflowState] ?? payload.workOrder.workflowState,
        payload.workflowStateLabels?.[payload.action.nextState] ?? payload.action.nextState,
        payload.action.label,
        payload.historyText ?? defaultHistoryText,
      ),
    ],
    saveStatus: payload.action.nextState === "review_requested" ? "dirty" : undefined,
    openInventoryEditor: payload.action.nextState === "in_inspection",
  };
}

export function buildInventoryApplyResult(payload: {
  workOrder: WorkOrder;
  actorName: string;
  input: InventoryChangeInput;
  historyText?: ActionFlowHistoryText;
}): WorkOrderActionFlowResult | null {
  const changes = buildInventoryChanges(payload.input);
  if (changes.length === 0) return null;

  return {
    nextWorkOrder: applyInventoryAdjustmentToWorkOrder(payload.workOrder, { changes }),
    appliedChanges: changes,
    historyLogs: [
      createInventoryHistoryLog(payload.actorName, payload.workOrder.id, {
        changes,
        memo: payload.input.memo,
      }, payload.historyText ?? defaultHistoryText),
    ],
  };
}

export function buildInspectionCompleteResult(payload: {
  workOrder: WorkOrder;
  actorName: string;
  input: InspectionCompleteInput;
  text?: ActionFlowText;
  historyText?: ActionFlowHistoryText;
}): WorkOrderActionFlowResult {
  const trimmedMemo = payload.input.memo.trim();

  return {
    nextWorkOrder: completeInspectionForWorkOrder(payload.workOrder, {
      orderEntryId: payload.input.orderEntryId,
      nextInventoryQuantity: payload.input.nextInventoryQuantity,
    }),
    historyLogs: [
      createInspectionCompleteHistoryLog(payload.actorName, payload.workOrder.id, {
        inboundQuantity: payload.input.inboundQuantity,
        nextInventoryQuantity: payload.input.nextInventoryQuantity,
        memo: trimmedMemo,
      }, payload.historyText ?? defaultHistoryText),
    ],
    saveStatus: "dirty",
    toastMessage: (payload.text ?? defaultActionFlowText).inspectionCompletedToast,
  };
}

export function buildPatchWorkOrderResult(payload: {
  workOrder: WorkOrder;
  patch: Partial<WorkOrder>;
}): WorkOrderActionFlowResult {
  return {
    nextWorkOrder: patchWorkOrder(payload.workOrder, payload.patch),
    saveStatus: "dirty",
  };
}

export function buildManagerChangeResult(payload: {
  workOrder: WorkOrder;
  actorName: string;
  managerId: string;
  managerName: string;
  text?: ActionFlowText;
  historyText?: ActionFlowHistoryText;
}): WorkOrderActionFlowResult | null {
  const previousManagerName = payload.workOrder.manager || "-";
  const previousManagerId = payload.workOrder.managerId ?? null;
  if (previousManagerId === payload.managerId || isSameComparableText(previousManagerName, payload.managerName)) return null;

  return {
    nextWorkOrder: updateManagerForWorkOrder(payload.workOrder, {
      managerId: payload.managerId,
      managerName: payload.managerName,
    }),
    historyLogs: [
      createManagerChangeHistoryLog(payload.actorName, payload.workOrder.id, previousManagerName, payload.managerName, payload.historyText ?? defaultHistoryText),
    ],
    saveStatus: "dirty",
    toastMessage: (payload.text ?? defaultActionFlowText).managerChangedToast,
  };
}
