import type { WorkOrderSizeColorMatrix, WorkOrderSizeRow, WorkOrderSizeSpec } from "@/domain/mobileContract";
import { MobileApiError } from "@/domain/mobileContract";
import { isJsonObject } from "../apiResponseNormalizer";
import {
  COLOR_HEX_PATTERN,
  isDecimalString,
  isNonEmptyString,
  isNonNegativeSafeInteger,
  isNullableString,
} from "./apiValidation";

function normalizeSizeRows(value: unknown): readonly WorkOrderSizeRow[] | null {
  if (!Array.isArray(value)) return null;
  const rows: WorkOrderSizeRow[] = [];
  const ids = new Set<string>();
  const codes = new Set<string>();
  for (const candidate of value) {
    if (
      !isJsonObject(candidate)
      || !isNonEmptyString(candidate.id)
      || !isNonEmptyString(candidate.code)
      || !isNonEmptyString(candidate.displayLabel)
      || !isNonNegativeSafeInteger(candidate.displayOrder)
      || ids.has(candidate.id)
      || codes.has(candidate.code)
    ) return null;
    ids.add(candidate.id);
    codes.add(candidate.code);
    rows.push({
      id: candidate.id,
      code: candidate.code,
      displayLabel: candidate.displayLabel,
      displayOrder: candidate.displayOrder,
    });
  }
  return rows;
}

export function malformedSizeColorResponse(): never {
  throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "사이즈·색상 응답이 올바르지 않습니다." });
}

export function malformedSizeSpecResponse(): never {
  throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "완성 치수 응답이 올바르지 않습니다." });
}

export function normalizeWorkOrderSizeColor(workOrderId: string, value: unknown): WorkOrderSizeColorMatrix {
  if (
    !isJsonObject(value)
    || value.workOrderId !== workOrderId
    || !isNonEmptyString(value.revisionId)
    || !isNonNegativeSafeInteger(value.entityVersion)
    || !isDecimalString(value.matrixTotal)
    || !isDecimalString(value.expectedTotal)
    || !isDecimalString(value.workOrderTotal)
    || !isDecimalString(value.revisionTotal)
    || typeof value.projectionsMatch !== "boolean"
    || typeof value.totalsMatch !== "boolean"
    || !isNullableString(value.memoFallback)
  ) return malformedSizeColorResponse();

  const sizes = normalizeSizeRows(value.sizes);
  if (!sizes || !Array.isArray(value.colors) || !Array.isArray(value.quantityCells)) return malformedSizeColorResponse();
  const sizeIds = new Set(sizes.map((row) => row.id));
  const colorIds = new Set<string>();
  const colors = [];
  for (const candidate of value.colors) {
    if (
      !isJsonObject(candidate)
      || !isNonEmptyString(candidate.id)
      || !isNonEmptyString(candidate.displayName)
      || !(candidate.hexValue === null || (typeof candidate.hexValue === "string" && COLOR_HEX_PATTERN.test(candidate.hexValue)))
      || !isNonNegativeSafeInteger(candidate.displayOrder)
      || colorIds.has(candidate.id)
    ) return malformedSizeColorResponse();
    colorIds.add(candidate.id);
    colors.push({
      id: candidate.id,
      displayName: candidate.displayName,
      hexValue: candidate.hexValue,
      displayOrder: candidate.displayOrder,
    });
  }

  const quantityCells = [];
  const cellKeys = new Set<string>();
  for (const candidate of value.quantityCells) {
    if (
      !isJsonObject(candidate)
      || !isNonEmptyString(candidate.colorId)
      || !isNonEmptyString(candidate.sizeRowId)
      || !isDecimalString(candidate.quantity)
      || !colorIds.has(candidate.colorId)
      || !sizeIds.has(candidate.sizeRowId)
    ) return malformedSizeColorResponse();
    const key = `${candidate.colorId}:${candidate.sizeRowId}`;
    if (cellKeys.has(key)) return malformedSizeColorResponse();
    cellKeys.add(key);
    quantityCells.push({
      colorId: candidate.colorId,
      sizeRowId: candidate.sizeRowId,
      quantity: candidate.quantity,
    });
  }
  const computedTotal = quantityCells.reduce((sum, cell) => sum + Number(cell.quantity), 0);
  if (computedTotal !== Number(value.matrixTotal)) return malformedSizeColorResponse();
  const projectionsMatch = Number(value.matrixTotal) === Number(value.workOrderTotal)
    && Number(value.matrixTotal) === Number(value.revisionTotal);
  if (value.projectionsMatch !== projectionsMatch || value.totalsMatch !== projectionsMatch) return malformedSizeColorResponse();
  return {
    workOrderId,
    revisionId: value.revisionId,
    sizes,
    colors,
    quantityCells,
    matrixTotal: value.matrixTotal,
    expectedTotal: value.expectedTotal,
    workOrderTotal: value.workOrderTotal,
    revisionTotal: value.revisionTotal,
    projectionsMatch: value.projectionsMatch,
    totalsMatch: value.totalsMatch,
    memoFallback: value.memoFallback,
    entityVersion: value.entityVersion,
  };
}

