import {
  DISPLAY_STAGES,
  INVENTORY_EDITABLE_STATES,
  MANAGER_ASSIGNABLE_STATES,
  WORKFLOW_STATE_TO_STAGE,
} from "@/lib/constants/workorderStates";
import { getI18n } from "@/lib/i18n";
import {
  getDisplayStageDescription as getDisplayStageDescriptionFromPresentation,
  getDisplayStageLabel as getDisplayStageLabelFromPresentation,
  getStageDotTone as getStageDotToneFromPresentation,
  getStageTextTone as getStageTextToneFromPresentation,
  getWorkflowStageBadgeTone as getWorkflowStageBadgeToneFromPresentation,
  getWorkflowStateLabel as getWorkflowStateLabelFromPresentation,
} from "@/lib/workorder/presentation/statusPresentation";
import type { DisplayStage, NotificationSettingKey, WorkflowState } from "@/types/workflow";

const i18n = getI18n();

export const VISIBLE_STAGES: DisplayStage[] = [...DISPLAY_STAGES];
export { MANAGER_ASSIGNABLE_STATES, INVENTORY_EDITABLE_STATES };

export const WORKFLOW_ACTION_LABELS = i18n.workorder.actionLabels;

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
  return WORKFLOW_STATE_TO_STAGE[state];
}

export function getWorkflowStateLabel(state: WorkflowState) {
  return getWorkflowStateLabelFromPresentation(state);
}

export function getDisplayStageLabel(stage: DisplayStage) {
  return getDisplayStageLabelFromPresentation(stage);
}

export function getStageTone(state: WorkflowState | DisplayStage) {
  return getWorkflowStageBadgeToneFromPresentation(state);
}

export function getStageDotTone(state: WorkflowState | DisplayStage) {
  return getStageDotToneFromPresentation(state);
}

export function getStageTextTone(state: WorkflowState | DisplayStage) {
  return getStageTextToneFromPresentation(state);
}

export function getDisplayStageDescription(stage: DisplayStage) {
  return getDisplayStageDescriptionFromPresentation(stage);
}

