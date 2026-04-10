"use client";

import { useMemo, useState } from "react";
import ToastMessage from "@/components/common/ToastMessage";
import AdminPanelModal from "@/components/common/modal/AdminPanelModal";
import AttachmentDeleteConfirmModal from "@/components/common/modal/AttachmentDeleteConfirmModal";
import AttachmentPreviewModal from "@/components/common/modal/AttachmentPreviewModal";
import CreateWorkOrderModal from "@/components/common/modal/CreateWorkOrderModal";
import InventoryEditor from "@/components/common/modal/InventoryEditor";
import InventoryLogModal from "@/components/common/modal/InventoryLogModal";
import ManagerAssignModal from "@/components/common/modal/ManagerAssignModal";
import OrderRequestConfirmModal from "@/components/common/modal/OrderRequestConfirmModal";
import PermissionModal from "@/components/common/modal/PermissionModal";
import MobileDrawer from "@/components/layout/MobileDrawer";
import MobileTopBar from "@/components/layout/MobileTopBar";
import SidebarContent from "@/components/layout/SidebarContent";
import WorkOrderDetail from "@/components/workorder/WorkOrderDetail";
import WorkOrderSidePanel from "@/components/workorder/WorkOrderSidePanel";
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

  return (
    <main className="min-h-screen overflow-x-hidden bg-stone-100 text-stone-900">
      <div ref={appShellRef} className="overflow-x-hidden">
        <MobileTopBar
          version={version}
          onOpen={() => setDrawerOpen(true)}
          onOpenSettings={() => setPermissionModalOpen(true)}
          onOpenAdminPanel={isAdmin ? () => setAdminPanelModalOpen(true) : undefined}
        />
        <MobileDrawer
          {...sidebarListProps}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onReorder={(id) => {
            handleReorderWorkOrder(id);
            setDrawerOpen(false);
          }}
        />

        <div className="grid min-h-screen w-full max-w-full grid-cols-1 overflow-x-hidden md:grid-cols-12">
          <aside className="hidden min-w-0 border-r border-stone-200 bg-white md:block md:col-span-3">
            <SidebarContent {...sidebarListProps} />
          </aside>

          <section className="min-w-0 overflow-x-hidden px-3 py-3 md:col-span-6 md:overflow-y-auto md:p-6">
            <div key={selectedId} className="pbp-mobile-content-switch md:contents">
              <WorkOrderDetail {...detailProps} />
            </div>
          </section>

          <aside className="min-w-0 overflow-x-hidden border-t border-stone-200 bg-stone-50 px-3 py-3 md:col-span-3 md:border-l md:border-t-0 md:p-6">
            <WorkOrderSidePanel {...sidePanelProps} />
          </aside>
        </div>
      </div>

      <OrderRequestConfirmModal {...modalProps.orderRequestConfirm} />
      <AttachmentPreviewModal {...modalProps.attachmentPreview} />
      <AttachmentDeleteConfirmModal {...modalProps.attachmentDeleteConfirm} />
      <InventoryLogModal {...modalProps.inventoryLog} />
      <ManagerAssignModal {...modalProps.managerAssign} />
      <InventoryEditor {...modalProps.inventoryEditor} />
      <CreateWorkOrderModal {...modalProps.createWorkOrder} />

      <PermissionModal {...modalProps.permission} />

      <AdminPanelModal {...modalProps.adminPanel} />

      <input
        ref={attachmentInputRef}
        type="file"
        accept="image/*,.pdf,application/pdf"
        multiple
        className="sr-only"
        onChange={handleAttachmentFiles}
      />
      <ToastMessage message={toastMessage} />
    </main>
  );
}
