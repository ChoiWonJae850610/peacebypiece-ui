import { MATERIAL_ORDER_STATUS, type MaterialOrderStatus } from "@/lib/material-orders/types";

export type MaterialOrderStatusStep = {
  status: MaterialOrderStatus;
  label: string;
};

export type MaterialOrderStatusAction = {
  label: string;
  nextStatus: MaterialOrderStatus;
};

export type MaterialOrderStatusCapabilities = {
  canRequestMaterialOrder: boolean;
  canPlaceMaterialOrder: boolean;
};

export function isMaterialOrderBeforeOrderRequest(
  status: MaterialOrderStatus,
): boolean {
  return (
    status === MATERIAL_ORDER_STATUS.draft ||
    status === MATERIAL_ORDER_STATUS.reviewRequested ||
    status === MATERIAL_ORDER_STATUS.rejected
  );
}

export function canEditMaterialOrderCoreFields(
  status: MaterialOrderStatus,
  isAdmin: boolean,
): boolean {
  if (isAdmin) return isMaterialOrderBeforeOrderRequest(status);

  return (
    status === MATERIAL_ORDER_STATUS.draft ||
    status === MATERIAL_ORDER_STATUS.rejected
  );
}

export const MATERIAL_ORDER_STATUS_STEPS: readonly MaterialOrderStatusStep[] = [
  { status: MATERIAL_ORDER_STATUS.draft, label: "작성중" },
  { status: MATERIAL_ORDER_STATUS.reviewRequested, label: "검토요청" },
  { status: MATERIAL_ORDER_STATUS.approved, label: "발주요청" },
  { status: MATERIAL_ORDER_STATUS.orderPlaced, label: "발주완료" },
] as const;

export function resolveMaterialOrderStatusActions(
  status: MaterialOrderStatus,
  capabilities: MaterialOrderStatusCapabilities = {
    canRequestMaterialOrder: true,
    canPlaceMaterialOrder: true,
  },
): MaterialOrderStatusAction[] {
  switch (status) {
    case MATERIAL_ORDER_STATUS.draft:
    case MATERIAL_ORDER_STATUS.rejected: {
      const actions: MaterialOrderStatusAction[] = [];

      if (capabilities.canRequestMaterialOrder) {
        actions.push({
          label: "검토 요청",
          nextStatus: MATERIAL_ORDER_STATUS.reviewRequested,
        });
      }
      if (capabilities.canPlaceMaterialOrder) {
        actions.push({
          label: "발주 요청",
          nextStatus: MATERIAL_ORDER_STATUS.approved,
        });
      }

      return actions;
    }
    case MATERIAL_ORDER_STATUS.reviewRequested: {
      const actions: MaterialOrderStatusAction[] = [];

      if (capabilities.canRequestMaterialOrder) {
        actions.push({
          label: "검토 취소",
          nextStatus: MATERIAL_ORDER_STATUS.draft,
        });
      }
      if (capabilities.canPlaceMaterialOrder) {
        actions.push(
          {
            label: "반려",
            nextStatus: MATERIAL_ORDER_STATUS.rejected,
          },
          {
            label: "발주 요청",
            nextStatus: MATERIAL_ORDER_STATUS.approved,
          },
        );
      }

      return actions;
    }
    case MATERIAL_ORDER_STATUS.approved:
      return capabilities.canPlaceMaterialOrder
        ? [{ label: "발주 완료", nextStatus: MATERIAL_ORDER_STATUS.orderPlaced }]
        : [];
    default:
      return [];
  }
}

export function isMaterialOrderStatusTransitionAllowed(
  currentStatus: MaterialOrderStatus,
  nextStatus: MaterialOrderStatus,
): boolean {
  if (currentStatus === MATERIAL_ORDER_STATUS.draft && nextStatus === MATERIAL_ORDER_STATUS.cancelled) {
    return true;
  }

  return resolveMaterialOrderStatusActions(currentStatus).some(
    (action) => action.nextStatus === nextStatus,
  );
}

export function shouldPersistMaterialOrderDetailBeforeStatusChange(
  currentStatus: MaterialOrderStatus,
): boolean {
  return isMaterialOrderBeforeOrderRequest(currentStatus);
}
