import "server-only";

import {
  traceWorkOrderRepositoryQueryStart,
  traceWorkOrderRepositoryQuerySuccess,
} from "@/lib/workorder/repository/workOrderRepositoryTrace";
import {
  createDbWorkOrder,
  deleteDbWorkOrder,
  saveDbWorkOrder,
  saveDbWorkOrders,
  updateDbWorkOrderStatePatch,
  type WorkOrderVisibilityScope,
} from "@/lib/workorder/repository/dbWorkOrderWriteRepository";
import {
  findAllDbWorkOrders,
  findDbWorkOrderById,
  findDbWorkOrderSummaries,
  type WorkOrderCompanyScope,
} from "@/lib/workorder/repository/dbWorkOrderReadRepository";
import type { WorkOrder, WorkOrderStatePatch, WorkOrderSummary } from "@/types/workorder";
import type {
  WorkOrderSummaryQueryOptions,
} from "@/lib/workorder/repository/workOrderRepositoryContracts";

export type { WorkOrderCompanyScope, WorkOrderVisibilityScope };
export type {
  WorkOrderListOptions,
  WorkOrderSummaryQueryOptions,
} from "@/lib/workorder/repository/workOrderRepositoryContracts";

export async function listWorkOrderSummaryRecordsByCompany(
  options: WorkOrderSummaryQueryOptions,
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrderSummary[]> {
  traceWorkOrderRepositoryQueryStart("workorders.summary.query", {
    companyId: scope?.companyId ?? null,
    status: options.status,
    sort: options.sort,
  });
  const summaries = await findDbWorkOrderSummaries(options, scope);
  traceWorkOrderRepositoryQuerySuccess("workorders.summary.query", { rows: summaries.length });
  return summaries;
}

export async function listWorkOrderRecordsByCompany(
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder[]> {
  traceWorkOrderRepositoryQueryStart("workorders.list.query", { companyId: scope?.companyId ?? null });
  const workOrders = await findAllDbWorkOrders(scope);
  traceWorkOrderRepositoryQuerySuccess("workorders.list.query", { rows: workOrders.length });
  return workOrders;
}

export async function getWorkOrderRecordByCompany(
  workOrderId: string,
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder | null> {
  traceWorkOrderRepositoryQueryStart("workorders.detail.query", {
    workOrderId,
    companyId: scope?.companyId ?? null,
  });
  const workOrder = await findDbWorkOrderById(workOrderId, scope);
  traceWorkOrderRepositoryQuerySuccess("workorders.detail.query", { found: Boolean(workOrder) });
  return workOrder;
}

export async function createWorkOrderRecordForCompany(
  workOrder: WorkOrder,
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder> {
  traceWorkOrderRepositoryQueryStart("workorders.create.query", {
    workOrderId: workOrder.id,
    companyId: scope?.companyId ?? null,
  });
  const createdWorkOrder = await createDbWorkOrder(workOrder, scope);
  traceWorkOrderRepositoryQuerySuccess("workorders.create.query", { workOrderId: createdWorkOrder.id });
  return createdWorkOrder;
}

export async function updateWorkOrderStateRecordForCompany(
  patch: WorkOrderStatePatch,
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder> {
  traceWorkOrderRepositoryQueryStart("workorders.statePatch.query", {
    workOrderId: patch.id,
    companyId: scope?.companyId ?? null,
  });
  const workOrder = await updateDbWorkOrderStatePatch(patch, scope);
  traceWorkOrderRepositoryQuerySuccess("workorders.statePatch.query", { workOrderId: workOrder.id });
  return workOrder;
}

export async function deleteWorkOrderRecordForCompany(
  workOrderId: string,
  scope?: WorkOrderCompanyScope | null,
): Promise<string> {
  traceWorkOrderRepositoryQueryStart("workorders.delete.query", {
    workOrderId,
    companyId: scope?.companyId ?? null,
  });
  const deletedWorkOrderId = await deleteDbWorkOrder(workOrderId, scope);
  traceWorkOrderRepositoryQuerySuccess("workorders.delete.query", { workOrderId: deletedWorkOrderId });
  return deletedWorkOrderId;
}

export async function saveWorkOrderRecordForCompany(
  workOrder: WorkOrder,
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder> {
  traceWorkOrderRepositoryQueryStart("workorders.save.query", {
    workOrderId: workOrder.id,
    companyId: scope?.companyId ?? null,
  });
  const savedWorkOrder = await saveDbWorkOrder(workOrder, scope);
  traceWorkOrderRepositoryQuerySuccess("workorders.save.query", { workOrderId: savedWorkOrder.id });
  return savedWorkOrder;
}

export async function saveWorkOrderRecordsForCompany(
  workOrders: WorkOrder[],
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder[]> {
  traceWorkOrderRepositoryQueryStart("workorders.bulkSave.query", {
    rows: workOrders.length,
    companyId: scope?.companyId ?? null,
  });
  const savedWorkOrders = await saveDbWorkOrders(workOrders, scope);
  traceWorkOrderRepositoryQuerySuccess("workorders.bulkSave.query", { rows: savedWorkOrders.length });
  return savedWorkOrders;
}
