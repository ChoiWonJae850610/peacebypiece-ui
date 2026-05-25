import "server-only";

import type { WorkOrder, WorkOrderStatePatch } from "@/types/workorder";
import type {
  WorkOrderCompanyScope,
  WorkOrderVisibilityScope,
} from "@/lib/workorder/repository/dbWorkOrderRepositoryScope";
import {
  createDbWorkOrderRecord,
  updateDbWorkOrderRecord,
} from "@/lib/workorder/repository/dbWorkOrderMutationFlows";
import { findDbWorkOrderRecordById } from "@/lib/workorder/repository/dbWorkOrderReadFlows";
import { deleteDbWorkOrderRecord } from "@/lib/workorder/repository/dbWorkOrderDeleteFlows";
import {
  saveDbWorkOrderRecord,
  saveDbWorkOrderRecords,
} from "@/lib/workorder/repository/dbWorkOrderSaveFlows";
import { updateDbWorkOrderStatePatchRecord } from "@/lib/workorder/repository/dbWorkOrderStatePatchFlows";

export type { WorkOrderCompanyScope, WorkOrderVisibilityScope };

export async function createDbWorkOrder(
  workOrder: WorkOrder,
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder> {
  return createDbWorkOrderRecord(workOrder, scope);
}

export async function updateDbWorkOrder(
  workOrder: WorkOrder,
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder> {
  return updateDbWorkOrderRecord(workOrder, scope, findDbWorkOrderRecordById);
}

export async function updateDbWorkOrderStatePatch(
  patch: WorkOrderStatePatch,
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder> {
  return updateDbWorkOrderStatePatchRecord({
    patch,
    scope,
    findWorkOrderById: findDbWorkOrderRecordById,
  });
}

export async function deleteDbWorkOrder(
  id: string,
  scope?: WorkOrderCompanyScope | null,
): Promise<string> {
  return deleteDbWorkOrderRecord(id, scope);
}

export async function saveDbWorkOrder(
  workOrder: WorkOrder,
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder> {
  return saveDbWorkOrderRecord({
    workOrder,
    scope,
    createWorkOrder: createDbWorkOrder,
    updateWorkOrder: updateDbWorkOrder,
  });
}

export async function saveDbWorkOrders(
  workOrders: WorkOrder[],
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder[]> {
  return saveDbWorkOrderRecords({
    workOrders,
    scope,
    saveWorkOrder: saveDbWorkOrder,
  });
}
