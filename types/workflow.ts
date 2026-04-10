import {
  DISPLAY_STAGES,
  WORKFLOW_STATES,
  type DisplayStageValue,
  type WorkflowStateValue,
} from "@/lib/constants/workorderStates";

export type WorkflowState = WorkflowStateValue;
export type DisplayStage = DisplayStageValue;

export type WorkflowAction = {
  label: string;
  nextState: WorkflowState;
};

export type HistoryCategory = "work" | "inventory" | "attachment";
export type HistoryTone = "blue" | "violet" | "emerald" | "rose" | "amber" | "stone";
export type HistoryFilter = "all" | "work" | "inventory" | "attachment";

export const DISPLAY_STAGES_LIST: DisplayStage[] = [...DISPLAY_STAGES];
export const WORKFLOW_STATES_LIST: WorkflowState[] = [...WORKFLOW_STATES];

export type NotificationSettingKey = "created" | "updated" | "status_changed" | "materials_changed" | "outsourcing_changed" | "stock_changed" | "comment_added";

export type NotificationSettings = Record<NotificationSettingKey, boolean>;
