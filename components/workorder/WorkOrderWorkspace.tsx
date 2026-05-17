"use client";

import { useMemo, useState } from "react";

import WorkOrderLayout from "@/components/workorder/WorkOrderLayout";
import WorkOrderOverlay from "@/components/workorder/WorkOrderOverlay";
import WorkOrderDeleteConfirmModal from "@/components/common/modal/WorkOrderDeleteConfirmModal";
import { useWorkOrder } from "@/lib/hooks/useWorkOrder";
import { useDbConnectionStatus } from "@/lib/hooks/workorder/useDbConnectionStatus";
import { getPendingAttachmentDelete } from "@/lib/workorder/presentation/workOrderWorkspacePresentation";

import { useI18n } from "@/lib/i18n";
import {
  DEFAULT_WORK_ORDER_LIST_SORT,
  DEFAULT_WORK_ORDER_LIST_STATUS_FILTER,
} from "@/lib/workorder/list/workOrderListControls";
import type { WorkOrderListSort, WorkOrderListStatusFilter } from "@/lib/workorder/list/workOrderListControls";
import { buildWorkspaceHomeNavigation } from "@/lib/navigation/workspaceHomeRoutes";
import type { RoleType } from "@/types/permission";
import { RUNTIME_VISIBILITY } from "@/lib/runtime/runtimeMode";

import { buildWorkspaceViewModel } from "@/lib/workorder/workspace/buildWorkspaceViewModel";

type WorkOrderWorkspaceProps = {
  initialWorkOrderId?: string | null;
  initialListStatusFilter?: WorkOrderListStatusFilter;
  initialListSort?: WorkOrderListSort;
  initialSearchQuery?: string;
  initialHomeRole?: RoleType | null;
  initialCompanyName?: string | null;
};

