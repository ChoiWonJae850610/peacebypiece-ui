import { getDisplayOrderInspectionStatus } from "@/lib/constants/workorderStates";
import { getI18n, type Locale } from "@/lib/i18n";
import type { DisplayStage, WorkflowState } from "@/types/workflow";
import type { OrderInspectionStatus, WorkflowAction } from "@/types/workorder";

type I18n = ReturnType<typeof getI18n>;

const EN_VALUE_LABELS: Record<string, string> = {
  "작성중": "Draft",
  "검토요청": "Review requested",
  "검토 요청": "Request review",
  "검토완료": "Review completed",
  "검토 완료": "Approve review",
  "발주요청": "Order requested",
  "발주 요청": "Request order",
  "발주대기": "Order pending",
  "검수": "Inspection",
  "검수대기": "Inspection pending",
  "검수중": "Inspection in progress",
  "검수완료": "Inspection completed",
  "검수 완료": "Complete inspection",
  "완료": "Completed",
  "반려": "Rejected",
  "요청 취소": "Cancel request",
  "취소": "Cancel",
  "재검수 요청": "Request reinspection",
  "메인 생산": "Main production",
  "샘플": "Sample",
  "재작업": "Rework",
  "선택 안함": "Not selected",
  "미지정": "Not set",
  "새 자재": "New material",
  "원단": "Fabric",
  "부자재": "Subsidiary",
  "기타": "Other",
  "재단": "Cutting",
  "봉제": "Sewing",
  "나염": "Printing",
  "자수": "Embroidery",
  "워싱": "Washing",
  "후가공": "Finishing",
  "준비": "Ready",
  "준비중": "Preparing",
  "발주완료": "Ordered",
  "입고완료": "Received",
  "대기": "Waiting",
  "장": "pcs",
  "개": "pcs",
  "벌": "sets",
  "세트": "sets",
  "롤": "rolls",
};

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

export function translateWorkOrderDisplayText(value: string | null | undefined, locale: Locale) {
  const normalized = String(value ?? "").trim();
  if (!normalized || locale !== "en") return value ?? "";
  return EN_VALUE_LABELS[normalized] ?? value ?? "";
}

export function translateWorkflowStateLabel(state: WorkflowState, i18n: I18n) {
  return i18n.workorder.workflowStates[state];
}

export function translateDisplayStageLabel(stage: DisplayStage, i18n: I18n) {
  return i18n.workorder.displayStages[stage];
}

export function translateInspectionStatusLabel(status: OrderInspectionStatus | null | undefined, i18n: I18n) {
  return i18n.workorder.inspectionStatuses[getDisplayOrderInspectionStatus(status)];
}

export function translateWorkflowActionLabel(action: Pick<WorkflowAction, "actionType" | "label">, i18n: I18n, locale: Locale) {
  const key = action.actionType ? ACTION_LABEL_BY_TYPE[action.actionType] : undefined;
  if (key) return i18n.workorder.actionLabels[key];
  return translateWorkOrderDisplayText(action.label, locale);
}
