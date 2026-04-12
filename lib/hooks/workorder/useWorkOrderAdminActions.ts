"use client";

import { useCallback } from "react";
import { useI18n } from "@/lib/i18n";
import { buildUserRoleState } from "@/lib/constants/roles";
import { buildManagerChangeResult } from "@/lib/workorder/actionFlow";
import type { RoleType } from "@/types/permission";
import type { ChangeManagerInput } from "./useWorkOrderActionTypes";
import type { AdminActionBaseParams } from "./useWorkOrderActionTypes";

export function useWorkOrderAdminActions({
  currentUser,
  setUsers,
  setWorkOrders,
  setHistoryLogs,
  setSaveStatus,
  setToastMessage,
  setManagerAssignModalOpen,
}: AdminActionBaseParams) {
  const { i18n } = useI18n();
  const actionFlowText = i18n.workorder.actionFlow;
  const handleApplyRoles = useCallback(
    (userId: string, roles: RoleType[]) => {
      const nextRoleState = buildUserRoleState(roles);
      setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, ...nextRoleState } : user)));
    },
    [setUsers],
  );

  const handleOpenManagerAssignModal = useCallback(
    ({ canChangeManager, isReviewRequestLocked }: Pick<ChangeManagerInput, "canChangeManager" | "isReviewRequestLocked">) => {
      if (!canChangeManager || isReviewRequestLocked) return;
      setManagerAssignModalOpen(true);
    },
    [setManagerAssignModalOpen],
  );

  const handleCloseManagerAssignModal = useCallback(() => {
    setManagerAssignModalOpen(false);
  }, [setManagerAssignModalOpen]);

  const handleChangeManager = useCallback(
    ({ workOrder, managerId, users, canChangeManager, isReviewRequestLocked }: ChangeManagerInput) => {
      if (!canChangeManager || isReviewRequestLocked) return;
      const nextManager = users.find((user) => user.id === managerId);
      if (!nextManager) return;

      const result = buildManagerChangeResult({
        workOrder,
        actorName: currentUser.name,
        managerId: nextManager.id,
        managerName: nextManager.name,
        text: actionFlowText,
      });
      if (!result) {
        setManagerAssignModalOpen(false);
        return;
      }

      setWorkOrders((prev) => prev.map((item) => (item.id === workOrder.id ? result.nextWorkOrder : item)));
      if (result.historyLogs?.length) {
        setHistoryLogs((prev) => [...result.historyLogs!, ...prev]);
      }
      if (result.saveStatus) {
        setSaveStatus(result.saveStatus);
      }
      if (result.toastMessage) {
        setToastMessage(result.toastMessage);
      }
      setManagerAssignModalOpen(false);
    },
    [actionFlowText, currentUser.name, setHistoryLogs, setManagerAssignModalOpen, setSaveStatus, setToastMessage, setWorkOrders],
  );

  return {
    handleApplyRoles,
    handleOpenManagerAssignModal,
    handleCloseManagerAssignModal,
    handleChangeManager,
  };
}
