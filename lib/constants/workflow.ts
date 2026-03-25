import type { DisplayStage, UserProfile, WorkflowAction, WorkflowState } from "@/types/workorder";

export const PRIMARY_FLOW: DisplayStage[] = ["작성", "검토", "발주", "생산", "입고", "완료"];
export const STAGE_ORDER = PRIMARY_FLOW;

export const ACTIONS_BY_STATE: Record<WorkflowState, WorkflowAction[]> = {
  요청전: [
    { id: "startDraft", label: "작성 시작", nextState: "작성중", permission: "viewProductionDetails" },
  ],
  작성중: [
    { id: "requestReview", label: "검토 요청", nextState: "진행중", permission: "viewProductionDetails" },
  ],
  진행중: [
    { id: "requestOrder", label: "발주 요청", nextState: "발주요청", permission: "viewProductionDetails" },
    { id: "rejectReview", label: "검토 반려", nextState: "작성중", permission: "viewProductionDetails" },
  ],
  발주요청: [
    { id: "confirmOrder", label: "발주 확정", nextState: "발주완료", permission: "permissionManage" },
  ],
  발주완료: [
    { id: "startProduction", label: "생산 시작", nextState: "생산중", permission: "viewProductionDetails" },
  ],
  생산중: [
    { id: "completeInbound", label: "입고 완료", nextState: "입고완료", permission: "inventoryEdit" },
  ],
  입고완료: [
    { id: "finishWork", label: "완료 처리", nextState: "완료", permission: "inventoryEdit" },
  ],
  완료: [],
};

export function getDisplayStage(state: WorkflowState): DisplayStage {
  switch (state) {
    case "요청전":
    case "작성중":
      return "작성";
    case "진행중":
      return "검토";
    case "발주요청":
    case "발주완료":
      return "발주";
    case "생산중":
      return "생산";
    case "입고완료":
      return "입고";
    case "완료":
    default:
      return "완료";
  }
}

export function getDisplayStageDescription(stage: DisplayStage) {
  switch (stage) {
    case "작성":
      return "기본 정보와 원단/부자재, 외주 공정 구성을 정리하는 단계입니다.";
    case "검토":
      return "검토 요청 이후 수정 여부와 발주 준비 상태를 확인하는 단계입니다.";
    case "발주":
      return "발주 요청과 확정 진행을 확인하는 단계입니다.";
    case "생산":
      return "생산 진행과 수량, 비용을 점검하는 단계입니다.";
    case "입고":
      return "입고 및 검수 처리 후 재고 반영을 확인하는 단계입니다.";
    case "완료":
      return "검수와 후속 정리가 끝난 완료 단계입니다.";
  }
}

export function getStageTone(state: WorkflowState) {
  switch (state) {
    case "요청전":
    case "작성중":
      return "bg-stone-100 text-stone-700";
    case "진행중":
      return "bg-blue-100 text-blue-700";
    case "발주요청":
      return "bg-violet-100 text-violet-700";
    case "발주완료":
      return "bg-cyan-100 text-cyan-700";
    case "생산중":
      return "bg-amber-100 text-amber-700";
    case "입고완료":
      return "bg-emerald-100 text-emerald-700";
    case "완료":
      return "bg-rose-100 text-rose-700";
  }
}

export function getVisibleStageListByUser(user: UserProfile, currentState: WorkflowState): DisplayStage[] {
  const currentStage = getDisplayStage(currentState);
  if (user.team === "관리자") return PRIMARY_FLOW;
  if (user.team === "입고/검수") return PRIMARY_FLOW.filter((stage) => ["생산", "입고", "완료"].includes(stage));
  const currentIndex = PRIMARY_FLOW.indexOf(currentStage);
  return PRIMARY_FLOW.filter((_, index) => index <= Math.max(currentIndex, 2));
}
