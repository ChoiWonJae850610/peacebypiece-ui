import { WaflCostSummaryCard, WaflCostSummaryGrid } from "@/components/common/ui";

import {
  formatMaterialOrderAmount,
  type MaterialOrderDraftTotals,
} from "@/lib/material-orders/materialOrderDraftCalculator";

type MaterialOrderSummaryFooterProps = {
  totals: MaterialOrderDraftTotals;
  materialType?: "fabric" | "submaterial" | "";
};

export function MaterialOrderSummaryCards({ totals, materialType = "" }: MaterialOrderSummaryFooterProps) {
  const currentMaterialLabel = materialType === "fabric"
    ? "원단 합계"
    : materialType === "submaterial"
      ? "부자재 합계"
      : "자재 합계";

  return (
    <WaflCostSummaryGrid className="grid-cols-2">
      <WaflCostSummaryCard label="총 비용" value={formatMaterialOrderAmount(totals.totalAmount)} emphasize />
      <WaflCostSummaryCard label={currentMaterialLabel} value={formatMaterialOrderAmount(totals.totalAmount)} />
    </WaflCostSummaryGrid>
  );
}
