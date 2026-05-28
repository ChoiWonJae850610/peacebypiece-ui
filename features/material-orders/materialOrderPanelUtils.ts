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
