import {
  LEGACY_ORDER_INSPECTION_STATUS_MAP,
  WORKFLOW_STATE,
  canRequestFactoryOrderInWorkflow,
  getDefaultOrderInspectionStatusForWorkflowState,
  isOrderInspectionActive,
  isOrderInspectionCompleted,
  isOrderInspectionStatus,
} from "@/lib/constants/workorderStates";
import {
  ROLE,
  canEditInventoryByRoles,
  hasRole,
  isAdminRole,
} from "@/lib/constants/roles";
import { hasMemberPermission } from "@/lib/permissions";
import type { RoleType } from "@/types/permission";
import type { UserProfile } from "@/types/user";
import {
  canRequestFactoryOrderByPolicy,
  canRequestReviewByPolicy,
  getAvailableWorkflowActionsByPolicy,
  getReviewApprovalCancelNextStateByPolicy,
} from "@/lib/workorder/workflowPolicy";
import {
  getFactoryOrderRowsValidationMessage,
  getOrderSubmissionSnapshot,
  hasValidOrderFactoryName,
  normalizeOrderFactoryName,
} from "@/lib/workorder/orderSubmission";
import type { OrderEntry, OrderInspectionStatus, WorkOrder, WorkflowAction, WorkflowState } from "@/types/workorder";

export type WorkflowContext = {
  currentWorkflowState: WorkflowState;
  currentRoles: RoleType[];
  currentUserId: string;
  currentUser?: UserProfile | null;
  workOrder: WorkOrder;
  users?: UserProfile[];
};

export function getDefaultInspectionStatusForWorkflowState(workflowState: WorkflowState): OrderInspectionStatus {
  return getDefaultOrderInspectionStatusForWorkflowState(workflowState);
}

export function sanitizeOrderInspectionStatus(value: string | undefined | null, workflowState: WorkflowState): OrderInspectionStatus {
  if (!value) return getDefaultInspectionStatusForWorkflowState(workflowState);
  if (isOrderInspectionStatus(value)) return value;
  if (value in LEGACY_ORDER_INSPECTION_STATUS_MAP) return LEGACY_ORDER_INSPECTION_STATUS_MAP[value as keyof typeof LEGACY_ORDER_INSPECTION_STATUS_MAP];
  return getDefaultInspectionStatusForWorkflowState(workflowState);
}

export function deriveWorkflowStateFromOrderEntries(baseState: WorkflowState, orderEntries?: OrderEntry[]): WorkflowState {
  const entries = orderEntries ?? [];
  if (entries.length === 0) return baseState;
  const statuses = entries.map((item) => sanitizeOrderInspectionStatus(item.inspectionStatus, baseState));
  if (statuses.every(isOrderInspectionCompleted)) return WORKFLOW_STATE.completed;
  if (statuses.some(isOrderInspectionActive)) {
    return WORKFLOW_STATE.inspection;
  }
  return baseState;
}

export function canManageWorkOrderManager(currentRoles: RoleType[], currentWorkflowState: WorkflowState) {
  return isAdminRole(currentRoles) && currentWorkflowState !== WORKFLOW_STATE.materialOrderPending && currentWorkflowState !== WORKFLOW_STATE.inspection && currentWorkflowState !== WORKFLOW_STATE.completed;
}

export function canRequestReview(payload: Pick<WorkflowContext, "currentRoles" | "currentUser" | "currentUserId" | "workOrder">) {
  return canRequestReviewByPolicy(payload);
}

export function canRequestOrder(currentRoles: RoleType[], currentUser?: UserProfile | null) {
  return isAdminRole(currentRoles) || Boolean(
    currentUser && hasMemberPermission(currentUser, "workorder.status.order"),
  );
}

export function canRequestFactoryOrder(payload: {
  currentRoles: RoleType[];
  currentUser?: UserProfile | null;
  currentUserId?: string;
  workOrder: WorkOrder;
  currentWorkflowState: WorkflowState;
}) {
  return canRequestFactoryOrderByPolicy({
    ...payload,
    currentUserId: payload.currentUserId ?? payload.currentUser?.id ?? "",
  });
}

