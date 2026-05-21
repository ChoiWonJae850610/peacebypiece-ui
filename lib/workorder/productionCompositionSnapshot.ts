import type { Material, OrderEntry, Outsourcing, WorkOrder } from "@/types/workorder";
import { recalculateMaterial, recalculateOutsourcing } from "@/lib/workorder/detail/detailCalculations";
import { sanitizeOrderEntry } from "@/lib/workorder/detail/detailSanitizers";
import type { WorkflowState } from "@/types/workflow";

type UnknownRecord = Record<string, unknown>;

const MATERIAL_QUANTITY_KEYS = ["quantity", "requiredQuantity", "required_quantity", "qty"] as const;
const MATERIAL_UNIT_COST_KEYS = ["unitCost", "unitPrice", "unit_cost", "unit_price", "price", "cost"] as const;
const MATERIAL_TOTAL_COST_KEYS = ["totalCost", "amount", "total_cost", "total_amount"] as const;

const OUTSOURCING_QUANTITY_KEYS = ["quantity", "requiredQuantity", "required_quantity", "qty"] as const;
const OUTSOURCING_UNIT_COST_KEYS = ["unitCost", "unitPrice", "unit_cost", "unit_price", "price", "cost"] as const;
const OUTSOURCING_TOTAL_COST_KEYS = ["totalCost", "amount", "total_cost", "total_amount"] as const;

const ORDER_QUANTITY_KEYS = ["quantity", "orderQuantity", "order_quantity", "qty"] as const;
const ORDER_LABOR_COST_KEYS = ["laborCost", "labor_cost", "unitLaborCost", "unit_labor_cost"] as const;
const ORDER_LOSS_COST_KEYS = ["lossCost", "loss_cost", "wasteCost", "waste_cost"] as const;

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? (value as UnknownRecord) : {};
}

function readNumberByKeys(source: unknown, keys: readonly string[], fallback = 0): number {
  const record = asRecord(source);

  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(record, key)) continue;
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, value);
    if (typeof value === "string") {
      const normalized = value.trim().replace(/,/g, "");
      if (!normalized) continue;
      const parsed = Number(normalized);
      if (Number.isFinite(parsed)) return Math.max(0, parsed);
    }
  }

  return fallback;
}

function readStringByKeys(source: unknown, keys: readonly string[], fallback = ""): string {
  const record = asRecord(source);

  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(record, key)) continue;
    const value = record[key];
    const text = String(value ?? "").trim();
    if (text) return text;
  }

  return fallback;
}

export function normalizeProductionMaterialRow(row: Material): Material {
  const quantity = readNumberByKeys(row, MATERIAL_QUANTITY_KEYS, 0);
  const unitCost = readNumberByKeys(row, MATERIAL_UNIT_COST_KEYS, 0);
  const totalCost = readNumberByKeys(row, MATERIAL_TOTAL_COST_KEYS, quantity * unitCost);

  return recalculateMaterial({
    ...row,
    quantity,
    unitCost,
    totalCost,
  });
}

export function normalizeProductionMaterialRows(rows: readonly Material[] | undefined | null): Material[] {
  return (rows ?? []).map(normalizeProductionMaterialRow);
}

export function normalizeProductionOutsourcingRow(row: Outsourcing): Outsourcing {
  const quantity = readNumberByKeys(row, OUTSOURCING_QUANTITY_KEYS, 0);
  const unitCost = readNumberByKeys(row, OUTSOURCING_UNIT_COST_KEYS, 0);
  const totalCost = readNumberByKeys(row, OUTSOURCING_TOTAL_COST_KEYS, quantity * unitCost);

  return recalculateOutsourcing({
    ...row,
    quantity,
    unitCost,
    totalCost,
  });
}

export function normalizeProductionOutsourcingRows(rows: readonly Outsourcing[] | undefined | null): Outsourcing[] {
  return (rows ?? []).map(normalizeProductionOutsourcingRow);
}

export function normalizeProductionOrderEntry(row: OrderEntry, workflowState: WorkflowState): OrderEntry {
  return sanitizeOrderEntry({
    ...row,
    quantity: readNumberByKeys(row, ORDER_QUANTITY_KEYS, 0),
    laborCost: readNumberByKeys(row, ORDER_LABOR_COST_KEYS, 0),
    lossCost: readNumberByKeys(row, ORDER_LOSS_COST_KEYS, 0),
  }, row, workflowState);
}

export function normalizeProductionOrderEntries(
  rows: readonly OrderEntry[] | undefined | null,
  workflowState: WorkflowState,
): OrderEntry[] {
  return (rows ?? []).map((row) => normalizeProductionOrderEntry(row, workflowState));
}

export function normalizeProductionCompositionForWorkflowSnapshot(workOrder: WorkOrder): WorkOrder {
  return {
    ...workOrder,
    orderEntries: normalizeProductionOrderEntries(workOrder.orderEntries, workOrder.workflowState),
    materials: normalizeProductionMaterialRows(workOrder.materials),
    outsourcing: normalizeProductionOutsourcingRows(workOrder.outsourcing),
  };
}

export function hasProductionCompositionNumberValue(workOrder: WorkOrder): boolean {
  return [
    ...(workOrder.orderEntries ?? []).map((item) =>
      readNumberByKeys(item, ORDER_QUANTITY_KEYS) +
      readNumberByKeys(item, ORDER_LABOR_COST_KEYS) +
      readNumberByKeys(item, ORDER_LOSS_COST_KEYS),
    ),
    ...(workOrder.materials ?? []).map((item) =>
      readNumberByKeys(item, MATERIAL_QUANTITY_KEYS) +
      readNumberByKeys(item, MATERIAL_UNIT_COST_KEYS) +
      readNumberByKeys(item, MATERIAL_TOTAL_COST_KEYS),
    ),
    ...(workOrder.outsourcing ?? []).map((item) =>
      readNumberByKeys(item, OUTSOURCING_QUANTITY_KEYS) +
      readNumberByKeys(item, OUTSOURCING_UNIT_COST_KEYS) +
      readNumberByKeys(item, OUTSOURCING_TOTAL_COST_KEYS),
    ),
  ].some((value) => value > 0);
}

export const productionCompositionFieldMapForAudit = {
  material: {
    quantity: MATERIAL_QUANTITY_KEYS,
    unitCost: MATERIAL_UNIT_COST_KEYS,
    totalCost: MATERIAL_TOTAL_COST_KEYS,
  },
  outsourcing: {
    quantity: OUTSOURCING_QUANTITY_KEYS,
    unitCost: OUTSOURCING_UNIT_COST_KEYS,
    totalCost: OUTSOURCING_TOTAL_COST_KEYS,
  },
  order: {
    quantity: ORDER_QUANTITY_KEYS,
    laborCost: ORDER_LABOR_COST_KEYS,
    lossCost: ORDER_LOSS_COST_KEYS,
  },
} as const;
