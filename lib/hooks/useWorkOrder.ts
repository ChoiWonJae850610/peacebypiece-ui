"use client";

import { useCallback, useMemo, useState } from "react";
import { DEFAULT_SELECTED_WORK_ORDER_ID, MOCK_HISTORY_LOGS, MOCK_WORK_ORDERS } from "@/lib/data/mock/workorders";
import { DEFAULT_CURRENT_USER_ID, DEFAULT_PERMISSION_TARGET_ID, MOCK_USERS } from "@/lib/data/mock/users";
import {
  canCreateWorkOrderByRoles,
  canUploadOfficialAttachmentsByRoles,
  isAdminRole,
  normalizeRoles,
} from "@/lib/constants/roles";
import { getDisplayStageFromWorkflowState, VISIBLE_STAGES } from "@/lib/constants/workflow";
import { isOfficialAttachment } from "@/lib/permissions/attachments";
import { calculateWorkOrderCosts, createWorkOrderListItem } from "@/lib/workorder/selectors";
import {
  canEditInventoryForWorkflow,
  canManageWorkOrderManager,
  deriveWorkflowStateFromOrderEntries,
  getAvailableWorkflowActions,
} from "@/lib/workorder/workflow";
import { canDeleteWorkOrder, useWorkOrderActions } from "@/lib/hooks/workorder/useWorkOrderActions";
import { useWorkOrderAttachments } from "@/lib/hooks/workorder/useWorkOrderAttachments";
import { useWorkOrderHistory } from "@/lib/hooks/workorder/useWorkOrderHistory";
import { useWorkOrderUIState } from "@/lib/hooks/workorder/useWorkOrderUIState";
import type { HistoryLog, UserProfile, WorkOrder, WorkOrderListItem, WorkflowAction } from "@/types/workorder";

