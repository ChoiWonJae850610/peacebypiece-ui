export const WORK_ORDER_PDF_DOCUMENT_TYPES = {
  internal: "internal",
  vendorShare: "vendor_share",
  kakaoShare: "kakao_share",
} as const;

export type WorkOrderPdfDocumentType = (typeof WORK_ORDER_PDF_DOCUMENT_TYPES)[keyof typeof WORK_ORDER_PDF_DOCUMENT_TYPES];

export const WORK_ORDER_PDF_VISIBILITY_FIELDS: Record<WorkOrderPdfDocumentType, string[]> = {
  internal: [
    "company",
    "workorder",
    "productCategory",
    "creator",
    "manager",
    "dueDate",
    "quantity",
    "colorSize",
    "materials",
    "accessories",
    "outsourcingProcess",
    "memo",
    "images",
    "attachments",
    "costs",
    "pageNumbers",
    "generatedAt",
    "lifecycle",
  ],
  vendor_share: [
    "company",
    "workorder",
    "productCategory",
    "manager",
    "dueDate",
    "quantity",
    "colorSize",
    "materials",
    "accessories",
    "outsourcingProcess",
    "memo",
    "images",
    "pageNumbers",
    "generatedAt",
  ],
  kakao_share: [
    "company",
    "workorder",
    "productCategory",
    "manager",
    "dueDate",
    "quantity",
    "colorSize",
    "materials",
    "accessories",
    "outsourcingProcess",
    "memo",
    "images",
    "pageNumbers",
    "generatedAt",
  ],
};

export const WORK_ORDER_PDF_CANONICAL_KEY_PATTERN =
  /^companies\/[^/]+\/workorders\/[^/]+\/pdf\/[^/]+\.pdf$/i;

export function sanitizeWorkOrderPdfStorageSegment(value: string): string {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "item";
}

export function createWorkOrderPdfStorageKey(input: {
  companyId: string;
  workOrderId: string;
  pdfId: string;
}): string {
  const companyId = sanitizeWorkOrderPdfStorageSegment(input.companyId);
  const workOrderId = sanitizeWorkOrderPdfStorageSegment(input.workOrderId);
  const pdfId = sanitizeWorkOrderPdfStorageSegment(input.pdfId);
  return `companies/${companyId}/workorders/${workOrderId}/pdf/${pdfId}.pdf`;
}

export function isCanonicalWorkOrderPdfStorageKey(key: string): boolean {
  const normalized = String(key || "").trim();
  if (!normalized || normalized.startsWith("/") || normalized.includes("\\") || normalized.includes("..")) {
    return false;
  }
  return WORK_ORDER_PDF_CANONICAL_KEY_PATTERN.test(normalized);
}

export function requiresDueDateForWorkOrderPdf(type: WorkOrderPdfDocumentType): boolean {
  return type !== WORK_ORDER_PDF_DOCUMENT_TYPES.internal;
}

export function validateWorkOrderPdfDueDate(input: {
  documentType: WorkOrderPdfDocumentType;
  dueDate?: string | null;
}): { ok: true } | { ok: false; error: "WORK_ORDER_PDF_DUE_DATE_REQUIRED" } {
  if (!requiresDueDateForWorkOrderPdf(input.documentType)) return { ok: true };
  return input.dueDate && input.dueDate.trim() ? { ok: true } : { ok: false, error: "WORK_ORDER_PDF_DUE_DATE_REQUIRED" };
}
