import { DISPLAY_STAGES } from "@/types/workflow";
import type { DisplayStage, NotificationSettingKey, WorkflowState } from "@/types/workflow";

export const VISIBLE_STAGES: DisplayStage[] = DISPLAY_STAGES;
export const MANAGER_ASSIGNABLE_STATES: readonly WorkflowState[] = ["작성중", "검토요청"] as const;
export const INVENTORY_EDITABLE_STATES: readonly WorkflowState[] = ["검수중", "완료"] as const;

export const WORKFLOW_ACTION_LABELS = {
  requestReview: "검토 요청",
  rejectReview: "반려",
  approveReview: "검토 완료",
  requestOrder: "발주 요청",
  startInspection: "검수 시작",
  completeInspection: "검수 완료",
} as const;

export const HISTORY_FILTER_OPTIONS = [["all", "전체"], ["work", "작업"], ["inventory", "재고"], ["attachment", "첨부"]] as const;

export const NOTIFICATION_SETTING_META: { key: NotificationSettingKey; label: string; description: string }[] = [
  { key: "created", label: "작업지시서 생성", description: "새 작업지시서가 만들어졌을 때 알림 대상에 포함합니다." },
  { key: "updated", label: "기본사항 수정", description: "기본 정보 저장/수정 이벤트를 알림 대상으로 둡니다." },
  { key: "status_changed", label: "상태 변경", description: "작성중, 검토요청, 발주요청 등 단계 변경 알림입니다." },
  { key: "materials_changed", label: "원단/부자재 변경", description: "원단, 부자재, 단가 등 생산구성 변경 알림입니다." },
  { key: "outsourcing_changed", label: "외주 공정 변경", description: "외주 공정 추가/수정/삭제 알림입니다." },
  { key: "stock_changed", label: "재고 변경", description: "입고, 차감, 보정 같은 재고 수량 변경 알림입니다." },
  { key: "comment_added", label: "메모 작성", description: "작업메모와 댓글이 등록되었을 때 알림합니다." },
];

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
