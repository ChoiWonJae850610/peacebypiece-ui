"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  buildInspectionCompleteResult,
  buildInventoryApplyResult,
  buildPatchWorkOrderResult,
  buildWorkflowActionResult,
} from "@/lib/workorder/actionFlow";
import type { WorkOrder, WorkflowAction } from "@/types/workorder";
import type {
  InspectionCompleteInput,
  InventoryChangeInput,
  UpdateSelectedWorkOrderInput,
  UseWorkOrderActionsParams,
} from "./useWorkOrderActionTypes";


const requiresOrderRequestConfirmation = (action: WorkflowAction) => action.nextState === "in_production";

type UseWorkOrderWorkflowActionsParams = Pick<
  UseWorkOrderActionsParams,
  | "currentUser"
  | "pendingWorkflowAction"
  | "workOrders"
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
  workOrders,
}: UseWorkOrderWorkflowActionsParams) {
  const workOrdersRef = useRef(workOrders);

  useEffect(() => {
    workOrdersRef.current = workOrders;
  }, [workOrders]);
  const applyWorkflowAction = useCallback(
    (workOrder: WorkOrder, action: WorkflowAction) => {
      const result = buildWorkflowActionResult({ workOrder, action, actorName: currentUser.name });

      setWorkOrders((prev) => prev.map((item) => (item.id === workOrder.id ? result.nextWorkOrder : item)));
      if (result.historyLogs?.length) {
        setHistoryLogs((prev) => [...result.historyLogs!, ...prev]);
      }
      if (result.saveStatus) {
        setSaveStatus(result.saveStatus);
      }
      if (result.openInventoryEditor) {
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
      const currentWorkOrder = workOrdersRef.current.find((item) => item.id === workOrderId);
      if (!currentWorkOrder) return;
      const result = buildInventoryApplyResult({
        workOrder: currentWorkOrder,
        actorName: currentUser.name,
        input: { inboundQuantity, adjustmentQuantity, deductionQuantity, memo },
      });
      if (!result) return;

      setWorkOrders((prev) => prev.map((item) => (item.id === workOrderId ? result.nextWorkOrder : item)));
      if (result.historyLogs?.length) {
        setHistoryLogs((prev) => [...result.historyLogs!, ...prev]);
      }
      if (result.saveStatus) {
        setSaveStatus(result.saveStatus);
      }
    },
    [currentUser.name, setHistoryLogs, setSaveStatus, setWorkOrders],
  );

  const handleCompleteInspection = useCallback(
    ({ workOrderId, orderEntryId, inboundQuantity, nextInventoryQuantity, memo }: InspectionCompleteInput & { workOrderId: string }) => {
      const currentWorkOrder = workOrdersRef.current.find((item) => item.id === workOrderId);
      if (!currentWorkOrder) return;
      const result = buildInspectionCompleteResult({
        workOrder: currentWorkOrder,
        actorName: currentUser.name,
        input: { orderEntryId, inboundQuantity, nextInventoryQuantity, memo },
      });

      setWorkOrders((prev) => prev.map((item) => (item.id === workOrderId ? result.nextWorkOrder : item)));
      if (result.historyLogs?.length) {
        setHistoryLogs((prev) => [...result.historyLogs!, ...prev]);
      }
      if (result.saveStatus) {
        setSaveStatus(result.saveStatus);
      }
      if (result.toastMessage) {
        setToastMessage(result.toastMessage);
      }
    },
    [currentUser.name, setHistoryLogs, setSaveStatus, setToastMessage, setWorkOrders],
  );

  const handleUpdateSelectedWorkOrder = useCallback(
    ({ workOrderId, patch, isReviewRequestLocked }: UpdateSelectedWorkOrderInput) => {
      const hasLockedChanges = Object.keys(patch).some((key) => key !== "memoThreads" && key !== "lastSavedAt");
      if (isReviewRequestLocked && hasLockedChanges) {
        return;
      }

      const currentWorkOrder = workOrdersRef.current.find((item) => item.id === workOrderId);
      if (!currentWorkOrder) return;
      const result = buildPatchWorkOrderResult({ workOrder: currentWorkOrder, patch });

      setWorkOrders((prev) => prev.map((item) => (item.id === workOrderId ? result.nextWorkOrder : item)));
      if (result.saveStatus) {
        setSaveStatus(result.saveStatus);
      }
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
