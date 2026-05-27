import { MATERIAL_KIND } from "@/lib/constants/workorderDomain";
import type { WorkOrder } from "@/types/workorder";

function normalizeCostNumber(value: unknown) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, numeric);
}

function calculateMaterialLineTotal(item: { quantity?: number; unitCost?: number; totalCost?: number }) {
  const totalCost = Number(item.totalCost) || 0;
  if (totalCost > 0) return totalCost;
  return normalizeCostNumber(item.quantity) * normalizeCostNumber(item.unitCost);
}

function calculateOutsourcingLaborTotal(item: { quantity?: number; unitCost?: number }) {
  return normalizeCostNumber(item.quantity) * normalizeCostNumber(item.unitCost);
}

function calculateOrderLineLaborTotal(item: { quantity?: number; laborCost?: number }) {
  return normalizeCostNumber(item.quantity) * normalizeCostNumber(item.laborCost);
}

function calculateOrderLineLossTotal(item: { quantity?: number; lossCost?: number }) {
  return normalizeCostNumber(item.quantity) * normalizeCostNumber(item.lossCost);
}

function calculateOutsourcingLossTotal(item: { quantity?: number; lossCost?: number }) {
  return normalizeCostNumber(item.quantity) * normalizeCostNumber(item.lossCost);
}

export function calculateWorkOrderCosts(workOrder: WorkOrder) {
  const materials = workOrder.materials ?? [];
  const outsourcing = workOrder.outsourcing ?? [];
  const fabricTotal = materials.filter((item) => item.type === MATERIAL_KIND.fabric).reduce((sum, item) => sum + calculateMaterialLineTotal(item), 0);
  const subsidiaryTotal = materials.filter((item) => item.type === MATERIAL_KIND.subsidiary).reduce((sum, item) => sum + calculateMaterialLineTotal(item), 0);
  const outsourcingTotal = outsourcing.reduce((sum, item) => sum + calculateOutsourcingLaborTotal(item), 0);
  const orderEntries = workOrder.orderEntries ?? [];
  const quantity = orderEntries.length > 0 ? orderEntries.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) : workOrder.quantity;
  const factoryLaborCost = orderEntries.length > 0
    ? orderEntries.reduce((sum, item) => sum + calculateOrderLineLaborTotal(item), 0)
    : normalizeCostNumber(workOrder.quantity) * normalizeCostNumber(workOrder.laborCost);
  const laborCost = factoryLaborCost + outsourcingTotal;
  const orderLossCost = orderEntries.length > 0
    ? orderEntries.reduce((sum, item) => sum + calculateOrderLineLossTotal(item), 0)
    : normalizeCostNumber(workOrder.quantity) * normalizeCostNumber(workOrder.lossCost);
  const outsourcingLossCost = outsourcing.reduce((sum, item) => sum + calculateOutsourcingLossTotal(item), 0);
  const lossCost = orderLossCost + outsourcingLossCost;
  const totalCost = fabricTotal + subsidiaryTotal + laborCost + lossCost;
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
