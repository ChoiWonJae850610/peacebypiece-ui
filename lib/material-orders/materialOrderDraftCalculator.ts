export type MaterialOrderDraftType = "fabric" | "submaterial";

export type MaterialOrderDraftLine = {
  id: string;
  itemName: string;
  unit: string;
  orderQuantity: number;
  unitPrice: number;
};

export type MaterialOrderDraftTotals = {
  lineCount: number;
  totalOrderQuantity: number;
  totalAmount: number;
};

export function calculateMaterialOrderLineAmount(line: MaterialOrderDraftLine): number {
  const orderQuantity = Number.isFinite(line.orderQuantity) && line.orderQuantity > 0 ? line.orderQuantity : 0;
  const unitPrice = Number.isFinite(line.unitPrice) && line.unitPrice > 0 ? line.unitPrice : 0;
  return Number((orderQuantity * unitPrice).toFixed(2));
}

export function calculateMaterialOrderDraftTotals(lines: readonly MaterialOrderDraftLine[]): MaterialOrderDraftTotals {
  return lines.reduce<MaterialOrderDraftTotals>(
    (totals, line) => {
      const orderQuantity = Number.isFinite(line.orderQuantity) && line.orderQuantity > 0 ? line.orderQuantity : 0;

      return {
        lineCount: totals.lineCount + 1,
        totalOrderQuantity: Number((totals.totalOrderQuantity + orderQuantity).toFixed(2)),
        totalAmount: Number((totals.totalAmount + calculateMaterialOrderLineAmount(line)).toFixed(2)),
      };
    },
    {
      lineCount: 0,
      totalOrderQuantity: 0,
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
