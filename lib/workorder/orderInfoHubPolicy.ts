import type { RoleType } from '@/types/permission';
import { canEditBeforeOrder, getWorkflowLockedReasonKey, getWorkflowStateScope } from '@/lib/constants/workorderStates';
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
  const canEditBeforeOrderState = canEditBeforeOrder(currentWorkflowState, isAdmin);
  const canChangeKind = canEditBeforeOrderState;
  const stateScope: OrderInfoHubPolicy['stateScope'] = getWorkflowStateScope(currentWorkflowState, isAdmin);
  const lockedReasonKey = getWorkflowLockedReasonKey(currentWorkflowState, isAdmin);

  const allowedOrderTypes = (isInitialWorkOrder
    ? ['메인 생산', '샘플', '재작업']
    : ['메인 생산', '재작업']) as Array<'메인 생산' | '샘플' | '재작업'>;

  return {
    isInitialWorkOrder,
    canChangeKind,
    canEditOrderEntries: canEditBeforeOrderState,
    canEditBeforeOrder: canEditBeforeOrderState,
    allowedOrderTypes: canChangeKind ? allowedOrderTypes : [workOrder.workOrderKind === 'rework' ? '재작업' : workOrder.workOrderKind === 'main' ? '메인 생산' : '샘플'],
    stateScope,
    lockedReasonKey,
  };
}
