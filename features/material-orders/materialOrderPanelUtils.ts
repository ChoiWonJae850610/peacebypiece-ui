import {
  formatMaterialOrderStatusLabel,
  formatMaterialOrderTypeLabel,
  resolveMaterialOrderType,
} from "@/lib/material-orders/materialOrderWorkspaceClient";
import type { MaterialOrder, MaterialOrderLineItemType, MaterialOrderStatus } from "@/lib/material-orders/types";
import type { MaterialOrderDraftLine } from "@/lib/material-orders/materialOrderDraftCalculator";
import type { MaterialOrderWorkspaceWorkOrderCandidate } from "@/lib/material-orders/materialOrderWorkspaceClient";

export type MaterialOrderFilterStatus = "all" | MaterialOrderStatus;
export type MaterialOrderFilterType = "all" | MaterialOrderLineItemType;

export function filterMaterialOrders({
  orders,
  searchQuery,
  statusFilter,
  typeFilter,
}: {
  orders: MaterialOrder[];
  searchQuery: string;
  statusFilter: MaterialOrderFilterStatus;
  typeFilter: MaterialOrderFilterType;
}): MaterialOrder[] {
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  return orders.filter((order) => {
    const materialType = resolveMaterialOrderType(order);
    if (statusFilter !== "all" && order.status !== statusFilter) return false;
    if (typeFilter !== "all" && materialType !== typeFilter) return false;

    if (!normalizedSearchQuery) return true;

    const searchableText = [
      formatMaterialOrderStatusLabel(order.status),
      formatMaterialOrderTypeLabel(materialType),
      order.supplierPartnerName,
      order.requestedByDisplayName,
      ...order.lines.map((line) => line.itemName),
    ]
      .filter((value): value is string => Boolean(value))
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedSearchQuery);
  });
}

export function filterMaterialOrderCandidates({
  candidates,
  searchQuery,
}: {
  candidates: MaterialOrderWorkspaceWorkOrderCandidate[];
  searchQuery: string;
}): MaterialOrderWorkspaceWorkOrderCandidate[] {
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  if (!normalizedSearchQuery) return candidates;

  return candidates.filter((workOrder) => [
    workOrder.code,
    workOrder.productName,
    workOrder.requestedMaterialLabel,
  ].join(" ").toLowerCase().includes(normalizedSearchQuery));
}

export function formatMaterialOrderDraftLineLabel(lines: MaterialOrderDraftLine[]): string {
  const primaryLine = lines.find((line) => line.itemName.trim().length > 0) ?? null;
  if (!primaryLine) return "품목 미입력";

  const extraCount = Math.max(0, lines.length - 1);
  return extraCount > 0 ? `${primaryLine.itemName.trim()} 외 ${extraCount}건` : primaryLine.itemName.trim();
}

export function isMaterialRequestAlreadyAdded({
  lines,
  workOrderId,
  materialKey,
}: {
  lines: MaterialOrderDraftLine[];
  workOrderId: string;
  materialKey: string;
}): boolean {
  return lines.some((line) => (
    line.sourceWorkOrderId === workOrderId
    && line.sourceMaterialKey === materialKey
  ));
}

export function formatMaterialItemTypeLabel(
  itemType: MaterialOrderWorkspaceWorkOrderCandidate["materialItems"][number]["itemType"],
): string {
  return itemType === "submaterial" ? "부자재" : "원단";
}

export function formatMaterialQuantity(quantity: number, unit: string): string {
  const normalizedQuantity = Number.isFinite(quantity) ? quantity : 0;
  const normalizedUnit = unit.trim();
  return `${normalizedQuantity}${normalizedUnit ? ` ${normalizedUnit}` : ""}`;
}

export function formatMaterialItemTypeCountLabel(
  itemType: MaterialOrderWorkspaceWorkOrderCandidate["materialItems"][number]["itemType"],
  count: number,
): string {
  return `${itemType === "fabric" ? "원단" : "부자재"} ${count}종`;
}

