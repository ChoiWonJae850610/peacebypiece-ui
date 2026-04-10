import {
  WORKFLOW_STATE_BADGE_TONE,
  WORKFLOW_STATE_DOT_TONE,
  WORKFLOW_STATE_TEXT_TONE,
} from "@/lib/constants/workorderStates";
import { getI18n } from "@/lib/i18n";
import type { DisplayStage, WorkflowState } from "@/types/workflow";
import type { OrderInspectionStatus } from "@/types/workorder";

const i18n = getI18n();

export function getWorkflowStateLabel(state: WorkflowState) {
  return i18n.workorder.workflowStates[state];
}

export function getDisplayStageLabel(stage: DisplayStage) {
  return i18n.workorder.displayStages[stage];
}

export function getWorkflowStageBadgeTone(state: WorkflowState | DisplayStage) {
  return WORKFLOW_STATE_BADGE_TONE[state];
}

export function getStageDotTone(state: WorkflowState | DisplayStage) {
  return WORKFLOW_STATE_DOT_TONE[state];
}

export function getStageTextTone(state: WorkflowState | DisplayStage) {
  return WORKFLOW_STATE_TEXT_TONE[state];
}

export function getDisplayStageDescription(stage: DisplayStage) {
  return i18n.workorder.workflowDescriptions[stage] ?? "현재 작업 상태 설명이 준비되지 않았습니다.";
}

export function getInspectionStatusLabel(status: OrderInspectionStatus) {
  return i18n.workorder.inspectionStatuses[status];
}

export function getInspectionStatusTone(status: OrderInspectionStatus) {
  switch (status) {
    case "inspection_completed":
      return "bg-stone-900 text-white";
    case "inspection_in_progress":
      return "bg-emerald-100 text-emerald-700";
    case "inspection_pending":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-stone-100 text-stone-600";
  }
}
