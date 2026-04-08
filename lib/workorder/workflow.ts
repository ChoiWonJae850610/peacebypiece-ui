import { hasRole, normalizeRoles } from "@/lib/constants/roles";
import type { RoleType } from "@/types/permission";
import type { WorkOrder, WorkflowAction, WorkflowState } from "@/types/workorder";

type WorkflowContext = {
  currentWorkflowState: WorkflowState;
  currentRoles: RoleType[];
  currentUserId: string;
  workOrder: WorkOrder;
};

export function getAvailableWorkflowActions({ currentWorkflowState, currentRoles, currentUserId, workOrder }: WorkflowContext): WorkflowAction[] {
  const roles = normalizeRoles(currentRoles);
  const createdByCurrentUser = workOrder.createdById === currentUserId;
  const assignedManagerIsCurrentUser = (workOrder.managerId ?? null) === currentUserId;
  const isDesigner = hasRole(roles, "디자이너");
  const isAdmin = hasRole(roles, "관리자");
  const isInspector = hasRole(roles, "입고/검수");

  switch (currentWorkflowState) {
    case "작성중": {
      const actions: WorkflowAction[] = [];
      if (isDesigner && (createdByCurrentUser || assignedManagerIsCurrentUser)) {
        actions.push({ label: "검토 요청", nextState: "검토요청" });
      }
      if (isAdmin) {
        actions.push({ label: "발주 요청", nextState: "생산중" });
      }
      return actions;
    }
    case "검토요청":
      if (isAdmin) {
        return [
          { label: "반려", nextState: "작성중" },
          { label: "검토 완료", nextState: "검토완료" },
        ];
      }
      return [];
    case "검토완료":
      if (isAdmin) {
        return [{ label: "발주 요청", nextState: "생산중" }];
      }
      return [];
    case "발주요청":
      return [];
    case "생산중":
      if (isInspector || isAdmin) {
        return [{ label: "검수 시작", nextState: "검수중" }];
      }
      return [];
    case "검수중":
      if (isInspector || isAdmin) {
        return [{ label: "검수 완료", nextState: "완료" }];
      }
      return [];
    default:
      return [];
  }
}
