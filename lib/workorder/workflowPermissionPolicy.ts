import type { MemberPermissionCode } from "@/lib/permissions";
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
    return "workorder.status.order";
  }

  const previousWorkflowState = input.previousWorkflowState ?? null;
  if (previousWorkflowState === input.nextWorkflowState) return null;

  if (
    input.nextWorkflowState === "review_requested" ||
    input.nextWorkflowState === "draft"
  ) {
    return "workorder.status.review";
  }

  if (
    input.nextWorkflowState === "review_completed" ||
    input.nextWorkflowState === "rejected" ||
    input.nextWorkflowState === "inspection"
  ) {
    return "workorder.status.order";
  }

  if (input.nextWorkflowState === "completed") {
    return "workorder.status.complete";
  }

  return null;
}
