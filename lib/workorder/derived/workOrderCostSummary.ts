import { MATERIAL_KIND } from "@/lib/constants/workorderDomain";
import type { WorkOrder } from "@/types/workorder";

function calculateLineTotal(item: { quantity?: number; unitCost?: number; totalCost?: number }) {
  const totalCost = Number(item.totalCost) || 0;
  if (totalCost > 0) return totalCost;
  return Math.max(0, Number(item.quantity) || 0) * Math.max(0, Number(item.unitCost) || 0);
}

export function calculateWorkOrderCosts(workOrder: WorkOrder) {
  const materials = workOrder.materials ?? [];
  const outsourcing = workOrder.outsourcing ?? [];
  const fabricTotal = materials.filter((item) => item.type === MATERIAL_KIND.fabric).reduce((sum, item) => sum + calculateLineTotal(item), 0);
  const subsidiaryTotal = materials.filter((item) => item.type === MATERIAL_KIND.subsidiary).reduce((sum, item) => sum + calculateLineTotal(item), 0);
  const outsourcingTotal = outsourcing.reduce((sum, item) => sum + calculateLineTotal(item), 0);
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
