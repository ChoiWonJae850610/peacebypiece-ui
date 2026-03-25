import type { WorkOrderListItem } from "@/types/workorder";

export function getCategoryPath(workOrder: WorkOrderListItem) {
  if (typeof workOrder.category === "string" && workOrder.category.trim()) return workOrder.category;
  return [workOrder.category1, workOrder.category2, workOrder.category3].filter(Boolean).join(" > ");
}

export function getInventoryLabel(status?: string) {
  return `재고: ${status ?? "확인전"}`;
}

export function getWorkOrderStateLabel(workflowStateById: Record<string, string>, workOrderId: string) {
  return workflowStateById[workOrderId] ?? "작성중";
}

export function getWorkOrderCardTone(state: string) {
  switch (state) {
    case "진행중":
      return "bg-blue-100 text-blue-700";
    case "발주요청":
      return "bg-violet-100 text-violet-700";
    case "발주완료":
      return "bg-cyan-100 text-cyan-700";
    case "생산중":
      return "bg-amber-100 text-amber-700";
    case "입고완료":
      return "bg-emerald-100 text-emerald-700";
    case "완료":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-stone-200 text-stone-700";
  }
}
