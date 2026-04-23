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
        <div className="space-y-3 text-sm">
          <div className="flex min-w-0 items-center justify-between gap-4"><span className="text-stone-600">{copy.fabricTotal}</span><span className="font-medium text-stone-900">{fabricTotal.toLocaleString()}{common.currencySuffix}</span></div>
          <div className="flex min-w-0 items-center justify-between gap-4"><span className="text-stone-600">{copy.subsidiaryTotal}</span><span className="font-medium text-stone-900">{subsidiaryTotal.toLocaleString()}{common.currencySuffix}</span></div>
          <div className="flex min-w-0 items-center justify-between gap-4"><span className="text-stone-600">{copy.outsourcingTotal}</span><span className="font-medium text-stone-900">{outsourcingTotal.toLocaleString()}{common.currencySuffix}</span></div>
          <div className="flex min-w-0 items-center justify-between gap-4"><span className="text-stone-600">{copy.laborCost}</span><span className="font-medium text-stone-900">{laborCost.toLocaleString()}{common.currencySuffix}</span></div>
          <div className="flex min-w-0 items-center justify-between gap-4"><span className="text-stone-600">{copy.lossCost}</span><span className="font-medium text-stone-900">{lossCost.toLocaleString()}{common.currencySuffix}</span></div>
          <div className="border-t border-stone-200 pt-3">
            <div className="flex min-w-0 items-center justify-between gap-4"><span className="font-semibold text-stone-900">{copy.grandTotal}</span><span className="font-semibold text-stone-900">{totalCost.toLocaleString()}{common.currencySuffix}</span></div>
            <div className="mt-3 flex items-center justify-between gap-4"><span className="text-stone-600">{copy.unitCost}</span><span className="font-medium text-stone-900">{unitCost.toLocaleString()}{common.currencySuffix}</span></div>
          </div>
        </div>
      </SummaryCard>}
      right={<SummaryCard title={copy.processTitle}>
        <div className="space-y-2 text-sm">
          {outsourcing.length > 0 ? outsourcing.map((item, index) => (
            <div key={`${item.id ?? item.process}-${index}`} className="flex min-w-0 items-center justify-between gap-4">
              <span className="text-stone-600">{item.process || copy.fallbackProcess.replace("{index}", String(index + 1))}</span>
              <span className="font-medium text-stone-900">{(item.totalCost ?? 0).toLocaleString()}{common.currencySuffix}</span>
            </div>
          )) : <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-3 py-4 text-sm text-stone-500">{copy.empty}</div>}
        </div>
      </SummaryCard>}
    />
  );
}
