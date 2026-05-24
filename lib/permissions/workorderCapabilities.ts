import { isAdminRole, normalizeRoles } from "@/lib/constants/roles";
import { hasMemberPermission } from "@/lib/permissions/permissionAccess";
import type { UserProfile } from "@/types/user";

export type WorkOrderCapabilityState = {
  hasSessionUser: boolean;
  isAdmin: boolean;
  canReadWorkOrder: boolean;
  canCreateWorkOrder: boolean;
  canReorderWorkOrder: boolean;
  canUpdateWorkOrder: boolean;
  canDeleteWorkOrder: boolean;
  canRestoreWorkOrder: boolean;
  canRequestReview: boolean;
  canRequestOrder: boolean;
  canInspectWorkOrder: boolean;
  canCompleteWorkOrder: boolean;
};

export function buildWorkOrderCapabilityState(
  currentUser: UserProfile | null | undefined,
  currentUserId?: string | null,
): WorkOrderCapabilityState {
  const hasSessionUser = Boolean(currentUser?.id || currentUserId);
  const currentRoles = hasSessionUser ? normalizeRoles(currentUser?.roles, currentUser?.role) : [];
  const isAdmin = isAdminRole(currentRoles);

  const canReadWorkOrder = hasSessionUser && (isAdmin || hasMemberPermission(currentUser ?? {}, "workorder.read"));
  const canCreateWorkOrder = hasSessionUser && (isAdmin || hasMemberPermission(currentUser ?? {}, "workorder.create"));
  const canUpdateWorkOrder = hasSessionUser && (isAdmin || hasMemberPermission(currentUser ?? {}, "workorder.update"));
  const canDeleteWorkOrder = hasSessionUser && (isAdmin || hasMemberPermission(currentUser ?? {}, "workorder.delete"));
  const canRestoreWorkOrder = hasSessionUser && (isAdmin || hasMemberPermission(currentUser ?? {}, "workorder.restore"));
  const canRequestReview = hasSessionUser && (isAdmin || hasMemberPermission(currentUser ?? {}, "workorder.status.review"));
  const canRequestOrder = hasSessionUser && (isAdmin || hasMemberPermission(currentUser ?? {}, "workorder.status.order"));
  const canInspectWorkOrder = hasSessionUser && (isAdmin || hasMemberPermission(currentUser ?? {}, "workorder.status.inspect"));
  const canCompleteWorkOrder = hasSessionUser && (isAdmin || hasMemberPermission(currentUser ?? {}, "workorder.status.complete"));

  return {
    hasSessionUser,
    isAdmin,
    canReadWorkOrder,
    canCreateWorkOrder,
    canReorderWorkOrder: canCreateWorkOrder,
    canUpdateWorkOrder,
    canDeleteWorkOrder,
    canRestoreWorkOrder,
    canRequestReview,
    canRequestOrder,
    canInspectWorkOrder,
    canCompleteWorkOrder,
  };
}
