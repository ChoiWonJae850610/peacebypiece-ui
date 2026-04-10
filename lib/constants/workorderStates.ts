export const WORKFLOW_STATES = [
  "draft",
  "review_requested",
  "review_approved",
  "order_requested",
  "in_production",
  "in_inspection",
  "completed",
] as const;

export const DISPLAY_STAGES = [
  "draft",
  "review_requested",
  "review_approved",
  "order_requested",
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

export const WORKFLOW_STATE_TO_STAGE: Record<WorkflowStateValue, DisplayStageValue> = {
  draft: "draft",
  review_requested: "review_requested",
  review_approved: "review_approved",
  order_requested: "order_requested",
  in_production: "order_requested",
  in_inspection: "inspection",
  completed: "completed",
};

export const WORKFLOW_STATE_BADGE_TONE: Record<WorkflowStateValue | DisplayStageValue, string> = {
  draft: "bg-stone-100 text-stone-700",
  review_requested: "bg-violet-100 text-violet-700",
  review_approved: "bg-fuchsia-100 text-fuchsia-700",
  order_requested: "bg-amber-100 text-amber-700",
  in_production: "bg-amber-100 text-amber-700",
  inspection: "bg-emerald-100 text-emerald-700",
  in_inspection: "bg-emerald-100 text-emerald-700",
  completed: "bg-stone-900 text-white",
};

export const WORKFLOW_STATE_DOT_TONE: Record<WorkflowStateValue | DisplayStageValue, string> = {
  draft: "bg-stone-500",
  review_requested: "bg-violet-500",
  review_approved: "bg-fuchsia-500",
  order_requested: "bg-amber-500",
  in_production: "bg-amber-500",
  inspection: "bg-emerald-500",
  in_inspection: "bg-emerald-500",
  completed: "bg-white",
};

export const WORKFLOW_STATE_TEXT_TONE: Record<WorkflowStateValue | DisplayStageValue, string> = {
  draft: "text-stone-700",
  review_requested: "text-violet-700",
  review_approved: "text-fuchsia-700",
  order_requested: "text-amber-700",
  in_production: "text-amber-700",
  inspection: "text-emerald-700",
  in_inspection: "text-emerald-700",
  completed: "text-stone-900",
};

export const MANAGER_ASSIGNABLE_STATES = ["draft", "review_requested"] as const;
export const INVENTORY_EDITABLE_STATES = ["in_inspection", "completed"] as const;
export const REORDERABLE_WORKFLOW_STATES = ["in_production", "in_inspection", "completed"] as const;
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
  "검토완료": "review_approved",
  "발주요청": "order_requested",
  "생산중": "in_production",
  "검수중": "in_inspection",
  "완료": "completed",
} as const;

export const LEGACY_DISPLAY_STAGE_MAP = {
  "작성중": "draft",
  "검토요청": "review_requested",
  "검토완료": "review_approved",
  "발주요청": "order_requested",
  "검수": "inspection",
  "완료": "completed",
} as const;

export const LEGACY_ORDER_INSPECTION_STATUS_MAP = {
  "발주대기": "order_pending",
  "검수대기": "inspection_pending",
  "검수중": "inspection_in_progress",
  "검수완료": "inspection_completed",
} as const;
