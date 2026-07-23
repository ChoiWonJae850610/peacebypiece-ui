import { getWorkOrderDetail, getWorkOrderList, getWorkOrderMaterials } from "../../lib/apiClient";
import type { WorkOrderListStatusFilter } from "../../domain/mobileContract";

export const workOrderQueryController = {
  list(input: { readonly query?: string; readonly status?: WorkOrderListStatusFilter; readonly cursor?: string | null } = {}) {
    return getWorkOrderList(input);
  },
  detail(workOrderId: string) {
    return getWorkOrderDetail(workOrderId);
  },
  materials(workOrderId: string, cursor: string | null = null, lifecycle: "active" | "archived" = "active") {
    return getWorkOrderMaterials(workOrderId, cursor, lifecycle);
  },
} as const;
