import "server-only";

import { queryDb } from "@/lib/db/client";
import type { DbQueryResultRow } from "@/lib/db/client";

export type AdminTrashDbActionInput = {
  trashItemIds: string[];
  actorId?: string | null;
};

export type AdminTrashDbActionResult = {
  requestedCount: number;
  affectedCount: number;
};

type CountRow = DbQueryResultRow & {
  affected_count: string | number;
};

function normalizeIds(ids: string[]): string[] {
  return Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)));
}

function readCount(row: CountRow | undefined): number {
  if (!row) return 0;
  const value = row.affected_count;
  return typeof value === "number" ? value : Number(value ?? 0);
}

export async function restoreAttachmentTrashItems(input: AdminTrashDbActionInput): Promise<AdminTrashDbActionResult> {
  const trashItemIds = normalizeIds(input.trashItemIds);
  if (trashItemIds.length === 0) return { requestedCount: 0, affectedCount: 0 };

  const result = await queryDb<CountRow>(
    `WITH target_trash AS (
       SELECT id, attachment_id
         FROM attachment_trash_items
        WHERE id = ANY($1::text[])
          AND purge_status = 'pending'
          AND restored_at IS NULL
          AND purged_at IS NULL
     ), restored_attachments AS (
       UPDATE attachments
          SET is_active = true,
              deleted_at = NULL,
              deleted_by = NULL,
              delete_reason = NULL,
              purge_after_at = NULL,
              updated_at = now()
        WHERE id IN (SELECT attachment_id FROM target_trash)
        RETURNING id
     ), restored_trash AS (
       UPDATE attachment_trash_items
          SET restored_at = now(),
              restored_by = $2,
              purge_status = 'restored',
              updated_at = now()
        WHERE id IN (SELECT id FROM target_trash)
        RETURNING id
     )
     SELECT COUNT(*)::text AS affected_count
       FROM restored_trash`,
    [trashItemIds, input.actorId ?? null],
  );

  return {
    requestedCount: trashItemIds.length,
    affectedCount: readCount(result.rows[0]),
  };
}

export async function requestPurgeAttachmentTrashItems(input: AdminTrashDbActionInput): Promise<AdminTrashDbActionResult> {
  const trashItemIds = normalizeIds(input.trashItemIds);
  if (trashItemIds.length === 0) return { requestedCount: 0, affectedCount: 0 };

  const result = await queryDb<CountRow>(
    `WITH target_trash AS (
       SELECT id, attachment_id
         FROM attachment_trash_items
        WHERE id = ANY($1::text[])
          AND purge_status = 'pending'
          AND restored_at IS NULL
          AND purged_at IS NULL
     ), marked_attachments AS (
       UPDATE attachments
          SET is_active = false,
              purge_after_at = COALESCE(purge_after_at, now()),
              updated_at = now()
        WHERE id IN (SELECT attachment_id FROM target_trash)
        RETURNING id
     ), marked_trash AS (
       UPDATE attachment_trash_items
          SET purge_status = 'purge_requested',
              purge_after_at = COALESCE(purge_after_at, now()),
              updated_at = now()
        WHERE id IN (SELECT id FROM target_trash)
        RETURNING id
     )
     SELECT COUNT(*)::text AS affected_count
       FROM marked_trash`,
    [trashItemIds],
  );

  return {
    requestedCount: trashItemIds.length,
    affectedCount: readCount(result.rows[0]),
  };
}

type AdminAttachmentRow = DbQueryResultRow & {
  id: string;
  order_id: string | null;
  workorder_title: string | null;
  original_name: string | null;
  mime_type: string | null;
  size_bytes: string | number | null;
  type: string | null;
  author_id: string | null;
  created_at: string | Date | null;
  deleted_at: string | Date | null;
  deleted_by: string | null;
  delete_reason: string | null;
  purge_after_at: string | Date | null;
  purge_status: string | null;
  purge_attempt_count: string | number | null;
  last_purge_error: string | null;
};

type AdminTrashRow = DbQueryResultRow & {
  id: string;
  attachment_id: string;
  order_id: string | null;
  workorder_title: string | null;
  original_name: string | null;
  mime_type: string | null;
  size_bytes: string | number | null;
  deleted_at: string | Date | null;
  deleted_by: string | null;
  delete_reason: string | null;
  purge_after_at: string | Date | null;
  purge_status: string | null;
  purge_attempt_count: string | number | null;
  last_purge_error: string | null;
};

