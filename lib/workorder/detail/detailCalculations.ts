import { normalizeMaterialUnitValue } from "@/lib/constants/material";
import type { Material, OrderEntry, Outsourcing } from "@/types/workorder";

export function recalculateMaterial(item: Material): Material {
  return {
    ...item,
    unit: normalizeMaterialUnitValue(item.unit),
    totalCost: (Number(item.quantity) || 0) * (Number(item.unitCost) || 0),
  };
}

export function recalculateOutsourcing(item: Outsourcing): Outsourcing {
  return {
    ...item,
    totalCost: (Number(item.quantity) || 0) * (Number(item.unitCost) || 0),
  };
}

function calculateFactoryLaborTotal(item: Pick<OrderEntry, "quantity" | "laborCost">) {
  return Math.max(0, Number(item.quantity) || 0) * Math.max(0, Number(item.laborCost) || 0);
}

export function calculateOrderEntryTotals(orderEntries: OrderEntry[]) {
  return orderEntries.reduce(
    (acc, item) => {
      acc.quantity += Math.max(0, Number(item.quantity) || 0);
      acc.laborCost += calculateFactoryLaborTotal(item);
      acc.lossCost += Math.max(0, Number(item.lossCost) || 0);
      acc.totalCost = acc.laborCost + acc.lossCost;
      return acc;
    },
    { quantity: 0, laborCost: 0, lossCost: 0, totalCost: 0 },
  );
}
