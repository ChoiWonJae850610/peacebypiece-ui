import { WaflSurface } from "@/components/common/ui";

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
    <div className="grid gap-2 sm:grid-cols-3">
      <SummaryCard label="총 비용" value={formatMaterialOrderAmount(totals.totalAmount)} emphasize />
      <SummaryCard label="원단 합계" value={formatMaterialOrderAmount(fabricAmount)} />
      <SummaryCard label="부자재 합계" value={formatMaterialOrderAmount(submaterialAmount)} />
    </div>
  );
}

export function MaterialOrderSummaryFooter({ totals }: MaterialOrderSummaryFooterProps) {
  return (
    <WaflSurface component="material-order-summary-footer" tone="info" shape="control" className="shrink-0 p-3 text-[11px] xl:px-4">
      <div className="grid grid-cols-3 items-center gap-3">
        <SummaryValue label="품목" value={`${totals.lineCount}종`} />
        <SummaryValue label="주문" value={String(totals.totalOrderQuantity)} />
        <SummaryValue
          label="할당/잔여"
          value={`${totals.totalAllocatedQuantity} / ${totals.totalRemainingQuantity}`}
        />
      </div>
      <div className="mt-2 flex items-center justify-end">
        <SummaryValue
          label="합계"
          value={formatMaterialOrderAmount(totals.totalAmount)}
          emphasize
        />
      </div>
    </WaflSurface>
  );
}

function SummaryValue({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-1.5">
      <span className="shrink-0 text-[11px] font-semibold pbp-text-subtle">
        {label}
      </span>
      <span
        className={`truncate text-xs font-semibold tabular-nums ${emphasize ? "pbp-text-primary" : "pbp-text-muted"}`}
      >
        {value}
      </span>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <WaflSurface
      component="material-order-summary-card"
      shape="control"
      tone={emphasize ? "info" : "muted"}
      className={`min-w-0 px-3 py-2.5 ${emphasize ? "pbp-cost-grand-total" : ""}`}
    >
      <p className="text-[11px] font-semibold pbp-text-subtle">{label}</p>
      <p className={`mt-1 truncate text-sm font-semibold tabular-nums ${emphasize ? "pbp-text-primary" : "pbp-text-muted"}`}>
        {value}
      </p>
    </WaflSurface>
  );
}
