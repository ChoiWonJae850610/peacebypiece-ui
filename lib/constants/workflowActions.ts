export const WORKFLOW_ACTION_TYPE = {
  requestReview: "request_review",
  cancelReviewRequest: "cancel_review_request",
  rejectReview: "reject_review",
  cancelReviewApproval: "cancel_review_approval",
  approveReview: "approve_review",
  requestOrder: "request_order",
  completeInspection: "complete_inspection",
  requestReinspection: "request_reinspection",
} as const;

export const WORKFLOW_ACTION_TYPES = [
  WORKFLOW_ACTION_TYPE.requestReview,
  WORKFLOW_ACTION_TYPE.cancelReviewRequest,
  WORKFLOW_ACTION_TYPE.rejectReview,
  WORKFLOW_ACTION_TYPE.cancelReviewApproval,
  WORKFLOW_ACTION_TYPE.approveReview,
  WORKFLOW_ACTION_TYPE.requestOrder,
  WORKFLOW_ACTION_TYPE.completeInspection,
  WORKFLOW_ACTION_TYPE.requestReinspection,
] as const;

export type WorkflowActionTypeValue = (typeof WORKFLOW_ACTION_TYPES)[number];

export function isWorkflowActionType(value: string | null | undefined): value is WorkflowActionTypeValue {
  return Boolean(value) && (WORKFLOW_ACTION_TYPES as readonly string[]).includes(value as string);
}
