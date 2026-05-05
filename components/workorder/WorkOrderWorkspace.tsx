"use client";

import { useMemo, useState } from "react";

import WorkOrderLayout from "@/components/workorder/WorkOrderLayout";
import WorkOrderOverlay from "@/components/workorder/WorkOrderOverlay";
import WorkOrderDeleteConfirmModal from "@/components/common/modal/WorkOrderDeleteConfirmModal";
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
  const workOrder = useWorkOrder({ initialWorkOrderId });
  const dbConnectionStatus = useDbConnectionStatus();

  const {
    ui,
    identity,
    history,
    selection,
    permissions,
    attachments,
    memo,
    production,
    cost,
    persistence,
    workflow,
    actions,
    repository,
    runtime,
  } = workOrder;

  const [pendingAttachmentDeleteId, setPendingAttachmentDeleteId] = useState<string | null>(null);
  const [pendingWorkOrderDeleteId, setPendingWorkOrderDeleteId] = useState<string | null>(null);
  const [workflowProcessingLabel, setWorkflowProcessingLabel] = useState<string | null>(null);

  const renderHasSelection = selection.hasVisibleWorkOrders && selection.hasActiveSelection;
  const isRepositoryLoading = repository.repositoryStatus === "loading";
  const isCreatingWorkOrder = runtime.actionStatusMap.create === "loading";
  const loadingCopy = i18n.workorder.ui.layout.sidebarControls;
  const lifecycleProcessingLabel = (() => {
    if (runtime.actionStatusMap.create === "loading") return i18n.workorder.lifecycle.createProcessingLabel ?? "작업지시서 생성 중입니다...";
    if (runtime.actionStatusMap.reorder === "loading") return i18n.workorder.lifecycle.reorderProcessingLabel ?? "리오더 생성 중입니다...";
    if (runtime.actionStatusMap.delete === "loading") return i18n.workorder.lifecycle.deleteProcessingLabel ?? "작업지시서 삭제 중입니다...";
    return null;
  })();
  const workflowWriteLockMessage = workflowProcessingLabel ? `${workflowProcessingLabel.replace(/\s+/g, "")} 중입니다...` : null;
  const workspaceWriteLockMessage = lifecycleProcessingLabel ?? workflowWriteLockMessage ?? undefined;
  const isWorkspaceWriteLocked = Boolean(lifecycleProcessingLabel || workflowProcessingLabel);

  const workspaceLoadingState = {
    isRepositoryLoading,
    detailTitle: loadingCopy.loadingDetailTitle,
    detailDescription: loadingCopy.loadingDetailDescription,
    sideTitle: loadingCopy.loadingSideTitle,
    sideDescription: loadingCopy.loadingSideDescription,
  };

  const pendingAttachmentDelete = useMemo(
    () =>
      getPendingAttachmentDelete(
        renderHasSelection ? selection.selectedWorkOrder.attachments : [],
        pendingAttachmentDeleteId,
      ),
    [pendingAttachmentDeleteId, renderHasSelection, selection.selectedWorkOrder.attachments],
  );

  const pendingWorkOrderDelete = useMemo(
    () => selection.workOrders.find((item) => item.id === pendingWorkOrderDeleteId) ?? null,
    [pendingWorkOrderDeleteId, selection.workOrders],
  );

  const handleRequestDeleteWorkOrder = (workOrderId: string) => {
    if (isWorkspaceWriteLocked) return;
    setPendingWorkOrderDeleteId(workOrderId);
  };

  const handleCloseDeleteWorkOrderConfirm = () => {
    setPendingWorkOrderDeleteId(null);
  };

  const handleConfirmDeleteWorkOrder = () => {
    if (isWorkspaceWriteLocked || !pendingWorkOrderDeleteId) return;

    void actions.handleDeleteWorkOrder(pendingWorkOrderDeleteId);
    setPendingWorkOrderDeleteId(null);
  };

  const handleRequestDeleteAttachment = (attachmentId: string) => {
    if (isWorkspaceWriteLocked) return;
    setPendingAttachmentDeleteId(attachmentId);
  };

  const handleCloseDeleteAttachmentConfirm = () => {
    setPendingAttachmentDeleteId(null);
  };

  const handleConfirmDeleteAttachment = () => {
    if (isWorkspaceWriteLocked || !pendingAttachmentDeleteId) return;

    attachments.handleDeleteAttachment(pendingAttachmentDeleteId);
    setPendingAttachmentDeleteId(null);
  };

  const handleWorkflowActionWithProcessing = async (action: Parameters<typeof actions.handleWorkflowAction>[0]) => {
    setWorkflowProcessingLabel(action.label);
    try {
      await actions.handleWorkflowAction(action);
    } finally {
      setWorkflowProcessingLabel(null);
    }
  };

  const viewModel = buildWorkspaceViewModel({
    drawerOpen: ui.drawerOpen,
    basicInfoOpen: ui.basicInfoOpen,
    materialOpen: ui.materialOpen,
    outsourcingOpen: ui.outsourcingOpen,
    inventoryEditorOpen: ui.inventoryEditorOpen,
    permissionModalOpen: ui.permissionModalOpen,
    createWorkOrderModalOpen: ui.createWorkOrderModalOpen,
    managerAssignModalOpen: ui.managerAssignModalOpen,
    inventoryLogModalOpen: ui.inventoryLogModalOpen,
    orderRequestConfirmOpen: ui.orderRequestConfirmOpen,
    users: identity.users,
    currentUserId: identity.currentUserId,
    permissionTargetUserId: identity.permissionTargetUserId,
    historyFilter: history.historyFilter,
    searchQuery: selection.searchQuery,
    workOrders: selection.workOrders,
    hasVisibleWorkOrders: renderHasSelection,
    workflowStateById: selection.workflowStateById,
    selectedId: selection.selectedId,
    selectedWorkOrder: selection.selectedWorkOrder,
    currentWorkflowState: selection.currentWorkflowState,
    currentUser: identity.currentUser,
    currentRole: identity.currentRole,
    isAdmin: identity.isAdmin,
    canCreateWorkOrder: permissions.canCreateWorkOrder,
    canSeeAttachments: permissions.canSeeAttachments,
    canEditSideDraftContent: permissions.canEditSideDraftContent,
    canUploadOfficialAttachments: permissions.canUploadOfficialAttachments,
    canEditMemo: permissions.canEditMemo,
    canRenameTitle: permissions.canRenameTitle,
    isReviewRequestLocked: permissions.isReviewRequestLocked,
    canChangeManager: permissions.canChangeManager,
    canSeeProductionSections: permissions.canSeeProductionSections,
    canSeeCostSections: permissions.canSeeCostSections,
    canOpenInventoryEditor: permissions.canOpenInventoryEditor,
    currentDisplayStage: selection.currentDisplayStage,
    currentInventoryQuantity: selection.currentInventoryQuantity,
    filteredHistoryLogs: history.filteredHistoryLogs,
    inventoryLogs: history.inventoryLogs,
    designAttachments: attachments.designAttachments,
    officialAttachments: attachments.officialAttachments,
    selectedAttachment: attachments.selectedAttachment,
    fabricTotal: cost.fabricTotal,
    subsidiaryTotal: cost.subsidiaryTotal,
    outsourcingTotal: cost.outsourcingTotal,
    totalCost: cost.totalCost,
    unitCost: cost.unitCost,
    saveStatus: persistence.saveStatus,
    lastSavedAt: persistence.lastSavedAt,
    availableActions: workflow.availableActions,
    visibleStages: workflow.visibleStages,
    workflowProcessingLabel,
    isWorkspaceWriteLocked,
    workspaceWriteLockMessage,
    pendingAttachmentDelete,
    canDeleteWorkOrder: actions.canDeleteWorkOrder,
    getAttachmentPermissions: attachments.getAttachmentPermissions,
    i18n,
    onSetDrawerOpen: ui.setDrawerOpen,
    onSetBasicInfoOpen: ui.setBasicInfoOpen,
    onSetMaterialOpen: ui.setMaterialOpen,
    onSetOutsourcingOpen: ui.setOutsourcingOpen,
    onSetInventoryEditorOpen: ui.setInventoryEditorOpen,
    onSetPermissionModalOpen: ui.setPermissionModalOpen,
    onSetCreateWorkOrderModalOpen: ui.setCreateWorkOrderModalOpen,
    onSetInventoryLogModalOpen: ui.setInventoryLogModalOpen,
    onSetAttachmentPreviewId: ui.setAttachmentPreviewId,
    onSetPermissionTargetUserId: identity.setPermissionTargetUserId,
    onSetCurrentUserId: identity.setCurrentUserId,
    onSetSearchQuery: selection.setSearchQuery,
    dbConnectionStatus,
    onSetHistoryFilter: history.setHistoryFilter,
    onSave: actions.handleSave,
    onSelectWorkOrder: actions.handleSelectWorkOrder,
    onCreateWorkOrder: actions.handleCreateWorkOrder,
    onDeleteWorkOrder: handleRequestDeleteWorkOrder,
    onReorderWorkOrder: actions.handleReorderWorkOrder,
    onReworkWorkOrder: actions.handleReworkWorkOrder,
    onWorkflowAction: handleWorkflowActionWithProcessing,
    onUpdateSelectedWorkOrder: actions.handleUpdateSelectedWorkOrder,
    onRenameWorkOrderTitle: actions.handleRenameWorkOrderTitle,
    onConfirmOrderRequest: actions.handleConfirmOrderRequest,
    onCloseOrderRequestConfirm: actions.handleCloseOrderRequestConfirm,
    onInventoryApply: actions.handleInventoryApply,
    onCompleteInspection: actions.handleCompleteInspection,
    onApplyRoles: actions.handleApplyRoles,
    onOpenManagerAssignModal: actions.handleOpenManagerAssignModal,
    onCloseManagerAssignModal: actions.handleCloseManagerAssignModal,
    onChangeManager: actions.handleChangeManager,
    onOpenAttachmentPicker: attachments.handleOpenAttachmentPicker,
    onUploadAttachmentFiles: attachments.handleAttachmentFileDrop,
    onRequestDeleteAttachment: handleRequestDeleteAttachment,
    onSetPrimaryDesignAttachment: attachments.handleSetPrimaryDesignAttachment,
    onAttachmentDeleteConfirmClose: handleCloseDeleteAttachmentConfirm,
    onAttachmentDeleteConfirm: handleConfirmDeleteAttachment,
    onCreateMemoThread: memo.handleCreateMemoThread,
    onCreateMemoReply: memo.handleCreateMemoReply,
    onUpdateMemoThread: memo.handleUpdateMemoThread,
    onDeleteMemoThread: memo.handleDeleteMemoThread,
    onUpdateMemoReply: memo.handleUpdateMemoReply,
    onDeleteMemoReply: memo.handleDeleteMemoReply,
  });

  return (
    <>
      <WorkOrderLayout
        appShellRef={ui.appShellRef}
        selectedId={renderHasSelection ? selection.selectedId : ""}
        hasSelection={renderHasSelection}
        sidebarListProps={viewModel.sidebarListProps}
        detailProps={viewModel.detailProps}
        sidePanelProps={viewModel.sidePanelProps}
        mobileTopBarProps={viewModel.mobileTopBarProps}
        mobileDrawerProps={viewModel.mobileDrawerProps}
        loadingState={workspaceLoadingState}
      />

      <WorkOrderOverlay
        attachmentInputRef={ui.attachmentInputRef}
        attachmentInputAccept={attachments.attachmentInputAccept}
        onAttachmentFilesChange={(event) => { if (!isWorkspaceWriteLocked) attachments.handleAttachmentFiles(event); }}
        writeLocked={isWorkspaceWriteLocked}
        writeLockMessage={workspaceWriteLockMessage}
        toastMessage={ui.toastMessage}
        modalProps={{
          ...viewModel.modalProps,
          createWorkOrder: {
            ...viewModel.modalProps.createWorkOrder,
            isCreating: isCreatingWorkOrder,
          },
        }}
      />
      <WorkOrderDeleteConfirmModal
        open={Boolean(pendingWorkOrderDelete)}
        workOrder={pendingWorkOrderDelete}
        onClose={handleCloseDeleteWorkOrderConfirm}
        onConfirm={handleConfirmDeleteWorkOrder}
      />
    </>
  );
}
