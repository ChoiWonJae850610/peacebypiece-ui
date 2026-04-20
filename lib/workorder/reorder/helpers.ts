import { getI18n } from "@/lib/i18n";
import type { WorkOrder } from "@/types/workorder";

const i18n = getI18n();

export type WorkOrderTitleKind = "sample" | "main" | "rework";

export type ReorderIdentity = Pick<
  WorkOrder,
  "id" | "title" | "displayTitle" | "baseTitle" | "reorderGroupId" | "reorderRound" | "workOrderKind" | "isDefectOrder"
> & {
  revision?: number | null;
  reorderRootId?: string | null;
};

function stripLegacyTitleMarkers(title: string): string {
  return title
    .replace(/\s*\((샘플|불량)\)\s*/g, " ")
    .replace(/\s+\d+차\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function getWorkOrderBaseTitle(workOrder: Partial<ReorderIdentity>): string {
  const rawTitle = String(workOrder.baseTitle ?? workOrder.title ?? "").trim();
  const normalizedTitle = stripLegacyTitleMarkers(rawTitle);
  return normalizedTitle || i18n.workorder.presentation.titleDraftFallback;
}

export function getWorkOrderKind(workOrder: Partial<ReorderIdentity>): WorkOrderTitleKind {
  const rawKind = String(workOrder.workOrderKind ?? "").trim();
  if (rawKind === "main" || rawKind === "rework") return rawKind;

  const rawTitle = String(workOrder.title ?? workOrder.displayTitle ?? "").trim();
  if (rawTitle.includes("(불량)")) return "rework";
  if (/\d+차\s*(\(불량\))?$/.test(rawTitle) || getWorkOrderReorderRound(workOrder) > 1) return "main";
  if (rawTitle.includes(`(${i18n.common.ui.common.sample})`)) return "sample";
  return "sample";
}

export function isDefectOrder(workOrder: Partial<ReorderIdentity>): boolean {
  if (Boolean(workOrder.isDefectOrder)) return true;
  const rawTitle = String(workOrder.title ?? workOrder.displayTitle ?? "").trim();
  return rawTitle.includes("(불량)");
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
  const kind = getWorkOrderKind(workOrder);
  const round = getWorkOrderReorderRound(workOrder);

  if (kind === "sample") {
    return `${baseTitle} (${i18n.common.ui.common.sample})`;
  }

  const roundSuffix = i18n.workorder.presentation.revisionSuffixFormat.replace("{revision}", String(round));
  if (kind === "rework" && isDefectOrder(workOrder)) {
    return `${baseTitle} ${roundSuffix} (불량)`;
  }

  return `${baseTitle} ${roundSuffix}`;
}

export function applyReorderIdentity<T extends Partial<ReorderIdentity>>(workOrder: T): T & Pick<WorkOrder, "baseTitle" | "reorderGroupId" | "reorderRound" | "workOrderKind" | "isDefectOrder" | "displayTitle" | "title"> {
  const baseTitle = getWorkOrderBaseTitle(workOrder);
  const reorderGroupId = getWorkOrderReorderGroupId(workOrder);
  const reorderRound = getWorkOrderReorderRound(workOrder);
  const workOrderKind = getWorkOrderKind(workOrder);
  const defectOrder = workOrderKind === "rework" ? isDefectOrder(workOrder) : false;
  const displayTitle = buildWorkOrderTitle({
    ...workOrder,
    baseTitle,
    reorderGroupId,
    reorderRound,
    workOrderKind,
    isDefectOrder: defectOrder,
  });

  return {
    ...workOrder,
    baseTitle,
    reorderGroupId,
    reorderRound,
    workOrderKind,
    isDefectOrder: defectOrder,
    displayTitle,
    title: displayTitle,
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
  }, 0) + 1;
}
