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

const WORK_ORDER_WRITE_LOCK_MESSAGES = {
  create: "작업지시서 생성 중입니다...",
  workflow: "상태 변경 처리 중입니다...",
  reorder: "리오더 생성 중입니다...",
  delete: "작업지시서 삭제 중입니다...",
  memo: "메모 저장 중입니다...",
  attachment: "파일 처리 중입니다...",
  edit: "변경사항 저장 중입니다...",
  orderRequest: "발주요청 중입니다...",
} as const;

export default function WorkOrderWorkspace({
  initialWorkOrderId = null,
}: WorkOrderWorkspaceProps) {
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

  const [pendingAttachmentDeleteId, setPendingAttachmentDeleteId] = useState<
    string | null
  >(null);
  const [pendingWorkOrderDeleteId, setPendingWorkOrderDeleteId] = useState<
    string | null
  >(null);
  const [workflowProcessingLabel, setWorkflowProcessingLabel] = useState<
    string | null
  >(null);
  const [manualWriteLockMessage, setManualWriteLockMessage] = useState<
    string | null
  >(null);

  const renderHasSelection =
    selection.hasVisibleWorkOrders && selection.hasActiveSelection;
  const isRepositoryLoading = repository.repositoryStatus === "loading";
  const isCreatingWorkOrder = runtime.actionStatusMap.create === "loading";
  const loadingCopy = i18n.workorder.ui.layout.sidebarControls;
  const lifecycleProcessingLabel = (() => {
    if (runtime.actionStatusMap.create === "loading")
      return (
        i18n.workorder.lifecycle.createProcessingLabel ??
        "작업지시서 생성 중입니다..."
      );
    if (runtime.actionStatusMap.reorder === "loading")
      return (
        i18n.workorder.lifecycle.reorderProcessingLabel ??
        "리오더 생성 중입니다..."
      );
    if (runtime.actionStatusMap.delete === "loading")
      return (
        i18n.workorder.lifecycle.deleteProcessingLabel ??
        "작업지시서 삭제 중입니다..."
      );
    return null;
  })();
  const workflowWriteLockMessage = workflowProcessingLabel
    ? `${workflowProcessingLabel.replace(/\s+/g, "")} 중입니다...`
    : null;
  const persistenceProcessingLabel =
    persistence.saveStatus === "saving"
      ? WORK_ORDER_WRITE_LOCK_MESSAGES.edit
      : null;
  const workspaceWriteLockMessage =
    manualWriteLockMessage ??
    lifecycleProcessingLabel ??
    workflowWriteLockMessage ??
    persistenceProcessingLabel ??
    undefined;
  const isWorkspaceWriteLocked = Boolean(
    manualWriteLockMessage ||
    lifecycleProcessingLabel ||
    workflowProcessingLabel ||
    persistenceProcessingLabel,
  );

  const runWithWorkspaceWriteLock = async <T,>(
    message: string,
    task: () => T | Promise<T>,
  ) => {
    if (isWorkspaceWriteLocked) return undefined;

    setManualWriteLockMessage(message);
    try {
      return await Promise.resolve(task());
    } finally {
      setManualWriteLockMessage(null);
    }
  };

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
    [
      pendingAttachmentDeleteId,
      renderHasSelection,
      selection.selectedWorkOrder.attachments,
    ],
  );

  const pendingWorkOrderDelete = useMemo(
    () =>
      selection.workOrders.find(
        (item) => item.id === pendingWorkOrderDeleteId,
      ) ?? null,
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

    const workOrderId = pendingWorkOrderDeleteId;
    setPendingWorkOrderDeleteId(null);
    void runWithWorkspaceWriteLock(
      i18n.workorder.lifecycle.deleteProcessingLabel ??
        WORK_ORDER_WRITE_LOCK_MESSAGES.delete,
      () => actions.handleDeleteWorkOrder(workOrderId),
    );
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

    const attachmentId = pendingAttachmentDeleteId;
    setPendingAttachmentDeleteId(null);
    void runWithWorkspaceWriteLock(
      WORK_ORDER_WRITE_LOCK_MESSAGES.attachment,
      () => attachments.handleDeleteAttachment(attachmentId),
    );
  };

  const handleWorkflowActionWithProcessing = async (
    action: Parameters<typeof actions.handleWorkflowAction>[0],
  ) => {
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
    onSave: () => {
      void runWithWorkspaceWriteLock(WORK_ORDER_WRITE_LOCK_MESSAGES.edit, () =>
        actions.handleSave(),
      );
    },
    onSelectWorkOrder: actions.handleSelectWorkOrder,
    onCreateWorkOrder: (payload) => {
      void runWithWorkspaceWriteLock(
        i18n.workorder.lifecycle.createProcessingLabel ??
          WORK_ORDER_WRITE_LOCK_MESSAGES.create,
        () => actions.handleCreateWorkOrder(payload),
      );
    },
    onDeleteWorkOrder: handleRequestDeleteWorkOrder,
    onReorderWorkOrder: (id) => {
      void runWithWorkspaceWriteLock(
        i18n.workorder.lifecycle.reorderProcessingLabel ??
          WORK_ORDER_WRITE_LOCK_MESSAGES.reorder,
        () => actions.handleReorderWorkOrder(id),
      );
    },
    onReworkWorkOrder: (id) => {
      void runWithWorkspaceWriteLock(WORK_ORDER_WRITE_LOCK_MESSAGES.edit, () =>
        actions.handleReworkWorkOrder(id),
      );
    },
    onWorkflowAction: handleWorkflowActionWithProcessing,
    onUpdateSelectedWorkOrder: (patch) => {
      if (!isWorkspaceWriteLocked) actions.handleUpdateSelectedWorkOrder(patch);
    },
    onRenameWorkOrderTitle: (nextTitle) => {
      void runWithWorkspaceWriteLock(WORK_ORDER_WRITE_LOCK_MESSAGES.edit, () =>
        actions.handleRenameWorkOrderTitle(nextTitle),
      );
    },
    onConfirmOrderRequest: (payload) => {
      void runWithWorkspaceWriteLock(
        WORK_ORDER_WRITE_LOCK_MESSAGES.orderRequest,
        () => actions.handleConfirmOrderRequest(payload),
      );
    },
    onCloseOrderRequestConfirm: actions.handleCloseOrderRequestConfirm,
    onInventoryApply: (payload) => {
      void runWithWorkspaceWriteLock(WORK_ORDER_WRITE_LOCK_MESSAGES.edit, () =>
        actions.handleInventoryApply(payload),
      );
    },
    onCompleteInspection: (payload) => {
      void runWithWorkspaceWriteLock(
        WORK_ORDER_WRITE_LOCK_MESSAGES.workflow,
        () => actions.handleCompleteInspection(payload),
      );
    },
    onApplyRoles: (rolesByUserId) => {
      void runWithWorkspaceWriteLock(WORK_ORDER_WRITE_LOCK_MESSAGES.edit, () =>
        actions.handleApplyRoles(rolesByUserId),
      );
    },
    onOpenManagerAssignModal: actions.handleOpenManagerAssignModal,
    onCloseManagerAssignModal: actions.handleCloseManagerAssignModal,
    onChangeManager: (managerId) => {
      void runWithWorkspaceWriteLock(WORK_ORDER_WRITE_LOCK_MESSAGES.edit, () =>
        actions.handleChangeManager(managerId),
      );
    },
    onOpenAttachmentPicker: (scope) => {
      if (!isWorkspaceWriteLocked)
        attachments.handleOpenAttachmentPicker(scope);
    },
    onUploadAttachmentFiles: (scope, files) => {
      void runWithWorkspaceWriteLock(
        WORK_ORDER_WRITE_LOCK_MESSAGES.attachment,
        () => attachments.handleAttachmentFileDrop(scope, files),
      );
    },
    onRequestDeleteAttachment: handleRequestDeleteAttachment,
    onSetPrimaryDesignAttachment: (attachmentId) => {
      void runWithWorkspaceWriteLock(
        WORK_ORDER_WRITE_LOCK_MESSAGES.attachment,
        () => attachments.handleSetPrimaryDesignAttachment(attachmentId),
      );
    },
    onAttachmentDeleteConfirmClose: handleCloseDeleteAttachmentConfirm,
    onAttachmentDeleteConfirm: handleConfirmDeleteAttachment,
    onCreateMemoThread: (content) => {
      void runWithWorkspaceWriteLock(WORK_ORDER_WRITE_LOCK_MESSAGES.memo, () =>
        memo.handleCreateMemoThread(content),
      );
    },
    onCreateMemoReply: (threadId, content) => {
      void runWithWorkspaceWriteLock(WORK_ORDER_WRITE_LOCK_MESSAGES.memo, () =>
        memo.handleCreateMemoReply(threadId, content),
      );
    },
    onUpdateMemoThread: (threadId, content) => {
      void runWithWorkspaceWriteLock(WORK_ORDER_WRITE_LOCK_MESSAGES.memo, () =>
        memo.handleUpdateMemoThread(threadId, content),
      );
    },
    onDeleteMemoThread: (threadId) => {
      void runWithWorkspaceWriteLock(WORK_ORDER_WRITE_LOCK_MESSAGES.memo, () =>
        memo.handleDeleteMemoThread(threadId),
      );
    },
    onUpdateMemoReply: (threadId, replyId, content) => {
      void runWithWorkspaceWriteLock(WORK_ORDER_WRITE_LOCK_MESSAGES.memo, () =>
        memo.handleUpdateMemoReply(threadId, replyId, content),
      );
    },
    onDeleteMemoReply: (threadId, replyId) => {
      void runWithWorkspaceWriteLock(WORK_ORDER_WRITE_LOCK_MESSAGES.memo, () =>
        memo.handleDeleteMemoReply(threadId, replyId),
      );
    },
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
        onAttachmentFilesChange={(event) => {
          void runWithWorkspaceWriteLock(
            WORK_ORDER_WRITE_LOCK_MESSAGES.attachment,
            () => attachments.handleAttachmentFiles(event),
          );
        }}
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
