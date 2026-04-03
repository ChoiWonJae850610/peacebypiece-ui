import { EMPTY_DISPLAY } from "@/lib/constants/display";
import type { WorkOrderListItem } from "@/types/workorder";

export function getCategoryPath(workOrder: Pick<WorkOrderListItem, "category1" | "category2" | "category3">) {
  return [workOrder.category1, workOrder.category2, workOrder.category3].filter(Boolean).join(" > ") || EMPTY_DISPLAY;
}

export function getInventoryLabel(status: string | null | undefined) {
  return `재고 상태: ${status && status.trim() ? status : EMPTY_DISPLAY}`;
}

export function getWorkOrderStateLabel(workflowStateById: Record<string, string>, workOrderId: string) {
  return workflowStateById[workOrderId] ?? "작성중";
}

export function getWorkOrderCardTone(state: string) {
  switch (state) {
    case "완료":
      return "bg-stone-200 text-stone-800";
    case "검토요청":
      return "bg-violet-100 text-violet-700";
    case "검토완료":
      return "bg-fuchsia-100 text-fuchsia-700";
    case "발주요청":
      return "bg-amber-100 text-amber-700";
    case "생산중":
      return "bg-blue-100 text-blue-700";
    case "검수중":
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-stone-100 text-stone-700";
  }
}
