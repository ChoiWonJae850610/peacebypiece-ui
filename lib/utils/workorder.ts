import type { WorkOrderListItem } from "@/types/workorder";

export function getCategoryPath(workOrder: WorkOrderListItem): string {
  if (workOrder.category) return workOrder.category;
  return [workOrder.category1, workOrder.category2, workOrder.category3].filter(Boolean).join(" > ");
}

export function getInventoryLabel(status?: string): string {
  if (!status) return "재고 상태 미확인";
  return `재고: ${status}`;
}

export function getWorkOrderStateLabel(workflowStateById: Record<string, string>, id: string): string {
  return workflowStateById[id] ?? "작성중";
}

export function getWorkOrderCardTone(state: string): string {
  switch (state) {
    case "완료": return "bg-emerald-100 text-emerald-700";
    case "검토요청":
    case "검토완료": return "bg-violet-100 text-violet-700";
    case "발주요청":
    case "발주완료": return "bg-blue-100 text-blue-700";
    case "생산중": return "bg-amber-100 text-amber-700";
    case "입고대기":
    case "검수중": return "bg-cyan-100 text-cyan-700";
    default: return "bg-stone-100 text-stone-700";
  }
}
