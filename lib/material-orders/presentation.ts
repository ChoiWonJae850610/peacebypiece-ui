import { MATERIAL_ORDER_STATUS, type MaterialOrderLineItemType, type MaterialOrderStatus } from "@/lib/material-orders/types";

export const MATERIAL_ORDER_STATUS_PRESENTATION: Readonly<Record<MaterialOrderStatus, {
  label: string;
  badgeTone: "neutral" | "info" | "success" | "warning" | "danger";
}>> = {
  [MATERIAL_ORDER_STATUS.draft]: { label: "작성중", badgeTone: "neutral" },
  [MATERIAL_ORDER_STATUS.reviewRequested]: { label: "검토요청", badgeTone: "warning" },
  [MATERIAL_ORDER_STATUS.approved]: { label: "발주요청", badgeTone: "info" },
  [MATERIAL_ORDER_STATUS.orderPlaced]: { label: "발주완료", badgeTone: "success" },
  [MATERIAL_ORDER_STATUS.rejected]: { label: "반려", badgeTone: "danger" },
  [MATERIAL_ORDER_STATUS.cancelled]: { label: "취소", badgeTone: "danger" },
};

export const MATERIAL_ORDER_STATUS_FILTER_OPTIONS = [
  MATERIAL_ORDER_STATUS.draft,
  MATERIAL_ORDER_STATUS.reviewRequested,
  MATERIAL_ORDER_STATUS.approved,
  MATERIAL_ORDER_STATUS.orderPlaced,
  MATERIAL_ORDER_STATUS.rejected,
  MATERIAL_ORDER_STATUS.cancelled,
].map((value) => ({ value, label: MATERIAL_ORDER_STATUS_PRESENTATION[value].label }));

export function formatMaterialOrderStatusLabel(status: MaterialOrderStatus): string {
  return MATERIAL_ORDER_STATUS_PRESENTATION[status].label;
}

export function resolveMaterialOrderStatusBadgeTone(status: MaterialOrderStatus) {
  return MATERIAL_ORDER_STATUS_PRESENTATION[status].badgeTone;
}

export function formatMaterialOrderTypeLabel(type: MaterialOrderLineItemType | null | ""): string {
  if (type === "fabric") return "원단";
  if (type === "submaterial") return "부자재";
  return "미지정";
}

export const MATERIAL_ORDER_STATUS_SEMANTIC_CLASS: Readonly<Record<MaterialOrderStatus, string>> = {
  [MATERIAL_ORDER_STATUS.draft]: "pbp-workorder-status-draft",
  [MATERIAL_ORDER_STATUS.reviewRequested]: "pbp-workorder-status-review-requested",
  [MATERIAL_ORDER_STATUS.approved]: "pbp-workorder-status-request-order",
  [MATERIAL_ORDER_STATUS.orderPlaced]: "pbp-workorder-status-completed",
  [MATERIAL_ORDER_STATUS.rejected]: "pbp-workorder-status-rejected",
  [MATERIAL_ORDER_STATUS.cancelled]: "pbp-workorder-status-rejected",
};

export function getMaterialOrderStatusSemanticClass(status: MaterialOrderStatus): string {
  return MATERIAL_ORDER_STATUS_SEMANTIC_CLASS[status];
}
