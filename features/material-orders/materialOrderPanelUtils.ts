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


export type MaterialRequestAllocationSummary = {
  allocatedQuantity: number;
  currentDraftQuantity: number;
};

export type MaterialRequestQuantityMap = ReadonlyMap<string, MaterialRequestAllocationSummary>;

const COUNTED_MATERIAL_ORDER_STATUSES = new Set<MaterialOrder["status"]>([
  "draft",
  "review_requested",
  "approved",
  "order_placed",
]);

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
}: {
  orders: MaterialOrder[];
  excludedOrderId?: string | null;
  draftLines: MaterialOrderDraftLine[];
}): MaterialRequestQuantityMap {
  const quantityMap = new Map<string, MaterialRequestAllocationSummary>();

  for (const order of orders) {
    if (order.id === excludedOrderId) continue;
    if (!COUNTED_MATERIAL_ORDER_STATUSES.has(order.status)) continue;

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

