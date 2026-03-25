import type { DisplayStage, UserProfile, WorkflowAction, WorkflowState } from "@/types/workorder";

export const PRIMARY_FLOW: DisplayStage[] = ["작성", "검토", "발주", "생산", "입고/검수", "완료"];
export const STAGE_ORDER: WorkflowState[] = ["작성중", "검토요청", "검토완료", "발주요청", "발주완료", "생산중", "입고대기", "검수중", "완료"];

const DISPLAY_STAGE_BY_STATE: Record<WorkflowState, DisplayStage> = {
  "작성중": "작성",
  "검토요청": "검토",
  "검토완료": "검토",
  "발주요청": "발주",
  "발주완료": "발주",
  "생산중": "생산",
  "입고대기": "입고/검수",
  "검수중": "입고/검수",
  "완료": "완료",
};

const DISPLAY_STAGE_DESCRIPTION: Record<DisplayStage, string> = {
  "작성": "작업지시서 초안 작성 및 기본 정보 정리 단계입니다.",
  "검토": "검토 요청과 승인 준비를 진행하는 단계입니다.",
  "발주": "발주 요청과 발주 확정 흐름을 관리하는 단계입니다.",
  "생산": "생산 진행 현황을 확인하는 단계입니다.",
  "입고/검수": "입고 수량 반영과 검수 이력을 확인하는 단계입니다.",
  "완료": "모든 생산과 검수가 종료된 완료 단계입니다.",
};

export const ACTIONS_BY_STATE: Partial<Record<WorkflowState, WorkflowAction[]>> = {
  "작성중": [{ key: "request-review", label: "검토 요청", nextState: "검토요청", permission: "requestReview" }],
  "검토요청": [{ key: "approve-review", label: "검토 완료", nextState: "검토완료", permission: "approveReview" }],
  "검토완료": [{ key: "request-order", label: "발주 요청", nextState: "발주요청", permission: "requestOrder" }],
  "발주요청": [{ key: "confirm-order", label: "발주 확정", nextState: "발주완료", permission: "confirmOrder" }],
  "발주완료": [{ key: "start-production", label: "생산 시작", nextState: "생산중", permission: "markProduction" }],
  "생산중": [{ key: "wait-inbound", label: "입고 대기", nextState: "입고대기", permission: "markProduction" }],
  "입고대기": [{ key: "start-inspection", label: "검수 시작", nextState: "검수중", permission: "startInspection" }],
  "검수중": [{ key: "complete-work", label: "완료 처리", nextState: "완료", permission: "completeInspection" }],
  "완료": [],
};

export function getDisplayStage(state: WorkflowState): DisplayStage {
  return DISPLAY_STAGE_BY_STATE[state] ?? "작성";
}

export function getDisplayStageDescription(stage: DisplayStage): string {
  return DISPLAY_STAGE_DESCRIPTION[stage] ?? "상태 설명이 준비되지 않았습니다.";
}

export function getStageTone(state: WorkflowState): string {
  switch (state) {
    case "완료": return "bg-emerald-100 text-emerald-700";
    case "검토요청":
    case "검토완료": return "bg-violet-100 text-violet-700";
    case "발주요청":
    case "발주완료": return "bg-blue-100 text-blue-700";
    case "생산중": return "bg-amber-100 text-amber-700";
    case "입고대기":
    case "검수중": return "bg-cyan-100 text-cyan-700";
    default: return "bg-stone-100 text-stone-700";
  }
}

export function getVisibleStageListByUser(_user: UserProfile, _state: WorkflowState): DisplayStage[] {
  return PRIMARY_FLOW;
}
