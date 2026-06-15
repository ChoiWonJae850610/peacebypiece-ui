import "server-only";

import type { MaterialOrderStatus } from "@/lib/material-orders/types";
import { MATERIAL_ORDER_STATUS } from "@/lib/material-orders/types";

export function canEditMaterialOrderOnServer(input: {
  status: MaterialOrderStatus;
  isAdmin: boolean;
}): boolean {
  if (input.isAdmin) {
    return (
      input.status === MATERIAL_ORDER_STATUS.draft ||
      input.status === MATERIAL_ORDER_STATUS.reviewRequested ||
      input.status === MATERIAL_ORDER_STATUS.rejected
    );
  }

  return (
    input.status === MATERIAL_ORDER_STATUS.draft ||
    input.status === MATERIAL_ORDER_STATUS.rejected
  );
}

export function isAllowedMaterialOrderTransition(input: {
  previous: MaterialOrderStatus;
  next: MaterialOrderStatus;
}): boolean {
  if (input.previous === input.next) return true;

  if (
    input.previous === MATERIAL_ORDER_STATUS.draft ||
    input.previous === MATERIAL_ORDER_STATUS.rejected
  ) {
    return (
      input.next === MATERIAL_ORDER_STATUS.reviewRequested ||
      input.next === MATERIAL_ORDER_STATUS.approved
    );
  }

  if (input.previous === MATERIAL_ORDER_STATUS.reviewRequested) {
    return (
      input.next === MATERIAL_ORDER_STATUS.draft ||
      input.next === MATERIAL_ORDER_STATUS.rejected ||
      input.next === MATERIAL_ORDER_STATUS.approved
    );
  }

  if (input.previous === MATERIAL_ORDER_STATUS.approved) {
    return input.next === MATERIAL_ORDER_STATUS.orderPlaced;
  }

  return false;
}
