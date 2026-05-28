export const WORKFLOW_PATH = {
  standardReview: "standard_review",
  directOrder: "direct_order",
} as const;

export const WORKFLOW_PATHS = [
  WORKFLOW_PATH.standardReview,
  WORKFLOW_PATH.directOrder,
] as const;

export type WorkflowPathValue = (typeof WORKFLOW_PATHS)[number];

export function isWorkflowPathValue(
  value: string | null | undefined,
): value is WorkflowPathValue {
  return Boolean(value) && (WORKFLOW_PATHS as readonly string[]).includes(value as WorkflowPathValue);
}

export function normalizeWorkflowPath(
  value: string | null | undefined,
): WorkflowPathValue {
  return isWorkflowPathValue(value) ? value : WORKFLOW_PATH.standardReview;
}
