import { EMPTY_DISPLAY, INVENTORY_STATUS_LABEL_PREFIX } from "@/lib/constants/display";
import { DEFAULT_WORKORDER_CATEGORY2, DEFAULT_WORKORDER_CATEGORY3 } from "@/lib/constants/workorderDefaults";
import { getInventoryStatusLabel } from "@/lib/constants/workorderDomain";
import { hasDisplayText, joinDisplayParts } from "@/lib/utils/display";
import { getI18n } from "@/lib/i18n";
import type { WorkOrderListItem } from "@/types/workorder";
import { buildWorkOrderTitle } from "@/lib/workorder/reorder/helpers";
import { WORKFLOW_STATE_BADGE_TONE } from "@/lib/constants/workorderStates";
import type { WorkflowState } from "@/types/workflow";

const i18n = getI18n();

export function getCategoryPath(workOrder: Pick<WorkOrderListItem, "category1" | "category2" | "category3">) {
  const categoryParts = [workOrder.category1, workOrder.category2, workOrder.category3].filter((value, index) => {
    if (index === 1 && value === DEFAULT_WORKORDER_CATEGORY2) return false;
    if (index === 2 && value === DEFAULT_WORKORDER_CATEGORY3) return false;
    return true;
  });
  return joinDisplayParts(categoryParts);
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

export function getWorkOrderDisplayTitle(workOrder: { title?: string | null; displayTitle?: string | null; baseTitle?: string | null; reorderRound?: number | null; revision?: number | null; workOrderKind?: "sample" | "main" | "rework" | null; isDefectOrder?: boolean | null }) {
  const displayTitle = String(workOrder.displayTitle ?? "").trim();
  if (displayTitle) return displayTitle;

  return buildWorkOrderTitle({
    title: workOrder.title ?? undefined,
    displayTitle: workOrder.displayTitle ?? undefined,
    baseTitle: workOrder.baseTitle ?? undefined,
    reorderRound: workOrder.reorderRound ?? undefined,
    revision: workOrder.revision ?? undefined,
    workOrderKind: workOrder.workOrderKind ?? undefined,
    isDefectOrder: workOrder.isDefectOrder ?? undefined,
  });
}

export function getDisplayValueOrFallback(value: string | null | undefined, fallback: string) {
  return hasDisplayText(value) ? value : fallback;
}
