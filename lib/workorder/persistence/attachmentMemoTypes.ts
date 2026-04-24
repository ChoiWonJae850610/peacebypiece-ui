import type { Attachment, AttachmentScope, AttachmentType, MemoReply, MemoThread, RoleType } from "@/types/workorder";

export const ATTACHMENT_MEMO_DB_TABLE_SEQUENCE = [
  "workorder_attachments",
  "workorder_memos",
] as const;

export const ATTACHMENT_STORAGE_PROVIDER_VALUES = ["r2", "external", "local_mock"] as const;

export type AttachmentStorageProvider = (typeof ATTACHMENT_STORAGE_PROVIDER_VALUES)[number];

export type WorkOrderAttachmentKind = AttachmentScope;

export type WorkOrderAttachmentDbRecord = {
  id: string;
  work_order_id: string;
  attachment_type: WorkOrderAttachmentKind;
  storage_key: string;
  original_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_by: string | null;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkOrderMemoDbRecord = {
  id: string;
  work_order_id: string;
  content: string;
  created_by: string | null;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkOrderMemoThreadDbRecord = WorkOrderMemoDbRecord;

export type WorkOrderMemoReplyDbRecord = WorkOrderMemoDbRecord & {
  thread_id: string;
};

export type AttachmentMemoSnapshot = {
  attachments: Attachment[];
  memoThreads: MemoThread[];
};

export type CreateAttachmentRecordInput = {
  work_order_id: string;
  attachment: Attachment;
  storage_provider?: AttachmentStorageProvider;
  storage_key?: string | null;
  content_type?: string | null;
  file_size?: number | null;
};

export type CreateMemoThreadRecordInput = {
  work_order_id: string;
  thread: MemoThread;
};

export type CreateMemoReplyRecordInput = {
  work_order_id: string;
  thread_id: string;
  reply: MemoReply;
};

export type AttachmentMemoAuthorSnapshot = {
  author_id: string;
  author_name: string;
  author_role: RoleType;
};

export function inferAttachmentTypeFromMime(mimeType: string | null, fallbackName = ""): AttachmentType {
  const normalizedMime = mimeType?.toLowerCase() ?? "";
  const normalizedName = fallbackName.toLowerCase();

  if (normalizedMime.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg)$/i.test(normalizedName)) return "image";
  if (normalizedMime === "application/pdf" || normalizedName.endsWith(".pdf")) return "pdf";

  return "file";
}

export function normalizeAttachmentScope(value: string | null | undefined): AttachmentScope {
  return value === "design" ? "design" : "official";
}
