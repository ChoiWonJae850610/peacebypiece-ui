import { isDesignAttachment, isOfficialAttachment } from "@/lib/permissions/attachments";
export {
  getOrderEntriesByTargetType,
  getOrderEntriesForTargetType,
  getRepresentativeOrderEntry,
  getRepresentativeOrderEntryFromWorkOrder,
  getSubmittableOrderEntries,
} from "@/lib/workorder/orderSubmission";
import { deriveWorkflowStateFromOrderEntries } from "@/lib/workorder/workflow";
import { isAdminRole } from "@/lib/constants/roles";
import { hasMemberPermission } from "@/lib/permissions/permissionAccess";
import { WORKFLOW_STATE, canEditBeforeOrder, isWorkflowStateAtLeast } from "@/lib/constants/workorderStates";
import type { UserProfile } from "@/types/user";
import { createWorkOrderListItem } from "@/lib/workorder/mappers/workOrderListItemMapper";
import { calculateWorkOrderCosts } from "@/lib/workorder/derived/workOrderCostSummary";
import type { Attachment, WorkOrder, WorkOrderListItem } from "@/types/workorder";

export { createWorkOrderListItem, calculateWorkOrderCosts };

export function deriveWorkflowStateById(workOrders: WorkOrder[]) {
  return Object.fromEntries(
    workOrders.map((item) => [item.id, deriveWorkflowStateFromOrderEntries(item.workflowState, item.orderEntries)]),
  );
}


function getUserScopeIds(currentUser: UserProfile) {
  return new Set(
    [currentUser.id, currentUser.companyMemberId]
      .map((value) => value?.trim())
      .filter((value): value is string => Boolean(value)),
  );
}

function isManagedByCurrentUser(workOrder: WorkOrder, currentUser: UserProfile) {
  const managerId = workOrder.managerId?.trim();
  if (!managerId) return false;
  return getUserScopeIds(currentUser).has(managerId);
}

export function filterWorkOrdersByUserScope(workOrders: WorkOrder[], workflowStateById: Record<string, string>, currentUser: UserProfile) {
  if (isAdminRole(currentUser)) {
    return workOrders;
  }

  return workOrders.filter((item) => isManagedByCurrentUser(item, currentUser));
}

export function isWorkOrderSideDraftEditable(workflowState: WorkOrder["workflowState"]) {
  return !isWorkflowStateAtLeast(workflowState, WORKFLOW_STATE.reviewCompleted);
}

export function canEditWorkOrderAttachments(workflowState: WorkOrder["workflowState"], canSeeAttachments: boolean, canManageAttachments: boolean) {
  return canSeeAttachments && canManageAttachments && isWorkOrderSideDraftEditable(workflowState);
}

export function canRenameWorkOrderTitle(currentUser: UserProfile, workflowState: WorkOrder["workflowState"]) {
  return (
    hasMemberPermission(currentUser, "workorder.update") &&
    canEditBeforeOrder(workflowState, isAdminRole(currentUser))
  );
}

export function filterWorkOrderList(workOrders: WorkOrderListItem[], workflowStateById: Record<string, string>, searchQuery: string) {
  const normalized = searchQuery.trim().toLowerCase();
  if (!normalized) {
    return workOrders;
  }

  return workOrders.filter((item) => {
    const fields = [
      item.displayTitle,
      item.title,
      item.baseTitle,
      item.category1,
      item.category2,
      item.category3,
      item.vendor,
      workflowStateById[item.id] ?? "",
    ];

    return fields.some((field) => String(field ?? "").toLowerCase().includes(normalized));
  });
}

export function getDesignAttachments(attachments: Attachment[]) {
  return attachments.filter(isDesignAttachment);
}

export function getOfficialAttachments(attachments: Attachment[]) {
  return attachments.filter(isOfficialAttachment);
}

export function getAttachmentById(attachments: Attachment[], attachmentId: string | null) {
  if (!attachmentId) {
    return null;
  }

  return attachments.find((item) => item.id === attachmentId) ?? null;
}
