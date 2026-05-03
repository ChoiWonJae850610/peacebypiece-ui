import "server-only";

import { isDatabaseConfigured, queryDb } from "@/lib/db/client";
import { getWorkspaceCompanyContext } from "@/lib/constants/company";
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
    storageKey: row.storage_key,
    thumbnailKey: row.thumbnail_key ?? null,
    thumbnailUrl: row.thumbnail_key ? createAttachmentFileProxyUrl(row.thumbnail_key) : null,
    previewUrl: createAttachmentFileProxyUrl(row.storage_key),
    scope: normalizeAttachmentScope(row.type),
    ownerId: row.author_id,
    ownerName: row.author_id,
    isPrimary: row.is_primary === true,
  };
}

function isActiveMemoRow(row: Pick<MemoRow, "is_active" | "deleted_at">): boolean {
  return row.is_active !== false && !row.deleted_at;
}

function mapMemoThreadRow(row: MemoRow, replies: MemoReply[]): MemoThread {
  const authorName = row.author_id ?? "시스템";
  const hasVisibleReplies = replies.some((reply) => reply.isVisible !== false);
  const isDeletedThread = Boolean(row.deleted_at);

  return {
    id: row.id,
    authorId: row.author_id ?? "system",
    authorName,
    authorRole: "admin",
    content: isDeletedThread && hasVisibleReplies ? "삭제된 메모입니다." : row.body,
    createdAt: toIsoString(row.created_at),
    deletedAt: row.deleted_at,
    isVisible: isActiveMemoRow(row) || hasVisibleReplies,
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
    isVisible: isActiveMemoRow(row),
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

  return threadRows
    .map((thread) => {
      const replies = (replyRowsByParentId.get(thread.id) ?? [])
        .map(mapMemoReplyRow)
        .filter((reply) => reply.isVisible !== false);
      return mapMemoThreadRow(thread, replies);
    })
    .filter((thread) => thread.isVisible !== false);
}
function mapAttachmentInput(input: CreateAttachmentRecordInput) {
  return {
    order_id: input.order_id,
    type: normalizeAttachmentKindForDb(input.attachment.scope),
    storage_key: input.storage_key ?? input.attachment.url,
    thumbnail_key: input.attachment.thumbnailKey ?? null,
    original_name: input.attachment.name,
    mime_type: input.content_type ?? null,
    size_bytes: toNumberOrNull(input.file_size),
    author_id: input.attachment.ownerId ?? input.attachment.ownerName ?? null,
    is_primary: input.is_primary ?? input.attachment.isPrimary ?? false,
  };
}

async function insertMemoThreadRecord(workOrderId: string, thread: MemoThread): Promise<string> {
  const keepId = isUuid(thread.id);
  const company = getWorkspaceCompanyContext();
  const columns = keepId
    ? "id, company_id, company_name, order_id, parent_id, body, author_id, is_active, deleted_at"
    : "company_id, company_name, order_id, parent_id, body, author_id, is_active, deleted_at";
  const valuesSql = keepId
    ? "$1, $2, $3, $4, NULL, $5, $6, $7, $8"
    : "$1, $2, $3, NULL, $4, $5, $6, $7";
  const values = keepId
    ? [thread.id, company.companyId, company.companyName, workOrderId, thread.content, thread.authorId || thread.authorName || null, thread.isVisible !== false, thread.deletedAt ?? null]
    : [company.companyId, company.companyName, workOrderId, thread.content, thread.authorId || thread.authorName || null, thread.isVisible !== false, thread.deletedAt ?? null];

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
  const company = getWorkspaceCompanyContext();
  const columns = keepId
    ? "id, company_id, company_name, order_id, parent_id, body, author_id, is_active, deleted_at"
    : "company_id, company_name, order_id, parent_id, body, author_id, is_active, deleted_at";
  const valuesSql = keepId
    ? "$1, $2, $3, $4, $5, $6, $7, $8, $9"
    : "$1, $2, $3, $4, $5, $6, $7, $8";
  const values = keepId
    ? [reply.id, company.companyId, company.companyName, workOrderId, parentId, reply.content, reply.authorId || reply.authorName || null, reply.isVisible !== false, reply.deletedAt ?? null]
    : [company.companyId, company.companyName, workOrderId, parentId, reply.content, reply.authorId || reply.authorName || null, reply.isVisible !== false, reply.deletedAt ?? null];

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
                  thumbnail_key,
                  original_name,
                  mime_type,
                  size_bytes,
                  author_id,
                  is_primary,
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
              AND (
                (parent_id IS NULL AND is_active = true AND deleted_at IS NULL)
                OR (parent_id IS NULL AND deleted_at IS NOT NULL AND EXISTS (
                  SELECT 1
                    FROM memos child
                   WHERE child.parent_id = memos.id
                     AND child.order_id = $1
                     AND child.is_active = true
                     AND child.deleted_at IS NULL
                ))
                OR (parent_id IS NOT NULL AND is_active = true AND deleted_at IS NULL)
              )
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
           company_id,
           company_name,
           order_id,
           type,
           storage_key,
           thumbnail_key,
           original_name,
           mime_type,
           size_bytes,
           author_id,
           is_primary
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING id,
                   order_id,
                   type,
                   storage_key,
                   thumbnail_key,
                   original_name,
                   mime_type,
                   size_bytes,
                   author_id,
                   is_primary,
                   is_active,
                   deleted_at,
                   created_at`,
        [attachmentId, getWorkspaceCompanyContext().companyId, getWorkspaceCompanyContext().companyName, next.order_id, next.type, next.storage_key, next.thumbnail_key, next.original_name, next.mime_type, next.size_bytes, next.author_id, next.is_primary],
      );

      const [created] = result.rows;
      if (!created) throw new Error("Attachment creation failed");
      return created;
    },
    createMemoThread: async (input: CreateMemoThreadRecordInput): Promise<WorkOrderMemoThreadDbRecord> => {
      const result = await queryDb<MemoRow>(
        `INSERT INTO memos (company_id, company_name, order_id, parent_id, body, author_id)
         VALUES ($1, $2, $3, NULL, $4, $5)
         RETURNING id,
                   order_id,
                   parent_id,
                   body,
                   author_id,
                   is_active,
                   deleted_at,
                   created_at,
                   updated_at`,
        [getWorkspaceCompanyContext().companyId, getWorkspaceCompanyContext().companyName, input.order_id, input.thread.content, input.thread.authorId || input.thread.authorName || null],
      );

      const [created] = result.rows;
      if (!created) throw new Error("Memo creation failed");
      return created;
    },
    createMemoReply: async (input: CreateMemoReplyRecordInput): Promise<WorkOrderMemoReplyDbRecord> => {
      const result = await queryDb<MemoRow>(
        `INSERT INTO memos (company_id, company_name, order_id, parent_id, body, author_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id,
                   order_id,
                   parent_id,
                   body,
                   author_id,
                   is_active,
                   deleted_at,
                   created_at,
                   updated_at`,
        [getWorkspaceCompanyContext().companyId, getWorkspaceCompanyContext().companyName, input.order_id, input.thread_id, input.reply.content, input.reply.authorId || input.reply.authorName || null],
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
                thumbnail_key,
                original_name,
                mime_type,
                size_bytes,
                author_id,
                is_primary,
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
    countActiveAttachmentsByWorkOrderId: async (workOrderId) => {
      const result = await queryDb<{ count: string }>(
        `SELECT COUNT(*)::text AS count
           FROM attachments
          WHERE order_id = $1
            AND is_active = true
            AND deleted_at IS NULL`,
        [workOrderId],
      );

      return Number(result.rows[0]?.count ?? 0);
    },
    setPrimaryDesignAttachment: async ({ workOrderId, attachmentId }) => {
      const target = await queryDb<AttachmentRow>(
        `SELECT id,
                order_id,
                type,
                storage_key,
                thumbnail_key,
                original_name,
                mime_type,
                size_bytes,
                author_id,
                is_primary,
                is_active,
                deleted_at,
                created_at
           FROM attachments
          WHERE id = $1
            AND order_id = $2
            AND type = 'design'
            AND is_active = true
            AND deleted_at IS NULL
          LIMIT 1`,
        [attachmentId, workOrderId],
      );

      if (!target.rows[0]) return null;

      await queryDb(
        `UPDATE attachments
            SET is_primary = false
          WHERE order_id = $1
            AND type = 'design'
            AND is_active = true
            AND deleted_at IS NULL`,
        [workOrderId],
      );

      const result = await queryDb<AttachmentRow>(
        `UPDATE attachments
            SET is_primary = true
          WHERE id = $1
          RETURNING id,
                    order_id,
                    type,
                    storage_key,
                    thumbnail_key,
                    original_name,
                    mime_type,
                    size_bytes,
                    author_id,
                    is_primary,
                    is_active,
                    deleted_at,
                    created_at`,
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
    softDeleteAttachment: async (input) => {
      const deletedBy = input.deletedBy ?? null;
      const deleteReason = input.deleteReason ?? null;
      const trashRetentionDays = Number.isFinite(Number(input.trashRetentionDays)) ? Math.max(0, Math.trunc(Number(input.trashRetentionDays))) : 30;
      const result = await queryDb<AttachmentRow>(
        `WITH updated_attachment AS (
           UPDATE attachments
              SET is_active = false,
                  deleted_at = COALESCE(deleted_at, now()),
                  deleted_by = COALESCE($2, deleted_by),
                  delete_reason = COALESCE($3, delete_reason),
                  purge_after_at = COALESCE(purge_after_at, now() + ($4::integer * interval '1 day')),
                  updated_at = now()
            WHERE id = $1
              AND is_active = true
              AND deleted_at IS NULL
            RETURNING id,
                      company_id,
                      company_name,
                      order_id,
                      type,
                      storage_key,
                      thumbnail_key,
                      original_name,
                      mime_type,
                      size_bytes,
                      author_id,
                      is_primary,
                      is_active,
                      deleted_at,
                      deleted_by,
                      delete_reason,
                      purge_after_at,
                      created_at
         ), inserted_trash AS (
           INSERT INTO attachment_trash_items (
             company_id,
             company_name,
             attachment_id,
             order_id,
             storage_key,
             thumbnail_key,
             original_name,
             mime_type,
             size_bytes,
             deleted_by,
             delete_reason,
             deleted_at,
             purge_after_at
           )
           SELECT company_id,
                  company_name,
                  id,
                  order_id,
                  storage_key,
                  thumbnail_key,
                  original_name,
                  mime_type,
                  COALESCE(size_bytes, 0),
                  deleted_by,
                  delete_reason,
                  COALESCE(deleted_at, now()),
                  COALESCE(purge_after_at, now() + ($4::integer * interval '1 day'))
             FROM updated_attachment
           ON CONFLICT DO NOTHING
           RETURNING attachment_id
         )
         SELECT id,
                order_id,
                type,
                storage_key,
                thumbnail_key,
                original_name,
                mime_type,
                size_bytes,
                author_id,
                is_primary,
                is_active,
                deleted_at,
                created_at
           FROM updated_attachment`,
        [input.attachmentId, deletedBy, deleteReason, trashRetentionDays],
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
            SET is_active = CASE
                  WHEN EXISTS (
                    SELECT 1
                      FROM memos child
                     WHERE child.parent_id = memos.id
                       AND child.is_active = true
                       AND child.deleted_at IS NULL
                  ) THEN true
                  ELSE false
                END,
                body = CASE
                  WHEN EXISTS (
                    SELECT 1
                      FROM memos child
                     WHERE child.parent_id = memos.id
                       AND child.is_active = true
                       AND child.deleted_at IS NULL
                  ) THEN '삭제된 메모입니다.'
                  ELSE body
                END,
                deleted_at = COALESCE(deleted_at, now()),
                updated_at = now()
          WHERE id = $1
            AND parent_id IS NULL`,
        [threadId],
      );
    },
    softDeleteMemoReply: async (replyId) => {
      await queryDb(
        `WITH deleted_reply AS (
           UPDATE memos
              SET is_active = false,
                  deleted_at = COALESCE(deleted_at, now()),
                  updated_at = now()
            WHERE id = $1
              AND parent_id IS NOT NULL
            RETURNING parent_id
         )
         UPDATE memos parent
            SET is_active = CASE
                  WHEN parent.deleted_at IS NOT NULL
                   AND NOT EXISTS (
                    SELECT 1
                      FROM memos child
                     WHERE child.parent_id = parent.id
                       AND child.is_active = true
                       AND child.deleted_at IS NULL
                  ) THEN false
                  ELSE parent.is_active
                END,
                updated_at = CASE
                  WHEN parent.deleted_at IS NOT NULL THEN now()
                  ELSE parent.updated_at
                END
           FROM deleted_reply
          WHERE parent.id = deleted_reply.parent_id`,
        [replyId],
      );
    },
  };
}
