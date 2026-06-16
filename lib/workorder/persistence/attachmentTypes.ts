import { ATTACHMENT_SCOPE, isDesignAttachmentScope } from "@/lib/constants/workorderIdentity";
import type { Attachment, AttachmentScope, AttachmentType } from "@/types/workorder";

export const ATTACHMENT_DB_TABLE_SEQUENCE = ["attachments"] as const;

export const ATTACHMENT_STORAGE_PROVIDER_VALUES = ["r2", "external", "local_mock"] as const;

export type AttachmentStorageProvider = (typeof ATTACHMENT_STORAGE_PROVIDER_VALUES)[number];

export type WorkOrderAttachmentKind = "design" | "file";

export const ATTACHMENT_SOURCE_TYPES = ["user", "system"] as const;
export type AttachmentSourceType = (typeof ATTACHMENT_SOURCE_TYPES)[number];

export const GENERATED_DOCUMENT_TYPES = ["order_request_pdf"] as const;
export type GeneratedDocumentType = (typeof GENERATED_DOCUMENT_TYPES)[number];

export type WorkOrderAttachmentDbRecord = {
  id: string;
  order_id: string;
  type: WorkOrderAttachmentKind;
  storage_key: string;
  thumbnail_key?: string | null;
  original_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  author_id: string | null;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  is_primary?: boolean | null;
  source_type?: AttachmentSourceType | string | null;
  generated_document_type?: GeneratedDocumentType | string | null;
};

export type AttachmentSnapshot = {
  attachments: Attachment[];
};

export type CreateAttachmentRecordInput = {
  order_id: string;
  attachment: Attachment;
  storage_provider?: AttachmentStorageProvider;
  storage_key?: string | null;
  content_type?: string | null;
  file_size?: number | null;
  is_primary?: boolean | null;
  source_type?: AttachmentSourceType | string | null;
  generated_document_type?: GeneratedDocumentType | string | null;
};

export function inferAttachmentTypeFromMime(mimeType: string | null, fallbackName = ""): AttachmentType {
  const normalizedMime = mimeType?.toLowerCase() ?? "";
  const normalizedName = fallbackName.toLowerCase();

  if (normalizedMime.startsWith("image/") || /\.(png|jpe?g|gif|webp)$/i.test(normalizedName)) return "image";
  if (normalizedMime === "application/pdf" || normalizedName.endsWith(".pdf")) return "pdf";

  return "file";
}

export function normalizeAttachmentScope(value: string | null | undefined): AttachmentScope {
  if (isDesignAttachmentScope(value)) return ATTACHMENT_SCOPE.design;
  return ATTACHMENT_SCOPE.attachment;
}

export function normalizeAttachmentKindForDb(value: AttachmentScope | string | null | undefined): WorkOrderAttachmentKind {
  if (isDesignAttachmentScope(value)) return "design";
  return "file";
}
