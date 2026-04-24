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
  actionType?: "request_review" | "cancel_review_request" | "reject_review" | "restore_rejected_draft" | "cancel_review_approval" | "approve_review" | "request_order" | "complete_inspection" | "request_reinspection";
};

export type HistoryCategory = "work" | "inventory" | "attachment";
export type HistoryTone = "blue" | "violet" | "emerald" | "rose" | "amber" | "stone";
export type HistoryFilter = "all" | "work" | "inventory" | "attachment";

export const DISPLAY_STAGES_LIST: DisplayStage[] = [...DISPLAY_STAGES];
export const WORKFLOW_STATES_LIST: WorkflowState[] = [...WORKFLOW_STATES];

export type { NotificationSettingKey, NotificationSettings } from "@/lib/admin/notification/types";
