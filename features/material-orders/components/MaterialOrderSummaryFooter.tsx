import { WaflCostSummaryCard, WaflSurface } from "@/components/common/ui";

import {
  calculateMaterialOrderLineAllocatedQuantity,
  calculateMaterialOrderLineAmount,
  formatMaterialOrderAmount,
  type MaterialOrderDraftLine,
  type MaterialOrderDraftTotals,
} from "@/lib/material-orders/materialOrderDraftCalculator";

type MaterialOrderSummaryFooterProps = {
  totals: MaterialOrderDraftTotals;
  lines: MaterialOrderDraftLine[];
  materialType?: "fabric" | "submaterial" | "";
};

export function MaterialOrderSummaryCards({ totals, lines, materialType = "" }: MaterialOrderSummaryFooterProps) {
  const currentMaterialLabel = materialType === "fabric"
    ? "원단 주문 요약"
    : materialType === "submaterial"
      ? "부자재 주문 요약"
      : "자재 주문 요약";

  return (
    <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(150px,0.34fr)_minmax(0,1fr)]">
      <WaflCostSummaryCard label="총 비용" value={formatMaterialOrderAmount(totals.totalAmount)} emphasize />
      <WaflSurface component="material-order-line-summary" shape="control" tone="muted" className="min-w-0 p-3">
        <p className="text-[11px] font-semibold pbp-text-subtle">{currentMaterialLabel}</p>
        {lines.length > 0 ? (
          <div className="mt-2 grid gap-2">
            {lines.map((line) => {
              const requiredQuantity = calculateMaterialOrderLineAllocatedQuantity(line);
              const extraQuantity = Math.max(0, Number((line.orderQuantity - requiredQuantity).toFixed(2)));
              return (
                <div key={line.id} className="grid min-w-0 gap-1 border-t border-[var(--pbp-border)] pt-2 first:border-t-0 first:pt-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-3">
                  <p className="truncate text-xs font-semibold pbp-text-primary">{line.itemName || "품목명 미입력"}</p>
                  <p className="text-[11px] font-medium tabular-nums pbp-text-muted sm:text-right">
                    주문 {line.orderQuantity.toLocaleString()}{line.unit} · 단가 {formatMaterialOrderAmount(line.unitPrice)} · 여유 {extraQuantity.toLocaleString()}{line.unit} · 금액 {formatMaterialOrderAmount(calculateMaterialOrderLineAmount(line))}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-2 text-xs pbp-text-muted">추가된 발주 품목이 없습니다.</p>
        )}
      </WaflSurface>
    </div>
  );
}
