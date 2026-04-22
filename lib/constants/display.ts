import type { HistoryTone } from "@/types/workflow";
import type { OrderInspectionStatus } from "@/types/workorder";
import { getI18n } from "@/lib/i18n";

const i18n = getI18n();

export const EMPTY_DISPLAY = i18n.workorder.presentation.emptyDisplay;
export const INVENTORY_STATUS_LABEL_PREFIX = i18n.workorder.presentation.inventoryStatusPrefix;
export const WORKFLOW_DESCRIPTION_FALLBACK = i18n.workorder.presentation.workflowDescriptionFallback;

export const HISTORY_TONE_CLASS: Record<HistoryTone, string> = {
  blue: "bg-blue-100 text-blue-700",
  violet: "bg-violet-100 text-violet-700",
  emerald: "bg-emerald-100 text-emerald-700",
  rose: "bg-rose-100 text-rose-700",
  amber: "bg-amber-100 text-amber-700",
  stone: "bg-stone-100 text-stone-700",
};

export const INSPECTION_STATUS_TONE_CLASS: Record<OrderInspectionStatus, string> = {
  order_pending: "bg-stone-100 text-stone-600",
  inspection_pending: "bg-amber-100 text-amber-700",
  inspection_in_progress: "bg-emerald-100 text-emerald-700",
  inspection_completed: "bg-stone-900 text-white",
};

export const SELECTABLE_CARD_CLASS = {
  active: "border-stone-900 bg-stone-900 text-white",
  inactive: "border-stone-200 bg-white text-stone-900 hover:border-stone-300 hover:bg-stone-50",
} as const;

export const SELECTABLE_CARD_SUBTEXT_CLASS = {
  active: "text-stone-300",
  inactive: "text-stone-500",
} as const;

export const BOOLEAN_BADGE_CLASS = {
  on: "bg-emerald-100 text-emerald-700",
  off: "bg-stone-200 text-stone-600",
} as const;

export const HISTORY_FILTER_BUTTON_CLASS = {
  active: "bg-stone-900 text-white hover:bg-stone-800 active:bg-black",
  inactive: "border border-stone-300 bg-white text-stone-700 hover:border-stone-400 hover:bg-stone-100 active:bg-stone-200",
} as const;

export const ORDER_REQUEST_PRINT_UNSUPPORTED = i18n.common.ui.modal.orderRequestConfirm;
