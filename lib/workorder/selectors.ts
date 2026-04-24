import { isDesignAttachment, isOfficialAttachment } from "@/lib/permissions/attachments";
export {
  getOrderEntriesByTargetType,
  getOrderEntriesForTargetType,
  getRepresentativeOrderEntry,
  getRepresentativeOrderEntryFromWorkOrder,
  getSubmittableOrderEntries,
} from "@/lib/workorder/orderSubmission";
import { deriveWorkflowStateFromOrderEntries } from "@/lib/workorder/workflow";
import { isAdminRole, isDesignerRole, isInspectorRole } from "@/lib/constants/roles";
import { canEditBeforeOrder, isWorkflowState, isWorkflowStateAtLeast, isWorkflowStateInRange } from "@/lib/constants/workorderStates";
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


export function filterWorkOrdersByUserScope(workOrders: WorkOrder[], workflowStateById: Record<string, string>, currentUser: UserProfile) {
  if (isAdminRole(currentUser)) {
    return workOrders;
  }

  if (isDesignerRole(currentUser)) {
    return workOrders.filter((item) => {
      const workflowState = workflowStateById[item.id] ?? item.workflowState;
      const isOwnedByCurrentUser = item.createdById === currentUser.id || (item.managerId ?? null) === currentUser.id;
      return isOwnedByCurrentUser && canEditBeforeOrder(workflowState as WorkOrder["workflowState"]);
    });
  }

  if (isInspectorRole(currentUser)) {
    return workOrders.filter((item) => {
      const workflowState = workflowStateById[item.id] ?? item.workflowState;
      return isWorkflowStateInRange(workflowState as WorkOrder["workflowState"], "inspection", "completed") && !isWorkflowState(workflowState, "completed");
    });
  }

  return workOrders;
}

export function isWorkOrderSideDraftEditable(workflowState: WorkOrder["workflowState"]) {
  return !isWorkflowStateAtLeast(workflowState, "review_completed");
}

export function canEditWorkOrderAttachments(workflowState: WorkOrder["workflowState"], canSeeAttachments: boolean, canManageAttachments: boolean) {
  return canSeeAttachments && canManageAttachments && isWorkOrderSideDraftEditable(workflowState);
}

export function canEditWorkOrderMemo(workflowState: WorkOrder["workflowState"]) {
  return isWorkOrderSideDraftEditable(workflowState);
}

export function canRenameWorkOrderTitle(currentUser: UserProfile, workflowState: WorkOrder["workflowState"]) {
  if (isAdminRole(currentUser)) return true;
  return isDesignerRole(currentUser) && canEditBeforeOrder(workflowState);
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
