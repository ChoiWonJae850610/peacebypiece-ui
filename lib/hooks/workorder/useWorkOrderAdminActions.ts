"use client";

import { useCallback } from "react";
import { buildUserRoleState } from "@/lib/constants/roles";
import { createManagerChangeHistoryLog } from "@/lib/workorder/history/builders";
import { updateWorkOrderManager } from "@/lib/workorder/actions";
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

      const previousManagerName = workOrder.manager || "-";
      const previousManagerId = workOrder.managerId ?? null;
      if (previousManagerId === nextManager.id || previousManagerName === nextManager.name) {
        setManagerAssignModalOpen(false);
        return;
      }

      setWorkOrders((prev) =>
        updateWorkOrderManager(prev, workOrder.id, {
          managerId: nextManager.id,
          managerName: nextManager.name,
        }),
      );
      setHistoryLogs((prev) => [
        createManagerChangeHistoryLog(currentUser.name, workOrder.id, previousManagerName, nextManager.name),
        ...prev,
      ]);
      setSaveStatus("dirty");
      setToastMessage("담당자가 변경되었습니다.");
      setManagerAssignModalOpen(false);
    },
    [currentUser.name, setHistoryLogs, setManagerAssignModalOpen, setSaveStatus, setToastMessage, setWorkOrders],
  );

  return {
    handleApplyRoles,
    handleOpenManagerAssignModal,
    handleCloseManagerAssignModal,
    handleChangeManager,
  };
}
