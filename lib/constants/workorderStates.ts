export const WORKFLOW_STATE = {
  draft: "draft",
  reviewRequested: "review_requested",
  reviewCompleted: "review_completed",
  materialOrderPending: "material_order_pending",
  inspection: "inspection",
  completed: "completed",
  rejected: "rejected",
} as const;

export const DISPLAY_STAGE = {
  draft: "draft",
  reviewRequested: "review_requested",
  reviewCompleted: "review_completed",
  requestOrder: "request_order",
  inspection: "inspection",
  completed: "completed",
} as const;

export const DEFAULT_WORKFLOW_STATE = WORKFLOW_STATE.draft;

export const WORKFLOW_STATES = [
  WORKFLOW_STATE.draft,
  WORKFLOW_STATE.reviewRequested,
  WORKFLOW_STATE.reviewCompleted,
  WORKFLOW_STATE.materialOrderPending,
  WORKFLOW_STATE.inspection,
  WORKFLOW_STATE.completed,
  WORKFLOW_STATE.rejected,
] as const;

export const DISPLAY_STAGES = [
  DISPLAY_STAGE.draft,
  DISPLAY_STAGE.reviewRequested,
  DISPLAY_STAGE.reviewCompleted,
  DISPLAY_STAGE.requestOrder,
  DISPLAY_STAGE.inspection,
  DISPLAY_STAGE.completed,
] as const;

export const ORDER_INSPECTION_STATUSES = [
  "order_pending",
  "inspection_pending",
  "inspection_in_progress",
  "inspection_completed",
] as const;

export const ORDER_INSPECTION_STATUS = {
  orderPending: "order_pending",
  inspectionPending: "inspection_pending",
  inspectionInProgress: "inspection_in_progress",
  inspectionCompleted: "inspection_completed",
} as const;

export type WorkflowStateValue = (typeof WORKFLOW_STATES)[number];
export type DisplayStageValue = (typeof DISPLAY_STAGES)[number];
export type OrderInspectionStatusValue = (typeof ORDER_INSPECTION_STATUSES)[number];

export function isOrderInspectionStatus(value: string | null | undefined): value is OrderInspectionStatusValue {
  return Boolean(value) && (ORDER_INSPECTION_STATUSES as readonly string[]).includes(value as string);
}

export function isOrderInspectionCompleted(status: OrderInspectionStatusValue | null | undefined) {
  return status === ORDER_INSPECTION_STATUS.inspectionCompleted;
}

export function isOrderInspectionPending(status: OrderInspectionStatusValue | null | undefined) {
  return status === ORDER_INSPECTION_STATUS.inspectionPending;
}

export function isOrderInspectionInProgress(status: OrderInspectionStatusValue | null | undefined) {
  return status === ORDER_INSPECTION_STATUS.inspectionInProgress;
}

export function isOrderInspectionActive(status: OrderInspectionStatusValue | null | undefined) {
  return isOrderInspectionPending(status) || isOrderInspectionInProgress(status) || isOrderInspectionCompleted(status);
}

export function getDefaultOrderInspectionStatusForWorkflowState(workflowState: WorkflowStateValue): OrderInspectionStatusValue {
  if (workflowState === WORKFLOW_STATE.inspection) return ORDER_INSPECTION_STATUS.inspectionInProgress;
  if (workflowState === WORKFLOW_STATE.completed) return ORDER_INSPECTION_STATUS.inspectionCompleted;
  return ORDER_INSPECTION_STATUS.orderPending;
}

export function getOrderInspectionStatusForOrderRequest(status: OrderInspectionStatusValue | null | undefined): OrderInspectionStatusValue {
  return isOrderInspectionCompleted(status) ? ORDER_INSPECTION_STATUS.inspectionCompleted : ORDER_INSPECTION_STATUS.inspectionPending;
}

export function getOrderInspectionStatusForReinspection(): OrderInspectionStatusValue {
  return ORDER_INSPECTION_STATUS.inspectionPending;
}

export function getOrderInspectionStatusForNewOrderEntry(): OrderInspectionStatusValue {
  return ORDER_INSPECTION_STATUS.orderPending;
}

