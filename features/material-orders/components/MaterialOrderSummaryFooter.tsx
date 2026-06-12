import { WaflCostSummaryCard, WaflCostSummaryGrid, WaflCostSummaryRow, WaflSurface } from "@/components/common/ui";

import {
  formatMaterialOrderAmount,
  type MaterialOrderDraftTotals,
} from "@/lib/material-orders/materialOrderDraftCalculator";

type MaterialOrderSummaryFooterProps = {
  totals: MaterialOrderDraftTotals;
  materialType?: "fabric" | "submaterial" | "";
};

export function MaterialOrderSummaryCards({ totals, materialType = "" }: MaterialOrderSummaryFooterProps) {
  const fabricAmount = materialType === "fabric" ? totals.totalAmount : 0;
  const submaterialAmount = materialType === "submaterial" ? totals.totalAmount : 0;

  return (
    <WaflCostSummaryGrid>
      <WaflCostSummaryCard label="총 비용" value={formatMaterialOrderAmount(totals.totalAmount)} emphasize />
      <WaflCostSummaryCard label="원단 합계" value={formatMaterialOrderAmount(fabricAmount)} />
      <WaflCostSummaryCard label="부자재 합계" value={formatMaterialOrderAmount(submaterialAmount)} />
    </WaflCostSummaryGrid>
  );
}

export function MaterialOrderSummaryFooter({ totals }: MaterialOrderSummaryFooterProps) {
  return (
    <WaflSurface component="material-order-summary-footer" tone="info" shape="control" className="shrink-0 p-3 text-[11px] xl:px-4">
      <div className="grid grid-cols-3 items-center gap-3">
        <WaflCostSummaryRow label="품목" value={`${totals.lineCount}종`} />
        <WaflCostSummaryRow label="주문" value={String(totals.totalOrderQuantity)} />
        <WaflCostSummaryRow
          label="할당/잔여"
          value={`${totals.totalAllocatedQuantity} / ${totals.totalRemainingQuantity}`}
        />
      </div>
      <div className="mt-2 flex items-center justify-end">
        <WaflCostSummaryRow
          label="합계"
          value={formatMaterialOrderAmount(totals.totalAmount)}
          emphasize
        />
      </div>
    </WaflSurface>
  );
}
