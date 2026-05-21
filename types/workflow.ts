import {
  DISPLAY_STAGES,
  WORKFLOW_STATES,
  type DisplayStageValue,
  type WorkflowStateValue,
} from "@/lib/constants/workorderStates";
import type { WorkflowActionTypeValue } from "@/lib/constants/workflowActions";
import type { HistoryCategoryValue, HistoryFilterValue, HistoryToneValue } from "@/lib/constants/workorderHistory";

export type WorkflowState = WorkflowStateValue;
export type DisplayStage = DisplayStageValue;

export type WorkflowAction = {
  label: string;
  nextState: WorkflowState;
  actionType?: WorkflowActionTypeValue;
};

export type HistoryCategory = HistoryCategoryValue;
export type HistoryTone = HistoryToneValue;
export type HistoryFilter = HistoryFilterValue;

export const DISPLAY_STAGES_LIST: DisplayStage[] = [...DISPLAY_STAGES];
export const WORKFLOW_STATES_LIST: WorkflowState[] = [...WORKFLOW_STATES];

export type { NotificationSettingKey, NotificationSettings } from "@/lib/admin/notification/types";
