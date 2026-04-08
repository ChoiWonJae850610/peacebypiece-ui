import {
  canEditInventoryByRoles,
  hasRole,
  isAdminRole,
  isDesignerRole,
  normalizeRoles,
} from "@/lib/constants/roles";
import { WORKFLOW_ACTION_LABELS } from "@/lib/constants/workflow";
import type { RoleType } from "@/types/permission";
import type { WorkOrder, WorkflowAction, WorkflowState } from "@/types/workorder";

export type WorkflowContext = {
  currentWorkflowState: WorkflowState;
  currentRoles: RoleType[];
  currentUserId: string;
  workOrder: WorkOrder;
};

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
    case "검토요청":
      if (isAdminRole(currentRoles)) {
        return [
          { label: WORKFLOW_ACTION_LABELS.rejectReview, nextState: "작성중" },
          { label: WORKFLOW_ACTION_LABELS.approveReview, nextState: "검토완료" },
        ];
      }
      return [];
    case "검토완료":
      if (canRequestOrder(currentRoles)) {
        return [{ label: WORKFLOW_ACTION_LABELS.requestOrder, nextState: "생산중" }];
      }
      return [];
    case "발주요청":
      return [];
    case "생산중":
      if (canStartInspection(currentRoles)) {
        return [{ label: WORKFLOW_ACTION_LABELS.startInspection, nextState: "검수중" }];
      }
      return [];
    case "검수중":
      if (canCompleteInspection(currentRoles)) {
        return [{ label: WORKFLOW_ACTION_LABELS.completeInspection, nextState: "완료" }];
      }
      return [];
    default:
      return [];
  }
}
