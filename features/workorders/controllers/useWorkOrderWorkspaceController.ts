"use client";

import { useMemo, useState, type ChangeEvent } from "react";

import { useDbConnectionStatus } from "@/lib/hooks/workorder/useDbConnectionStatus";
import { useWorkOrder } from "@/lib/hooks/useWorkOrder";
import { useI18n } from "@/lib/i18n";
import { buildWorkspaceHomeNavigation } from "@/lib/navigation/workspaceHomeRoutes";
import { traceWaflFlow, traceWaflResult } from "@/lib/debug/trace";
import { RUNTIME_VISIBILITY } from "@/lib/runtime/runtimeMode";
import {
  DEFAULT_WORK_ORDER_LIST_SORT,
  DEFAULT_WORK_ORDER_LIST_STATUS_FILTER,
  type WorkOrderListSort,
  type WorkOrderListStatusFilter,
} from "@/lib/workorder/list/workOrderListControls";
import { getPendingAttachmentDelete } from "@/lib/workorder/presentation/workOrderWorkspacePresentation";
import { buildWorkspaceViewModel } from "@/lib/workorder/workspace/buildWorkspaceViewModel";
import type { RoleType } from "@/types/permission";
import type { WorkOrder } from "@/types/workorder";

export type UseWorkOrderWorkspaceControllerOptions = {
  initialWorkOrderId?: string | null;
  initialListStatusFilter?: WorkOrderListStatusFilter;
  initialListSort?: WorkOrderListSort;
  initialSearchQuery?: string;
  initialHomeRole?: RoleType | null;
  initialCompanyName?: string | null;
};

