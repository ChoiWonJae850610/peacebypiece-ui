"use client";

import { useCallback } from "react";
import { useI18n } from "@/lib/i18n";
import { buildUserRoleState } from "@/lib/constants/roles";
import { canEditManagerInWorkflow, isWorkflowStateReviewLocked } from "@/lib/constants/workorderStates";
import { buildManagerChangeResult } from "@/lib/workorder/actionFlow";
import { useWorkorderRepository } from "@/lib/repositories/WorkorderRepositoryProvider";
import { persistUsersWithPermissions, persistWorkOrderWithHistory, replaceWorkOrderById } from "./workorderRepositoryMutations";
import type { RoleType } from "@/types/permission";
import type { ChangeManagerInput } from "./useWorkOrderActionTypes";
import type { AdminActionBaseParams } from "./useWorkOrderActionTypes";

export function useWorkOrderAdminActions({
  currentUser,
  setUsers,
  setWorkOrders,
  persistedWorkOrders,
  setPersistedWorkOrders,
  setHistoryLogs,
  setSaveStatus,
  setToastMessage,
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
      const reviewLocked = isReviewRequestLocked ?? isWorkflowStateReviewLocked(currentWorkflowState ?? "draft", true);
      const canEditManager = canEditManagerInWorkflow(currentWorkflowState ?? "draft", reviewLocked);
      if (!canChangeManager || !canEditManager) return;
      setManagerAssignModalOpen(true);
    },
    [setManagerAssignModalOpen],
  );

  const handleCloseManagerAssignModal = useCallback(() => {
    setManagerAssignModalOpen(false);
  }, [setManagerAssignModalOpen]);

  const handleChangeManager = useCallback(
    ({ workOrder, managerId, users, canChangeManager, isReviewRequestLocked, currentWorkflowState }: ChangeManagerInput) => {
      const reviewLocked = isReviewRequestLocked ?? isWorkflowStateReviewLocked(currentWorkflowState ?? "draft", true);
      const canEditManager = canEditManagerInWorkflow(currentWorkflowState ?? "draft", reviewLocked);
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

      const persistedBaseWorkOrder = persistedWorkOrders.find((item) => item.id === workOrder.id) ?? workOrder;
      setSaveStatus("saving");
      void persistWorkOrderWithHistory(repository, {
        workOrder: {
          ...persistedBaseWorkOrder,
          managerId: result.nextWorkOrder.managerId,
          manager: result.nextWorkOrder.manager,
          workflowState: result.nextWorkOrder.workflowState,
        },
        historyLogs: result.historyLogs,
      }).then((persistedWorkOrder) => {
        setPersistedWorkOrders((prev) => replaceWorkOrderById(prev, workOrder.id, persistedWorkOrder));
        setWorkOrders((prev) => prev.map((item) => (
          item.id === workOrder.id
            ? { ...item, managerId: persistedWorkOrder.managerId, manager: persistedWorkOrder.manager, workflowState: persistedWorkOrder.workflowState, lastSavedAt: persistedWorkOrder.lastSavedAt }
            : item
        )));
        setSaveStatus("saved");
      });
      if (result.historyLogs?.length) {
        setHistoryLogs((prev) => [...result.historyLogs!, ...prev]);
      }
      if (result.toastMessage) {
        setToastMessage(result.toastMessage);
      }
      setManagerAssignModalOpen(false);
    },
    [actionFlowText, currentUser.name, historyText, persistedWorkOrders, repository, setHistoryLogs, setManagerAssignModalOpen, setPersistedWorkOrders, setSaveStatus, setToastMessage, setWorkOrders, workflowStateLabels],
  );

  return {
    handleApplyRoles,
    handleOpenManagerAssignModal,
    handleCloseManagerAssignModal,
    handleChangeManager,
  };
}
