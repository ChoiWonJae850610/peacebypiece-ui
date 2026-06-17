"use client";

import { useCallback } from "react";
import { useI18n } from "@/lib/i18n";
import { buildUserRoleState } from "@/lib/constants/roles";
import { WORKORDER_SERVICE_CODE } from "@/lib/constants/workorderServiceCodes";
import { canEditManagerInWorkflow, DEFAULT_WORKFLOW_STATE, isWorkflowStateReviewLocked } from "@/lib/constants/workorderStates";
import { buildManagerChangeResult } from "@/lib/workorder/actionFlow";
import { useWorkorderRepository } from "@/lib/repositories/WorkorderRepositoryProvider";
import { persistImmediateWorkOrderPatchWithHistory, persistUsersWithPermissions, replaceWorkOrderById } from "./workorderRepositoryMutations";
import { mergeImmediateDbFields } from "@/lib/workorder/storagePolicy";
import type { RoleType } from "@/types/permission";
import type { ChangeManagerInput } from "./useWorkOrderActionTypes";
import type { AdminActionBaseParams } from "./useWorkOrderActionTypes";

export function useWorkOrderAdminActions({
  currentUser,
  setUsers,
  setWorkOrders,
  setPersistedWorkOrders,
  setHistoryLogs,
  setSaveStatus,
  setManagerAssignModalOpen,
}: AdminActionBaseParams) {
  const { i18n } = useI18n();
  const repository = useWorkorderRepository();
  const actionFlowText = i18n.workorder.actionFlow;
  const historyText = i18n.workorder.history;
  const workflowStateLabels = i18n.workorder.workflowStates as Record<string, string>;
  const handleApplyRoles = useCallback(
    (userId: string, roles: RoleType[]) => {
      const nextRoleState = buildUserRoleState(roles);
      setUsers((prev) => {
        const nextUsers = prev.map((user) => (user.id === userId ? { ...user, ...nextRoleState } : user));
        void persistUsersWithPermissions(repository, { users: nextUsers, savePermissions: true });
        return nextUsers;
      });
    },
    [repository, setUsers],
  );

  const handleOpenManagerAssignModal = useCallback(
    ({ canChangeManager, isReviewRequestLocked, currentWorkflowState }: Pick<ChangeManagerInput, "canChangeManager" | "isReviewRequestLocked" | "currentWorkflowState">) => {
      const reviewLocked = isReviewRequestLocked ?? isWorkflowStateReviewLocked(currentWorkflowState ?? DEFAULT_WORKFLOW_STATE, true);
      const canEditManager = canEditManagerInWorkflow(currentWorkflowState ?? DEFAULT_WORKFLOW_STATE, reviewLocked);
      if (!canChangeManager || !canEditManager) return;
      setManagerAssignModalOpen(true);
    },
    [setManagerAssignModalOpen],
  );

  const handleCloseManagerAssignModal = useCallback(() => {
    setManagerAssignModalOpen(false);
  }, [setManagerAssignModalOpen]);

  const handleChangeManager = useCallback(
    async ({ workOrder, managerId, users, canChangeManager, isReviewRequestLocked, currentWorkflowState }: ChangeManagerInput) => {
      const reviewLocked = isReviewRequestLocked ?? isWorkflowStateReviewLocked(currentWorkflowState ?? DEFAULT_WORKFLOW_STATE, true);
      const canEditManager = canEditManagerInWorkflow(currentWorkflowState ?? DEFAULT_WORKFLOW_STATE, reviewLocked);
      if (!canChangeManager || !canEditManager) return;
      const nextManager = users.find((user) => user.id === managerId);
      if (!nextManager) return;

      const result = buildManagerChangeResult({
        workOrder,
        actorName: currentUser.name,
        managerId: nextManager.id,
        managerName: nextManager.name,
        managerRole: nextManager.role,
        text: actionFlowText,
        workflowStateLabels,
        historyText,
      });
      if (!result) {
        setManagerAssignModalOpen(false);
        return;
      }

      const nextPersistableWorkOrder = mergeImmediateDbFields(workOrder, result.nextWorkOrder, [
        "managerId",
        "manager",
        "workflowState",
      ]);
      setSaveStatus("saving");

      try {
        const persistedWorkOrder = await persistImmediateWorkOrderPatchWithHistory(repository, {
          workOrder: nextPersistableWorkOrder,
          patch: {
            managerId: nextPersistableWorkOrder.managerId,
            manager: nextPersistableWorkOrder.manager,
            workflowState: nextPersistableWorkOrder.workflowState,
          },
          historyLogs: result.historyLogs,
          auditActor: currentUser,
          serviceCode: WORKORDER_SERVICE_CODE.assigneeImmediateSave,
        });

        setPersistedWorkOrders((prev) => replaceWorkOrderById(prev, workOrder.id, persistedWorkOrder));
        setWorkOrders((prev) => prev.map((item) => (
          item.id === workOrder.id
            ? {
                ...item,
                managerId: persistedWorkOrder.managerId,
                manager: persistedWorkOrder.manager,
                workflowState: persistedWorkOrder.workflowState,
                lastSavedAt: persistedWorkOrder.lastSavedAt,
              }
            : item
        )));
        if (result.historyLogs?.length) {
          setHistoryLogs((prev) => [...result.historyLogs!, ...prev]);
        }
        setSaveStatus("saved");
        setManagerAssignModalOpen(false);
        return persistedWorkOrder;
      } catch (error) {
        setSaveStatus("dirty");
        throw error;
      }
    },
    [actionFlowText, currentUser, currentUser.name, historyText, repository, setHistoryLogs, setManagerAssignModalOpen, setPersistedWorkOrders, setSaveStatus, setWorkOrders, workflowStateLabels],
  );

  return {
    handleApplyRoles,
    handleOpenManagerAssignModal,
    handleCloseManagerAssignModal,
    handleChangeManager,
  };
}