export function normalizeMaterialQuantityNumber(value: number): string {
  const normalizedValue = Number.isFinite(value) ? value : 0;
  if (Number.isInteger(normalizedValue)) return String(normalizedValue);
  return normalizedValue
    .toFixed(3)
    .replace(/\.0+$/, "")
    .replace(/(\.\d*?)0+$/, "$1");
}

export function resolveMaterialQuantityNumberClassName({
  orderedQuantity,
  requiredQuantity,
  currentDraftQuantity,
}: {
  orderedQuantity: number;
  requiredQuantity: number;
  currentDraftQuantity: number;
}): string {
  if (orderedQuantity <= 0) return "text-[var(--pbp-status-danger-fg)]";
  if (orderedQuantity >= requiredQuantity && currentDraftQuantity > 0)
    return "text-[var(--pbp-status-success-fg)]";
  if (orderedQuantity >= requiredQuantity)
    return "text-[var(--pbp-status-info-fg)]";
  return "text-[var(--pbp-status-warning-fg)]";
}


export type MaterialRequestAllocationSummary = {
  allocatedQuantity: number;
  currentDraftQuantity: number;
};

export type MaterialRequestQuantityMap = ReadonlyMap<string, MaterialRequestAllocationSummary>;

const ACTIVE_MATERIAL_ORDER_STATUSES = new Set<MaterialOrder["status"]>([
  "draft",
  "review_requested",
  "approved",
  "order_placed",
]);

const COMPLETED_MATERIAL_ORDER_STATUSES = new Set<MaterialOrder["status"]>([
  "order_placed",
]);

export type MaterialRequestQuantityScope = "active" | "completed";

function getCountedMaterialOrderStatuses(
  quantityScope: MaterialRequestQuantityScope,
): ReadonlySet<MaterialOrder["status"]> {
  return quantityScope === "completed"
    ? COMPLETED_MATERIAL_ORDER_STATUSES
    : ACTIVE_MATERIAL_ORDER_STATUSES;
}

export function createMaterialRequestMapKey(workOrderId: string, materialKey: string): string {
  return `${workOrderId}::${materialKey}`;
}

function normalizePositiveQuantity(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;
}

function addQuantityToMap(
  map: Map<string, MaterialRequestAllocationSummary>,
  key: string,
  patch: Partial<MaterialRequestAllocationSummary>,
): void {
  const current = map.get(key) ?? { allocatedQuantity: 0, currentDraftQuantity: 0 };
  map.set(key, {
    allocatedQuantity: Number((current.allocatedQuantity + normalizePositiveQuantity(patch.allocatedQuantity)).toFixed(3)),
    currentDraftQuantity: Number((current.currentDraftQuantity + normalizePositiveQuantity(patch.currentDraftQuantity)).toFixed(3)),
  });
}

export function buildMaterialRequestQuantityMap({
  orders,
  excludedOrderId,
  draftLines,
  quantityScope = "active",
}: {
  orders: MaterialOrder[];
  excludedOrderId?: string | null;
  draftLines: MaterialOrderDraftLine[];
  quantityScope?: MaterialRequestQuantityScope;
}): MaterialRequestQuantityMap {
  const quantityMap = new Map<string, MaterialRequestAllocationSummary>();
  const countedStatuses = getCountedMaterialOrderStatuses(quantityScope);

  for (const order of orders) {
    if (order.id === excludedOrderId) continue;
    if (!countedStatuses.has(order.status)) continue;

    for (const line of order.lines) {
      for (const allocation of line.allocations) {
        if (!allocation.sourceMaterialKey) continue;
        const mapKey = createMaterialRequestMapKey(allocation.workOrderId, allocation.sourceMaterialKey);
        addQuantityToMap(quantityMap, mapKey, {
          allocatedQuantity: allocation.allocatedQuantity,
        });
      }
    }
  }

  if (quantityScope === "active") {
    for (const line of draftLines) {
      for (const allocation of line.allocations) {
        const sourceMaterialKey = allocation.sourceMaterialKey ?? line.sourceMaterialKey;
        if (!sourceMaterialKey) continue;
        const mapKey = createMaterialRequestMapKey(allocation.workOrderId, sourceMaterialKey);
        addQuantityToMap(quantityMap, mapKey, {
          currentDraftQuantity: allocation.allocatedQuantity,
        });
      }
    }
  }

  return quantityMap;
}

