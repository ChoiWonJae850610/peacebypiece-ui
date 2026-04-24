import { isOrderInspectionCompleted } from "@/lib/constants/workorderStates";
import { getI18n } from "@/lib/i18n";
import { calculateOrderEntryTotals } from "@/lib/workorder/detail/detailCalculations";
import { isEditorNumericField } from "@/lib/workorder/detail/detailFields";
import type { OrderEntry } from "@/types/workorder";

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
  return parsed.toLocaleString();
}

export function getEditingInitialValue(field: string, value: string) {
  return isEditorNumericField(field) ? value.replace(/,/g, "") : value;
}

export function getDisplayValue(field: string, value: string) {
  return isEditorNumericField(field) ? formatNumericDisplay(value) : value;
}


export function formatBasicSummary(basicInfo: BasicInfoLike) {
  return [
    [basicInfo.category1, basicInfo.category2, basicInfo.category3].filter(Boolean).join(" > "),
    `${basicInfo.season} ${basicInfo.year}`.trim(),
  ]
    .filter(Boolean)
    .join(" · ");
}

export function formatOrderSummary(orderEntries: OrderEntry[]) {
  const i18n = getI18n();
  const copy = i18n.workorder.ui.formatting;
  const common = i18n.workorder.ui.common;
  if (orderEntries.length === 0) return copy.orderSummaryEmpty;
  const totals = calculateOrderEntryTotals(orderEntries);
  const completedCount = orderEntries.filter((item) => isOrderInspectionCompleted(item.inspectionStatus)).length;
  return [
    `${orderEntries.length}${common.countSuffix}`,
    `${totals.quantity.toLocaleString()}${common.quantitySuffix}`,
    copy.inspectionCompletedFormat.replace("{completed}", String(completedCount)).replace("{total}", String(orderEntries.length)),
  ]
    .filter(Boolean)
    .join(" · ");
}
