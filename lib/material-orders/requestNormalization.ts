import { MATERIAL_ORDER_STATUSES, type MaterialOrderLineInput, type MaterialOrderStatus } from "@/lib/material-orders/types";

export type MaterialOrderRequestBody = {
  materialOrderId?: unknown;
  supplierPartnerId?: unknown;
  status?: unknown;
  note?: unknown;
  dueDate?: unknown;
  materialType?: unknown;
  updateMode?: unknown;
  lines?: unknown;
};

export function normalizeMaterialOrderOptionalText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeMaterialOrderNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function isMaterialOrderStatus(value: unknown): value is MaterialOrderStatus {
  return typeof value === "string" && MATERIAL_ORDER_STATUSES.includes(value as MaterialOrderStatus);
}

export function normalizeMaterialOrderLineItemType(value: unknown): MaterialOrderLineInput["itemType"] | null {
  return value === "fabric" || value === "submaterial" ? value : null;
}

export function normalizeMaterialOrderLines(value: unknown): MaterialOrderLineInput[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (typeof item !== "object" || item === null) return [];
    const record = item as Record<string, unknown>;
    const itemName = normalizeMaterialOrderOptionalText(record.itemName);
    const itemType = normalizeMaterialOrderLineItemType(record.itemType);
    const unit = normalizeMaterialOrderOptionalText(record.unit);
    if (!itemName || !itemType || !unit) return [];

    const allocations = Array.isArray(record.allocations)
      ? record.allocations.flatMap((allocation) => {
          if (typeof allocation !== "object" || allocation === null) return [];
          const allocationRecord = allocation as Record<string, unknown>;
          const workOrderId = normalizeMaterialOrderOptionalText(allocationRecord.workOrderId);
          if (!workOrderId) return [];
          return [{
            workOrderId,
            sourceMaterialKey: normalizeMaterialOrderOptionalText(allocationRecord.sourceMaterialKey),
            allocatedQuantity: normalizeMaterialOrderNumber(allocationRecord.allocatedQuantity),
            allocationNote: normalizeMaterialOrderOptionalText(allocationRecord.allocationNote),
          }];
        })
      : [];

    return [{
      partnerItemId: normalizeMaterialOrderOptionalText(record.partnerItemId),
      itemName,
      itemType,
      color: normalizeMaterialOrderOptionalText(record.color),
      spec: normalizeMaterialOrderOptionalText(record.spec),
      unit,
      orderQuantity: normalizeMaterialOrderNumber(record.orderQuantity),
      unitPrice: normalizeMaterialOrderNumber(record.unitPrice),
      amount: normalizeMaterialOrderNumber(record.amount),
      note: normalizeMaterialOrderOptionalText(record.note),
      allocations,
    }];
  });
}
