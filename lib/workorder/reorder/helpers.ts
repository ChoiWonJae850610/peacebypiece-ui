import { getI18n } from "@/lib/i18n";
import type { WorkOrder } from "@/types/workorder";

const i18n = getI18n();

export type ReorderIdentity = Pick<WorkOrder, "id" | "title" | "baseTitle" | "reorderGroupId" | "reorderRound"> & {
  revision?: number | null;
  reorderRootId?: string | null;
};

export function getWorkOrderBaseTitle(workOrder: Partial<ReorderIdentity>): string {
  return String(workOrder.baseTitle ?? workOrder.title ?? "").trim() || i18n.workorder.presentation.titleDraftFallback;
}

export function getWorkOrderReorderGroupId(workOrder: Partial<ReorderIdentity>): string {
  return String(workOrder.reorderGroupId ?? workOrder.reorderRootId ?? workOrder.id ?? "").trim();
}

export function getWorkOrderReorderRound(workOrder: Partial<ReorderIdentity>): number {
  const rawRound = workOrder.reorderRound ?? workOrder.revision ?? 1;
  const round = Number(rawRound);
  return Number.isFinite(round) && round > 0 ? Math.floor(round) : 1;
}

export function buildWorkOrderTitle(workOrder: Partial<ReorderIdentity>): string {
  const baseTitle = getWorkOrderBaseTitle(workOrder);
  const round = getWorkOrderReorderRound(workOrder);
  const suffix = i18n.workorder.presentation.revisionSuffixFormat.replace("{revision}", String(round));
  return round > 1 ? `${baseTitle} ${suffix}` : baseTitle;
}

export function applyReorderIdentity<T extends Partial<ReorderIdentity>>(workOrder: T): T & Pick<WorkOrder, "baseTitle" | "reorderGroupId" | "reorderRound" | "title"> {
  const baseTitle = getWorkOrderBaseTitle(workOrder);
  const reorderGroupId = getWorkOrderReorderGroupId(workOrder);
  const reorderRound = getWorkOrderReorderRound(workOrder);

  return {
    ...workOrder,
    baseTitle,
    reorderGroupId,
    reorderRound,
    title: buildWorkOrderTitle({ ...workOrder, baseTitle, reorderGroupId, reorderRound }),
  };
}

export function normalizeWorkOrdersReorderIdentity(workOrders: WorkOrder[]): WorkOrder[] {
  return workOrders.map((workOrder) => applyReorderIdentity(workOrder));
}

export function reindexReorderGroupAfterDeletion(workOrders: WorkOrder[], deletedWorkOrder: WorkOrder): WorkOrder[] {
  const reorderGroupId = getWorkOrderReorderGroupId(deletedWorkOrder);
  const deletedRound = getWorkOrderReorderRound(deletedWorkOrder);

  return workOrders.map((workOrder) => {
    if (workOrder.id === deletedWorkOrder.id) return workOrder;
    if (getWorkOrderReorderGroupId(workOrder) !== reorderGroupId) return applyReorderIdentity(workOrder);

    const currentRound = getWorkOrderReorderRound(workOrder);
    if (currentRound <= deletedRound) return applyReorderIdentity(workOrder);

    return applyReorderIdentity({
      ...workOrder,
      reorderRound: currentRound - 1,
    });
  });
}

export function getNextReorderRound(workOrders: WorkOrder[], sourceWorkOrder: WorkOrder): number {
  const reorderGroupId = getWorkOrderReorderGroupId(sourceWorkOrder);

  return workOrders.reduce((maxRound, workOrder) => {
    if (getWorkOrderReorderGroupId(workOrder) !== reorderGroupId) return maxRound;
    return Math.max(maxRound, getWorkOrderReorderRound(workOrder));
  }, 1) + 1;
}
