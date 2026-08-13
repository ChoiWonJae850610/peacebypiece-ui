import {
  getWorkOrderDetail,
  getWorkOrderList,
} from "../../lib/api/workOrdersApi";
import { getWorkOrderImages } from "../../lib/api/assetsApi";
import {
  getWorkOrderMaterials,
  getWorkOrderMaterialPartners,
} from "../../lib/api/materialsApi";
import {
  getWorkOrderSizeColor,
  getWorkOrderSizeSpec,
  getWorkOrderStructureOptions,
} from "../../lib/api/sizeColorApi";
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
  sizeColor(workOrderId: string) {
    return getWorkOrderSizeColor(workOrderId);
  },
  sizeSpec(workOrderId: string) {
    return getWorkOrderSizeSpec(workOrderId);
  },
  structureOptions(workOrderId: string) {
    return getWorkOrderStructureOptions(workOrderId);
  },
  materials(workOrderId: string, materialType: MaterialType, cursor: string | null = null, lifecycle: "active" | "archived" = "active") {
    return getWorkOrderMaterials(workOrderId, materialType, cursor, lifecycle);
  },
  materialPartners(workOrderId: string) {
    return getWorkOrderMaterialPartners(workOrderId);
  },
} as const;
