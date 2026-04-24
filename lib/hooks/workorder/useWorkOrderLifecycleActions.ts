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
import { getWorkOrderBaseTitle, canReorderWorkOrder as canCreateReorderFromWorkOrder, normalizeWorkOrdersReorderIdentity, reindexReorderGroupAfterDeletion } from "@/lib/workorder/reorder/helpers";
import { createWorkOrderActionFailure, executeWorkOrderAsyncAction } from "@/lib/workorder/actionFlow";
import {
  getLastSavedAtForWorkOrder,
  mergeSavedWorkOrders,
  persistCreatedWorkOrderWithHistory,
  persistWorkOrderWithHistory,
  persistWorkOrdersWithHistory,
  replaceWorkOrderById,
  upsertWorkOrderAtStart,
} from "./workorderRepositoryMutations";
import type { WorkOrder } from "@/types/workorder";
import type {
  CreateWorkOrderInput,
  DeleteWorkOrderInput,
  RenameWorkOrderTitleInput,
  UseWorkOrderActionsParams,
} from "./useWorkOrderActionTypes";

export const canDeleteWorkOrder = (_workflowState: WorkOrder["workflowState"]) =>
  true;

type UseWorkOrderLifecycleActionsParams = Pick<
  UseWorkOrderActionsParams,
  | "currentUser"
  | "canCreateWorkOrder"
  | "canReorderWorkOrder"
  | "setWorkOrders"
  | "setPersistedWorkOrders"
  | "setHistoryLogs"
  | "setSelectedId"
  | "setLastSavedAt"
  | "setSaveStatus"
  | "persistedWorkOrders"
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
  setPersistedWorkOrders,
  setHistoryLogs,
  setSelectedId,
  setLastSavedAt,
  setSaveStatus,
  persistedWorkOrders,
  setToastMessage,
  setCreateWorkOrderModalOpen,
  setActionStatus,
  setActionError,
  setActionFailure,
}: UseWorkOrderLifecycleActionsParams) {
  const { i18n } = useI18n();
  const lifecycleText = i18n.workorder.lifecycle;

  const findChangedWorkOrdersForPersistence = useCallback((previousWorkOrders: WorkOrder[], nextWorkOrders: WorkOrder[]) => {
    const previousById = new Map(previousWorkOrders.map((item) => [item.id, item]));
    return nextWorkOrders.filter((item) => {
      const previous = previousById.get(item.id);
      return JSON.stringify(previous) !== JSON.stringify(item);
    });
  }, []);
  const historyText = i18n.workorder.history;
  const repository = useWorkorderRepository();

  const handleSave = useCallback(
    async (workOrder: WorkOrder, workOrders: WorkOrder[]) => {
      await executeWorkOrderAsyncAction({
        actionKey: "save",
        setActionStatus,
        setActionError,
        setActionFailure,
        getFailure: (error) => createWorkOrderActionFailure({
          actionKey: "save",
          error,
          kind: "repository",
          retryable: true,
          message: lifecycleText.saveFailedToast ?? "Failed to save work order.",
        }),
        task: async () => {
          setSaveStatus("saving");
          const previousPersistedWorkOrder = persistedWorkOrders.find((item) => item.id === workOrder.id) ?? workOrder;
          const locallySavedWorkOrder = {
            ...workOrder,
            lastSavedAt: previousPersistedWorkOrder.lastSavedAt,
          };
          const locallySavedWorkOrders = replaceWorkOrderById(workOrders, workOrder.id, locallySavedWorkOrder);

          setWorkOrders(locallySavedWorkOrders);
          setPersistedWorkOrders(locallySavedWorkOrders);
          setLastSavedAt(previousPersistedWorkOrder.lastSavedAt ?? null);
          setSaveStatus("saved");
          setToastMessage(lifecycleText.saveCompletedToast);
          setActionFailure?.("save", null);
          setActionError("save", null);
        },
      });
    },
    [lifecycleText.saveCompletedToast, lifecycleText.saveFailedToast, persistedWorkOrders, setActionError, setActionFailure, setActionStatus, setLastSavedAt, setPersistedWorkOrders, setSaveStatus, setToastMessage, setWorkOrders],
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

          const createdWorkOrder = await persistCreatedWorkOrderWithHistory(repository, {
            workOrder: newWorkOrder,
            historyLogs: nextHistoryLogs,
          });

          setWorkOrders((prev) => upsertWorkOrderAtStart(prev, createdWorkOrder));
          setPersistedWorkOrders((prev) => upsertWorkOrderAtStart(prev, createdWorkOrder));
          setSelectedId(createdWorkOrder.id);
          setLastSavedAt(createdWorkOrder.lastSavedAt ?? newWorkOrder.lastSavedAt);
          setHistoryLogs((historyPrev) => [...nextHistoryLogs, ...historyPrev]);
          setSaveStatus("saved");
          setToastMessage(lifecycleText.createCompletedToastFormat.replace("{title}", getWorkOrderDisplayTitle(createdWorkOrder)));
          setCreateWorkOrderModalOpen(false);
          setActionFailure?.("create", null);
          setActionError("create", null);
        },
      });
    },
    [canCreateWorkOrder, currentUser.id, currentUser.name, currentUser.role, historyText, lifecycleText.createCompletedToastFormat, lifecycleText.createFailedToast, repository, setActionError, setActionFailure, setActionStatus, setCreateWorkOrderModalOpen, setHistoryLogs, setLastSavedAt, setPersistedWorkOrders, setSaveStatus, setSelectedId, setWorkOrders, setToastMessage],
  );

  const handleReorderWorkOrder = useCallback(
    async (workOrders: WorkOrder[], workOrderId: string) => {
      if (!canReorderWorkOrder) return;
      const sourceWorkOrder = workOrders.find((item) => item.id === workOrderId);
      if (!sourceWorkOrder || !canCreateReorderFromWorkOrder(sourceWorkOrder)) return;

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

          const nextWorkOrders = normalizeWorkOrdersReorderIdentity([nextWorkOrder, ...workOrders]);
          const createdWorkOrder = nextWorkOrders.find((item) => item.id === nextWorkOrder.id) ?? nextWorkOrder;
          const nextHistoryLogs = [
            createReorderHistoryLog(currentUser.name, createdWorkOrder.id, {
              sourceTitle: getWorkOrderDisplayTitle(sourceWorkOrder),
              nextTitle: getWorkOrderDisplayTitle(createdWorkOrder),
            }, historyText),
          ];
          const persistedWorkOrders = await persistWorkOrdersWithHistory(repository, {
            workOrders: nextWorkOrders,
            historyLogs: nextHistoryLogs,
          });
          const persistedCreatedWorkOrder = persistedWorkOrders.find((item) => item.id === createdWorkOrder.id) ?? createdWorkOrder;
          setWorkOrders(persistedWorkOrders);
          setPersistedWorkOrders(persistedWorkOrders);
          setSelectedId(persistedCreatedWorkOrder.id);
          setLastSavedAt(persistedCreatedWorkOrder.lastSavedAt);
          setSaveStatus("saved");
          setHistoryLogs((prev) => [...nextHistoryLogs, ...prev]);
          setToastMessage(lifecycleText.reorderCreatedToastFormat.replace("{title}", getWorkOrderDisplayTitle(createdWorkOrder)));
        },
      });
    },
    [canReorderWorkOrder, currentUser.id, currentUser.name, currentUser.role, historyText, lifecycleText, repository, setActionError, setActionFailure, setActionStatus, setHistoryLogs, setLastSavedAt, setPersistedWorkOrders, setSaveStatus, setSelectedId, setToastMessage, setWorkOrders],
  );

  const handleReworkWorkOrder = useCallback(
    async (workOrders: WorkOrder[], workOrderId: string) => {
      const sourceWorkOrder = workOrders.find((item) => item.id === workOrderId);
      if (!sourceWorkOrder || !canCreateReorderFromWorkOrder(sourceWorkOrder)) return;

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
          const pendingWorkOrder = convertWorkOrderToRework(sourceWorkOrder);
          const nextWorkOrders = normalizeWorkOrdersReorderIdentity(
            workOrders.map((item) => item.id === workOrderId ? pendingWorkOrder : item),
          );
          const nextWorkOrder = nextWorkOrders.find((item) => item.id === workOrderId) ?? pendingWorkOrder;
          const detailLabel = `${getWorkOrderDisplayTitle(sourceWorkOrder)} → ${getWorkOrderDisplayTitle(nextWorkOrder)}`;
          const nextHistoryLogs = [
            createUpdateHistoryLog(currentUser.name, nextWorkOrder.id, [
              { label: historyText.detailLabels.changed, value: detailLabel },
            ], historyText),
          ];
          const persistedWorkOrders = await persistWorkOrdersWithHistory(repository, {
            workOrders: nextWorkOrders,
            historyLogs: nextHistoryLogs,
          });
          const persistedWorkOrder = persistedWorkOrders.find((item) => item.id === nextWorkOrder.id) ?? nextWorkOrder;
          setWorkOrders(persistedWorkOrders);
          setPersistedWorkOrders(persistedWorkOrders);
          setSelectedId(persistedWorkOrder.id);
          setLastSavedAt(persistedWorkOrder.lastSavedAt);
          setSaveStatus("saved");
          setHistoryLogs((prev) => [...nextHistoryLogs, ...prev]);
          setToastMessage(lifecycleText.reworkCompletedToastFormat.replace("{title}", getWorkOrderDisplayTitle(nextWorkOrder)));
        },
      });
    },
    [currentUser.name, findChangedWorkOrdersForPersistence, historyText, lifecycleText, repository, setActionError, setActionFailure, setActionStatus, setHistoryLogs, setLastSavedAt, setPersistedWorkOrders, setSaveStatus, setSelectedId, setToastMessage, setWorkOrders],
  );

  const handleDeleteWorkOrder = useCallback(
    async ({ workOrderId, workOrders, selectedId }: DeleteWorkOrderInput) => {
      const target = workOrders.find((item) => item.id === workOrderId);
      if (!target || !canDeleteWorkOrder(target.workflowState)) return;
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
          const fallbackSelectedId = remaining[0]?.id ?? "";
          const nextHistoryLogs = [
            createDeletionHistoryLog(currentUser.name, workOrderId, { title: getWorkOrderDisplayTitle(target) }, historyText),
          ];
          await repository.deleteWorkOrderAsync(workOrderId);
          const changedRemaining = findChangedWorkOrdersForPersistence(workOrders.filter((item) => item.id !== workOrderId), remaining);
          const persistedChangedRemaining = changedRemaining.length > 0
            ? await repository.saveWorkOrdersAsync(changedRemaining)
            : [];
          const persistedRemaining = mergeSavedWorkOrders(remaining, persistedChangedRemaining);
          await repository.appendHistoryLogsAsync(nextHistoryLogs);
          setWorkOrders(persistedRemaining);
          setPersistedWorkOrders(persistedRemaining);
          setHistoryLogs((prev) => [...nextHistoryLogs, ...prev]);

          const nextSelectedId = selectedId === workOrderId ? fallbackSelectedId : selectedId;
          if (selectedId === workOrderId) {
            setSelectedId(nextSelectedId);
          }

          setLastSavedAt(getLastSavedAtForWorkOrder(persistedRemaining, nextSelectedId));
          setSaveStatus("saved");
          setToastMessage(lifecycleText.deleteCompletedToast);
        },
      });
    },
    [currentUser.name, findChangedWorkOrdersForPersistence, historyText, lifecycleText, repository, setActionError, setActionFailure, setActionStatus, setHistoryLogs, setLastSavedAt, setPersistedWorkOrders, setSaveStatus, setSelectedId, setToastMessage, setWorkOrders],
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
          const localRenameResult = renameWorkOrderGroupBaseTitle(workOrders, workOrder.id, trimmedTitle);
          if (localRenameResult.affectedWorkOrderIds.length === 0 || localRenameResult.previousBaseTitle === trimmedTitle) return;

          const persistedRenameResult = renameWorkOrderGroupBaseTitle(persistedWorkOrders, workOrder.id, trimmedTitle);
          const nextHistoryLogs = localRenameResult.affectedWorkOrderIds.map((workOrderId) =>
            createTitleRenameHistoryLog(currentUser.name, workOrderId, {
              from: localRenameResult.previousBaseTitle ?? previousBaseTitle,
              to: trimmedTitle,
              appliedToGroup: localRenameResult.affectedWorkOrderIds.length > 1,
            }, historyText),
          );

          const persistedChangedWorkOrders = persistedRenameResult.nextWorkOrders.filter((item) =>
            persistedRenameResult.affectedWorkOrderIds.includes(item.id),
          );
          const savedChangedWorkOrders = persistedChangedWorkOrders.length > 0
            ? await repository.saveWorkOrdersAsync(persistedChangedWorkOrders)
            : [];
          if (nextHistoryLogs.length > 0) {
            await repository.appendHistoryLogsAsync(nextHistoryLogs);
          }

          const nextPersistedWorkOrders = mergeSavedWorkOrders(persistedRenameResult.nextWorkOrders, savedChangedWorkOrders);
          const nextLocalWorkOrders = mergeSavedWorkOrders(localRenameResult.nextWorkOrders, savedChangedWorkOrders);

          setPersistedWorkOrders(nextPersistedWorkOrders);
          setWorkOrders(nextLocalWorkOrders);
          const renamedWorkOrder = nextPersistedWorkOrders.find((item) => item.id === workOrder.id) ?? nextLocalWorkOrders.find((item) => item.id === workOrder.id) ?? null;
          setLastSavedAt(renamedWorkOrder?.lastSavedAt ?? null);
          setSaveStatus("saved");
          setHistoryLogs((prev) => [...nextHistoryLogs, ...prev]);
          setToastMessage(
            localRenameResult.affectedWorkOrderIds.length > 1
              ? lifecycleText.renameAppliedToSeriesToast
              : lifecycleText.renameAppliedToast,
          );
        },
      });
    },
    [currentUser.name, historyText, lifecycleText, persistedWorkOrders, repository, setActionError, setActionFailure, setActionStatus, setHistoryLogs, setLastSavedAt, setPersistedWorkOrders, setSaveStatus, setToastMessage, setWorkOrders],
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
