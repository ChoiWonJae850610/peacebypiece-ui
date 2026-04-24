import {
  canCreateWorkOrderByRoles,
  canUploadOfficialAttachmentsByRoles,
  isAdminRole,
  normalizeRoles,
} from "@/lib/constants/roles";
import { getDisplayStageFromWorkflowState, VISIBLE_STAGES } from "@/lib/constants/workflow";
import { isWorkflowStateReviewLocked } from "@/lib/constants/workorderStates";
import { getAttachmentCollectionPermissionState } from "@/lib/workorder/attachments/attachmentPermissions";
import {
  calculateWorkOrderCosts,
  createWorkOrderListItem,
  deriveWorkflowStateById,
  filterWorkOrderList,
  filterWorkOrdersByUserScope,
  getAttachmentById,
  getDesignAttachments,
  getOfficialAttachments,
  canEditWorkOrderAttachments,
  canEditWorkOrderMemo,
  canRenameWorkOrderTitle,
  isWorkOrderSideDraftEditable,
} from "@/lib/workorder/selectors";
import { getSharedInventorySnapshot } from "@/lib/workorder/reorder/inventory";
import {
  canEditInventoryForWorkflow,
  canManageWorkOrderManager,
  deriveWorkflowStateFromOrderEntries,
  getAvailableWorkflowActions,
} from "@/lib/workorder/workflow";
import type { BuildWorkOrderDerivedStateParams } from "@/lib/hooks/workorder/derived/types";

export function buildWorkOrderDerivedState({
  users,
  currentUser,
  currentUserId,
  permissionTargetUserId,
  workOrders,
  selectedWorkOrder,
  searchQuery,
  attachmentPreviewId,
}: BuildWorkOrderDerivedStateParams) {
  const currentRoles = normalizeRoles(currentUser.roles, currentUser.role);
  const currentRole = currentUser.role;
  const isAdmin = isAdminRole(currentRoles);
  const canCreateWorkOrder = canCreateWorkOrderByRoles(currentRoles);
  const canReorderWorkOrder = canCreateWorkOrderByRoles(currentRoles);
  const permissionTargetUser = users.find((user) => user.id === permissionTargetUserId) ?? users[0];
  const workflowStateById = deriveWorkflowStateById(workOrders);
  const currentWorkflowState = deriveWorkflowStateFromOrderEntries(selectedWorkOrder.workflowState, selectedWorkOrder.orderEntries);
  const canChangeManager = canManageWorkOrderManager(currentRoles, currentWorkflowState);
  const currentDisplayStage = getDisplayStageFromWorkflowState(currentWorkflowState);
  const visibleStages = VISIBLE_STAGES;
  const isReviewRequestLocked = isWorkflowStateReviewLocked(currentWorkflowState, isAdmin);
  const canEditSideDraftContent = isWorkOrderSideDraftEditable(currentWorkflowState);
  const canEditMemo = canEditWorkOrderMemo(currentWorkflowState);
  const canRenameTitle = canRenameWorkOrderTitle(currentUser, currentWorkflowState);
  const canSeeAttachments = currentUser.permissions.canSeeAttachments;
  const attachmentCollectionPermissions = getAttachmentCollectionPermissionState({
    canSeeAttachments,
    canManageAttachments: canUploadOfficialAttachmentsByRoles(currentRoles),
    isReviewRequestLocked: !canEditSideDraftContent,
  });
  const canUploadOfficialAttachments = canEditWorkOrderAttachments(currentWorkflowState, canSeeAttachments, attachmentCollectionPermissions.canUpload);
  const scopedWorkOrders = filterWorkOrdersByUserScope(workOrders, workflowStateById, currentUser);
  const workOrderList = scopedWorkOrders.map(createWorkOrderListItem);
  const filteredWorkOrderList = filterWorkOrderList(workOrderList, workflowStateById, searchQuery);
  const hasActiveSelection = filteredWorkOrderList.some((item) => item.id === selectedWorkOrder.id);
  const canSeeProductionSections = currentUser.permissions.canSeeProductionSections;
  const canSeeCostSections = currentUser.permissions.canSeeCostSections;
  const canEditInventory = currentUser.permissions.canEditInventory;
  const canOpenInventoryEditor = canEditInventoryForWorkflow(currentRoles, currentWorkflowState);
  const canSeeInventoryHistorySection = currentUser.permissions.canSeeInventoryHistorySection;
  const currentInventoryQuantity = getSharedInventorySnapshot(workOrders, selectedWorkOrder).inventoryQuantity;
  const designAttachments = getDesignAttachments(selectedWorkOrder.attachments ?? []);
  const officialAttachments = getOfficialAttachments(selectedWorkOrder.attachments ?? []);
  const selectedAttachment = getAttachmentById(selectedWorkOrder.attachments ?? [], attachmentPreviewId);
  const { materials, outsourcing, fabricTotal, subsidiaryTotal, outsourcingTotal, totalCost, unitCost } = calculateWorkOrderCosts(selectedWorkOrder);
  const availableActions = getAvailableWorkflowActions({
    currentWorkflowState,
    currentRoles,
    currentUserId,
    workOrder: selectedWorkOrder,
    users,
  });

  return {
    currentRoles,
    currentRole,
    isAdmin,
    canCreateWorkOrder,
    canReorderWorkOrder,
    permissionTargetUser,
    workflowStateById,
    currentWorkflowState,
    canChangeManager,
    currentDisplayStage,
    visibleStages,
    isReviewRequestLocked,
    canEditSideDraftContent,
    canUploadOfficialAttachments,
    canEditMemo,
    canRenameTitle,
    workOrders: filteredWorkOrderList,
    hasVisibleWorkOrders: filteredWorkOrderList.length > 0,
    hasActiveSelection,
    canSeeProductionSections,
    canSeeCostSections,
    canEditInventory,
    canOpenInventoryEditor,
    canSeeInventoryHistorySection,
    canSeeAttachments,
    currentInventoryQuantity,
    designAttachments,
    officialAttachments,
    selectedAttachment,
    materials,
    outsourcing,
    fabricTotal,
    subsidiaryTotal,
    outsourcingTotal,
    totalCost,
    unitCost,
    availableActions,
  };
}
