import { normalizeMaterialUnitValue } from "@/lib/constants/material";
import type { Material, OrderEntry, Outsourcing } from "@/types/workorder";

export function recalculateMaterial(item: Material): Material {
  return {
    ...item,
    unit: normalizeMaterialUnitValue(item.unit),
    totalCost: (Number(item.quantity) || 0) * (Number(item.unitCost) || 0),
  };
}

function normalizeCostNumber(value: unknown) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, numeric);
}

function calculateUnitBasedLineAmount(item: { quantity?: number; unitCost?: number; laborCost?: number; lossCost?: number }) {
  const quantity = normalizeCostNumber(item.quantity);
  const unitCost = normalizeCostNumber(item.unitCost ?? item.laborCost);
  const lossCost = normalizeCostNumber(item.lossCost);
  return quantity * (unitCost + lossCost);
}

export function calculateOutsourcingAmount(item: Pick<Outsourcing, "quantity" | "unitCost" | "lossCost">) {
  return calculateUnitBasedLineAmount(item);
}

export function recalculateOutsourcing(item: Outsourcing): Outsourcing {
  return {
    ...item,
    lossCost: normalizeCostNumber(item.lossCost),
    totalCost: calculateOutsourcingAmount(item),
  };
}

function calculateFactoryLaborTotal(item: Pick<OrderEntry, "quantity" | "laborCost">) {
  return normalizeCostNumber(item.quantity) * normalizeCostNumber(item.laborCost);
}

function calculateFactoryLossTotal(item: Pick<OrderEntry, "quantity" | "lossCost">) {
  return normalizeCostNumber(item.quantity) * normalizeCostNumber(item.lossCost);
}

export function calculateOrderEntryAmount(item: Pick<OrderEntry, "quantity" | "laborCost" | "lossCost">) {
  return calculateFactoryLaborTotal(item) + calculateFactoryLossTotal(item);
}

export function calculateOrderEntryTotals(orderEntries: OrderEntry[]) {
  return orderEntries.reduce(
    (acc, item) => {
      acc.quantity += normalizeCostNumber(item.quantity);
      acc.laborCost += calculateFactoryLaborTotal(item);
      acc.lossCost += calculateFactoryLossTotal(item);
      acc.totalCost += calculateOrderEntryAmount(item);
      return acc;
    },
    { quantity: 0, laborCost: 0, lossCost: 0, totalCost: 0 },
  );
}
