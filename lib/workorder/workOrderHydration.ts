import { WORKORDER_DRAFT_ONLY_DB_FIELDS } from "@/lib/workorder/storagePolicy";
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

function restoreLocalDraftOnlyFields(localWorkOrder: WorkOrder, nextWorkOrder: WorkOrder): WorkOrder {
  return WORKORDER_DRAFT_ONLY_DB_FIELDS.reduce<WorkOrder>((merged, field) => {
    return {
      ...merged,
      [field]: localWorkOrder[field],
    };
  }, nextWorkOrder);
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

  return restoreLocalDraftOnlyFields(localWorkOrder, mergedSnapshot);
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