function getWorkOrderSubmissionValidationMessage(workOrder: WorkOrder, text: {
  factoryOrderFactoryRequiredToast?: string;
  factoryOrderDueDateRequiredToast?: string;
  factoryOrderQuantityRequiredToast?: string;
  factoryOrderLaborCostInvalidToast?: string;
  factoryOrderLossCostInvalidToast?: string;
  factoryOrderRowsRequiredToast?: string;
  factoryOrderRowsInvalidToast?: string;
}) {
  const rowValidationMessage = getFactoryOrderRowsValidationMessage(workOrder, text);
  if (rowValidationMessage) return rowValidationMessage;

  const { factoryName, quantity, laborCost, lossCost } = getOrderSubmissionSnapshot(workOrder);

  if (!hasValidOrderFactoryName(factoryName)) {
    return text.factoryOrderFactoryRequiredToast ?? null;
  }
  if (!Number.isFinite(quantity) || quantity < 1) {
    return text.factoryOrderQuantityRequiredToast ?? null;
  }
  if (!Number.isFinite(laborCost) || laborCost < 0) {
    return text.factoryOrderLaborCostInvalidToast ?? null;
  }
  if (!Number.isFinite(lossCost) || lossCost < 0) {
    return text.factoryOrderLossCostInvalidToast ?? null;
  }

  return null;
}

export function getReviewRequestValidationMessage(payload: { workOrder: WorkOrder; text: { factoryOrderFactoryRequiredToast?: string; factoryOrderDueDateRequiredToast?: string; factoryOrderQuantityRequiredToast?: string; factoryOrderLaborCostInvalidToast?: string; factoryOrderLossCostInvalidToast?: string; factoryOrderRowsRequiredToast?: string; factoryOrderRowsInvalidToast?: string; }; }) {
  return getWorkOrderSubmissionValidationMessage(payload.workOrder, payload.text);
}

export function getReviewApprovalValidationMessage(payload: { workOrder: WorkOrder; text: { factoryOrderFactoryRequiredToast?: string; factoryOrderDueDateRequiredToast?: string; factoryOrderQuantityRequiredToast?: string; factoryOrderLaborCostInvalidToast?: string; factoryOrderLossCostInvalidToast?: string; factoryOrderRowsRequiredToast?: string; factoryOrderRowsInvalidToast?: string; }; }) {
  return getWorkOrderSubmissionValidationMessage(payload.workOrder, payload.text);
}

type ReviewWorkflowWarningText = {
  reviewRequestZeroCostWarningToast?: string;
  reviewRequestZeroLaborCostWarningToast?: string;
  reviewRequestZeroLossCostWarningToast?: string;
  reviewApprovalZeroCostWarningToast?: string;
  reviewApprovalZeroLaborCostWarningToast?: string;
  reviewApprovalZeroLossCostWarningToast?: string;
};

function getReviewWorkflowWarningMessage(payload: { workOrder: WorkOrder; text: ReviewWorkflowWarningText; mode: "request" | "approval"; }) {
  const { laborCost, lossCost } = getOrderSubmissionSnapshot(payload.workOrder);
  const laborIsZero = Number.isFinite(laborCost) && laborCost == 0;
  const lossIsZero = Number.isFinite(lossCost) && lossCost == 0;
  const isApproval = payload.mode === "approval";

  if (laborIsZero && lossIsZero) {
    return isApproval
      ? payload.text.reviewApprovalZeroCostWarningToast ?? payload.text.reviewRequestZeroCostWarningToast ?? null
      : payload.text.reviewRequestZeroCostWarningToast ?? null;
  }
  if (laborIsZero) {
    return isApproval
      ? payload.text.reviewApprovalZeroLaborCostWarningToast ?? payload.text.reviewRequestZeroLaborCostWarningToast ?? null
      : payload.text.reviewRequestZeroLaborCostWarningToast ?? null;
  }
  if (lossIsZero) {
    return isApproval
      ? payload.text.reviewApprovalZeroLossCostWarningToast ?? payload.text.reviewRequestZeroLossCostWarningToast ?? null
      : payload.text.reviewRequestZeroLossCostWarningToast ?? null;
  }
  return null;
}

