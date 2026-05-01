"use client";

import { useMemo, useState } from "react";
import WorkOrderLayout from "@/components/workorder/WorkOrderLayout";
import WorkOrderOverlay from "@/components/workorder/WorkOrderOverlay";
import { useWorkOrder } from "@/lib/hooks/useWorkOrder";
import { useDbConnectionStatus } from "@/lib/hooks/workorder/useDbConnectionStatus";
import { getPendingAttachmentDelete } from "@/lib/workorder/presentation/workOrderWorkspacePresentation";
import { useI18n } from "@/lib/i18n";
import { buildWorkspaceViewModel } from "@/lib/workorder/workspace/buildWorkspaceViewModel";

type WorkOrderWorkspaceProps = {
  initialWorkOrderId?: string | null;
};

export default function WorkOrderWorkspace({ initialWorkOrderId = null }: WorkOrderWorkspaceProps) {
  const { i18n } = useI18n();
  const {
    appShellRef,
    attachmentInputRef,
    attachmentInputAccept,
    drawerOpen,
    setDrawerOpen,
    basicInfoOpen,
    setBasicInfoOpen,
    materialOpen,
    setMaterialOpen,
    outsourcingOpen,
    setOutsourcingOpen,
    inventoryEditorOpen,
    setInventoryEditorOpen,
    permissionModalOpen,
    setPermissionModalOpen,
    createWorkOrderModalOpen,
    setCreateWorkOrderModalOpen,
    managerAssignModalOpen,
    inventoryLogModalOpen,
    setInventoryLogModalOpen,
    attachmentPreviewId,
    setAttachmentPreviewId,
    orderRequestConfirmOpen,
    toastMessage,
    users,
    currentUserId,
    setCurrentUserId,
    permissionTargetUserId,
    setPermissionTargetUserId,
    historyFilter,
    setHistoryFilter,
    searchQuery,
    setSearchQuery,
    workOrders,
    hasVisibleWorkOrders,
    hasActiveSelection,
    workflowStateById,
    selectedId,
    selectedWorkOrder,
    currentWorkflowState,
    currentUser,
    currentRole,
    isAdmin,
    canCreateWorkOrder,
    canEditSideDraftContent,
    canUploadOfficialAttachments,
    canEditMemo,
    canRenameTitle,
    isReviewRequestLocked,
    canChangeManager,
    canSeeProductionSections,
    canSeeCostSections,
    canOpenInventoryEditor,
    currentDisplayStage,
    currentInventoryQuantity,
    filteredHistoryLogs,
    inventoryLogs,
    designAttachments,
    officialAttachments,
    selectedAttachment,
    getAttachmentPermissions,
    fabricTotal,
    subsidiaryTotal,
    outsourcingTotal,
    totalCost,
    unitCost,
    saveStatus,
    lastSavedAt,
    availableActions,
    visibleStages,
    handleSave,
    handleSelectWorkOrder,
    canDeleteWorkOrder,
    handleCreateWorkOrder,
    handleDeleteWorkOrder,
    handleReorderWorkOrder,
    handleReworkWorkOrder,
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
    handleOpenAttachmentPicker,
    handleAttachmentFiles,
    handleDeleteAttachment,
    handleSetPrimaryDesignAttachment,
    handleCreateMemoThread,
    handleCreateMemoReply,
    handleUpdateMemoThread,
    handleDeleteMemoThread,
    handleUpdateMemoReply,
    handleDeleteMemoReply,
    canSeeAttachments,
  } = useWorkOrder({ initialWorkOrderId });

  const dbConnectionStatus = useDbConnectionStatus();
  const [pendingAttachmentDeleteId, setPendingAttachmentDeleteId] = useState<string | null>(null);
  const renderHasSelection = hasVisibleWorkOrders && hasActiveSelection;

  const pendingAttachmentDelete = useMemo(
    () => getPendingAttachmentDelete(renderHasSelection ? selectedWorkOrder.attachments : [], pendingAttachmentDeleteId),
    [pendingAttachmentDeleteId, renderHasSelection, selectedWorkOrder.attachments],
  );

  const handleRequestDeleteAttachment = (attachmentId: string) => {
    setPendingAttachmentDeleteId(attachmentId);
  };

  const handleCloseDeleteAttachmentConfirm = () => {
    setPendingAttachmentDeleteId(null);
  };

  const handleConfirmDeleteAttachment = () => {
    if (!pendingAttachmentDeleteId) return;
    handleDeleteAttachment(pendingAttachmentDeleteId);
    setPendingAttachmentDeleteId(null);
  };

  const viewModel = buildWorkspaceViewModel({
    drawerOpen,
    basicInfoOpen,
    materialOpen,
    outsourcingOpen,
    inventoryEditorOpen,
    permissionModalOpen,
    createWorkOrderModalOpen,
    managerAssignModalOpen,
    inventoryLogModalOpen,
    orderRequestConfirmOpen,
    users,
    currentUserId,
    permissionTargetUserId,
    historyFilter,
    searchQuery,
    workOrders,
    hasVisibleWorkOrders: renderHasSelection,
    workflowStateById,
    selectedId,
    selectedWorkOrder,
    currentWorkflowState,
    currentUser,
    currentRole,
    isAdmin,
    canCreateWorkOrder,
    canSeeAttachments,
    canEditSideDraftContent,
    canUploadOfficialAttachments,
    canEditMemo,
    canRenameTitle,
    isReviewRequestLocked,
    canChangeManager,
    canSeeProductionSections,
    canSeeCostSections,
    canOpenInventoryEditor,
    currentDisplayStage,
    currentInventoryQuantity,
    filteredHistoryLogs,
    inventoryLogs,
    designAttachments,
    officialAttachments,
    selectedAttachment,
    fabricTotal,
    subsidiaryTotal,
    outsourcingTotal,
    totalCost,
    unitCost,
    saveStatus,
    lastSavedAt,
    availableActions,
    visibleStages,
    pendingAttachmentDelete,
    canDeleteWorkOrder,
    getAttachmentPermissions,
    i18n,
    onSetDrawerOpen: setDrawerOpen,
    onSetBasicInfoOpen: setBasicInfoOpen,
    onSetMaterialOpen: setMaterialOpen,
    onSetOutsourcingOpen: setOutsourcingOpen,
    onSetInventoryEditorOpen: setInventoryEditorOpen,
    onSetPermissionModalOpen: setPermissionModalOpen,
    onSetCreateWorkOrderModalOpen: setCreateWorkOrderModalOpen,
    onSetInventoryLogModalOpen: setInventoryLogModalOpen,
    onSetAttachmentPreviewId: setAttachmentPreviewId,
    onSetPermissionTargetUserId: setPermissionTargetUserId,
    onSetCurrentUserId: setCurrentUserId,
    onSetSearchQuery: setSearchQuery,
    dbConnectionStatus,
    onSetHistoryFilter: setHistoryFilter,
    onSave: handleSave,
    onSelectWorkOrder: handleSelectWorkOrder,
    onCreateWorkOrder: handleCreateWorkOrder,
    onDeleteWorkOrder: handleDeleteWorkOrder,
    onReorderWorkOrder: handleReorderWorkOrder,
    onReworkWorkOrder: handleReworkWorkOrder,
    onWorkflowAction: handleWorkflowAction,
    onUpdateSelectedWorkOrder: handleUpdateSelectedWorkOrder,
    onRenameWorkOrderTitle: handleRenameWorkOrderTitle,
    onConfirmOrderRequest: handleConfirmOrderRequest,
    onCloseOrderRequestConfirm: handleCloseOrderRequestConfirm,
    onInventoryApply: handleInventoryApply,
    onCompleteInspection: handleCompleteInspection,
    onApplyRoles: handleApplyRoles,
    onOpenManagerAssignModal: handleOpenManagerAssignModal,
    onCloseManagerAssignModal: handleCloseManagerAssignModal,
    onChangeManager: handleChangeManager,
    onOpenAttachmentPicker: handleOpenAttachmentPicker,
    onRequestDeleteAttachment: handleRequestDeleteAttachment,
    onSetPrimaryDesignAttachment: handleSetPrimaryDesignAttachment,
    onAttachmentDeleteConfirmClose: handleCloseDeleteAttachmentConfirm,
    onAttachmentDeleteConfirm: handleConfirmDeleteAttachment,
    onCreateMemoThread: handleCreateMemoThread,
    onCreateMemoReply: handleCreateMemoReply,
    onUpdateMemoThread: handleUpdateMemoThread,
    onDeleteMemoThread: handleDeleteMemoThread,
    onUpdateMemoReply: handleUpdateMemoReply,
    onDeleteMemoReply: handleDeleteMemoReply,
  });

  return (
    <>
      <WorkOrderLayout
        appShellRef={appShellRef}
        selectedId={renderHasSelection ? selectedId : ""}
        hasSelection={renderHasSelection}
        sidebarListProps={viewModel.sidebarListProps}
        detailProps={viewModel.detailProps}
        sidePanelProps={viewModel.sidePanelProps}
        mobileTopBarProps={viewModel.mobileTopBarProps}
        mobileDrawerProps={viewModel.mobileDrawerProps}
      />
      <WorkOrderOverlay
        attachmentInputRef={attachmentInputRef}
        attachmentInputAccept={attachmentInputAccept}
        onAttachmentFilesChange={handleAttachmentFiles}
        toastMessage={toastMessage}
        modalProps={viewModel.modalProps}
      />
    </>
  );
}
