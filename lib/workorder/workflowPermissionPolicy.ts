import { MEMBER_PERMISSION_CODE, type MemberPermissionCode } from "@/lib/permissions";
import { WORKFLOW_STATE } from "@/lib/constants/workorderStates";
import type { WorkOrder, WorkflowState } from "@/types/workorder";

export type WorkOrderWorkflowPermissionInput = {
  previousWorkflowState?: WorkflowState | null;
  nextWorkflowState: WorkflowState;
  previousFactoryOrderRequest?: WorkOrder["factoryOrderRequest"] | null;
  nextFactoryOrderRequest?: WorkOrder["factoryOrderRequest"] | null;
  factoryOrderRequestTouched?: boolean;
};

function normalizeFactoryOrderRequest(
  value: WorkOrder["factoryOrderRequest"] | null | undefined,
): WorkOrder["factoryOrderRequest"] | null {
  if (!value) return null;
  const factoryName = value.factoryName?.trim() ?? "";
  const factoryId = value.factoryId?.trim() ?? "";
  const requestedBy = value.requestedBy?.trim() ?? "";
  const requestedById = value.requestedById?.trim() || null;
  const requestedAt = value.requestedAt?.trim() ?? "";
  const quantity = Number.isFinite(value.quantity) ? Number(value.quantity) : 0;
  const requestNote = value.requestNote?.trim() || null;

  return {
    factoryId,
    factoryName,
    quantity,
    requestedAt,
    requestedBy,
    requestedById,
    requestNote,
  };
}

export function hasFactoryOrderRequestChanged(input: {
  previousFactoryOrderRequest?: WorkOrder["factoryOrderRequest"] | null;
  nextFactoryOrderRequest?: WorkOrder["factoryOrderRequest"] | null;
  factoryOrderRequestTouched?: boolean;
}): boolean {
  if (!input.factoryOrderRequestTouched) return false;

  return (
    JSON.stringify(normalizeFactoryOrderRequest(input.previousFactoryOrderRequest)) !==
    JSON.stringify(normalizeFactoryOrderRequest(input.nextFactoryOrderRequest))
  );
}

export function getWorkflowMutationPermissionCode(
  input: WorkOrderWorkflowPermissionInput,
): MemberPermissionCode | null {
  if (
    hasFactoryOrderRequestChanged({
      previousFactoryOrderRequest: input.previousFactoryOrderRequest,
      nextFactoryOrderRequest: input.nextFactoryOrderRequest,
      factoryOrderRequestTouched: input.factoryOrderRequestTouched,
    })
  ) {
    return MEMBER_PERMISSION_CODE.workorderStatusOrder;
  }

  const previousWorkflowState = input.previousWorkflowState ?? null;
  if (previousWorkflowState === input.nextWorkflowState) return null;

  if (
    input.nextWorkflowState === WORKFLOW_STATE.reviewRequested ||
    input.nextWorkflowState === WORKFLOW_STATE.draft
  ) {
    return MEMBER_PERMISSION_CODE.workorderStatusReview;
  }

  if (
    input.nextWorkflowState === WORKFLOW_STATE.reviewCompleted ||
    input.nextWorkflowState === WORKFLOW_STATE.rejected ||
    input.nextWorkflowState === WORKFLOW_STATE.inspection
  ) {
    return MEMBER_PERMISSION_CODE.workorderStatusOrder;
  }

  if (input.nextWorkflowState === WORKFLOW_STATE.completed) {
    return previousWorkflowState === WORKFLOW_STATE.inspection
      ? MEMBER_PERMISSION_CODE.workorderStatusInspect
      : MEMBER_PERMISSION_CODE.workorderStatusComplete;
  }

  return null;
}
