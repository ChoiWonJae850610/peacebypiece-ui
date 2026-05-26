import type { MaterialOrderDraftLine, MaterialOrderDraftType } from "@/lib/material-orders/materialOrderDraftCalculator";

export const materialTypeLabels: Record<MaterialOrderDraftType, string> = {
  fabric: "원단",
  submaterial: "부자재",
};

export function createMaterialOrderDraftLine(index: number): MaterialOrderDraftLine {
  return {
    id: `draft-line-${Date.now()}-${index}`,
    itemName: "",
    unit: "마",
    orderQuantity: 0,
    unitPrice: 0,
  };
}