export function getReviewRequestWarningMessage(payload: { workOrder: WorkOrder; text: ReviewWorkflowWarningText }) {
  return getReviewWorkflowWarningMessage({ ...payload, mode: "request" });
}

export function getReviewApprovalWarningMessage(payload: { workOrder: WorkOrder; text: ReviewWorkflowWarningText }) {
  return getReviewWorkflowWarningMessage({ ...payload, mode: "approval" });
}

export function getFactoryOrderRequestValidationMessage(payload: {
  currentRoles: RoleType[];
  currentUser?: UserProfile | null;
  currentUserId?: string;
  workOrder: WorkOrder;
  currentWorkflowState: WorkflowState;
  factoryName: string;
  quantity: number;
  text: {
    factoryOrderFactoryRequiredToast?: string;
    factoryOrderQuantityRequiredToast?: string;
    factoryOrderAdminOnlyToast?: string;
    factoryOrderReviewApprovedOnlyToast?: string;
    factoryOrderDueDateRequiredToast?: string;
    factoryOrderLaborCostInvalidToast?: string;
    factoryOrderLossCostInvalidToast?: string;
    factoryOrderRowsRequiredToast?: string;
    factoryOrderRowsInvalidToast?: string;
  };
}) {
  const canRequestByPermission = canRequestFactoryOrder({
    currentRoles: payload.currentRoles,
    currentUser: payload.currentUser,
    currentUserId: payload.currentUserId,
    workOrder: payload.workOrder,
    currentWorkflowState: payload.currentWorkflowState,
  });
  if (!canRequestByPermission) {
    return payload.text.factoryOrderAdminOnlyToast ?? null;
  }
  if (isAdminRole(payload.currentRoles) && !canRequestFactoryOrderInWorkflow(payload.currentWorkflowState)) {
    return payload.text.factoryOrderReviewApprovedOnlyToast ?? null;
  }
  const rowValidationMessage = getFactoryOrderRowsValidationMessage(payload.workOrder, payload.text);
  if (rowValidationMessage) return rowValidationMessage;
  if (!hasValidOrderFactoryName(payload.factoryName)) {
    return payload.text.factoryOrderFactoryRequiredToast ?? null;
  }
  if (!Number.isFinite(payload.quantity) || payload.quantity < 1) {
    return payload.text.factoryOrderQuantityRequiredToast ?? null;
  }
  return null;
}

export function getNormalizedFactoryOrderPayload(payload: { factoryName: string; quantity: number }) {
  return {
    factoryName: normalizeOrderFactoryName(payload.factoryName),
    quantity: Math.max(0, Math.floor(payload.quantity || 0)),
  };
}

export function canStartInspection(currentRoles: RoleType[]) {
  return canEditInventoryByRoles(currentRoles);
}

export function canCompleteInspection(currentRoles: RoleType[]) {
  return canEditInventoryByRoles(currentRoles);
}

export function canEditInventoryForWorkflow(currentRoles: RoleType[], _currentWorkflowState: WorkflowState) {
  return hasRole(currentRoles, ROLE.admin) || canEditInventoryByRoles(currentRoles);
}

export function getReviewApprovalCancelNextState(workOrder: WorkOrder, users: UserProfile[] = []): WorkflowState {
  return getReviewApprovalCancelNextStateByPolicy(workOrder, users);
}

export function getAvailableWorkflowActions(context: WorkflowContext): WorkflowAction[] {
  return getAvailableWorkflowActionsByPolicy(context);
}
