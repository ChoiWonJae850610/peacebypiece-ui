import type { DisplayStage, WorkflowState } from "@/types/workflow";

const WORKORDER_STATUS_BADGE_CLASS: Record<WorkflowState | DisplayStage, string> = {
  draft: "pbp-workorder-status-draft",
  review_requested: "pbp-workorder-status-review-requested",
  review_completed: "pbp-workorder-status-review-completed",
  request_order: "pbp-workorder-status-request-order",
  material_order_pending: "pbp-workorder-status-request-order",
  inspection: "pbp-workorder-status-inspection",
  completed: "pbp-workorder-status-completed",
  rejected: "pbp-workorder-status-rejected",
};

export function getWorkOrderStatusBadgeSemanticClass(state: WorkflowState | DisplayStage) {
  return WORKORDER_STATUS_BADGE_CLASS[state];
}
