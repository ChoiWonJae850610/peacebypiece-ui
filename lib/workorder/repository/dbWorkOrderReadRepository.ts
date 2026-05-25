import "server-only";

import type { WorkOrder, WorkOrderSummary } from "@/types/workorder";
import type {
  WorkOrderListOptions,
} from "@/lib/workorder/repository/workOrderRepositoryContracts";
import type { WorkOrderCompanyScope } from "@/lib/workorder/repository/dbWorkOrderRepositoryScope";
import {
  findAllDbWorkOrderRecords,
  findDbWorkOrderRecordById,
  findDbWorkOrderSummaryRecords,
} from "@/lib/workorder/repository/dbWorkOrderReadFlows";

export type { WorkOrderCompanyScope };

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
  id: string,
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder | null> {
  return findDbWorkOrderRecordById(id, scope);
}
