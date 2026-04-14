"use client";

import { useCallback, useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import {
  buildInspectionCompleteResult,
  buildInventoryApplyResult,
  buildPatchWorkOrderResult,
  buildWorkflowActionResult,
} from "@/lib/workorder/actionFlow";
import { applySharedInspectionComplete, applySharedInventoryAdjustment } from "@/lib/workorder/reorder/inventory";
import { useWorkorderRepository } from "@/lib/repositories/WorkorderRepositoryProvider";
import { persistWorkOrdersWithHistory } from "./workorderRepositoryMutations";
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
  const { i18n } = useI18n();
  const repository = useWorkorderRepository();
  const actionFlowText = i18n.workorder.actionFlow;
  const historyText = i18n.workorder.history;
  const workflowStateLabels = i18n.workorder.workflowStates as Record<string, string>;
  const workOrdersRef = useRef(workOrders);

  useEffect(() => {
    workOrdersRef.current = workOrders;
  }, [workOrders]);

  const applyWorkflowAction = useCallback(
    async (workOrder: WorkOrder, action: WorkflowAction) => {
      const result = buildWorkflowActionResult({
        workOrder,
        action,
        actorName: currentUser.name,
        text: actionFlowText,
        historyText,
        workflowStateLabels,
      });
      const nextWorkOrders = workOrdersRef.current.map((item) => (item.id === workOrder.id ? result.nextWorkOrder : item));

      await persistWorkOrdersWithHistory(repository, {
        workOrders: nextWorkOrders,
        historyLogs: result.historyLogs,
      });

      setWorkOrders(nextWorkOrders);
      if (result.historyLogs?.length) {
        setHistoryLogs((prev) => [...result.historyLogs!, ...prev]);
      }
      if (result.saveStatus) {
        setSaveStatus(result.saveStatus);
      }
      if (result.openInventoryEditor) {
        setInventoryEditorOpen(true);
      }
      if (result.toastMessage) {
        setToastMessage(result.toastMessage);
      }
    },
    [actionFlowText, currentUser.name, historyText, repository, setHistoryLogs, setInventoryEditorOpen, setSaveStatus, setToastMessage, setWorkOrders, workflowStateLabels],
  );

  const handleWorkflowAction = useCallback(
    (workOrder: WorkOrder, action: WorkflowAction) => {
      if (requiresOrderRequestConfirmation(action)) {
        setPendingWorkflowAction(action);
        setOrderRequestConfirmOpen(true);
        return;
      }

      void applyWorkflowAction(workOrder, action);
    },
    [applyWorkflowAction, setOrderRequestConfirmOpen, setPendingWorkflowAction],
  );

  const handleConfirmOrderRequest = useCallback(
    (workOrder: WorkOrder) => {
      if (!pendingWorkflowAction) return;
      void applyWorkflowAction(workOrder, pendingWorkflowAction);
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
        text: actionFlowText,
        historyText,
      });
      if (!result) return;

      const nextWorkOrders = applySharedInventoryAdjustment(workOrdersRef.current, currentWorkOrder, result.appliedChanges ?? []);
      void persistWorkOrdersWithHistory(repository, {
        workOrders: nextWorkOrders,
        historyLogs: result.historyLogs,
      });
      setWorkOrders(nextWorkOrders);
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
    [actionFlowText, currentUser.name, historyText, repository, setHistoryLogs, setSaveStatus, setToastMessage, setWorkOrders],
  );

  const handleCompleteInspection = useCallback(
    ({ workOrderId, orderEntryId, inboundQuantity, nextInventoryQuantity, memo }: InspectionCompleteInput & { workOrderId: string }) => {
      const currentWorkOrder = workOrdersRef.current.find((item) => item.id === workOrderId);
      if (!currentWorkOrder) return;
      const result = buildInspectionCompleteResult({
        workOrder: currentWorkOrder,
        actorName: currentUser.name,
        input: { orderEntryId, inboundQuantity, nextInventoryQuantity, memo },
        text: actionFlowText,
        historyText,
      });

      const nextWorkOrders = applySharedInspectionComplete(workOrdersRef.current, currentWorkOrder, {
        orderEntryId,
        nextInventoryQuantity,
      });
      void persistWorkOrdersWithHistory(repository, {
        workOrders: nextWorkOrders,
        historyLogs: result.historyLogs,
      });
      setWorkOrders(nextWorkOrders);
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
    [actionFlowText, currentUser.name, historyText, repository, setHistoryLogs, setSaveStatus, setToastMessage, setWorkOrders],
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
      const nextWorkOrders = workOrdersRef.current.map((item) => (item.id === workOrderId ? result.nextWorkOrder : item));

      void repository.saveWorkOrdersAsync(nextWorkOrders);
      setWorkOrders(nextWorkOrders);
      if (result.saveStatus) {
        setSaveStatus(result.saveStatus);
      }
    },
    [repository, setSaveStatus, setWorkOrders],
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