export function normalizeWorkOrderSizeSpec(workOrderId: string, value: unknown): WorkOrderSizeSpec {
  if (
    !isJsonObject(value)
    || value.workOrderId !== workOrderId
    || !isNonEmptyString(value.revisionId)
    || !isNonNegativeSafeInteger(value.entityVersion)
    || !(value.measurementUnit === "cm" || value.measurementUnit === "inch")
    || !isNullableString(value.genderCode)
    || !isNullableString(value.categoryCode)
    || !isNullableString(value.templateId)
    || !(value.templateVersion === null || isNonNegativeSafeInteger(value.templateVersion))
    || !isNullableString(value.templateName)
    || typeof value.sourceTemplateModified !== "boolean"
  ) return malformedSizeSpecResponse();

  const sizes = normalizeSizeRows(value.sizes);
  if (!sizes || !Array.isArray(value.pomColumns) || !Array.isArray(value.cells)) return malformedSizeSpecResponse();
  const sizeIds = new Set(sizes.map((row) => row.id));
  const pomIds = new Set<string>();
  const pomCodes = new Set<string>();
  const pomColumns = [];
  for (const candidate of value.pomColumns) {
    if (
      !isJsonObject(candidate)
      || !isNonEmptyString(candidate.id)
      || !isNonEmptyString(candidate.code)
      || !isNonEmptyString(candidate.displayName)
      || !isNonNegativeSafeInteger(candidate.displayOrder)
      || pomIds.has(candidate.id)
      || pomCodes.has(candidate.code)
    ) return malformedSizeSpecResponse();
    pomIds.add(candidate.id);
    pomCodes.add(candidate.code);
    pomColumns.push({
      id: candidate.id,
      code: candidate.code,
      displayName: candidate.displayName,
      displayOrder: candidate.displayOrder,
    });
  }

  const cells = [];
  const cellKeys = new Set<string>();
  for (const candidate of value.cells) {
    if (
      !isJsonObject(candidate)
      || !isNonEmptyString(candidate.sizeRowId)
      || !isNonEmptyString(candidate.pomColumnId)
      || !isNullableString(candidate.displayValue)
      || !(candidate.decimalValue === null || isDecimalString(candidate.decimalValue))
      || !sizeIds.has(candidate.sizeRowId)
      || !pomIds.has(candidate.pomColumnId)
    ) return malformedSizeSpecResponse();
    const key = `${candidate.pomColumnId}:${candidate.sizeRowId}`;
    if (cellKeys.has(key)) return malformedSizeSpecResponse();
    cellKeys.add(key);
    cells.push({
      sizeRowId: candidate.sizeRowId,
      pomColumnId: candidate.pomColumnId,
      displayValue: candidate.displayValue,
      decimalValue: candidate.decimalValue,
    });
  }
  return {
    workOrderId,
    revisionId: value.revisionId,
    genderCode: value.genderCode,
    categoryCode: value.categoryCode,
    measurementUnit: value.measurementUnit,
    templateId: value.templateId,
    templateVersion: value.templateVersion,
    templateName: value.templateName,
    sourceTemplateModified: value.sourceTemplateModified,
    sizes,
    pomColumns,
    cells,
    entityVersion: value.entityVersion,
  };
}
