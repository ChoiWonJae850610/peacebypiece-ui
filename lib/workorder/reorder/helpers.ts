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
    .replace(/\s+\d+차\s*(\(불량\))?\s*$/g, "")
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
  if (rawKind === "sample" || rawKind === "main" || rawKind === "rework") return rawKind;

  const rawTitle = String(workOrder.displayTitle ?? workOrder.title ?? "").trim();
  if (rawTitle.includes("(불량)")) return "rework";
  if (/\d+차\s*(\(불량\))?$/.test(rawTitle)) return "main";
  if (rawTitle.includes(`(${i18n.common.ui.common.sample})`)) return "sample";
  return Number(workOrder.reorderRound ?? workOrder.revision ?? 1) > 1 ? "main" : "sample";
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


export function getWorkOrderKindFromOrderType(orderType: string | null | undefined): WorkOrderTitleKind {
  const normalizedType = String(orderType ?? "").trim();
  if (normalizedType === "샘플") return "sample";
  if (normalizedType === "재작업") return "rework";
  return "main";
}

export function getOrderTypeFromWorkOrderKind(kind: WorkOrderTitleKind | null | undefined): "메인 생산" | "샘플" | "재작업" {
  if (kind === "sample") return "샘플";
  if (kind === "rework") return "재작업";
  return "메인 생산";
}

export function syncOrderEntriesWithWorkOrderKind<T extends Partial<ReorderIdentity> & { orderEntries?: Array<{ type?: string | null }> }>(workOrder: T): T {
  const nextKind = getWorkOrderKind(workOrder);
  const nextOrderType = getOrderTypeFromWorkOrderKind(nextKind);
  const currentRound = getWorkOrderReorderRound(workOrder);
  const nextRound = nextKind === "sample" ? 1 : currentRound;

  return {
    ...workOrder,
    workOrderKind: nextKind,
    isDefectOrder: nextKind === "rework",
    reorderRound: nextRound,
    orderEntries: (workOrder.orderEntries ?? []).map((entry) => ({
      ...entry,
      type: nextOrderType,
    })),
  };
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
  return workOrders.map((workOrder) => applyReorderIdentity(syncOrderEntriesWithWorkOrderKind(workOrder)));
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
    if (getWorkOrderKind(workOrder) === "sample") return maxRound;
    return Math.max(maxRound, getWorkOrderReorderRound(workOrder));
  }, 0) + 1;
}
