import "server-only";

import { traceWaflFlow, traceWaflResult } from "@/lib/debug/trace";
import { createAttachmentMemoRepository } from "@/lib/workorder/persistence/attachmentMemoAdapter";
import {
  createWorkOrderRecordForCompany,
  deleteWorkOrderRecordForCompany,
  getWorkOrderRecordByCompany,
  listWorkOrderRecordsByCompany,
  listWorkOrderSummaryRecordsByCompany,
  saveWorkOrderRecordForCompany,
  saveWorkOrderRecordsForCompany,
  updateWorkOrderStateRecordForCompany,
  type WorkOrderCompanyScope,
} from "@/lib/workorder/repository/workOrderRepository";
import type {
  MemoThread,
  WorkOrder,
  WorkOrderStatePatch,
  WorkOrderSummary,
} from "@/types/workorder";
import type {
  WorkOrderListSort,
  WorkOrderListStatusFilter,
} from "@/lib/workorder/list/workOrderListControls";

type ReplaceMemoThreadsRepository = {
  replaceMemoThreads: (
    workOrderId: string,
    memoThreads: MemoThread[],
  ) => Promise<void>;
};

export type { WorkOrderCompanyScope };

function canReplaceMemoThreads(
  repository: unknown,
): repository is ReplaceMemoThreadsRepository {
  return (
    typeof repository === "object" &&
    repository !== null &&
    "replaceMemoThreads" in repository &&
    typeof (repository as { replaceMemoThreads?: unknown })
      .replaceMemoThreads === "function"
  );
}

function mergeMemoThreads(
  payloadThreads: MemoThread[] | undefined,
  dbThreads: MemoThread[],
): MemoThread[] {
  const merged = new Map<string, MemoThread>();

  for (const thread of payloadThreads ?? []) {
    merged.set(thread.id, thread);
  }

  for (const thread of dbThreads) {
    merged.set(thread.id, thread);
  }

  return Array.from(merged.values());
}

