import type { DisplayStage, UserProfile, WorkflowAction, WorkflowState } from "@/types/workorder";

export const PRIMARY_FLOW: DisplayStage[] = ["작성중", "검토요청", "발주요청", "생산중", "입고대기", "검수중", "완료"];
export const STAGE_ORDER = PRIMARY_FLOW;

export const ACTIONS_BY_STATE: Record<WorkflowState, WorkflowAction[]> = {
  작성중: [{ label: "검토 요청", nextState: "검토요청", permission: "requestReview" }],
  검토요청: [
    { label: "검토 승인", nextState: "발주요청", permission: "approveReview" },
    { label: "검토 반려", nextState: "작성중", permission: "approveReview" },
  ],
  발주요청: [
    { label: "발주 확정", nextState: "생산중", permission: "confirmPurchase" },
    { label: "발주 반려", nextState: "작성중", permission: "confirmPurchase" },
  ],
  생산중: [
    { label: "입고 대기 전환", nextState: "입고대기", permission: "completeWork" },
    { label: "완료 처리", nextState: "완료", permission: "completeWork" },
  ],
  입고대기: [{ label: "입고 등록", nextState: "검수중", permission: "registerInbound" }],
  검수중: [{ label: "검수 완료", nextState: "완료", permission: "completeInspection" }],
  완료: [],
};

const STAGE_DESCRIPTION: Record<DisplayStage, string> = {
  작성중: "기본 작업지시 내용을 정리하는 단계입니다.",
  검토요청: "디자인과 조건을 검토 요청한 상태입니다.",
  발주요청: "생산 발주를 요청하고 확정 대기 중입니다.",
  생산중: "공정 진행과 생산 일정 관리가 필요한 상태입니다.",
  입고대기: "생산 완료 후 입고 등록을 기다리는 상태입니다.",
  검수중: "입고 후 검수와 재고 확인을 진행하는 상태입니다.",
  완료: "작업이 종료되어 아카이브 관리만 남은 상태입니다.",
};

const STAGE_TONE: Record<WorkflowState, string> = {
  작성중: "bg-stone-100 text-stone-700",
  검토요청: "bg-violet-100 text-violet-700",
  발주요청: "bg-blue-100 text-blue-700",
  생산중: "bg-amber-100 text-amber-700",
  입고대기: "bg-cyan-100 text-cyan-700",
  검수중: "bg-emerald-100 text-emerald-700",
  완료: "bg-stone-900 text-white",
};

export function getDisplayStage(state: WorkflowState): DisplayStage {
  return state;
}

export function getDisplayStageDescription(stage: DisplayStage) {
  return STAGE_DESCRIPTION[stage];
}

export function getStageTone(state: WorkflowState) {
  return STAGE_TONE[state];
}

export function getVisibleStageListByUser(_user: UserProfile, _currentState: WorkflowState) {
  return PRIMARY_FLOW;
}
