"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";

import {
  canDeleteWorkOrder,
  useWorkOrderActions,
} from "@/lib/hooks/workorder/useWorkOrderActions";
import { useWorkOrderCoreState } from "@/lib/hooks/workorder/useWorkOrderCoreState";
import { useWorkOrderDerived } from "@/lib/hooks/workorder/useWorkOrderDerived";
import { useWorkOrderAttachments } from "@/lib/hooks/workorder/useWorkOrderAttachments";
import { useWorkOrderHistory } from "@/lib/hooks/workorder/useWorkOrderHistory";
import { useWorkOrderUIState } from "@/lib/hooks/workorder/useWorkOrderUIState";
import { useWorkOrderActionRuntime } from "@/lib/hooks/workorder/useWorkOrderActionRuntime";
import type { UserProfile, WorkOrder, WorkflowAction } from "@/types/workorder";
import { canEditManagerInWorkflow, DEFAULT_WORKFLOW_STATE, isWorkflowStateReviewLocked } from "@/lib/constants/workorderStates";
import type { WorkOrderListSort, WorkOrderListStatusFilter } from "@/lib/workorder/list/workOrderListControls";
import { useWorkOrderSessionProfile } from "@/lib/hooks/workorder/useWorkOrderSessionProfile";
import { ensureWorkOrderSessionProfile, mergeCurrentUserWithSessionProfile } from "@/lib/workorder/sessionUserProfile";


