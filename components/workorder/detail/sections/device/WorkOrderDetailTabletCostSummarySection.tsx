import { SummaryCard } from "@/components/common/ui";
import type { WorkOrderCostSummarySectionProps } from "@/components/workorder/detail/WorkOrderCostSummarySection";
import { useI18n } from "@/lib/i18n";

export default function WorkOrderDetailTabletCostSummarySection({
  fabricTotal,
  subsidiaryTotal,
  outsourcingTotal,
  laborCost,
  lossCost,
  totalCost,
  unitCost,
  outsourcing,
}: WorkOrderCostSummarySectionProps) {
  const { i18n } = useI18n();
  const copy = i18n.workorder.ui.sections.costSummary;
  const common = i18n.workorder.ui.common;

  return (
    <section className="grid gap-4 grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <SummaryCard title={copy.summaryTitle}>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            [copy.fabricTotal, fabricTotal],
            [copy.subsidiaryTotal, subsidiaryTotal],
            [copy.outsourcingTotal, outsourcingTotal],
            [copy.laborCost, laborCost],
            [copy.lossCost, lossCost],
          ].map(([label, value]) => (
            <div key={label} className="pbp-cost-row rounded-xl px-3 py-3">
              <div className="text-xs text-[var(--pbp-text-muted)]">{label}</div>
              <div className="mt-1 text-sm font-semibold tabular-nums text-[var(--pbp-text-primary)]">{Number(value).toLocaleString()}{common.currencySuffix}</div>
            </div>
          ))}
          <div className="pbp-cost-total col-span-2 rounded-xl border px-3 py-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-[var(--pbp-text-primary)]">{copy.grandTotal}</span>
              <span className="font-semibold tabular-nums text-[var(--pbp-text-primary)]">{totalCost.toLocaleString()}{common.currencySuffix}</span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 text-xs text-[var(--pbp-text-muted)]">
              <span>{copy.unitCost}</span>
              <span className="font-medium tabular-nums text-[var(--pbp-text-primary)]">{unitCost.toLocaleString()}{common.currencySuffix}</span>
            </div>
          </div>
        </div>
      </SummaryCard>

      <SummaryCard title={copy.processTitle}>
        <div className="grid gap-2 text-sm">
          {outsourcing.length > 0 ? (
            outsourcing.map((item, index) => (
              <div key={`${item.id ?? item.process}-${index}`} className="pbp-cost-row flex items-center justify-between gap-4 rounded-xl px-3 py-3">
                <span className="text-[var(--pbp-text-muted)]">{item.process || copy.fallbackProcess.replace("{index}", String(index + 1))}</span>
                <span className="font-semibold tabular-nums text-[var(--pbp-text-primary)]">{(item.totalCost ?? 0).toLocaleString()}{common.currencySuffix}</span>
              </div>
            ))
          ) : (
            <div className="pbp-empty-state rounded-xl border border-dashed px-3 py-4 text-sm">{copy.empty}</div>
          )}
        </div>
      </SummaryCard>
    </section>
  );
}