export function useWorkOrder() {
  const uiState = useWorkOrderUIState();

  const [users, setUsers] = useState<UserProfile[]>(MOCK_USERS);
  const [currentUserId, setCurrentUserId] = useState(DEFAULT_CURRENT_USER_ID);
  const [permissionTargetUserId, setPermissionTargetUserId] = useState(DEFAULT_PERMISSION_TARGET_ID);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(MOCK_WORK_ORDERS);
  const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>(MOCK_HISTORY_LOGS);
  const [selectedId, setSelectedId] = useState(DEFAULT_SELECTED_WORK_ORDER_ID);
  const [searchQuery, setSearchQuery] = useState("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "dirty" | "saving">("saved");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(
    MOCK_WORK_ORDERS.find((item) => item.id === DEFAULT_SELECTED_WORK_ORDER_ID)?.lastSavedAt ??
      MOCK_WORK_ORDERS[0]?.lastSavedAt ??
      null,
  );

  const selectedWorkOrder = useMemo(
    () => workOrders.find((item) => item.id === selectedId) ?? workOrders[0],
    [workOrders, selectedId],
  );
  const currentUser = useMemo(() => users.find((user) => user.id === currentUserId) ?? users[0], [users, currentUserId]);
  const currentRoles = normalizeRoles(currentUser.roles, currentUser.role);
  const currentRole = currentUser.role;
  const isAdmin = isAdminRole(currentRoles);
  const canCreateWorkOrder = canCreateWorkOrderByRoles(currentRoles);
  const canReorderWorkOrder = canCreateWorkOrderByRoles(currentRoles);
  const permissionTargetUser = useMemo(
    () => users.find((user) => user.id === permissionTargetUserId) ?? users[0],
    [users, permissionTargetUserId],
  );

  const workflowStateById = useMemo(
    () => Object.fromEntries(workOrders.map((item) => [item.id, deriveWorkflowStateFromOrderEntries(item.workflowState, item.orderEntries)])),
    [workOrders],
  );
  const currentWorkflowState = useMemo(
    () => deriveWorkflowStateFromOrderEntries(selectedWorkOrder.workflowState, selectedWorkOrder.orderEntries),
    [selectedWorkOrder.workflowState, selectedWorkOrder.orderEntries],
  );
  const canChangeManager = canManageWorkOrderManager(currentRoles, currentWorkflowState);
  const currentDisplayStage = getDisplayStageFromWorkflowState(currentWorkflowState);
  const visibleStages = VISIBLE_STAGES;
  const isReviewRequestLocked = currentWorkflowState !== "draft";
  const canUploadOfficialAttachments = canUploadOfficialAttachmentsByRoles(currentRoles) && !isReviewRequestLocked;

  const workOrderList: WorkOrderListItem[] = useMemo(() => workOrders.map(createWorkOrderListItem), [workOrders]);

  const filteredWorkOrderList = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return workOrderList;
    return workOrderList.filter((item) => {
      const fields = [
        item.title,
        item.category1,
        item.category2,
        item.category3,
        item.vendor,
        workflowStateById[item.id] ?? "",
      ];
      return fields.some((field) => String(field ?? "").toLowerCase().includes(normalized));
    });
  }, [searchQuery, workOrderList, workflowStateById]);

  const canSeeProductionSections = currentUser.permissions.canSeeProductionSections;
  const canSeeCostSections = currentUser.permissions.canSeeCostSections;
  const canEditInventory = currentUser.permissions.canEditInventory;
  const canOpenInventoryEditor = canEditInventoryForWorkflow(currentRoles, currentWorkflowState);
  const canSeeInventoryHistorySection = currentUser.permissions.canSeeInventoryHistorySection;
  const canSeeAttachments = currentUser.permissions.canSeeAttachments;

  const currentInventoryQuantity = selectedWorkOrder.inventoryQuantity;
  const officialAttachments = useMemo(
    () => (selectedWorkOrder.attachments ?? []).filter((item) => isOfficialAttachment(item)),
    [selectedWorkOrder.attachments],
  );
  const selectedAttachment = useMemo(
    () => selectedWorkOrder.attachments.find((item) => item.id === uiState.attachmentPreviewId) ?? null,
    [selectedWorkOrder, uiState.attachmentPreviewId],
  );

  const { materials, outsourcing, fabricTotal, subsidiaryTotal, outsourcingTotal, totalCost, unitCost } = useMemo(
    () => calculateWorkOrderCosts(selectedWorkOrder),
    [selectedWorkOrder],
  );

  const historyState = useWorkOrderHistory({
    historyLogs,
    selectedWorkOrderId: selectedWorkOrder.id,
    currentUser,
    isAdmin,
  });

  const availableActions = useMemo(
    () =>
      getAvailableWorkflowActions({
        currentWorkflowState,
        currentRoles,
        currentUserId,
        workOrder: selectedWorkOrder,
      }),
    [currentWorkflowState, currentRoles, currentUserId, selectedWorkOrder],
  );

  const actionState = useWorkOrderActions({
    currentUser,
    canCreateWorkOrder,
    canReorderWorkOrder,
    pendingWorkflowAction: uiState.pendingWorkflowAction,
    setUsers,
    setWorkOrders,
    setHistoryLogs,
    setSelectedId,
    setLastSavedAt,
    setSaveStatus,
    setToastMessage: uiState.setToastMessage,
    setCreateWorkOrderModalOpen: uiState.setCreateWorkOrderModalOpen,
    setInventoryEditorOpen: uiState.setInventoryEditorOpen,
    setManagerAssignModalOpen: uiState.setManagerAssignModalOpen,
    setPendingWorkflowAction: uiState.setPendingWorkflowAction,
    setOrderRequestConfirmOpen: uiState.setOrderRequestConfirmOpen,
  });



  const handleSelectWorkOrder = useCallback((id: string) => {
    setSelectedId(id);
    const next = workOrders.find((item) => item.id === id);
    setLastSavedAt(next?.lastSavedAt ?? null);
    setSaveStatus("saved");
  }, [workOrders, setLastSavedAt, setSaveStatus]);

  const handleOpenManagerAssignModal = useCallback(() => {
    actionState.handleOpenManagerAssignModal({ canChangeManager, isReviewRequestLocked });
  }, [actionState, canChangeManager, isReviewRequestLocked]);

  const attachmentState = useWorkOrderAttachments({
    attachmentInputRef: uiState.attachmentInputRef,
    canUploadOfficialAttachments,
    isReviewRequestLocked,
    currentUser,
    selectedWorkOrder,
    attachmentPreviewId: uiState.attachmentPreviewId,
    setAttachmentPreviewId: uiState.setAttachmentPreviewId,
    setWorkOrders,
    setHistoryLogs,
    setSaveStatus,
    setToastMessage: uiState.setToastMessage,
  });

  return {
    appShellRef: uiState.appShellRef,
    attachmentInputRef: uiState.attachmentInputRef,
    drawerOpen: uiState.drawerOpen,
    setDrawerOpen: uiState.setDrawerOpen,
    basicInfoOpen: uiState.basicInfoOpen,
    setBasicInfoOpen: uiState.setBasicInfoOpen,
    materialOpen: uiState.materialOpen,
    setMaterialOpen: uiState.setMaterialOpen,
    outsourcingOpen: uiState.outsourcingOpen,
    setOutsourcingOpen: uiState.setOutsourcingOpen,
    inventoryEditorOpen: uiState.inventoryEditorOpen,
    setInventoryEditorOpen: uiState.setInventoryEditorOpen,
    permissionModalOpen: uiState.permissionModalOpen,
    setPermissionModalOpen: uiState.setPermissionModalOpen,
    createWorkOrderModalOpen: uiState.createWorkOrderModalOpen,
    setCreateWorkOrderModalOpen: uiState.setCreateWorkOrderModalOpen,
    managerAssignModalOpen: uiState.managerAssignModalOpen,
    setManagerAssignModalOpen: uiState.setManagerAssignModalOpen,
    inventoryLogModalOpen: uiState.inventoryLogModalOpen,
    setInventoryLogModalOpen: uiState.setInventoryLogModalOpen,
    adminPanelModalOpen: uiState.adminPanelModalOpen,
    setAdminPanelModalOpen: uiState.setAdminPanelModalOpen,
    attachmentPreviewId: uiState.attachmentPreviewId,
    setAttachmentPreviewId: uiState.setAttachmentPreviewId,
    orderRequestConfirmOpen: uiState.orderRequestConfirmOpen,
    pendingWorkflowAction: uiState.pendingWorkflowAction,
    toastMessage: uiState.toastMessage,
    users,
    currentUserId,
    setCurrentUserId,
    permissionTargetUserId: permissionTargetUser?.id ?? users[0]?.id ?? "",
    setPermissionTargetUserId,
    historyFilter: historyState.historyFilter,
    setHistoryFilter: historyState.setHistoryFilter,
    notificationSettings: historyState.notificationSettings,
    handleToggleNotificationSetting: historyState.handleToggleNotificationSetting,
    searchQuery,
    setSearchQuery,
    workOrders: filteredWorkOrderList,
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
    filteredHistoryLogs: historyState.filteredHistoryLogs,
    inventoryLogs: historyState.inventoryLogs,
    officialAttachments,
    selectedAttachment,
    canDeleteAttachment: attachmentState.canDeleteAttachment,
    materials,
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
    handleSave: () => actionState.handleSave(selectedWorkOrder),
    handleSelectWorkOrder,
    canDeleteWorkOrder,
    handleCreateWorkOrder: (payload?: { title: string; category1: string; category2: string; category3: string; season: string }) =>
      actionState.handleCreateWorkOrder({ nextIndex: workOrders.length + 1, ...(payload ?? {}) }),
    handleReorderWorkOrder: (workOrderId: string) => actionState.handleReorderWorkOrder(workOrders, workOrderId),
    handleDeleteWorkOrder: (workOrderId: string) => actionState.handleDeleteWorkOrder({ workOrderId, workOrders, selectedId }),
    handleWorkflowAction: (action: WorkflowAction) => actionState.handleWorkflowAction(selectedWorkOrder, action),
    handleUpdateSelectedWorkOrder: (patch: Partial<WorkOrder>) =>
      actionState.handleUpdateSelectedWorkOrder({
        workOrderId: selectedWorkOrder.id,
        patch,
        isReviewRequestLocked,
      }),
    handleRenameWorkOrderTitle: (nextTitle: string) =>
      actionState.handleRenameWorkOrderTitle({
        workOrders,
        workOrder: selectedWorkOrder,
        nextTitle,
      }),
    handleConfirmOrderRequest: () => actionState.handleConfirmOrderRequest(selectedWorkOrder),
    handleCloseOrderRequestConfirm: actionState.handleCloseOrderRequestConfirm,
    handleInventoryApply: (payload: { inboundQuantity: number; adjustmentQuantity: number; deductionQuantity: number; memo: string }) =>
      actionState.handleInventoryApply(selectedWorkOrder.id, payload),
    handleCompleteInspection: (payload: { orderEntryId: string; inboundQuantity: number; nextInventoryQuantity: number; memo: string }) =>
      actionState.handleCompleteInspection({ workOrderId: selectedWorkOrder.id, ...payload }),
    handleApplyRoles: actionState.handleApplyRoles,
    handleOpenManagerAssignModal,
    handleCloseManagerAssignModal: actionState.handleCloseManagerAssignModal,
    handleChangeManager: (managerId: string) =>
      actionState.handleChangeManager({
        workOrder: selectedWorkOrder,
        managerId,
        users,
        canChangeManager,
        isReviewRequestLocked,
      }),
    handleOpenAttachmentPicker: attachmentState.handleOpenAttachmentPicker,
    handleAttachmentFiles: attachmentState.handleAttachmentFiles,
    handleDeleteAttachment: attachmentState.handleDeleteAttachment,
    handleCreateMemoThread: attachmentState.handleCreateMemoThread,
    handleCreateMemoReply: attachmentState.handleCreateMemoReply,
    handlePromoteMemoAttachment: attachmentState.handlePromoteMemoAttachment,
  };
}
