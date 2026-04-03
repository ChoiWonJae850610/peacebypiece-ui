import type { RoleType } from "@/types/permission";
import type { WorkflowAction, WorkflowState } from "@/types/workorder";

export const ACTIONS_BY_STATE: Record<WorkflowState, Partial<Record<RoleType, WorkflowAction[]>>> = {
  "작성중": {
    "디자이너": [{ label: "검토 요청", nextState: "검토요청" }],
    "관리자": [{ label: "검토 요청", nextState: "검토요청" }],
  },
  "검토요청": {
    "관리자": [
      { label: "작성중으로 되돌리기", nextState: "작성중" },
      { label: "발주 요청", nextState: "발주요청" },
    ],
  },
  "발주요청": {
    "관리자": [{ label: "생산 시작", nextState: "생산중" }],
  },
  "생산중": {
    "관리자": [{ label: "입고 대기", nextState: "입고대기" }],
  },
  "입고대기": {
    "입고/검수": [{ label: "검수 시작", nextState: "검수중" }],
    "관리자": [{ label: "검수 시작", nextState: "검수중" }],
  },
  "검수중": {
    "입고/검수": [{ label: "완료", nextState: "완료" }],
    "관리자": [{ label: "완료", nextState: "완료" }],
  },
  "완료": {},
};

export function getAvailableWorkflowActions(currentWorkflowState: WorkflowState, currentRole: RoleType) {
  return ACTIONS_BY_STATE[currentWorkflowState]?.[currentRole] ?? [];
}
