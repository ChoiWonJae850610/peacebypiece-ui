import { getI18n } from "@/lib/i18n";
import { calculateOrderEntryTotals } from "@/lib/workorder/detailCalculations";
import type { OrderEntry, OrderInspectionStatus } from "@/types/workorder";

const i18n = getI18n();

type BasicInfoLike = {
  category1: string;
  category2: string;
  category3: string;
  season: string;
  year: string;
};

function isNumericField(field: string) {
  return field === "quantity" || field === "unitCost" || field === "laborCost" || field === "lossCost";
}

export function formatNumericDisplay(value: string) {
  const normalized = value.trim().replace(/,/g, "");
  if (!normalized) return "0";
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return value;
  return parsed.toLocaleString();
}

export function getEditingInitialValue(field: string, value: string) {
  return isNumericField(field) ? value.replace(/,/g, "") : value;
}

export function getDisplayValue(field: string, value: string) {
  return isNumericField(field) ? formatNumericDisplay(value) : value;
}

export function getInspectionStatusLabel(status: OrderInspectionStatus) {
  return i18n.workorder.inspectionStatuses[status];
}

export function getInspectionStatusTone(status: OrderInspectionStatus) {
  switch (status) {
    case "inspection_completed":
      return "bg-stone-900 text-white";
    case "inspection_in_progress":
      return "bg-emerald-100 text-emerald-700";
    case "inspection_pending":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-stone-100 text-stone-600";
  }
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
