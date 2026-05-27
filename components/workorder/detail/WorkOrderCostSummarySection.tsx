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
  unitAmount: number;
  lossAmount: number;
  totalAmount: number;
};

function normalizeCostNumber(value: unknown) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, numeric);
}

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
    const quantity = normalizeCostNumber(item.quantity);
    const unitAmount = quantity * normalizeCostNumber(item.laborCost);
    const lossAmount = quantity * normalizeCostNumber(item.lossCost);
    return {
      id: `production-${item.id}`,
      label: labels.length > 0 ? labels.join(" · ") : fallbackProcess.replace("{index}", String(index + 1)),
      unitAmount,
      lossAmount,
      totalAmount: calculateOrderEntryAmount(item),
    };
  });

  const outsourcingLines = outsourcing.map((item, index) => {
    const processLabel = getTranslatedWorkOrderSelectDisplayValue(item.process, (value) => translateWorkOrderDisplayText(value, locale));
    const vendorLabel = getTranslatedWorkOrderSelectDisplayValue(item.vendor, (value) => translateWorkOrderDisplayText(value, locale));
    const labels = [processLabel, vendorLabel].filter(Boolean);
    const quantity = normalizeCostNumber(item.quantity);
    const unitAmount = quantity * normalizeCostNumber(item.unitCost);
    const lossAmount = quantity * normalizeCostNumber(item.lossCost);
    return {
      id: `outsourcing-${item.id}`,
      label: labels.length > 0 ? labels.join(" · ") : fallbackProcess.replace("{index}", String(productionLines.length + index + 1)),
      unitAmount,
      lossAmount,
      totalAmount: calculateOutsourcingAmount(item),
    };
  });

  return [...productionLines, ...outsourcingLines];
}


function getCostValueClassName(value: number) {
  return value === 0 ? `${COST_VALUE_CLASS} text-red-600` : COST_VALUE_CLASS;
}

function formatCurrency(value: number, suffix: string) {
  return `${value.toLocaleString()}${suffix}`;
}

export default function WorkOrderCostSummarySection({
  fabricTotal,
  subsidiaryTotal,
  unitCost,
  orderEntries,
  outsourcing,
}: WorkOrderCostSummarySectionProps) {
  const { i18n, locale } = useI18n();
  const copy = i18n.workorder.ui.sections.costSummary;
  const common = i18n.workorder.ui.common;
  const processCostLines = buildProcessCostLines({ orderEntries, outsourcing, fallbackProcess: copy.fallbackProcess, locale });
  const processLaborCost = processCostLines.reduce((sum, item) => sum + item.unitAmount, 0);
  const processLossCost = processCostLines.reduce((sum, item) => sum + item.lossAmount, 0);
  const displayTotalCost = fabricTotal + subsidiaryTotal + processLaborCost + processLossCost;
  const productionQuantity = orderEntries.reduce((sum, item) => sum + normalizeCostNumber(item.quantity), 0);
  const displayUnitCost = productionQuantity > 0 ? Math.round(displayTotalCost / productionQuantity) : unitCost;

  return (
    <DesktopCostSummaryLayout
      left={<SummaryCard title={copy.summaryTitle || undefined}>
        <div className="space-y-2 text-sm">
          <div className="pbp-cost-grand-total rounded-2xl border px-4 py-3">
            <div className="text-[11px] font-medium opacity-75">{copy.grandTotal}</div>
            <div className="mt-1 text-xl font-semibold leading-6 tabular-nums">{formatCurrency(displayTotalCost, common.currencySuffix)}</div>
            <div className="mt-1 text-[11px] opacity-75">{copy.unitCost} {formatCurrency(displayUnitCost, common.currencySuffix)}</div>
          </div>
          <div className={COST_ROW_CLASS}><span className={COST_LABEL_CLASS}>{copy.fabricTotal}</span><span className={getCostValueClassName(fabricTotal)}>{formatCurrency(fabricTotal, common.currencySuffix)}</span></div>
          <div className={COST_ROW_CLASS}><span className={COST_LABEL_CLASS}>{copy.subsidiaryTotal}</span><span className={getCostValueClassName(subsidiaryTotal)}>{formatCurrency(subsidiaryTotal, common.currencySuffix)}</span></div>
          <div className={COST_ROW_CLASS}><span className={COST_LABEL_CLASS}>{copy.laborCost}</span><span className={COST_VALUE_CLASS}>{formatCurrency(processLaborCost, common.currencySuffix)}</span></div>
          <div className={COST_ROW_CLASS}><span className={COST_LABEL_CLASS}>{copy.lossCost}</span><span className={COST_VALUE_CLASS}>{formatCurrency(processLossCost, common.currencySuffix)}</span></div>
        </div>
      </SummaryCard>}
      right={<SummaryCard title={copy.processTitle}>
        <div className="space-y-2 text-sm">
          {processCostLines.length > 0 ? processCostLines.map((item) => (
            <div key={item.id} className="pbp-cost-row rounded-xl px-3 py-2">
              <div className="min-w-0 truncate text-[12px] font-semibold text-[var(--pbp-text-primary)]">{item.label}</div>
              <div className="mt-1 text-[11px] leading-4 text-[var(--pbp-text-muted)]">
                {copy.unitPriceLabel} {formatCurrency(item.unitAmount, common.currencySuffix)} · {copy.lossPriceLabel} {formatCurrency(item.lossAmount, common.currencySuffix)} · {copy.lineTotalLabel} {formatCurrency(item.totalAmount, common.currencySuffix)}
              </div>
            </div>
          )) : <div className="pbp-empty-state rounded-2xl border border-dashed px-4 py-6 text-center text-sm">{copy.empty}</div>}
        </div>
      </SummaryCard>}
    />
  );
}