export function calculateMaterialRequestOrderedQuantity(
  quantityMap: MaterialRequestQuantityMap,
  workOrderId: string,
  materialKey: string,
): number {
  const summary = quantityMap.get(createMaterialRequestMapKey(workOrderId, materialKey));
  if (!summary) return 0;
  return Number((summary.allocatedQuantity + summary.currentDraftQuantity).toFixed(3));
}

export function calculateMaterialRequestCurrentDraftQuantity(
  quantityMap: MaterialRequestQuantityMap,
  workOrderId: string,
  materialKey: string,
): number {
  const summary = quantityMap.get(createMaterialRequestMapKey(workOrderId, materialKey));
  if (!summary) return 0;
  return Number(summary.currentDraftQuantity.toFixed(3));
}

export function calculateMaterialRequestRemainingQuantity({
  quantityMap,
  workOrderId,
  materialKey,
  requiredQuantity,
}: {
  quantityMap: MaterialRequestQuantityMap;
  workOrderId: string;
  materialKey: string;
  requiredQuantity: number;
}): number {
  const remainingQuantity = normalizePositiveQuantity(requiredQuantity)
    - calculateMaterialRequestOrderedQuantity(quantityMap, workOrderId, materialKey);
  return Number(Math.max(0, remainingQuantity).toFixed(3));
}


export function calculateMaterialRequestCompletedQuantity(
  quantityMap: MaterialRequestQuantityMap,
  workOrderId: string,
  materialKey: string,
): number {
  const summary = quantityMap.get(createMaterialRequestMapKey(workOrderId, materialKey));
  if (!summary) return 0;
  return Number(summary.allocatedQuantity.toFixed(3));
}

export function calculateMaterialRequestCompletionRemainingQuantity({
  quantityMap,
  workOrderId,
  materialKey,
  requiredQuantity,
}: {
  quantityMap: MaterialRequestQuantityMap;
  workOrderId: string;
  materialKey: string;
  requiredQuantity: number;
}): number {
  const remainingQuantity = normalizePositiveQuantity(requiredQuantity)
    - calculateMaterialRequestCompletedQuantity(quantityMap, workOrderId, materialKey);
  return Number(Math.max(0, remainingQuantity).toFixed(3));
}

export function isMaterialRequestCompletionFulfilled({
  quantityMap,
  workOrderId,
  materialKey,
  requiredQuantity,
}: {
  quantityMap: MaterialRequestQuantityMap;
  workOrderId: string;
  materialKey: string;
  requiredQuantity: number;
}): boolean {
  return calculateMaterialRequestCompletionRemainingQuantity({
    quantityMap,
    workOrderId,
    materialKey,
    requiredQuantity,
  }) <= 0;
}


export type WorkOrderMaterialCompletionSummary = {
  requiredItemCount: number;
  completedItemCount: number;
  inProgressItemCount: number;
  remainingItemCount: number;
  totalRequiredQuantity: number;
  totalInProgressQuantity: number;
  totalCompletedQuantity: number;
  totalCompletionRemainingQuantity: number;
  isComplete: boolean;
  isInProgressCovered: boolean;
};

