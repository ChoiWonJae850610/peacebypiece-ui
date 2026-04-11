"use client";

import { useCallback } from "react";
import { WORKFLOW_ACTION_LABELS } from "@/lib/constants/workflow";
import {
  createInspectionCompleteHistoryLog,
  createInventoryHistoryLog,
  createStatusHistoryLog,
} from "@/lib/workorder/history/builders";
import {
  applyInventoryAdjustmentToWorkOrder,
  applyWorkflowActionToWorkOrder,
  buildInventoryChanges,
  completeInspectionForWorkOrder,
  patchWorkOrder,
} from "@/lib/workorder/actions";
import { pruneDraftRows } from "@/lib/workorder/draftRows";
import type { WorkOrder, WorkflowAction } from "@/types/workorder";
import type {
  InspectionCompleteInput,
  InventoryChangeInput,
  UpdateSelectedWorkOrderInput,
  UseWorkOrderActionsParams,
} from "./useWorkOrderActionTypes";

const ORDER_REQUEST_ACTION_LABEL = WORKFLOW_ACTION_LABELS.requestOrder;
const REVIEW_REQUEST_ACTION_LABEL = WORKFLOW_ACTION_LABELS.requestReview;

const shouldPruneRowsBeforeWorkflowTransition = (action: WorkflowAction) =>
  action.label === REVIEW_REQUEST_ACTION_LABEL || action.label === ORDER_REQUEST_ACTION_LABEL;

const requiresOrderRequestConfirmation = (action: WorkflowAction) =>
  action.label === ORDER_REQUEST_ACTION_LABEL && action.nextState === "in_production";

const shouldOpenInventoryEditor = (action: WorkflowAction) => action.nextState === "in_inspection";

const applySelectedWorkflowAction = ({
  workOrder,
  action,
}: {
  workOrder: WorkOrder;
  action: WorkflowAction;
}) => {
  const targetWorkOrder = shouldPruneRowsBeforeWorkflowTransition(action) ? pruneDraftRows(workOrder) : workOrder;
  return applyWorkflowActionToWorkOrder(targetWorkOrder, action);
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

type UseWorkOrderWorkflowActionsParams = Pick<
  UseWorkOrderActionsParams,
  | "currentUser"
  | "pendingWorkflowAction"
  | "setWorkOrders"
  | "setHistoryLogs"
  | "setSaveStatus"
  | "setToastMessage"
  | "setInventoryEditorOpen"
  | "setPendingWorkflowAction"
  | "setOrderRequestConfirmOpen"
>;

export function useWorkOrderWorkflowActions({
  currentUser,
  pendingWorkflowAction,
  setWorkOrders,
  setHistoryLogs,
  setSaveStatus,
  setToastMessage,
  setInventoryEditorOpen,
  setPendingWorkflowAction,
  setOrderRequestConfirmOpen,
}: UseWorkOrderWorkflowActionsParams) {
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
      const changes = buildInventoryChanges({ inboundQuantity, adjustmentQuantity, deductionQuantity });
      if (changes.length === 0) return;

      setWorkOrders((prev) =>
        prev.map((item) => (item.id === workOrderId ? applyInventoryAdjustmentToWorkOrder(item, { changes }) : item)),
      );
      setHistoryLogs((prev) => [createInventoryHistoryLog(currentUser.name, workOrderId, { changes, memo }), ...prev]);
    },
    [currentUser.name, setHistoryLogs, setWorkOrders],
  );

  const handleCompleteInspection = useCallback(
    ({ workOrderId, orderEntryId, inboundQuantity, nextInventoryQuantity, memo }: InspectionCompleteInput & { workOrderId: string }) => {
      const trimmedMemo = memo.trim();

      setWorkOrders((prev) =>
        prev.map((item) =>
          item.id === workOrderId
            ? completeInspectionForWorkOrder(item, { orderEntryId, nextInventoryQuantity })
            : item,
        ),
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

  const handleUpdateSelectedWorkOrder = useCallback(
    ({ workOrderId, patch, isReviewRequestLocked }: UpdateSelectedWorkOrderInput) => {
      const hasLockedChanges = Object.keys(patch).some((key) => key !== "memoThreads" && key !== "lastSavedAt");
      if (isReviewRequestLocked && hasLockedChanges) {
        return;
      }

      setWorkOrders((prev) => prev.map((item) => (item.id === workOrderId ? patchWorkOrder(item, patch) : item)));
      setSaveStatus("dirty");
    },
    [setSaveStatus, setWorkOrders],
  );

  return {
    applyWorkflowAction,
    handleWorkflowAction,
    handleConfirmOrderRequest,
    handleCloseOrderRequestConfirm,
    handleInventoryApply,
    handleCompleteInspection,
    handleUpdateSelectedWorkOrder,
  };
}
