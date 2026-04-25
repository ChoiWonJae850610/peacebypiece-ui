import "server-only";

import { isDatabaseConfigured, queryDb } from "@/lib/db/client";
import type { DbQueryResultRow } from "@/lib/db/client";
import type { Attachment, MemoReply, MemoThread } from "@/types/workorder";
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

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function mapAttachmentRow(row: AttachmentRow): Attachment {
  return {
    id: row.id,
    name: row.original_name,
    type: inferAttachmentTypeFromMime(row.mime_type, row.original_name),
    url: createAttachmentFileProxyUrl(row.storage_key),
    scope: normalizeAttachmentScope(row.type),
    ownerId: row.author_id,
    ownerName: row.author_id,
  };
}

function mapMemoThreadRow(row: MemoRow, replies: MemoReply[]): MemoThread {
  const authorName = row.author_id ?? "시스템";

  return {
    id: row.id,
    authorId: row.author_id ?? "system",
    authorName,
    authorRole: "admin",
    content: row.body,
    createdAt: toIsoString(row.created_at),
    deletedAt: row.deleted_at,
    isVisible: row.is_active,
    replies,
  };
}

function mapMemoReplyRow(row: MemoRow): MemoReply {
  const authorName = row.author_id ?? "시스템";

  return {
    id: row.id,
    authorId: row.author_id ?? "system",
    authorName,
    authorRole: "admin",
    content: row.body,
    createdAt: toIsoString(row.created_at),
    deletedAt: row.deleted_at,
    isVisible: row.is_active,
  };
}

function mapMemoRows(rows: MemoRow[]): MemoThread[] {
  const replyRowsByParentId = new Map<string, MemoRow[]>();
  const threadRows: MemoRow[] = [];

  for (const row of rows) {
    if (row.parent_id) {
      const replies = replyRowsByParentId.get(row.parent_id) ?? [];
      replies.push(row);
      replyRowsByParentId.set(row.parent_id, replies);
    } else {
      threadRows.push(row);
    }
  }

  return threadRows.map((thread) => {
    const replies = (replyRowsByParentId.get(thread.id) ?? []).map(mapMemoReplyRow);
    return mapMemoThreadRow(thread, replies);
  });
}

function mapAttachmentInput(input: CreateAttachmentRecordInput) {
  return {
    order_id: input.order_id,
    type: normalizeAttachmentKindForDb(input.attachment.scope),
    storage_key: input.storage_key ?? input.attachment.url,
    original_name: input.attachment.name,
    mime_type: input.content_type ?? null,
    size_bytes: toNumberOrNull(input.file_size),
    author_id: input.attachment.ownerId ?? input.attachment.ownerName ?? null,
  };
}

async function insertMemoThreadRecord(workOrderId: string, thread: MemoThread): Promise<string> {
  const keepId = isUuid(thread.id);
  const columns = keepId
    ? "id, order_id, parent_id, body, author_id, is_active, deleted_at"
    : "order_id, parent_id, body, author_id, is_active, deleted_at";
  const valuesSql = keepId
    ? "$1, $2, NULL, $3, $4, $5, $6"
    : "$1, NULL, $2, $3, $4, $5";
  const values = keepId
    ? [thread.id, workOrderId, thread.content, thread.authorId || thread.authorName || null, thread.isVisible !== false, thread.deletedAt ?? null]
    : [workOrderId, thread.content, thread.authorId || thread.authorName || null, thread.isVisible !== false, thread.deletedAt ?? null];

  const result = await queryDb<{ id: string }>(
    `INSERT INTO memos (${columns}) VALUES (${valuesSql}) RETURNING id`,
    values,
  );
  const id = result.rows[0]?.id;
  if (!id) throw new Error("Memo thread replacement failed");
  return id;
}

