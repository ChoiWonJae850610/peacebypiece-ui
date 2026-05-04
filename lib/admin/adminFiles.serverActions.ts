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

const WORKORDER_BUNDLE_DELETE_REASON = "작업지시서 삭제로 함께 휴지통 이동";

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
       SELECT t.id, t.attachment_id
         FROM attachment_trash_items t
         LEFT JOIN spec_sheets s ON s.id = t.order_id
        WHERE t.id = ANY($1::text[])
          AND t.purge_status = 'pending'
          AND t.restored_at IS NULL
          AND t.purged_at IS NULL
          AND (t.order_id IS NULL OR (s.deleted_at IS NULL AND COALESCE(s.is_active, true) = true))
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
       SELECT t.id, t.attachment_id
         FROM attachment_trash_items t
         LEFT JOIN spec_sheets s ON s.id = t.order_id
        WHERE t.id = ANY($1::text[])
          AND t.purge_status = 'pending'
          AND t.restored_at IS NULL
          AND t.purged_at IS NULL
          AND (
            t.order_id IS NULL
            OR (s.deleted_at IS NULL AND COALESCE(s.is_active, true) = true)
            OR COALESCE(t.delete_reason, '') <> $2
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
          SET purge_status = 'purge_requested',
              purge_after_at = COALESCE(purge_after_at, now()),
              updated_at = now()
        WHERE id IN (SELECT id FROM target_trash)
        RETURNING id
     )
     SELECT COUNT(*)::text AS affected_count
       FROM marked_trash`,
    [trashItemIds, WORKORDER_BUNDLE_DELETE_REASON],
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
  parent_workorder_deleted: boolean | null;
  parent_workorder_deleted_at: string | Date | null;
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

type AdminStorageWorkOrderRow = DbQueryResultRow & {
  id: string;
  title: string | null;
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
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString().slice(0, 10);
}

function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const yy = String(date.getFullYear()).slice(2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${yy}.${month}.${day} ${hours}:${minutes}`;
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0B";
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

