import { getWorkOrderDetail, getWorkOrderImages, getWorkOrderList, getWorkOrderMaterials } from "../../lib/apiClient";
import type { MaterialType, WorkOrderListStatusFilter } from "../../domain/mobileContract";

export const workOrderQueryController = {
  list(input: { readonly query?: string; readonly status?: WorkOrderListStatusFilter; readonly cursor?: string | null } = {}) {
    return getWorkOrderList(input);
  },
  detail(workOrderId: string) {
    return getWorkOrderDetail(workOrderId);
  },
  images(workOrderId: string) {
    return getWorkOrderImages(workOrderId);
  },
  materials(workOrderId: string, materialType: MaterialType, cursor: string | null = null, lifecycle: "active" | "archived" = "active") {
    return getWorkOrderMaterials(workOrderId, materialType, cursor, lifecycle);
  },
} as const;