async function insertMemoReplyRecord(workOrderId: string, parentId: string, reply: MemoReply): Promise<void> {
  const keepId = isUuid(reply.id);
  const columns = keepId
    ? "id, order_id, parent_id, body, author_id, is_active, deleted_at"
    : "order_id, parent_id, body, author_id, is_active, deleted_at";
  const valuesSql = keepId
    ? "$1, $2, $3, $4, $5, $6, $7"
    : "$1, $2, $3, $4, $5, $6";
  const values = keepId
    ? [reply.id, workOrderId, parentId, reply.content, reply.authorId || reply.authorName || null, reply.isVisible !== false, reply.deletedAt ?? null]
    : [workOrderId, parentId, reply.content, reply.authorId || reply.authorName || null, reply.isVisible !== false, reply.deletedAt ?? null];

  await queryDb(`INSERT INTO memos (${columns}) VALUES (${valuesSql})`, values);
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
                  order_id,
                  type,
                  storage_key,
                  original_name,
                  mime_type,
                  size_bytes,
                  author_id,
                  is_active,
                  deleted_at,
                  created_at
             FROM attachments
            WHERE order_id = $1
              AND is_active = true
              AND deleted_at IS NULL
            ORDER BY created_at ASC`,
          [workOrderId],
        ),
        queryDb<MemoRow>(
          `SELECT id,
                  order_id,
                  parent_id,
                  body,
                  author_id,
                  is_active,
                  deleted_at,
                  created_at,
                  updated_at
             FROM memos
            WHERE order_id = $1
              AND is_active = true
              AND deleted_at IS NULL
            ORDER BY created_at ASC`,
          [workOrderId],
        ),
      ]);

      return {
        attachments: attachments.rows.map(mapAttachmentRow),
        memoThreads: mapMemoRows(memos.rows),
      };
    },
    createAttachment: async (input) => {
      const next = mapAttachmentInput(input);
      const attachmentId = crypto.randomUUID();
      const result = await queryDb<AttachmentRow>(
        `INSERT INTO attachments (
           id,
           order_id,
           type,
           storage_key,
           original_name,
           mime_type,
           size_bytes,
           author_id
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id,
                   order_id,
                   type,
                   storage_key,
                   original_name,
                   mime_type,
                   size_bytes,
                   author_id,
                   is_active,
                   deleted_at,
                   created_at`,
        [attachmentId, next.order_id, next.type, next.storage_key, next.original_name, next.mime_type, next.size_bytes, next.author_id],
      );

      const [created] = result.rows;
      if (!created) throw new Error("Attachment creation failed");
      return created;
    },
    createMemoThread: async (input: CreateMemoThreadRecordInput): Promise<WorkOrderMemoThreadDbRecord> => {
      const result = await queryDb<MemoRow>(
        `INSERT INTO memos (order_id, parent_id, body, author_id)
         VALUES ($1, NULL, $2, $3)
         RETURNING id,
                   order_id,
                   parent_id,
                   body,
                   author_id,
                   is_active,
                   deleted_at,
                   created_at,
                   updated_at`,
        [input.order_id, input.thread.content, input.thread.authorId || input.thread.authorName || null],
      );

      const [created] = result.rows;
      if (!created) throw new Error("Memo creation failed");
      return created;
    },
    createMemoReply: async (input: CreateMemoReplyRecordInput): Promise<WorkOrderMemoReplyDbRecord> => {
      const result = await queryDb<MemoRow>(
        `INSERT INTO memos (order_id, parent_id, body, author_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id,
                   order_id,
                   parent_id,
                   body,
                   author_id,
                   is_active,
                   deleted_at,
                   created_at,
                   updated_at`,
        [input.order_id, input.thread_id, input.reply.content, input.reply.authorId || input.reply.authorName || null],
      );

      const [created] = result.rows;
      if (!created) throw new Error("Memo reply creation failed");

      return {
        ...created,
        thread_id: input.thread_id,
      };
    },

    getAttachmentById: async (attachmentId) => {
      const result = await queryDb<AttachmentRow>(
        `SELECT id,
                order_id,
                type,
                storage_key,
                original_name,
                mime_type,
                size_bytes,
                author_id,
                is_active,
                deleted_at,
                created_at
           FROM attachments
          WHERE id = $1
          LIMIT 1`,
        [attachmentId],
      );

      return result.rows[0] ?? null;
    },
    replaceMemoThreads: async (workOrderId, memoThreads) => {
      await queryDb("DELETE FROM memos WHERE order_id = $1", [workOrderId]);

      for (const thread of memoThreads) {
        const threadId = await insertMemoThreadRecord(workOrderId, thread);
        for (const reply of thread.replies ?? []) {
          await insertMemoReplyRecord(workOrderId, threadId, reply);
        }
      }
    },
    softDeleteAttachment: async (attachmentId) => {
      const result = await queryDb<AttachmentRow>(
        `UPDATE attachments
            SET is_active = false,
                deleted_at = COALESCE(deleted_at, now())
          WHERE id = $1
          RETURNING id,
                    order_id,
                    type,
                    storage_key,
                    original_name,
                    mime_type,
                    size_bytes,
                    author_id,
                    is_active,
                    deleted_at,
                    created_at`,
        [attachmentId],
      );

      return result.rows[0] ?? null;
    },

    updateMemo: async (memoId, body) => {
      const result = await queryDb<MemoRow>(
        `UPDATE memos
            SET body = $2,
                updated_at = now()
          WHERE id = $1
            AND is_active = true
            AND deleted_at IS NULL
          RETURNING id,
                    order_id,
                    parent_id,
                    body,
                    author_id,
                    is_active,
                    deleted_at,
                    created_at,
                    updated_at`,
        [memoId, body],
      );

      return result.rows[0] ?? null;
    },
    softDeleteMemoThread: async (threadId) => {
      await queryDb(
        `UPDATE memos
            SET is_active = false,
                deleted_at = COALESCE(deleted_at, now()),
                updated_at = now()
          WHERE id = $1`,
        [threadId],
      );
    },
    softDeleteMemoReply: async (replyId) => {
      await queryDb(
        `UPDATE memos
            SET is_active = false,
                deleted_at = COALESCE(deleted_at, now()),
                updated_at = now()
          WHERE id = $1`,
        [replyId],
      );
    },
  };
}