function getFileType(mimeType: string | null | undefined, fileName = ""): string {
  const lowerName = fileName.toLowerCase();
  const extension = lowerName.includes(".") ? lowerName.split(".").pop() ?? "" : "";
  if (mimeType?.includes("pdf") || extension === "pdf" || ["doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "hwp"].includes(extension)) return "문서";
  if (mimeType?.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "heic", "heif", "ai", "psd"].includes(extension)) return "디자인";
  return "문서";
}

function getWorkOrderStatusLabel(status: string | null | undefined): string {
  if (status === "draft") return "작성중";
  if (status === "review_requested") return "검토요청";
  if (status === "review_completed" || status === "review_approved") return "검토완료";
  if (status === "request_order" || status === "order_requested") return "발주요청";
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

function getTrashRestorePolicy(input: { parentWorkOrderDeleted: boolean; deleteReason: string | null | undefined }): "file_unit" | "parent_deleted_restore_blocked" | "bundle_required" {
  if (!input.parentWorkOrderDeleted) return "file_unit";
  return input.deleteReason === WORKORDER_BUNDLE_DELETE_REASON ? "bundle_required" : "parent_deleted_restore_blocked";
}

function getTrashRestorePolicyLabel(policy: "file_unit" | "parent_deleted_restore_blocked" | "bundle_required"): string {
  if (policy === "bundle_required") return "묶음 처리 필요";
  if (policy === "parent_deleted_restore_blocked") return "작업지시서 삭제로 복원 불가";
  return "파일 단위 처리 가능";
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
  const [attachmentsResult, trashResult, workOrdersResult] = await Promise.all([
    queryDb<AdminAttachmentRow>(
      `SELECT a.id,
              a.order_id,
              COALESCE(s.title, '작업지시서명 없음') AS workorder_title,
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
              COALESCE(s.title, '작업지시서명 없음') AS workorder_title,
              (s.id IS NOT NULL AND (s.deleted_at IS NOT NULL OR COALESCE(s.is_active, true) = false)) AS parent_workorder_deleted,
              s.deleted_at AS parent_workorder_deleted_at,
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
        WHERE t.purge_status = 'pending'
          AND t.restored_at IS NULL
          AND t.purged_at IS NULL
        ORDER BY t.deleted_at DESC
        LIMIT 100`,
      [safeTrashRetentionDays],
    ),
    queryDb<AdminStorageWorkOrderRow>(
      `SELECT s.id,
              COALESCE(s.title, '작업지시서명 없음') AS title,
              s.status,
              s.updated_at,
              s.deleted_at,
              COUNT(DISTINCT a.id) FILTER (WHERE a.deleted_at IS NULL AND COALESCE(a.is_active, true) = true)::text AS attachment_count,
              COUNT(DISTINCT a.id) FILTER (WHERE a.deleted_at IS NOT NULL OR COALESCE(a.is_active, true) = false)::text AS trash_attachment_count,
              COUNT(DISTINCT m.id) FILTER (WHERE m.deleted_at IS NULL AND COALESCE(m.is_active, true) = true)::text AS memo_count,
              COUNT(DISTINCT m.id) FILTER (WHERE m.deleted_at IS NOT NULL OR COALESCE(m.is_active, true) = false)::text AS trash_memo_count
         FROM spec_sheets s
         LEFT JOIN attachments a ON a.order_id = s.id
         LEFT JOIN memos m ON m.order_id = s.id
        WHERE s.deleted_at IS NOT NULL
           OR COALESCE(s.is_active, true) = false
        GROUP BY s.id, s.title, s.status, s.updated_at, s.deleted_at
        ORDER BY COALESCE(s.deleted_at, s.updated_at) DESC
        LIMIT 50`,
    ),
  ]);

  const attachments = attachmentsResult.rows.map((row) => {
    const fileName = row.original_name || "파일명 없음";
    const sizeBytes = toNumber(row.size_bytes);
    return {
      id: row.id,
      workorderId: row.order_id || "",
      workorderTitle: row.workorder_title || "작업지시서명 없음",
      fileName,
      fileType: getFileType(row.mime_type, fileName),
      fileIcon: getFileIcon(row.mime_type, fileName),
      fileSizeBytes: sizeBytes,
      fileSizeLabel: formatBytes(sizeBytes),
      uploadedAt: formatDate(row.created_at),
      uploadedBy: row.author_id || "미지정",
      status: "active" as const,
      statusLabel: "사용중",
      deletedAt: row.deleted_at ? formatDateTime(row.deleted_at) : null,
      deletedBy: row.deleted_by,
      deleteReason: row.delete_reason,
      purgeAfterAt: row.purge_after_at ? formatDate(row.purge_after_at) : null,
    };
  });

  const trashItems = trashResult.rows.map((row) => {
    const fileName = row.original_name || "파일명 없음";
    const sizeBytes = toNumber(row.size_bytes);
    const restoreDaysLeft = getRestoreDaysLeft(row.purge_after_at);
    const parentWorkOrderDeleted = Boolean(row.parent_workorder_deleted);
    const restorePolicy = getTrashRestorePolicy({ parentWorkOrderDeleted, deleteReason: row.delete_reason });
    const restorePolicyLabel = getTrashRestorePolicyLabel(restorePolicy);
    const isPending = (row.purge_status ?? "pending") === "pending";
    return {
      id: row.id,
      attachmentId: row.attachment_id,
      workorderId: row.order_id || "",
      workorderTitle: row.workorder_title || "작업지시서명 없음",
      fileName,
      fileIcon: getFileIcon(row.mime_type, fileName),
      fileSizeBytes: sizeBytes,
      fileSizeLabel: formatBytes(sizeBytes),
      deletedAt: formatDateTime(row.deleted_at),
      deletedBy: row.deleted_by || "미지정",
      purgeAfterAt: formatDate(row.purge_after_at),
      restoreDaysLeft,
      restoreLabel: `D-${restoreDaysLeft}`,
      deleteReason: row.delete_reason || "삭제 사유 없음",
      purgeStatus: (row.last_purge_error ? "failed" : row.purge_status || "pending") as "pending" | "purge_requested" | "purged" | "failed" | "restored",
      purgeStatusLabel: getPurgeStatusLabel(row.purge_status, row.last_purge_error),
      isPurgeReady: isPurgeReady(row.purge_after_at),
      lastPurgeError: row.last_purge_error,
      parentWorkOrderDeleted,
      restorePolicy,
      restorePolicyLabel,
      canRestore: restorePolicy === "file_unit" && !row.last_purge_error && isPending,
      restoreDisabledReason: restorePolicy === "bundle_required" ? "작업지시서 삭제와 함께 휴지통으로 이동한 파일은 작업지시서 묶음 복원에서 처리해야 합니다." : restorePolicy === "parent_deleted_restore_blocked" ? "부모 작업지시서가 삭제 상태라 파일만 복원할 수 없습니다." : row.last_purge_error ? "삭제 실패 상태는 시스템관리자 확인 후 처리해야 합니다." : !isPending ? "복구 가능 상태가 아닙니다." : null,
      canPurge: restorePolicy !== "bundle_required" && !row.last_purge_error && isPending,
      purgeDisabledReason: restorePolicy === "bundle_required" ? "작업지시서 삭제와 함께 휴지통으로 이동한 파일은 작업지시서 묶음 삭제/purge에서 함께 처리해야 합니다." : row.last_purge_error ? "삭제 실패 상태는 시스템관리자 확인 후 처리해야 합니다." : !isPending ? "영구삭제 요청 가능 상태가 아닙니다." : null,
    };
  });

  const workOrders = workOrdersResult.rows.map((row) => {
    const attachmentCount = toNumber(row.attachment_count);
    const trashAttachmentCount = toNumber(row.trash_attachment_count);
    const memoCount = toNumber(row.memo_count);
    const trashMemoCount = toNumber(row.trash_memo_count);

    return {
      id: row.id,
      title: row.title || "작업지시서명 없음",
      status: row.status || "unknown",
      statusLabel: getWorkOrderStatusLabel(row.status),
      updatedAt: formatDate(row.updated_at),
      deletedAt: row.deleted_at ? formatDateTime(row.deleted_at) : null,
      attachmentCount,
      trashAttachmentCount,
      memoCount,
      trashMemoCount,
      restorePolicyLabel: "묶음 복원 준비중",
      attachmentSummaryLabel: `연결 첨부 ${attachmentCount + trashAttachmentCount}개 · 묶음 처리 ${trashAttachmentCount}개`,
      memoSummaryLabel: `연결 메모 ${memoCount + trashMemoCount}개 · 묶음 처리 ${trashMemoCount}개`,
    };
  });

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

export async function listPurgeReadyAttachmentTrashItems(limit = 50, trashRetentionDays = 30): Promise<AdminPurgeCandidate[]> {
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 200);
  const safeTrashRetentionDays = [1, 5, 15, 30].includes(trashRetentionDays) ? trashRetentionDays : 30;
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
          OR (s.deleted_at IS NULL AND COALESCE(s.is_active, true) = true)
          OR COALESCE(t.delete_reason, '') <> $3
        )
        AND (
          t.purge_status = 'purge_requested'
          OR (t.purge_status = 'pending' AND (COALESCE(t.deleted_at, now()) + ($2::integer * interval '1 day')) <= now())
        )
      ORDER BY purge_after_at ASC
      LIMIT $1`,
    [safeLimit, safeTrashRetentionDays, WORKORDER_BUNDLE_DELETE_REASON],
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
  reason: "WORKORDER_ACTION_NOT_CONNECTED" | "WORKORDER_ID_REQUIRED" | "WORKORDER_NOT_FOUND" | "OK";
  message: string;
};

function normalizeWorkOrderTrashActionInput(input: AdminWorkOrderTrashActionInput): string | null {
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
      message: "작업지시서 ID가 없어 작업지시서 단위 처리를 실행할 수 없습니다.",
    };
  }

  return {
    ok: false,
    action: input.action,
    workOrderId: input.workOrderId,
    requestedCount: 1,
    affectedCount: 0,
    reason: "WORKORDER_ACTION_NOT_CONNECTED",
    message:
      input.action === "restore"
        ? "작업지시서 복구 API는 아직 실제 DB 복원 로직에 연결되지 않았습니다. 작업지시서와 연결 첨부/메모를 같은 트랜잭션에서 복원해야 합니다."
        : "작업지시서 영구삭제 API는 아직 실제 DB/R2 처리 로직에 연결되지 않았습니다. R2 삭제는 Worker 기반 purge 흐름만 사용해야 합니다.",
  };
}

export async function restoreWorkOrderTrashBundle(input: AdminWorkOrderTrashActionInput): Promise<AdminWorkOrderTrashActionResult> {
  const workOrderId = normalizeWorkOrderTrashActionInput(input);
  if (!workOrderId) {
    return createWorkOrderTrashActionSkeletonResult({ action: "restore", workOrderId });
  }

  const result = await queryDb<CountRow & { attachment_count: string | number; trash_count: string | number; memo_count: string | number }>(
    `WITH target_workorder AS (
       SELECT id, deleted_at
         FROM spec_sheets
        WHERE id = $1
          AND (deleted_at IS NOT NULL OR COALESCE(is_active, true) = false)
     ), restored_workorder AS (
       UPDATE spec_sheets
          SET is_active = true,
              deleted_at = NULL,
              updated_at = now()
        WHERE id IN (SELECT id FROM target_workorder)
        RETURNING id
     ), bundle_trash AS (
       SELECT t.id, t.attachment_id
         FROM attachment_trash_items t
        WHERE t.order_id = $1
          AND t.delete_reason = $2
          AND t.purge_status = 'pending'
          AND t.restored_at IS NULL
          AND t.purged_at IS NULL
     ), restored_attachments AS (
       UPDATE attachments
          SET is_active = true,
              deleted_at = NULL,
              deleted_by = NULL,
              delete_reason = NULL,
              purge_after_at = NULL,
              updated_at = now()
        WHERE id IN (SELECT attachment_id FROM bundle_trash)
        RETURNING id
     ), restored_trash AS (
       UPDATE attachment_trash_items
          SET restored_at = now(),
              restored_by = $3,
              purge_status = 'restored',
              updated_at = now()
        WHERE id IN (SELECT id FROM bundle_trash)
        RETURNING id
     ), restored_memos AS (
       UPDATE memos
          SET is_active = true,
              deleted_at = NULL,
              updated_at = now()
        WHERE order_id = $1
          AND deleted_at IS NOT NULL
          AND deleted_at >= COALESCE((SELECT deleted_at FROM target_workorder), now()) - interval '10 seconds'
        RETURNING id
     )
     SELECT COUNT(*)::text AS affected_count,
            (SELECT COUNT(*) FROM restored_attachments)::text AS attachment_count,
            (SELECT COUNT(*) FROM restored_trash)::text AS trash_count,
            (SELECT COUNT(*) FROM restored_memos)::text AS memo_count
       FROM restored_workorder`,
    [workOrderId, WORKORDER_BUNDLE_DELETE_REASON, input.actorId ?? null],
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
      message: "복구할 삭제 상태 작업지시서를 찾지 못했습니다.",
    };
  }

  const attachmentCount = Number(row?.attachment_count ?? 0);
  const memoCount = Number(row?.memo_count ?? 0);
  return {
    ok: true,
    action: "restore",
    workOrderId,
    requestedCount: 1,
    affectedCount: workOrderCount,
    reason: "OK",
    message: `작업지시서 1건을 복구했습니다. 작업지시서 삭제와 함께 휴지통으로 이동한 첨부 ${attachmentCount}건, 메모 ${memoCount}건을 함께 복구했습니다.`,
  };
}

export async function previewRestoreWorkOrderTrashBundle(input: AdminWorkOrderTrashActionInput): Promise<AdminWorkOrderTrashActionResult> {
  return restoreWorkOrderTrashBundle(input);
}

export async function previewPurgeWorkOrderTrashBundle(input: AdminWorkOrderTrashActionInput): Promise<AdminWorkOrderTrashActionResult> {
  return createWorkOrderTrashActionSkeletonResult({
    action: "purge",
    workOrderId: normalizeWorkOrderTrashActionInput(input),
  });
}
