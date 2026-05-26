import { ROLE, isAdminRole, normalizeRoles } from "@/lib/constants/roles";
import { WORKFLOW_ACTION_LABELS } from "@/lib/constants/workflow";
import { WORKFLOW_ACTION_TYPE } from "@/lib/constants/workflowActions";
import { WORKFLOW_STATE, canReinspectInWorkflow, isWorkflowStateAtLeast } from "@/lib/constants/workorderStates";
import type { RoleType } from "@/types/permission";
import { hasMemberPermission, type MemberPermissionCode } from "@/lib/permissions";
import type { UserProfile } from "@/types/user";
import type { WorkOrder, WorkflowAction, WorkflowState } from "@/types/workorder";

export type WorkflowPolicyContext = {
  currentWorkflowState: WorkflowState;
  currentRoles: RoleType[];
  currentUserId: string;
  currentUser?: UserProfile | null;
  workOrder: WorkOrder;
  users?: UserProfile[];
};

type WorkflowPolicyActionMap = Partial<Record<WorkflowState, WorkflowAction[]>>;

function getCurrentUserOwnerIds(context: Pick<WorkflowPolicyContext, "currentUser" | "currentUserId">): string[] {
  return Array.from(
    new Set(
      [context.currentUserId, context.currentUser?.id, context.currentUser?.companyMemberId]
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  );
}

function isWorkOrderManagedByCurrentUser(workOrder: WorkOrder, context: Pick<WorkflowPolicyContext, "currentUser" | "currentUserId">) {
  const managerId = workOrder.managerId?.trim() ?? "";
  if (!managerId) return false;
  return getCurrentUserOwnerIds(context).includes(managerId);
}

function hasWorkflowPermission(context: Pick<WorkflowPolicyContext, "currentRoles" | "currentUser" | "currentUserId" | "workOrder">, permissionCode: MemberPermissionCode) {
  if (isAdminRole(context.currentRoles)) return true;
  if (!context.currentUser || !isWorkOrderManagedByCurrentUser(context.workOrder, context)) return false;
  return hasMemberPermission(context.currentUser, permissionCode);
}

function hasEveryWorkflowPermission(
  context: Pick<WorkflowPolicyContext, "currentRoles" | "currentUser" | "currentUserId" | "workOrder">,
  permissionCodes: readonly MemberPermissionCode[],
) {
  if (isAdminRole(context.currentRoles)) return true;
  if (!context.currentUser || !isWorkOrderManagedByCurrentUser(context.workOrder, context)) return false;
  return permissionCodes.every((permissionCode) => hasMemberPermission(context.currentUser ?? {}, permissionCode));
}

export function canRequestReviewByPolicy(payload: Pick<WorkflowPolicyContext, "currentRoles" | "currentUser" | "currentUserId" | "workOrder">) {
  return hasEveryWorkflowPermission(payload, ["workorder.update", "workorder.status.review"]);
}

export function canRequestFactoryOrderByPolicy(payload: Pick<WorkflowPolicyContext, "currentRoles" | "currentUser" | "currentUserId" | "workOrder" | "currentWorkflowState">) {
  if (isAdminRole(payload.currentRoles)) {
    return isWorkflowStateAtLeast(payload.currentWorkflowState, WORKFLOW_STATE.reviewCompleted);
  }
  return hasWorkflowPermission(payload, "workorder.status.order");
}

export function canDirectRequestFactoryOrderByPolicy(payload: Pick<WorkflowPolicyContext, "currentRoles" | "currentUser" | "currentUserId" | "workOrder">) {
  return hasWorkflowPermission(payload, "workorder.status.order");
}

export function canCompleteInspectionByPolicy(payload: Pick<WorkflowPolicyContext, "currentRoles" | "currentUser" | "currentUserId" | "workOrder">) {
  return hasWorkflowPermission(payload, "workorder.status.inspect");
}

export function getAssignedManagerRoleByPolicy(workOrder: WorkOrder, users: UserProfile[] = []): RoleType {
  const assignedUser = users.find((user) => user.id === workOrder.managerId);
  return assignedUser?.role ?? workOrder.createdByRole;
}

export function getReviewApprovalCancelNextStateByPolicy(workOrder: WorkOrder, users: UserProfile[] = []): WorkflowState {
  const assignedRole = getAssignedManagerRoleByPolicy(workOrder, users);
  return assignedRole === ROLE.designer ? WORKFLOW_STATE.reviewRequested : WORKFLOW_STATE.draft;
}

export function getWorkflowStateAfterManagerChangeByPolicy(payload: {
  currentWorkflowState: WorkflowState;
  nextManagerRole: RoleType;
}): WorkflowState {
  const managerWillBeAdmin = isAdminRole([payload.nextManagerRole]);
  if (managerWillBeAdmin && (payload.currentWorkflowState === WORKFLOW_STATE.reviewRequested || payload.currentWorkflowState === WORKFLOW_STATE.rejected)) {
    return WORKFLOW_STATE.draft;
  }
  return payload.currentWorkflowState;
}

function buildAdminWorkflowActions(context: WorkflowPolicyContext): WorkflowPolicyActionMap {
  return {
    draft: [
      { label: WORKFLOW_ACTION_LABELS.approveReview, nextState: WORKFLOW_STATE.reviewCompleted, actionType: WORKFLOW_ACTION_TYPE.approveReview },
    ],
    review_requested: [
      { label: WORKFLOW_ACTION_LABELS.rejectReview, nextState: WORKFLOW_STATE.rejected, actionType: WORKFLOW_ACTION_TYPE.rejectReview },
      { label: WORKFLOW_ACTION_LABELS.approveReview, nextState: WORKFLOW_STATE.reviewCompleted, actionType: WORKFLOW_ACTION_TYPE.approveReview },
    ],
    rejected: [
      { label: WORKFLOW_ACTION_LABELS.approveReview, nextState: WORKFLOW_STATE.reviewCompleted, actionType: WORKFLOW_ACTION_TYPE.approveReview },
    ],
    review_completed: [
      { label: WORKFLOW_ACTION_LABELS.cancelReviewApproval, nextState: getReviewApprovalCancelNextStateByPolicy(context.workOrder, context.users), actionType: WORKFLOW_ACTION_TYPE.cancelReviewApproval },
      ...(canRequestFactoryOrderByPolicy(context)
        ? [{ label: WORKFLOW_ACTION_LABELS.requestOrder, nextState: WORKFLOW_STATE.materialOrderPending, actionType: WORKFLOW_ACTION_TYPE.requestOrder } satisfies WorkflowAction]
        : []),
    ],
    completed: canReinspectInWorkflow(context.currentWorkflowState)
      ? [{ label: WORKFLOW_ACTION_LABELS.requestReinspection, nextState: WORKFLOW_STATE.inspection, actionType: WORKFLOW_ACTION_TYPE.requestReinspection }]
      : [],
  };
}

function buildMemberWorkflowActions(context: WorkflowPolicyContext): WorkflowPolicyActionMap {
  const canRequestReview = canRequestReviewByPolicy(context);
  const canDirectOrder = canDirectRequestFactoryOrderByPolicy(context);
  const directOrderAction = { label: WORKFLOW_ACTION_LABELS.requestOrder, nextState: WORKFLOW_STATE.materialOrderPending, actionType: WORKFLOW_ACTION_TYPE.requestOrder } satisfies WorkflowAction;

  return {
    draft: [
      ...(canRequestReview ? [{ label: WORKFLOW_ACTION_LABELS.requestReview, nextState: WORKFLOW_STATE.reviewRequested, actionType: WORKFLOW_ACTION_TYPE.requestReview } satisfies WorkflowAction] : []),
      ...(canDirectOrder ? [directOrderAction] : []),
    ],
    review_requested: [
      ...(canRequestReview ? [{ label: WORKFLOW_ACTION_LABELS.cancelReviewRequest, nextState: WORKFLOW_STATE.draft, actionType: WORKFLOW_ACTION_TYPE.cancelReviewRequest } satisfies WorkflowAction] : []),
    ],
    rejected: [
      ...(canRequestReview ? [{ label: WORKFLOW_ACTION_LABELS.requestReview, nextState: WORKFLOW_STATE.reviewRequested, actionType: WORKFLOW_ACTION_TYPE.requestReview } satisfies WorkflowAction] : []),
      ...(canDirectOrder ? [directOrderAction] : []),
    ],
    review_completed: canDirectOrder ? [directOrderAction] : [],
  };
}

export function getAvailableWorkflowActionsByPolicy(context: WorkflowPolicyContext): WorkflowAction[] {
  if (isAdminRole(context.currentRoles)) {
    return buildAdminWorkflowActions(context)[context.currentWorkflowState] ?? [];
  }

  return buildMemberWorkflowActions(context)[context.currentWorkflowState] ?? [];
}
