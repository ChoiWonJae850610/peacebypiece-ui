import { WORKFLOW_STATE, isWorkflowStateOneOf } from "@/lib/constants/workorderStates";
import type { WorkOrderServiceCodeValue } from "@/lib/constants/workorderServiceCodes";
import { canServiceReplaceProductionComposition } from "@/lib/workorder/serviceCodeGuards";
import type { WorkflowState } from "@/types/workflow";
import type { WorkOrder } from "@/types/workorder";

export const PRODUCTION_COMPOSITION_COMMIT_WORKFLOW_STATES = [
  WORKFLOW_STATE.reviewRequested,
  WORKFLOW_STATE.reviewCompleted,
  WORKFLOW_STATE.inspection,
  WORKFLOW_STATE.completed,
] as const;

export function shouldCommitProductionCompositionForWorkflowState(
  workflowState: WorkflowState,
): boolean {
  return isWorkflowStateOneOf(workflowState, PRODUCTION_COMPOSITION_COMMIT_WORKFLOW_STATES);
}

export function hasProductionCompositionDraft(workOrder: WorkOrder): boolean {
  return Boolean(
    workOrder.hasDetailSnapshot ||
      (workOrder.orderEntries?.length ?? 0) > 0 ||
      (workOrder.materials?.length ?? 0) > 0 ||
      (workOrder.outsourcing?.length ?? 0) > 0,
  );
}

export function shouldCommitProductionCompositionForServiceCode(
  serviceCode: WorkOrderServiceCodeValue | null | undefined,
): boolean {
  return canServiceReplaceProductionComposition(serviceCode);
}

export function shouldCommitProductionComposition(
  workOrder: WorkOrder,
  serviceCode?: WorkOrderServiceCodeValue | null,
): boolean {
  if (!hasProductionCompositionDraft(workOrder)) return false;
  if (serviceCode !== undefined) {
    return shouldCommitProductionCompositionForServiceCode(serviceCode);
  }
  return false;
}
