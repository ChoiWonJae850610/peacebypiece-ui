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
import {
  getSelectedWorkOrderForSaveState,
  persistWorkOrderWithHistory,
  persistWorkOrderStatePatchWithHistory,
  mergeSavedWorkOrders,
  persistWorkOrderStatePatchesWithHistory,
  replaceWorkOrderById,
} from "./workorderRepositoryMutations";
import { findPartnerIdByNameAndTypes } from "@/lib/admin/partner/persistence";
import { createReinspectionRequestHistoryLog } from "@/lib/workorder/history/builders";
import { getWorkOrderDisplayTitle } from "@/lib/workorder/presentation/workOrderPresentation";
import { getOrderTypeFromWorkOrderKind, getWorkOrderReorderGroupId } from "@/lib/workorder/reorder/helpers";
import { deriveOrderInfoHubPolicy } from "@/lib/workorder/orderInfoHubPolicy";
import { isImmediateDbField } from "@/lib/workorder/storagePolicy";
import { stabilizeWorkOrders } from "@/lib/workorder/reorder/state";
import { getOrderSubmissionSnapshot } from "@/lib/workorder/orderSubmission";
import {
  deriveWorkflowStateFromOrderEntries,
  getFactoryOrderRequestValidationMessage,
  getReviewApprovalValidationMessage,
  getReviewApprovalWarningMessage,
  getReviewRequestValidationMessage,
  getReviewRequestWarningMessage,
} from "@/lib/workorder/workflow";
import { normalizeRoles } from "@/lib/constants/roles";
import { canReinspectInWorkflow, isWorkflowState } from "@/lib/constants/workorderStates";
import type { FactoryOrderRequest, WorkOrder, WorkflowAction } from "@/types/workorder";
import type {
  InspectionCompleteInput,
  InventoryChangeInput,
  UpdateSelectedWorkOrderInput,
  UseWorkOrderActionsParams,
} from "./useWorkOrderActionTypes";

const requiresOrderRequestConfirmation = (action: WorkflowAction) => action.actionType === "request_order";

type FactoryPartnerApiItem = {
  id?: unknown;
  name?: unknown;
  type?: unknown;
  is_active?: unknown;
};

function normalizePartnerLookupText(value: unknown): string {
  return String(value ?? "").trim();
}

function isSamePartnerName(left: unknown, right: unknown): boolean {
  return normalizePartnerLookupText(left).toLocaleLowerCase("ko-KR") === normalizePartnerLookupText(right).toLocaleLowerCase("ko-KR");
}

async function resolveActiveFactoryPartnerIdByName(factoryName: string): Promise<string | null> {
  try {
    const response = await fetch("/api/partners/factories", { cache: "no-store" });
    if (response.ok) {
      const payload = (await response.json()) as { partners?: FactoryPartnerApiItem[] };
      const target = (payload.partners ?? []).find((partner) => {
        if (partner.is_active === false) return false;
        return isSamePartnerName(partner.name, factoryName);
      });

      const apiPartnerId = normalizePartnerLookupText(target?.id);
      if (apiPartnerId) return apiPartnerId;
    }
  } catch {
    // DB API가 비활성화된 mock 환경에서는 local partner master를 fallback으로 사용한다.
  }

  return findPartnerIdByNameAndTypes(factoryName, ["factory"]);
}

type UseWorkOrderWorkflowActionsParams = Pick<
  UseWorkOrderActionsParams,
  | "currentUser"
  | "pendingWorkflowAction"
  | "workOrders"
  | "setWorkOrders"
  | "setPersistedWorkOrders"
  | "setHistoryLogs"
  | "setSaveStatus"
  | "setLastSavedAt"
  | "setToastMessage"
  | "selectedId"
  | "setInventoryEditorOpen"
  | "setPendingWorkflowAction"
  | "setOrderRequestConfirmOpen"
>;