function toNumber(value: string | number | null | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString().slice(0, 10);
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)}GB`;
  if (bytes >= 1024 ** 2) return `${Math.round(bytes / 1024 ** 2)}MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${bytes}B`;
}

function getFileIcon(mimeType: string | null | undefined, fileName: string): string {
  if (mimeType?.includes("pdf") || fileName.toLowerCase().endsWith(".pdf")) return "PDF";
  if (mimeType?.startsWith("image/")) return "IMG";
  return "FILE";
}

function getFileType(mimeType: string | null | undefined): string {
  if (mimeType?.includes("pdf")) return "PDF";
  if (mimeType?.startsWith("image/")) return "이미지";
  return "기타";
}

function getPurgeStatusLabel(status: string | null | undefined, errorMessage: string | null | undefined): string {
  if (status === "purge_requested") return "영구삭제 요청";
  if (status === "purged") return "삭제 완료";
  if (status === "restored") return "복구 완료";
  if (errorMessage) return "삭제 실패";
  return "복구 가능";
}

function isPurgeReady(value: string | Date | null | undefined): boolean {
  if (!value) return false;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() <= Date.now();
}

function getRestoreDaysLeft(value: string | Date | null | undefined): number {
  if (!value) return 0;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 0;
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86400000));
}

export async function listAdminFileManagementRows(trashRetentionDays = 30) {
  const safeTrashRetentionDays = [1, 5, 15, 30].includes(trashRetentionDays) ? trashRetentionDays : 30;
  const [attachmentsResult, trashResult] = await Promise.all([
    queryDb<AdminAttachmentRow>(
      `SELECT a.id,
              a.order_id,
              COALESCE(s.title, '작지명 없음') AS workorder_title,
              a.original_name,
              a.mime_type,
              a.size_bytes,
              a.type,
              a.author_id,
              a.created_at,
              a.deleted_at,
              a.deleted_by,
              a.delete_reason,
              a.purge_after_at
         FROM attachments a
         LEFT JOIN spec_sheets s ON s.id = a.order_id
        WHERE a.deleted_at IS NULL
          AND COALESCE(a.is_active, true) = true
        ORDER BY a.created_at DESC
        LIMIT 100`,
    ),
    queryDb<AdminTrashRow>(
      `SELECT t.id,
              t.attachment_id,
              t.order_id,
              COALESCE(s.title, '작지명 없음') AS workorder_title,
              t.original_name,
              t.mime_type,
              t.size_bytes,
              t.deleted_at,
              t.deleted_by,
              t.delete_reason,
              (COALESCE(t.deleted_at, now()) + ($1::integer * interval '1 day')) AS purge_after_at,
              t.purge_status,
              t.purge_attempt_count,
              t.last_purge_error
         FROM attachment_trash_items t
         LEFT JOIN spec_sheets s ON s.id = t.order_id
        WHERE t.purge_status IN ('pending', 'purge_requested')
          AND t.restored_at IS NULL
          AND t.purged_at IS NULL
        ORDER BY t.deleted_at DESC
        LIMIT 100`,
      [safeTrashRetentionDays],
    ),
  ]);

  const attachments = attachmentsResult.rows.map((row) => {
    const fileName = row.original_name || "파일명 없음";
    const sizeBytes = toNumber(row.size_bytes);
    return {
      id: row.id,
      workorderId: row.order_id || "",
      workorderTitle: row.workorder_title || "작지명 없음",
      fileName,
      fileType: getFileType(row.mime_type),
      fileIcon: getFileIcon(row.mime_type, fileName),
      fileSizeBytes: sizeBytes,
      fileSizeLabel: formatBytes(sizeBytes),
      uploadedAt: formatDate(row.created_at),
      uploadedBy: row.author_id || "미지정",
      status: "active" as const,
      statusLabel: "사용중",
      deletedAt: row.deleted_at ? formatDate(row.deleted_at) : null,
      deletedBy: row.deleted_by,
      deleteReason: row.delete_reason,
      purgeAfterAt: row.purge_after_at ? formatDate(row.purge_after_at) : null,
    };
  });

  const trashItems = trashResult.rows.map((row) => {
    const fileName = row.original_name || "파일명 없음";
    const sizeBytes = toNumber(row.size_bytes);
    const restoreDaysLeft = getRestoreDaysLeft(row.purge_after_at);
    return {
      id: row.id,
      attachmentId: row.attachment_id,
      workorderId: row.order_id || "",
      workorderTitle: row.workorder_title || "작지명 없음",
      fileName,
      fileIcon: getFileIcon(row.mime_type, fileName),
      fileSizeBytes: sizeBytes,
      fileSizeLabel: formatBytes(sizeBytes),
      deletedAt: formatDate(row.deleted_at),
      deletedBy: row.deleted_by || "미지정",
      purgeAfterAt: formatDate(row.purge_after_at),
      restoreDaysLeft,
      restoreLabel: `D-${restoreDaysLeft}`,
      deleteReason: row.delete_reason || "삭제 사유 없음",
      purgeStatus: (row.last_purge_error ? "failed" : row.purge_status || "pending") as "pending" | "purge_requested" | "purged" | "failed" | "restored",
      purgeStatusLabel: getPurgeStatusLabel(row.purge_status, row.last_purge_error),
      isPurgeReady: isPurgeReady(row.purge_after_at),
      lastPurgeError: row.last_purge_error,
    };
  });

  return { attachments, trashItems };
}

type PurgeCandidateRow = DbQueryResultRow & {
  id: string;
  attachment_id: string;
  storage_key: string | null;
  thumbnail_key: string | null;
  purge_after_at: string | Date | null;
};

export type AdminPurgeCandidate = {
  trashItemId: string;
  attachmentId: string;
  storageKey: string | null;
  thumbnailKey: string | null;
  purgeAfterAt: string;
};

export async function listPurgeReadyAttachmentTrashItems(limit = 50, trashRetentionDays = 30): Promise<AdminPurgeCandidate[]> {
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 200);
  const safeTrashRetentionDays = [1, 5, 15, 30].includes(trashRetentionDays) ? trashRetentionDays : 30;
  const result = await queryDb<PurgeCandidateRow>(
    `SELECT id,
            attachment_id,
            storage_key,
            thumbnail_key,
            (COALESCE(deleted_at, now()) + ($2::integer * interval '1 day')) AS purge_after_at
       FROM attachment_trash_items
      WHERE restored_at IS NULL
        AND purged_at IS NULL
        AND (
          purge_status = 'purge_requested'
          OR (purge_status = 'pending' AND (COALESCE(deleted_at, now()) + ($2::integer * interval '1 day')) <= now())
        )
      ORDER BY purge_after_at ASC
      LIMIT $1`,
    [safeLimit, safeTrashRetentionDays],
  );

  return result.rows.map((row) => ({
    trashItemId: row.id,
    attachmentId: row.attachment_id,
    storageKey: row.storage_key,
    thumbnailKey: row.thumbnail_key,
    purgeAfterAt: formatDate(row.purge_after_at),
  }));
}

export async function markAttachmentTrashItemsPurged(input: AdminTrashDbActionInput): Promise<AdminTrashDbActionResult> {
  const trashItemIds = normalizeIds(input.trashItemIds);
  if (trashItemIds.length === 0) return { requestedCount: 0, affectedCount: 0 };

  const result = await queryDb<CountRow>(
    `WITH target_trash AS (
       SELECT id, attachment_id
         FROM attachment_trash_items
        WHERE id = ANY($1::text[])
          AND purge_status IN ('pending', 'purge_requested')
          AND restored_at IS NULL
          AND purged_at IS NULL
     ), marked_attachments AS (
       UPDATE attachments
          SET is_active = false,
              purge_after_at = COALESCE(purge_after_at, now()),
              updated_at = now()
        WHERE id IN (SELECT attachment_id FROM target_trash)
        RETURNING id
     ), marked_trash AS (
       UPDATE attachment_trash_items
          SET purged_at = now(),
              purge_status = 'purged',
              last_purge_attempt_at = now(),
              last_purge_error = NULL,
              updated_at = now()
        WHERE id IN (SELECT id FROM target_trash)
        RETURNING id
     )
     SELECT COUNT(*)::text AS affected_count
       FROM marked_trash`,
    [trashItemIds],
  );

  return {
    requestedCount: trashItemIds.length,
    affectedCount: readCount(result.rows[0]),
  };
}

export async function markAttachmentTrashItemsPurgedByAttachmentIds(input: { attachmentIds: string[]; actorId?: string | null }): Promise<AdminTrashDbActionResult> {
  const attachmentIds = normalizeIds(input.attachmentIds);
  if (attachmentIds.length === 0) return { requestedCount: 0, affectedCount: 0 };

  const result = await queryDb<CountRow>(
    `WITH target_trash AS (
       SELECT id, attachment_id
         FROM attachment_trash_items
        WHERE attachment_id = ANY($1::text[])
          AND purge_status IN ('pending', 'purge_requested')
          AND restored_at IS NULL
          AND purged_at IS NULL
     ), marked_attachments AS (
       UPDATE attachments
          SET is_active = false,
              purge_after_at = COALESCE(purge_after_at, now()),
              updated_at = now()
        WHERE id IN (SELECT attachment_id FROM target_trash)
        RETURNING id
     ), marked_trash AS (
       UPDATE attachment_trash_items
          SET purged_at = now(),
              purge_status = 'purged',
              last_purge_attempt_at = now(),
              last_purge_error = NULL,
              updated_at = now()
        WHERE id IN (SELECT id FROM target_trash)
        RETURNING id
     )
     SELECT COUNT(*)::text AS affected_count
       FROM marked_trash`,
    [attachmentIds],
  );

  return {
    requestedCount: attachmentIds.length,
    affectedCount: readCount(result.rows[0]),
  };
}

export async function markAttachmentTrashItemPurgeFailed(input: { trashItemId: string; errorMessage: string }): Promise<void> {
  const trashItemId = input.trashItemId.trim();
  if (!trashItemId) return;

  await queryDb(
    `UPDATE attachment_trash_items
        SET purge_attempt_count = COALESCE(purge_attempt_count, 0) + 1,
            last_purge_attempt_at = now(),
            last_purge_error = LEFT($2, 1000),
            updated_at = now()
      WHERE id = $1
        AND restored_at IS NULL
        AND purged_at IS NULL`,
    [trashItemId, input.errorMessage],
  );
}
