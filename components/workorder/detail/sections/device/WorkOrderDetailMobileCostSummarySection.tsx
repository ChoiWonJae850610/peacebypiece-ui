import { SummaryCard } from "@/components/common/ui";
import type { WorkOrderCostSummarySectionProps } from "@/components/workorder/detail/WorkOrderCostSummarySection";
import { buildWorkOrderCostSummaryPresentation } from "@/lib/workorder/presentation/workOrderCostSummaryPresentation";
import { useI18n } from "@/lib/i18n";

const COST_ROW_CLASS = "pbp-cost-row flex min-w-0 items-center justify-between gap-3 wafl-shape-control px-3 py-2";
const COST_LABEL_CLASS = "min-w-0 text-[12px] leading-4 text-[var(--pbp-text-muted)]";
const COST_VALUE_CLASS = "shrink-0 text-[12px] font-semibold tabular-nums text-[var(--pbp-text-primary)]";

function getCostValueClassName(value: number) {
  return value === 0 ? `${COST_VALUE_CLASS} text-red-600` : COST_VALUE_CLASS;
}

function formatCurrency(value: number, suffix: string) {
  return `${value.toLocaleString()}${suffix}`;
}

export default function WorkOrderDetailMobileCostSummarySection({
  fabricTotal,
  subsidiaryTotal,
  unitCost,
  orderEntries,
  outsourcing,
}: WorkOrderCostSummarySectionProps) {
  const { i18n, locale } = useI18n();
  const copy = i18n.workorder.ui.sections.costSummary;
  const common = i18n.workorder.ui.common;
  const costSummary = buildWorkOrderCostSummaryPresentation({
    fabricTotal,
    subsidiaryTotal,
    unitCost,
    orderEntries,
    outsourcing,
    fallbackProcess: copy.fallbackProcess,
    locale,
  });

  return (
    <section className="grid gap-3">
      <SummaryCard title={copy.summaryTitle || undefined}>
        <div className="space-y-2 text-sm">
          <div className="pbp-cost-grand-total rounded-2xl border px-4 py-3">
            <div className="text-[11px] font-medium opacity-75">{copy.grandTotal}</div>
            <div className="mt-1 text-lg font-semibold leading-6 tabular-nums">{formatCurrency(costSummary.totalCost, common.currencySuffix)}</div>
            <div className="mt-1 text-[11px] opacity-75">{copy.unitCost} {formatCurrency(costSummary.unitCost, common.currencySuffix)}</div>
          </div>
          <div className={COST_ROW_CLASS}><span className={COST_LABEL_CLASS}>{copy.fabricTotal}</span><span className={getCostValueClassName(fabricTotal)}>{formatCurrency(fabricTotal, common.currencySuffix)}</span></div>
          <div className={COST_ROW_CLASS}><span className={COST_LABEL_CLASS}>{copy.subsidiaryTotal}</span><span className={getCostValueClassName(subsidiaryTotal)}>{formatCurrency(subsidiaryTotal, common.currencySuffix)}</span></div>
          <div className={COST_ROW_CLASS}><span className={COST_LABEL_CLASS}>{copy.laborCost}</span><span className={COST_VALUE_CLASS}>{formatCurrency(costSummary.processLaborCost, common.currencySuffix)}</span></div>
          <div className={COST_ROW_CLASS}><span className={COST_LABEL_CLASS}>{copy.lossCost}</span><span className={COST_VALUE_CLASS}>{formatCurrency(costSummary.processLossCost, common.currencySuffix)}</span></div>
        </div>
      </SummaryCard>

      <SummaryCard title={copy.processTitle}>
        <div className="space-y-2 text-sm">
          {costSummary.processLines.length > 0 ? costSummary.processLines.map((item) => (
            <div key={item.id} className="pbp-cost-row wafl-shape-control px-3 py-2">
              <div className="min-w-0 truncate text-[12px] font-semibold text-[var(--pbp-text-primary)]">{item.label}</div>
              <div className="mt-1 text-[11px] leading-4 text-[var(--pbp-text-muted)]">
                {copy.unitPriceLabel} {formatCurrency(item.unitAmount, common.currencySuffix)} · {copy.lossPriceLabel} {formatCurrency(item.lossAmount, common.currencySuffix)} · {copy.lineTotalLabel} {formatCurrency(item.totalAmount, common.currencySuffix)}
              </div>
            </div>
          )) : <div className="pbp-empty-state rounded-2xl border border-dashed px-4 py-6 text-center text-sm">{copy.empty}</div>}
        </div>
      </SummaryCard>
    </section>
  );
}
