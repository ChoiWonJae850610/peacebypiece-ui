import type { WorkOrderListItem, WorkflowState } from "@/types/workorder";

export function getWorkOrderCardTone(state: string) {
  if (state === "완료" || state === "종결") return "bg-emerald-100 text-emerald-800";
  if (state === "반려") return "bg-rose-100 text-rose-800";
  if (state === "발주요청" || state === "검토대기" || state === "입고대기") {
    return "bg-amber-100 text-amber-800";
  }
  return "bg-cyan-100 text-cyan-800";
}

export function getInventoryLabel(status?: string) {
  if (!status) return "재고: 미확인";
  return `재고: ${status}`;
}

export function getCategoryPath(workOrder: WorkOrderListItem) {
  return [workOrder.category1, workOrder.category2, workOrder.category3]
    .filter(Boolean)
    .join(" > ");
}

export function getWorkOrderStateLabel(
  workflowStateById: Record<string, string>,
  id: string,
  fallback: WorkflowState = "작성중",
) {
  return workflowStateById[id] ?? fallback;
}
