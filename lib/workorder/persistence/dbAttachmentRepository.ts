import "server-only";

import { isDatabaseConfigured, queryDb } from "@/lib/db/client";
import type { DbQueryResultRow } from "@/lib/db/client";
import type { Attachment } from "@/types/workorder";
import type {
  CreateAttachmentRecordInput,
  WorkOrderAttachmentDbRecord,
} from "@/lib/workorder/persistence/attachmentTypes";
import { createAttachmentFileProxyUrl } from "@/lib/storage/r2/r2Client";
import {
  inferAttachmentTypeFromMime,
  normalizeAttachmentKindForDb,
  normalizeAttachmentScope,
} from "@/lib/workorder/persistence/attachmentTypes";
import type {
  AttachmentRepositoryInfo,
  AttachmentWritableRepository,
} from "@/lib/workorder/persistence/attachmentRepository";

type AttachmentRow = WorkOrderAttachmentDbRecord & DbQueryResultRow;
type WorkOrderCompanyRow = DbQueryResultRow & { company_id: string; company_name: string | null };

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim().length > 0)
    return Number(value);
  return null;
}

function toIsoString(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return typeof value === "string" ? value : new Date().toISOString();
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

type WorkOrderCompanyContext = {
  companyId: string;
  companyName: string | null;
};

async function getWorkOrderCompanyContext(workOrderId: string): Promise<WorkOrderCompanyContext> {
  const result = await queryDb<WorkOrderCompanyRow>(
    `SELECT company_id, company_name
       FROM spec_sheets
      WHERE id = $1
      LIMIT 1`,
    [workOrderId],
  );

  const row = result.rows[0];
  if (!row?.company_id) {
    throw new Error("WORK_ORDER_COMPANY_SCOPE_NOT_FOUND");
  }

  return {
    companyId: row.company_id,
    companyName: row.company_name,
  };
}

function getAttachmentAuthorDisplayName(authorId: string | null | undefined): string | null {
  const normalized = String(authorId ?? "").trim();
  if (!normalized || isUuid(normalized)) return null;
  return normalized;
}

function mapAttachmentRow(row: AttachmentRow): Attachment {
  const ownerName = getAttachmentAuthorDisplayName(row.author_id);

  return {
    id: row.id,
    name: row.original_name,
    type: inferAttachmentTypeFromMime(row.mime_type, row.original_name),
    url: createAttachmentFileProxyUrl(row.storage_key),
    storageKey: row.storage_key,
    thumbnailKey: row.thumbnail_key ?? null,
    thumbnailUrl: row.thumbnail_key
      ? createAttachmentFileProxyUrl(row.thumbnail_key)
      : null,
    previewUrl: createAttachmentFileProxyUrl(row.storage_key),
    scope: normalizeAttachmentScope(row.type),
    ownerId: row.author_id,
    ownerName,
    isPrimary: row.is_primary === true,
    sourceType: row.source_type ?? "user",
    generatedDocumentType: row.generated_document_type ?? null,
  };
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
    source_type: input.source_type ?? input.attachment.sourceType ?? "user",
    generated_document_type: input.generated_document_type ?? input.attachment.generatedDocumentType ?? null,
  };
}

function getDbAttachmentRepositoryInfo(): AttachmentRepositoryInfo {
  return {
    mode: "db",
    adapterConfigured: isDatabaseConfigured(),
    supportsWrite: true,
  };
}

export function createDbAttachmentRepository(): AttachmentWritableRepository {
  return {
    getRepositoryInfo: getDbAttachmentRepositoryInfo,
    listSnapshotByWorkOrderId: async (workOrderId) => {
      const attachments = await queryDb<AttachmentRow>(
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
                source_type,
                generated_document_type,
                is_active,
                deleted_at,
                created_at
           FROM attachments
          WHERE order_id = $1
            AND is_active = true
            AND deleted_at IS NULL
          ORDER BY created_at ASC`,
        [workOrderId],
      );

      return {
        attachments: attachments.rows.map(mapAttachmentRow),
      };
    },
    createAttachment: async (input) => {
      const company = await getWorkOrderCompanyContext(input.order_id);
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
           is_primary,
           source_type,
           generated_document_type
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
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
                   source_type,
                   generated_document_type,
                   is_active,
                   deleted_at,
                   created_at`,
        [
          attachmentId,
          company.companyId,
          company.companyName,
          next.order_id,
          next.type,
          next.storage_key,
          next.thumbnail_key,
          next.original_name,
          next.mime_type,
          next.size_bytes,
          next.author_id,
          next.is_primary,
          next.source_type,
          next.generated_document_type,
        ],
      );

      const [created] = result.rows;
      if (!created) throw new Error("Attachment creation failed");
      return created;
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
                source_type,
                generated_document_type,
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
                source_type,
                generated_document_type,
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
    softDeleteAttachment: async (input) => {
      const deletedBy = input.deletedBy ?? null;
      const trashRetentionDays = Number.isFinite(
        Number(input.trashRetentionDays),
      )
        ? Math.max(0, Math.trunc(Number(input.trashRetentionDays)))
        : 30;
      const result = await queryDb<AttachmentRow>(
        `WITH updated_attachment AS (
           UPDATE attachments
              SET is_active = false,
                  is_primary = false,
                  deleted_at = COALESCE(deleted_at, now()),
                  deleted_by = COALESCE($2, deleted_by),
                  delete_source = COALESCE(delete_source, 'manual'),
                  delete_scope = COALESCE(delete_scope, 'single'),
                  delete_parent_type = COALESCE(delete_parent_type, 'none'),
                  delete_parent_id = NULL,
                  delete_batch_id = COALESCE(delete_batch_id, id),
                  purge_after_at = COALESCE(purge_after_at, now() + ($3::integer * interval '1 day')),
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
                      source_type,
                      generated_document_type,
                      is_active,
                      deleted_at,
                      deleted_by,
                      delete_source,
                      delete_scope,
                      delete_parent_type,
                      delete_parent_id,
                      delete_batch_id,
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
             delete_source,
             delete_scope,
             delete_parent_type,
             delete_parent_id,
             delete_batch_id,
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
                  delete_source,
                  delete_scope,
                  delete_parent_type,
                  delete_parent_id,
                  delete_batch_id,
                  COALESCE(deleted_at, now()),
                  COALESCE(purge_after_at, now() + ($3::integer * interval '1 day'))
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
                source_type,
                generated_document_type,
                is_active,
                deleted_at,
                created_at
           FROM updated_attachment`,
        [input.attachmentId, deletedBy, trashRetentionDays],
      );

      return result.rows[0] ?? null;
    },

  };
}
