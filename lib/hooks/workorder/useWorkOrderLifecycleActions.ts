"use client";

import { useCallback } from "react";
import { DEFAULT_SELECTED_WORK_ORDER_ID } from "@/lib/data/mock/workorders";
import {
  createCreationHistoryLog,
  createReorderHistoryLog,
  createTitleRenameHistoryLog,
  createUpdateHistoryLog,
  nowLabel,
} from "@/lib/workorder/history/builders";
import {
  cloneWorkOrderForReorder,
  createNewWorkOrder,
  renameWorkOrderGroupBaseTitle,
} from "@/lib/workorder/actions";
import { getWorkOrderDisplayTitle } from "@/lib/workorder/presentation/workOrderPresentation";
import type { WorkOrder } from "@/types/workorder";
import type {
  CreateWorkOrderInput,
  DeleteWorkOrderInput,
  RenameWorkOrderTitleInput,
  UseWorkOrderActionsParams,
} from "./useWorkOrderActionTypes";

export const canDeleteWorkOrder = (workflowState: WorkOrder["workflowState"]) =>
  workflowState === "draft" || workflowState === "review_requested";

type UseWorkOrderLifecycleActionsParams = Pick<
  UseWorkOrderActionsParams,
  | "currentUser"
  | "canCreateWorkOrder"
  | "canReorderWorkOrder"
  | "setWorkOrders"
  | "setHistoryLogs"
  | "setSelectedId"
  | "setLastSavedAt"
  | "setSaveStatus"
  | "setToastMessage"
  | "setCreateWorkOrderModalOpen"
>;

export function useWorkOrderLifecycleActions({
  currentUser,
  canCreateWorkOrder,
  canReorderWorkOrder,
  setWorkOrders,
  setHistoryLogs,
  setSelectedId,
  setLastSavedAt,
  setSaveStatus,
  setToastMessage,
  setCreateWorkOrderModalOpen,
}: UseWorkOrderLifecycleActionsParams) {
  const handleSave = useCallback(
    (workOrder: WorkOrder) => {
      setSaveStatus("saving");
      const label = nowLabel();
      setLastSavedAt(label);
      setWorkOrders((prev) => prev.map((item) => (item.id === workOrder.id ? { ...item, lastSavedAt: label } : item)));
      setHistoryLogs((prev) => [
        createUpdateHistoryLog(currentUser.name, workOrder.id, [
          { label: "저장", value: `저장 시각 ${label}` },
          { label: "작업지시서", value: workOrder.title },
        ]),
        ...prev,
      ]);
      setSaveStatus("saved");
      setToastMessage("저장이 완료되었습니다.");
    },
    [currentUser.name, setHistoryLogs, setLastSavedAt, setSaveStatus, setToastMessage, setWorkOrders],
  );

  const handleCreateWorkOrder = useCallback(
    (payload?: CreateWorkOrderInput) => {
      if (!canCreateWorkOrder) return;
      const nextIndex = payload?.nextIndex ?? 1;
      const newWorkOrder = createNewWorkOrder(nextIndex, {
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
      setHistoryLogs((historyPrev) => [createCreationHistoryLog(currentUser.name, newWorkOrder.id), ...historyPrev]);
      setSaveStatus("dirty");
      setCreateWorkOrderModalOpen(false);
    },
    [
      canCreateWorkOrder,
      currentUser.id,
      currentUser.name,
      currentUser.role,
      setCreateWorkOrderModalOpen,
      setHistoryLogs,
      setLastSavedAt,
      setSaveStatus,
      setSelectedId,
      setWorkOrders,
    ],
  );

  const handleReorderWorkOrder = useCallback(
    (workOrders: WorkOrder[], workOrderId: string) => {
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
    },
    [
      canReorderWorkOrder,
      currentUser.id,
      currentUser.name,
      currentUser.role,
      setHistoryLogs,
      setLastSavedAt,
      setSaveStatus,
      setSelectedId,
      setToastMessage,
      setWorkOrders,
    ],
  );

  const handleDeleteWorkOrder = useCallback(
    ({ workOrderId, workOrders, selectedId }: DeleteWorkOrderInput) => {
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
    },
    [setHistoryLogs, setLastSavedAt, setSaveStatus, setSelectedId, setToastMessage, setWorkOrders],
  );

  const handleRenameWorkOrderTitle = useCallback(
    ({ workOrders, workOrder, nextTitle }: RenameWorkOrderTitleInput) => {
      const trimmedTitle = String(nextTitle ?? "").trim();
      if (!trimmedTitle) return;

      const previousBaseTitle = String(workOrder.baseTitle ?? workOrder.title ?? "").trim() || "새 작업지시서";
      if (previousBaseTitle === trimmedTitle) return;

      const renameResult = renameWorkOrderGroupBaseTitle(workOrders, workOrder.id, trimmedTitle);
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
    [currentUser.name, setHistoryLogs, setSaveStatus, setToastMessage, setWorkOrders],
  );

  return {
    handleSave,
    handleCreateWorkOrder,
    handleReorderWorkOrder,
    handleDeleteWorkOrder,
    handleRenameWorkOrderTitle,
  };
}
