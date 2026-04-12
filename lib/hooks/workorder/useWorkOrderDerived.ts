"use client";

import { useMemo } from "react";
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
import {
  canEditInventoryForWorkflow,
  canManageWorkOrderManager,
  deriveWorkflowStateFromOrderEntries,
  getAvailableWorkflowActions,
} from "@/lib/workorder/workflow";
import type { UserProfile, WorkOrder, WorkOrderListItem } from "@/types/workorder";

type UseWorkOrderDerivedParams = {
  users: UserProfile[];
  currentUser: UserProfile;
  currentUserId: string;
  permissionTargetUserId: string;
  workOrders: WorkOrder[];
  selectedWorkOrder: WorkOrder;
  searchQuery: string;
  attachmentPreviewId: string | null;
};

export function useWorkOrderDerived({
  users,
  currentUser,
  currentUserId,
  permissionTargetUserId,
  workOrders,
  selectedWorkOrder,
  searchQuery,
  attachmentPreviewId,
}: UseWorkOrderDerivedParams) {
  const currentRoles = normalizeRoles(currentUser.roles, currentUser.role);
  const currentRole = currentUser.role;
  const isAdmin = isAdminRole(currentRoles);
  const canCreateWorkOrder = canCreateWorkOrderByRoles(currentRoles);
  const canReorderWorkOrder = canCreateWorkOrderByRoles(currentRoles);

  const permissionTargetUser = useMemo(
    () => users.find((user) => user.id === permissionTargetUserId) ?? users[0],
    [users, permissionTargetUserId],
  );

  const workflowStateById = useMemo(() => deriveWorkflowStateById(workOrders), [workOrders]);

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

  const filteredWorkOrderList = useMemo(
    () => filterWorkOrderList(workOrderList, workflowStateById, searchQuery),
    [searchQuery, workOrderList, workflowStateById],
  );

  const canSeeProductionSections = currentUser.permissions.canSeeProductionSections;
  const canSeeCostSections = currentUser.permissions.canSeeCostSections;
  const canEditInventory = currentUser.permissions.canEditInventory;
  const canOpenInventoryEditor = canEditInventoryForWorkflow(currentRoles, currentWorkflowState);
  const canSeeInventoryHistorySection = currentUser.permissions.canSeeInventoryHistorySection;
  const canSeeAttachments = currentUser.permissions.canSeeAttachments;

  const currentInventoryQuantity = selectedWorkOrder.inventoryQuantity;
  const officialAttachments = useMemo(
    () => getOfficialAttachments(selectedWorkOrder.attachments ?? []),
    [selectedWorkOrder.attachments],
  );

  const selectedAttachment = useMemo(
    () => getAttachmentById(selectedWorkOrder.attachments ?? [], attachmentPreviewId),
    [selectedWorkOrder.attachments, attachmentPreviewId],
  );

  const { materials, outsourcing, fabricTotal, subsidiaryTotal, outsourcingTotal, totalCost, unitCost } = useMemo(
    () => calculateWorkOrderCosts(selectedWorkOrder),
    [selectedWorkOrder],
  );

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
