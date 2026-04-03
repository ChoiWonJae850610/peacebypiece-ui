import type { RoleType } from "@/types/permission";
import type { WorkOrder, WorkflowAction, WorkflowState } from "@/types/workorder";

type WorkflowContext = {
  currentWorkflowState: WorkflowState;
  currentRole: RoleType;
  currentUserId: string;
  workOrder: WorkOrder;
};

export function getAvailableWorkflowActions({ currentWorkflowState, currentRole, currentUserId, workOrder }: WorkflowContext): WorkflowAction[] {
  const createdByCurrentUser = workOrder.createdById === currentUserId;

  switch (currentWorkflowState) {
    case "작성중":
      if (currentRole === "디자이너" && createdByCurrentUser) {
        return [{ label: "검토 요청", nextState: "검토요청" }];
      }
      if (currentRole === "관리자") {
        return [{ label: "발주 요청", nextState: "발주요청" }];
      }
      return [];
    case "검토요청":
      if (currentRole === "관리자") {
        return [
          { label: "반려", nextState: "작성중" },
          { label: "검토 완료", nextState: "검토완료" },
        ];
      }
      return [];
    case "검토완료":
      if (currentRole === "관리자") {
        return [{ label: "발주 요청", nextState: "발주요청" }];
      }
      return [];
    case "발주요청":
      if (currentRole === "관리자") {
        return [{ label: "생산 시작", nextState: "생산중" }];
      }
      return [];
    case "생산중":
      if (currentRole === "입고/검수") {
        return [{ label: "검수 시작", nextState: "검수중" }];
      }
      return [];
    case "검수중":
      if (currentRole === "입고/검수") {
        return [{ label: "검수 완료", nextState: "완료" }];
      }
      return [];
    default:
      return [];
  }
}
