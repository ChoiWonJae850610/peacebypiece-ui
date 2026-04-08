import type { Attachment, WorkOrder, WorkOrderListItem } from "@/types/workorder";

function isOfficialAttachment(attachment: Attachment) {
  return (attachment.scope ?? "official") === "official";
}

export function createWorkOrderListItem(workOrder: WorkOrder): WorkOrderListItem {
  const officialAttachments = (workOrder.attachments ?? []).filter(isOfficialAttachment);

  return {
    id: workOrder.id,
    title: workOrder.title,
    category1: workOrder.category1,
    category2: workOrder.category2,
    category3: workOrder.category3,
    vendor: workOrder.vendor,
    dueDate: workOrder.dueDate,
    inventoryStatus: workOrder.inventoryStatus,
    attachments: officialAttachments,
    filesCount: officialAttachments.length,
  };
}

export function calculateWorkOrderCosts(workOrder: WorkOrder) {
  const materials = workOrder.materials ?? [];
  const outsourcing = workOrder.outsourcing ?? [];
  const fabricTotal = materials.filter((item) => item.type === "원단").reduce((sum, item) => sum + item.totalCost, 0);
  const subsidiaryTotal = materials.filter((item) => item.type === "부자재").reduce((sum, item) => sum + item.totalCost, 0);
  const outsourcingTotal = outsourcing.reduce((sum, item) => sum + item.totalCost, 0);
  const sewingTotal = (workOrder.sewingUnitCost ?? 0) * (workOrder.quantity ?? 0);
  const lossCost = workOrder.lossCost ?? 0;
  const totalCost = fabricTotal + subsidiaryTotal + outsourcingTotal + sewingTotal + lossCost;
  const unitCost = workOrder.quantity > 0 ? Math.round(totalCost / workOrder.quantity) : 0;

  return {
    materials,
    outsourcing,
    fabricTotal,
    subsidiaryTotal,
    outsourcingTotal,
    sewingTotal,
    lossCost,
    totalCost,
    unitCost,
  };
}
