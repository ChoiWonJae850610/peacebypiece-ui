import { DISPLAY_STAGES } from "@/types/workflow";
import type { DisplayStage, WorkflowState } from "@/types/workflow";

export const VISIBLE_STAGES: DisplayStage[] = DISPLAY_STAGES;

export function getDisplayStageFromWorkflowState(state: WorkflowState): DisplayStage {
  switch (state) {
    case "생산중":
      return "발주요청";
    case "검수중":
      return "검수";
    default:
      return state as DisplayStage;
  }
}

export function getStageTone(state: WorkflowState | DisplayStage) {
  switch (state) {
    case "완료":
      return "bg-stone-900 text-white";
    case "검토요청":
      return "bg-violet-100 text-violet-700";
    case "검토완료":
      return "bg-fuchsia-100 text-fuchsia-700";
    case "발주요청":
    case "생산중":
      return "bg-amber-100 text-amber-700";
    case "검수":
    case "검수중":
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-stone-100 text-stone-700";
  }
}

export function getStageDotTone(state: WorkflowState | DisplayStage) {
  switch (state) {
    case "완료":
      return "bg-white";
    case "검토요청":
      return "bg-violet-500";
    case "검토완료":
      return "bg-fuchsia-500";
    case "발주요청":
    case "생산중":
      return "bg-amber-500";
    case "검수":
    case "검수중":
      return "bg-emerald-500";
    default:
      return "bg-stone-500";
  }
}

export function getStageTextTone(state: WorkflowState | DisplayStage) {
  switch (state) {
    case "완료":
      return "text-stone-900";
    case "검토요청":
      return "text-violet-700";
    case "검토완료":
      return "text-fuchsia-700";
    case "발주요청":
    case "생산중":
      return "text-amber-700";
    case "검수":
    case "검수중":
      return "text-emerald-700";
    default:
      return "text-stone-700";
  }
}

export function getDisplayStageDescription(stage: DisplayStage) {
  switch (stage) {
    case "작성중":
      return "작업지시 초안을 작성하고 구성 정보를 정리하는 단계입니다.";
    case "검토요청":
      return "디자이너가 관리자 검토를 요청한 단계입니다.";
    case "검토완료":
      return "관리자 검토가 끝나 발주 진행을 준비하는 단계입니다.";
    case "발주요청":
      return "발주 요청이 진행되며 생산 구간에 진입한 단계입니다.";
    case "검수":
      return "입고/검수 담당자가 재고를 반영하고 완료 여부를 확인하는 단계입니다.";
    case "완료":
      return "작업이 종료되어 아카이브 관리만 남은 상태입니다.";
    default:
      return "현재 작업 상태 설명이 준비되지 않았습니다.";
  }
}
