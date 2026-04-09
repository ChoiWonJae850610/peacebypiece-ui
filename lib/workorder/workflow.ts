import {
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
    case "생산중":
      return "검수대기";
    case "검수중":
      return "검수중";
    case "완료":
      return "검수완료";
    default:
      return "발주대기";
  }
}

export function sanitizeOrderInspectionStatus(value: string | undefined | null, workflowState: WorkflowState): OrderInspectionStatus {
  if (value === "발주대기" || value === "검수대기" || value === "검수중" || value === "검수완료") return value;
  return getDefaultInspectionStatusForWorkflowState(workflowState);
}

export function deriveWorkflowStateFromOrderEntries(baseState: WorkflowState, orderEntries?: OrderEntry[]): WorkflowState {
  const entries = orderEntries ?? [];
  if (entries.length === 0) return baseState;
  const statuses = entries.map((item) => sanitizeOrderInspectionStatus(item.inspectionStatus, baseState));
  if (statuses.every((status) => status === "검수완료")) return "완료";
  if (statuses.some((status) => status === "검수중" || status === "검수완료")) return "검수중";
  if (statuses.some((status) => status === "검수대기")) return "생산중";
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

export function canStartInspection(currentRoles: RoleType[]) {
  return canEditInventoryByRoles(currentRoles);
}

export function canCompleteInspection(currentRoles: RoleType[]) {
  return canEditInventoryByRoles(currentRoles);
}

export function canEditInventoryForWorkflow(currentRoles: RoleType[], _currentWorkflowState: WorkflowState) {
  return hasRole(currentRoles, "관리자") || canEditInventoryByRoles(currentRoles);
}

export function getAvailableWorkflowActions({ currentWorkflowState, currentRoles, currentUserId, workOrder }: WorkflowContext): WorkflowAction[] {
  switch (currentWorkflowState) {
    case "작성중": {
      const actions: WorkflowAction[] = [];
      if (canRequestReview({ currentRoles, currentUserId, workOrder })) {
        actions.push({ label: WORKFLOW_ACTION_LABELS.requestReview, nextState: "검토요청" });
      }
      if (canRequestOrder(currentRoles)) {
        actions.push({ label: WORKFLOW_ACTION_LABELS.requestOrder, nextState: "생산중" });
      }
      return actions;
    }
    case "검토요청": {
      if (isAdminRole(currentRoles)) {
        return [
          { label: WORKFLOW_ACTION_LABELS.rejectReview, nextState: "작성중" },
          { label: WORKFLOW_ACTION_LABELS.approveReview, nextState: "검토완료" },
        ];
      }
      if (canRequestReview({ currentRoles, currentUserId, workOrder })) {
        return [{ label: WORKFLOW_ACTION_LABELS.cancelReviewRequest, nextState: "작성중" }];
      }
      return [];
    }
    case "검토완료":
      if (canRequestOrder(currentRoles)) {
        return [{ label: WORKFLOW_ACTION_LABELS.requestOrder, nextState: "생산중" }];
      }
      return [];
    case "발주요청":
      return [];
    case "생산중":
      return [];
    case "검수중":
      return [];
    default:
      return [];
  }
}
