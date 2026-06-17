import { isOrderInspectionCompleted } from "@/lib/constants/workorderStates";
import { formatPbpKrw, formatPbpNumber, formatPbpNumberWithUnit } from "@/lib/utils/formatters";
import { getI18n } from "@/lib/i18n";
import { calculateOrderEntryTotals } from "@/lib/workorder/detail/detailCalculations";
import { isEditorNumericField } from "@/lib/workorder/detail/detailFields";
import type { Material, OrderEntry, Outsourcing } from "@/types/workorder";

type BasicInfoLike = {
  category1: string;
  category2: string;
  category3: string;
  season: string;
  year: string;
};


export function formatNumericDisplay(value: string) {
  const normalized = value.trim().replace(/,/g, "");
  if (!normalized) return "0";
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return value;
  return formatPbpNumber(parsed);
}

export function getEditingInitialValue(field: string, value: string) {
  return isEditorNumericField(field) ? value.replace(/,/g, "") : value;
}

export function getDisplayValue(field: string, value: string) {
  return isEditorNumericField(field) ? formatNumericDisplay(value) : value;
}

export function formatCurrencySummary(total: number, i18n: ReturnType<typeof getI18n> = getI18n()) {
  const copy = i18n.workorder.ui.formatting;
  return copy.orderSummaryTotalFormat.replace("{total}", formatPbpKrw(total));
}

export function formatCurrencySummaryParts(total: number, i18n: ReturnType<typeof getI18n> = getI18n()) {
  const value = formatPbpKrw(total);
  const summary = formatCurrencySummary(total, i18n);
  return {
    label: summary.replace(value, "").trim() || summary,
    value,
  };
}

export function formatProductionCompositionSummary(materials: readonly Material[], outsourcing: readonly Outsourcing[], i18n: ReturnType<typeof getI18n> = getI18n()) {
  void outsourcing;
  const copy = i18n.workorder.ui.sections.productionComposition;
  return copy.summaryMaterialCount.replace("{count}", String(materials.length));
}


export function formatBasicSummary(basicInfo: BasicInfoLike) {
  void basicInfo.season;
  void basicInfo.year;
  return [basicInfo.category1, basicInfo.category2, basicInfo.category3].filter(Boolean).join(" > ");
}

export function formatOrderSummary(orderEntries: OrderEntry[], i18n: ReturnType<typeof getI18n> = getI18n()) {
  const copy = i18n.workorder.ui.formatting;
  const common = i18n.workorder.ui.common;
  if (orderEntries.length === 0) return copy.orderSummaryEmpty;
  const totals = calculateOrderEntryTotals(orderEntries);
  const completedCount = orderEntries.filter((item) => isOrderInspectionCompleted(item.inspectionStatus)).length;
  return [
    `${orderEntries.length}${common.countSuffix}`,
    formatPbpNumberWithUnit(totals.quantity, common.quantitySuffix),
    copy.inspectionCompletedFormat.replace("{completed}", String(completedCount)).replace("{total}", String(orderEntries.length)),
    formatCurrencySummary(totals.totalCost, i18n),
  ]
    .filter(Boolean)
    .join(" · ");
}
