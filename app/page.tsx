"use client";

import AttachmentPreviewModal from "@/components/common/modal/AttachmentPreviewModal";
import InventoryEditor from "@/components/common/modal/InventoryEditor";
import InventoryLogModal from "@/components/common/modal/InventoryLogModal";
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
    materialOpen,
    setMaterialOpen,
    outsourcingOpen,
    setOutsourcingOpen,
    inventoryEditorOpen,
    setInventoryEditorOpen,
    permissionModalOpen,
    setPermissionModalOpen,
    inventoryLogModalOpen,
    setInventoryLogModalOpen,
    attachmentPreviewId,
    setAttachmentPreviewId,
    users,
    currentUserId,
    setCurrentUserId,
    permissionTargetUserId,
    setPermissionTargetUserId,
    historyFilter,
    setHistoryFilter,
    workOrders,
    workflowStateById,
    selectedId,
    selectedWorkOrder,
    currentWorkflowState,
    currentUser,
    currentRole,
    isAdmin,
    canSeeProductionSections,
    canSeeCostSections,
    canEditInventory,
    canSeeInventoryHistorySection,
    canSeeAttachments,
    currentDisplayStage,
    currentInventoryQuantity,
    filteredHistoryLogs,
    inventoryLogs,
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
    handleCreateWorkOrder,
    handleWorkflowAction,
    handleInventoryApply,
    handleApplyRole,
    handleOpenAttachmentPicker,
    handleAttachmentFiles,
    handleDeleteAttachment,
  } = useWorkOrder();

  return (
    <main className="min-h-screen overflow-x-hidden bg-stone-100 text-stone-900">
      <div ref={appShellRef}>
        <MobileTopBar version={version} onOpen={() => setDrawerOpen(true)} />
        <MobileDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          workOrders={workOrders}
          selectedId={selectedId}
          workflowStateById={workflowStateById}
          onSelect={handleSelectWorkOrder}
          onCreate={handleCreateWorkOrder}
        />

        <div className="grid min-h-screen w-full grid-cols-1 md:grid-cols-12">
          <aside className="hidden min-w-0 border-r border-stone-200 bg-white md:block md:col-span-3">
            <SidebarContent
              version={version}
              workOrders={workOrders}
              selectedId={selectedId}
              workflowStateById={workflowStateById}
              onSelect={handleSelectWorkOrder}
              onCreate={handleCreateWorkOrder}
            />
          </aside>

          <section className="min-w-0 p-4 md:col-span-6 md:overflow-y-auto md:p-6">
            <div className="mb-4 rounded-2xl border border-cyan-200 bg-cyan-50 p-4 md:hidden">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-cyan-900">모바일 체크포인트</div>
                  <div className="mt-1 text-xs text-cyan-800">모바일 체크포인트 기준: 버전/드로어/카드 정보량/모달 동작 확인</div>
                </div>
                <span className="rounded-full bg-white px-2 py-1 text-[11px] font-medium text-cyan-800">state</span>
              </div>
              <div className="mt-3 space-y-1 text-xs text-cyan-900">
                <div>1. 상단 버전이 v0.1.14로 표시되는지</div>
                <div>2. 메뉴에서 작업 선택 시 드로어가 닫히는지</div>
                <div>3. 우측 진행단계 카드가 상태/액션 구조로 유지되는지</div>
                <div>4. 권한/사용자 변경 시 액션 버튼과 재고 수정 가능 여부가 달라지는지</div>
              </div>
            </div>

            <WorkOrderDetail
              workOrder={selectedWorkOrder}
              currentWorkflowState={currentWorkflowState}
              saveStatus={saveStatus}
              lastSavedAt={lastSavedAt}
              currentInventoryQuantity={currentInventoryQuantity}
              currentUserName={currentUser.name}
              currentRole={currentRole}
              canEditInventory={canEditInventory}
              canSeeProductionSections={canSeeProductionSections}
              canSeeAttachments={canSeeAttachments}
              materialOpen={materialOpen}
              outsourcingOpen={outsourcingOpen}
              attachmentInputRef={attachmentInputRef}
              onSave={() => handleSave()}
              onOpenInventoryEditor={() => setInventoryEditorOpen(true)}
              onToggleMaterial={() => setMaterialOpen((prev) => !prev)}
              onToggleOutsourcing={() => setOutsourcingOpen((prev) => !prev)}
              onOpenAttachmentPicker={handleOpenAttachmentPicker}
              onAttachmentFiles={handleAttachmentFiles}
              onPreviewAttachment={setAttachmentPreviewId}
              onDeleteAttachment={handleDeleteAttachment}
              canDeleteAttachment={canDeleteAttachment}
            />
          </section>

          <aside className="min-w-0 border-t border-stone-200 bg-stone-50 p-4 md:col-span-3 md:border-l md:border-t-0 md:p-6">
            <WorkOrderSidePanel
              currentUser={currentUser}
              users={users}
              onCurrentUserChange={setCurrentUserId}
              onOpenPermissions={() => setPermissionModalOpen(true)}
              currentState={currentWorkflowState}
              currentDisplayStage={currentDisplayStage}
              visibleStages={visibleStages}
              actions={availableActions}
              onAction={handleWorkflowAction}
              canSeeCostSections={canSeeCostSections}
              fabricTotal={fabricTotal}
              subsidiaryTotal={subsidiaryTotal}
              outsourcingTotal={outsourcingTotal}
              totalCost={totalCost}
              unitCost={unitCost}
              outsourcing={outsourcing}
              canSeeInventoryHistorySection={canSeeInventoryHistorySection}
              isAdmin={isAdmin}
              currentRole={currentRole}
              filteredHistoryLogs={filteredHistoryLogs}
              historyFilter={historyFilter}
              onHistoryFilterChange={setHistoryFilter}
              onOpenInventoryLogModal={() => setInventoryLogModalOpen(true)}
            />
          </aside>
        </div>
      </div>

      <AttachmentPreviewModal
        attachment={selectedAttachment}
        canDelete={canDeleteAttachment(selectedAttachment)}
        onClose={() => setAttachmentPreviewId(null)}
        onDelete={() => selectedAttachment && handleDeleteAttachment(selectedAttachment.id)}
      />
      <InventoryLogModal
        open={inventoryLogModalOpen}
        onClose={() => setInventoryLogModalOpen(false)}
        logs={filteredHistoryLogs}
        role={currentRole}
        filter={historyFilter}
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
        onApplyRole={handleApplyRole}
      />
    </main>
  );
}
