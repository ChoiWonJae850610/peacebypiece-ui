import { EMPTY_DISPLAY } from "@/lib/constants/display";
import { getI18n } from "@/lib/i18n";
import type { WorkOrderListItem } from "@/types/workorder";

const i18n = getI18n();

export function getCategoryPath(workOrder: Pick<WorkOrderListItem, "category1" | "category2" | "category3">) {
  return [workOrder.category1, workOrder.category2, workOrder.category3].filter(Boolean).join(" > ") || EMPTY_DISPLAY;
}

export function getInventoryLabel(status: string | null | undefined) {
  return `재고 상태: ${status && status.trim() ? status : EMPTY_DISPLAY}`;
}

export function getWorkOrderStateLabel(workflowStateById: Record<string, string>, workOrderId: string) {
  return workflowStateById[workOrderId] ?? "draft";
}

export function getWorkOrderCardTone(state: string) {
  switch (state) {
    case "completed":
      return "bg-stone-200 text-stone-800";
    case "review_requested":
      return "bg-violet-100 text-violet-700";
    case "review_approved":
      return "bg-fuchsia-100 text-fuchsia-700";
    case "order_requested":
    case "in_production":
      return "bg-amber-100 text-amber-700";
    case "in_inspection":
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-stone-100 text-stone-700";
  }
}

export function getWorkOrderDisplayTitle(workOrder: { title?: string | null; baseTitle?: string | null; revision?: number | null }) {
  const baseTitle = String(workOrder.baseTitle ?? workOrder.title ?? "").trim() || i18n.workorder.workflowStates.draft;
  const revision = Number(workOrder.revision ?? 1);
  return revision > 1 ? `${baseTitle} ${revision}차` : baseTitle;
}