export function getOrderInspectionStatusForCompletion(): OrderInspectionStatusValue {
  return ORDER_INSPECTION_STATUS.inspectionCompleted;
}

export function getDisplayOrderInspectionStatus(status: OrderInspectionStatusValue | null | undefined): OrderInspectionStatusValue {
  return status ?? ORDER_INSPECTION_STATUS.orderPending;
}


export const STATUS_ORDER: Record<WorkflowStateValue, number> = {
  [WORKFLOW_STATE.draft]: 0,
  [WORKFLOW_STATE.rejected]: 0,
  [WORKFLOW_STATE.reviewRequested]: 1,
  [WORKFLOW_STATE.reviewCompleted]: 2,
  [WORKFLOW_STATE.materialOrderPending]: 3,
  [WORKFLOW_STATE.inspection]: 4,
  [WORKFLOW_STATE.completed]: 5,
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

export function isWorkflowStateOneOf(state: WorkflowStateValue, targets: readonly WorkflowStateValue[]) {
  return targets.some((target) => isWorkflowState(state, target));
}

export function canEditBeforeOrder(state: WorkflowStateValue, isAdmin = false) {
  if (isAdmin) {
    return isWorkflowStateBefore(state, WORKFLOW_STATE.materialOrderPending);
  }
  return isWorkflowState(state, WORKFLOW_STATE.draft) || isWorkflowState(state, WORKFLOW_STATE.rejected);
}

export function isWorkflowStateReviewLocked(state: WorkflowStateValue, isAdmin = false) {
  return !canEditBeforeOrder(state, isAdmin);
}

export function canChangeWorkOrderAssigneeInWorkflow(state: WorkflowStateValue) {
  return isWorkflowStateBefore(state, WORKFLOW_STATE.materialOrderPending);
}

export function canEditManagerInWorkflow(state: WorkflowStateValue, _isReviewRequestLocked?: boolean) {
  return canChangeWorkOrderAssigneeInWorkflow(state);
}

export function canRequestFactoryOrderInWorkflow(state: WorkflowStateValue) {
  return isWorkflowStateAtLeast(state, WORKFLOW_STATE.reviewCompleted) && !isWorkflowState(state, WORKFLOW_STATE.reviewRequested);
}

export function canReinspectInWorkflow(state: WorkflowStateValue) {
  return isWorkflowState(state, WORKFLOW_STATE.completed);
}

export function canOpenInspectionModalInWorkflow(state: WorkflowStateValue) {
  return isWorkflowState(state, WORKFLOW_STATE.inspection);
}

export function getWorkflowStateScope(state: WorkflowStateValue, isAdmin = false): "draft" | "review_requested_admin" | "locked" {
  if (isWorkflowState(state, WORKFLOW_STATE.draft) || isWorkflowState(state, WORKFLOW_STATE.rejected)) return "draft";
  if (isAdmin && isWorkflowState(state, WORKFLOW_STATE.reviewRequested)) return "review_requested_admin";
  return "locked";
}

export function getWorkflowLockedReasonKey(state: WorkflowStateValue, isAdmin = false): "reviewRequested" | "orderedOrLater" | null {
  if (!isWorkflowStateReviewLocked(state, isAdmin)) return null;
  return isWorkflowState(state, WORKFLOW_STATE.reviewRequested) ? "reviewRequested" : "orderedOrLater";
}

export function isWorkflowStateInRange(state: WorkflowStateValue, minimum: WorkflowStateValue, maximum: WorkflowStateValue) {
  return isWorkflowStateAtLeast(state, minimum) && isWorkflowStateEqualOrBefore(state, maximum);
}

export function isWorkflowStateEqualOrBefore(state: WorkflowStateValue, target: WorkflowStateValue) {
  return compareWorkflowStates(state, target) <= 0;
}

export const WORKFLOW_STATE_TO_STAGE: Record<WorkflowStateValue, DisplayStageValue> = {
  [WORKFLOW_STATE.draft]: DISPLAY_STAGE.draft,
  [WORKFLOW_STATE.reviewRequested]: DISPLAY_STAGE.reviewRequested,
  [WORKFLOW_STATE.reviewCompleted]: DISPLAY_STAGE.reviewCompleted,
  [WORKFLOW_STATE.materialOrderPending]: DISPLAY_STAGE.requestOrder,
  [WORKFLOW_STATE.inspection]: DISPLAY_STAGE.inspection,
  [WORKFLOW_STATE.completed]: DISPLAY_STAGE.completed,
  [WORKFLOW_STATE.rejected]: DISPLAY_STAGE.draft,
};

export const WORKFLOW_STATE_BADGE_TONE: Record<WorkflowStateValue | DisplayStageValue, string> = {
  draft: "bg-[var(--pbp-workorder-status-draft-bg)] text-[var(--pbp-workorder-status-draft-text)]",
  review_requested: "bg-[var(--pbp-workorder-status-review-requested-bg)] text-[var(--pbp-workorder-status-review-requested-text)]",
  review_completed: "bg-[var(--pbp-workorder-status-review-completed-bg)] text-[var(--pbp-workorder-status-review-completed-text)]",
  request_order: "bg-[var(--pbp-workorder-status-request-order-bg)] text-[var(--pbp-workorder-status-request-order-text)]",
  material_order_pending: "bg-[var(--pbp-workorder-status-request-order-bg)] text-[var(--pbp-workorder-status-request-order-text)]",
  inspection: "bg-[var(--pbp-workorder-status-inspection-bg)] text-[var(--pbp-workorder-status-inspection-text)]",
  completed: "bg-[var(--pbp-workorder-status-completed-bg)] text-[var(--pbp-workorder-status-completed-text)]",
  rejected: "bg-[var(--pbp-workorder-status-rejected-bg)] text-[var(--pbp-workorder-status-rejected-text)]",
};

export const WORKFLOW_STATE_DOT_TONE: Record<WorkflowStateValue | DisplayStageValue, string> = {
  draft: "bg-[var(--pbp-workorder-status-draft-dot)]",
  review_requested: "bg-[var(--pbp-workorder-status-review-requested-dot)]",
  review_completed: "bg-[var(--pbp-workorder-status-review-completed-dot)]",
  request_order: "bg-[var(--pbp-workorder-status-request-order-dot)]",
  material_order_pending: "bg-[var(--pbp-workorder-status-request-order-dot)]",
  inspection: "bg-[var(--pbp-workorder-status-inspection-dot)]",
  completed: "bg-[var(--pbp-workorder-status-completed-dot)]",
  rejected: "bg-[var(--pbp-workorder-status-rejected-dot)]",
};

export const WORKFLOW_STATE_TEXT_TONE: Record<WorkflowStateValue | DisplayStageValue, string> = {
  draft: "text-[var(--pbp-workorder-status-draft-text)]",
  review_requested: "text-[var(--pbp-workorder-status-review-requested-text)]",
  review_completed: "text-[var(--pbp-workorder-status-review-completed-text)]",
  request_order: "text-[var(--pbp-workorder-status-request-order-text)]",
  material_order_pending: "text-[var(--pbp-workorder-status-request-order-text)]",
  inspection: "text-[var(--pbp-workorder-status-inspection-text)]",
  completed: "text-[var(--pbp-workorder-status-completed-bg)]",
  rejected: "text-[var(--pbp-workorder-status-rejected-text)]",
};

export const MANAGER_ASSIGNABLE_STATES = [...WORKFLOW_STATES] as const;
export const INVENTORY_EDITABLE_STATES = [WORKFLOW_STATE.inspection, WORKFLOW_STATE.completed] as const;
export const REORDERABLE_WORKFLOW_STATES = [WORKFLOW_STATE.inspection, WORKFLOW_STATE.completed] as const;
export const DELETABLE_WORKFLOW_STATES = [WORKFLOW_STATE.draft, WORKFLOW_STATE.rejected, WORKFLOW_STATE.reviewRequested] as const;

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
  "반려": "rejected",
  "발주요청": "material_order_pending",
  "생산중": "inspection",
  "검수중": "inspection",
  "완료": "completed",
  review_approved: "review_completed",
  order_requested: "material_order_pending",
  in_production: "inspection",
  in_inspection: "inspection",
} as const;

export const LEGACY_DISPLAY_STAGE_MAP = {
  "작성중": "draft",
  "검토요청": "review_requested",
  "검토완료": "review_completed",
  "반려": "draft",
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
