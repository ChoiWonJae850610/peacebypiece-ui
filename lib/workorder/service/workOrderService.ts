import "server-only";

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
  return hydrateWorkOrdersWithAttachmentMemoSnapshots(
    await listWorkOrderRecordsByCompany(scope),
  );
}

export async function getWorkOrderDetailByCompany(
  workOrderId: string,
  scope: WorkOrderCompanyScope,
): Promise<WorkOrder | null> {
  const workOrder = await getWorkOrderRecordByCompany(workOrderId, scope);
  if (!workOrder) return null;
  return hydrateWorkOrderWithAttachmentMemoSnapshot(workOrder);
}

export async function listWorkOrderSummariesByCompany(
  filters: {
    status: WorkOrderListStatusFilter;
    sort: WorkOrderListSort;
  },
  scope: WorkOrderCompanyScope,
): Promise<WorkOrderSummary[]> {
  return listWorkOrderSummaryRecordsByCompany(filters, scope);
}

export async function createWorkOrderForCompany(
  workOrder: WorkOrder,
  scope: WorkOrderCompanyScope,
): Promise<WorkOrder> {
  const createdWorkOrder = await createWorkOrderRecordForCompany(workOrder, scope);
  await replaceWorkOrderMemoThreads(workOrder);
  return hydrateWorkOrderWithAttachmentMemoSnapshot(createdWorkOrder);
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
  return hydrateWorkOrdersWithAttachmentMemoSnapshots(
    await saveWorkOrderRecordsForCompany(workOrders, scope),
  );
}

export async function saveWorkOrderForCompany(
  workOrder: WorkOrder,
  scope: WorkOrderCompanyScope,
): Promise<WorkOrder> {
  return hydrateWorkOrderWithAttachmentMemoSnapshot(
    await saveWorkOrderRecordForCompany(workOrder, scope),
  );
}

export async function updateWorkOrderStateForCompany(
  patch: WorkOrderStatePatch,
  scope: WorkOrderCompanyScope,
): Promise<WorkOrder> {
  return updateWorkOrderStateRecordForCompany(patch, scope);
}

export async function deleteWorkOrderForCompany(
  workOrderId: string,
  scope: WorkOrderCompanyScope,
): Promise<string> {
  return deleteWorkOrderRecordForCompany(workOrderId, scope);
}