export function useWorkOrderWorkflowActions({
  currentUser,
  pendingWorkflowAction,
  setWorkOrders,
  setPersistedWorkOrders,
  setHistoryLogs,
  setSaveStatus,
  setLastSavedAt,
  setToastMessage,
  selectedId,
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

  const syncSelectedWorkOrderSaveState = useCallback((nextWorkOrders: WorkOrder[]) => {
    const nextSelectedWorkOrder = getSelectedWorkOrderForSaveState(nextWorkOrders, selectedId);

    setLastSavedAt(nextSelectedWorkOrder?.lastSavedAt ?? null);
    setSaveStatus("saved");
  }, [selectedId, setLastSavedAt, setSaveStatus]);

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
      setSaveStatus("saving");
      const persistedWorkOrder = await persistWorkOrderStatePatchWithHistory(repository, {
        workOrder: result.nextWorkOrder,
        historyLogs: result.historyLogs,
        auditActor: currentUser,
      });
      const persistedWorkOrders = replaceWorkOrderById(workOrdersRef.current, workOrder.id, persistedWorkOrder);

      setWorkOrders(persistedWorkOrders);
      setPersistedWorkOrders(persistedWorkOrders);
      syncSelectedWorkOrderSaveState(persistedWorkOrders);
      if (result.historyLogs?.length) {
        setHistoryLogs((prev) => [...result.historyLogs!, ...prev]);
      }
      if (result.openInventoryEditor) {
        setInventoryEditorOpen(true);
      }
      if (result.toastMessage) {
        setToastMessage(result.toastMessage);
      }
    },
    [actionFlowText, currentUser, currentUser.name, historyText, repository, setHistoryLogs, setInventoryEditorOpen, setPersistedWorkOrders, setSaveStatus, setToastMessage, setWorkOrders, syncSelectedWorkOrderSaveState, workflowStateLabels],
  );

  const getInventorySyncCandidates = useCallback((nextWorkOrders: WorkOrder[], currentWorkOrder: WorkOrder) => {
    const currentGroupId = getWorkOrderReorderGroupId(currentWorkOrder);
    return nextWorkOrders.filter((item) => item.id === currentWorkOrder.id || getWorkOrderReorderGroupId(item) === currentGroupId);
  }, []);

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
      setSaveStatus("saving");
      const persistedWorkOrder = await persistWorkOrderStatePatchWithHistory(repository, {
        workOrder: result.nextWorkOrder,
        historyLogs: result.historyLogs,
        auditActor: currentUser,
      });
      const persistedWorkOrders = replaceWorkOrderById(workOrdersRef.current, workOrder.id, persistedWorkOrder);

      setInventoryEditorOpen(false);
      setWorkOrders(persistedWorkOrders);
      setPersistedWorkOrders(persistedWorkOrders);
      syncSelectedWorkOrderSaveState(persistedWorkOrders);
      if (result.historyLogs?.length) {
        setHistoryLogs((prev) => [...result.historyLogs!, ...prev]);
      }
      if (result.toastMessage) {
        setToastMessage(result.toastMessage);
      }
    },
    [actionFlowText, currentUser, currentUser.name, historyText, repository, setHistoryLogs, setInventoryEditorOpen, setPersistedWorkOrders, setSaveStatus, setToastMessage, setWorkOrders, syncSelectedWorkOrderSaveState, workflowStateLabels],
  );

  const handleWorkflowAction = useCallback(
    async (workOrder: WorkOrder, action: WorkflowAction) => {
      let reviewWarningMessage: string | null = null;

      if (isWorkflowState(action.nextState, "review_requested")) {
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

      if (isWorkflowState(action.nextState, "review_completed")) {
        const validationMessage = getReviewApprovalValidationMessage({
          workOrder,
          text: actionFlowText,
        });
        if (validationMessage) {
          setToastMessage(validationMessage);
          return;
        }

        reviewWarningMessage = getReviewApprovalWarningMessage({
          workOrder,
          text: actionFlowText,
        });
      }

      const effectiveWorkflowState = deriveWorkflowStateFromOrderEntries(workOrder.workflowState, workOrder.orderEntries);

      if (isWorkflowState(action.nextState, "inspection") && canReinspectInWorkflow(effectiveWorkflowState)) {
        await applyReinspectionAction(workOrder, action);
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

      await applyWorkflowAction(workOrder, action, reviewWarningMessage);
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
      const factoryId = await resolveActiveFactoryPartnerIdByName(normalizedFactoryName);
      if (!factoryId) {
        setToastMessage(actionFlowText.factoryOrderFactoryInvalidToast);
        setPendingWorkflowAction(null);
        setOrderRequestConfirmOpen(false);
        return;
      }
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
      setSaveStatus("saving");
      const nextPersistedWorkOrder = await persistWorkOrderStatePatchWithHistory(repository, {
        workOrder: result.nextWorkOrder,
        historyLogs: result.historyLogs,
        auditActor: currentUser,
      });
      const persistedWorkOrders = replaceWorkOrderById(nextWorkOrders, workOrder.id, nextPersistedWorkOrder);
      setWorkOrders(persistedWorkOrders);
      setPersistedWorkOrders(persistedWorkOrders);
      syncSelectedWorkOrderSaveState(persistedWorkOrders);
      if (result.historyLogs?.length) {
        setHistoryLogs((prev) => [...result.historyLogs!, ...prev]);
      }
      if (result.toastMessage) {
        setToastMessage(result.toastMessage);
      }
      setPendingWorkflowAction(null);
      setOrderRequestConfirmOpen(false);
    },
    [actionFlowText, currentUser, currentUser.id, currentUser.name, historyText, pendingWorkflowAction, repository, setHistoryLogs, setOrderRequestConfirmOpen, setPendingWorkflowAction, setPersistedWorkOrders, setSaveStatus, setToastMessage, setWorkOrders, syncSelectedWorkOrderSaveState],
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
      const persistCandidates = getInventorySyncCandidates(nextWorkOrders, currentWorkOrder);
      setSaveStatus("saving");
      void persistWorkOrderStatePatchesWithHistory(repository, {
        workOrders: persistCandidates,
        historyLogs: result.historyLogs,
        auditActor: currentUser,
      }).then((persistedCandidates) => {
        const persistedWorkOrders = mergeSavedWorkOrders(nextWorkOrders, persistedCandidates);
        setWorkOrders(persistedWorkOrders);
        setPersistedWorkOrders(persistedWorkOrders);
        syncSelectedWorkOrderSaveState(persistedWorkOrders);
      }).catch((error) => {
        setSaveStatus("dirty");
        setToastMessage(error instanceof Error ? error.message : null);
      });
      setWorkOrders(nextWorkOrders);
      if (result.historyLogs?.length) {
        setHistoryLogs((prev) => [...result.historyLogs!, ...prev]);
      }
      if (result.toastMessage) {
        setToastMessage(result.toastMessage);
      }
    },
    [actionFlowText, currentUser, currentUser.name, getInventorySyncCandidates, historyText, repository, setHistoryLogs, setPersistedWorkOrders, setSaveStatus, setToastMessage, setWorkOrders, syncSelectedWorkOrderSaveState],
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
      const persistCandidates = getInventorySyncCandidates(nextWorkOrders, currentWorkOrder);
      setSaveStatus("saving");
      void persistWorkOrderStatePatchesWithHistory(repository, {
        workOrders: persistCandidates,
        historyLogs: result.historyLogs,
        auditActor: currentUser,
      }).then((persistedCandidates) => {
        const persistedWorkOrders = mergeSavedWorkOrders(nextWorkOrders, persistedCandidates);
        setWorkOrders(persistedWorkOrders);
        setPersistedWorkOrders(persistedWorkOrders);
        syncSelectedWorkOrderSaveState(persistedWorkOrders);
      }).catch((error) => {
        setSaveStatus("dirty");
        setToastMessage(error instanceof Error ? error.message : null);
      });
      setWorkOrders(nextWorkOrders);
      if (result.historyLogs?.length) {
        setHistoryLogs((prev) => [...result.historyLogs!, ...prev]);
      }
      if (result.toastMessage) {
        setToastMessage(result.toastMessage);
      }
    },
    [actionFlowText, currentUser, currentUser.name, getInventorySyncCandidates, historyText, repository, setHistoryLogs, setPersistedWorkOrders, setSaveStatus, setToastMessage, setWorkOrders, syncSelectedWorkOrderSaveState],
  );

  const handleUpdateSelectedWorkOrder = useCallback(
    async ({ workOrderId, patch, isReviewRequestLocked }: UpdateSelectedWorkOrderInput) => {
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
        const requestedOrderType = getOrderTypeFromWorkOrderKind(requestedKind);
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
      const nextHistoryLogs = result.historyLogs;
      const shouldPersistImmediately = (Object.keys(patch) as (keyof WorkOrder)[]).some(isImmediateDbField);

      setWorkOrders(nextWorkOrders);

      if (!shouldPersistImmediately) {
        setSaveStatus("dirty");
        return;
      }

      setSaveStatus("saving");

      try {
        const persistedWorkOrder = await persistWorkOrderWithHistory(repository, {
          workOrder: normalizedNextWorkOrder,
          historyLogs: nextHistoryLogs,
          auditActor: currentUser,
        });
        const persistedWorkOrders = replaceWorkOrderById(nextWorkOrders, workOrderId, persistedWorkOrder);
        setWorkOrders(persistedWorkOrders);
        setPersistedWorkOrders(persistedWorkOrders);
        syncSelectedWorkOrderSaveState(persistedWorkOrders);
        if (nextHistoryLogs?.length) {
          setHistoryLogs((prev) => [...nextHistoryLogs, ...prev]);
        }
      } catch (error) {
        setSaveStatus("dirty");
        throw error;
      }
    },
    [actionFlowText.orderInfoLockedToast, currentUser, currentUser.name, currentUser.role, historyText, repository, setHistoryLogs, setPersistedWorkOrders, setSaveStatus, setToastMessage, setWorkOrders, syncSelectedWorkOrderSaveState],
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
