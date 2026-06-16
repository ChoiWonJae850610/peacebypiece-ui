import type { MaterialOrderLineInput } from "@/lib/material-orders/types";

export function toIsoString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

export function toIsoStringOrNull(value: Date | string | null): string | null {
  return value === null ? null : toIsoString(value);
}

export function toNumber(value: string | number): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeMaterialOrderText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function normalizeMaterialOrderQuantity(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;
}

export function normalizeMaterialOrderMoney(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
}

export function resolveMaterialOrderLineAmount(line: MaterialOrderLineInput): number {
  const explicitAmount = normalizeMaterialOrderMoney(line.amount);
  if (explicitAmount > 0) return explicitAmount;
  return Number((normalizeMaterialOrderQuantity(line.orderQuantity) * normalizeMaterialOrderMoney(line.unitPrice)).toFixed(2));
}

export function calculateMaterialOrderTotalAmount(lines: readonly MaterialOrderLineInput[] = []): number {
  return Number(lines.reduce((sum, line) => sum + resolveMaterialOrderLineAmount(line), 0).toFixed(2));
}
