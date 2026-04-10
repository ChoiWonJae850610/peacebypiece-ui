"use client";

import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import { DEFAULT_SELECTED_WORK_ORDER_ID } from "@/lib/data/mock/workorders";
import { WORKFLOW_ACTION_LABELS } from "@/lib/constants/workflow";
import { buildUserRoleState } from "@/lib/constants/roles";
import {
  createCreationHistoryLog,
  createInspectionCompleteHistoryLog,
  createInventoryHistoryLog,
  createManagerChangeHistoryLog,
  createReorderHistoryLog,
  createStatusHistoryLog,
  createTitleRenameHistoryLog,
  createUpdateHistoryLog,
  nowLabel,
} from "@/lib/workorder/history/builders";
import {
  applyInventoryAdjustment,
  cloneWorkOrderForReorder,
  createNewWorkOrder,
  renameWorkOrderGroupBaseTitle,
  updateWorkOrderManager,
  updateWorkflowState,
} from "@/lib/workorder/actions";
import { pruneDraftRows } from "@/lib/workorder/draftRows";
import { getWorkOrderDisplayTitle } from "@/lib/workorder/presentation/workOrderPresentation";
import { deriveWorkflowStateFromOrderEntries } from "@/lib/workorder/workflow";
import type { RoleType } from "@/types/permission";
import type { HistoryLog, UserProfile, WorkOrder, WorkflowAction } from "@/types/workorder";

