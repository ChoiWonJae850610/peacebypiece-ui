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

type SaveStatus = "saved" | "dirty" | "saving";

type InventoryChangeInput = {
  inboundQuantity: number;
  adjustmentQuantity: number;
  deductionQuantity: number;
  memo: string;
};

type InspectionCompleteInput = {
  orderEntryId: string;
  inboundQuantity: number;
  nextInventoryQuantity: number;
  memo: string;
};

type CreateWorkOrderInput = {
  nextIndex: number;
  title?: string;
  category1?: string;
  category2?: string;
  category3?: string;
  season?: string;
};

type ChangeManagerInput = {
  workOrder: WorkOrder;
  managerId: string;
  users: UserProfile[];
  canChangeManager: boolean;
  isReviewRequestLocked: boolean;
};

type DeleteWorkOrderInput = {
  workOrderId: string;
  workOrders: WorkOrder[];
  selectedId: string;
};

type RenameWorkOrderTitleInput = {
  workOrders: WorkOrder[];
  workOrder: WorkOrder;
  nextTitle: string;
};

type UpdateSelectedWorkOrderInput = {
  workOrderId: string;
  patch: Partial<WorkOrder>;
  isReviewRequestLocked: boolean;
};

type UseWorkOrderActionsParams = {
  currentUser: UserProfile;
  canCreateWorkOrder: boolean;
  canReorderWorkOrder: boolean;
  pendingWorkflowAction: WorkflowAction | null;
  setUsers: Dispatch<SetStateAction<UserProfile[]>>;
  setWorkOrders: Dispatch<SetStateAction<WorkOrder[]>>;
  setHistoryLogs: Dispatch<SetStateAction<HistoryLog[]>>;
  setSelectedId: Dispatch<SetStateAction<string>>;
  setLastSavedAt: Dispatch<SetStateAction<string | null>>;
  setSaveStatus: Dispatch<SetStateAction<SaveStatus>>;
  setToastMessage: Dispatch<SetStateAction<string | null>>;
  setCreateWorkOrderModalOpen: Dispatch<SetStateAction<boolean>>;
  setInventoryEditorOpen: Dispatch<SetStateAction<boolean>>;
  setManagerAssignModalOpen: Dispatch<SetStateAction<boolean>>;
  setPendingWorkflowAction: Dispatch<SetStateAction<WorkflowAction | null>>;
  setOrderRequestConfirmOpen: Dispatch<SetStateAction<boolean>>;
};

const ORDER_REQUEST_ACTION_LABEL = WORKFLOW_ACTION_LABELS.requestOrder;
const REVIEW_REQUEST_ACTION_LABEL = WORKFLOW_ACTION_LABELS.requestReview;

export const canDeleteWorkOrder = (workflowState: WorkOrder["workflowState"]) =>
  workflowState === "draft" || workflowState === "review_requested";

const shouldPruneRowsBeforeWorkflowTransition = (action: WorkflowAction) =>
  action.label === REVIEW_REQUEST_ACTION_LABEL || action.label === ORDER_REQUEST_ACTION_LABEL;

const requiresOrderRequestConfirmation = (action: WorkflowAction) =>
  action.label === ORDER_REQUEST_ACTION_LABEL && action.nextState === "in_production";

const shouldOpenInventoryEditor = (action: WorkflowAction) => action.nextState === "in_inspection";

const buildInventoryChanges = ({ inboundQuantity, adjustmentQuantity, deductionQuantity }: InventoryChangeInput) => [
  ...(inboundQuantity > 0 ? [{ type: "입고" as const, quantity: inboundQuantity }] : []),
  ...(adjustmentQuantity > 0 ? [{ type: "보정" as const, quantity: adjustmentQuantity }] : []),
  ...(deductionQuantity > 0 ? [{ type: "차감" as const, quantity: deductionQuantity }] : []),
];

const applySelectedWorkflowAction = ({
  workOrder,
  action,
}: {
  workOrder: WorkOrder;
  action: WorkflowAction;
}) => {
  const targetWorkOrder = shouldPruneRowsBeforeWorkflowTransition(action) ? pruneDraftRows(workOrder) : workOrder;
  return updateWorkflowState([targetWorkOrder], workOrder.id, action)[0] ?? workOrder;
};

const createWorkflowHistoryLog = ({
  actorName,
  workOrderId,
  previousState,
  action,
}: {
  actorName: string;
  workOrderId: string;
  previousState: WorkOrder["workflowState"];
  action: WorkflowAction;
}) => createStatusHistoryLog(actorName, workOrderId, previousState, action.nextState, action.label);

