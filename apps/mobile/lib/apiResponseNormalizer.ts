import type {
  MaterialLineCommandResult,
  WorkOrderMaterialLine,
} from "../domain/mobileContract.ts";

export type JsonObject = Record<string, unknown>;

const MATERIAL_STATUSES = new Set(["editing", "requested", "completed", "cancelled"]);
const DECIMAL_PATTERN = /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/;

export function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): string | null | undefined {
  if (value === null || value === undefined) return null;
  return typeof value === "string" ? value : undefined;
}

export function normalizeMaterialLine(value: unknown): WorkOrderMaterialLine | null {
  if (!isJsonObject(value)) return null;
  const decimalFields = [
    value.requiredQuantity,
    value.allowanceQuantity,
    value.inventoryUsageQuantity,
    value.orderQuantity,
    value.unitPrice,
    value.amount,
  ];
  if (decimalFields.some((field) => typeof field !== "string" || !DECIMAL_PATTERN.test(field))) return null;
  if (
    typeof value.id !== "string"
    || value.materialType !== "fabric"
    || typeof value.name !== "string"
    || optionalString(value.colorOption) === undefined
    || optionalString(value.usageArea) === undefined
    || typeof value.unitCode !== "string"
    || typeof value.currency !== "string"
    || optionalString(value.memo) === undefined
    || typeof value.status !== "string"
    || !Number.isSafeInteger(value.displayOrder)
    || typeof value.locked !== "boolean"
    || (value.lifecycle !== "active" && value.lifecycle !== "archived")
    || !(value.archivedAt === null || typeof value.archivedAt === "string")
  ) return null;
  return {
    id: value.id,
    materialType: "fabric",
    name: value.name,
    colorOption: optionalString(value.colorOption) ?? null,
    usageArea: optionalString(value.usageArea) ?? null,
    requiredQuantity: value.requiredQuantity as string,
    allowanceQuantity: value.allowanceQuantity as string,
    inventoryUsageQuantity: value.inventoryUsageQuantity as string,
    orderQuantity: value.orderQuantity as string,
    unitCode: value.unitCode,
    currency: value.currency,
    unitPrice: value.unitPrice as string,
    amount: value.amount as string,
    memo: optionalString(value.memo) ?? null,
    status: MATERIAL_STATUSES.has(value.status) ? value.status as WorkOrderMaterialLine["status"] : "unknown",
    displayOrder: Number(value.displayOrder),
    locked: value.locked,
    lifecycle: value.lifecycle,
    archivedAt: value.archivedAt,
  };
}

export function normalizeMaterialCommandResult(value: unknown, workOrderId: string): MaterialLineCommandResult | null {
  if (!isJsonObject(value) || !isJsonObject(value.result)) return null;
  const result = value.result;
  if (
    result.workOrderId !== workOrderId
    || typeof result.materialLineId !== "string"
    || result.materialType !== "fabric"
    || typeof result.status !== "string"
    || !MATERIAL_STATUSES.has(result.status)
    || !Number.isSafeInteger(result.nextVersion)
    || !Number.isSafeInteger(result.lineVersion)
    || (result.lifecycle !== "active" && result.lifecycle !== "archived")
    || !Number.isSafeInteger(value.nextVersion)
    || value.nextVersion !== result.nextVersion
    || Number(value.nextVersion) < 1
    || Number(result.lineVersion) < 1
  ) return null;
  return value as MaterialLineCommandResult;
}
