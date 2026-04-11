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
const presentation = i18n.workorder.presentation;

export const VISIBLE_STAGES: DisplayStage[] = [...DISPLAY_STAGES];
export { MANAGER_ASSIGNABLE_STATES, INVENTORY_EDITABLE_STATES };

export const WORKFLOW_ACTION_LABELS = i18n.workorder.actionLabels;

export const HISTORY_FILTER_OPTIONS = [
  ["all", presentation.historyFilters.all],
  ["work", presentation.historyFilters.work],
  ["inventory", presentation.historyFilters.inventory],
  ["attachment", presentation.historyFilters.attachment],
] as const;

export const NOTIFICATION_SETTING_META: { key: NotificationSettingKey; label: string; description: string }[] = [
  { key: "created", label: presentation.notificationSettings.created.label, description: presentation.notificationSettings.created.description },
  { key: "updated", label: presentation.notificationSettings.updated.label, description: presentation.notificationSettings.updated.description },
  { key: "status_changed", label: presentation.notificationSettings.status_changed.label, description: presentation.notificationSettings.status_changed.description },
  { key: "materials_changed", label: presentation.notificationSettings.materials_changed.label, description: presentation.notificationSettings.materials_changed.description },
  { key: "outsourcing_changed", label: presentation.notificationSettings.outsourcing_changed.label, description: presentation.notificationSettings.outsourcing_changed.description },
  { key: "stock_changed", label: presentation.notificationSettings.stock_changed.label, description: presentation.notificationSettings.stock_changed.description },
  { key: "comment_added", label: presentation.notificationSettings.comment_added.label, description: presentation.notificationSettings.comment_added.description },
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
