"use client";

import { useCallback } from "react";
import { useI18n } from "@/lib/i18n";
import { useWorkorderRepository } from "@/lib/repositories/WorkorderRepositoryProvider";
import {
  createCreationHistoryLog,
  createDeletionHistoryLog,
  createReorderHistoryLog,
  createTitleRenameHistoryLog,
  createUpdateHistoryLog,
  nowLabel,
} from "@/lib/workorder/history/builders";
import {
  cloneWorkOrderForReorder,
  convertWorkOrderToRework,
  createNewWorkOrder,
  renameWorkOrderGroupBaseTitle,
} from "@/lib/workorder/actions";
import { getWorkOrderDisplayTitle } from "@/lib/workorder/presentation/workOrderPresentation";
import { getWorkOrderBaseTitle, reindexReorderGroupAfterDeletion } from "@/lib/workorder/reorder/helpers";
import { createWorkOrderActionFailure, executeWorkOrderAsyncAction } from "@/lib/workorder/actionFlow";
import { persistWorkOrderWithHistory, persistWorkOrdersWithHistory } from "./workorderRepositoryMutations";
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
  | "setActionStatus"
  | "setActionError"
  | "setActionFailure"
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
  setActionStatus,
  setActionError,
  setActionFailure,
}: UseWorkOrderLifecycleActionsParams) {
  const { i18n } = useI18n();
  const lifecycleText = i18n.workorder.lifecycle;
  const historyText = i18n.workorder.history;
  const repository = useWorkorderRepository();

  const handleSave = useCallback(
    async (workOrder: WorkOrder, workOrders: WorkOrder[]) => {
      setSaveStatus("saving");

      try {
        await executeWorkOrderAsyncAction({
          actionKey: "save",
          setActionStatus,
          setActionError,
          getFailure: (error) => createWorkOrderActionFailure({
            actionKey: "save",
            error,
            kind: "repository",
            retryable: true,
            message: lifecycleText.saveFailedToast ?? "Failed to save work order.",
          }),
          setActionFailure,
          task: async () => {
            const label = nowLabel();
            const nextHistoryLogs = [
              createUpdateHistoryLog(currentUser.name, workOrder.id, [
                { label: historyText.detailLabels.title, value: `[${getWorkOrderDisplayTitle(workOrder)}]` },
                { label: lifecycleText.saveHistoryLabel, value: historyText.detailLabels.savedAtFormat.replace("{time}", label) },
              ], historyText),
            ];
            const nextWorkOrder = await persistWorkOrderWithHistory(repository, {
              workOrder: { ...workOrder, lastSavedAt: label },
              historyLogs: nextHistoryLogs,
            });
            const nextWorkOrders = workOrders.map((item) => (item.id === workOrder.id ? nextWorkOrder : item));

            setLastSavedAt(label);
            setWorkOrders(nextWorkOrders);
            setHistoryLogs((prev) => [...nextHistoryLogs, ...prev]);
            setSaveStatus("saved");
            setToastMessage(lifecycleText.saveCompletedToast);
          },
        });
      } catch {
        setSaveStatus("dirty");
      }
    },
    [currentUser.name, historyText, lifecycleText, repository, setActionError, setActionFailure, setActionStatus, setHistoryLogs, setLastSavedAt, setSaveStatus, setToastMessage, setWorkOrders],
  );

  const handleCreateWorkOrder = useCallback(
    async (payload?: CreateWorkOrderInput) => {
      if (!canCreateWorkOrder) return;

      await executeWorkOrderAsyncAction({
        actionKey: "create",
        setActionStatus,
        setActionError,
        getFailure: (error) => createWorkOrderActionFailure({
          actionKey: "create",
          error,
          kind: "repository",
          retryable: true,
          message: lifecycleText.createFailedToast ?? "Failed to create work order.",
        }),
        setActionFailure,
        task: async () => {
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
          const nextHistoryLogs = [
            createCreationHistoryLog(currentUser.name, newWorkOrder.id, { title: getWorkOrderDisplayTitle(newWorkOrder) }, historyText),
          ];
          const createdWorkOrder = await repository.createWorkOrderAsync(newWorkOrder);
          await repository.appendHistoryLogsAsync(nextHistoryLogs);
          setWorkOrders((prev) => [createdWorkOrder, ...prev]);
          setSelectedId(createdWorkOrder.id);
          setLastSavedAt(createdWorkOrder.lastSavedAt);
          setHistoryLogs((historyPrev) => [...nextHistoryLogs, ...historyPrev]);
          setSaveStatus("dirty");
          setToastMessage(lifecycleText.createCompletedToastFormat.replace("{title}", getWorkOrderDisplayTitle(createdWorkOrder)));
          setCreateWorkOrderModalOpen(false);
        },
      });
    },
    [canCreateWorkOrder, currentUser.id, currentUser.name, currentUser.role, historyText, lifecycleText.createCompletedToastFormat, lifecycleText.createFailedToast, repository, setActionError, setActionFailure, setActionStatus, setCreateWorkOrderModalOpen, setHistoryLogs, setLastSavedAt, setSaveStatus, setSelectedId, setWorkOrders, setToastMessage],
  );

  const handleReorderWorkOrder = useCallback(
    async (workOrders: WorkOrder[], workOrderId: string) => {
      if (!canReorderWorkOrder) return;
      const sourceWorkOrder = workOrders.find((item) => item.id === workOrderId);
      if (!sourceWorkOrder || sourceWorkOrder.workOrderKind === "rework") return;

      await executeWorkOrderAsyncAction({
        actionKey: "reorder",
        setActionStatus,
        setActionError,
        getFailure: (error) => createWorkOrderActionFailure({
          actionKey: "reorder",
          error,
          kind: "repository",
          retryable: true,
          message: lifecycleText.reorderFailedToast ?? "Failed to create reordered work order.",
        }),
        setActionFailure,
        task: async () => {
          const createdAt = nowLabel();
          const nextWorkOrder = cloneWorkOrderForReorder(workOrders, sourceWorkOrder, {
            createdAt,
            createdById: currentUser.id,
            createdByRole: currentUser.role,
            managerId: sourceWorkOrder.managerId ?? currentUser.id,
            managerName: sourceWorkOrder.manager || currentUser.name,
          });

          const nextHistoryLogs = [
            createReorderHistoryLog(currentUser.name, nextWorkOrder.id, {
              sourceTitle: getWorkOrderDisplayTitle(sourceWorkOrder),
              nextTitle: getWorkOrderDisplayTitle(nextWorkOrder),
            }, historyText),
          ];
          const createdWorkOrder = await repository.createWorkOrderAsync(nextWorkOrder);
          await repository.appendHistoryLogsAsync(nextHistoryLogs);
          setWorkOrders((prev) => [createdWorkOrder, ...prev]);
          setSelectedId(createdWorkOrder.id);
          setLastSavedAt(createdWorkOrder.lastSavedAt);
          setSaveStatus("dirty");
          setHistoryLogs((prev) => [...nextHistoryLogs, ...prev]);
          setToastMessage(lifecycleText.reorderCreatedToastFormat.replace("{title}", getWorkOrderDisplayTitle(createdWorkOrder)));
        },
      });
    },
    [canReorderWorkOrder, currentUser.id, currentUser.name, currentUser.role, historyText, lifecycleText, repository, setActionError, setActionFailure, setActionStatus, setHistoryLogs, setLastSavedAt, setSaveStatus, setSelectedId, setToastMessage, setWorkOrders],
  );

  const handleReworkWorkOrder = useCallback(
    async (workOrders: WorkOrder[], workOrderId: string) => {
      const sourceWorkOrder = workOrders.find((item) => item.id === workOrderId);
      if (!sourceWorkOrder || sourceWorkOrder.workOrderKind === "rework") return;

      if (typeof window !== "undefined") {
        const ok = window.confirm(lifecycleText.reworkConfirmFormat.replace("{title}", getWorkOrderDisplayTitle(sourceWorkOrder)));
        if (!ok) return;
      }

      await executeWorkOrderAsyncAction({
        actionKey: "save",
        setActionStatus,
        setActionError,
        getFailure: (error) => createWorkOrderActionFailure({
          actionKey: "save",
          error,
          kind: "repository",
          retryable: true,
          message: lifecycleText.reworkFailedToast ?? "Failed to convert work order to rework.",
        }),
        setActionFailure,
        task: async () => {
          const nextWorkOrder = convertWorkOrderToRework(sourceWorkOrder);
          const detailLabel = `${getWorkOrderDisplayTitle(sourceWorkOrder)} → ${getWorkOrderDisplayTitle(nextWorkOrder)}`;
          const nextHistoryLogs = [
            createUpdateHistoryLog(currentUser.name, nextWorkOrder.id, [
              { label: historyText.detailLabels.changed, value: detailLabel },
            ], historyText),
          ];
          await persistWorkOrdersWithHistory(repository, {
            workOrders: workOrders.map((item) => item.id === workOrderId ? nextWorkOrder : item),
            historyLogs: nextHistoryLogs,
          });
          setWorkOrders((prev) => prev.map((item) => item.id === workOrderId ? nextWorkOrder : item));
          setSelectedId(nextWorkOrder.id);
          setLastSavedAt(nextWorkOrder.lastSavedAt);
          setSaveStatus("dirty");
          setHistoryLogs((prev) => [...nextHistoryLogs, ...prev]);
          setToastMessage(lifecycleText.reworkCompletedToastFormat.replace("{title}", getWorkOrderDisplayTitle(nextWorkOrder)));
        },
      });
    },
    [currentUser.name, historyText, lifecycleText, repository, setActionError, setActionFailure, setActionStatus, setHistoryLogs, setLastSavedAt, setSaveStatus, setSelectedId, setToastMessage, setWorkOrders],
  );

  const handleDeleteWorkOrder = useCallback(
    async ({ workOrderId, workOrders, selectedId }: DeleteWorkOrderInput) => {
      const target = workOrders.find((item) => item.id === workOrderId);
      if (!target || !canDeleteWorkOrder(target.workflowState) || workOrders.length <= 1) return;
      if (typeof window !== "undefined") {
        const ok = window.confirm(lifecycleText.deleteConfirmFormat.replace("{title}", getWorkOrderDisplayTitle(target)));
        if (!ok) return;
      }

      await executeWorkOrderAsyncAction({
        actionKey: "delete",
        setActionStatus,
        setActionError,
        setActionFailure,
        getFailure: (error) => createWorkOrderActionFailure({
          actionKey: "delete",
          error,
          kind: "repository",
          retryable: true,
          message: lifecycleText.deleteFailedToast ?? "Failed to delete work order.",
        }),
        task: async () => {
          const reindexed = reindexReorderGroupAfterDeletion(workOrders, target);
          const remaining = reindexed.filter((item) => item.id !== workOrderId);
          const fallbackSelectedId = remaining[0]?.id ?? repository.getDefaultSelectedId();
          const nextHistoryLogs = [
            createDeletionHistoryLog(currentUser.name, workOrderId, { title: getWorkOrderDisplayTitle(target) }, historyText),
          ];
          await repository.saveWorkOrdersAsync(remaining);
          await repository.appendHistoryLogsAsync(nextHistoryLogs);
          setWorkOrders(remaining);
          setHistoryLogs((prev) => [...nextHistoryLogs, ...prev]);
          if (selectedId === workOrderId) {
            setSelectedId(fallbackSelectedId);
            const fallbackWorkOrder = remaining.find((item) => item.id === fallbackSelectedId) ?? remaining[0];
            setLastSavedAt(fallbackWorkOrder?.lastSavedAt ?? null);
            setSaveStatus("saved");
          }
          setToastMessage(lifecycleText.deleteCompletedToast);
        },
      });
    },
    [currentUser.name, historyText, lifecycleText, repository, setActionError, setActionFailure, setActionStatus, setHistoryLogs, setLastSavedAt, setSaveStatus, setSelectedId, setToastMessage, setWorkOrders],
  );

  const handleRenameWorkOrderTitle = useCallback(
    async ({ workOrders, workOrder, nextTitle }: RenameWorkOrderTitleInput) => {
      const trimmedTitle = String(nextTitle ?? "").trim();
      if (!trimmedTitle) return;

      const previousBaseTitle = getWorkOrderBaseTitle(workOrder) || lifecycleText.newWorkOrderFallbackTitle;
      if (previousBaseTitle === trimmedTitle) return;

      await executeWorkOrderAsyncAction({
        actionKey: "rename",
        setActionStatus,
        setActionError,
        setActionFailure,
        getFailure: (error) => createWorkOrderActionFailure({
          actionKey: "rename",
          error,
          kind: "validation",
          retryable: false,
          message: lifecycleText.renameFailedToast ?? "Failed to rename work order.",
        }),
        task: async () => {
          const renameResult = renameWorkOrderGroupBaseTitle(workOrders, workOrder.id, trimmedTitle);
          if (renameResult.affectedWorkOrderIds.length === 0 || renameResult.previousBaseTitle === trimmedTitle) return;

          const nextHistoryLogs = renameResult.affectedWorkOrderIds.map((workOrderId) =>
            createTitleRenameHistoryLog(currentUser.name, workOrderId, {
              from: renameResult.previousBaseTitle ?? previousBaseTitle,
              to: trimmedTitle,
              appliedToGroup: renameResult.affectedWorkOrderIds.length > 1,
            }, historyText),
          );

          await persistWorkOrdersWithHistory(repository, {
            workOrders: renameResult.nextWorkOrders,
            historyLogs: nextHistoryLogs,
          });
          setWorkOrders(renameResult.nextWorkOrders);
          setHistoryLogs((prev) => [...nextHistoryLogs, ...prev]);
          setSaveStatus("dirty");
          setToastMessage(
            renameResult.affectedWorkOrderIds.length > 1
              ? lifecycleText.renameAppliedToSeriesToast
              : lifecycleText.renameAppliedToast,
          );
        },
      });
    },
    [currentUser.name, historyText, lifecycleText, repository, setActionError, setActionFailure, setActionStatus, setHistoryLogs, setSaveStatus, setToastMessage, setWorkOrders],
  );

  return {
    handleSave,
    handleCreateWorkOrder,
    handleReorderWorkOrder,
    handleReworkWorkOrder,
    handleDeleteWorkOrder,
    handleRenameWorkOrderTitle,
  };
}
