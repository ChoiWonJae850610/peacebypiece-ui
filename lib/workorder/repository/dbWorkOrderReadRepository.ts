import "server-only";

import type { WorkOrder, WorkOrderSummary } from "@/types/workorder";
import type {
  WorkOrderListOptions,
} from "@/lib/workorder/repository/workOrderRepositoryContracts";
import {
  findAllDbWorkOrders as findAllDbWorkOrdersFromRepository,
  findDbWorkOrderById as findDbWorkOrderByIdFromRepository,
  findDbWorkOrderSummaries as findDbWorkOrderSummariesFromRepository,
  type WorkOrderCompanyScope,
} from "@/lib/workorder/repository/dbWorkOrderRepository";

export type { WorkOrderCompanyScope };

export async function findDbWorkOrderSummaries(
  options: WorkOrderListOptions = {},
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrderSummary[]> {
  return findDbWorkOrderSummariesFromRepository(options, scope);
}

export async function findAllDbWorkOrders(
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder[]> {
  return findAllDbWorkOrdersFromRepository(scope);
}

export async function findDbWorkOrderById(
  id: string,
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder | null> {
  return findDbWorkOrderByIdFromRepository(id, scope);
}
