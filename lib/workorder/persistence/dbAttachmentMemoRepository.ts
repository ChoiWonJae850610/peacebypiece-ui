import "server-only";

import { isDatabaseConfigured, queryDb } from "@/lib/db/client";
import type { DbQueryResultRow } from "@/lib/db/client";
import type { Attachment, MemoThread } from "@/types/workorder";
import type {
  CreateAttachmentRecordInput,
  CreateMemoReplyRecordInput,
  CreateMemoThreadRecordInput,
  WorkOrderAttachmentDbRecord,
  WorkOrderMemoDbRecord,
  WorkOrderMemoReplyDbRecord,
  WorkOrderMemoThreadDbRecord,
} from "@/lib/workorder/persistence/attachmentMemoTypes";
import { createAttachmentFileProxyUrl } from "@/lib/storage/r2/r2Client";
import {
  inferAttachmentTypeFromMime,
  normalizeAttachmentKindForDb,
  normalizeAttachmentScope,
} from "@/lib/workorder/persistence/attachmentMemoTypes";
import type {
  AttachmentMemoRepositoryInfo,
  AttachmentMemoWritableRepository,
} from "@/lib/workorder/persistence/attachmentMemoRepository";

type AttachmentRow = WorkOrderAttachmentDbRecord & DbQueryResultRow;
type MemoRow = WorkOrderMemoDbRecord & DbQueryResultRow;

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim().length > 0) return Number(value);
  return null;
}

function toIsoString(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return typeof value === "string" ? value : new Date().toISOString();
}

function mapAttachmentRow(row: AttachmentRow): Attachment {
  return {
    id: row.id,
    name: row.original_name,
    type: inferAttachmentTypeFromMime(row.mime_type, row.original_name),
    url: createAttachmentFileProxyUrl(row.storage_key),
    scope: normalizeAttachmentScope(row.attachment_type),
    ownerId: row.uploaded_by,
    ownerName: row.uploaded_by,
  };
}

function mapMemoRow(row: MemoRow): MemoThread {
  const authorName = row.created_by ?? "시스템";

  return {
    id: row.id,
    authorId: row.created_by ?? "system",
    authorName,
    authorRole: "admin",
    content: row.content,
    createdAt: toIsoString(row.created_at),
    deletedAt: row.deleted_at,
    isVisible: row.is_active && row.deleted_at === null,
    replies: [],
  };
}

function mapAttachmentInput(input: CreateAttachmentRecordInput) {
  return {
    work_order_id: input.work_order_id,
    attachment_type: normalizeAttachmentKindForDb(input.attachment.scope),
    storage_key: input.storage_key ?? input.attachment.url,
    original_name: input.attachment.name,
    mime_type: input.content_type ?? null,
    size_bytes: toNumberOrNull(input.file_size),
    uploaded_by: input.attachment.ownerName ?? input.attachment.ownerId ?? null,
  };
}

function getDbAttachmentMemoRepositoryInfo(): AttachmentMemoRepositoryInfo {
  return {
    mode: "db",
    adapterConfigured: isDatabaseConfigured(),
    supportsWrite: true,
  };
}

export function createDbAttachmentMemoRepository(): AttachmentMemoWritableRepository {
  return {
    getRepositoryInfo: getDbAttachmentMemoRepositoryInfo,
    listSnapshotByWorkOrderId: async (workOrderId) => {
      const [attachments, memos] = await Promise.all([
        queryDb<AttachmentRow>(
          `SELECT id,
                  work_order_id,
                  attachment_type,
                  storage_key,
                  original_name,
                  mime_type,
                  size_bytes,
                  uploaded_by,
                  is_active,
                  deleted_at,
                  created_at,
                  updated_at
             FROM workorder_attachments
            WHERE work_order_id = $1
              AND is_active = true
              AND deleted_at IS NULL
            ORDER BY created_at ASC`,
          [workOrderId],
        ),
        queryDb<MemoRow>(
          `SELECT id,
                  work_order_id,
                  content,
                  created_by,
                  is_active,
                  deleted_at,
                  created_at,
                  updated_at
             FROM workorder_memos
            WHERE work_order_id = $1
              AND is_active = true
              AND deleted_at IS NULL
            ORDER BY created_at ASC`,
          [workOrderId],
        ),
      ]);

      return {
        attachments: attachments.rows.map(mapAttachmentRow),
        memoThreads: memos.rows.map(mapMemoRow),
      };
    },
    createAttachment: async (input) => {
      const next = mapAttachmentInput(input);
      const result = await queryDb<AttachmentRow>(
        `INSERT INTO workorder_attachments (
           work_order_id,
           attachment_type,
           storage_key,
           original_name,
           mime_type,
           size_bytes,
           uploaded_by
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id,
                   work_order_id,
                   attachment_type,
                   storage_key,
                   original_name,
                   mime_type,
                   size_bytes,
                   uploaded_by,
                   is_active,
                   deleted_at,
                   created_at,
                   updated_at`,
        [
          next.work_order_id,
          next.attachment_type,
          next.storage_key,
          next.original_name,
          next.mime_type,
          next.size_bytes,
          next.uploaded_by,
        ],
      );

      const [created] = result.rows;
      if (!created) throw new Error("Attachment creation failed");
      return created;
    },
    createMemoThread: async (input: CreateMemoThreadRecordInput): Promise<WorkOrderMemoThreadDbRecord> => {
      const result = await queryDb<MemoRow>(
        `INSERT INTO workorder_memos (work_order_id, content, created_by)
         VALUES ($1, $2, $3)
         RETURNING id,
                   work_order_id,
                   content,
                   created_by,
                   is_active,
                   deleted_at,
                   created_at,
                   updated_at`,
        [input.work_order_id, input.thread.content, input.thread.authorName || input.thread.authorId || null],
      );

      const [created] = result.rows;
      if (!created) throw new Error("Memo creation failed");
      return created;
    },
    createMemoReply: async (input: CreateMemoReplyRecordInput): Promise<WorkOrderMemoReplyDbRecord> => {
      const result = await queryDb<MemoRow>(
        `INSERT INTO workorder_memos (work_order_id, content, created_by)
         VALUES ($1, $2, $3)
         RETURNING id,
                   work_order_id,
                   content,
                   created_by,
                   is_active,
                   deleted_at,
                   created_at,
                   updated_at`,
        [input.work_order_id, input.reply.content, input.reply.authorName || input.reply.authorId || null],
      );

      const [created] = result.rows;
      if (!created) throw new Error("Memo reply creation failed");

      return {
        ...created,
        thread_id: input.thread_id,
      };
    },
    softDeleteAttachment: async (attachmentId) => {
      await queryDb(
        `UPDATE workorder_attachments
            SET is_active = false,
                deleted_at = COALESCE(deleted_at, now())
          WHERE id = $1`,
        [attachmentId],
      );
    },
    softDeleteMemoThread: async (threadId) => {
      await queryDb(
        `UPDATE workorder_memos
            SET is_active = false,
                deleted_at = COALESCE(deleted_at, now())
          WHERE id = $1`,
        [threadId],
      );
    },
    softDeleteMemoReply: async (replyId) => {
      await queryDb(
        `UPDATE workorder_memos
            SET is_active = false,
                deleted_at = COALESCE(deleted_at, now())
          WHERE id = $1`,
        [replyId],
      );
    },
  };
}
