import "server-only";

import {
  type WorkOrderListSort,
  type WorkOrderListStatusFilter,
} from "@/lib/workorder/list/workOrderListControls";
import type {
  WorkOrder,
  WorkOrderStatePatch,
  WorkOrderSummary,
} from "@/types/workorder";
import type { WorkOrderCompanyScope } from "@/lib/workorder/repository/dbWorkOrderRepositoryScope";
import {
  findAllDbWorkOrderRecords,
  findDbWorkOrderRecordById,
  findDbWorkOrderSummaryRecords,
} from "@/lib/workorder/repository/dbWorkOrderReadFlows";
import { deleteDbWorkOrderRecord } from "@/lib/workorder/repository/dbWorkOrderDeleteFlows";
import { updateDbWorkOrderStatePatchRecord } from "@/lib/workorder/repository/dbWorkOrderStatePatchFlows";
import {
  createDbWorkOrderRecord,
  updateDbWorkOrderRecord,
} from "@/lib/workorder/repository/dbWorkOrderMutationFlows";
import {
  saveDbWorkOrderRecord,
  saveDbWorkOrderRecords,
} from "@/lib/workorder/repository/dbWorkOrderSaveFlows";
export type {
  WorkOrderCompanyScope,
  WorkOrderVisibilityScope,
} from "@/lib/workorder/repository/dbWorkOrderRepositoryScope";

type WorkOrderSummaryQueryOptions = {
  status?: WorkOrderListStatusFilter;
  sort?: WorkOrderListSort;
};

export async function findDbWorkOrderSummaries(
  options: WorkOrderSummaryQueryOptions = {},
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrderSummary[]> {
  return findDbWorkOrderSummaryRecords(options, scope);
}

export async function findAllDbWorkOrders(
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder[]> {
  return findAllDbWorkOrderRecords(scope);
}

export async function findDbWorkOrderById(
  workOrderId: string,
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder | null> {
  return findDbWorkOrderRecordById(workOrderId, scope);
}

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
  return updateDbWorkOrderRecord(workOrder, scope, findDbWorkOrderById);
}

export async function updateDbWorkOrderStatePatch(
  patch: WorkOrderStatePatch,
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder> {
  return updateDbWorkOrderStatePatchRecord({
    patch,
    scope,
    findWorkOrderById: findDbWorkOrderById,
  });
}

export async function deleteDbWorkOrder(
  workOrderId: string,
  scope?: WorkOrderCompanyScope | null,
): Promise<string> {
  return deleteDbWorkOrderRecord(workOrderId, scope);
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
