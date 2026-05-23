import { WORKFLOW_ACTION_TYPE } from "@/lib/constants/workflowActions";
import type { FactoryOrderRequest, UserProfile, WorkOrder, WorkflowAction, WorkflowState } from "@/types/workorder";
import type { InventoryChangeInput, InspectionCompleteInput } from "@/lib/hooks/workorder/useWorkOrderActionTypes";
import {
  applyInventoryAdjustmentToWorkOrder,
  applyWorkflowActionToWorkOrder,
  buildInventoryChanges,
  completeInspectionForWorkOrder,
  patchWorkOrder,
  requestFactoryOrderForWorkOrder,
  updateManagerForWorkOrder,
} from "@/lib/workorder/actions";
import {
  createFactoryOrderRequestHistoryLog,
  createInspectionCompleteHistoryLog,
  createInventoryHistoryLog,
  createManagerChangeHistoryLog,
  createStatusHistoryLog,
  createWorkOrderKindChangeHistoryLog,
} from "@/lib/workorder/history/builders";
import { pruneDraftRows, shouldPruneDraftRowsForWorkflowState } from "@/lib/workorder/draftRows";
import { getWorkOrderDisplayTitle } from "@/lib/workorder/presentation/workOrderPresentation";
import { getWorkOrderKind } from "@/lib/workorder/reorder/helpers";
import { isSameComparableText } from "@/lib/utils/compare";
import { defaultActionFlowText, defaultHistoryText, type ActionFlowHistoryText, type ActionFlowText, type WorkOrderActionFlowResult } from "@/lib/workorder/actionFlow/shared";
import { canOpenInspectionModalInWorkflow, isWorkflowStateBefore, isWorkflowStateReviewLocked } from "@/lib/constants/workorderStates";
import { ROLE } from "@/lib/constants/roles";
import { getWorkflowStateAfterManagerChangeByPolicy } from "@/lib/workorder/workflowPolicy";
import type { RoleType } from "@/types/permission";

export function buildWorkflowActionResult(payload: {
  workOrder: WorkOrder;
  action: WorkflowAction;
  actorName: string;
  text?: ActionFlowText;
  historyText?: ActionFlowHistoryText;
  workflowStateLabels?: Record<string, string>;
  toastMessageOverride?: string;
  rejectionReason?: string | null;
  rejectedByUserId?: string | null;
}): WorkOrderActionFlowResult {
  const targetWorkOrder = shouldPruneDraftRowsForWorkflowState(payload.action.nextState)
    ? pruneDraftRows(payload.workOrder)
    : payload.workOrder;

  const transitionedWorkOrder = applyWorkflowActionToWorkOrder(targetWorkOrder, payload.action);
  const nextWorkOrder = payload.action.actionType === WORKFLOW_ACTION_TYPE.rejectReview
    ? {
        ...transitionedWorkOrder,
        rejectionReason: payload.rejectionReason?.trim() || null,
        rejectedAt: new Date().toISOString(),
        rejectedByUserId: payload.rejectedByUserId ?? null,
        rejectedByName: payload.actorName,
      }
    : {
        ...transitionedWorkOrder,
        rejectionReason: null,
        rejectedAt: null,
        rejectedByUserId: null,
        rejectedByName: null,
      };

  return {
    nextWorkOrder,
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
    saveStatus: isWorkflowStateReviewLocked(payload.action.nextState, true) ? "dirty" : undefined,
    openInventoryEditor: canOpenInspectionModalInWorkflow(payload.action.nextState) && isWorkflowStateBefore(payload.workOrder.workflowState, "completed"),
    toastMessage: payload.toastMessageOverride ?? (payload.text ?? defaultActionFlowText).workflowChangedToastFormat.replace("{label}", payload.action.label),
  };
}

export function buildFactoryOrderRequestResult(payload: {
  workOrder: WorkOrder;
  actorName: string;
  input: FactoryOrderRequest;
  text?: ActionFlowText;
  historyText?: ActionFlowHistoryText;
}): WorkOrderActionFlowResult | null {
  return {
    nextWorkOrder: requestFactoryOrderForWorkOrder(payload.workOrder, payload.input),
    historyLogs: [
      createFactoryOrderRequestHistoryLog(payload.actorName, payload.workOrder.id, {
        factoryName: payload.input.factoryName,
        quantity: payload.input.quantity,
        requestedAt: payload.input.requestedAt,
      }, payload.historyText ?? defaultHistoryText),
    ],
    saveStatus: "dirty",
    toastMessage: (payload.text ?? defaultActionFlowText).factoryOrderRequestedToast,
  };
}

