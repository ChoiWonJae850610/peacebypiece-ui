"use client";

import { useMemo, useState } from "react";
import WorkOrderLayout from "@/components/workorder/WorkOrderLayout";
import WorkOrderOverlay from "@/components/workorder/WorkOrderOverlay";
import { useWorkOrder } from "@/lib/hooks/useWorkOrder";
import { buildWorkspaceViewModel } from "@/lib/workorder/workspace/buildWorkspaceViewModel";

export default function WorkOrderWorkspace() {
  const {
    appShellRef,
    attachmentInputRef,
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
    adminPanelModalOpen,
    setAdminPanelModalOpen,
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
    notificationSettings,
    handleToggleNotificationSetting,
    searchQuery,
    setSearchQuery,
    workOrders,
    workflowStateById,
    selectedId,
    selectedWorkOrder,
    currentWorkflowState,
    currentUser,
    currentRole,
    isAdmin,
    canCreateWorkOrder,
    canUploadOfficialAttachments,
    isReviewRequestLocked,
    canChangeManager,
    canSeeProductionSections,
    canSeeCostSections,
    canOpenInventoryEditor,
    currentDisplayStage,
    currentInventoryQuantity,
    filteredHistoryLogs,
    inventoryLogs,
    officialAttachments,
    selectedAttachment,
    canDeleteAttachment,
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
    handleCreateMemoThread,
    handleCreateMemoReply,
    handlePromoteMemoAttachment,
    canSeeAttachments,
  } = useWorkOrder();

  const [pendingAttachmentDeleteId, setPendingAttachmentDeleteId] = useState<string | null>(null);
  const pendingAttachmentDelete = useMemo(
    () => selectedWorkOrder.attachments.find((item) => item.id === pendingAttachmentDeleteId) ?? null,
    [selectedWorkOrder.attachments, pendingAttachmentDeleteId],
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
    adminPanelModalOpen,
    managerAssignModalOpen,
    inventoryLogModalOpen,
    orderRequestConfirmOpen,
    users,
    currentUserId,
    permissionTargetUserId,
    historyFilter,
    notificationSettings,
    searchQuery,
    workOrders,
    workflowStateById,
    selectedId,
    selectedWorkOrder,
    currentWorkflowState,
    currentUser,
    currentRole,
    isAdmin,
    canCreateWorkOrder,
    canSeeAttachments,
    canUploadOfficialAttachments,
    isReviewRequestLocked,
    canChangeManager,
    canSeeProductionSections,
    canSeeCostSections,
    canOpenInventoryEditor,
    currentDisplayStage,
    currentInventoryQuantity,
    filteredHistoryLogs,
    inventoryLogs,
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
    canDeleteAttachment,
    onSetDrawerOpen: setDrawerOpen,
    onSetBasicInfoOpen: setBasicInfoOpen,
    onSetMaterialOpen: setMaterialOpen,
    onSetOutsourcingOpen: setOutsourcingOpen,
    onSetInventoryEditorOpen: setInventoryEditorOpen,
    onSetPermissionModalOpen: setPermissionModalOpen,
    onSetCreateWorkOrderModalOpen: setCreateWorkOrderModalOpen,
    onSetAdminPanelModalOpen: setAdminPanelModalOpen,
    onSetInventoryLogModalOpen: setInventoryLogModalOpen,
    onSetAttachmentPreviewId: setAttachmentPreviewId,
    onSetPermissionTargetUserId: setPermissionTargetUserId,
    onSetCurrentUserId: setCurrentUserId,
    onSetSearchQuery: setSearchQuery,
    onSetHistoryFilter: setHistoryFilter,
    onToggleNotificationSetting: handleToggleNotificationSetting,
    onSave: handleSave,
    onSelectWorkOrder: handleSelectWorkOrder,
    onCreateWorkOrder: handleCreateWorkOrder,
    onDeleteWorkOrder: handleDeleteWorkOrder,
    onReorderWorkOrder: handleReorderWorkOrder,
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
    onAttachmentDeleteConfirmClose: handleCloseDeleteAttachmentConfirm,
    onAttachmentDeleteConfirm: handleConfirmDeleteAttachment,
    onCreateMemoThread: handleCreateMemoThread,
    onCreateMemoReply: handleCreateMemoReply,
    onPromoteMemoAttachment: handlePromoteMemoAttachment,
  });

  return (
    <>
      <WorkOrderLayout
        appShellRef={appShellRef}
        selectedId={selectedId}
        sidebarListProps={viewModel.sidebarListProps}
        detailProps={viewModel.detailProps}
        sidePanelProps={viewModel.sidePanelProps}
        mobileTopBarProps={viewModel.mobileTopBarProps}
        mobileDrawerProps={viewModel.mobileDrawerProps}
      />
      <WorkOrderOverlay
        attachmentInputRef={attachmentInputRef}
        onAttachmentFilesChange={handleAttachmentFiles}
        toastMessage={toastMessage}
        modalProps={viewModel.modalProps}
      />
    </>
  );
}
