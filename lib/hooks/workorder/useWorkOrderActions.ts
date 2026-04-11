"use client";

import { useWorkOrderAdminActions } from "./useWorkOrderAdminActions";
import { useWorkOrderLifecycleActions, canDeleteWorkOrder } from "./useWorkOrderLifecycleActions";
import { useWorkOrderWorkflowActions } from "./useWorkOrderWorkflowActions";
import type { UseWorkOrderActionsParams } from "./useWorkOrderActionTypes";

export { canDeleteWorkOrder };

export function useWorkOrderActions(params: UseWorkOrderActionsParams) {
  const lifecycleActions = useWorkOrderLifecycleActions(params);
  const workflowActions = useWorkOrderWorkflowActions(params);
  const adminActions = useWorkOrderAdminActions(params);

  return {
    ...lifecycleActions,
    ...workflowActions,
    ...adminActions,
  };
}
