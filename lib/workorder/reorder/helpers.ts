import { getI18n } from "@/lib/i18n";
import type { WorkOrder } from "@/types/workorder";

const i18n = getI18n();
export const REWORK_TO_MAIN_APPEND_ROUND = 1_000_000;

export type WorkOrderTitleKind = "sample" | "main" | "rework";
export type WorkOrderOrderType = "메인 생산" | "샘플" | "재작업";

export type ReorderIdentity = Pick<
  WorkOrder,
  "id" | "title" | "displayTitle" | "baseTitle" | "reorderGroupId" | "reorderRound" | "parentSpecSheetId" | "workOrderKind" | "isDefectOrder"
> & {
  revision?: number | null;
  reorderRootId?: string | null;
  reorderedFromId?: string | null;
  lastSavedAt?: string | null;
};

function stripLegacyTitleMarkers(title: string): string {
  return title
    .replace(/\s*\((샘플|불량)\)\s*/g, " ")
    .replace(/\s+\d+차\s*(\(불량\))?\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function getWorkOrderBaseTitle(workOrder: Partial<ReorderIdentity>): string {
  const structuredBaseTitle = String(workOrder.baseTitle ?? "").trim();
  if (structuredBaseTitle) return structuredBaseTitle;

  const legacyTitleFallback = stripLegacyTitleMarkers(String(workOrder.title ?? "").trim());
  return legacyTitleFallback || i18n.workorder.presentation.titleDraftFallback;
}

export function isWorkOrderKind(value: string | null | undefined, target: WorkOrderTitleKind): boolean {
  return String(value ?? "").trim() === target;
}

export function normalizeWorkOrderKind(value: string | null | undefined, fallback: WorkOrderTitleKind = "sample"): WorkOrderTitleKind {
  const rawKind = String(value ?? "").trim();
  if (rawKind === "sample" || rawKind === "main" || rawKind === "rework") return rawKind;
  return fallback;
}

export function inferWorkOrderKindFromIdentity(workOrder: Partial<ReorderIdentity>): WorkOrderTitleKind {
  if (Boolean(workOrder.isDefectOrder)) return "rework";
  return getWorkOrderReorderRound(workOrder) > 0 ? "main" : "sample";
}

export function getWorkOrderKind(workOrder: Partial<ReorderIdentity>): WorkOrderTitleKind {
  return normalizeWorkOrderKind(workOrder.workOrderKind, inferWorkOrderKindFromIdentity(workOrder));
}

export function isDefectOrder(workOrder: Partial<ReorderIdentity>): boolean {
  if (Boolean(workOrder.isDefectOrder)) return true;
  return isWorkOrderKind(getWorkOrderKind(workOrder), "rework");
}

export function getWorkOrderReorderGroupId(workOrder: Partial<ReorderIdentity>): string {
  return String(workOrder.reorderGroupId ?? workOrder.reorderRootId ?? workOrder.id ?? "").trim();
}

export function getWorkOrderReorderRound(workOrder: Partial<ReorderIdentity>): number {
  const rawRound = workOrder.reorderRound ?? workOrder.revision ?? 0;
  const round = Number(rawRound);
  return Number.isFinite(round) && round >= 0 ? Math.floor(round) : 0;
}

export function getWorkOrderKindFromOrderType(orderType: string | null | undefined): WorkOrderTitleKind {
  const normalizedType = String(orderType ?? "").trim();
  if (normalizedType === "샘플") return "sample";
  if (normalizedType === "재작업") return "rework";
  return "main";
}

export function getOrderTypeFromWorkOrderKind(kind: WorkOrderTitleKind | null | undefined): WorkOrderOrderType {
  if (isWorkOrderKind(kind ?? null, "sample")) return "샘플";
  if (isWorkOrderKind(kind ?? null, "rework")) return "재작업";
  return "메인 생산";
}

export function getWorkOrderOrderType(workOrder: Partial<ReorderIdentity>): WorkOrderOrderType {
  return getOrderTypeFromWorkOrderKind(getWorkOrderKind(workOrder));
}

export function canReorderWorkOrder(workOrder: Partial<ReorderIdentity>): boolean {
  return !isWorkOrderKind(getWorkOrderKind(workOrder), "rework");
}

export function isReworkToMainTransition(currentKind: WorkOrderTitleKind | null | undefined, nextKind: WorkOrderTitleKind | null | undefined): boolean {
  return isWorkOrderKind(currentKind ?? null, "rework") && isWorkOrderKind(nextKind ?? null, "main");
}

export function syncOrderEntriesWithWorkOrderKind<T extends Partial<ReorderIdentity> & { orderEntries?: Array<{ type?: string | null }> }>(workOrder: T): T {
  const nextKind = getWorkOrderKind(workOrder);
  const nextOrderType = getOrderTypeFromWorkOrderKind(nextKind);
  const currentRound = getWorkOrderReorderRound(workOrder);
  const defectOrder = isWorkOrderKind(nextKind, "rework") ? Boolean(workOrder.isDefectOrder ?? true) : false;

  return {
    ...workOrder,
    workOrderKind: nextKind,
    isDefectOrder: defectOrder,
    reorderRound: currentRound,
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

  if (isWorkOrderKind(kind, "sample")) {
    return `${baseTitle} (${i18n.common.ui.common.sample})`;
  }

  const roundSuffix = i18n.workorder.presentation.revisionSuffixFormat.replace("{revision}", String(round));
  if (isWorkOrderKind(kind, "rework") && isDefectOrder(workOrder)) {
    return `${baseTitle} ${roundSuffix} (불량)`;
  }

  return `${baseTitle} ${roundSuffix}`;
}

export function applyReorderIdentity<T extends Partial<ReorderIdentity>>(workOrder: T): T & Pick<WorkOrder, "baseTitle" | "reorderGroupId" | "reorderRound" | "parentSpecSheetId" | "workOrderKind" | "isDefectOrder" | "displayTitle" | "title"> {
  const baseTitle = getWorkOrderBaseTitle(workOrder);
  const reorderGroupId = getWorkOrderReorderGroupId(workOrder);
  const reorderRound = getWorkOrderReorderRound(workOrder);
  const parentSpecSheetId = typeof workOrder.parentSpecSheetId === "string" ? workOrder.parentSpecSheetId : null;
  const workOrderKind = getWorkOrderKind(workOrder);
  const defectOrder = isWorkOrderKind(workOrderKind, "rework") ? isDefectOrder(workOrder) : false;
  const displayTitle = buildWorkOrderTitle({
    ...workOrder,
    baseTitle,
    reorderGroupId,
    reorderRound,
    parentSpecSheetId,
    workOrderKind,
    isDefectOrder: defectOrder,
  });

  return {
    ...workOrder,
    baseTitle,
    reorderGroupId,
    reorderRound,
    parentSpecSheetId,
    workOrderKind,
    isDefectOrder: defectOrder,
    displayTitle,
    title: baseTitle,
  };
}

function getStableSequenceValue(workOrder: WorkOrder): number {
  const parsedLastSavedAt = Date.parse(String(workOrder.lastSavedAt ?? ""));
  if (Number.isFinite(parsedLastSavedAt)) return parsedLastSavedAt;
  const numericId = Number(String(workOrder.id ?? "").replace(/\D/g, ""));
  if (Number.isFinite(numericId) && numericId > 0) return numericId;
  return 0;
}

function compareGroupItems(a: WorkOrder, b: WorkOrder): number {
  const roundDiff = getWorkOrderReorderRound(a) - getWorkOrderReorderRound(b);
  if (roundDiff !== 0) return roundDiff;

  const kindA = getWorkOrderKind(a);
  const kindB = getWorkOrderKind(b);
  const kindRankA = isWorkOrderKind(kindA, "main") ? 0 : isWorkOrderKind(kindA, "rework") ? 1 : 2;
  const kindRankB = isWorkOrderKind(kindB, "main") ? 0 : isWorkOrderKind(kindB, "rework") ? 1 : 2;
  if (kindRankA !== kindRankB) return kindRankA - kindRankB;

  const timeDiff = getStableSequenceValue(a) - getStableSequenceValue(b);
  if (timeDiff !== 0) return timeDiff;
  return String(a.id).localeCompare(String(b.id));
}

function resequenceReorderGroup(workOrders: WorkOrder[]): WorkOrder[] {
  const sampleItems = workOrders
    .filter((item) => isWorkOrderKind(getWorkOrderKind(item), "sample"))
    .sort(compareGroupItems);
  const productionItems = workOrders
    .filter((item) => !isWorkOrderKind(getWorkOrderKind(item), "sample"))
    .sort(compareGroupItems);

  let mainRound = 0;
  const nextProductionItems = productionItems.map((item) => {
    const kind = getWorkOrderKind(item);
    if (isWorkOrderKind(kind, "rework")) {
      return applyReorderIdentity(syncOrderEntriesWithWorkOrderKind({
        ...item,
        workOrderKind: "rework",
        isDefectOrder: true,
        reorderRound: Math.max(1, mainRound),
      }));
    }

    mainRound += 1;
    return applyReorderIdentity(syncOrderEntriesWithWorkOrderKind({
      ...item,
      workOrderKind: "main",
      isDefectOrder: false,
      reorderRound: mainRound,
    }));
  });

  const nextSampleItems = sampleItems.map((item) => applyReorderIdentity(syncOrderEntriesWithWorkOrderKind({
    ...item,
    workOrderKind: "sample",
    isDefectOrder: false,
    reorderRound: 0,
  })));

  const mapped = new Map<string, WorkOrder>();
  [...nextSampleItems, ...nextProductionItems].forEach((item) => {
    mapped.set(item.id, item);
  });

  return workOrders.map((item) => mapped.get(item.id) ?? applyReorderIdentity(syncOrderEntriesWithWorkOrderKind(item)));
}

export function normalizeWorkOrdersReorderIdentity(workOrders: WorkOrder[]): WorkOrder[] {
  const normalized = workOrders.map((workOrder) => syncOrderEntriesWithWorkOrderKind({
    ...workOrder,
    baseTitle: getWorkOrderBaseTitle(workOrder),
  }));

  const groups = new Map<string, WorkOrder[]>();
  normalized.forEach((workOrder) => {
    const groupId = getWorkOrderReorderGroupId(workOrder);
    groups.set(groupId, [...(groups.get(groupId) ?? []), workOrder]);
  });

  const nextById = new Map<string, WorkOrder>();
  groups.forEach((groupItems) => {
    resequenceReorderGroup(groupItems).forEach((item) => {
      nextById.set(item.id, item);
    });
  });

  return normalized.map((workOrder) => nextById.get(workOrder.id) ?? applyReorderIdentity(workOrder));
}

export function reindexReorderGroupAfterDeletion(workOrders: WorkOrder[], deletedWorkOrder: WorkOrder): WorkOrder[] {
  return normalizeWorkOrdersReorderIdentity(workOrders.filter((workOrder) => workOrder.id !== deletedWorkOrder.id));
}

export function getNextReorderRound(workOrders: WorkOrder[], sourceWorkOrder: WorkOrder): number {
  const reorderGroupId = getWorkOrderReorderGroupId(sourceWorkOrder);

  return workOrders.reduce((maxRound, workOrder) => {
    if (getWorkOrderReorderGroupId(workOrder) !== reorderGroupId) return maxRound;
    if (isWorkOrderKind(getWorkOrderKind(workOrder), "sample")) return maxRound;
    return Math.max(maxRound, getWorkOrderReorderRound(workOrder));
  }, 0) + 1;
}
