import { WORKORDER_DRAFT_ONLY_DB_FIELDS } from "@/lib/workorder/storagePolicy";
import type { WorkOrder } from "@/types/workorder";

export function restoreWorkOrderDraftOnlyFields(
  localWorkOrder: WorkOrder,
  nextWorkOrder: WorkOrder,
): WorkOrder {
  return WORKORDER_DRAFT_ONLY_DB_FIELDS.reduce<WorkOrder>((merged, field) => {
    return {
      ...merged,
      [field]: localWorkOrder[field],
    };
  }, nextWorkOrder);
}

export function mergePersistedWorkOrderPreservingLocalDraft(
  localWorkOrder: WorkOrder,
  persistedWorkOrder: WorkOrder,
): WorkOrder {
  return restoreWorkOrderDraftOnlyFields(localWorkOrder, {
    ...localWorkOrder,
    ...persistedWorkOrder,
    hasDetailSnapshot: localWorkOrder.hasDetailSnapshot ?? persistedWorkOrder.hasDetailSnapshot,
  });
}

export function mergeWorkOrderDetailSnapshotPreservingLocalDraft(
  localWorkOrder: WorkOrder,
  detailSnapshot: WorkOrder,
): WorkOrder {
  return restoreWorkOrderDraftOnlyFields(localWorkOrder, {
    ...localWorkOrder,
    ...detailSnapshot,
    hasDetailSnapshot: true,
  });
}
