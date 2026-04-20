import type { RoleType } from '@/types/permission';
import type { WorkOrder, WorkflowState } from '@/types/workorder';

export type OrderInfoHubPolicy = {
  isInitialWorkOrder: boolean;
  canChangeKind: boolean;
  canEditOrderEntries: boolean;
  canEditBeforeOrder: boolean;
  allowedOrderTypes: Array<'메인 생산' | '샘플' | '재작업'>;
  stateScope: 'draft' | 'review_requested_admin' | 'locked';
  lockedReasonKey: 'reviewRequested' | 'orderedOrLater' | null;
};

function isAdminRole(role: RoleType | null | undefined) {
  return role === 'admin';
}

export function deriveOrderInfoHubPolicy(args: {
  workOrder: WorkOrder;
  currentWorkflowState: WorkflowState;
  currentUserRole: RoleType;
}): OrderInfoHubPolicy {
  const { workOrder, currentWorkflowState, currentUserRole } = args;
  const currentId = String(workOrder.id ?? '').trim();
  const reorderGroupId = String(workOrder.reorderGroupId ?? '').trim();
  const isInitialWorkOrder = Boolean(currentId) && (!reorderGroupId || currentId === reorderGroupId);
  const isAdmin = isAdminRole(currentUserRole);
  const canEditBeforeOrder = currentWorkflowState === 'draft' || (currentWorkflowState === 'review_requested' && isAdmin);
  const canChangeKind = canEditBeforeOrder;
  const stateScope: OrderInfoHubPolicy['stateScope'] = currentWorkflowState === 'draft'
    ? 'draft'
    : currentWorkflowState === 'review_requested' && isAdmin
      ? 'review_requested_admin'
      : 'locked';
  const lockedReasonKey = canEditBeforeOrder
    ? null
    : currentWorkflowState === 'review_requested'
      ? 'reviewRequested'
      : 'orderedOrLater';

  const allowedOrderTypes = (isInitialWorkOrder
    ? ['메인 생산', '샘플', '재작업']
    : ['메인 생산', '재작업']) as Array<'메인 생산' | '샘플' | '재작업'>;

  return {
    isInitialWorkOrder,
    canChangeKind,
    canEditOrderEntries: canEditBeforeOrder,
    canEditBeforeOrder,
    allowedOrderTypes: canChangeKind ? allowedOrderTypes : [workOrder.workOrderKind === 'rework' ? '재작업' : workOrder.workOrderKind === 'main' ? '메인 생산' : '샘플'],
    stateScope,
    lockedReasonKey,
  };
}
