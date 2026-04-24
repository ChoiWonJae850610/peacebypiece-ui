import { ROLE, isAdminRole, isDesignerRole, normalizeRoles } from "@/lib/constants/roles";
import { WORKFLOW_ACTION_LABELS } from "@/lib/constants/workflow";
import { canReinspectInWorkflow, isWorkflowStateAtLeast } from "@/lib/constants/workorderStates";
import type { RoleType } from "@/types/permission";
import type { UserProfile } from "@/types/user";
import type { WorkOrder, WorkflowAction, WorkflowState } from "@/types/workorder";

export type WorkflowPolicyContext = {
  currentWorkflowState: WorkflowState;
  currentRoles: RoleType[];
  currentUserId: string;
  workOrder: WorkOrder;
  users?: UserProfile[];
};

type WorkflowPolicyActionMap = Partial<Record<WorkflowState, WorkflowAction[]>>;

function isWorkOrderManagedByCurrentUser(workOrder: WorkOrder, currentUserId: string) {
  return workOrder.createdById === currentUserId || (workOrder.managerId ?? null) === currentUserId;
}

export function canRequestReviewByPolicy(payload: Pick<WorkflowPolicyContext, "currentRoles" | "currentUserId" | "workOrder">) {
  const roles = normalizeRoles(payload.currentRoles);
  return isDesignerRole(roles) && isWorkOrderManagedByCurrentUser(payload.workOrder, payload.currentUserId);
}

export function canRequestFactoryOrderByPolicy(payload: Pick<WorkflowPolicyContext, "currentRoles" | "currentWorkflowState">) {
  return isAdminRole(payload.currentRoles) && isWorkflowStateAtLeast(payload.currentWorkflowState, "review_completed");
}

export function getAssignedManagerRoleByPolicy(workOrder: WorkOrder, users: UserProfile[] = []): RoleType {
  const assignedUser = users.find((user) => user.id === workOrder.managerId);
  return assignedUser?.role ?? workOrder.createdByRole;
}

export function getReviewApprovalCancelNextStateByPolicy(workOrder: WorkOrder, users: UserProfile[] = []): WorkflowState {
  const assignedRole = getAssignedManagerRoleByPolicy(workOrder, users);
  return assignedRole === ROLE.designer ? "review_requested" : "draft";
}

export function getWorkflowStateAfterManagerChangeByPolicy(payload: {
  currentWorkflowState: WorkflowState;
  nextManagerRole: RoleType;
}): WorkflowState {
  const managerWillBeAdmin = isAdminRole([payload.nextManagerRole]);
  if (managerWillBeAdmin && (payload.currentWorkflowState === "review_requested" || payload.currentWorkflowState === "rejected")) {
    return "draft";
  }
  return payload.currentWorkflowState;
}

function buildAdminWorkflowActions(context: WorkflowPolicyContext): WorkflowPolicyActionMap {
  return {
    draft: [
      { label: WORKFLOW_ACTION_LABELS.approveReview, nextState: "review_completed", actionType: "approve_review" },
    ],
    review_requested: [
      { label: WORKFLOW_ACTION_LABELS.rejectReview, nextState: "rejected", actionType: "reject_review" },
      { label: WORKFLOW_ACTION_LABELS.approveReview, nextState: "review_completed", actionType: "approve_review" },
    ],
    rejected: [
      { label: WORKFLOW_ACTION_LABELS.approveReview, nextState: "review_completed", actionType: "approve_review" },
    ],
    review_completed: [
      { label: WORKFLOW_ACTION_LABELS.cancelReviewApproval, nextState: getReviewApprovalCancelNextStateByPolicy(context.workOrder, context.users), actionType: "cancel_review_approval" },
      ...(canRequestFactoryOrderByPolicy(context)
        ? [{ label: WORKFLOW_ACTION_LABELS.requestOrder, nextState: "inspection", actionType: "request_order" } satisfies WorkflowAction]
        : []),
    ],
    completed: canReinspectInWorkflow(context.currentWorkflowState)
      ? [{ label: WORKFLOW_ACTION_LABELS.requestReinspection, nextState: "inspection", actionType: "request_reinspection" }]
      : [],
  };
}

function buildDesignerWorkflowActions(context: WorkflowPolicyContext): WorkflowPolicyActionMap {
  if (!canRequestReviewByPolicy(context)) return {};
  return {
    draft: [
      { label: WORKFLOW_ACTION_LABELS.requestReview, nextState: "review_requested", actionType: "request_review" },
    ],
    review_requested: [
      { label: WORKFLOW_ACTION_LABELS.cancelReviewRequest, nextState: "draft", actionType: "cancel_review_request" },
    ],
    rejected: [
      { label: WORKFLOW_ACTION_LABELS.requestReview, nextState: "review_requested", actionType: "request_review" },
    ],
  };
}

export function getAvailableWorkflowActionsByPolicy(context: WorkflowPolicyContext): WorkflowAction[] {
  if (isAdminRole(context.currentRoles)) {
    return buildAdminWorkflowActions(context)[context.currentWorkflowState] ?? [];
  }

  return buildDesignerWorkflowActions(context)[context.currentWorkflowState] ?? [];
}
