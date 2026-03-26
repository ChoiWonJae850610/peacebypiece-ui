import type { WorkOrderListItem } from "@/types/workorder";

export function getCategoryPath(workOrder: WorkOrderListItem) {
  return [workOrder.category1, workOrder.category2, workOrder.category3].filter(Boolean).join(" > ");
}

export function getInventoryLabel(inventoryStatus: string | null | undefined) {
  return `재고 상태: ${inventoryStatus ?? "확인전"}`;
}

export function getWorkOrderStateLabel(workflowStateById: Record<string, string>, workOrderId: string) {
  return workflowStateById[workOrderId] ?? "작성중";
}

export function getWorkOrderCardTone(state: string) {
  switch (state) {
    case "완료":
      return "bg-stone-900/90 text-white";
    case "생산중":
      return "bg-amber-100 text-amber-700";
    case "발주요청":
      return "bg-blue-100 text-blue-700";
    case "검토요청":
      return "bg-violet-100 text-violet-700";
    case "검수중":
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-stone-200 text-stone-700";
  }
}