async function loadLatestWorkspaceUserProfiles(): Promise<UserProfile[]> {
  const response = await fetch("/api/admin/settings/users", {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("WORKSPACE_USER_PROFILES_LOAD_FAILED");
  }

  const result = (await response.json().catch(() => null)) as { users?: UserProfile[] } | null;
  return Array.isArray(result?.users) ? result.users : [];
}

type UseWorkOrderOptions = {
  initialWorkOrderId?: string | null;
  initialListStatusFilter?: WorkOrderListStatusFilter;
  initialListSort?: WorkOrderListSort;
  initialSearchQuery?: string;
};

export function useWorkOrder(options: UseWorkOrderOptions = {}) {
  const managerAssignOpenPendingRef = useRef(false);
  const uiState = useWorkOrderUIState();
  const actionRuntime = useWorkOrderActionRuntime();

  const coreState = useWorkOrderCoreState({
    initialWorkOrderId: options.initialWorkOrderId ?? null,
    initialListStatusFilter: options.initialListStatusFilter,
    initialListSort: options.initialListSort,
    initialSearchQuery: options.initialSearchQuery,
  });

  const sessionProfile = useWorkOrderSessionProfile();
  const effectiveCurrentUser = useMemo<UserProfile>(
    () => mergeCurrentUserWithSessionProfile(coreState.currentUser, sessionProfile),
    [coreState.currentUser, sessionProfile],
  );
  const effectiveCurrentUserId = sessionProfile?.id || coreState.currentUserId || "";

  useEffect(() => {
    if (!sessionProfile?.id) return;
    coreState.setUsers((current) => ensureWorkOrderSessionProfile(current, sessionProfile));
  }, [coreState.setUsers, sessionProfile]);

  const derivedState = useWorkOrderDerived({
    users: coreState.users,
    currentUser: effectiveCurrentUser,
    currentUserId: effectiveCurrentUserId,
    permissionTargetUserId: coreState.permissionTargetUserId,
    workOrders: coreState.workOrders,
    selectedWorkOrder: coreState.selectedWorkOrder,
    searchQuery: coreState.searchQuery,
    attachmentPreviewId: uiState.attachmentPreviewId,
  });

  const historyState = useWorkOrderHistory({
    historyLogs: coreState.historyLogs,
    selectedWorkOrderId: coreState.selectedWorkOrder.id,
    currentUser: effectiveCurrentUser,
    isAdmin: derivedState.isAdmin,
    workOrders: coreState.workOrders,
  });

  const actionState = useWorkOrderActions({
    currentUser: effectiveCurrentUser,
    canCreateWorkOrder: derivedState.canCreateWorkOrder,
    canReorderWorkOrder: derivedState.canReorderWorkOrder,
    pendingWorkflowAction: uiState.pendingWorkflowAction,
    workOrders: coreState.workOrders,
    persistedWorkOrders: coreState.persistedWorkOrders,
    selectedId: coreState.selectedId,
    setUsers: coreState.setUsers,
    setWorkOrders: coreState.setWorkOrders,
    setPersistedWorkOrders: coreState.setPersistedWorkOrders,
    setHistoryLogs: coreState.setHistoryLogs,
    setSelectedId: coreState.setSelectedId,
    setLastSavedAt: coreState.setLastSavedAt,
    setSaveStatus: coreState.setSaveStatus,
    setToastMessage: uiState.setToastMessage,
    setCreateWorkOrderModalOpen: uiState.setCreateWorkOrderModalOpen,
    setInventoryEditorOpen: uiState.setInventoryEditorOpen,
    setManagerAssignModalOpen: uiState.setManagerAssignModalOpen,
    setPendingWorkflowAction: uiState.setPendingWorkflowAction,
    setOrderRequestConfirmOpen: uiState.setOrderRequestConfirmOpen,
    setActionStatus: actionRuntime.setActionStatus,
    setActionError: actionRuntime.setActionError,
    setActionFailure: actionRuntime.setActionFailure,
  });

  useEffect(() => {
    if (coreState.workOrders.length === 0) {
      if (coreState.selectedId !== "") {
        coreState.setSelectedId("");
        coreState.setLastSavedAt(null);
        coreState.setSaveStatus("saved");
      }
      return;
    }

    if (coreState.selectedId === "") return;

    const selectedExists = coreState.workOrders.some((item) => item.id === coreState.selectedId);
    if (selectedExists) return;

    const firstWorkOrder = coreState.workOrders[0];
    if (!firstWorkOrder) return;

    coreState.setSelectedId(firstWorkOrder.id);
    coreState.setLastSavedAt(firstWorkOrder.lastSavedAt ?? null);
    coreState.setSaveStatus("saved");
  }, [
    coreState.selectedId,
    coreState.setLastSavedAt,
    coreState.setSaveStatus,
    coreState.setSelectedId,
    coreState.workOrders,
  ]);

  const handleSelectWorkOrder = useCallback(
    (id: string) => {
      if (coreState.selectedId === id) {
        coreState.setSelectedId("");
        coreState.setLastSavedAt(null);
        coreState.setSaveStatus("saved");
        return;
      }

      coreState.setSelectedId(id);
      const next = coreState.workOrders.find((item) => item.id === id);
      coreState.setLastSavedAt(next?.lastSavedAt ?? null);
      coreState.setSaveStatus("saved");
    },
    [
      coreState.selectedId,
      coreState.setLastSavedAt,
      coreState.setSaveStatus,
      coreState.setSelectedId,
      coreState.workOrders,
    ],
  );

  const handleOpenManagerAssignModal = useCallback(() => {
    if (uiState.managerAssignModalOpen || managerAssignOpenPendingRef.current) return;
    const reviewLocked = derivedState.isReviewRequestLocked ?? isWorkflowStateReviewLocked(derivedState.currentWorkflowState ?? DEFAULT_WORKFLOW_STATE, true);
    const canEditManager = canEditManagerInWorkflow(derivedState.currentWorkflowState ?? DEFAULT_WORKFLOW_STATE, reviewLocked);
    if (!derivedState.canChangeManager || !canEditManager) return;

    managerAssignOpenPendingRef.current = true;
    void loadLatestWorkspaceUserProfiles()
      .then((latestUsers) => {
        if (latestUsers.length > 0) coreState.setUsers(latestUsers);
      })
      .catch(() => undefined)
      .finally(() => {
        managerAssignOpenPendingRef.current = false;
        if (uiState.managerAssignModalOpen) return;
        actionState.handleOpenManagerAssignModal({
          canChangeManager: derivedState.canChangeManager,
          isReviewRequestLocked: derivedState.isReviewRequestLocked,
          currentWorkflowState: derivedState.currentWorkflowState,
        });
      });
  }, [
    actionState,
    coreState.setUsers,
    derivedState.canChangeManager,
    derivedState.currentWorkflowState,
    derivedState.isReviewRequestLocked,
    uiState.managerAssignModalOpen,
  ]);

  const attachmentState = useWorkOrderAttachments({
    attachmentInputRef: uiState.attachmentInputRef,
    canEditSideDraftContent: derivedState.canEditSideDraftContent,
    canUploadOfficialAttachments: derivedState.canUploadOfficialAttachments,
    canSeeAttachments: derivedState.canSeeAttachments,
    isReviewRequestLocked: derivedState.isReviewRequestLocked,
    currentUser: effectiveCurrentUser,
    selectedWorkOrder: coreState.selectedWorkOrder,
    attachmentPreviewId: uiState.attachmentPreviewId,
    setAttachmentPreviewId: uiState.setAttachmentPreviewId,
    setWorkOrders: coreState.setWorkOrders,
    setHistoryLogs: coreState.setHistoryLogs,
    setSaveStatus: coreState.setSaveStatus,
    setToastMessage: uiState.setToastMessage,
  });

  const ui = {
    appShellRef: uiState.appShellRef,
    attachmentInputRef: uiState.attachmentInputRef,
    drawerOpen: uiState.drawerOpen,
    setDrawerOpen: uiState.setDrawerOpen,
    basicInfoOpen: uiState.basicInfoOpen,
    setBasicInfoOpen: uiState.setBasicInfoOpen,
    materialOpen: uiState.materialOpen,
    setMaterialOpen: uiState.setMaterialOpen,
    outsourcingOpen: uiState.outsourcingOpen,
    setOutsourcingOpen: uiState.setOutsourcingOpen,
    inventoryEditorOpen: uiState.inventoryEditorOpen,
    setInventoryEditorOpen: uiState.setInventoryEditorOpen,
    permissionModalOpen: uiState.permissionModalOpen,
    setPermissionModalOpen: uiState.setPermissionModalOpen,
    createWorkOrderModalOpen: uiState.createWorkOrderModalOpen,
    setCreateWorkOrderModalOpen: uiState.setCreateWorkOrderModalOpen,
    managerAssignModalOpen: uiState.managerAssignModalOpen,
    setManagerAssignModalOpen: uiState.setManagerAssignModalOpen,
    inventoryLogModalOpen: uiState.inventoryLogModalOpen,
    setInventoryLogModalOpen: uiState.setInventoryLogModalOpen,
    attachmentPreviewId: uiState.attachmentPreviewId,
    setAttachmentPreviewId: uiState.setAttachmentPreviewId,
    orderRequestConfirmOpen: uiState.orderRequestConfirmOpen,
    pendingWorkflowAction: uiState.pendingWorkflowAction,
    toastMessage: uiState.toastMessage,
  };

  const runtime = {
    actionStatusMap: actionRuntime.actionStatusMap,
    actionFailureMap: actionRuntime.actionFailureMap,
    actionErrorMap: actionRuntime.actionErrorMap,
    activeActionKey: actionRuntime.activeActionKey,
    hasActionError: actionRuntime.hasActionError,
    latestActionFailure: actionRuntime.latestActionFailure,
    retryableActionKeys: actionRuntime.retryableActionKeys,
    clearActionError: actionRuntime.clearActionError,
  };

  const repository = {
    repositoryStatus: coreState.repositoryStatus,
    repositoryError: coreState.repositoryError,
    repositoryErrorMessage: coreState.repositoryError?.message ?? null,
  };

  const identity = {
    users: coreState.users,
    currentUserId: effectiveCurrentUserId,
    setCurrentUserId: coreState.setCurrentUserId,
    permissionTargetUserId: derivedState.permissionTargetUser?.id ?? coreState.users[0]?.id ?? "",
    setPermissionTargetUserId: coreState.setPermissionTargetUserId,
    currentUser: effectiveCurrentUser,
    currentRole: derivedState.currentRole,
    isAdmin: derivedState.isAdmin,
  };

  const history = {
    historyFilter: historyState.historyFilter,
    setHistoryFilter: historyState.setHistoryFilter,
    filteredHistoryLogs: historyState.filteredHistoryLogs,
    inventoryLogs: historyState.inventoryLogs,
  };

  const selection = {
    searchQuery: coreState.searchQuery,
    setSearchQuery: coreState.setSearchQuery,
    listStatusFilter: coreState.listStatusFilter,
    setListStatusFilter: coreState.setListStatusFilter,
    listSort: coreState.listSort,
    setListSort: coreState.setListSort,
    workOrders: derivedState.workOrders,
    hasVisibleWorkOrders: derivedState.hasVisibleWorkOrders,
    hasActiveSelection: derivedState.hasActiveSelection,
    workflowStateById: derivedState.workflowStateById,
    selectedId: coreState.selectedId,
    selectedWorkOrder: coreState.selectedWorkOrder,
    isSelectedWorkOrderDetailLoading: coreState.isSelectedWorkOrderDetailLoading,
    currentWorkflowState: derivedState.currentWorkflowState,
    currentDisplayStage: derivedState.currentDisplayStage,
    currentInventoryQuantity: derivedState.currentInventoryQuantity,
  };

  const permissions = {
    canCreateWorkOrder: derivedState.canCreateWorkOrder,
    canEditSideDraftContent: derivedState.canEditSideDraftContent,
    canUploadOfficialAttachments: derivedState.canUploadOfficialAttachments,
    canRenameTitle: derivedState.canRenameTitle,
    canSeeAttachments: derivedState.canSeeAttachments,
    isReviewRequestLocked: derivedState.isReviewRequestLocked,
    canChangeManager: derivedState.canChangeManager,
    canSeeProductionSections: derivedState.canSeeProductionSections,
    canSeeCostSections: derivedState.canSeeCostSections,
    canEditInventory: derivedState.canEditInventory,
    canOpenInventoryEditor: derivedState.canOpenInventoryEditor,
    canSeeInventoryHistorySection: derivedState.canSeeInventoryHistorySection,
  };

  const attachments = {
    attachmentInputAccept: attachmentState.attachmentInputAccept,
    designAttachments: derivedState.designAttachments,
    officialAttachments: derivedState.officialAttachments,
    selectedAttachment: derivedState.selectedAttachment,
    canDeleteAttachment: attachmentState.canDeleteAttachment,
    getAttachmentPermissions: attachmentState.getAttachmentPermissions,
    handleOpenAttachmentPicker: attachmentState.handleOpenAttachmentPicker,
    handleAttachmentFiles: attachmentState.handleAttachmentFiles,
    handleAttachmentFileDrop: attachmentState.handleAttachmentFileDrop,
    handleDeleteAttachment: attachmentState.handleDeleteAttachment,
    handleSetPrimaryDesignAttachment: attachmentState.handleSetPrimaryDesignAttachment,
  };

  const production = {
    materials: derivedState.materials,
    outsourcing: derivedState.outsourcing,
  };

  const cost = {
    fabricTotal: derivedState.fabricTotal,
    subsidiaryTotal: derivedState.subsidiaryTotal,
    outsourcingTotal: derivedState.outsourcingTotal,
    totalCost: derivedState.totalCost,
    unitCost: derivedState.unitCost,
  };

  const persistence = {
    saveStatus: coreState.saveStatus,
    lastSavedAt: coreState.lastSavedAt,
  };

  const workflow = {
    availableActions: derivedState.availableActions,
    visibleStages: derivedState.visibleStages,
  };

  const actions = {
    handleSave: (workOrderOverride?: WorkOrder) =>
      actionState.handleSave(workOrderOverride ?? coreState.selectedWorkOrder, coreState.workOrders),
    handleSelectWorkOrder,
    canDeleteWorkOrder,
    handleCreateWorkOrder: (payload?: {
      title: string;
      category1: string;
      category2: string;
      category3: string;
      category1Id?: string | null;
      category2Id?: string | null;
      category3Id?: string | null;
      season?: string;
    }) =>
      actionState.handleCreateWorkOrder({
        nextIndex: coreState.workOrders.length + 1,
        ...(payload ?? {}),
      }),
    handleReorderWorkOrder: (workOrderId: string) =>
      actionState.handleReorderWorkOrder(coreState.workOrders, workOrderId),
    handleReworkWorkOrder: (workOrderId: string) =>
      actionState.handleReworkWorkOrder(coreState.workOrders, workOrderId),
    handleDeleteWorkOrder: (workOrderId: string) =>
      actionState.handleDeleteWorkOrder({
        workOrderId,
        workOrders: coreState.workOrders,
        selectedId: coreState.selectedId,
      }),
    handleWorkflowAction: (action: WorkflowAction, workOrderOverride?: WorkOrder) =>
      actionState.handleWorkflowAction(workOrderOverride ?? coreState.selectedWorkOrder, action),
    handleUpdateSelectedWorkOrder: (patch: Partial<WorkOrder>) =>
      actionState.handleUpdateSelectedWorkOrder({
        workOrderId: coreState.selectedWorkOrder.id,
        patch,
        isReviewRequestLocked: derivedState.isReviewRequestLocked,
      }),
    handleRenameWorkOrderTitle: (nextTitle: string) =>
      actionState.handleRenameWorkOrderTitle({
        workOrders: coreState.workOrders,
        workOrder: coreState.selectedWorkOrder,
        nextTitle,
      }),
    handleConfirmOrderRequest: (payload: { factoryName: string; quantity: number; requestNote?: string | null }) =>
      actionState.handleConfirmOrderRequest(coreState.selectedWorkOrder, payload),
    handleCloseOrderRequestConfirm: actionState.handleCloseOrderRequestConfirm,
    handleGenerateOrderRequestPdf: actionState.handleGenerateOrderRequestPdf,
    workflowValidationModal: actionState.workflowValidationModal,
    rejectReviewReasonModal: actionState.rejectReviewReasonModal,
    handleInventoryApply: (payload: {
      inboundQuantity: number;
      adjustmentQuantity: number;
      deductionQuantity: number;
      memo: string;
    }) => actionState.handleInventoryApply(coreState.selectedWorkOrder.id, payload),
    handleCompleteInspection: (payload: {
      orderEntryId: string;
      inboundQuantity: number;
      nextInventoryQuantity: number;
      memo: string;
    }) =>
      actionState.handleCompleteInspection({
        workOrderId: coreState.selectedWorkOrder.id,
        ...payload,
      }),
    handleApplyRoles: actionState.handleApplyRoles,
    handleOpenManagerAssignModal,
    handleCloseManagerAssignModal: actionState.handleCloseManagerAssignModal,
    handleChangeManager: (managerId: string) =>
      actionState.handleChangeManager({
        workOrder: coreState.selectedWorkOrder,
        managerId,
        users: coreState.users,
        canChangeManager: derivedState.canChangeManager,
        isReviewRequestLocked: derivedState.isReviewRequestLocked,
        currentWorkflowState: derivedState.currentWorkflowState,
      }),
  };

  return {
    ui,
    runtime,
    repository,
    identity,
    history,
    selection,
    permissions,
    attachments,
    production,
    cost,
    persistence,
    workflow,
    actions,

    appShellRef: ui.appShellRef,
    attachmentInputRef: ui.attachmentInputRef,
    attachmentInputAccept: attachments.attachmentInputAccept,
    drawerOpen: ui.drawerOpen,
    setDrawerOpen: ui.setDrawerOpen,
    basicInfoOpen: ui.basicInfoOpen,
    setBasicInfoOpen: ui.setBasicInfoOpen,
    materialOpen: ui.materialOpen,
    setMaterialOpen: ui.setMaterialOpen,
    outsourcingOpen: ui.outsourcingOpen,
    setOutsourcingOpen: ui.setOutsourcingOpen,
    inventoryEditorOpen: ui.inventoryEditorOpen,
    setInventoryEditorOpen: ui.setInventoryEditorOpen,
    permissionModalOpen: ui.permissionModalOpen,
    setPermissionModalOpen: ui.setPermissionModalOpen,
    createWorkOrderModalOpen: ui.createWorkOrderModalOpen,
    setCreateWorkOrderModalOpen: ui.setCreateWorkOrderModalOpen,
    managerAssignModalOpen: ui.managerAssignModalOpen,
    setManagerAssignModalOpen: ui.setManagerAssignModalOpen,
    inventoryLogModalOpen: ui.inventoryLogModalOpen,
    setInventoryLogModalOpen: ui.setInventoryLogModalOpen,
    attachmentPreviewId: ui.attachmentPreviewId,
    setAttachmentPreviewId: ui.setAttachmentPreviewId,
    orderRequestConfirmOpen: ui.orderRequestConfirmOpen,
    pendingWorkflowAction: ui.pendingWorkflowAction,
    toastMessage: ui.toastMessage,
    actionStatusMap: runtime.actionStatusMap,
    actionFailureMap: runtime.actionFailureMap,
    actionErrorMap: runtime.actionErrorMap,
    activeActionKey: runtime.activeActionKey,
    hasActionError: runtime.hasActionError,
    latestActionFailure: runtime.latestActionFailure,
    retryableActionKeys: runtime.retryableActionKeys,
    clearActionError: runtime.clearActionError,
    repositoryStatus: repository.repositoryStatus,
    repositoryError: repository.repositoryError,
    repositoryErrorMessage: repository.repositoryErrorMessage,
    users: identity.users,
    currentUserId: identity.currentUserId,
    setCurrentUserId: identity.setCurrentUserId,
    permissionTargetUserId: identity.permissionTargetUserId,
    setPermissionTargetUserId: identity.setPermissionTargetUserId,
    historyFilter: history.historyFilter,
    setHistoryFilter: history.setHistoryFilter,
    searchQuery: selection.searchQuery,
    setSearchQuery: selection.setSearchQuery,
    workOrders: selection.workOrders,
    hasVisibleWorkOrders: selection.hasVisibleWorkOrders,
    hasActiveSelection: selection.hasActiveSelection,
    workflowStateById: selection.workflowStateById,
    selectedId: selection.selectedId,
    selectedWorkOrder: selection.selectedWorkOrder,
    isSelectedWorkOrderDetailLoading: selection.isSelectedWorkOrderDetailLoading,
    currentWorkflowState: selection.currentWorkflowState,
    currentUser: identity.currentUser,
    currentRole: identity.currentRole,
    isAdmin: identity.isAdmin,
    canCreateWorkOrder: permissions.canCreateWorkOrder,
    canEditSideDraftContent: permissions.canEditSideDraftContent,
    canUploadOfficialAttachments: permissions.canUploadOfficialAttachments,
    canRenameTitle: permissions.canRenameTitle,
    canSeeAttachments: permissions.canSeeAttachments,
    isReviewRequestLocked: permissions.isReviewRequestLocked,
    canChangeManager: permissions.canChangeManager,
    canSeeProductionSections: permissions.canSeeProductionSections,
    canSeeCostSections: permissions.canSeeCostSections,
    canEditInventory: permissions.canEditInventory,
    canOpenInventoryEditor: permissions.canOpenInventoryEditor,
    canSeeInventoryHistorySection: permissions.canSeeInventoryHistorySection,
    currentDisplayStage: selection.currentDisplayStage,
    currentInventoryQuantity: selection.currentInventoryQuantity,
    filteredHistoryLogs: history.filteredHistoryLogs,
    inventoryLogs: history.inventoryLogs,
    designAttachments: attachments.designAttachments,
    officialAttachments: attachments.officialAttachments,
    selectedAttachment: attachments.selectedAttachment,
    canDeleteAttachment: attachments.canDeleteAttachment,
    getAttachmentPermissions: attachments.getAttachmentPermissions,
    materials: production.materials,
    outsourcing: production.outsourcing,
    fabricTotal: cost.fabricTotal,
    subsidiaryTotal: cost.subsidiaryTotal,
    outsourcingTotal: cost.outsourcingTotal,
    totalCost: cost.totalCost,
    unitCost: cost.unitCost,
    saveStatus: persistence.saveStatus,
    lastSavedAt: persistence.lastSavedAt,
    availableActions: workflow.availableActions,
    visibleStages: workflow.visibleStages,
    handleSave: actions.handleSave,
    handleSelectWorkOrder: actions.handleSelectWorkOrder,
    canDeleteWorkOrder: actions.canDeleteWorkOrder,
    handleCreateWorkOrder: actions.handleCreateWorkOrder,
    handleReorderWorkOrder: actions.handleReorderWorkOrder,
    handleReworkWorkOrder: actions.handleReworkWorkOrder,
    handleDeleteWorkOrder: actions.handleDeleteWorkOrder,
    handleWorkflowAction: actions.handleWorkflowAction,
    handleUpdateSelectedWorkOrder: actions.handleUpdateSelectedWorkOrder,
    handleRenameWorkOrderTitle: actions.handleRenameWorkOrderTitle,
    handleConfirmOrderRequest: actions.handleConfirmOrderRequest,
    handleCloseOrderRequestConfirm: actions.handleCloseOrderRequestConfirm,
    handleGenerateOrderRequestPdf: actions.handleGenerateOrderRequestPdf,
    workflowValidationModal: actions.workflowValidationModal,
    rejectReviewReasonModal: actions.rejectReviewReasonModal,
    handleInventoryApply: actions.handleInventoryApply,
    handleCompleteInspection: actions.handleCompleteInspection,
    handleApplyRoles: actions.handleApplyRoles,
    handleOpenManagerAssignModal: actions.handleOpenManagerAssignModal,
    handleCloseManagerAssignModal: actions.handleCloseManagerAssignModal,
    handleChangeManager: actions.handleChangeManager,
    handleOpenAttachmentPicker: attachments.handleOpenAttachmentPicker,
    handleAttachmentFiles: attachments.handleAttachmentFiles,
    handleDeleteAttachment: attachments.handleDeleteAttachment,
    handleSetPrimaryDesignAttachment: attachments.handleSetPrimaryDesignAttachment,
  };
}
