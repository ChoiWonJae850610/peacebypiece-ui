import {
  DISPLAY_STAGES,
  WORKFLOW_STATES,
  type DisplayStageValue,
  type WorkflowStateValue,
} from "@/lib/constants/workorderStates";
import type { WorkflowActionTypeValue } from "@/lib/constants/workflowActions";

export type WorkflowState = WorkflowStateValue;
export type DisplayStage = DisplayStageValue;

export type WorkflowAction = {
  label: string;
  nextState: WorkflowState;
  actionType?: WorkflowActionTypeValue;
};

export type HistoryCategory = "work" | "inventory" | "attachment";
export type HistoryTone = "blue" | "violet" | "emerald" | "rose" | "amber" | "stone";
export type HistoryFilter = "all" | "work" | "inventory" | "attachment";

export const DISPLAY_STAGES_LIST: DisplayStage[] = [...DISPLAY_STAGES];
export const WORKFLOW_STATES_LIST: WorkflowState[] = [...WORKFLOW_STATES];

export type { NotificationSettingKey, NotificationSettings } from "@/lib/admin/notification/types";
