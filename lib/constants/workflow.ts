import type { DisplayStage, UserProfile, WorkflowAction, WorkflowState } from "@/types/workorder";

export const ACTIONS_BY_STATE: Record<WorkflowState, WorkflowAction[]> = {
  작성중: [
    { label: "검토 요청", nextState: "검토요청", permission: "requestReview" },
  ],
  검토요청: [
    { label: "발주 요청", nextState: "발주요청", permission: "requestOrder" },
    { label: "반려", nextState: "작성중", permission: "rejectWork" },
  ],
  발주요청: [
    { label: "입고 대기", nextState: "입고대기", permission: "markInboundReady" },
    { label: "반려", nextState: "작성중", permission: "rejectWork" },
  ],
  입고대기: [
    { label: "검수 시작", nextState: "검수중", permission: "startInspection" },
  ],
  검수중: [
    { label: "생산 시작", nextState: "생산중", permission: "startProduction" },
    { label: "반려", nextState: "발주요청", permission: "rejectWork" },
  ],
  생산중: [
    { label: "완료 처리", nextState: "완료", permission: "completeWork" },
  ],
  완료: [],
};

const DISPLAY_STAGE_BY_STATE: Record<WorkflowState, DisplayStage> = {
  작성중: "작성",
  검토요청: "검토",
  발주요청: "발주",
  입고대기: "입고",
  검수중: "입고",
  생산중: "생산",
  완료: "완료",
};

const STAGE_LIST: DisplayStage[] = ["작성", "검토", "발주", "입고", "생산", "완료"];

export function getDisplayStage(state: WorkflowState): DisplayStage {
  return DISPLAY_STAGE_BY_STATE[state];
}

export function getVisibleStageListByUser(_user: UserProfile, _state: WorkflowState): DisplayStage[] {
  return STAGE_LIST;
}

export function getDisplayStageDescription(stage: DisplayStage): string {
  switch (stage) {
    case "작성": return "기본 정보와 생산 상세를 정리하는 단계입니다.";
    case "검토": return "검토 요청 후 수량과 생산 조건을 확인하는 단계입니다.";
    case "발주": return "원단, 부자재, 외주 공정을 발주 대상으로 정리하는 단계입니다.";
    case "입고": return "입고 처리와 검수 흐름을 관리하는 단계입니다.";
    case "생산": return "외주 및 생산 진행 상황을 추적하는 단계입니다.";
    case "완료": return "검수와 마감이 끝난 완료 상태입니다.";
  }
}

export function getStageTone(state: WorkflowState): string {
  switch (state) {
    case "작성중": return "bg-stone-200 text-stone-700";
    case "검토요청": return "bg-violet-100 text-violet-700";
    case "발주요청": return "bg-blue-100 text-blue-700";
    case "입고대기": return "bg-amber-100 text-amber-700";
    case "검수중": return "bg-cyan-100 text-cyan-700";
    case "생산중": return "bg-fuchsia-100 text-fuchsia-700";
    case "완료": return "bg-emerald-100 text-emerald-700";
  }
}
