import { ATTACHMENT_SCOPE } from "@/lib/constants/workorderIdentity";
import type { AttachmentScope } from "@/types/workorder";

export const ATTACHMENT_SOURCE_TYPE = {
  user: "user",
  system: "system",
} as const;

export const GENERATED_DOCUMENT_TYPE = {
  orderRequestPdf: "order_request_pdf",
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
    .slice(0, 80) || "작업지시서";
}

function sanitizeStorageSegment(value: string): string {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9가-힣._-]+/g, "-")
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
  const manager = sanitizeFileNameSegment(input.managerName || "담당자미지정");
  const timestamp = formatOrderRequestDocumentTimestamp(input.createdAt ?? new Date());

  return `발주서_${title}_${timestamp}_${manager}.pdf`;
}

export function createOrderRequestPdfStorageKey(input: {
  companyId: string;
  workOrderId: string;
  fileId: string;
}): string {
  const companyId = sanitizeStorageSegment(input.companyId);
  const workOrderId = sanitizeStorageSegment(input.workOrderId);
  const fileId = sanitizeStorageSegment(input.fileId);

  return `companies/${companyId}/workorders/${workOrderId}/generated/order-request/${fileId}.pdf`;
}

export function getGeneratedOrderRequestAttachmentScope(): AttachmentScope {
  return ATTACHMENT_SCOPE.attachment;
}
