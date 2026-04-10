import { EMPTY_DISPLAY, INVENTORY_STATUS_LABEL_PREFIX } from "@/lib/constants/display";
import { getI18n } from "@/lib/i18n";
import type { WorkOrderListItem } from "@/types/workorder";
import { WORKFLOW_STATE_BADGE_TONE } from "@/lib/constants/workorderStates";
import type { WorkflowState } from "@/types/workflow";

const i18n = getI18n();

export function getCategoryPath(workOrder: Pick<WorkOrderListItem, "category1" | "category2" | "category3">) {
  return [workOrder.category1, workOrder.category2, workOrder.category3].filter(Boolean).join(" > ") || EMPTY_DISPLAY;
}

export function getInventoryLabel(status: string | null | undefined) {
  return `${INVENTORY_STATUS_LABEL_PREFIX}${status && status.trim() ? status : EMPTY_DISPLAY}`;
}

export function getWorkOrderState(workflowStateById: Record<string, string>, workOrderId: string): WorkflowState {
  return (workflowStateById[workOrderId] as WorkflowState | undefined) ?? "draft";
}

export function getWorkOrderCardTone(state: WorkflowState) {
  return WORKFLOW_STATE_BADGE_TONE[state];
}

export function getWorkOrderDisplayTitle(workOrder: { title?: string | null; baseTitle?: string | null; revision?: number | null }) {
  const baseTitle = String(workOrder.baseTitle ?? workOrder.title ?? "").trim() || i18n.workorder.workflowStates.draft;
  const revision = Number(workOrder.revision ?? 1);
  return revision > 1 ? `${baseTitle} ${revision}차` : baseTitle;
}