export function useWorkOrderWorkspaceController({
  initialWorkOrderId = null,
  initialListStatusFilter,
  initialListSort,
  initialSearchQuery,
  initialHomeRole = null,
  initialCompanyName = null,
}: UseWorkOrderWorkspaceControllerOptions) {
  const { i18n } = useI18n();
  const workOrder = useWorkOrder({
    initialWorkOrderId,
    initialListStatusFilter,
    initialListSort,
    initialSearchQuery,
  });
  const dbConnectionStatus = useDbConnectionStatus();
  const showRepositoryBadges = RUNTIME_VISIBILITY.showRepositoryBadges;
  const showUserSwitchingTools = RUNTIME_VISIBILITY.showUserSwitchingTools;

  const {
    ui,
    identity,
    history,
    selection,
    permissions,
    attachments,
    memo,
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
  const [manualWriteLockMessage, setManualWriteLockMessage] = useState<string | null>(null);

  const renderHasSelection = selection.hasVisibleWorkOrders && selection.hasActiveSelection;
  const isRepositoryLoading = repository.repositoryStatus === "loading";
  const isSelectedDetailLoading = Boolean(renderHasSelection && selection.isSelectedWorkOrderDetailLoading);
  const isCreatingWorkOrder = runtime.actionStatusMap.create === "loading";
  const loadingCopy = i18n.workorder.ui.layout.sidebarControls;
  const lifecycleCopy = i18n.workorder.lifecycle;
  const processingFormat = i18n.workorder.ui.actionSection.processingFormat;
  const lifecycleProcessingLabel = (() => {
    if (runtime.actionStatusMap.create === "loading") return lifecycleCopy.createProcessingLabel;
    if (runtime.actionStatusMap.reorder === "loading") return lifecycleCopy.reorderProcessingLabel;
    if (runtime.actionStatusMap.delete === "loading") return lifecycleCopy.deleteProcessingLabel;
    return null;
  })();
  const workflowWriteLockMessage = workflowProcessingLabel
    ? processingFormat.replace("{label}", workflowProcessingLabel.replace(/\s+/g, ""))
    : null;
  const persistenceProcessingLabel = persistence.saveStatus === "saving" ? lifecycleCopy.editProcessingLabel : null;
  const selectedDetailLoadingMessage = isSelectedDetailLoading ? loadingCopy.loadingDetailTitle : null;
  const workspaceWriteLockMessage =
    manualWriteLockMessage ??
    lifecycleProcessingLabel ??
    workflowWriteLockMessage ??
    persistenceProcessingLabel ??
    selectedDetailLoadingMessage ??
    undefined;
  const isWorkspaceWriteLocked = Boolean(
    manualWriteLockMessage ||
      lifecycleProcessingLabel ||
      workflowProcessingLabel ||
      persistenceProcessingLabel ||
      selectedDetailLoadingMessage,
  );

  const runWithWorkspaceWriteLock = async <T,>(message: string, task: () => T | Promise<T>) => {
    if (isWorkspaceWriteLocked) {
      traceWaflResult("workorder.workspace.writeLock", "skip", { reason: "locked" });
      return undefined;
    }

    traceWaflFlow("action", "workorder.workspace.writeLock.start");
    setManualWriteLockMessage(message);
    try {
      const result = await Promise.resolve(task());
      traceWaflResult("workorder.workspace.writeLock", "success");
      return result;
    } catch (error) {
      traceWaflResult("workorder.workspace.writeLock", "error", {
        message: error instanceof Error ? error.message : "unknown",
      });
      throw error;
    } finally {
      setManualWriteLockMessage(null);
    }
  };

  const workspaceLoadingState = {
    isRepositoryLoading: isRepositoryLoading || isSelectedDetailLoading,
    detailTitle: loadingCopy.loadingDetailTitle,
    detailDescription: loadingCopy.loadingDetailDescription,
    sideTitle: loadingCopy.loadingSideTitle,
    sideDescription: loadingCopy.loadingSideDescription,
  };
  const homeNavigationCopy = i18n.workorder.ui.layout.homeNavigation;
  const workspaceHomeRole = initialHomeRole ?? identity.currentRole;
  const homeNavigation = buildWorkspaceHomeNavigation(workspaceHomeRole, {
    fallbackLabel: homeNavigationCopy.label,
    fallbackAriaLabel: homeNavigationCopy.ariaLabel,
    targetLabels: homeNavigationCopy.targetLabels,
    targetAriaLabels: homeNavigationCopy.targetAriaLabels,
  });

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

  const handleOpenWorkOrderDeleteConfirm = (workOrderId: string) => {
    if (isWorkspaceWriteLocked) return;
    traceWaflFlow("action", "workorder.delete.openConfirm", { workOrderId });
    setPendingWorkOrderDeleteId(workOrderId);
  };

  const handleCloseWorkOrderDeleteConfirm = () => {
    setPendingWorkOrderDeleteId(null);
  };

  const handleConfirmWorkOrderDelete = () => {
    if (isWorkspaceWriteLocked || !pendingWorkOrderDeleteId) return;

    const workOrderId = pendingWorkOrderDeleteId;
    traceWaflFlow("action", "workorder.delete.confirm", { workOrderId });
    setPendingWorkOrderDeleteId(null);
    void runWithWorkspaceWriteLock(lifecycleCopy.deleteProcessingLabel, () =>
      actions.handleDeleteWorkOrder(workOrderId),
    );
  };

  const handleOpenAttachmentDeleteConfirm = (attachmentId: string) => {
    if (isWorkspaceWriteLocked) return;
    traceWaflFlow("action", "workorder.attachment.delete.openConfirm", { attachmentId });
    setPendingAttachmentDeleteId(attachmentId);
  };

  const handleCloseAttachmentDeleteConfirm = () => {
    setPendingAttachmentDeleteId(null);
  };

  const handleConfirmAttachmentDelete = () => {
    if (isWorkspaceWriteLocked || !pendingAttachmentDeleteId) return;

    const attachmentId = pendingAttachmentDeleteId;
    traceWaflFlow("action", "workorder.attachment.delete.confirm", { attachmentId });
    setPendingAttachmentDeleteId(null);
    void runWithWorkspaceWriteLock(lifecycleCopy.attachmentProcessingLabel, () =>
      attachments.handleDeleteAttachment(attachmentId),
    );
  };

  const handleSubmitWorkflowActionWithProcessing = async (
    action: Parameters<typeof actions.handleWorkflowAction>[0],
    workOrderOverride?: WorkOrder,
  ) => {
    traceWaflFlow("action", "workorder.workflow.submit", {
      actionId: "id" in action ? String(action.id) : action.label,
      workOrderId: workOrderOverride?.id ?? selection.selectedId,
    });
    setWorkflowProcessingLabel(action.label);
    try {
      await actions.handleWorkflowAction(action, workOrderOverride);
    } finally {
      setWorkflowProcessingLabel(null);
    }
  };

  const replaceWorkOrderListQuery = (next: {
    status?: WorkOrderListStatusFilter;
    sort?: WorkOrderListSort;
    searchQuery?: string;
  }) => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    const nextStatus = next.status ?? selection.listStatusFilter;
    const nextSort = next.sort ?? selection.listSort;
    const nextSearchQuery = next.searchQuery ?? selection.searchQuery;

    url.searchParams.set("status", nextStatus);
    url.searchParams.set("sort", nextSort);
    if (nextSearchQuery.trim()) url.searchParams.set("q", nextSearchQuery.trim());
    else url.searchParams.delete("q");
    url.searchParams.delete("workOrderId");
    const nextQuery = url.searchParams.toString();
    window.history.replaceState(null, "", nextQuery ? `${url.pathname}?${nextQuery}` : url.pathname);
  };

  const replaceSelectedWorkOrderQuery = (workOrderId: string) => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    url.searchParams.set("workOrderId", workOrderId);
    const nextQuery = url.searchParams.toString();
    window.history.replaceState(null, "", nextQuery ? `${url.pathname}?${nextQuery}` : url.pathname);
  };

  const handleChangeWorkOrderSearchQuery = (nextSearchQuery: string) => {
    traceWaflFlow("action", "workorder.list.search", { hasQuery: Boolean(nextSearchQuery.trim()) });
    replaceWorkOrderListQuery({ searchQuery: nextSearchQuery });
    selection.setSearchQuery(nextSearchQuery);
  };

  const handleChangeWorkOrderStatusFilter = (nextStatus: WorkOrderListStatusFilter) => {
    if (isWorkspaceWriteLocked) return;
    traceWaflFlow("action", "workorder.list.statusFilter", { status: nextStatus });
    replaceWorkOrderListQuery({ status: nextStatus });
    selection.setListStatusFilter(nextStatus);
  };

  const handleChangeWorkOrderListSort = (nextSort: WorkOrderListSort) => {
    if (isWorkspaceWriteLocked) return;
    traceWaflFlow("action", "workorder.list.sort", { sort: nextSort });
    replaceWorkOrderListQuery({ sort: nextSort });
    selection.setListSort(nextSort);
  };

  const handleResetWorkOrderListControls = () => {
    if (isWorkspaceWriteLocked) return;

    traceWaflFlow("action", "workorder.list.resetControls");
    replaceWorkOrderListQuery({
      status: DEFAULT_WORK_ORDER_LIST_STATUS_FILTER,
      sort: DEFAULT_WORK_ORDER_LIST_SORT,
      searchQuery: "",
    });
    selection.setSearchQuery("");
    selection.setListStatusFilter(DEFAULT_WORK_ORDER_LIST_STATUS_FILTER);
    selection.setListSort(DEFAULT_WORK_ORDER_LIST_SORT);
  };

  const handleSelectWorkOrder = (workOrderId: string) => {
    if (isWorkspaceWriteLocked) return;
    if (workOrderId === selection.selectedId) return;

    traceWaflFlow("action", "workorder.select", { workOrderId });
    replaceSelectedWorkOrderQuery(workOrderId);
    actions.handleSelectWorkOrder(workOrderId);
  };

  const viewModel = buildWorkspaceViewModel({
    companyName: initialCompanyName,
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
    workflowValidationModal: actions.workflowValidationModal,
    rejectReviewReasonModal: actions.rejectReviewReasonModal,
    users: identity.users,
    currentUserId: identity.currentUserId,
    permissionTargetUserId: identity.permissionTargetUserId,
    historyFilter: history.historyFilter,
    searchQuery: selection.searchQuery,
    listStatusFilter: selection.listStatusFilter,
    listSort: selection.listSort,
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
    onSetSearchQuery: handleChangeWorkOrderSearchQuery,
    onSetListStatusFilter: handleChangeWorkOrderStatusFilter,
    onSetListSort: handleChangeWorkOrderListSort,
    onResetListControls: handleResetWorkOrderListControls,
    dbConnectionStatus: showRepositoryBadges ? dbConnectionStatus : undefined,
    showRepositoryBadges,
    showUserSwitchingTools,
    onSetHistoryFilter: history.setHistoryFilter,
    onSave: (workOrderOverride) => {
      void runWithWorkspaceWriteLock(lifecycleCopy.editProcessingLabel, () =>
        actions.handleSave(workOrderOverride),
      );
    },
    onSelectWorkOrder: handleSelectWorkOrder,
    onCreateWorkOrder: (payload) => {
      void runWithWorkspaceWriteLock(lifecycleCopy.createProcessingLabel, () =>
        actions.handleCreateWorkOrder(payload),
      );
    },
    onDeleteWorkOrder: handleOpenWorkOrderDeleteConfirm,
    onReorderWorkOrder: (id) => {
      void runWithWorkspaceWriteLock(lifecycleCopy.reorderProcessingLabel, () =>
        actions.handleReorderWorkOrder(id),
      );
    },
    onReworkWorkOrder: (id) => {
      void runWithWorkspaceWriteLock(lifecycleCopy.editProcessingLabel, () =>
        actions.handleReworkWorkOrder(id),
      );
    },
    onWorkflowAction: handleSubmitWorkflowActionWithProcessing,
    onUpdateSelectedWorkOrder: (patch) => {
      void actions.handleUpdateSelectedWorkOrder(patch);
    },
    onRenameWorkOrderTitle: (nextTitle) => {
      void runWithWorkspaceWriteLock(lifecycleCopy.editProcessingLabel, () =>
        actions.handleRenameWorkOrderTitle(nextTitle),
      );
    },
    onConfirmOrderRequest: (payload) => {
      void runWithWorkspaceWriteLock(lifecycleCopy.orderRequestProcessingLabel, () =>
        actions.handleConfirmOrderRequest(payload),
      );
    },
    onCloseOrderRequestConfirm: actions.handleCloseOrderRequestConfirm,
    onInventoryApply: (payload) => {
      void runWithWorkspaceWriteLock(lifecycleCopy.editProcessingLabel, () =>
        actions.handleInventoryApply(payload),
      );
    },
    onCompleteInspection: (payload) => {
      void runWithWorkspaceWriteLock(lifecycleCopy.workflowProcessingLabel, () =>
        actions.handleCompleteInspection(payload),
      );
    },
    onApplyRoles: (userId, roles) => {
      void runWithWorkspaceWriteLock(lifecycleCopy.editProcessingLabel, () =>
        actions.handleApplyRoles(userId, roles),
      );
    },
    onOpenManagerAssignModal: actions.handleOpenManagerAssignModal,
    onCloseManagerAssignModal: actions.handleCloseManagerAssignModal,
    onChangeManager: (managerId) => {
      void runWithWorkspaceWriteLock(lifecycleCopy.editProcessingLabel, () =>
        actions.handleChangeManager(managerId),
      );
    },
    onOpenAttachmentPicker: (scope) => {
      if (!isWorkspaceWriteLocked) attachments.handleOpenAttachmentPicker(scope);
    },
    onUploadAttachmentFiles: (scope, files) => {
      void runWithWorkspaceWriteLock(lifecycleCopy.attachmentProcessingLabel, () =>
        attachments.handleAttachmentFileDrop(scope, files),
      );
    },
    onRequestDeleteAttachment: handleOpenAttachmentDeleteConfirm,
    onSetPrimaryDesignAttachment: (attachmentId) => {
      void runWithWorkspaceWriteLock(lifecycleCopy.attachmentProcessingLabel, () =>
        attachments.handleSetPrimaryDesignAttachment(attachmentId),
      );
    },
    onGenerateOrderRequestPdf: (workOrderId) => {
      void runWithWorkspaceWriteLock(lifecycleCopy.orderRequestPdfProcessingLabel, () =>
        actions.handleGenerateOrderRequestPdf(workOrderId),
      );
    },
    onAttachmentDeleteConfirmClose: handleCloseAttachmentDeleteConfirm,
    onAttachmentDeleteConfirm: handleConfirmAttachmentDelete,
    onCreateMemoThread: (content) => {
      void runWithWorkspaceWriteLock(lifecycleCopy.memoProcessingLabel, () =>
        memo.handleCreateMemoThread(content),
      );
    },
    onCreateMemoReply: (threadId, content) => {
      void runWithWorkspaceWriteLock(lifecycleCopy.memoProcessingLabel, () =>
        memo.handleCreateMemoReply(threadId, content),
      );
    },
    onUpdateMemoThread: (threadId, content) => {
      void runWithWorkspaceWriteLock(lifecycleCopy.memoProcessingLabel, () =>
        memo.handleUpdateMemoThread(threadId, content),
      );
    },
    onDeleteMemoThread: (threadId) => {
      void runWithWorkspaceWriteLock(lifecycleCopy.memoProcessingLabel, () =>
        memo.handleDeleteMemoThread(threadId),
      );
    },
    onUpdateMemoReply: (threadId, replyId, content) => {
      void runWithWorkspaceWriteLock(lifecycleCopy.memoProcessingLabel, () =>
        memo.handleUpdateMemoReply(threadId, replyId, content),
      );
    },
    onDeleteMemoReply: (threadId, replyId) => {
      void runWithWorkspaceWriteLock(lifecycleCopy.memoProcessingLabel, () =>
        memo.handleDeleteMemoReply(threadId, replyId),
      );
    },
  });

  return {
    layoutProps: {
      appShellRef: ui.appShellRef,
      selectedId: renderHasSelection ? selection.selectedId : "",
      hasSelection: renderHasSelection,
      sidebarListProps: viewModel.sidebarListProps,
      detailProps: viewModel.detailProps,
      sidePanelProps: viewModel.sidePanelProps,
      mobileTopBarProps: viewModel.mobileTopBarProps,
      mobileDrawerProps: viewModel.mobileDrawerProps,
      loadingState: workspaceLoadingState,
      homeNavigation,
    },
    overlayProps: {
      attachmentInputRef: ui.attachmentInputRef,
      attachmentInputAccept: attachments.attachmentInputAccept,
      onAttachmentFilesChange: (event: ChangeEvent<HTMLInputElement>) => {
        void runWithWorkspaceWriteLock(lifecycleCopy.attachmentProcessingLabel, () =>
          attachments.handleAttachmentFiles(event),
        );
      },
      writeLocked: isWorkspaceWriteLocked,
      writeLockMessage: workspaceWriteLockMessage,
      toastMessage: ui.toastMessage,
      modalProps: {
        ...viewModel.modalProps,
        createWorkOrder: {
          ...viewModel.modalProps.createWorkOrder,
          isCreating: isCreatingWorkOrder,
        },
      },
    },
    workOrderDeleteConfirmProps: {
      open: Boolean(pendingWorkOrderDelete),
      workOrder: pendingWorkOrderDelete,
      onClose: handleCloseWorkOrderDeleteConfirm,
      onConfirm: handleConfirmWorkOrderDelete,
    },
  };
}
