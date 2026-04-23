import type { WorkOrder } from "@/types/workorder";

type DraftComparableWorkOrder = Omit<WorkOrder, "title" | "manager" | "managerId" | "lastSavedAt">;

function toDraftComparableWorkOrder(workOrder: WorkOrder | null | undefined): DraftComparableWorkOrder | null {
  if (!workOrder) return null;

  const { title: _title, manager: _manager, managerId: _managerId, lastSavedAt: _lastSavedAt, ...draftComparable } = workOrder;
  return draftComparable;
}

export function hasWorkOrderDraftChanges(current: WorkOrder | null | undefined, persisted: WorkOrder | null | undefined): boolean {
  const currentComparable = toDraftComparableWorkOrder(current);
  const persistedComparable = toDraftComparableWorkOrder(persisted);

  if (!currentComparable || !persistedComparable) {
    return false;
  }

  return JSON.stringify(currentComparable) !== JSON.stringify(persistedComparable);
}
