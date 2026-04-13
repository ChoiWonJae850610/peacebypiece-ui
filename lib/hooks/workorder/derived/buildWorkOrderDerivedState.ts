import {
  canCreateWorkOrderByRoles,
  canUploadOfficialAttachmentsByRoles,
  isAdminRole,
  normalizeRoles,
} from "@/lib/constants/roles";
import { getDisplayStageFromWorkflowState, VISIBLE_STAGES } from "@/lib/constants/workflow";
import {
  calculateWorkOrderCosts,
  createWorkOrderListItem,
  deriveWorkflowStateById,
  filterWorkOrderList,
  getAttachmentById,
  getOfficialAttachments,
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
  const isReviewRequestLocked = currentWorkflowState !== "draft";
  const canUploadOfficialAttachments = canUploadOfficialAttachmentsByRoles(currentRoles) && !isReviewRequestLocked;
  const workOrderList = workOrders.map(createWorkOrderListItem);
  const filteredWorkOrderList = filterWorkOrderList(workOrderList, workflowStateById, searchQuery);
  const canSeeProductionSections = currentUser.permissions.canSeeProductionSections;
  const canSeeCostSections = currentUser.permissions.canSeeCostSections;
  const canEditInventory = currentUser.permissions.canEditInventory;
  const canOpenInventoryEditor = canEditInventoryForWorkflow(currentRoles, currentWorkflowState);
  const canSeeInventoryHistorySection = currentUser.permissions.canSeeInventoryHistorySection;
  const canSeeAttachments = currentUser.permissions.canSeeAttachments;
  const currentInventoryQuantity = getSharedInventorySnapshot(workOrders, selectedWorkOrder).inventoryQuantity;
  const officialAttachments = getOfficialAttachments(selectedWorkOrder.attachments ?? []);
  const selectedAttachment = getAttachmentById(selectedWorkOrder.attachments ?? [], attachmentPreviewId);
  const { materials, outsourcing, fabricTotal, subsidiaryTotal, outsourcingTotal, totalCost, unitCost } = calculateWorkOrderCosts(selectedWorkOrder);
  const availableActions = getAvailableWorkflowActions({
    currentWorkflowState,
    currentRoles,
    currentUserId,
    workOrder: selectedWorkOrder,
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
    canUploadOfficialAttachments,
    workOrders: filteredWorkOrderList,
    canSeeProductionSections,
    canSeeCostSections,
    canEditInventory,
    canOpenInventoryEditor,
    canSeeInventoryHistorySection,
    canSeeAttachments,
    currentInventoryQuantity,
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
