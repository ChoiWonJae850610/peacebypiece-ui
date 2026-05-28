import {
  formatMaterialOrderAmount,
  type MaterialOrderDraftTotals,
} from "@/lib/material-orders/materialOrderDraftCalculator";

type MaterialOrderSummaryFooterProps = {
  totals: MaterialOrderDraftTotals;
};

export function MaterialOrderSummaryFooter({ totals }: MaterialOrderSummaryFooterProps) {
  return (
    <div className="shrink-0 rounded-[24px] border border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] px-3.5 py-3 text-[11px] shadow-sm xl:px-4">
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
    </div>
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
