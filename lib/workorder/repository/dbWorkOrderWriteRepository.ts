import "server-only";

import type { WorkOrder, WorkOrderStatePatch } from "@/types/workorder";
import {
  createDbWorkOrder as createDbWorkOrderFromRepository,
  deleteDbWorkOrder as deleteDbWorkOrderFromRepository,
  saveDbWorkOrder as saveDbWorkOrderFromRepository,
  saveDbWorkOrders as saveDbWorkOrdersFromRepository,
  updateDbWorkOrderStatePatch as updateDbWorkOrderStatePatchFromRepository,
  type WorkOrderCompanyScope,
  type WorkOrderVisibilityScope,
} from "@/lib/workorder/repository/dbWorkOrderRepository";

export type { WorkOrderCompanyScope, WorkOrderVisibilityScope };

export async function createDbWorkOrder(
  workOrder: WorkOrder,
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder> {
  return createDbWorkOrderFromRepository(workOrder, scope);
}

export async function updateDbWorkOrderStatePatch(
  patch: WorkOrderStatePatch,
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder> {
  return updateDbWorkOrderStatePatchFromRepository(patch, scope);
}

export async function deleteDbWorkOrder(
  id: string,
  scope?: WorkOrderCompanyScope | null,
): Promise<string> {
  return deleteDbWorkOrderFromRepository(id, scope);
}

export async function saveDbWorkOrder(
  workOrder: WorkOrder,
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder> {
  return saveDbWorkOrderFromRepository(workOrder, scope);
}

export async function saveDbWorkOrders(
  workOrders: WorkOrder[],
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder[]> {
  return saveDbWorkOrdersFromRepository(workOrders, scope);
}
