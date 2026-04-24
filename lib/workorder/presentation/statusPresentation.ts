import {
  INSPECTION_STATUS_TONE_CLASS,
  WORKFLOW_DESCRIPTION_FALLBACK,
} from "@/lib/constants/display";
import {
  WORKFLOW_STATE_BADGE_TONE,
  WORKFLOW_STATE_DOT_TONE,
  WORKFLOW_STATE_TEXT_TONE,
  getDisplayOrderInspectionStatus,
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
  return i18n.workorder.workflowDescriptions[stage] ?? WORKFLOW_DESCRIPTION_FALLBACK;
}

export function getInspectionStatusLabel(status: OrderInspectionStatus | null | undefined) {
  return i18n.workorder.inspectionStatuses[getDisplayOrderInspectionStatus(status)];
}

export function getInspectionStatusTone(status: OrderInspectionStatus | null | undefined) {
  return INSPECTION_STATUS_TONE_CLASS[getDisplayOrderInspectionStatus(status)];
}
