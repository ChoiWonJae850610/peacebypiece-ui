import { isOfficialAttachment } from "@/lib/permissions/attachments";
import type { WorkOrder, WorkOrderListItem } from "@/types/workorder";


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
  const laborCost = Math.max(0, Number(workOrder.laborCost) || 0);
  const lossCost = Math.max(0, Number(workOrder.lossCost) || 0);
  const totalCost = fabricTotal + subsidiaryTotal + outsourcingTotal + laborCost + lossCost;
  const unitCost = workOrder.quantity > 0 ? Math.round(totalCost / workOrder.quantity) : 0;

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
