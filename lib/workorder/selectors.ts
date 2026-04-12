import { isOfficialAttachment } from "@/lib/permissions/attachments";
import { deriveWorkflowStateFromOrderEntries } from "@/lib/workorder/workflow";
import { createWorkOrderListItem } from "@/lib/workorder/mappers/workOrderListItemMapper";
import { calculateWorkOrderCosts } from "@/lib/workorder/derived/workOrderCostSummary";
import type { Attachment, WorkOrder, WorkOrderListItem } from "@/types/workorder";

export { createWorkOrderListItem, calculateWorkOrderCosts };

export function deriveWorkflowStateById(workOrders: WorkOrder[]) {
  return Object.fromEntries(
    workOrders.map((item) => [item.id, deriveWorkflowStateFromOrderEntries(item.workflowState, item.orderEntries)]),
  );
}

export function filterWorkOrderList(workOrders: WorkOrderListItem[], workflowStateById: Record<string, string>, searchQuery: string) {
  const normalized = searchQuery.trim().toLowerCase();
  if (!normalized) {
    return workOrders;
  }

  return workOrders.filter((item) => {
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
