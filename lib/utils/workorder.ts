import { getStageTone } from "@/lib/constants/workflow";
import type { WorkOrderListItem } from "@/types/workorder";

export function getCategoryPath(workOrder: WorkOrderListItem): string {
  return [workOrder.category1, workOrder.category2, workOrder.category3].filter(Boolean).join(" > ");
}

export function getInventoryLabel(value?: string): string {
  return `재고: ${value ?? "미지정"}`;
}

export function getWorkOrderStateLabel(workflowStateById: Record<string, string>, workOrderId: string): string {
  return workflowStateById[workOrderId] ?? "작성중";
}

export function getWorkOrderCardTone(state: string): string {
  return getStageTone(state as never);
}
