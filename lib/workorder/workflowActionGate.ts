import { normalizeRoles } from "@/lib/constants/roles";
import { WORKFLOW_ACTION_TYPE } from "@/lib/constants/workflowActions";
import { WORKFLOW_STATE, isWorkflowState } from "@/lib/constants/workorderStates";
import { WORKORDER_SERVICE_CODE, getWorkOrderWorkflowServiceCode, type WorkOrderServiceCodeValue } from "@/lib/constants/workorderServiceCodes";
import {
  deriveWorkflowStateFromOrderEntries,
  getFactoryOrderRequestValidationMessage,
  getReviewApprovalValidationMessage,
  getReviewApprovalWarningMessage,
  getReviewRequestValidationMessage,
  getReviewRequestWarningMessage,
} from "@/lib/workorder/workflow";
import { getOrderSubmissionSnapshot } from "@/lib/workorder/orderSubmission";
import { normalizeProductionCompositionForWorkflowSnapshot } from "@/lib/workorder/productionCompositionSnapshot";
import type { UserProfile } from "@/types/user";
import type { WorkOrder, WorkflowAction, WorkflowState } from "@/types/workorder";

export type WorkflowActionGateText = {
  factoryOrderFactoryRequiredToast?: string;
  factoryOrderDueDateRequiredToast?: string;
  factoryOrderQuantityRequiredToast?: string;
  factoryOrderLaborCostInvalidToast?: string;
  factoryOrderLossCostInvalidToast?: string;
  factoryOrderRowsRequiredToast?: string;
  factoryOrderRowsInvalidToast?: string;
  reviewRequestZeroCostWarningToast?: string;
  reviewRequestZeroLaborCostWarningToast?: string;
  reviewRequestZeroLossCostWarningToast?: string;
  reviewApprovalZeroCostWarningToast?: string;
  reviewApprovalZeroLaborCostWarningToast?: string;
  reviewApprovalZeroLossCostWarningToast?: string;
};

export type WorkflowReviewGateResult = {
  workOrder: WorkOrder;
  validationMessage: string | null;
  warningMessage: string | null;
  effectiveWorkflowState: WorkflowState;
};

export type WorkflowOrderRequestGateResult = {
  workOrder: WorkOrder;
  validationMessage: string | null;
  currentWorkflowState: WorkflowState;
  factoryName: string;
  quantity: number;
};

export function normalizeWorkOrderForWorkflowGate(workOrder: WorkOrder): WorkOrder {
  return normalizeProductionCompositionForWorkflowSnapshot(workOrder);
}

export function getServiceCodeForWorkflowAction(action: WorkflowAction): WorkOrderServiceCodeValue {
  return getWorkOrderWorkflowServiceCode({
    actionType: action.actionType,
    nextState: action.nextState,
  });
}

export function getProductionCommitServiceCodeForWorkflowAction(action: WorkflowAction): WorkOrderServiceCodeValue {
  return getServiceCodeForWorkflowAction(action);
}

export function getReviewWorkflowGateResult(payload: {
  workOrder: WorkOrder;
  action: WorkflowAction;
  text: WorkflowActionGateText;
}): WorkflowReviewGateResult {
  const workOrder = normalizeWorkOrderForWorkflowGate(payload.workOrder);
  const effectiveWorkflowState = deriveWorkflowStateFromOrderEntries(workOrder.workflowState, workOrder.orderEntries);

  if (isWorkflowState(payload.action.nextState, WORKFLOW_STATE.reviewRequested)) {
    const validationMessage = getReviewRequestValidationMessage({
      workOrder,
      text: payload.text,
    });
    const warningMessage = validationMessage
      ? null
      : getReviewRequestWarningMessage({
          workOrder,
          text: payload.text,
        });

    return {
      workOrder,
      validationMessage,
      warningMessage,
      effectiveWorkflowState,
    };
  }

  if (isWorkflowState(payload.action.nextState, "review_completed")) {
    const validationMessage = getReviewApprovalValidationMessage({
      workOrder,
      text: payload.text,
    });
    const warningMessage = validationMessage
      ? null
      : getReviewApprovalWarningMessage({
          workOrder,
          text: payload.text,
        });

    return {
      workOrder,
      validationMessage,
      warningMessage,
      effectiveWorkflowState,
    };
  }

  return {
    workOrder,
    validationMessage: null,
    warningMessage: null,
    effectiveWorkflowState,
  };
}

export function getFactoryOrderWorkflowGateResult(payload: {
  workOrder: WorkOrder;
  currentUser: UserProfile;
  text: WorkflowActionGateText;
}): WorkflowOrderRequestGateResult {
  const workOrder = normalizeWorkOrderForWorkflowGate(payload.workOrder);
  const currentWorkflowState = deriveWorkflowStateFromOrderEntries(workOrder.workflowState, workOrder.orderEntries);
  const currentRoles = normalizeRoles(payload.currentUser.roles, payload.currentUser.role);
  const submissionSnapshot = getOrderSubmissionSnapshot(workOrder);
  const validationMessage = getFactoryOrderRequestValidationMessage({
    currentRoles,
    currentUser: payload.currentUser,
    currentUserId: payload.currentUser.id,
    workOrder,
    currentWorkflowState,
    factoryName: submissionSnapshot.factoryName,
    quantity: submissionSnapshot.quantity,
    text: payload.text,
  });

  return {
    workOrder,
    validationMessage,
    currentWorkflowState,
    factoryName: submissionSnapshot.factoryName,
    quantity: submissionSnapshot.quantity,
  };
}

export function getInventoryWorkflowServiceCode(action?: WorkflowAction | null): WorkOrderServiceCodeValue {
  if (!action) return WORKORDER_SERVICE_CODE.inventoryImmediateSave;
  return getServiceCodeForWorkflowAction(action);
}
