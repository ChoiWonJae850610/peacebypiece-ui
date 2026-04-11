"use client";

import { useMemo, useState } from "react";
import WorkOrderLayout from "@/components/workorder/WorkOrderLayout";
import WorkOrderOverlay from "@/components/workorder/WorkOrderOverlay";
import { APP_VERSION } from "@/lib/constants/app";
import { isInspectorRole } from "@/lib/constants/roles";
import { useWorkOrder } from "@/lib/hooks/useWorkOrder";

export default function WorkOrderWorkspace() {
  const version = APP_VERSION;
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
    canEditInventory,
    canOpenInventoryEditor,
    canSeeInventoryHistorySection,
    canSeeAttachments,
    currentDisplayStage,
    currentInventoryQuantity,
    filteredHistoryLogs,
    inventoryLogs,
    officialAttachments,
    selectedAttachment,
    canDeleteAttachment,
    outsourcing,
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
  } = useWorkOrder();

  const canManageListActions = !isInspectorRole(currentUser);

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

  const sidebarListProps = {
    version,
    workOrders,
    selectedId,
    workflowStateById,
    onSelect: handleSelectWorkOrder,
    onCreate: () => setCreateWorkOrderModalOpen(true),
    onOpenSettings: () => setPermissionModalOpen(true),
    onOpenAdminPanel: isAdmin ? () => setAdminPanelModalOpen(true) : undefined,
    onReorder: handleReorderWorkOrder,
    onDelete: handleDeleteWorkOrder,
    canDelete: canDeleteWorkOrder,
    canCreate: canCreateWorkOrder,
    canManageListActions,
    searchQuery,
    onSearchQueryChange: setSearchQuery,
  };

  const detailProps = {
    workOrder: selectedWorkOrder,
    currentWorkflowState,
    saveStatus,
    lastSavedAt,
    currentInventoryQuantity,
    currentUserName: currentUser.name,
    currentUserRole: currentRole,
    canRenameTitle: isAdmin,
    canEditInventory: canOpenInventoryEditor,
    canChangeManager,
    onOpenManagerAssignModal: handleOpenManagerAssignModal,
    canSeeProductionSections,
    canSeeCostSections,
    fabricTotal,
    subsidiaryTotal,
    outsourcingTotal,
    totalCost,
    unitCost,
    basicInfoOpen,
    materialOpen,
    outsourcingOpen,
    onSave: () => handleSave(),
    onOpenInventoryEditor: () => setInventoryEditorOpen(true),
    isReviewRequestLocked,
    onToggleBasicInfo: () => setBasicInfoOpen((prev) => !prev),
    onToggleMaterial: () => setMaterialOpen((prev) => !prev),
    onToggleOutsourcing: () => setOutsourcingOpen((prev) => !prev),
    onSetMaterialOpen: setMaterialOpen,
    onSetOutsourcingOpen: setOutsourcingOpen,
    visibleStages,
    currentDisplayStage,
    actions: availableActions,
    onAction: handleWorkflowAction,
    onUpdateWorkOrder: handleUpdateSelectedWorkOrder,
    onRenameWorkOrderTitle: handleRenameWorkOrderTitle,
    onCompleteInspection: handleCompleteInspection,
  };

  const sidePanelProps = {
    canSeeAttachments,
    canUploadOfficialAttachments,
    attachments: officialAttachments,
    onOpenAttachmentPicker: handleOpenAttachmentPicker,
    onPreviewAttachment: setAttachmentPreviewId,
    onDeleteAttachment: handleRequestDeleteAttachment,
    canDeleteAttachment,
    currentRole,
    workOrder: selectedWorkOrder,
    currentUserName: currentUser.name,
    onCreateMemoThread: handleCreateMemoThread,
    onCreateMemoReply: handleCreateMemoReply,
    canPromoteMemoAttachment: canUploadOfficialAttachments,
    onPromoteMemoAttachment: handlePromoteMemoAttachment,
  };

  const modalProps = {
    orderRequestConfirm: {
      open: orderRequestConfirmOpen,
      workOrder: selectedWorkOrder,
      onClose: handleCloseOrderRequestConfirm,
      onConfirm: handleConfirmOrderRequest,
    },
    attachmentPreview: {
      attachment: selectedAttachment,
      canDelete: canDeleteAttachment(selectedAttachment),
      onClose: () => setAttachmentPreviewId(null),
      onDelete: () => selectedAttachment && handleRequestDeleteAttachment(selectedAttachment.id),
    },
    attachmentDeleteConfirm: {
      open: pendingAttachmentDelete !== null,
      attachment: pendingAttachmentDelete,
      onClose: handleCloseDeleteAttachmentConfirm,
      onConfirm: handleConfirmDeleteAttachment,
    },
    inventoryLog: {
      open: inventoryLogModalOpen && isAdmin,
      onClose: () => setInventoryLogModalOpen(false),
      logs: filteredHistoryLogs,
      role: currentRole,
      filter: historyFilter,
    },
    managerAssign: {
      open: managerAssignModalOpen,
      onClose: handleCloseManagerAssignModal,
      users,
      currentManagerId: selectedWorkOrder.managerId ?? null,
      currentManagerName: selectedWorkOrder.manager,
      onSelectManager: handleChangeManager,
    },
    inventoryEditor: {
      open: inventoryEditorOpen,
      onClose: () => setInventoryEditorOpen(false),
      currentStock: currentInventoryQuantity,
      currentUserName: currentUser.name,
      logs: inventoryLogs,
      showRecentLogs: isAdmin,
      onApply: handleInventoryApply,
    },
    createWorkOrder: {
      open: createWorkOrderModalOpen,
      onClose: () => setCreateWorkOrderModalOpen(false),
      onCreate: handleCreateWorkOrder,
    },
    permission: {
      open: permissionModalOpen,
      onClose: () => setPermissionModalOpen(false),
      users,
      currentUserId,
      selectedUserId: permissionTargetUserId,
      onSelectedUserChange: setPermissionTargetUserId,
      onApplyRoles: handleApplyRoles,
      onCurrentUserChange: setCurrentUserId,
    },
    adminPanel: {
      open: adminPanelModalOpen && isAdmin,
      onClose: () => setAdminPanelModalOpen(false),
      notificationSettings,
      onToggleNotificationSetting: handleToggleNotificationSetting,
      historyLogs: filteredHistoryLogs,
      historyFilter,
      onHistoryFilterChange: setHistoryFilter,
    },
  };

  const mobileTopBarProps = {
    version,
    onOpen: () => setDrawerOpen(true),
    onOpenSettings: () => setPermissionModalOpen(true),
    onOpenAdminPanel: isAdmin ? () => setAdminPanelModalOpen(true) : undefined,
  };

  const mobileDrawerProps = {
    ...sidebarListProps,
    open: drawerOpen,
    onClose: () => setDrawerOpen(false),
    onReorder: (id: string) => {
      handleReorderWorkOrder(id);
      setDrawerOpen(false);
    },
  };

  return (
    <>
      <WorkOrderLayout
        appShellRef={appShellRef}
        selectedId={selectedId}
        sidebarListProps={sidebarListProps}
        detailProps={detailProps}
        sidePanelProps={sidePanelProps}
        mobileTopBarProps={mobileTopBarProps}
        mobileDrawerProps={mobileDrawerProps}
      />
      <WorkOrderOverlay
        attachmentInputRef={attachmentInputRef}
        onAttachmentFilesChange={handleAttachmentFiles}
        toastMessage={toastMessage}
        modalProps={modalProps}
      />
    </>
  );
}
