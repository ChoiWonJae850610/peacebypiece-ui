import "server-only";

import { traceWaflFlow, traceWaflResult } from "@/lib/debug/trace";
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

function traceQueryStart(name: string, payload?: Record<string, string | number | boolean | null | undefined>) {
  traceWaflFlow("query", name, payload);
}

function traceQuerySuccess(name: string, payload?: Record<string, string | number | boolean | null | undefined>) {
  traceWaflResult(name, "success", payload);
}

export async function listWorkOrderSummaryRecordsByCompany(
  options: WorkOrderSummaryQueryOptions,
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrderSummary[]> {
  traceQueryStart("workorders.summary.query", {
    companyId: scope?.companyId ?? null,
    status: options.status,
    sort: options.sort,
  });
  const summaries = await findDbWorkOrderSummaries(options, scope);
  traceQuerySuccess("workorders.summary.query", { rows: summaries.length });
  return summaries;
}

export async function listWorkOrderRecordsByCompany(
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder[]> {
  traceQueryStart("workorders.list.query", { companyId: scope?.companyId ?? null });
  const workOrders = await findAllDbWorkOrders(scope);
  traceQuerySuccess("workorders.list.query", { rows: workOrders.length });
  return workOrders;
}

export async function getWorkOrderRecordByCompany(
  workOrderId: string,
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder | null> {
  traceQueryStart("workorders.detail.query", {
    workOrderId,
    companyId: scope?.companyId ?? null,
  });
  const workOrder = await findDbWorkOrderById(workOrderId, scope);
  traceQuerySuccess("workorders.detail.query", { found: Boolean(workOrder) });
  return workOrder;
}

export async function createWorkOrderRecordForCompany(
  workOrder: WorkOrder,
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder> {
  traceQueryStart("workorders.create.query", {
    workOrderId: workOrder.id,
    companyId: scope?.companyId ?? null,
  });
  const createdWorkOrder = await createDbWorkOrder(workOrder, scope);
  traceQuerySuccess("workorders.create.query", { workOrderId: createdWorkOrder.id });
  return createdWorkOrder;
}

export async function updateWorkOrderStateRecordForCompany(
  patch: WorkOrderStatePatch,
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder> {
  traceQueryStart("workorders.statePatch.query", {
    workOrderId: patch.id,
    companyId: scope?.companyId ?? null,
  });
  const workOrder = await updateDbWorkOrderStatePatch(patch, scope);
  traceQuerySuccess("workorders.statePatch.query", { workOrderId: workOrder.id });
  return workOrder;
}

export async function deleteWorkOrderRecordForCompany(
  workOrderId: string,
  scope?: WorkOrderCompanyScope | null,
): Promise<string> {
  traceQueryStart("workorders.delete.query", {
    workOrderId,
    companyId: scope?.companyId ?? null,
  });
  const deletedWorkOrderId = await deleteDbWorkOrder(workOrderId, scope);
  traceQuerySuccess("workorders.delete.query", { workOrderId: deletedWorkOrderId });
  return deletedWorkOrderId;
}

export async function saveWorkOrderRecordForCompany(
  workOrder: WorkOrder,
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder> {
  traceQueryStart("workorders.save.query", {
    workOrderId: workOrder.id,
    companyId: scope?.companyId ?? null,
  });
  const savedWorkOrder = await saveDbWorkOrder(workOrder, scope);
  traceQuerySuccess("workorders.save.query", { workOrderId: savedWorkOrder.id });
  return savedWorkOrder;
}

export async function saveWorkOrderRecordsForCompany(
  workOrders: WorkOrder[],
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder[]> {
  traceQueryStart("workorders.bulkSave.query", {
    rows: workOrders.length,
    companyId: scope?.companyId ?? null,
  });
  const savedWorkOrders = await saveDbWorkOrders(workOrders, scope);
  traceQuerySuccess("workorders.bulkSave.query", { rows: savedWorkOrders.length });
  return savedWorkOrders;
}
