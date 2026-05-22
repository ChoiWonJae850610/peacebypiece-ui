import { mergeWorkOrderDetailSnapshotPreservingLocalDraft } from "@/lib/workorder/workOrderDraftMerge";
import type { WorkOrder } from "@/types/workorder";

export function markWorkOrderSummarySnapshot(workOrder: WorkOrder): WorkOrder {
  return {
    ...workOrder,
    hasDetailSnapshot: false,
  };
}

export function markWorkOrderDetailSnapshot(workOrder: WorkOrder): WorkOrder {
  return {
    ...workOrder,
    hasDetailSnapshot: true,
  };
}

export function mergeDetailSnapshotIntoLocalWorkOrder(
  localWorkOrder: WorkOrder,
  detailSnapshot: WorkOrder,
): WorkOrder {
  const mergedSnapshot = markWorkOrderDetailSnapshot({
    ...localWorkOrder,
    ...detailSnapshot,
  });

  if (!localWorkOrder.hasDetailSnapshot) {
    return mergedSnapshot;
  }

  return mergeWorkOrderDetailSnapshotPreservingLocalDraft(localWorkOrder, mergedSnapshot);
}

export function mergeDetailSnapshotIntoWorkOrders(
  workOrders: WorkOrder[],
  detailSnapshot: WorkOrder,
): WorkOrder[] {
  const normalizedSnapshot = markWorkOrderDetailSnapshot(detailSnapshot);

  return workOrders.map((workOrder) =>
    workOrder.id === normalizedSnapshot.id
      ? mergeDetailSnapshotIntoLocalWorkOrder(workOrder, normalizedSnapshot)
      : workOrder,
  );
}

export function replaceWithDetailSnapshot(
  workOrders: WorkOrder[],
  detailSnapshot: WorkOrder,
): WorkOrder[] {
  const normalizedSnapshot = markWorkOrderDetailSnapshot(detailSnapshot);

  return workOrders.map((workOrder) =>
    workOrder.id === normalizedSnapshot.id ? normalizedSnapshot : workOrder,
  );
}
