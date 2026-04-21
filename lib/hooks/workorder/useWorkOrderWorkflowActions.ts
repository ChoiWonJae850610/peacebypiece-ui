"use client";

import { useCallback, useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import {
  buildFactoryOrderRequestResult,
  buildInspectionCompleteResult,
  buildInventoryApplyResult,
  buildPatchWorkOrderResult,
  buildWorkflowActionResult,
} from "@/lib/workorder/actionFlow";
import { applySharedInspectionComplete, applySharedInventoryAdjustment } from "@/lib/workorder/reorder/inventory";
import { useWorkorderRepository } from "@/lib/repositories/WorkorderRepositoryProvider";
import { persistWorkOrdersWithHistory } from "./workorderRepositoryMutations";
import { findPartnerIdByNameAndTypes } from "@/lib/admin/partnerMasterPersistence";
import { createReinspectionRequestHistoryLog, createWorkOrderKindChangeHistoryLog } from "@/lib/workorder/history/builders";
import { getWorkOrderDisplayTitle } from "@/lib/workorder/presentation/workOrderPresentation";
import { deriveOrderInfoHubPolicy } from "@/lib/workorder/orderInfoHubPolicy";
import { stabilizeWorkOrders } from "@/lib/workorder/reorder/state";
import { getOrderSubmissionSnapshot } from "@/lib/workorder/orderSubmission";
import {
  deriveWorkflowStateFromOrderEntries,
  getFactoryOrderRequestValidationMessage,
  getReviewApprovalValidationMessage,
  getReviewRequestValidationMessage,
  getReviewRequestWarningMessage,
} from "@/lib/workorder/workflow";
import { normalizeRoles } from "@/lib/constants/roles";
import type { FactoryOrderRequest, WorkOrder, WorkflowAction } from "@/types/workorder";
import type {
  InspectionCompleteInput,
  InventoryChangeInput,
  UpdateSelectedWorkOrderInput,
  UseWorkOrderActionsParams,
} from "./useWorkOrderActionTypes";

const requiresOrderRequestConfirmation = (action: WorkflowAction) => action.nextState === "order_requested";

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
    async (workOrder: WorkOrder, action: WorkflowAction, toastMessageOverride?: string | null) => {
      const result = buildWorkflowActionResult({
        workOrder,
        action,
        actorName: currentUser.name,
        text: actionFlowText,
        historyText,
        workflowStateLabels,
        toastMessageOverride: toastMessageOverride ?? undefined,
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

  const applyReinspectionAction = useCallback(
    async (workOrder: WorkOrder, action: WorkflowAction) => {
      const result = buildWorkflowActionResult({
        workOrder,
        action,
        actorName: currentUser.name,
        text: actionFlowText,
        historyText,
        workflowStateLabels,
        toastMessageOverride: actionFlowText.reinspectionRequestedToast,
      });
      result.historyLogs = [
        createReinspectionRequestHistoryLog(
          currentUser.name,
          workOrder.id,
          {
            from: workflowStateLabels[workOrder.workflowState] ?? workOrder.workflowState,
            to: workflowStateLabels[action.nextState] ?? action.nextState,
          },
          historyText,
        ),
      ];
      const nextWorkOrders = workOrdersRef.current.map((item) => (item.id === workOrder.id ? result.nextWorkOrder : item));

      await persistWorkOrdersWithHistory(repository, {
        workOrders: nextWorkOrders,
        historyLogs: result.historyLogs,
      });

      setInventoryEditorOpen(false);
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
    [actionFlowText, currentUser.name, historyText, repository, setHistoryLogs, setInventoryEditorOpen, setSaveStatus, setToastMessage, setWorkOrders, workflowStateLabels],
  );

  const handleWorkflowAction = useCallback(
    (workOrder: WorkOrder, action: WorkflowAction) => {
      let reviewWarningMessage: string | null = null;

      if (action.nextState === "review_requested") {
        const validationMessage = getReviewRequestValidationMessage({
          workOrder,
          text: actionFlowText,
        });
        if (validationMessage) {
          setToastMessage(validationMessage);
          return;
        }

        reviewWarningMessage = getReviewRequestWarningMessage({
          workOrder,
          text: actionFlowText,
        });
      }

      if (action.nextState === "review_approved") {
        const validationMessage = getReviewApprovalValidationMessage({
          workOrder,
          text: actionFlowText,
        });
        if (validationMessage) {
          setToastMessage(validationMessage);
          return;
        }
      }

      const effectiveWorkflowState = deriveWorkflowStateFromOrderEntries(workOrder.workflowState, workOrder.orderEntries);

      if (action.nextState === "in_inspection" && effectiveWorkflowState === "completed") {
        void applyReinspectionAction(workOrder, action);
        return;
      }

      if (requiresOrderRequestConfirmation(action)) {
        const currentWorkflowState = deriveWorkflowStateFromOrderEntries(workOrder.workflowState, workOrder.orderEntries);
        const currentRoles = normalizeRoles(currentUser.roles, currentUser.role);
        const submissionSnapshot = getOrderSubmissionSnapshot(workOrder);
        const validationMessage = getFactoryOrderRequestValidationMessage({
          currentRoles,
          workOrder,
          currentWorkflowState,
          factoryName: submissionSnapshot.factoryName,
          quantity: submissionSnapshot.quantity,
          text: actionFlowText,
        });
        if (validationMessage) {
          setToastMessage(validationMessage);
          return;
        }

        setPendingWorkflowAction(action);
        setOrderRequestConfirmOpen(true);
        return;
      }

      void applyWorkflowAction(workOrder, action, reviewWarningMessage);
    },
    [actionFlowText, applyReinspectionAction, applyWorkflowAction, currentUser.role, currentUser.roles, setOrderRequestConfirmOpen, setPendingWorkflowAction, setToastMessage],
  );

  const handleConfirmOrderRequest = useCallback(
    async (workOrder: WorkOrder, payload: { factoryName: string; quantity: number }) => {
      if (!pendingWorkflowAction) return;

      const currentWorkflowState = deriveWorkflowStateFromOrderEntries(workOrder.workflowState, workOrder.orderEntries);
      const currentRoles = normalizeRoles(currentUser.roles, currentUser.role);
      const validationMessage = getFactoryOrderRequestValidationMessage({
        currentRoles,
        workOrder,
        currentWorkflowState,
        factoryName: payload.factoryName,
        quantity: payload.quantity,
        text: actionFlowText,
      });

      if (validationMessage) {
        setToastMessage(validationMessage);
        setPendingWorkflowAction(null);
        setOrderRequestConfirmOpen(false);
        return;
      }

      const normalizedFactoryName = payload.factoryName.trim();
      const normalizedQuantity = Math.max(0, Number(payload.quantity) || 0);
      const requestedAt = new Date().toISOString();
      const factoryId = findPartnerIdByNameAndTypes(normalizedFactoryName, ["factory"])
        ?? `factory:${normalizedFactoryName.toLocaleLowerCase("ko-KR").replace(/\s+/g, "-")}`;
      const result = buildFactoryOrderRequestResult({
        workOrder,
        actorName: currentUser.name,
        input: {
          factoryId,
          factoryName: normalizedFactoryName,
          quantity: normalizedQuantity,
          requestedAt,
          requestedBy: currentUser.name,
          requestedById: currentUser.id,
        } satisfies FactoryOrderRequest,
        text: actionFlowText,
        historyText,
      });
      if (!result) {
        setToastMessage(actionFlowText.factoryOrderAlreadyRequestedToast);
        setPendingWorkflowAction(null);
        setOrderRequestConfirmOpen(false);
        return;
      }

      const nextWorkOrders = stabilizeWorkOrders(
        workOrdersRef.current.map((item) => (item.id === workOrder.id ? result.nextWorkOrder : item)),
      );
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
      if (result.toastMessage) {
        setToastMessage(result.toastMessage);
      }
      setPendingWorkflowAction(null);
      setOrderRequestConfirmOpen(false);
    },
    [actionFlowText, currentUser.id, currentUser.name, historyText, pendingWorkflowAction, repository, setHistoryLogs, setOrderRequestConfirmOpen, setPendingWorkflowAction, setSaveStatus, setToastMessage, setWorkOrders],
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

      const nextWorkflowState = currentWorkOrder.workflowState;
      const orderInfoHubPolicy = deriveOrderInfoHubPolicy({
        workOrder: currentWorkOrder,
        currentWorkflowState: nextWorkflowState,
        currentUserRole: currentUser.role,
      });
      const requestedKind = patch.workOrderKind;
      if (requestedKind) {
        const requestedOrderType = requestedKind === "rework" ? "재작업" : requestedKind === "main" ? "메인 생산" : "샘플";
        if (!orderInfoHubPolicy.canChangeKind || !orderInfoHubPolicy.allowedOrderTypes.includes(requestedOrderType)) {
          setToastMessage(actionFlowText.orderInfoLockedToast ?? null);
          return;
        }
      }
      const result = buildPatchWorkOrderResult({
        workOrder: currentWorkOrder,
        patch,
        actorName: currentUser.name,
        historyText,
      });
      const nextWorkOrders = stabilizeWorkOrders(
        workOrdersRef.current.map((item) => (item.id === workOrderId ? result.nextWorkOrder : item)),
      );
      const normalizedNextWorkOrder = nextWorkOrders.find((item) => item.id === workOrderId) ?? result.nextWorkOrder;
      const nextHistoryLogs = result.historyLogs?.length ? [
        createWorkOrderKindChangeHistoryLog(
          currentUser.name,
          currentWorkOrder.id,
          {
            fromTitle: getWorkOrderDisplayTitle(currentWorkOrder),
            toTitle: getWorkOrderDisplayTitle(normalizedNextWorkOrder),
            fromKind: currentWorkOrder.workOrderKind ?? "sample",
            toKind: normalizedNextWorkOrder.workOrderKind ?? "sample",
          },
          historyText,
        ),
      ] : undefined;

      void persistWorkOrdersWithHistory(repository, { workOrders: nextWorkOrders, historyLogs: nextHistoryLogs });
      setWorkOrders(nextWorkOrders);
      if (nextHistoryLogs?.length) {
        setHistoryLogs((prev) => [...nextHistoryLogs, ...prev]);
      }
      if (result.saveStatus) {
        setSaveStatus(result.saveStatus);
      }
    },
    [actionFlowText.orderInfoLockedToast, currentUser.name, currentUser.role, historyText, repository, setHistoryLogs, setSaveStatus, setToastMessage, setWorkOrders],
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
