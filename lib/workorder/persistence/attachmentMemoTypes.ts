import type { Attachment, AttachmentScope, AttachmentType, MemoReply, MemoThread, RoleType } from "@/types/workorder";

export const ATTACHMENT_MEMO_DB_TABLE_SEQUENCE = [
  "attachments",
  "memo_threads",
  "memo_replies",
] as const;

export const ATTACHMENT_STORAGE_PROVIDER_VALUES = ["r2", "external", "local_mock"] as const;

export type AttachmentStorageProvider = (typeof ATTACHMENT_STORAGE_PROVIDER_VALUES)[number];

export type WorkOrderAttachmentDbRecord = {
  id: string;
  work_order_id: string;
  scope: AttachmentScope;
  file_name: string;
  file_type: AttachmentType;
  storage_provider: AttachmentStorageProvider;
  storage_key: string | null;
  url: string | null;
  content_type: string | null;
  file_size: number | null;
  owner_id: string | null;
  owner_name: string | null;
  linked_thread_id: string | null;
  linked_reply_id: string | null;
  is_visible: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkOrderMemoThreadDbRecord = {
  id: string;
  work_order_id: string;
  author_id: string;
  author_name: string;
  author_role: RoleType;
  content: string;
  is_visible: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkOrderMemoReplyDbRecord = {
  id: string;
  thread_id: string;
  work_order_id: string;
  author_id: string;
  author_name: string;
  author_role: RoleType;
  content: string;
  is_visible: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
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
