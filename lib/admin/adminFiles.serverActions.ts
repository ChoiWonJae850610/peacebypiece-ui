import "server-only";

import { queryDb } from "@/lib/db/client";
import { formatAdminStorageDate, formatAdminStorageDateTime } from "@/lib/admin/adminFiles.datePresentation";
import { createAttachmentFileProxyUrl } from "@/lib/storage/r2/r2Client";
import { getWorkOrderDisplayTitle } from "@/lib/workorder/presentation/workOrderPresentation";
import {
  createAdminWorkOrderTrashActionMessage,
  createAdminWorkOrderTrashIdRequiredMessage,
  createAdminWorkOrderTrashNotConnectedMessage,
  createAdminWorkOrderTrashNotFoundMessage,
} from "@/lib/admin/adminFiles.presentation";
import {
  ADMIN_FILE_TRASH_OPEN_PURGE_STATUS_SQL_LIST,
  ADMIN_TRASH_RESTORE_POLICIES,
  ADMIN_FILE_TRASH_PURGE_STATUS_SQL,
  ADMIN_FILE_TRASH_PURGE_STATUSES,
  ADMIN_WORKORDER_ADMIN_TRASH_HIDDEN_DELETE_STATUS_SQL_LIST,
  ADMIN_WORKORDER_ADMIN_TRASH_HIDDEN_PURGE_STATUS_SQL_LIST,
  ADMIN_WORKORDER_DELETE_STATUS_SQL,
  ADMIN_WORKORDER_PURGE_STATUS_SQL,
  createAdminWorkOrderBundleMetadataSqlPredicate,
  getAdminFileTrashVisiblePurgeStatus,
  getAdminTrashRestorePolicy,
  getAdminTrashRestorePolicyLabel,
  isAdminFileTrashPendingStatus,
} from "@/lib/admin/files/trashPolicy";
import type { DbQueryResultRow } from "@/lib/db/client";
import type {
  AdminManagedFileItem,
  AdminStorageWorkOrderItem,
  AdminTrashFileItem,
} from "@/lib/admin/adminFiles.types";

export type AdminTrashDbActionInput = {
  trashItemIds: string[];
  actorId?: string | null;
};

