import "server-only";

import type { WorkOrder } from "@/types/workorder";
import type { WorkOrderCompanyScope } from "@/lib/workorder/repository/dbWorkOrderRepositoryScope";

type WorkOrderMutationHandler = (
  workOrder: WorkOrder,
  scope?: WorkOrderCompanyScope | null,
) => Promise<WorkOrder>;

type SaveDbWorkOrderRecordOptions = {
  workOrder: WorkOrder;
  scope?: WorkOrderCompanyScope | null;
  createWorkOrder: WorkOrderMutationHandler;
  updateWorkOrder: WorkOrderMutationHandler;
};

type SaveDbWorkOrderRecordsOptions = {
  workOrders: WorkOrder[];
  scope?: WorkOrderCompanyScope | null;
  saveWorkOrder: WorkOrderMutationHandler;
};

function isNotFoundWorkOrderError(error: unknown): boolean {
  return (
    error instanceof Error &&
    /spec_sheets row not found for id:/i.test(error.message)
  );
}

export async function saveDbWorkOrderRecord({
  workOrder,
  scope,
  createWorkOrder,
  updateWorkOrder,
}: SaveDbWorkOrderRecordOptions): Promise<WorkOrder> {
  try {
    return await updateWorkOrder(workOrder, scope);
  } catch (error) {
    if (!isNotFoundWorkOrderError(error)) {
      throw error;
    }

    return createWorkOrder(workOrder, scope);
  }
}

export async function saveDbWorkOrderRecords({
  workOrders,
  scope,
  saveWorkOrder,
}: SaveDbWorkOrderRecordsOptions): Promise<WorkOrder[]> {
  const savedWorkOrders: WorkOrder[] = [];

  for (const workOrder of workOrders) {
    savedWorkOrders.push(await saveWorkOrder(workOrder, scope));
  }

  return savedWorkOrders;
}
