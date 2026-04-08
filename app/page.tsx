"use client";

import { useMemo, useState } from "react";
import ToastMessage from "@/components/common/ToastMessage";
import AttachmentPreviewModal from "@/components/common/modal/AttachmentPreviewModal";
import AdminPanelModal from "@/components/common/modal/AdminPanelModal";
import AttachmentDeleteConfirmModal from "@/components/common/modal/AttachmentDeleteConfirmModal";
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
import { useWorkOrder } from "@/lib/hooks/useWorkOrder";

export default function Home() {
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
    handleWorkflowAction,
    handleConfirmOrderRequest,
    handleCloseOrderRequestConfirm,
    handleInventoryApply,
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
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          workOrders={workOrders}
          selectedId={selectedId}
          workflowStateById={workflowStateById}
          onSelect={handleSelectWorkOrder}
          onCreate={handleCreateWorkOrder}
          onDelete={handleDeleteWorkOrder}
          canDelete={canDeleteWorkOrder}
          canCreate={canCreateWorkOrder}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
        />

        <div className="grid min-h-screen w-full max-w-full grid-cols-1 overflow-x-hidden md:grid-cols-12">
          <aside className="hidden min-w-0 border-r border-stone-200 bg-white md:block md:col-span-3">
            <SidebarContent
              version={version}
              workOrders={workOrders}
              selectedId={selectedId}
              workflowStateById={workflowStateById}
              onSelect={handleSelectWorkOrder}
              onCreate={handleCreateWorkOrder}
              onOpenSettings={() => setPermissionModalOpen(true)}
              onOpenAdminPanel={isAdmin ? () => setAdminPanelModalOpen(true) : undefined}
              onReorder={() => {}}
              onDelete={handleDeleteWorkOrder}
              canDelete={canDeleteWorkOrder}
              canCreate={canCreateWorkOrder}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
            />
          </aside>

          <section className="min-w-0 overflow-x-hidden px-3 py-3 md:col-span-6 md:overflow-y-auto md:p-6">
            <div key={selectedId} className="pbp-mobile-content-switch md:contents">
            <WorkOrderDetail
              workOrder={selectedWorkOrder}
              currentWorkflowState={currentWorkflowState}
              saveStatus={saveStatus}
              lastSavedAt={lastSavedAt}
              currentInventoryQuantity={currentInventoryQuantity}
              currentUserName={currentUser.name}
              currentUserRole={currentRole}
              canEditInventory={canOpenInventoryEditor}
              canChangeManager={canChangeManager}
              onOpenManagerAssignModal={handleOpenManagerAssignModal}
              canSeeProductionSections={canSeeProductionSections}
              canSeeCostSections={canSeeCostSections}
              fabricTotal={fabricTotal}
              subsidiaryTotal={subsidiaryTotal}
              outsourcingTotal={outsourcingTotal}
              totalCost={totalCost}
              unitCost={unitCost}
              basicInfoOpen={basicInfoOpen}
              materialOpen={materialOpen}
              outsourcingOpen={outsourcingOpen}
              onSave={() => handleSave()}
              onOpenInventoryEditor={() => setInventoryEditorOpen(true)}
              onToggleBasicInfo={() => setBasicInfoOpen((prev) => !prev)}
              onToggleMaterial={() => setMaterialOpen((prev) => !prev)}
              onToggleOutsourcing={() => setOutsourcingOpen((prev) => !prev)}
              onSetMaterialOpen={setMaterialOpen}
              onSetOutsourcingOpen={setOutsourcingOpen}
              visibleStages={visibleStages}
              currentDisplayStage={currentDisplayStage}
              actions={availableActions}
              onAction={handleWorkflowAction}
            />
            </div>
          </section>

          <aside className="min-w-0 overflow-x-hidden border-t border-stone-200 bg-stone-50 px-3 py-3 md:col-span-3 md:border-l md:border-t-0 md:p-6">
            <WorkOrderSidePanel
              canSeeAttachments={canSeeAttachments}
              canUploadOfficialAttachments={canUploadOfficialAttachments}
              attachments={officialAttachments}
              onOpenAttachmentPicker={handleOpenAttachmentPicker}
              onPreviewAttachment={setAttachmentPreviewId}
              onDeleteAttachment={handleRequestDeleteAttachment}
              canDeleteAttachment={canDeleteAttachment}
              currentRole={currentRole}
              workOrder={selectedWorkOrder}
              currentUserName={currentUser.name}
              onCreateMemoThread={handleCreateMemoThread}
              onCreateMemoReply={handleCreateMemoReply}
              canPromoteMemoAttachment={canUploadOfficialAttachments}
              onPromoteMemoAttachment={handlePromoteMemoAttachment}
            />
          </aside>
        </div>
      </div>

      <OrderRequestConfirmModal
        open={orderRequestConfirmOpen}
        workOrder={selectedWorkOrder}
        onClose={handleCloseOrderRequestConfirm}
        onConfirm={handleConfirmOrderRequest}
      />
      <AttachmentPreviewModal
        attachment={selectedAttachment}
        canDelete={canDeleteAttachment(selectedAttachment)}
        onClose={() => setAttachmentPreviewId(null)}
        onDelete={() => selectedAttachment && handleRequestDeleteAttachment(selectedAttachment.id)}
      />
      <AttachmentDeleteConfirmModal
        open={pendingAttachmentDelete !== null}
        attachmentName={pendingAttachmentDelete?.name ?? null}
        onClose={handleCloseDeleteAttachmentConfirm}
        onConfirm={handleConfirmDeleteAttachment}
      />
      <InventoryLogModal
        open={inventoryLogModalOpen && isAdmin}
        onClose={() => setInventoryLogModalOpen(false)}
        logs={filteredHistoryLogs}
        role={currentRole}
        filter={historyFilter}
      />
      <ManagerAssignModal
        open={managerAssignModalOpen}
        onClose={handleCloseManagerAssignModal}
        users={users}
        currentManagerId={selectedWorkOrder.managerId ?? null}
        currentManagerName={selectedWorkOrder.manager}
        onSelectManager={handleChangeManager}
      />
      <InventoryEditor
        open={inventoryEditorOpen}
        onClose={() => setInventoryEditorOpen(false)}
        currentStock={currentInventoryQuantity}
        currentUserName={currentUser.name}
        logs={inventoryLogs}
        showRecentLogs={isAdmin}
        onApply={handleInventoryApply}
      />
      <PermissionModal
        open={permissionModalOpen}
        onClose={() => setPermissionModalOpen(false)}
        users={users}
        currentUserId={currentUserId}
        selectedUserId={permissionTargetUserId}
        onSelectedUserChange={setPermissionTargetUserId}
        onApplyRoles={handleApplyRoles}
        onCurrentUserChange={setCurrentUserId}
      />

      <AdminPanelModal
        open={adminPanelModalOpen && isAdmin}
        onClose={() => setAdminPanelModalOpen(false)}
        notificationSettings={notificationSettings}
        onToggleNotificationSetting={handleToggleNotificationSetting}
        historyLogs={filteredHistoryLogs}
        historyFilter={historyFilter}
        onHistoryFilterChange={setHistoryFilter}
      />

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