export default function WorkOrderWorkspace({
  initialWorkOrderId = null,
  initialListStatusFilter,
  initialListSort,
  initialSearchQuery,
  initialHomeRole = null,
  initialCompanyName = null,
}: WorkOrderWorkspaceProps) {
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
  const isSelectedDetailLoading = Boolean(
    renderHasSelection && selection.isSelectedWorkOrderDetailLoading,
  );
  const isCreatingWorkOrder = runtime.actionStatusMap.create === "loading";
  const loadingCopy = i18n.workorder.ui.layout.sidebarControls;
  const lifecycleCopy = i18n.workorder.lifecycle;
  const processingFormat = i18n.workorder.ui.actionSection.processingFormat;
  const lifecycleProcessingLabel = (() => {
    if (runtime.actionStatusMap.create === "loading") {
      return lifecycleCopy.createProcessingLabel;
    }
    if (runtime.actionStatusMap.reorder === "loading") {
      return lifecycleCopy.reorderProcessingLabel;
    }
    if (runtime.actionStatusMap.delete === "loading") {
      return lifecycleCopy.deleteProcessingLabel;
    }
    return null;
  })();
  const workflowWriteLockMessage = workflowProcessingLabel
    ? processingFormat.replace("{label}", workflowProcessingLabel.replace(/\s+/g, ""))
    : null;
  const persistenceProcessingLabel =
    persistence.saveStatus === "saving" ? lifecycleCopy.editProcessingLabel : null;
  const selectedDetailLoadingMessage = isSelectedDetailLoading
    ? loadingCopy.loadingDetailTitle
    : null;
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
      lifecycleCopy.deleteProcessingLabel,
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
      lifecycleCopy.attachmentProcessingLabel,
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


  const updateWorkerListQuery = (next: {
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
    if (nextSearchQuery.trim()) {
      url.searchParams.set("q", nextSearchQuery.trim());
    } else {
      url.searchParams.delete("q");
    }
    url.searchParams.delete("workOrderId");
    const nextQuery = url.searchParams.toString();
    window.history.replaceState(null, "", nextQuery ? `${url.pathname}?${nextQuery}` : url.pathname);
  };

  const handleSearchQueryChange = (nextSearchQuery: string) => {
    updateWorkerListQuery({ searchQuery: nextSearchQuery });
    selection.setSearchQuery(nextSearchQuery);
  };

  const handleListStatusFilterChange = (nextStatus: WorkOrderListStatusFilter) => {
    if (isWorkspaceWriteLocked) return;
    updateWorkerListQuery({ status: nextStatus });
    selection.setListStatusFilter(nextStatus);
  };

  const handleListSortChange = (nextSort: WorkOrderListSort) => {
    if (isWorkspaceWriteLocked) return;
    updateWorkerListQuery({ sort: nextSort });
    selection.setListSort(nextSort);
  };

  const handleResetListControls = () => {
    if (isWorkspaceWriteLocked) return;

    updateWorkerListQuery({
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

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("workOrderId", workOrderId);
      const nextQuery = url.searchParams.toString();
      window.history.replaceState(null, "", nextQuery ? `${url.pathname}?${nextQuery}` : url.pathname);
    }

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
    onSetSearchQuery: handleSearchQueryChange,
    onSetListStatusFilter: handleListStatusFilterChange,
    onSetListSort: handleListSortChange,
    onResetListControls: handleResetListControls,
    dbConnectionStatus: showRepositoryBadges ? dbConnectionStatus : undefined,
    showRepositoryBadges,
    showUserSwitchingTools,
    onSetHistoryFilter: history.setHistoryFilter,
    onSave: () => {
      void runWithWorkspaceWriteLock(lifecycleCopy.editProcessingLabel, () =>
        actions.handleSave(),
      );
    },
    onSelectWorkOrder: handleSelectWorkOrder,
    onCreateWorkOrder: (payload) => {
      void runWithWorkspaceWriteLock(
        lifecycleCopy.createProcessingLabel,
        () => actions.handleCreateWorkOrder(payload),
      );
    },
    onDeleteWorkOrder: handleRequestDeleteWorkOrder,
    onReorderWorkOrder: (id) => {
      void runWithWorkspaceWriteLock(
        lifecycleCopy.reorderProcessingLabel,
        () => actions.handleReorderWorkOrder(id),
      );
    },
    onReworkWorkOrder: (id) => {
      void runWithWorkspaceWriteLock(lifecycleCopy.editProcessingLabel, () =>
        actions.handleReworkWorkOrder(id),
      );
    },
    onWorkflowAction: handleWorkflowActionWithProcessing,
    onUpdateSelectedWorkOrder: (patch) => {
      void actions.handleUpdateSelectedWorkOrder(patch);
    },
    onRenameWorkOrderTitle: (nextTitle) => {
      void runWithWorkspaceWriteLock(lifecycleCopy.editProcessingLabel, () =>
        actions.handleRenameWorkOrderTitle(nextTitle),
      );
    },
    onConfirmOrderRequest: (payload) => {
      void runWithWorkspaceWriteLock(
        lifecycleCopy.orderRequestProcessingLabel,
        () => actions.handleConfirmOrderRequest(payload),
      );
    },
    onCloseOrderRequestConfirm: actions.handleCloseOrderRequestConfirm,
    onInventoryApply: (payload) => {
      void runWithWorkspaceWriteLock(lifecycleCopy.editProcessingLabel, () =>
        actions.handleInventoryApply(payload),
      );
    },
    onCompleteInspection: (payload) => {
      void runWithWorkspaceWriteLock(
        lifecycleCopy.workflowProcessingLabel,
        () => actions.handleCompleteInspection(payload),
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
      if (!isWorkspaceWriteLocked)
        attachments.handleOpenAttachmentPicker(scope);
    },
    onUploadAttachmentFiles: (scope, files) => {
      void runWithWorkspaceWriteLock(
        lifecycleCopy.attachmentProcessingLabel,
        () => attachments.handleAttachmentFileDrop(scope, files),
      );
    },
    onRequestDeleteAttachment: handleRequestDeleteAttachment,
    onSetPrimaryDesignAttachment: (attachmentId) => {
      void runWithWorkspaceWriteLock(
        lifecycleCopy.attachmentProcessingLabel,
        () => attachments.handleSetPrimaryDesignAttachment(attachmentId),
      );
    },
    onAttachmentDeleteConfirmClose: handleCloseDeleteAttachmentConfirm,
    onAttachmentDeleteConfirm: handleConfirmDeleteAttachment,
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
        homeNavigation={homeNavigation}
      />

      <WorkOrderOverlay
        attachmentInputRef={ui.attachmentInputRef}
        attachmentInputAccept={attachments.attachmentInputAccept}
        onAttachmentFilesChange={(event) => {
          void runWithWorkspaceWriteLock(
            lifecycleCopy.attachmentProcessingLabel,
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
