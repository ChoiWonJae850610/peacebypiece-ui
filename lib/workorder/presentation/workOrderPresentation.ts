import { EMPTY_DISPLAY, INVENTORY_STATUS_LABEL_PREFIX } from "@/lib/constants/display";
import { getInventoryStatusLabel } from "@/lib/constants/workorderDomain";
import { hasDisplayText, joinDisplayParts } from "@/lib/utils/display";
import { getI18n } from "@/lib/i18n";
import type { WorkOrderListItem } from "@/types/workorder";
import { buildWorkOrderTitle } from "@/lib/workorder/reorder/helpers";
import { WORKFLOW_STATE_BADGE_TONE } from "@/lib/constants/workorderStates";
import type { WorkflowState } from "@/types/workflow";

const i18n = getI18n();

export function getCategoryPath(workOrder: Pick<WorkOrderListItem, "category1" | "category2" | "category3">) {
  return joinDisplayParts([workOrder.category1, workOrder.category2, workOrder.category3]);
}

export function getInventoryLabel(status: string | null | undefined) {
  return `${INVENTORY_STATUS_LABEL_PREFIX}${hasDisplayText(status) ? getInventoryStatusLabel(status) : EMPTY_DISPLAY}`;
}

export function getWorkOrderState(workflowStateById: Record<string, string>, workOrderId: string): WorkflowState {
  return (workflowStateById[workOrderId] as WorkflowState | undefined) ?? "draft";
}

export function getWorkOrderCardTone(state: WorkflowState) {
  return WORKFLOW_STATE_BADGE_TONE[state];
}

export function getWorkOrderDisplayTitle(workOrder: { title?: string | null; baseTitle?: string | null; reorderRound?: number | null; revision?: number | null }) {
  return buildWorkOrderTitle({
    title: workOrder.title ?? undefined,
    baseTitle: workOrder.baseTitle ?? undefined,
    reorderRound: workOrder.reorderRound ?? undefined,
    revision: workOrder.revision ?? undefined,
  });
}
