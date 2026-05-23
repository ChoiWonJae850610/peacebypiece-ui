import type { WorkOrder } from "@/types/workorder";

export function replaceWorkflowPersistedWorkOrder(
  workOrders: WorkOrder[],
  workOrderId: string,
  persistedWorkOrder: WorkOrder,
): WorkOrder[] {
  return workOrders.map((item) => (item.id === workOrderId ? persistedWorkOrder : item));
}