export function useWorkOrderActions({
  currentUser,
  canCreateWorkOrder,
  canReorderWorkOrder,
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
}: UseWorkOrderActionsParams) {
  const applyWorkflowAction = useCallback(
    (workOrder: WorkOrder, action: WorkflowAction) => {
      const previousState = workOrder.workflowState;

      setWorkOrders((prev) =>
        prev.map((item) => (item.id === workOrder.id ? applySelectedWorkflowAction({ workOrder: item, action }) : item)),
      );
      setHistoryLogs((prev) => [
        createWorkflowHistoryLog({
          actorName: currentUser.name,
          workOrderId: workOrder.id,
          previousState,
          action,
        }),
        ...prev,
      ]);
      if (action.label === REVIEW_REQUEST_ACTION_LABEL) {
        setSaveStatus("dirty");
      }
      if (shouldOpenInventoryEditor(action)) {
        setInventoryEditorOpen(true);
      }
    },
    [currentUser.name, setHistoryLogs, setInventoryEditorOpen, setSaveStatus, setWorkOrders],
  );

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
    [canCreateWorkOrder, currentUser.id, currentUser.name, currentUser.role, setCreateWorkOrderModalOpen, setHistoryLogs, setLastSavedAt, setSaveStatus, setSelectedId, setWorkOrders],
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
    [canReorderWorkOrder, currentUser.id, currentUser.name, currentUser.role, setHistoryLogs, setLastSavedAt, setSaveStatus, setSelectedId, setToastMessage, setWorkOrders],
  );

  const handleWorkflowAction = useCallback(
    (workOrder: WorkOrder, action: WorkflowAction) => {
      if (requiresOrderRequestConfirmation(action)) {
        setPendingWorkflowAction(action);
        setOrderRequestConfirmOpen(true);
        return;
      }

      applyWorkflowAction(workOrder, action);
    },
    [applyWorkflowAction, setOrderRequestConfirmOpen, setPendingWorkflowAction],
  );

  const handleConfirmOrderRequest = useCallback(
    (workOrder: WorkOrder) => {
      if (!pendingWorkflowAction) return;
      applyWorkflowAction(workOrder, pendingWorkflowAction);
      setPendingWorkflowAction(null);
      setOrderRequestConfirmOpen(false);
    },
    [applyWorkflowAction, pendingWorkflowAction, setOrderRequestConfirmOpen, setPendingWorkflowAction],
  );

  const handleCloseOrderRequestConfirm = useCallback(() => {
    setPendingWorkflowAction(null);
    setOrderRequestConfirmOpen(false);
  }, [setOrderRequestConfirmOpen, setPendingWorkflowAction]);

  const handleInventoryApply = useCallback(
    (workOrderId: string, { inboundQuantity, adjustmentQuantity, deductionQuantity, memo }: InventoryChangeInput) => {
      const changes = buildInventoryChanges({ inboundQuantity, adjustmentQuantity, deductionQuantity, memo });
      if (changes.length === 0) return;

      setWorkOrders((prev) => applyInventoryAdjustment(prev, workOrderId, { changes }));
      setHistoryLogs((prev) => [createInventoryHistoryLog(currentUser.name, workOrderId, { changes, memo }), ...prev]);
    },
    [currentUser.name, setHistoryLogs, setWorkOrders],
  );

  const handleCompleteInspection = useCallback(
    ({ workOrderId, orderEntryId, inboundQuantity, nextInventoryQuantity, memo }: InspectionCompleteInput & { workOrderId: string }) => {
      const trimmedMemo = memo.trim();

      setWorkOrders((prev) =>
        prev.map((item) => {
          if (item.id !== workOrderId) return item;
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
        createInspectionCompleteHistoryLog(currentUser.name, workOrderId, {
          inboundQuantity,
          nextInventoryQuantity,
          memo: trimmedMemo,
        }),
        ...prev,
      ]);
      setSaveStatus("dirty");
      setToastMessage("검수 완료가 반영되었습니다.");
    },
    [currentUser.name, setHistoryLogs, setSaveStatus, setToastMessage, setWorkOrders],
  );

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

  const handleUpdateSelectedWorkOrder = useCallback(
    ({ workOrderId, patch, isReviewRequestLocked }: UpdateSelectedWorkOrderInput) => {
      const hasLockedChanges = Object.keys(patch).some((key) => key !== "memoThreads" && key !== "lastSavedAt");
      if (isReviewRequestLocked && hasLockedChanges) {
        return;
      }

      setWorkOrders((prev) =>
        prev.map((item) => {
          if (item.id !== workOrderId) return item;
          const nextItem = { ...item, ...patch };
          if (patch.orderEntries) {
            nextItem.workflowState = deriveWorkflowStateFromOrderEntries(item.workflowState, patch.orderEntries);
          }
          return nextItem;
        }),
      );
      setSaveStatus("dirty");
    },
    [setSaveStatus, setWorkOrders],
  );

  return {
    handleSave,
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
