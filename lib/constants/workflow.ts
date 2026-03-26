import { DISPLAY_STAGES } from "@/types/workflow";
import type { DisplayStage, WorkflowState } from "@/types/workflow";

export const VISIBLE_STAGES: DisplayStage[] = DISPLAY_STAGES;

export function getStageTone(state: WorkflowState) {
  switch (state) {
    case "완료":
      return "bg-stone-900 text-white";
    case "검토요청":
      return "bg-violet-100 text-violet-700";
    case "발주요청":
      return "bg-amber-100 text-amber-700";
    case "생산중":
      return "bg-blue-100 text-blue-700";
    case "입고대기":
      return "bg-cyan-100 text-cyan-700";
    case "검수중":
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-stone-100 text-stone-700";
  }
}

export function getDisplayStageDescription(stage: DisplayStage) {
  switch (stage) {
    case "작성중":
      return "작업지시 초안을 작성하고 구성 정보를 정리하는 단계입니다.";
    case "검토요청":
      return "검토 요청 후 수량과 생산 조건을 확인하는 단계입니다.";
    case "발주요청":
      return "거래처와 발주 조건을 확정하기 전 최종 검토 단계입니다.";
    case "생산중":
      return "생산이 진행 중이며 공정과 재고 흐름을 함께 확인하는 단계입니다.";
    case "입고대기":
      return "입고 예정 수량과 일정 조율을 확인하는 단계입니다.";
    case "검수중":
      return "입고 후 수량과 품질을 점검하는 단계입니다.";
    case "완료":
      return "작업이 종료되어 아카이브 관리만 남은 상태입니다.";
    default:
      return "현재 작업 상태 설명이 준비되지 않았습니다.";
  }
}
