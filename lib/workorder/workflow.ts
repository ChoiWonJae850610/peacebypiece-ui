import {
  LEGACY_ORDER_INSPECTION_STATUS_MAP,
  ORDER_INSPECTION_STATUSES,
} from "@/lib/constants/workorderStates";
import {
  ROLE,
  canEditInventoryByRoles,
  hasRole,
  isAdminRole,
  isDesignerRole,
  normalizeRoles,
} from "@/lib/constants/roles";
import { WORKFLOW_ACTION_LABELS } from "@/lib/constants/workflow";
import type { RoleType } from "@/types/permission";
import type { OrderEntry, OrderInspectionStatus, WorkOrder, WorkflowAction, WorkflowState } from "@/types/workorder";

export type WorkflowContext = {
  currentWorkflowState: WorkflowState;
  currentRoles: RoleType[];
  currentUserId: string;
  workOrder: WorkOrder;
};

export function getDefaultInspectionStatusForWorkflowState(workflowState: WorkflowState): OrderInspectionStatus {
  switch (workflowState) {
    case "in_production":
      return "inspection_pending";
    case "in_inspection":
      return "inspection_in_progress";
    case "completed":
      return "inspection_completed";
    default:
      return "order_pending";
  }
}

export function sanitizeOrderInspectionStatus(value: string | undefined | null, workflowState: WorkflowState): OrderInspectionStatus {
  if (!value) return getDefaultInspectionStatusForWorkflowState(workflowState);
  if ((ORDER_INSPECTION_STATUSES as readonly string[]).includes(value)) return value as OrderInspectionStatus;
  if (value in LEGACY_ORDER_INSPECTION_STATUS_MAP) return LEGACY_ORDER_INSPECTION_STATUS_MAP[value as keyof typeof LEGACY_ORDER_INSPECTION_STATUS_MAP];
  return getDefaultInspectionStatusForWorkflowState(workflowState);
}

export function deriveWorkflowStateFromOrderEntries(baseState: WorkflowState, orderEntries?: OrderEntry[]): WorkflowState {
  const entries = orderEntries ?? [];
  if (entries.length === 0) return baseState;
  const statuses = entries.map((item) => sanitizeOrderInspectionStatus(item.inspectionStatus, baseState));
  if (statuses.every((status) => status === "inspection_completed")) return "completed";
  if (statuses.some((status) => status === "inspection_in_progress" || status === "inspection_completed")) return "in_inspection";
  if (statuses.some((status) => status === "inspection_pending")) return "in_production";
  return baseState;
}

export function canManageWorkOrderManager(currentRoles: RoleType[], _currentWorkflowState: WorkflowState) {
  return isAdminRole(currentRoles);
}

export function canRequestReview({ currentRoles, currentUserId, workOrder }: Pick<WorkflowContext, "currentRoles" | "currentUserId" | "workOrder">) {
  const roles = normalizeRoles(currentRoles);
  const createdByCurrentUser = workOrder.createdById === currentUserId;
  const assignedManagerIsCurrentUser = (workOrder.managerId ?? null) === currentUserId;
  return isDesignerRole(roles) && (createdByCurrentUser || assignedManagerIsCurrentUser);
}

export function canRequestOrder(currentRoles: RoleType[]) {
  return isAdminRole(currentRoles);
}

export function canRequestFactoryOrder(payload: {
  currentRoles: RoleType[];
  workOrder: WorkOrder;
  currentWorkflowState: WorkflowState;
}) {
  return isAdminRole(payload.currentRoles)
    && payload.currentWorkflowState === "review_approved"
    && !payload.workOrder.factoryOrderRequest;
}

export function getFactoryOrderRequestValidationMessage(payload: {
  currentRoles: RoleType[];
  workOrder: WorkOrder;
  currentWorkflowState: WorkflowState;
  factoryName?: string | null;
  quantity?: number | null;
  text: {
    factoryOrderRequiresApprovalToast?: string;
    factoryOrderAlreadyRequestedToast?: string;
    factoryOrderFactoryRequiredToast?: string;
    factoryOrderQuantityRequiredToast?: string;
    factoryOrderNotAllowedToast?: string;
  };
}) {
  if (!isAdminRole(payload.currentRoles)) {
    return payload.text.factoryOrderNotAllowedToast ?? null;
  }
  if (payload.currentWorkflowState !== "review_approved") {
    return payload.text.factoryOrderRequiresApprovalToast ?? null;
  }
  if (payload.workOrder.factoryOrderRequest) {
    return payload.text.factoryOrderAlreadyRequestedToast ?? null;
  }

  const normalizedFactoryName = String(payload.factoryName ?? "").trim();
  const normalizedQuantity = Math.max(0, Number(payload.quantity) || 0);

  if (!normalizedFactoryName) {
    return payload.text.factoryOrderFactoryRequiredToast ?? null;
  }
  if (normalizedQuantity <= 0) {
    return payload.text.factoryOrderQuantityRequiredToast ?? null;
  }

  return null;
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

export function getAvailableWorkflowActions({ currentWorkflowState, currentRoles, currentUserId, workOrder }: WorkflowContext): WorkflowAction[] {
  switch (currentWorkflowState) {
    case "draft": {
      const actions: WorkflowAction[] = [];
      if (canRequestReview({ currentRoles, currentUserId, workOrder })) {
        actions.push({ label: WORKFLOW_ACTION_LABELS.requestReview, nextState: "review_requested" });
      }
      return actions;
    }
    case "review_requested": {
      if (isAdminRole(currentRoles)) {
        return [
          { label: WORKFLOW_ACTION_LABELS.rejectReview, nextState: "draft" },
          { label: WORKFLOW_ACTION_LABELS.approveReview, nextState: "review_approved" },
        ];
      }
      if (canRequestReview({ currentRoles, currentUserId, workOrder })) {
        return [{ label: WORKFLOW_ACTION_LABELS.cancelReviewRequest, nextState: "draft" }];
      }
      return [];
    }
    case "review_approved":
      if (isAdminRole(currentRoles)) {
        return [
          { label: WORKFLOW_ACTION_LABELS.cancelReviewApproval, nextState: "review_requested" },
          ...(canRequestFactoryOrder({ currentRoles, workOrder, currentWorkflowState })
            ? [{ label: WORKFLOW_ACTION_LABELS.requestOrder, nextState: "order_requested" } satisfies WorkflowAction]
            : []),
        ];
      }
      return [];
    case "order_requested":
    case "in_production":
    case "in_inspection":
    default:
      return [];
  }
}
