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
  if (orderEntries.length === 0) return "등록된 발주 정보가 없습니다.";
  const totals = calculateOrderEntryTotals(orderEntries);
  const completedCount = orderEntries.filter((item) => item.inspectionStatus === "inspection_completed").length;
  return [
    `${orderEntries.length}건`,
    `${totals.quantity.toLocaleString()}장`,
    `검수완료 ${completedCount}/${orderEntries.length}`,
  ]
    .filter(Boolean)
    .join(" · ");
}
