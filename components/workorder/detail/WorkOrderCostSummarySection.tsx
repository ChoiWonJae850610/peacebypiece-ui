import { useI18n, type Locale } from "@/lib/i18n";
import SummaryCard from "@/components/common/ui/SummaryCard";
import DesktopCostSummaryLayout from "@/components/workorder/detail/layout/DesktopCostSummaryLayout";
import { calculateOrderEntryAmount, calculateOutsourcingAmount } from "@/lib/workorder/detail/detailCalculations";
import { translateWorkOrderDisplayText } from "@/lib/workorder/presentation/workOrderDisplayTranslation";
import { getTranslatedWorkOrderSelectDisplayValue } from "@/lib/workorder/detail/selectDisplayPresentation";
import type { OrderEntry, Outsourcing } from "@/types/workorder";

export type WorkOrderCostSummarySectionProps = {
  fabricTotal: number;
  subsidiaryTotal: number;
  outsourcingTotal: number;
  laborCost: number;
  lossCost: number;
  totalCost: number;
  unitCost: number;
  orderEntries: OrderEntry[];
  outsourcing: Outsourcing[];
};

const COST_ROW_CLASS = "pbp-cost-row flex min-w-0 items-center justify-between gap-4 rounded-xl px-3 py-2";
const COST_LABEL_CLASS = "min-w-0 text-[12px] leading-4 text-[var(--pbp-text-muted)]";
const COST_VALUE_CLASS = "shrink-0 text-[12px] font-semibold tabular-nums text-[var(--pbp-text-primary)]";

type ProcessCostLine = {
  id: string;
  label: string;
  amount: number;
};

function buildProcessCostLines({
  orderEntries,
  outsourcing,
  fallbackProcess,
  locale,
}: {
  orderEntries: OrderEntry[];
  outsourcing: Outsourcing[];
  fallbackProcess: string;
  locale: Locale;
}): ProcessCostLine[] {
  const productionLines = orderEntries.slice(0, 1).map((item, index) => {
    const typeLabel = translateWorkOrderDisplayText(item.type, locale);
    const factoryLabel = translateWorkOrderDisplayText(item.factory, locale);
    const labels = [typeLabel, factoryLabel].filter(Boolean);
    return {
      id: `production-${item.id}`,
      label: labels.length > 0 ? labels.join(" · ") : fallbackProcess.replace("{index}", String(index + 1)),
      amount: calculateOrderEntryAmount(item),
    };
  });

  const outsourcingLines = outsourcing.map((item, index) => {
    const processLabel = getTranslatedWorkOrderSelectDisplayValue(item.process, (value) => translateWorkOrderDisplayText(value, locale));
    const vendorLabel = getTranslatedWorkOrderSelectDisplayValue(item.vendor, (value) => translateWorkOrderDisplayText(value, locale));
    const labels = [processLabel, vendorLabel].filter(Boolean);
    return {
      id: `outsourcing-${item.id}`,
      label: labels.length > 0 ? labels.join(" · ") : fallbackProcess.replace("{index}", String(productionLines.length + index + 1)),
      amount: calculateOutsourcingAmount(item),
    };
  });

  return [...productionLines, ...outsourcingLines];
}

export default function WorkOrderCostSummarySection({
  fabricTotal,
  subsidiaryTotal,
  laborCost,
  lossCost,
  totalCost,
  unitCost,
  orderEntries,
  outsourcing,
}: WorkOrderCostSummarySectionProps) {
  const { i18n, locale } = useI18n();
  const copy = i18n.workorder.ui.sections.costSummary;
  const common = i18n.workorder.ui.common;
  const processCostLines = buildProcessCostLines({ orderEntries, outsourcing, fallbackProcess: copy.fallbackProcess, locale });

  return (
    <DesktopCostSummaryLayout
      left={<SummaryCard title={copy.summaryTitle}>
        <div className="space-y-2 text-sm">
          <div className="pbp-cost-grand-total rounded-2xl border px-4 py-3">
            <div className="text-[11px] font-medium opacity-75">{copy.grandTotal}</div>
            <div className="mt-1 text-xl font-semibold leading-6 tabular-nums">{totalCost.toLocaleString()}{common.currencySuffix}</div>
            <div className="mt-1 text-[11px] opacity-75">{copy.unitCost} {unitCost.toLocaleString()}{common.currencySuffix}</div>
          </div>
          <div className={COST_ROW_CLASS}><span className={COST_LABEL_CLASS}>{copy.fabricTotal}</span><span className={COST_VALUE_CLASS}>{fabricTotal.toLocaleString()}{common.currencySuffix}</span></div>
          <div className={COST_ROW_CLASS}><span className={COST_LABEL_CLASS}>{copy.subsidiaryTotal}</span><span className={COST_VALUE_CLASS}>{subsidiaryTotal.toLocaleString()}{common.currencySuffix}</span></div>
          <div className={COST_ROW_CLASS}><span className={COST_LABEL_CLASS}>{copy.laborCost}</span><span className={COST_VALUE_CLASS}>{laborCost.toLocaleString()}{common.currencySuffix}</span></div>
          <div className={COST_ROW_CLASS}><span className={COST_LABEL_CLASS}>{copy.lossCost}</span><span className={COST_VALUE_CLASS}>{lossCost.toLocaleString()}{common.currencySuffix}</span></div>
        </div>
      </SummaryCard>}
      right={<SummaryCard title={copy.processTitle}>
        <div className="space-y-2 text-sm">
          {processCostLines.length > 0 ? processCostLines.map((item) => (
            <div key={item.id} className="pbp-cost-row flex min-w-0 items-center justify-between gap-4 rounded-xl px-3 py-2">
              <span className="min-w-0 truncate text-[12px] text-[var(--pbp-text-muted)]">{item.label}</span>
              <span className="shrink-0 text-[12px] font-semibold tabular-nums text-[var(--pbp-text-primary)]">{item.amount.toLocaleString()}{common.currencySuffix}</span>
            </div>
          )) : <div className="pbp-empty-state rounded-2xl border border-dashed px-4 py-6 text-center text-sm">{copy.empty}</div>}
        </div>
      </SummaryCard>}
    />
  );
}