export type AdminTrashDbActionResult = {
  requestedCount: number;
  affectedCount: number;
  documentCount: number;
  designCount: number;
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

function createFileKindCountSql(alias: string): string {
  return `(CASE WHEN COALESCE(${alias}.mime_type, '') LIKE 'image/%' OR lower(COALESCE(${alias}.original_name, '')) ~ '\.(jpg|jpeg|png|gif|webp|bmp|svg|heic|heif|ai|psd)$' THEN 'design' ELSE 'document' END)`;
}


function createWorkOrderBundleMetadataPredicate(
  alias: string,
  workOrderParamIndex?: number,
): string {
  return createAdminWorkOrderBundleMetadataSqlPredicate(alias, workOrderParamIndex);
}

function createNotWorkOrderBundleTrashPredicate(
  alias: string,
  workOrderParamIndex?: number,
): string {
  return `(NOT ${createWorkOrderBundleMetadataPredicate(alias, workOrderParamIndex)})`;
}

function createWorkOrderBundleMemoMetadataPredicate(
  alias: string,
  workOrderParamIndex: number,
): string {
  return `(
    (
      COALESCE(${alias}.delete_source, '') = 'workorder_bundle'
      OR (COALESCE(${alias}.delete_scope, '') = 'bundle' AND COALESCE(${alias}.delete_parent_type, '') = 'workorder')
    )
    AND (
      ${alias}.delete_parent_id = $${workOrderParamIndex}
      OR ${alias}.delete_batch_id = $${workOrderParamIndex}
    )
  )`;
}

function isAttachmentDeletedWithWorkOrder(input: {
  parentWorkOrderDeleted: boolean;
  orderId?: string | null;
  deleteSource?: string | null;
  deleteScope?: string | null;
  deleteParentType?: string | null;
  deleteParentId?: string | null;
  deleteBatchId?: string | null;
}): boolean {
  if (!input.parentWorkOrderDeleted) return false;
  const orderId = String(input.orderId ?? "").trim();
  if (!orderId) return false;

  const deleteParentId = String(input.deleteParentId ?? "").trim();
  const deleteBatchId = String(input.deleteBatchId ?? "").trim();
  const hasWorkOrderBundleMetadata =
    input.deleteSource === "workorder_bundle" ||
    (input.deleteScope === "bundle" &&
      input.deleteParentType === "workorder");

  return (
    hasWorkOrderBundleMetadata &&
    (deleteParentId === orderId || deleteBatchId === orderId)
  );
}

export async function restoreAttachmentTrashItems(
  input: AdminTrashDbActionInput,
): Promise<AdminTrashDbActionResult> {
  const trashItemIds = normalizeIds(input.trashItemIds);
  if (trashItemIds.length === 0)
    return {
      requestedCount: 0,
      affectedCount: 0,
      documentCount: 0,
      designCount: 0,
    };

  const result = await queryDb<
    CountRow & {
      document_count: string | number;
      design_count: string | number;
    }
  >(
    `WITH target_trash AS (
       SELECT t.id, t.attachment_id, t.original_name, t.mime_type
         FROM attachment_trash_items t
         LEFT JOIN spec_sheets s ON s.id = t.order_id
        WHERE t.id = ANY($1::text[])
          AND t.purge_status = ${ADMIN_FILE_TRASH_PURGE_STATUS_SQL.pending}
          AND t.restored_at IS NULL
          AND t.purged_at IS NULL
          AND (t.order_id IS NULL OR (s.deleted_at IS NULL AND COALESCE(s.is_active, true) = true))
     ), restored_attachments AS (
       UPDATE attachments
          SET is_active = true,
              deleted_at = NULL,
              deleted_by = NULL,
              delete_source = NULL,
              delete_scope = NULL,
              delete_parent_type = NULL,
              delete_parent_id = NULL,
              delete_batch_id = NULL,
              purge_after_at = NULL,
              updated_at = now()
        WHERE id IN (SELECT attachment_id FROM target_trash)
        RETURNING id
     ), restored_trash AS (
       UPDATE attachment_trash_items
          SET restored_at = now(),
              restored_by = $2,
              purge_status = ${ADMIN_FILE_TRASH_PURGE_STATUS_SQL.restored},
              updated_at = now()
        WHERE id IN (SELECT id FROM target_trash)
        RETURNING id
     )
     SELECT COUNT(*)::text AS affected_count,
            COUNT(*) FILTER (WHERE ${createFileKindCountSql("target_trash")} = 'document')::text AS document_count,
            COUNT(*) FILTER (WHERE ${createFileKindCountSql("target_trash")} = 'design')::text AS design_count
       FROM target_trash`,
    [trashItemIds, input.actorId ?? null],
  );

  const row = result.rows[0];
  return {
    requestedCount: trashItemIds.length,
    affectedCount: readCount(row),
    documentCount: toNumber(row?.document_count),
    designCount: toNumber(row?.design_count),
  };
}

export async function requestPurgeAttachmentTrashItems(
  input: AdminTrashDbActionInput,
): Promise<AdminTrashDbActionResult> {
  const trashItemIds = normalizeIds(input.trashItemIds);
  if (trashItemIds.length === 0)
    return {
      requestedCount: 0,
      affectedCount: 0,
      documentCount: 0,
      designCount: 0,
    };

  const result = await queryDb<
    CountRow & {
      document_count: string | number;
      design_count: string | number;
    }
  >(
    `WITH target_trash AS (
       SELECT t.id, t.attachment_id, t.original_name, t.mime_type
         FROM attachment_trash_items t
         LEFT JOIN spec_sheets s ON s.id = t.order_id
        WHERE t.id = ANY($1::text[])
          AND t.purge_status = ${ADMIN_FILE_TRASH_PURGE_STATUS_SQL.pending}
          AND t.restored_at IS NULL
          AND t.purged_at IS NULL
          AND (
            t.order_id IS NULL
            OR (s.deleted_at IS NULL AND COALESCE(s.is_active, true) = true)
            OR ${createNotWorkOrderBundleTrashPredicate("t")}
          )
     ), marked_attachments AS (
       UPDATE attachments
          SET is_active = false,
              purge_after_at = COALESCE(purge_after_at, now()),
              updated_at = now()
        WHERE id IN (SELECT attachment_id FROM target_trash)
        RETURNING id
     ), marked_trash AS (
       UPDATE attachment_trash_items
          SET purge_status = ${ADMIN_FILE_TRASH_PURGE_STATUS_SQL.purgeRequested},
              purge_requested_by = $2,
              purge_after_at = COALESCE(purge_after_at, now()),
              updated_at = now()
        WHERE id IN (SELECT id FROM target_trash)
        RETURNING id
     )
     SELECT COUNT(*)::text AS affected_count,
            COUNT(*) FILTER (WHERE ${createFileKindCountSql("target_trash")} = 'document')::text AS document_count,
            COUNT(*) FILTER (WHERE ${createFileKindCountSql("target_trash")} = 'design')::text AS design_count
       FROM target_trash`,
    [trashItemIds, input.actorId ?? null],
  );

  const row = result.rows[0];
  return {
    requestedCount: trashItemIds.length,
    affectedCount: readCount(row),
    documentCount: toNumber(row?.document_count),
    designCount: toNumber(row?.design_count),
  };
}

type AdminAttachmentRow = DbQueryResultRow & {
  id: string;
  order_id: string | null;
  workorder_title: string | null;
  workorder_base_title: string | null;
  workorder_reorder_round: string | number | null;
  workorder_kind: "sample" | "main" | "rework" | null;
  workorder_is_rework: boolean | null;
  original_name: string | null;
  mime_type: string | null;
  size_bytes: string | number | null;
  type: string | null;
  author_id: string | null;
  created_at: string | Date | null;
  deleted_at: string | Date | null;
  deleted_by: string | null;
  purge_after_at: string | Date | null;
  purge_status: string | null;
  delete_source: string | null;
  delete_scope: string | null;
  delete_parent_type: string | null;
  delete_parent_id: string | null;
  delete_batch_id: string | null;
  purge_attempt_count: string | number | null;
  last_purge_error: string | null;
};

type AdminTrashRow = DbQueryResultRow & {
  id: string;
  attachment_id: string;
  order_id: string | null;
  workorder_title: string | null;
  workorder_base_title: string | null;
  workorder_reorder_round: string | number | null;
  workorder_kind: "sample" | "main" | "rework" | null;
  workorder_is_rework: boolean | null;
  parent_workorder_deleted: boolean | null;
  parent_workorder_deleted_at: string | Date | null;
  original_name: string | null;
  mime_type: string | null;
  size_bytes: string | number | null;
  storage_key: string | null;
  thumbnail_key: string | null;
  deleted_at: string | Date | null;
  deleted_by: string | null;
  purge_after_at: string | Date | null;
  purge_status: string | null;
  delete_source: string | null;
  delete_scope: string | null;
  delete_parent_type: string | null;
  delete_parent_id: string | null;
  delete_batch_id: string | null;
  purge_attempt_count: string | number | null;
  last_purge_error: string | null;
};

type AdminStorageWorkOrderRow = DbQueryResultRow & {
  id: string;
  title: string | null;
  base_title: string | null;
  reorder_round: string | number | null;
  work_order_kind: "sample" | "main" | "rework" | null;
  is_rework: boolean | null;
  status: string | null;
  updated_at: string | Date | null;
  deleted_at: string | Date | null;
  attachment_count: string | number | null;
  trash_attachment_count: string | number | null;
  memo_count: string | number | null;
  trash_memo_count: string | number | null;
};

function toNumber(value: string | number | null | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDate(value: string | Date | null | undefined): string {
  return formatAdminStorageDate(value);
}

function formatDateTime(value: string | Date | null | undefined): string {
  return formatAdminStorageDateTime(value);
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0B";
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)}GB`;
  if (bytes >= 1024 ** 2) return `${Math.round(bytes / 1024 ** 2)}MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${bytes}B`;
}

function formatAdminWorkOrderTitle(input: {
  title?: string | null;
  baseTitle?: string | null;
  reorderRound?: string | number | null;
  workOrderKind?: "sample" | "main" | "rework" | null;
  isRework?: boolean | null;
}): string {
  const title = String(input.title ?? "").trim();
  const baseTitle = String(input.baseTitle ?? "").trim();
  const rawRound = Number(input.reorderRound ?? 0);
  const reorderRound = Number.isFinite(rawRound) ? rawRound : 0;
  const workOrderKind =
    input.workOrderKind ?? (reorderRound > 0 ? "main" : "sample");
  return getWorkOrderDisplayTitle({
    title: title || undefined,
    baseTitle: baseTitle || undefined,
    reorderRound,
    workOrderKind,
    isDefectOrder: Boolean(input.isRework),
  });
}

function getFileIcon(
  mimeType: string | null | undefined,
  fileName: string,
): string {
  if (mimeType?.includes("pdf") || fileName.toLowerCase().endsWith(".pdf"))
    return "PDF";
  if (mimeType?.startsWith("image/")) return "IMG";
  return "FILE";
}

function createAttachmentFilePreviewUrl(
  storageKey: string | null | undefined,
): string | null {
  if (!storageKey) return null;
  const cleanKey = String(storageKey).trim();
  if (!cleanKey) return null;
  return createAttachmentFileProxyUrl(cleanKey);
}

function getFileType(
  mimeType: string | null | undefined,
  fileName = "",
): string {
  const lowerName = fileName.toLowerCase();
  const extension = lowerName.includes(".")
    ? (lowerName.split(".").pop() ?? "")
    : "";
  if (
    mimeType?.includes("pdf") ||
    extension === "pdf" ||
    ["doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "hwp"].includes(
      extension,
    )
  )
    return "문서";
  if (
    mimeType?.startsWith("image/") ||
    [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "webp",
      "bmp",
      "svg",
      "heic",
      "heif",
      "ai",
      "psd",
    ].includes(extension)
  )
    return "디자인";
  return "문서";
}

function getWorkOrderStatusLabel(status: string | null | undefined): string {
  if (status === "draft") return "작성중";
  if (status === "review_requested") return "검토요청";
  if (status === "review_completed" || status === "review_approved")
    return "검토완료";
  if (status === "request_order" || status === "order_requested")
    return "발주요청";
  if (status === "order_pending") return "발주대기";
  if (status === "inspection" || status === "in_inspection") return "검수";
  if (status === "inspection_pending") return "검수대기";
  if (status === "inspection_in_progress") return "검수중";
  if (status === "inspection_completed") return "검수완료";
  if (status === "completed") return "완료";
  if (status === "rejected") return "반려";
  if (status === "cancelled") return "취소";
  if (status === "in_progress" || status === "in_production") return "진행중";
  return status || "상태 없음";
}

function getPurgeStatusLabel(
  status: string | null | undefined,
  errorMessage: string | null | undefined,
): string {
  const visibleStatus = getAdminFileTrashVisiblePurgeStatus({
    status,
    lastPurgeError: errorMessage,
  });
  if (visibleStatus === ADMIN_FILE_TRASH_PURGE_STATUSES.purgeRequested)
    return "삭제 요청";
  if (visibleStatus === ADMIN_FILE_TRASH_PURGE_STATUSES.processing)
    return "삭제 처리 중";
  if (visibleStatus === ADMIN_FILE_TRASH_PURGE_STATUSES.purged)
    return "삭제 완료";
  if (visibleStatus === ADMIN_FILE_TRASH_PURGE_STATUSES.restored)
    return "복원 완료";
  if (visibleStatus === ADMIN_FILE_TRASH_PURGE_STATUSES.failed)
    return "삭제 실패";
  return "복원 가능";
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

type AdminFileManagementRows = {
  attachments: AdminManagedFileItem[];
  trashItems: AdminTrashFileItem[];
  workOrders: AdminStorageWorkOrderItem[];
};

export async function listAdminFileManagementRows(
  trashRetentionDays = 30,
): Promise<AdminFileManagementRows> {
  const safeTrashRetentionDays = [1, 5, 15, 30].includes(trashRetentionDays)
    ? trashRetentionDays
    : 30;
  const [attachmentsResult, trashResult, workOrdersResult] = await Promise.all([
    queryDb<AdminAttachmentRow>(
      `SELECT a.id,
              a.order_id,
              COALESCE(s.title, '작업지시서명 없음') AS workorder_title,
              NULL::text AS workorder_base_title,
              s.reorder_round AS workorder_reorder_round,
              s.work_order_kind AS workorder_kind,
              s.is_rework AS workorder_is_rework,
              a.original_name,
              a.mime_type,
              a.size_bytes,
              a.type,
              a.author_id,
              a.created_at,
              a.deleted_at,
              a.deleted_by,
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
              COALESCE(s.title, '작업지시서명 없음') AS workorder_title,
              NULL::text AS workorder_base_title,
              s.reorder_round AS workorder_reorder_round,
              s.work_order_kind AS workorder_kind,
              s.is_rework AS workorder_is_rework,
              (s.id IS NOT NULL AND (s.deleted_at IS NOT NULL OR COALESCE(s.is_active, true) = false)) AS parent_workorder_deleted,
              s.deleted_at AS parent_workorder_deleted_at,
              t.original_name,
              t.mime_type,
              t.size_bytes,
              t.storage_key,
              t.thumbnail_key,
              t.deleted_at,
              t.deleted_by,
              t.delete_source,
              t.delete_scope,
              t.delete_parent_type,
              t.delete_parent_id,
              t.delete_batch_id,
              (COALESCE(t.deleted_at, now()) + ($1::integer * interval '1 day')) AS purge_after_at,
              t.purge_status,
              t.purge_attempt_count,
              t.last_purge_error
         FROM attachment_trash_items t
         LEFT JOIN spec_sheets s ON s.id = t.order_id
        WHERE t.purge_status = ${ADMIN_FILE_TRASH_PURGE_STATUS_SQL.pending}
          AND t.restored_at IS NULL
          AND t.purged_at IS NULL
          AND (
            s.id IS NULL
            OR COALESCE(s.delete_status, ${ADMIN_WORKORDER_DELETE_STATUS_SQL.active}) <> ${ADMIN_WORKORDER_DELETE_STATUS_SQL.purged}
            OR ${createNotWorkOrderBundleTrashPredicate("t")}
          )
          AND (s.id IS NULL OR s.purged_at IS NULL OR ${createNotWorkOrderBundleTrashPredicate("t")})
        ORDER BY t.deleted_at DESC
        LIMIT 100`,
      [safeTrashRetentionDays],
    ),
    queryDb<AdminStorageWorkOrderRow>(
      `SELECT s.id,
              COALESCE(s.title, '작업지시서명 없음') AS title,
              NULL::text AS base_title,
              s.reorder_round,
              s.work_order_kind,
              s.is_rework,
              s.status,
              s.updated_at,
              s.deleted_at,
              s.delete_status,
              s.purge_status,
              s.purged_at,
              COUNT(DISTINCT a.id) FILTER (WHERE a.deleted_at IS NULL AND COALESCE(a.is_active, true) = true)::text AS attachment_count,
              COUNT(DISTINCT a.id) FILTER (WHERE a.deleted_at IS NOT NULL OR COALESCE(a.is_active, true) = false)::text AS trash_attachment_count,
              COUNT(DISTINCT m.id) FILTER (WHERE m.deleted_at IS NULL AND COALESCE(m.is_active, true) = true)::text AS memo_count,
              COUNT(DISTINCT m.id) FILTER (
                WHERE (m.deleted_at IS NOT NULL OR COALESCE(m.is_active, true) = false)
                  AND (
                    (
                      COALESCE(m.delete_source, '') = 'workorder_bundle'
                      OR (COALESCE(m.delete_scope, '') = 'bundle' AND COALESCE(m.delete_parent_type, '') = 'workorder')
                    )
                    AND (m.delete_parent_id = s.id OR m.delete_batch_id = s.id)
                  )
              )::text AS trash_memo_count
         FROM spec_sheets s
         LEFT JOIN attachments a ON a.order_id = s.id
         LEFT JOIN memos m ON m.order_id = s.id
        WHERE (s.deleted_at IS NOT NULL OR COALESCE(s.is_active, true) = false)
          AND COALESCE(s.delete_status, ${ADMIN_WORKORDER_DELETE_STATUS_SQL.deleted}) NOT IN (${ADMIN_WORKORDER_ADMIN_TRASH_HIDDEN_DELETE_STATUS_SQL_LIST})
          AND COALESCE(s.purge_status, ${ADMIN_WORKORDER_PURGE_STATUS_SQL.pending}) NOT IN (${ADMIN_WORKORDER_ADMIN_TRASH_HIDDEN_PURGE_STATUS_SQL_LIST})
          AND s.purged_at IS NULL
        GROUP BY s.id, s.title, s.reorder_round, s.work_order_kind, s.is_rework, s.status, s.updated_at, s.deleted_at, s.delete_status, s.purge_status, s.purged_at
        ORDER BY COALESCE(s.deleted_at, s.updated_at) DESC
        LIMIT 50`,
    ),
  ]);

  const attachments: AdminManagedFileItem[] = attachmentsResult.rows.map(
    (row) => {
      const fileName = row.original_name || "파일명 없음";
      const fileType = getFileType(row.mime_type, fileName);
      const sizeBytes = toNumber(row.size_bytes);
      return {
        id: row.id,
        workorderId: row.order_id || "",
        workorderTitle: formatAdminWorkOrderTitle({
          title: row.workorder_title || "작업지시서명 없음",
          baseTitle: row.workorder_base_title,
          reorderRound: row.workorder_reorder_round,
          workOrderKind: row.workorder_kind,
          isRework: row.workorder_is_rework,
        }),
        fileName,
        fileType,
        fileKind: fileType === "디자인" ? "design" : "document",
        fileIcon: getFileIcon(row.mime_type, fileName),
        fileSizeBytes: sizeBytes,
        fileSizeLabel: formatBytes(sizeBytes),
        uploadedAt: formatDate(row.created_at),
        uploadedBy: row.author_id || "미지정",
        status: "active" as const,
        statusLabel: "사용중",
        deletedAt: row.deleted_at ? formatDateTime(row.deleted_at) : null,
        deletedBy: row.deleted_by,
        purgeAfterAt: row.purge_after_at
          ? formatDate(row.purge_after_at)
          : null,
      };
    },
  );

  const trashItems: AdminTrashFileItem[] = trashResult.rows.map((row) => {
    const fileName = row.original_name || "파일명 없음";
    const fileType = getFileType(row.mime_type, fileName);
    const sizeBytes = toNumber(row.size_bytes);
    const restoreDaysLeft = getRestoreDaysLeft(row.purge_after_at);
    const parentWorkOrderDeleted = Boolean(row.parent_workorder_deleted);
    const deletedWithWorkOrder = isAttachmentDeletedWithWorkOrder({
      parentWorkOrderDeleted,
      orderId: row.order_id,
      deleteSource: row.delete_source,
      deleteScope: row.delete_scope,
      deleteParentType: row.delete_parent_type,
      deleteParentId: row.delete_parent_id,
      deleteBatchId: row.delete_batch_id,
    });
    const effectiveDeletedAt =
      deletedWithWorkOrder && row.parent_workorder_deleted_at
        ? row.parent_workorder_deleted_at
        : row.deleted_at;
    const restorePolicy = getAdminTrashRestorePolicy({
      parentWorkOrderDeleted,
      deleteSource: row.delete_source,
      deleteScope: row.delete_scope,
      deleteParentType: row.delete_parent_type,
    });
    const restorePolicyLabel = getAdminTrashRestorePolicyLabel(restorePolicy);
    const isPending = isAdminFileTrashPendingStatus(row.purge_status);
    return {
      id: row.id,
      attachmentId: row.attachment_id,
      workorderId: row.order_id || "",
      workorderTitle: formatAdminWorkOrderTitle({
        title: row.workorder_title || "작업지시서명 없음",
        baseTitle: row.workorder_base_title,
        reorderRound: row.workorder_reorder_round,
        workOrderKind: row.workorder_kind,
        isRework: row.workorder_is_rework,
      }),
      fileName,
      fileType,
      fileKind: fileType === "디자인" ? "design" : "document",
      fileIcon: getFileIcon(row.mime_type, fileName),
      fileSizeBytes: sizeBytes,
      fileSizeLabel: formatBytes(sizeBytes),
      thumbnailUrl: createAttachmentFilePreviewUrl(row.thumbnail_key),
      previewUrl: createAttachmentFilePreviewUrl(row.storage_key),
      deletedAt: formatDateTime(effectiveDeletedAt),
      deletedBy: row.deleted_by || "미지정",
      purgeAfterAt: formatDate(row.purge_after_at),
      restoreDaysLeft,
      restoreLabel: `D-${restoreDaysLeft}`,
      purgeStatus: getAdminFileTrashVisiblePurgeStatus({
        status: row.purge_status,
        lastPurgeError: row.last_purge_error,
      }),
      purgeStatusLabel: getPurgeStatusLabel(
        row.purge_status,
        row.last_purge_error,
      ),
      isPurgeReady: isPurgeReady(row.purge_after_at),
      lastPurgeError: row.last_purge_error,
      parentWorkOrderDeleted,
      restorePolicy,
      restorePolicyLabel,
      canRestore:
        restorePolicy === "file_unit" && !row.last_purge_error && isPending,
      restoreDisabledReason: null,
      canPurge:
        restorePolicy !== ADMIN_TRASH_RESTORE_POLICIES.bundleRequired &&
        !row.last_purge_error &&
        isPending,
      purgeDisabledReason: null,
    };
  });

  const workOrders: AdminStorageWorkOrderItem[] = workOrdersResult.rows.map(
    (row) => {
      const attachmentCount = toNumber(row.attachment_count);
      const trashAttachmentCount = toNumber(row.trash_attachment_count);
      const memoCount = toNumber(row.memo_count);
      const trashMemoCount = toNumber(row.trash_memo_count);

      return {
        id: row.id,
        title: formatAdminWorkOrderTitle({
          title: row.title || "작업지시서명 없음",
          baseTitle: row.base_title,
          reorderRound: row.reorder_round,
          workOrderKind: row.work_order_kind,
          isRework: row.is_rework,
        }),
        status: row.status || "unknown",
        statusLabel: getWorkOrderStatusLabel(row.status),
        updatedAt: formatDate(row.updated_at),
        deletedAt: row.deleted_at ? formatDateTime(row.deleted_at) : null,
        attachmentCount,
        trashAttachmentCount,
        memoCount,
        trashMemoCount,
        restorePolicyLabel: "묶음 복원 준비중",
        attachmentSummaryLabel: `첨부 ${attachmentCount + trashAttachmentCount}개`,
        memoSummaryLabel: `메모 ${memoCount + trashMemoCount}개`,
      };
    },
  );

  return { attachments, trashItems, workOrders };
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

export async function listPurgeReadyAttachmentTrashItems(
  limit = 50,
  trashRetentionDays = 30,
): Promise<AdminPurgeCandidate[]> {
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 200);
  const safeTrashRetentionDays = [1, 5, 15, 30].includes(trashRetentionDays)
    ? trashRetentionDays
    : 30;
  const result = await queryDb<PurgeCandidateRow>(
    `SELECT t.id,
            t.attachment_id,
            t.storage_key,
            t.thumbnail_key,
            (COALESCE(t.deleted_at, now()) + ($2::integer * interval '1 day')) AS purge_after_at
       FROM attachment_trash_items t
       LEFT JOIN spec_sheets s ON s.id = t.order_id
      WHERE t.restored_at IS NULL
        AND t.purged_at IS NULL
        AND (
          t.order_id IS NULL
          OR COALESCE(s.delete_status, ${ADMIN_WORKORDER_DELETE_STATUS_SQL.active}) <> ${ADMIN_WORKORDER_DELETE_STATUS_SQL.purged}
          OR ${createNotWorkOrderBundleTrashPredicate("t")}
          OR t.purge_status = ${ADMIN_FILE_TRASH_PURGE_STATUS_SQL.purgeRequested}
        )
        AND (s.id IS NULL OR s.purged_at IS NULL OR ${createNotWorkOrderBundleTrashPredicate("t")} OR t.purge_status = ${ADMIN_FILE_TRASH_PURGE_STATUS_SQL.purgeRequested})
        AND (
          t.order_id IS NULL
          OR (s.deleted_at IS NULL AND COALESCE(s.is_active, true) = true)
          OR ${createNotWorkOrderBundleTrashPredicate("t")}
          OR (COALESCE(s.delete_status, ${ADMIN_WORKORDER_DELETE_STATUS_SQL.active}) = ${ADMIN_WORKORDER_DELETE_STATUS_SQL.purged} AND t.purge_status = ${ADMIN_FILE_TRASH_PURGE_STATUS_SQL.purgeRequested})
        )
        AND (
          t.purge_status = ${ADMIN_FILE_TRASH_PURGE_STATUS_SQL.purgeRequested}
          OR (t.purge_status = ${ADMIN_FILE_TRASH_PURGE_STATUS_SQL.pending} AND (COALESCE(t.deleted_at, now()) + ($2::integer * interval '1 day')) <= now())
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

export async function markAttachmentTrashItemsPurged(
  input: AdminTrashDbActionInput,
): Promise<AdminTrashDbActionResult> {
  const trashItemIds = normalizeIds(input.trashItemIds);
  if (trashItemIds.length === 0)
    return {
      requestedCount: 0,
      affectedCount: 0,
      documentCount: 0,
      designCount: 0,
    };

  const result = await queryDb<
    CountRow & {
      document_count: string | number;
      design_count: string | number;
    }
  >(
    `WITH target_trash AS (
       SELECT t.id, t.attachment_id, t.original_name, t.mime_type
         FROM attachment_trash_items t
        WHERE t.id = ANY($1::text[])
          AND t.purge_status IN (${ADMIN_FILE_TRASH_OPEN_PURGE_STATUS_SQL_LIST})
          AND t.restored_at IS NULL
          AND t.purged_at IS NULL
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
              purge_status = ${ADMIN_FILE_TRASH_PURGE_STATUS_SQL.purged},
              last_purge_attempt_at = now(),
              last_purge_error = NULL,
              updated_at = now()
        WHERE id IN (SELECT id FROM target_trash)
        RETURNING id
     )
     SELECT COUNT(*)::text AS affected_count,
            COUNT(*) FILTER (WHERE ${createFileKindCountSql("target_trash")} = 'document')::text AS document_count,
            COUNT(*) FILTER (WHERE ${createFileKindCountSql("target_trash")} = 'design')::text AS design_count
       FROM target_trash`,
    [trashItemIds],
  );

  const row = result.rows[0];
  return {
    requestedCount: trashItemIds.length,
    affectedCount: readCount(row),
    documentCount: toNumber(row?.document_count),
    designCount: toNumber(row?.design_count),
  };
}

export async function markAttachmentTrashItemsPurgedByAttachmentIds(input: {
  attachmentIds: string[];
  actorId?: string | null;
}): Promise<AdminTrashDbActionResult> {
  const attachmentIds = normalizeIds(input.attachmentIds);
  if (attachmentIds.length === 0)
    return {
      requestedCount: 0,
      affectedCount: 0,
      documentCount: 0,
      designCount: 0,
    };

  const result = await queryDb<
    CountRow & {
      document_count: string | number;
      design_count: string | number;
    }
  >(
    `WITH target_trash AS (
       SELECT t.id, t.attachment_id, t.original_name, t.mime_type
         FROM attachment_trash_items t
        WHERE t.attachment_id = ANY($1::text[])
          AND t.purge_status IN (${ADMIN_FILE_TRASH_OPEN_PURGE_STATUS_SQL_LIST})
          AND t.restored_at IS NULL
          AND t.purged_at IS NULL
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
              purge_status = ${ADMIN_FILE_TRASH_PURGE_STATUS_SQL.purged},
              last_purge_attempt_at = now(),
              last_purge_error = NULL,
              updated_at = now()
        WHERE id IN (SELECT id FROM target_trash)
        RETURNING id
     )
     SELECT COUNT(*)::text AS affected_count,
            COUNT(*) FILTER (WHERE ${createFileKindCountSql("target_trash")} = 'document')::text AS document_count,
            COUNT(*) FILTER (WHERE ${createFileKindCountSql("target_trash")} = 'design')::text AS design_count
       FROM target_trash`,
    [attachmentIds],
  );

  const row = result.rows[0];
  return {
    requestedCount: attachmentIds.length,
    affectedCount: readCount(row),
    documentCount: toNumber(row?.document_count),
    designCount: toNumber(row?.design_count),
  };
}

export async function markAttachmentTrashItemPurgeFailed(input: {
  trashItemId: string;
  errorMessage: string;
}): Promise<void> {
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

export type AdminWorkOrderTrashActionType = "restore" | "purge";

export type AdminWorkOrderTrashActionInput = {
  workOrderId: string;
  actorId?: string | null;
};

export type AdminWorkOrderTrashActionResult = {
  ok: boolean;
  action: AdminWorkOrderTrashActionType;
  workOrderId: string | null;
  requestedCount: number;
  affectedCount: number;
  attachmentCount?: number;
  documentCount?: number;
  designCount?: number;
  memoCount?: number;
  reason:
    | "WORKORDER_ACTION_NOT_CONNECTED"
    | "WORKORDER_ID_REQUIRED"
    | "WORKORDER_NOT_FOUND"
    | "OK";
  message: string;
};

function normalizeWorkOrderTrashActionInput(
  input: AdminWorkOrderTrashActionInput,
): string | null {
  const workOrderId = input.workOrderId.trim();
  return workOrderId.length > 0 ? workOrderId : null;
}

function createWorkOrderTrashActionSkeletonResult(input: {
  action: AdminWorkOrderTrashActionType;
  workOrderId: string | null;
}): AdminWorkOrderTrashActionResult {
  if (!input.workOrderId) {
    return {
      ok: false,
      action: input.action,
      workOrderId: null,
      requestedCount: 0,
      affectedCount: 0,
      reason: "WORKORDER_ID_REQUIRED",
      message: createAdminWorkOrderTrashIdRequiredMessage(),
    };
  }

  return {
    ok: false,
    action: input.action,
    workOrderId: input.workOrderId,
    requestedCount: 1,
    affectedCount: 0,
    reason: "WORKORDER_ACTION_NOT_CONNECTED",
    message: createAdminWorkOrderTrashNotConnectedMessage(input.action),
  };
}

export async function restoreWorkOrderTrashBundle(
  input: AdminWorkOrderTrashActionInput,
): Promise<AdminWorkOrderTrashActionResult> {
  const workOrderId = normalizeWorkOrderTrashActionInput(input);
  if (!workOrderId) {
    return createWorkOrderTrashActionSkeletonResult({
      action: "restore",
      workOrderId,
    });
  }

  const result = await queryDb<
    CountRow & {
      attachment_count: string | number;
      document_count: string | number;
      design_count: string | number;
      trash_count: string | number;
      memo_count: string | number;
    }
  >(
    `WITH target_workorder AS (
       SELECT id, deleted_at
         FROM spec_sheets
        WHERE id = $1
          AND (deleted_at IS NOT NULL OR COALESCE(is_active, true) = false)
     ), restored_workorder AS (
       UPDATE spec_sheets
          SET is_active = true,
              delete_status = ${ADMIN_WORKORDER_DELETE_STATUS_SQL.active},
              purge_status = ${ADMIN_WORKORDER_PURGE_STATUS_SQL.none},
              purge_requested_at = NULL,
              delete_source = NULL,
              delete_scope = NULL,
              delete_parent_type = NULL,
              delete_parent_id = NULL,
              delete_batch_id = NULL,
              purged_at = NULL,
              purged_by = NULL,
              deleted_at = NULL,
              updated_at = now()
        WHERE id IN (SELECT id FROM target_workorder)
        RETURNING id
     ), bundle_trash AS (
       SELECT t.id, t.attachment_id, t.original_name, t.mime_type
         FROM attachment_trash_items t
        WHERE t.order_id = $1
          AND ${createWorkOrderBundleMetadataPredicate("t", 1)}
          AND t.purge_status IN (${ADMIN_FILE_TRASH_OPEN_PURGE_STATUS_SQL_LIST})
          AND t.restored_at IS NULL
          AND t.purged_at IS NULL
     ), restored_attachments AS (
       UPDATE attachments
          SET is_active = true,
              deleted_at = NULL,
              deleted_by = NULL,
              delete_source = NULL,
              delete_scope = NULL,
              delete_parent_type = NULL,
              delete_parent_id = NULL,
              delete_batch_id = NULL,
              purge_after_at = NULL,
              updated_at = now()
        WHERE id IN (SELECT attachment_id FROM bundle_trash)
        RETURNING id
     ), restored_trash AS (
       UPDATE attachment_trash_items
          SET restored_at = now(),
              restored_by = $2,
              purge_status = ${ADMIN_FILE_TRASH_PURGE_STATUS_SQL.restored},
              updated_at = now()
        WHERE id IN (SELECT id FROM bundle_trash)
        RETURNING id
     ), restored_memos AS (
       UPDATE memos
          SET is_active = true,
              delete_status = ${ADMIN_WORKORDER_DELETE_STATUS_SQL.active},
              purge_status = ${ADMIN_WORKORDER_PURGE_STATUS_SQL.none},
              purge_requested_at = NULL,
              delete_source = NULL,
              delete_scope = NULL,
              delete_parent_type = NULL,
              delete_parent_id = NULL,
              delete_batch_id = NULL,
              purged_at = NULL,
              purged_by = NULL,
              deleted_at = NULL,
              updated_at = now()
        WHERE order_id = $1
          AND deleted_at IS NOT NULL
          AND ${createWorkOrderBundleMemoMetadataPredicate("memos", 1)}
        RETURNING id
     )
     SELECT COUNT(*)::text AS affected_count,
            (SELECT COUNT(*) FROM restored_attachments)::text AS attachment_count,
            (SELECT COUNT(*) FILTER (WHERE ${createFileKindCountSql("bundle_trash")} = 'document') FROM bundle_trash)::text AS document_count,
            (SELECT COUNT(*) FILTER (WHERE ${createFileKindCountSql("bundle_trash")} = 'design') FROM bundle_trash)::text AS design_count,
            (SELECT COUNT(*) FROM restored_trash)::text AS trash_count,
            (SELECT COUNT(*) FROM restored_memos)::text AS memo_count
       FROM restored_workorder`,
    [workOrderId, input.actorId ?? null],
  );

  const row = result.rows[0];
  const workOrderCount = readCount(row);
  if (workOrderCount === 0) {
    return {
      ok: false,
      action: "restore",
      workOrderId,
      requestedCount: 1,
      affectedCount: 0,
      reason: "WORKORDER_NOT_FOUND",
      message: createAdminWorkOrderTrashNotFoundMessage("restore"),
    };
  }

  const attachmentCount = Number(row?.attachment_count ?? 0);
  const documentCount = Number(row?.document_count ?? 0);
  const designCount = Number(row?.design_count ?? 0);
  const memoCount = Number(row?.memo_count ?? 0);
  return {
    ok: true,
    action: "restore",
    workOrderId,
    requestedCount: 1,
    affectedCount: workOrderCount,
    attachmentCount,
    documentCount,
    designCount,
    memoCount,
    reason: "OK",
    message: createAdminWorkOrderTrashActionMessage({
      action: "restore",
      documentCount,
      designCount,
      memoCount,
    }),
  };
}

export async function previewRestoreWorkOrderTrashBundle(
  input: AdminWorkOrderTrashActionInput,
): Promise<AdminWorkOrderTrashActionResult> {
  return restoreWorkOrderTrashBundle(input);
}

export async function purgeWorkOrderTrashBundle(
  input: AdminWorkOrderTrashActionInput,
): Promise<AdminWorkOrderTrashActionResult> {
  const workOrderId = normalizeWorkOrderTrashActionInput(input);
  if (!workOrderId) {
    return createWorkOrderTrashActionSkeletonResult({
      action: "purge",
      workOrderId,
    });
  }

  const result = await queryDb<
    CountRow & {
      document_count: string | number;
      design_count: string | number;
      trash_count: string | number;
      memo_count: string | number;
    }
  >(
    `WITH target_workorder AS (
       SELECT id
         FROM spec_sheets
        WHERE id = $1
          AND (deleted_at IS NOT NULL OR COALESCE(is_active, true) = false)
          AND COALESCE(delete_status, ${ADMIN_WORKORDER_DELETE_STATUS_SQL.active}) <> ${ADMIN_WORKORDER_DELETE_STATUS_SQL.purged}
          AND purged_at IS NULL
     ), marked_workorder AS (
       UPDATE spec_sheets
          SET is_active = false,
              delete_status = ${ADMIN_WORKORDER_DELETE_STATUS_SQL.purgeRequested},
              purge_status = ${ADMIN_WORKORDER_PURGE_STATUS_SQL.purgeRequested},
              purge_requested_at = COALESCE(purge_requested_at, now()),
              purge_requested_by = $2,
              delete_source = 'manual',
              delete_scope = 'bundle',
              delete_parent_type = 'workorder',
              delete_parent_id = id,
              delete_batch_id = COALESCE(delete_batch_id, id),
              purged_at = NULL,
              purged_by = NULL,
              updated_at = now()
        WHERE id IN (SELECT id FROM target_workorder)
        RETURNING id
     ), bundle_trash AS (
       SELECT t.id, t.attachment_id, t.original_name, t.mime_type
         FROM attachment_trash_items t
        WHERE t.order_id = $1
          AND ${createWorkOrderBundleMetadataPredicate("t", 1)}
          AND t.restored_at IS NULL
          AND t.purged_at IS NULL
          AND t.purge_status IN (${ADMIN_FILE_TRASH_OPEN_PURGE_STATUS_SQL_LIST})
     ), marked_attachments AS (
       UPDATE attachments
          SET is_active = false,
              purge_after_at = now(),
              delete_source = COALESCE(delete_source, 'workorder_bundle'),
              delete_scope = COALESCE(delete_scope, 'bundle'),
              delete_parent_type = COALESCE(delete_parent_type, 'workorder'),
              delete_parent_id = COALESCE(delete_parent_id, $1),
              delete_batch_id = COALESCE(delete_batch_id, $1),
              updated_at = now()
        WHERE id IN (SELECT attachment_id FROM bundle_trash)
        RETURNING id
     ), marked_trash AS (
       UPDATE attachment_trash_items
          SET purge_status = ${ADMIN_FILE_TRASH_PURGE_STATUS_SQL.purgeRequested},
              purge_requested_by = $2,
              purge_after_at = now(),
              delete_source = COALESCE(delete_source, 'workorder_bundle'),
              delete_scope = COALESCE(delete_scope, 'bundle'),
              delete_parent_type = COALESCE(delete_parent_type, 'workorder'),
              delete_parent_id = COALESCE(delete_parent_id, $1),
              delete_batch_id = COALESCE(delete_batch_id, $1),
              updated_at = now()
        WHERE id IN (SELECT id FROM bundle_trash)
        RETURNING id
     ), marked_memos AS (
       UPDATE memos
          SET is_active = false,
              delete_status = ${ADMIN_WORKORDER_DELETE_STATUS_SQL.purgeRequested},
              purge_status = ${ADMIN_WORKORDER_PURGE_STATUS_SQL.purgeRequested},
              purge_requested_at = COALESCE(purge_requested_at, now()),
              purge_requested_by = $2,
              delete_source = 'workorder_bundle',
              delete_scope = 'bundle',
              delete_parent_type = 'workorder',
              delete_parent_id = $1,
              delete_batch_id = COALESCE(delete_batch_id, $1),
              purged_at = NULL,
              purged_by = NULL,
              updated_at = now()
        WHERE order_id = $1
          AND deleted_at IS NOT NULL
          AND COALESCE(delete_status, ${ADMIN_WORKORDER_DELETE_STATUS_SQL.active}) <> ${ADMIN_WORKORDER_DELETE_STATUS_SQL.purged}
          AND ${createWorkOrderBundleMemoMetadataPredicate("memos", 1)}
        RETURNING id
     )
     SELECT COUNT(*)::text AS affected_count,
            (SELECT COUNT(*) FILTER (WHERE ${createFileKindCountSql("bundle_trash")} = 'document') FROM bundle_trash)::text AS document_count,
            (SELECT COUNT(*) FILTER (WHERE ${createFileKindCountSql("bundle_trash")} = 'design') FROM bundle_trash)::text AS design_count,
            (SELECT COUNT(*) FROM marked_trash)::text AS trash_count,
            (SELECT COUNT(*) FROM marked_memos)::text AS memo_count
       FROM marked_workorder`,
    [workOrderId, input.actorId ?? null],
  );

  const row = result.rows[0];
  const workOrderCount = readCount(row);
  if (workOrderCount === 0) {
    return {
      ok: false,
      action: "purge",
      workOrderId,
      requestedCount: 1,
      affectedCount: 0,
      reason: "WORKORDER_NOT_FOUND",
      message: createAdminWorkOrderTrashNotFoundMessage("purge"),
    };
  }

  const trashCount = Number(row?.trash_count ?? 0);
  const documentCount = Number(row?.document_count ?? 0);
  const designCount = Number(row?.design_count ?? 0);
  const memoCount = Number(row?.memo_count ?? 0);
  return {
    ok: true,
    action: "purge",
    workOrderId,
    requestedCount: 1,
    affectedCount: workOrderCount,
    attachmentCount: trashCount,
    documentCount,
    designCount,
    memoCount,
    reason: "OK",
    message: createAdminWorkOrderTrashActionMessage({
      action: "purge",
      documentCount,
      designCount,
      memoCount,
    }),
  };
}

export async function previewPurgeWorkOrderTrashBundle(
  input: AdminWorkOrderTrashActionInput,
): Promise<AdminWorkOrderTrashActionResult> {
  return purgeWorkOrderTrashBundle(input);
}