export function summarizeWorkOrderMaterialCompletion({
  workOrder,
  materialRequestQuantityMap,
  materialRequestCompletionMap,
}: {
  workOrder: MaterialOrderWorkspaceWorkOrderCandidate;
  materialRequestQuantityMap: MaterialRequestQuantityMap;
  materialRequestCompletionMap: MaterialRequestQuantityMap;
}): WorkOrderMaterialCompletionSummary {
  const requiredItemCount = workOrder.materialItems.length;

  return workOrder.materialItems.reduce<WorkOrderMaterialCompletionSummary>((summary, material) => {
    const requiredQuantity = normalizePositiveQuantity(material.quantity);
    const inProgressQuantity = calculateMaterialRequestOrderedQuantity(
      materialRequestQuantityMap,
      workOrder.id,
      material.key,
    );
    const completedQuantity = calculateMaterialRequestCompletedQuantity(
      materialRequestCompletionMap,
      workOrder.id,
      material.key,
    );
    const completionRemainingQuantity = calculateMaterialRequestCompletionRemainingQuantity({
      quantityMap: materialRequestCompletionMap,
      workOrderId: workOrder.id,
      materialKey: material.key,
      requiredQuantity,
    });
    const inProgressRemainingQuantity = calculateMaterialRequestRemainingQuantity({
      quantityMap: materialRequestQuantityMap,
      workOrderId: workOrder.id,
      materialKey: material.key,
      requiredQuantity,
    });

    const nextCompletedItemCount = summary.completedItemCount + (completionRemainingQuantity <= 0 ? 1 : 0);
    const nextInProgressItemCount = summary.inProgressItemCount + (inProgressRemainingQuantity <= 0 ? 1 : 0);

    return {
      requiredItemCount: summary.requiredItemCount,
      completedItemCount: nextCompletedItemCount,
      inProgressItemCount: nextInProgressItemCount,
      remainingItemCount: Math.max(0, summary.requiredItemCount - nextCompletedItemCount),
      totalRequiredQuantity: Number((summary.totalRequiredQuantity + requiredQuantity).toFixed(3)),
      totalInProgressQuantity: Number((summary.totalInProgressQuantity + inProgressQuantity).toFixed(3)),
      totalCompletedQuantity: Number((summary.totalCompletedQuantity + completedQuantity).toFixed(3)),
      totalCompletionRemainingQuantity: Number((summary.totalCompletionRemainingQuantity + completionRemainingQuantity).toFixed(3)),
      isComplete: nextCompletedItemCount >= summary.requiredItemCount && summary.requiredItemCount > 0,
      isInProgressCovered: nextInProgressItemCount >= summary.requiredItemCount && summary.requiredItemCount > 0,
    };
  }, {
    requiredItemCount,
    completedItemCount: 0,
    inProgressItemCount: 0,
    remainingItemCount: requiredItemCount,
    totalRequiredQuantity: 0,
    totalInProgressQuantity: 0,
    totalCompletedQuantity: 0,
    totalCompletionRemainingQuantity: 0,
    isComplete: requiredItemCount === 0,
    isInProgressCovered: requiredItemCount === 0,
  });
}

export function formatWorkOrderMaterialCompletionLabel(summary: WorkOrderMaterialCompletionSummary): string {
  if (summary.requiredItemCount === 0) return "자재 없음";
  if (summary.isComplete) return "자재 발주완료";
  if (summary.isInProgressCovered) return "발주 진행 중";
  return `남은 자재 ${summary.remainingItemCount}개`;
}

export function formatMaterialRequestReadableStatus({
  requiredQuantity,
  orderedQuantity,
  currentDraftQuantity,
  remainingQuantity,
  completedQuantity,
  completionRemainingQuantity,
  unit,
}: {
  requiredQuantity: number;
  orderedQuantity: number;
  currentDraftQuantity: number;
  remainingQuantity: number;
  completedQuantity: number;
  completionRemainingQuantity: number;
  unit: string;
}): string {
  if (completionRemainingQuantity <= 0) return "자재 발주완료";

  if (currentDraftQuantity > 0) {
    const draftLabel = `이번 발주 ${formatMaterialQuantity(currentDraftQuantity, unit)} 선택됨`;
    return remainingQuantity > 0
      ? `${draftLabel} · 남은 수량 ${formatMaterialQuantity(remainingQuantity, unit)}`
      : draftLabel;
  }

  if (completedQuantity > 0) {
    return `발주완료 ${formatMaterialQuantity(completedQuantity, unit)} · 남은 수량 ${formatMaterialQuantity(completionRemainingQuantity, unit)}`;
  }

  if (orderedQuantity > 0) {
    return `발주 진행 ${formatMaterialQuantity(orderedQuantity, unit)} · 남은 수량 ${formatMaterialQuantity(remainingQuantity, unit)}`;
  }

  return `아직 ${formatMaterialQuantity(requiredQuantity, unit)} 남음`;
}
