import { getI18n, type Locale } from "@/lib/i18n";
import type { WorkflowAction } from "@/types/workorder";
import { translateWorkOrderDisplayText } from "./workOrderValuePresentation";

type I18n = ReturnType<typeof getI18n>;

const ACTION_LABEL_BY_TYPE: Partial<Record<NonNullable<WorkflowAction["actionType"]>, keyof I18n["workorder"]["actionLabels"]>> = {
  request_review: "requestReview",
  cancel_review_request: "cancelReviewRequest",
  cancel_review_approval: "cancelReviewApproval",
  reject_review: "rejectReview",
  approve_review: "approveReview",
  request_order: "requestOrder",
  complete_inspection: "completeInspection",
  request_reinspection: "requestReinspection",
};

export function translateWorkflowActionLabel(action: Pick<WorkflowAction, "actionType" | "label">, i18n: I18n, locale: Locale) {
  const key = action.actionType ? ACTION_LABEL_BY_TYPE[action.actionType] : undefined;
  if (key) return i18n.workorder.actionLabels[key];
  return translateWorkOrderDisplayText(action.label, locale);
}
