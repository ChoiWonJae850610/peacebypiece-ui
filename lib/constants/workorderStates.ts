export const WORKFLOW_STATES = [
  "draft",
  "review_requested",
  "review_completed",
  "inspection",
  "completed",
] as const;

export const DISPLAY_STAGES = [
  "draft",
  "review_requested",
  "review_completed",
  "request_order",
  "inspection",
  "completed",
] as const;

export const ORDER_INSPECTION_STATUSES = [
  "order_pending",
  "inspection_pending",
  "inspection_in_progress",
  "inspection_completed",
] as const;

export type WorkflowStateValue = (typeof WORKFLOW_STATES)[number];
export type DisplayStageValue = (typeof DISPLAY_STAGES)[number];
export type OrderInspectionStatusValue = (typeof ORDER_INSPECTION_STATUSES)[number];


export const STATUS_ORDER: Record<WorkflowStateValue, number> = {
  draft: 0,
  review_requested: 1,
  review_completed: 2,
  inspection: 3,
  completed: 4,
};

export function compareWorkflowStates(left: WorkflowStateValue, right: WorkflowStateValue) {
  return STATUS_ORDER[left] - STATUS_ORDER[right];
}

export function isWorkflowStateAtLeast(state: WorkflowStateValue, minimum: WorkflowStateValue) {
  return compareWorkflowStates(state, minimum) >= 0;
}

export function isWorkflowStateBefore(state: WorkflowStateValue, target: WorkflowStateValue) {
  return compareWorkflowStates(state, target) < 0;
}

export function isWorkflowStateAfter(state: WorkflowStateValue, target: WorkflowStateValue) {
  return compareWorkflowStates(state, target) > 0;
}

export function isWorkflowState(state: WorkflowStateValue, target: WorkflowStateValue) {
  return compareWorkflowStates(state, target) === 0;
}

export function canEditBeforeOrder(state: WorkflowStateValue, isAdmin = false) {
  return isWorkflowStateBefore(state, "review_requested") || (isAdmin && isWorkflowState(state, "review_requested"));
}

export function canEditManagerInWorkflow(state: WorkflowStateValue, isReviewRequestLocked: boolean) {
  return !isReviewRequestLocked || isWorkflowStateAtLeast(state, "completed");
}

export function isWorkflowStateInRange(state: WorkflowStateValue, minimum: WorkflowStateValue, maximum: WorkflowStateValue) {
  return isWorkflowStateAtLeast(state, minimum) && isWorkflowStateEqualOrBefore(state, maximum);
}

export function isWorkflowStateEqualOrBefore(state: WorkflowStateValue, target: WorkflowStateValue) {
  return compareWorkflowStates(state, target) <= 0;
}

export const WORKFLOW_STATE_TO_STAGE: Record<WorkflowStateValue, DisplayStageValue> = {
  draft: "draft",
  review_requested: "review_requested",
  review_completed: "review_completed",
  inspection: "inspection",
  completed: "completed",
};

export const WORKFLOW_STATE_BADGE_TONE: Record<WorkflowStateValue | DisplayStageValue, string> = {
  draft: "bg-stone-100 text-stone-700",
  review_requested: "bg-violet-100 text-violet-700",
  review_completed: "bg-fuchsia-100 text-fuchsia-700",
  request_order: "bg-amber-100 text-amber-700",
  inspection: "bg-emerald-100 text-emerald-700",
  completed: "bg-stone-900 text-white",
};

export const WORKFLOW_STATE_DOT_TONE: Record<WorkflowStateValue | DisplayStageValue, string> = {
  draft: "bg-stone-500",
  review_requested: "bg-violet-500",
  review_completed: "bg-fuchsia-500",
  request_order: "bg-amber-500",
  inspection: "bg-emerald-500",
  completed: "bg-white",
};

export const WORKFLOW_STATE_TEXT_TONE: Record<WorkflowStateValue | DisplayStageValue, string> = {
  draft: "text-stone-700",
  review_requested: "text-violet-700",
  review_completed: "text-fuchsia-700",
  request_order: "text-amber-700",
  inspection: "text-emerald-700",
  completed: "text-stone-900",
};

export const MANAGER_ASSIGNABLE_STATES = ["draft", "review_requested"] as const;
export const INVENTORY_EDITABLE_STATES = ["inspection", "completed"] as const;
export const REORDERABLE_WORKFLOW_STATES = ["inspection", "completed"] as const;
export const DELETABLE_WORKFLOW_STATES = ["draft", "review_requested"] as const;

export const WORKFLOW_ACTION_LABEL_KEYS = {
  requestReview: "requestReview",
  cancelReviewRequest: "cancelReviewRequest",
  rejectReview: "rejectReview",
  approveReview: "approveReview",
  requestOrder: "requestOrder",
  startInspection: "startInspection",
  completeInspection: "completeInspection",
} as const;

export const LEGACY_WORKFLOW_STATE_MAP = {
  "작성중": "draft",
  "검토요청": "review_requested",
  "검토완료": "review_completed",
  "발주요청": "inspection",
  "생산중": "inspection",
  "검수중": "inspection",
  "완료": "completed",
  review_approved: "review_completed",
  order_requested: "inspection",
  in_production: "inspection",
  in_inspection: "inspection",
} as const;

export const LEGACY_DISPLAY_STAGE_MAP = {
  "작성중": "draft",
  "검토요청": "review_requested",
  "검토완료": "review_completed",
  "발주요청": "request_order",
  "검수": "inspection",
  "완료": "completed",
  review_approved: "review_completed",
} as const;

export const LEGACY_ORDER_INSPECTION_STATUS_MAP = {
  "발주대기": "order_pending",
  "검수대기": "inspection_pending",
  "검수중": "inspection_in_progress",
  "검수완료": "inspection_completed",
} as const;
