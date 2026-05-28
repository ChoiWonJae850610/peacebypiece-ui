import { MATERIAL_ORDER_STATUS, type MaterialOrderStatus } from "@/lib/material-orders/types";

export type MaterialOrderStatusStep = {
  status: MaterialOrderStatus;
  label: string;
};

export type MaterialOrderStatusAction = {
  label: string;
  nextStatus: MaterialOrderStatus;
};

export const MATERIAL_ORDER_STATUS_STEPS: readonly MaterialOrderStatusStep[] = [
  { status: MATERIAL_ORDER_STATUS.draft, label: "작성중" },
  { status: MATERIAL_ORDER_STATUS.reviewRequested, label: "검토요청" },
  { status: MATERIAL_ORDER_STATUS.approved, label: "발주요청" },
  { status: MATERIAL_ORDER_STATUS.orderPlaced, label: "발주완료" },
] as const;

export function resolveMaterialOrderStatusActions(
  status: MaterialOrderStatus,
): MaterialOrderStatusAction[] {
  switch (status) {
    case MATERIAL_ORDER_STATUS.draft:
      return [
        { label: "검토 요청", nextStatus: MATERIAL_ORDER_STATUS.reviewRequested },
        { label: "발주 요청", nextStatus: MATERIAL_ORDER_STATUS.approved },
      ];
    case MATERIAL_ORDER_STATUS.reviewRequested:
      return [
        { label: "검토 취소", nextStatus: MATERIAL_ORDER_STATUS.draft },
        { label: "발주 요청", nextStatus: MATERIAL_ORDER_STATUS.approved },
      ];
    case MATERIAL_ORDER_STATUS.approved:
      return [{ label: "발주 완료", nextStatus: MATERIAL_ORDER_STATUS.orderPlaced }];
    default:
      return [];
  }
}

export function isMaterialOrderStatusTransitionAllowed(
  currentStatus: MaterialOrderStatus,
  nextStatus: MaterialOrderStatus,
): boolean {
  return resolveMaterialOrderStatusActions(currentStatus).some(
    (action) => action.nextStatus === nextStatus,
  );
}

export function shouldPersistMaterialOrderDetailBeforeStatusChange(
  currentStatus: MaterialOrderStatus,
): boolean {
  return currentStatus === MATERIAL_ORDER_STATUS.draft;
}
