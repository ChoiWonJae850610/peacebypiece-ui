import { SummaryCard, WaflEmptyCard, WaflInfoRow, WaflSurface,
  WAFL_WORKSPACE_EMPTY_CARD_CLASS,
} from "@/components/common/ui";
import type { WorkOrderCostSummarySectionProps } from "@/components/workorder/detail/WorkOrderCostSummarySection";
import { buildWorkOrderCostSummaryPresentation } from "@/lib/workorder/presentation/workOrderCostSummaryPresentation";
import { useI18n } from "@/lib/i18n";

const COST_LABEL_CLASS = "min-w-0 text-[12px] leading-4 text-[var(--pbp-text-muted)]";
const COST_VALUE_CLASS = "shrink-0 text-[12px] font-semibold tabular-nums text-[var(--pbp-text-primary)]";

function getCostValueClassName(value: number) {
  return value === 0 ? `${COST_VALUE_CLASS} text-[var(--pbp-status-danger-fg)]` : COST_VALUE_CLASS;
}

function formatCurrency(value: number, suffix: string) {
  return `${value.toLocaleString()}${suffix}`;
}

export default function WorkOrderDetailTabletCostSummarySection({
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
    <section className="grid gap-4 min-[820px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <SummaryCard title={copy.summaryTitle || undefined}>
        <div className="space-y-2 text-sm">
          <WaflSurface component="cost-grand-total" shape="control" tone="info" className="pbp-cost-grand-total px-4 py-3">
            <div className="text-[11px] font-medium opacity-75">{copy.grandTotal}</div>
            <div className="mt-1 text-xl font-semibold leading-6 tabular-nums">{formatCurrency(costSummary.totalCost, common.currencySuffix)}</div>
            <div className="mt-1 text-[11px] opacity-75">{copy.unitCost} {formatCurrency(costSummary.unitCost, common.currencySuffix)}</div>
          </WaflSurface>
          <WaflInfoRow className="pbp-cost-row"><span className={COST_LABEL_CLASS}>{copy.fabricTotal}</span><span className={getCostValueClassName(fabricTotal)}>{formatCurrency(fabricTotal, common.currencySuffix)}</span></WaflInfoRow>
          <WaflInfoRow className="pbp-cost-row"><span className={COST_LABEL_CLASS}>{copy.subsidiaryTotal}</span><span className={getCostValueClassName(subsidiaryTotal)}>{formatCurrency(subsidiaryTotal, common.currencySuffix)}</span></WaflInfoRow>
          <WaflInfoRow className="pbp-cost-row"><span className={COST_LABEL_CLASS}>{copy.laborCost}</span><span className={COST_VALUE_CLASS}>{formatCurrency(costSummary.processLaborCost, common.currencySuffix)}</span></WaflInfoRow>
          <WaflInfoRow className="pbp-cost-row"><span className={COST_LABEL_CLASS}>{copy.lossCost}</span><span className={COST_VALUE_CLASS}>{formatCurrency(costSummary.processLossCost, common.currencySuffix)}</span></WaflInfoRow>
        </div>
      </SummaryCard>

      <SummaryCard title={copy.processTitle}>
        <div className="space-y-2 text-sm">
          {costSummary.processLines.length > 0 ? costSummary.processLines.map((item) => (
            <WaflSurface key={item.id} component="cost-process-row" shape="control" tone="muted" className="pbp-cost-row px-3 py-2">
              <div className="min-w-0 truncate text-[12px] font-semibold text-[var(--pbp-text-primary)]">{item.label}</div>
              <div className="mt-1 text-[11px] leading-4 text-[var(--pbp-text-muted)]">
                {copy.unitPriceLabel} {formatCurrency(item.unitAmount, common.currencySuffix)} · {copy.lossPriceLabel} {formatCurrency(item.lossAmount, common.currencySuffix)} · {copy.lineTotalLabel} {formatCurrency(item.totalAmount, common.currencySuffix)}
              </div>
            </WaflSurface>
          )) : <WaflEmptyCard density="default" className={WAFL_WORKSPACE_EMPTY_CARD_CLASS}>{copy.empty}</WaflEmptyCard>}
        </div>
      </SummaryCard>
    </section>
  );
}
