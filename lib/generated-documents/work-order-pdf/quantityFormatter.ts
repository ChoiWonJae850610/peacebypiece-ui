import {
  formatMaterialQuantityScaled,
  parseMaterialQuantityScaled,
} from "../../domain/work-orders/materialQuantityPrecision.mjs";

const DECIMAL_QUANTITY = /^([+-]?\d+)(?:\.(\d+))?$/u;

export function formatIssuedDocumentQuantity(input: string): string {
  const normalized = input.trim();
  const match = DECIMAL_QUANTITY.exec(normalized);
  if (!match) return normalized;
  const fraction = (match[2] ?? "").replace(/0+$/u, "");
  return fraction ? `${match[1]}.${fraction}` : match[1];
}

export function resolveIssuedPdfFactoryQuantity(input: {
  readonly requiredQuantity: string | null | undefined;
  readonly allowanceQuantity: string | null | undefined;
}): string {
  const required = parseMaterialQuantityScaled(input.requiredQuantity ?? "0");
  const allowance = parseMaterialQuantityScaled(input.allowanceQuantity ?? "0");
  if (required === null || allowance === null) {
    throw new Error("ISSUED_PDF_FACTORY_QUANTITY_INVALID");
  }
  return formatIssuedDocumentQuantity(formatMaterialQuantityScaled(required + allowance));
}
