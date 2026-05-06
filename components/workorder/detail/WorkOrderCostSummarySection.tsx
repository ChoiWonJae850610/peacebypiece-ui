import { useI18n } from "@/lib/i18n";
import SummaryCard from "@/components/common/ui/SummaryCard";
import DesktopCostSummaryLayout from "@/components/workorder/detail/layout/DesktopCostSummaryLayout";
import type { Outsourcing } from "@/types/workorder";

export type WorkOrderCostSummarySectionProps = {
  fabricTotal: number;
  subsidiaryTotal: number;
  outsourcingTotal: number;
  laborCost: number;
  lossCost: number;
  totalCost: number;
  unitCost: number;
  outsourcing: Outsourcing[];
};

const COST_ROW_CLASS = "flex min-w-0 items-center justify-between gap-4 rounded-xl bg-stone-50/70 px-3 py-2";
const COST_LABEL_CLASS = "min-w-0 text-[12px] leading-4 text-stone-600";
const COST_VALUE_CLASS = "shrink-0 text-[12px] font-semibold tabular-nums text-stone-900";

export default function WorkOrderCostSummarySection({
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
    <DesktopCostSummaryLayout
      left={<SummaryCard title={copy.summaryTitle}>
        <div className="space-y-2 text-sm">
          <div className="rounded-2xl border border-stone-200 bg-stone-950 px-4 py-3 text-white">
            <div className="text-[11px] font-medium text-stone-300">{copy.grandTotal}</div>
            <div className="mt-1 text-xl font-semibold leading-6 tabular-nums">{totalCost.toLocaleString()}{common.currencySuffix}</div>
            <div className="mt-1 text-[11px] text-stone-300">{copy.unitCost} {unitCost.toLocaleString()}{common.currencySuffix}</div>
          </div>
          <div className={COST_ROW_CLASS}><span className={COST_LABEL_CLASS}>{copy.fabricTotal}</span><span className={COST_VALUE_CLASS}>{fabricTotal.toLocaleString()}{common.currencySuffix}</span></div>
          <div className={COST_ROW_CLASS}><span className={COST_LABEL_CLASS}>{copy.subsidiaryTotal}</span><span className={COST_VALUE_CLASS}>{subsidiaryTotal.toLocaleString()}{common.currencySuffix}</span></div>
          <div className={COST_ROW_CLASS}><span className={COST_LABEL_CLASS}>{copy.outsourcingTotal}</span><span className={COST_VALUE_CLASS}>{outsourcingTotal.toLocaleString()}{common.currencySuffix}</span></div>
          <div className={COST_ROW_CLASS}><span className={COST_LABEL_CLASS}>{copy.laborCost}</span><span className={COST_VALUE_CLASS}>{laborCost.toLocaleString()}{common.currencySuffix}</span></div>
          <div className={COST_ROW_CLASS}><span className={COST_LABEL_CLASS}>{copy.lossCost}</span><span className={COST_VALUE_CLASS}>{lossCost.toLocaleString()}{common.currencySuffix}</span></div>
        </div>
      </SummaryCard>}
      right={<SummaryCard title={copy.processTitle}>
        <div className="space-y-2 text-sm">
          {outsourcing.length > 0 ? outsourcing.map((item, index) => (
            <div key={`${item.id ?? item.process}-${index}`} className="flex min-w-0 items-center justify-between gap-4 rounded-xl border border-stone-200 bg-white px-3 py-2">
              <span className="min-w-0 truncate text-[12px] text-stone-600">{item.process || copy.fallbackProcess.replace("{index}", String(index + 1))}</span>
              <span className="shrink-0 text-[12px] font-semibold tabular-nums text-stone-900">{(item.totalCost ?? 0).toLocaleString()}{common.currencySuffix}</span>
            </div>
          )) : <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">{copy.empty}</div>}
        </div>
      </SummaryCard>}
    />
  );
}
