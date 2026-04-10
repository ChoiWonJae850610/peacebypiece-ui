import type { Material, OrderEntry, Outsourcing } from "@/types/workorder";

export function recalculateMaterial(item: Material): Material {
  return {
    ...item,
    totalCost: (Number(item.quantity) || 0) * (Number(item.unitCost) || 0),
  };
}

export function recalculateOutsourcing(item: Outsourcing): Outsourcing {
  return {
    ...item,
    totalCost: (Number(item.quantity) || 0) * (Number(item.unitCost) || 0),
  };
}

export function calculateOrderEntryTotals(orderEntries: OrderEntry[]) {
  return orderEntries.reduce(
    (acc, item) => {
      acc.quantity += Number(item.quantity) || 0;
      acc.laborCost += Number(item.laborCost) || 0;
      acc.lossCost += Number(item.lossCost) || 0;
      return acc;
    },
    { quantity: 0, laborCost: 0, lossCost: 0 },
  );
}
