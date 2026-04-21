"use client";

import { useCallback, useEffect } from "react";
import { canDeleteWorkOrder, useWorkOrderActions } from "@/lib/hooks/workorder/useWorkOrderActions";
import { useWorkOrderCoreState } from "@/lib/hooks/workorder/useWorkOrderCoreState";
import { useWorkOrderDerived } from "@/lib/hooks/workorder/useWorkOrderDerived";
import { useWorkOrderAttachments } from "@/lib/hooks/workorder/useWorkOrderAttachments";
import { useWorkOrderHistory } from "@/lib/hooks/workorder/useWorkOrderHistory";
import { useWorkOrderUIState } from "@/lib/hooks/workorder/useWorkOrderUIState";
import { useWorkOrderActionRuntime } from "@/lib/hooks/workorder/useWorkOrderActionRuntime";
import type { WorkOrder, WorkflowAction } from "@/types/workorder";

export function useWorkOrder() {
  const uiState = useWorkOrderUIState();
  const actionRuntime = useWorkOrderActionRuntime();

  const coreState = useWorkOrderCoreState();
  const derivedState = useWorkOrderDerived({
    users: coreState.users,
    currentUser: coreState.currentUser,
    currentUserId: coreState.currentUserId,
    permissionTargetUserId: coreState.permissionTargetUserId,
    workOrders: coreState.workOrders,
    selectedWorkOrder: coreState.selectedWorkOrder,
    searchQuery: coreState.searchQuery,
    attachmentPreviewId: uiState.attachmentPreviewId,
  });

  const historyState = useWorkOrderHistory({
    historyLogs: coreState.historyLogs,
    selectedWorkOrderId: coreState.selectedWorkOrder.id,
    currentUser: coreState.currentUser,
    isAdmin: derivedState.isAdmin,
    workOrders: coreState.workOrders,
  });

  const actionState = useWorkOrderActions({
    currentUser: coreState.currentUser,
    canCreateWorkOrder: derivedState.canCreateWorkOrder,
    canReorderWorkOrder: derivedState.canReorderWorkOrder,
    pendingWorkflowAction: uiState.pendingWorkflowAction,
    workOrders: coreState.workOrders,
    setUsers: coreState.setUsers,
    setWorkOrders: coreState.setWorkOrders,
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
    if (derivedState.workOrders.length === 0) {
      if (coreState.selectedId !== "") {
        coreState.setSelectedId("");
        coreState.setLastSavedAt(null);
        coreState.setSaveStatus("saved");
      }
      return;
    }
    const selectedVisible = derivedState.workOrders.some((item) => item.id === coreState.selectedId);
    if (selectedVisible) return;

    const nextSelectedId = derivedState.workOrders[0]?.id;
    if (!nextSelectedId) return;
    const nextSelectedWorkOrder = coreState.workOrders.find((item) => item.id === nextSelectedId);

    coreState.setSelectedId(nextSelectedId);
    coreState.setLastSavedAt(nextSelectedWorkOrder?.lastSavedAt ?? null);
    coreState.setSaveStatus("saved");
  }, [
    coreState.selectedId,
    coreState.setLastSavedAt,
    coreState.setSaveStatus,
    coreState.setSelectedId,
    coreState.workOrders,
    derivedState.workOrders,
  ]);



  const handleSelectWorkOrder = useCallback(
    (id: string) => {
      coreState.setSelectedId(id);
      const next = coreState.workOrders.find((item) => item.id === id);
      coreState.setLastSavedAt(next?.lastSavedAt ?? null);
      coreState.setSaveStatus("saved");
    },
    [coreState.setLastSavedAt, coreState.setSaveStatus, coreState.setSelectedId, coreState.workOrders],
  );

  const handleOpenManagerAssignModal = useCallback(() => {
    actionState.handleOpenManagerAssignModal({
      canChangeManager: derivedState.canChangeManager,
      isReviewRequestLocked: derivedState.isReviewRequestLocked,
      currentWorkflowState: derivedState.currentWorkflowState,
    });
  }, [actionState, derivedState.canChangeManager, derivedState.currentWorkflowState, derivedState.isReviewRequestLocked]);

  const attachmentState = useWorkOrderAttachments({
    attachmentInputRef: uiState.attachmentInputRef,
    canUploadOfficialAttachments: derivedState.canUploadOfficialAttachments,
    isReviewRequestLocked: derivedState.isReviewRequestLocked,
    currentUser: coreState.currentUser,
    selectedWorkOrder: coreState.selectedWorkOrder,
    attachmentPreviewId: uiState.attachmentPreviewId,
    setAttachmentPreviewId: uiState.setAttachmentPreviewId,
    setWorkOrders: coreState.setWorkOrders,
    setHistoryLogs: coreState.setHistoryLogs,
    setSaveStatus: coreState.setSaveStatus,
    setToastMessage: uiState.setToastMessage,
  });

  return {
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
    actionStatusMap: actionRuntime.actionStatusMap,
    actionFailureMap: actionRuntime.actionFailureMap,
    actionErrorMap: actionRuntime.actionErrorMap,
    activeActionKey: actionRuntime.activeActionKey,
    hasActionError: actionRuntime.hasActionError,
    latestActionFailure: actionRuntime.latestActionFailure,
    retryableActionKeys: actionRuntime.retryableActionKeys,
    clearActionError: actionRuntime.clearActionError,
    repositoryStatus: coreState.repositoryStatus,
    repositoryError: coreState.repositoryError,
    repositoryErrorMessage: coreState.repositoryError?.message ?? null,
    users: coreState.users,
    currentUserId: coreState.currentUserId,
    setCurrentUserId: coreState.setCurrentUserId,
    permissionTargetUserId: derivedState.permissionTargetUser?.id ?? coreState.users[0]?.id ?? "",
    setPermissionTargetUserId: coreState.setPermissionTargetUserId,
    historyFilter: historyState.historyFilter,
    setHistoryFilter: historyState.setHistoryFilter,
    searchQuery: coreState.searchQuery,
    setSearchQuery: coreState.setSearchQuery,
    workOrders: derivedState.workOrders,
    hasVisibleWorkOrders: derivedState.hasVisibleWorkOrders,
    hasActiveSelection: derivedState.hasActiveSelection,
    workflowStateById: derivedState.workflowStateById,
    selectedId: coreState.selectedId,
    selectedWorkOrder: coreState.selectedWorkOrder,
    currentWorkflowState: derivedState.currentWorkflowState,
    currentUser: coreState.currentUser,
    currentRole: derivedState.currentRole,
    isAdmin: derivedState.isAdmin,
    canCreateWorkOrder: derivedState.canCreateWorkOrder,
    canUploadOfficialAttachments: derivedState.canUploadOfficialAttachments,
    isReviewRequestLocked: derivedState.isReviewRequestLocked,
    canChangeManager: derivedState.canChangeManager,
    canSeeProductionSections: derivedState.canSeeProductionSections,
    canSeeCostSections: derivedState.canSeeCostSections,
    canEditInventory: derivedState.canEditInventory,
    canOpenInventoryEditor: derivedState.canOpenInventoryEditor,
    canSeeInventoryHistorySection: derivedState.canSeeInventoryHistorySection,
    canSeeAttachments: derivedState.canSeeAttachments,
    currentDisplayStage: derivedState.currentDisplayStage,
    currentInventoryQuantity: derivedState.currentInventoryQuantity,
    filteredHistoryLogs: historyState.filteredHistoryLogs,
    inventoryLogs: historyState.inventoryLogs,
    officialAttachments: derivedState.officialAttachments,
    selectedAttachment: derivedState.selectedAttachment,
    canDeleteAttachment: attachmentState.canDeleteAttachment,
    materials: derivedState.materials,
    outsourcing: derivedState.outsourcing,
    fabricTotal: derivedState.fabricTotal,
    subsidiaryTotal: derivedState.subsidiaryTotal,
    outsourcingTotal: derivedState.outsourcingTotal,
    totalCost: derivedState.totalCost,
    unitCost: derivedState.unitCost,
    saveStatus: coreState.saveStatus,
    lastSavedAt: coreState.lastSavedAt,
    availableActions: derivedState.availableActions,
    visibleStages: derivedState.visibleStages,
    handleSave: () => actionState.handleSave(coreState.selectedWorkOrder, coreState.workOrders),
    handleSelectWorkOrder,
    canDeleteWorkOrder,
    handleCreateWorkOrder: (payload?: { title: string; category1: string; category2: string; category3: string; season: string }) =>
      actionState.handleCreateWorkOrder({ nextIndex: coreState.workOrders.length + 1, ...(payload ?? {}) }),
    handleReorderWorkOrder: (workOrderId: string) => actionState.handleReorderWorkOrder(coreState.workOrders, workOrderId),
    handleReworkWorkOrder: (workOrderId: string) => actionState.handleReworkWorkOrder(coreState.workOrders, workOrderId),
    handleDeleteWorkOrder: (workOrderId: string) =>
      actionState.handleDeleteWorkOrder({
        workOrderId,
        workOrders: coreState.workOrders,
        selectedId: coreState.selectedId,
      }),
    handleWorkflowAction: (action: WorkflowAction) => actionState.handleWorkflowAction(coreState.selectedWorkOrder, action),
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
    handleConfirmOrderRequest: (payload: { factoryName: string; quantity: number }) => actionState.handleConfirmOrderRequest(coreState.selectedWorkOrder, payload),
    handleCloseOrderRequestConfirm: actionState.handleCloseOrderRequestConfirm,
    handleInventoryApply: (payload: { inboundQuantity: number; adjustmentQuantity: number; deductionQuantity: number; memo: string }) =>
      actionState.handleInventoryApply(coreState.selectedWorkOrder.id, payload),
    handleCompleteInspection: (payload: { orderEntryId: string; inboundQuantity: number; nextInventoryQuantity: number; memo: string }) =>
      actionState.handleCompleteInspection({ workOrderId: coreState.selectedWorkOrder.id, ...payload }),
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
    handleOpenAttachmentPicker: attachmentState.handleOpenAttachmentPicker,
    handleAttachmentFiles: attachmentState.handleAttachmentFiles,
    handleDeleteAttachment: attachmentState.handleDeleteAttachment,
    handleCreateMemoThread: attachmentState.handleCreateMemoThread,
    handleCreateMemoReply: attachmentState.handleCreateMemoReply,
    handlePromoteMemoAttachment: attachmentState.handlePromoteMemoAttachment,
  };
}