async function hydrateWorkOrdersWithAttachmentMemoSnapshots(
  workOrders: WorkOrder[],
): Promise<WorkOrder[]> {
  if (workOrders.length === 0) return workOrders;
  traceWaflFlow("service", "workorders.attachments.hydrate", { rows: workOrders.length });

  try {
    const repository = await createAttachmentMemoRepository();
    const info = repository.getRepositoryInfo();

    if (info.mode === "db" && !info.adapterConfigured) {
      return workOrders;
    }

    const snapshots = await Promise.all(
      workOrders.map((workOrder) =>
        repository.listSnapshotByWorkOrderId(workOrder.id),
      ),
    );

    traceWaflResult("workorders.attachments.hydrate", "success", { rows: workOrders.length });

    return workOrders.map((workOrder, index) => {
      const snapshot = snapshots[index];
      if (!snapshot) return workOrder;

      return {
        ...workOrder,
        attachments: snapshot.attachments,
        memoThreads: mergeMemoThreads(
          workOrder.memoThreads,
          snapshot.memoThreads,
        ),
      };
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      const message =
        error instanceof Error
          ? error.message
          : "Attachment snapshot hydration failed.";
      console.warn("[attachment hydration] " + message);
    }
    traceWaflResult("workorders.attachments.hydrate", "error", {
      message: error instanceof Error ? error.message : "unknown",
    });

    return workOrders;
  }
}

async function hydrateWorkOrderWithAttachmentMemoSnapshot(
  workOrder: WorkOrder,
): Promise<WorkOrder> {
  const [hydrated] = await hydrateWorkOrdersWithAttachmentMemoSnapshots([
    workOrder,
  ]);
  return hydrated ?? workOrder;
}

async function replaceWorkOrderMemoThreads(
  workOrder: WorkOrder,
): Promise<void> {
  const repository = await createAttachmentMemoRepository();
  const info = repository.getRepositoryInfo();

  if (
    info.mode !== "db" ||
    !info.adapterConfigured ||
    !canReplaceMemoThreads(repository)
  ) {
    return;
  }

  await repository.replaceMemoThreads(
    workOrder.id,
    workOrder.memoThreads ?? [],
  );
}

export async function listWorkOrdersByCompany(
  scope: WorkOrderCompanyScope,
): Promise<WorkOrder[]> {
  traceWaflFlow("service", "workorders.list", { companyId: scope.companyId });
  const workOrders = await hydrateWorkOrdersWithAttachmentMemoSnapshots(
    await listWorkOrderRecordsByCompany(scope),
  );
  traceWaflResult("workorders.list", "success", { rows: workOrders.length });
  return workOrders;
}

export async function getWorkOrderDetailByCompany(
  workOrderId: string,
  scope: WorkOrderCompanyScope,
): Promise<WorkOrder | null> {
  traceWaflFlow("service", "workorders.detail", { workOrderId, companyId: scope.companyId });
  const workOrder = await getWorkOrderRecordByCompany(workOrderId, scope);
  if (!workOrder) {
    traceWaflResult("workorders.detail", "skip", { workOrderId });
    return null;
  }
  const hydrated = await hydrateWorkOrderWithAttachmentMemoSnapshot(workOrder);
  traceWaflResult("workorders.detail", "success", { workOrderId });
  return hydrated;
}

export async function listWorkOrderSummariesByCompany(
  filters: {
    status: WorkOrderListStatusFilter;
    sort: WorkOrderListSort;
  },
  scope: WorkOrderCompanyScope,
): Promise<WorkOrderSummary[]> {
  traceWaflFlow("service", "workorders.summary", {
    companyId: scope.companyId,
    status: filters.status,
    sort: filters.sort,
  });
  const summaries = await listWorkOrderSummaryRecordsByCompany(filters, scope);
  traceWaflResult("workorders.summary", "success", { rows: summaries.length });
  return summaries;
}

export async function createWorkOrderForCompany(
  workOrder: WorkOrder,
  scope: WorkOrderCompanyScope,
): Promise<WorkOrder> {
  traceWaflFlow("service", "workorders.create", { workOrderId: workOrder.id, companyId: scope.companyId });
  const createdWorkOrder = await createWorkOrderRecordForCompany(workOrder, scope);
  await replaceWorkOrderMemoThreads(workOrder);
  const hydrated = await hydrateWorkOrderWithAttachmentMemoSnapshot(createdWorkOrder);
  traceWaflResult("workorders.create", "success", { workOrderId: hydrated.id });
  return hydrated;
}

export async function listExistingWorkOrdersByCompany(
  workOrderIds: string[],
  scope: WorkOrderCompanyScope,
): Promise<WorkOrder[]> {
  const uniqueWorkOrderIds = Array.from(new Set(workOrderIds));
  const workOrders = await Promise.all(
    uniqueWorkOrderIds.map((workOrderId) =>
      getWorkOrderRecordByCompany(workOrderId, scope),
    ),
  );

  return workOrders.filter((workOrder): workOrder is WorkOrder =>
    Boolean(workOrder),
  );
}

export async function saveWorkOrdersForCompany(
  workOrders: WorkOrder[],
  scope: WorkOrderCompanyScope,
): Promise<WorkOrder[]> {
  traceWaflFlow("service", "workorders.bulkSave", { rows: workOrders.length, companyId: scope.companyId });
  const savedWorkOrders = await hydrateWorkOrdersWithAttachmentMemoSnapshots(
    await saveWorkOrderRecordsForCompany(workOrders, scope),
  );
  traceWaflResult("workorders.bulkSave", "success", { rows: savedWorkOrders.length });
  return savedWorkOrders;
}

export async function saveWorkOrderForCompany(
  workOrder: WorkOrder,
  scope: WorkOrderCompanyScope,
): Promise<WorkOrder> {
  traceWaflFlow("service", "workorders.save", { workOrderId: workOrder.id, companyId: scope.companyId });
  const savedWorkOrder = await hydrateWorkOrderWithAttachmentMemoSnapshot(
    await saveWorkOrderRecordForCompany(workOrder, scope),
  );
  traceWaflResult("workorders.save", "success", { workOrderId: savedWorkOrder.id });
  return savedWorkOrder;
}

export async function updateWorkOrderStateForCompany(
  patch: WorkOrderStatePatch,
  scope: WorkOrderCompanyScope,
): Promise<WorkOrder> {
  traceWaflFlow("service", "workorders.statePatch", { workOrderId: patch.id, companyId: scope.companyId });
  const savedWorkOrder = await updateWorkOrderStateRecordForCompany(patch, scope);
  traceWaflResult("workorders.statePatch", "success", { workOrderId: savedWorkOrder.id });
  return savedWorkOrder;
}

export async function deleteWorkOrderForCompany(
  workOrderId: string,
  scope: WorkOrderCompanyScope,
): Promise<string> {
  traceWaflFlow("service", "workorders.delete", { workOrderId, companyId: scope.companyId });
  const deletedWorkOrderId = await deleteWorkOrderRecordForCompany(workOrderId, scope);
  traceWaflResult("workorders.delete", "success", { workOrderId: deletedWorkOrderId });
  return deletedWorkOrderId;
}
