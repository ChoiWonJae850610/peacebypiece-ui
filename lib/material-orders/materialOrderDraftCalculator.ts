export type MaterialOrderDraftType = "fabric" | "submaterial";

export type MaterialOrderDraftAllocation = {
  workOrderId: string;
  allocatedQuantity: number;
  allocationNote: string;
};

export type MaterialOrderDraftLine = {
  id: string;
  itemName: string;
  unit: string;
  orderQuantity: number;
  unitPrice: number;
  allocations: MaterialOrderDraftAllocation[];
};

export type MaterialOrderDraftTotals = {
  lineCount: number;
  totalOrderQuantity: number;
  totalAllocatedQuantity: number;
  totalRemainingQuantity: number;
  totalAmount: number;
};

function normalizeQuantity(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function calculateMaterialOrderLineAmount(line: MaterialOrderDraftLine): number {
  const orderQuantity = normalizeQuantity(line.orderQuantity);
  const unitPrice = Number.isFinite(line.unitPrice) && line.unitPrice > 0 ? line.unitPrice : 0;
  return Number((orderQuantity * unitPrice).toFixed(2));
}

export function calculateMaterialOrderLineAllocatedQuantity(line: MaterialOrderDraftLine): number {
  return Number(
    line.allocations
      .reduce((sum, allocation) => sum + normalizeQuantity(allocation.allocatedQuantity), 0)
      .toFixed(2),
  );
}

export function calculateMaterialOrderLineRemainingQuantity(line: MaterialOrderDraftLine): number {
  return Number((normalizeQuantity(line.orderQuantity) - calculateMaterialOrderLineAllocatedQuantity(line)).toFixed(2));
}

export function calculateMaterialOrderDraftTotals(lines: readonly MaterialOrderDraftLine[]): MaterialOrderDraftTotals {
  return lines.reduce<MaterialOrderDraftTotals>(
    (totals, line) => {
      const orderQuantity = normalizeQuantity(line.orderQuantity);
      const allocatedQuantity = calculateMaterialOrderLineAllocatedQuantity(line);

      return {
        lineCount: totals.lineCount + 1,
        totalOrderQuantity: Number((totals.totalOrderQuantity + orderQuantity).toFixed(2)),
        totalAllocatedQuantity: Number((totals.totalAllocatedQuantity + allocatedQuantity).toFixed(2)),
        totalRemainingQuantity: Number((totals.totalRemainingQuantity + orderQuantity - allocatedQuantity).toFixed(2)),
        totalAmount: Number((totals.totalAmount + calculateMaterialOrderLineAmount(line)).toFixed(2)),
      };
    },
    {
      lineCount: 0,
      totalOrderQuantity: 0,
      totalAllocatedQuantity: 0,
      totalRemainingQuantity: 0,
      totalAmount: 0,
    },
  );
}

export function formatMaterialOrderAmount(value: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}