export function useWorkOrderActions({
  workOrders,
  selectedId,
  selectedWorkOrder,
  currentUser,
  canCreateWorkOrder,
  canReorderWorkOrder,
  canChangeManager,
  isReviewRequestLocked,
  pendingWorkflowAction,
  setUsers,
  setWorkOrders,
  setHistoryLogs,
  setSelectedId,
  setLastSavedAt,
  setSaveStatus,
  setToastMessage,
  setCreateWorkOrderModalOpen,
  setInventoryEditorOpen,
  setManagerAssignModalOpen,
  setPendingWorkflowAction,
  setOrderRequestConfirmOpen,
}: {
  workOrders: WorkOrder[];
  selectedId: string;
  selectedWorkOrder: WorkOrder;
  currentUser: UserProfile;
  canCreateWorkOrder: boolean;
  canReorderWorkOrder: boolean;
  canChangeManager: boolean;
  isReviewRequestLocked: boolean;
  pendingWorkflowAction: WorkflowAction | null;
  setUsers: Dispatch<SetStateAction<UserProfile[]>>;
  setWorkOrders: Dispatch<SetStateAction<WorkOrder[]>>;
  setHistoryLogs: Dispatch<SetStateAction<HistoryLog[]>>;
  setSelectedId: Dispatch<SetStateAction<string>>;
  setLastSavedAt: Dispatch<SetStateAction<string | null>>;
  setSaveStatus: Dispatch<SetStateAction<"saved" | "dirty" | "saving">>;
  setToastMessage: Dispatch<SetStateAction<string | null>>;
  setCreateWorkOrderModalOpen: Dispatch<SetStateAction<boolean>>;
  setInventoryEditorOpen: Dispatch<SetStateAction<boolean>>;
  setManagerAssignModalOpen: Dispatch<SetStateAction<boolean>>;
  setPendingWorkflowAction: Dispatch<SetStateAction<WorkflowAction | null>>;
  setOrderRequestConfirmOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const handleSave = () => {
    setSaveStatus("saving");
    const label = nowLabel();
    setLastSavedAt(label);
    setWorkOrders((prev) => prev.map((item) => (item.id === selectedWorkOrder.id ? { ...item, lastSavedAt: label } : item)));
    setHistoryLogs((prev) => [
      createUpdateHistoryLog(currentUser.name, selectedWorkOrder.id, [
        { label: "저장", value: `저장 시각 ${label}` },
        { label: "작업지시서", value: selectedWorkOrder.title },
      ]),
      ...prev,
    ]);
    setSaveStatus("saved");
    setToastMessage("저장이 완료되었습니다.");
  };

  const handleSelectWorkOrder = (id: string) => {
    setSelectedId(id);
    const next = workOrders.find((item) => item.id === id);
    setLastSavedAt(next?.lastSavedAt ?? null);
    setSaveStatus("saved");
  };

  const canDeleteWorkOrder = (workflowState: WorkOrder["workflowState"]) =>
    workflowState === "draft" || workflowState === "review_requested";

  const handleCreateWorkOrder = (payload?: {
    title: string;
    category1: string;
    category2: string;
    category3: string;
    season: string;
  }) => {
    if (!canCreateWorkOrder) return;
    const newWorkOrder = createNewWorkOrder(workOrders.length + 1, {
      managerName: currentUser.name,
      managerId: currentUser.id,
      managerRole: currentUser.role,
      createdAt: nowLabel(),
      title: payload?.title,
      category1: payload?.category1,
      category2: payload?.category2,
      category3: payload?.category3,
      season: payload?.season,
    });
    setWorkOrders((prev) => [newWorkOrder, ...prev]);
    setSelectedId(newWorkOrder.id);
    setLastSavedAt(newWorkOrder.lastSavedAt);
    setSaveStatus("dirty");
    setHistoryLogs((prev) => [createCreationHistoryLog(currentUser.name, newWorkOrder.id), ...prev]);
    setCreateWorkOrderModalOpen(false);
  };

  const handleReorderWorkOrder = (workOrderId: string) => {
    if (!canReorderWorkOrder) return;
    const sourceWorkOrder = workOrders.find((item) => item.id === workOrderId);
    if (!sourceWorkOrder) return;

    const createdAt = nowLabel();
    const nextWorkOrder = cloneWorkOrderForReorder(workOrders, sourceWorkOrder, {
      createdAt,
      createdById: currentUser.id,
      createdByRole: currentUser.role,
      managerId: sourceWorkOrder.managerId ?? currentUser.id,
      managerName: sourceWorkOrder.manager || currentUser.name,
    });

    setWorkOrders((prev) => [nextWorkOrder, ...prev]);
    setSelectedId(nextWorkOrder.id);
    setLastSavedAt(nextWorkOrder.lastSavedAt);
    setSaveStatus("dirty");
    setHistoryLogs((prev) => [
      createReorderHistoryLog(currentUser.name, nextWorkOrder.id, {
        sourceTitle: getWorkOrderDisplayTitle(sourceWorkOrder),
        nextTitle: getWorkOrderDisplayTitle(nextWorkOrder),
      }),
      ...prev,
    ]);
    setToastMessage(`리오더 작업지시서 "${getWorkOrderDisplayTitle(nextWorkOrder)}"가 생성되었습니다.`);
  };

  const applyWorkflowAction = (action: WorkflowAction) => {
    const previousState = selectedWorkOrder.workflowState;
    const shouldPruneDraftRows =
      action.label === WORKFLOW_ACTION_LABELS.requestReview || action.label === WORKFLOW_ACTION_LABELS.requestOrder;
    const targetWorkOrder = shouldPruneDraftRows ? pruneDraftRows(selectedWorkOrder) : selectedWorkOrder;

    setWorkOrders((prev) =>
      prev.map((item) => {
        if (item.id !== selectedWorkOrder.id) return item;
        return updateWorkflowState([targetWorkOrder], selectedWorkOrder.id, action)[0] ?? item;
      }),
    );
    setHistoryLogs((prev) => [
      createStatusHistoryLog(currentUser.name, selectedWorkOrder.id, previousState, action.nextState, action.label),
      ...prev,
    ]);
    if (action.label === WORKFLOW_ACTION_LABELS.requestReview) {
      setSaveStatus("dirty");
    }
    if (action.nextState === "in_inspection") {
      setInventoryEditorOpen(true);
    }
  };

  const handleWorkflowAction = (action: WorkflowAction) => {
    if (action.label === WORKFLOW_ACTION_LABELS.requestOrder && action.nextState === "in_production") {
      setPendingWorkflowAction(action);
      setOrderRequestConfirmOpen(true);
      return;
    }

    applyWorkflowAction(action);
  };

  const handleConfirmOrderRequest = () => {
    if (!pendingWorkflowAction) return;
    applyWorkflowAction(pendingWorkflowAction);
    setPendingWorkflowAction(null);
    setOrderRequestConfirmOpen(false);
  };

  const handleCloseOrderRequestConfirm = () => {
    setPendingWorkflowAction(null);
    setOrderRequestConfirmOpen(false);
  };

  const handleInventoryApply = ({
    inboundQuantity,
    adjustmentQuantity,
    deductionQuantity,
    memo,
  }: {
    inboundQuantity: number;
    adjustmentQuantity: number;
    deductionQuantity: number;
    memo: string;
  }) => {
    const changes = [
      ...(inboundQuantity > 0 ? [{ type: "입고" as const, quantity: inboundQuantity }] : []),
      ...(adjustmentQuantity > 0 ? [{ type: "보정" as const, quantity: adjustmentQuantity }] : []),
      ...(deductionQuantity > 0 ? [{ type: "차감" as const, quantity: deductionQuantity }] : []),
    ];

    if (changes.length === 0) return;

    setWorkOrders((prev) => applyInventoryAdjustment(prev, selectedWorkOrder.id, { changes }));
    setHistoryLogs((prev) => [
      createInventoryHistoryLog(currentUser.name, selectedWorkOrder.id, { changes, memo }),
      ...prev,
    ]);
  };

  const handleCompleteInspection = ({
    orderEntryId,
    inboundQuantity,
    nextInventoryQuantity,
    memo,
  }: {
    orderEntryId: string;
    inboundQuantity: number;
    nextInventoryQuantity: number;
    memo: string;
  }) => {
    const trimmedMemo = memo.trim();
    setWorkOrders((prev) =>
      prev.map((item) => {
        if (item.id !== selectedWorkOrder.id) return item;
        const nextOrderEntries = (item.orderEntries ?? []).map((entry) =>
          entry.id === orderEntryId ? { ...entry, inspectionStatus: "inspection_completed" as const } : entry,
        );
        return {
          ...item,
          orderEntries: nextOrderEntries,
          inventoryQuantity: nextInventoryQuantity,
          inventoryStatus: nextInventoryQuantity > 0 ? "정상" : "부족",
        };
      }),
    );
    setHistoryLogs((prev) => [
      createInspectionCompleteHistoryLog(currentUser.name, selectedWorkOrder.id, {
        inboundQuantity,
        nextInventoryQuantity,
        memo: trimmedMemo,
      }),
      ...prev,
    ]);
    setSaveStatus("dirty");
    setToastMessage("검수 완료가 반영되었습니다.");
  };

  const handleApplyRoles = (userId: string, roles: RoleType[]) => {
    const nextRoleState = buildUserRoleState(roles);
    setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, ...nextRoleState } : user)));
  };

  const handleOpenManagerAssignModal = () => {
    if (!canChangeManager || isReviewRequestLocked) return;
    setManagerAssignModalOpen(true);
  };

  const handleCloseManagerAssignModal = () => {
    setManagerAssignModalOpen(false);
  };

  const handleChangeManager = (managerId: string, users: UserProfile[]) => {
    if (!canChangeManager || isReviewRequestLocked) return;
    const nextManager = users.find((user) => user.id === managerId);
    if (!nextManager) return;

    const previousManagerName = selectedWorkOrder.manager || "-";
    const previousManagerId = selectedWorkOrder.managerId ?? null;
    if (previousManagerId === nextManager.id || previousManagerName === nextManager.name) {
      setManagerAssignModalOpen(false);
      return;
    }

    setWorkOrders((prev) =>
      updateWorkOrderManager(prev, selectedWorkOrder.id, {
        managerId: nextManager.id,
        managerName: nextManager.name,
      }),
    );
    setHistoryLogs((prev) => [
      createManagerChangeHistoryLog(currentUser.name, selectedWorkOrder.id, previousManagerName, nextManager.name),
      ...prev,
    ]);
    setSaveStatus("dirty");
    setToastMessage("담당자가 변경되었습니다.");
    setManagerAssignModalOpen(false);
  };

  const handleDeleteWorkOrder = (workOrderId: string) => {
    const target = workOrders.find((item) => item.id === workOrderId);
    if (!target || !canDeleteWorkOrder(target.workflowState) || workOrders.length <= 1) return;
    if (typeof window !== "undefined") {
      const ok = window.confirm(`작업지시서 "${target.title}"를 삭제할까요?`);
      if (!ok) return;
    }

    const remaining = workOrders.filter((item) => item.id !== workOrderId);
    const fallbackSelectedId = remaining[0]?.id ?? DEFAULT_SELECTED_WORK_ORDER_ID;
    setWorkOrders(remaining);
    setHistoryLogs((prev) => prev.filter((item) => item.workOrderId !== workOrderId));
    if (selectedId === workOrderId) {
      setSelectedId(fallbackSelectedId);
      const fallbackWorkOrder = remaining.find((item) => item.id === fallbackSelectedId) ?? remaining[0];
      setLastSavedAt(fallbackWorkOrder?.lastSavedAt ?? null);
      setSaveStatus("saved");
    }
    setToastMessage("작업지시서가 삭제되었습니다.");
  };

  const handleRenameWorkOrderTitle = useCallback(
    (nextTitle: string) => {
      const trimmedTitle = String(nextTitle ?? "").trim();
      if (!trimmedTitle) return;

      const previousBaseTitle = String(selectedWorkOrder.baseTitle ?? selectedWorkOrder.title ?? "").trim() || "새 작업지시서";
      if (previousBaseTitle === trimmedTitle) return;

      const renameResult = renameWorkOrderGroupBaseTitle(workOrders, selectedWorkOrder.id, trimmedTitle);
      if (renameResult.affectedWorkOrderIds.length === 0 || renameResult.previousBaseTitle === trimmedTitle) return;

      setWorkOrders(renameResult.nextWorkOrders);
      setHistoryLogs((prev) => [
        ...renameResult.affectedWorkOrderIds.map((workOrderId) =>
          createTitleRenameHistoryLog(currentUser.name, workOrderId, {
            from: renameResult.previousBaseTitle ?? previousBaseTitle,
            to: trimmedTitle,
            appliedToGroup: renameResult.affectedWorkOrderIds.length > 1,
          }),
        ),
        ...prev,
      ]);
      setSaveStatus("dirty");
      setToastMessage(
        renameResult.affectedWorkOrderIds.length > 1
          ? "작업지시서명이 리오더 계열 전체에 반영되었습니다."
          : "작업지시서명이 변경되었습니다.",
      );
    },
    [currentUser.name, selectedWorkOrder.id, selectedWorkOrder.baseTitle, selectedWorkOrder.title, setHistoryLogs, setSaveStatus, setToastMessage, setWorkOrders, workOrders],
  );

  const handleUpdateSelectedWorkOrder = useCallback(
    (patch: Partial<WorkOrder>) => {
      const hasLockedChanges = Object.keys(patch).some((key) => key !== "memoThreads" && key !== "lastSavedAt");
      if (isReviewRequestLocked && hasLockedChanges) {
        return;
      }

      setWorkOrders((prev) =>
        prev.map((item) => {
          if (item.id !== selectedWorkOrder.id) return item;
          const nextItem = { ...item, ...patch };
          if (patch.orderEntries) {
            nextItem.workflowState = deriveWorkflowStateFromOrderEntries(item.workflowState, patch.orderEntries);
          }
          return nextItem;
        }),
      );
      setSaveStatus("dirty");
    },
    [isReviewRequestLocked, selectedWorkOrder.id, setSaveStatus, setWorkOrders],
  );

  return {
    handleSave,
    handleSelectWorkOrder,
    canDeleteWorkOrder,
    handleCreateWorkOrder,
    handleReorderWorkOrder,
    handleDeleteWorkOrder,
    handleWorkflowAction,
    handleUpdateSelectedWorkOrder,
    handleRenameWorkOrderTitle,
    handleConfirmOrderRequest,
    handleCloseOrderRequestConfirm,
    handleInventoryApply,
    handleCompleteInspection,
    handleApplyRoles,
    handleOpenManagerAssignModal,
    handleCloseManagerAssignModal,
    handleChangeManager,
  };
}
