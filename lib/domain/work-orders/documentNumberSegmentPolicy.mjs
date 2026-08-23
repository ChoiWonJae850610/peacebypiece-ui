import { decodeWorkOrderMajorCategoryCode } from "./catalog/workOrderCategoryCodePolicy.mjs";

const DOCUMENT_CODE_SEGMENT = /^[A-Z0-9]+$/;

export function normalizeWorkOrderDocumentCodeSegment(value) {
  const normalized = value?.trim().toUpperCase().replace(/[^A-Z0-9]/g, "") ?? "";
  return normalized && DOCUMENT_CODE_SEGMENT.test(normalized) ? normalized : null;
}

export function resolveWorkOrderDocumentItemSegment(input) {
  if (!input.itemCode?.trim()) return null;
  return normalizeWorkOrderDocumentCodeSegment(input.itemCode)
    ?? decodeWorkOrderMajorCategoryCode(input.productTypeCode);
}
