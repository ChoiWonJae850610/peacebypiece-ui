import { MATERIAL_KIND } from "@/lib/constants/workorderDomain";
import { isOfficialAttachment } from "@/lib/permissions/attachments";
import { getWorkOrderDisplayTitle } from "@/lib/workorder/presentation/workOrderPresentation";
import type { WorkOrder, WorkOrderListItem } from "@/types/workorder";


export function createWorkOrderListItem(workOrder: WorkOrder): WorkOrderListItem {
  const officialAttachments = (workOrder.attachments ?? []).filter(isOfficialAttachment);

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
