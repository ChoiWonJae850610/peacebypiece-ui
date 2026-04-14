import type { WorkOrder } from "@/types/workorder";
import { normalizeWorkOrderCollectionsForStorage } from "@/lib/workorder/structure";
import { normalizeWorkOrderScalarFields } from "@/lib/workorder/workOrderDataRules";

export function normalizeWorkOrderData(workOrder: WorkOrder): WorkOrder {
  return normalizeWorkOrderScalarFields(normalizeWorkOrderCollectionsForStorage(workOrder));
}

export function normalizeWorkOrderDataList(workOrders: WorkOrder[]) {
  return workOrders.map(normalizeWorkOrderData);
}
