import { MATERIAL_KIND } from "@/lib/constants/workorderDomain";
import { isOfficialAttachment } from "@/lib/permissions/attachments";
import { getWorkOrderDisplayTitle } from "@/lib/workorder/presentation/workOrderPresentation";
import { deriveWorkflowStateFromOrderEntries } from "@/lib/workorder/workflow";
import type { Attachment, WorkOrder, WorkOrderListItem } from "@/types/workorder";

export function createWorkOrderListItem(workOrder: WorkOrder): WorkOrderListItem {
  const officialAttachments = getOfficialAttachments(workOrder.attachments ?? []);

  return {
    id: workOrder.id,
    title: getWorkOrderDisplayTitle(workOrder),
    category1: workOrder.category1,
    category2: workOrder.category2,
    category3: workOrder.category3,
    vendor: workOrder.orderEntries?.[0]?.factory || workOrder.vendor,
    dueDate: workOrder.orderEntries?.[0]?.dueDate || workOrder.dueDate,
    inventoryStatus: workOrder.inventoryStatus,
    attachments: officialAttachments,
    filesCount: officialAttachments.length,
  };
}

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

export function calculateWorkOrderCosts(workOrder: WorkOrder) {
  const materials = workOrder.materials ?? [];
  const outsourcing = workOrder.outsourcing ?? [];
  const fabricTotal = materials.filter((item) => item.type === MATERIAL_KIND.fabric).reduce((sum, item) => sum + item.totalCost, 0);
  const subsidiaryTotal = materials.filter((item) => item.type === MATERIAL_KIND.subsidiary).reduce((sum, item) => sum + item.totalCost, 0);
  const outsourcingTotal = outsourcing.reduce((sum, item) => sum + item.totalCost, 0);
  const orderEntries = workOrder.orderEntries ?? [];
  const quantity = orderEntries.length > 0 ? orderEntries.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) : workOrder.quantity;
  const laborCost = orderEntries.length > 0
    ? orderEntries.reduce((sum, item) => sum + Math.max(0, Number(item.laborCost) || 0), 0)
    : Math.max(0, Number(workOrder.laborCost) || 0);
  const lossCost = orderEntries.length > 0
    ? orderEntries.reduce((sum, item) => sum + Math.max(0, Number(item.lossCost) || 0), 0)
    : Math.max(0, Number(workOrder.lossCost) || 0);
  const totalCost = fabricTotal + subsidiaryTotal + outsourcingTotal + laborCost + lossCost;
  const unitCost = quantity > 0 ? Math.round(totalCost / quantity) : 0;

  return {
    materials,
    outsourcing,
    fabricTotal,
    subsidiaryTotal,
    outsourcingTotal,
    laborCost,
    lossCost,
    totalCost,
    unitCost,
  };
}
