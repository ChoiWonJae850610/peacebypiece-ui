import type { HistoryTone } from "@/types/workflow";
import type { OrderInspectionStatusValue } from "@/lib/constants/workorderStates";

export const EMPTY_DISPLAY = "-";
export const INVENTORY_STATUS_LABEL_PREFIX = "재고 상태: ";
export const WORKFLOW_DESCRIPTION_FALLBACK = "현재 작업 상태 설명이 준비되지 않았습니다.";

export const HISTORY_TONE_CLASS: Record<HistoryTone, string> = {
  blue: "bg-blue-100 text-blue-700",
  violet: "bg-violet-100 text-violet-700",
  emerald: "bg-emerald-100 text-emerald-700",
  rose: "bg-rose-100 text-rose-700",
  amber: "bg-amber-100 text-amber-700",
  stone: "bg-stone-100 text-stone-700",
};

export const INSPECTION_STATUS_TONE_CLASS: Record<OrderInspectionStatusValue, string> = {
  order_pending: "bg-stone-100 text-stone-600",
  inspection_pending: "bg-amber-100 text-amber-700",
  inspection_in_progress: "bg-emerald-100 text-emerald-700",
  inspection_completed: "bg-stone-900 text-white",
};
