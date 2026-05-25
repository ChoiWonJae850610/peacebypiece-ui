import "server-only";

import type {
  WorkOrder,
  WorkOrderStatePatch,
  WorkOrderSummary,
} from "@/types/workorder";
import type { WorkOrderListOptions } from "@/lib/workorder/repository/workOrderRepositoryContracts";
import type { WorkOrderCompanyScope } from "@/lib/workorder/repository/dbWorkOrderRepositoryScope";
import {
  findAllDbWorkOrders as findAllDbWorkOrderRecords,
  findDbWorkOrderById as findDbWorkOrderRecordById,
  findDbWorkOrderSummaries as findDbWorkOrderSummaryRecords,
} from "@/lib/workorder/repository/dbWorkOrderReadRepository";
import {
  createDbWorkOrder as createDbWorkOrderRecord,
  deleteDbWorkOrder as deleteDbWorkOrderRecord,
  saveDbWorkOrder as saveDbWorkOrderRecord,
  saveDbWorkOrders as saveDbWorkOrderRecords,
  updateDbWorkOrder as updateDbWorkOrderRecord,
  updateDbWorkOrderStatePatch as updateDbWorkOrderStatePatchRecord,
} from "@/lib/workorder/repository/dbWorkOrderWriteRepository";

export type {
  WorkOrderCompanyScope,
  WorkOrderVisibilityScope,
} from "@/lib/workorder/repository/dbWorkOrderRepositoryScope";

export async function findDbWorkOrderSummaries(
  options: WorkOrderListOptions = {},
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
  return updateDbWorkOrderRecord(workOrder, scope);
}

export async function updateDbWorkOrderStatePatch(
  patch: WorkOrderStatePatch,
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder> {
  return updateDbWorkOrderStatePatchRecord(patch, scope);
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
  return saveDbWorkOrderRecord(workOrder, scope);
}

export async function saveDbWorkOrders(
  workOrders: WorkOrder[],
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder[]> {
  return saveDbWorkOrderRecords(workOrders, scope);
}