export function buildInventoryApplyResult(payload: {
  workOrder: WorkOrder;
  actorName: string;
  input: InventoryChangeInput;
  text?: ActionFlowText;
  historyText?: ActionFlowHistoryText;
}): WorkOrderActionFlowResult | null {
  const changes = buildInventoryChanges(payload.input);
  if (changes.length === 0) return null;

  return {
    nextWorkOrder: applyInventoryAdjustmentToWorkOrder(payload.workOrder, { changes }),
    appliedChanges: changes,
    toastMessage: (payload.text ?? defaultActionFlowText).inventoryAppliedToast,
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
  actorName?: string;
  historyText?: ActionFlowHistoryText;
}): WorkOrderActionFlowResult {
  const nextWorkOrder = patchWorkOrder(payload.workOrder, payload.patch);
  const hasKindChanged = getWorkOrderKind(payload.workOrder) !== getWorkOrderKind(nextWorkOrder)
    || Boolean(payload.workOrder.isDefectOrder) !== Boolean(nextWorkOrder.isDefectOrder)
    || getWorkOrderDisplayTitle(payload.workOrder) !== getWorkOrderDisplayTitle(nextWorkOrder);

  return {
    nextWorkOrder,
    historyLogs: hasKindChanged && payload.actorName ? [
      createWorkOrderKindChangeHistoryLog(
        payload.actorName,
        payload.workOrder.id,
        {
          fromTitle: getWorkOrderDisplayTitle(payload.workOrder),
          toTitle: getWorkOrderDisplayTitle(nextWorkOrder),
          fromKind: getWorkOrderKind(payload.workOrder),
          toKind: getWorkOrderKind(nextWorkOrder),
        },
        payload.historyText ?? defaultHistoryText,
      ),
    ] : undefined,
    saveStatus: "dirty",
  };
}

export function getWorkflowStateAfterManagerChange(payload: {
  currentWorkflowState: WorkflowState;
  nextManagerRole: RoleType;
}): WorkflowState {
  return getWorkflowStateAfterManagerChangeByPolicy(payload);
}

export function buildManagerChangeResult(payload: {
  workOrder: WorkOrder;
  actorName: string;
  managerId: string;
  managerName: string;
  managerRole?: RoleType;
  text?: ActionFlowText;
  historyText?: ActionFlowHistoryText;
  workflowStateLabels?: Record<string, string>;
}): WorkOrderActionFlowResult | null {
  const previousManagerName = payload.workOrder.manager || "-";
  const previousManagerId = payload.workOrder.managerId ?? null;
  if (previousManagerId === payload.managerId || isSameComparableText(previousManagerName, payload.managerName)) return null;

  const nextWorkflowState = getWorkflowStateAfterManagerChange({
    currentWorkflowState: payload.workOrder.workflowState,
    nextManagerRole: payload.managerRole ?? ROLE.designer,
  });
  const nextWorkOrder = {
    ...updateManagerForWorkOrder(payload.workOrder, {
      managerId: payload.managerId,
      managerName: payload.managerName,
    }),
    workflowState: nextWorkflowState,
  };
  const historyLogs = [
    createManagerChangeHistoryLog(payload.actorName, payload.workOrder.id, previousManagerName, payload.managerName, payload.historyText ?? defaultHistoryText),
  ];

  if (nextWorkflowState !== payload.workOrder.workflowState) {
    historyLogs.push(createStatusHistoryLog(
      payload.actorName,
      payload.workOrder.id,
      payload.workflowStateLabels?.[payload.workOrder.workflowState] ?? payload.workOrder.workflowState,
      payload.workflowStateLabels?.[nextWorkflowState] ?? nextWorkflowState,
      payload.text?.managerChangedToast ?? defaultActionFlowText.managerChangedToast,
      payload.historyText ?? defaultHistoryText,
    ));
  }

  return {
    nextWorkOrder,
    historyLogs,
    saveStatus: "dirty",
    toastMessage: (payload.text ?? defaultActionFlowText).managerChangedToast,
  };
}
