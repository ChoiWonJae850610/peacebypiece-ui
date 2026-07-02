import { ATTACHMENT_SCOPE } from "@/lib/constants/workorderIdentity";
import { createWorkOrderPdfStorageKey } from "@/lib/workorder/pdf/workOrderPdfPolicy";
import type { AttachmentScope } from "@/types/workorder";

export const ATTACHMENT_SOURCE_TYPE = {
  user: "user",
  system: "system",
} as const;

export const GENERATED_DOCUMENT_TYPE = {
  orderRequestPdf: "order_request_pdf",
  workorderIncompletePdf: "workorder_incomplete_pdf",
  workorderFinalPdf: "workorder_final_pdf",
} as const;

export type AttachmentSourceType = (typeof ATTACHMENT_SOURCE_TYPE)[keyof typeof ATTACHMENT_SOURCE_TYPE];
export type GeneratedDocumentType = (typeof GENERATED_DOCUMENT_TYPE)[keyof typeof GENERATED_DOCUMENT_TYPE];

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function sanitizeFileNameSegment(value: string): string {
  return value
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .replace(/-+/g, "-")
    .slice(0, 80) || "workorder";
}

function sanitizeStorageSegment(value: string): string {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "item";
}

export function formatOrderRequestDocumentTimestamp(date = new Date()): string {
  return [
    date.getFullYear(),
    pad2(date.getMonth() + 1),
    pad2(date.getDate()),
  ].join("-") + "_" + [pad2(date.getHours()), pad2(date.getMinutes())].join("");
}

export function createOrderRequestPdfDisplayName(input: {
  workOrderTitle: string;
  managerName?: string | null;
  createdAt?: Date;
}): string {
  const title = sanitizeFileNameSegment(input.workOrderTitle);
  const manager = sanitizeFileNameSegment(input.managerName || "manager");
  const timestamp = formatOrderRequestDocumentTimestamp(input.createdAt ?? new Date());

  return `order-request_${title}_${timestamp}_${manager}.pdf`;
}

export function createWorkorderPdfDisplayName(input: {
  workOrderTitle: string;
  documentType: typeof GENERATED_DOCUMENT_TYPE.workorderIncompletePdf | typeof GENERATED_DOCUMENT_TYPE.workorderFinalPdf;
  createdAt?: Date;
}): string {
  const title = sanitizeFileNameSegment(input.workOrderTitle);
  const timestamp = formatOrderRequestDocumentTimestamp(input.createdAt ?? new Date());
  const suffix = input.documentType === GENERATED_DOCUMENT_TYPE.workorderFinalPdf
    ? "final"
    : "incomplete";

  return `workorder-${suffix}_${title}_${timestamp}.pdf`;
}

export function createOrderRequestPdfStorageKey(input: {
  companyId: string;
  workOrderId: string;
  fileId: string;
}): string {
  return createWorkOrderPdfStorageKey({
    companyId: sanitizeStorageSegment(input.companyId),
    workOrderId: sanitizeStorageSegment(input.workOrderId),
    pdfId: sanitizeStorageSegment(input.fileId),
  });
}

export function createGeneratedWorkorderPdfStorageKey(input: {
  companyId: string;
  workOrderId: string;
  fileId: string;
}): string {
  return createWorkOrderPdfStorageKey({
    companyId: sanitizeStorageSegment(input.companyId),
    workOrderId: sanitizeStorageSegment(input.workOrderId),
    pdfId: sanitizeStorageSegment(input.fileId),
  });
}

export function getGeneratedOrderRequestAttachmentScope(): AttachmentScope {
  return ATTACHMENT_SCOPE.attachment;
}

export function isGeneratedOrderRequestPdfAttachment(input: { generatedDocumentType?: string | null; sourceType?: string | null } | null | undefined): boolean {
  return Boolean(
    input &&
      input.sourceType === ATTACHMENT_SOURCE_TYPE.system &&
      input.generatedDocumentType === GENERATED_DOCUMENT_TYPE.orderRequestPdf,
  );
}

export function isGeneratedWorkorderPdfAttachment(input: { generatedDocumentType?: string | null; sourceType?: string | null } | null | undefined): boolean {
  return Boolean(
    input &&
      input.sourceType === ATTACHMENT_SOURCE_TYPE.system &&
      (input.generatedDocumentType === GENERATED_DOCUMENT_TYPE.workorderIncompletePdf ||
        input.generatedDocumentType === GENERATED_DOCUMENT_TYPE.workorderFinalPdf),
  );
}
