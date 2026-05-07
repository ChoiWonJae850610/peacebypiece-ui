import "server-only";

import { COMPANY_FILE_TRASH_RETENTION_DAYS } from "@/lib/admin/settings/companyDefaults";
import { markAttachmentTrashItemPurgeFailed, markAttachmentTrashItemsPurged } from "@/lib/admin/files/serverActions";
import { deleteR2ObjectViaWorker } from "@/lib/storage/r2/r2WorkerUpload";
import { deleteCachedR2UrlsByKey } from "@/lib/storage/r2/r2UrlCache";
import { queryDb } from "@/lib/db/client";
import type { DbQueryResultRow } from "@/lib/db/client";

const WORKORDER_BUNDLE_DELETE_REASON = "작업지시서 삭제로 함께 휴지통 이동";
const WORKORDER_CANDIDATE_PREFIX = "workorder:";

export type SystemStoragePurgeCandidateKind = "file" | "workorder";

export type SystemStoragePurgeCandidate = {
  trashItemId: string;
  candidateKind: SystemStoragePurgeCandidateKind;
  attachmentId: string | null;
  companyId: string | null;
  companyName: string;
  workorderId: string | null;
  workorderTitle: string;
  fileName: string;
  fileTypeLabel: string;
  previewUrl: string | null;
  previewMode: "thumbnail" | "original-fallback" | "file-type";
  previewModeLabel: string;
  storageKey: string | null;
  thumbnailKey: string | null;
  originalSizeBytes: number;
  originalSizeLabel: string;
  thumbnailCountLabel: string;
  deletedAt: string;
  purgeDueAt: string;
  overdueDays: number;
  purgeStatus: string;
  purgeStatusLabel: string;
  lastPurgeError: string | null;
  attachmentCount: number;
  memoCount: number;
};

export type SystemStoragePurgeCandidateSummary = {
  candidateCount: number;
  fileCandidateCount: number;
  workorderCandidateCount: number;
  requestedCount: number;
  pendingCount: number;
  failedCount: number;
  retryRequiredCount: number;
  companyCount: number;
  totalOriginalBytes: number;
  totalOriginalSizeLabel: string;
  thumbnailObjectCount: number;
  retentionDays: number;
};

export type SystemStoragePurgeCandidateSnapshot = {
  summary: SystemStoragePurgeCandidateSummary;
  candidates: SystemStoragePurgeCandidate[];
};

type PurgeCandidateRow = DbQueryResultRow & {
  id: string;
  attachment_id: string;
  company_id: string | null;
  company_name: string | null;
  order_id: string | null;
  workorder_title: string | null;
  original_name: string | null;
  mime_type: string | null;
  storage_key: string | null;
  thumbnail_key: string | null;
  size_bytes: string | number | null;
  deleted_at: string | Date | null;
  purge_due_at: string | Date | null;
  purge_status: string | null;
  last_purge_error: string | null;
};

type WorkOrderPurgeCandidateRow = DbQueryResultRow & {
  id: string;
  company_id: string | null;
  company_name: string | null;
  title: string | null;
  status: string | null;
  deleted_at: string | Date | null;
  purge_due_at: string | Date | null;
  purge_status: string | null;
  attachment_count: string | number | null;
  memo_count: string | number | null;
  total_size_bytes: string | number | null;
  thumbnail_count: string | number | null;
};

type SystemStoragePurgeRunCandidate =
  | ({ candidateKind: "file" } & PurgeCandidateRow)
  | ({ candidateKind: "workorder" } & WorkOrderPurgeCandidateRow);

function toNumber(value: string | number | null | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value: string | Date | null | undefined): string {
  const date = toDate(value);
  if (!date) return "-";
  return date.toISOString().slice(0, 10);
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0B";
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)}GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)}MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${bytes}B`;
}

function buildFileProxyUrl(key: string | null | undefined): string | null {
  const cleanKey = typeof key === "string" ? key.trim() : "";
  if (!cleanKey) return null;
  const params = new URLSearchParams({ key: cleanKey });
  return `/api/workorders/attachments/file?${params.toString()}`;
}

function getFileTypeLabel(mimeType: string | null | undefined, fileName: string): string {
  const lowerName = fileName.toLowerCase();
  if (mimeType?.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif|bmp|svg|heic|heif)$/i.test(lowerName)) return "이미지";
  if (mimeType?.includes("pdf") || lowerName.endsWith(".pdf")) return "PDF";
  return "파일";
}

function getPurgeStatusLabel(status: string | null | undefined, error: string | null | undefined, kind: SystemStoragePurgeCandidateKind): string {
  if (error || status === "failed") return "삭제 실패";
  if (status === "purge_requested") return kind === "workorder" ? "작업지시서 삭제 요청" : "영구삭제 요청";
  if (status === "pending") return kind === "workorder" ? "작업지시서 삭제 대기" : "삭제 대기";
  if (status === "purged") return "삭제 완료";
  return status || "후보";
}

function getOverdueDays(purgeDueAt: string | Date | null | undefined): number {
  const date = toDate(purgeDueAt);
  if (!date) return 0;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
}

function parseWorkOrderCandidateIds(ids: string[]): string[] {
  return ids
    .filter((id) => id.startsWith(WORKORDER_CANDIDATE_PREFIX))
    .map((id) => id.slice(WORKORDER_CANDIDATE_PREFIX.length).trim())
    .filter(Boolean);
}

function parseFileTrashIds(ids: string[]): string[] {
  return ids.filter((id) => !id.startsWith(WORKORDER_CANDIDATE_PREFIX));
}

function mapFileCandidateRow(row: PurgeCandidateRow): SystemStoragePurgeCandidate {
  const fileName = row.original_name || "파일명 없음";
  const sizeBytes = toNumber(row.size_bytes);
  const hasThumbnail = typeof row.thumbnail_key === "string" && row.thumbnail_key.trim().length > 0;
  const fileTypeLabel = getFileTypeLabel(row.mime_type, fileName);
  const isImage = fileTypeLabel === "이미지";
  const previewUrl = hasThumbnail ? buildFileProxyUrl(row.thumbnail_key) : isImage ? buildFileProxyUrl(row.storage_key) : null;
  const previewMode = hasThumbnail ? "thumbnail" : isImage ? "original-fallback" : "file-type";
  const previewModeLabel = hasThumbnail ? "썸네일 표시" : isImage ? "썸네일 없음 · 원본 표시" : `${fileTypeLabel} 파일`;

  return {
    trashItemId: row.id,
    candidateKind: "file",
    attachmentId: row.attachment_id,
    companyId: row.company_id,
    companyName: row.company_name || row.company_id || "고객사명 없음",
    workorderId: row.order_id,
    workorderTitle: row.workorder_title || "작업지시서명 없음",
    fileName,
    fileTypeLabel,
    previewUrl,
    previewMode,
    previewModeLabel,
    storageKey: row.storage_key,
    thumbnailKey: row.thumbnail_key,
    originalSizeBytes: sizeBytes,
    originalSizeLabel: formatBytes(sizeBytes),
    thumbnailCountLabel: previewModeLabel,
    deletedAt: formatDate(row.deleted_at),
    purgeDueAt: formatDate(row.purge_due_at),
    overdueDays: getOverdueDays(row.purge_due_at),
    purgeStatus: row.purge_status || "pending",
    purgeStatusLabel: getPurgeStatusLabel(row.purge_status, row.last_purge_error, "file"),
    lastPurgeError: row.last_purge_error,
    attachmentCount: 1,
    memoCount: 0,
  };
}

function mapWorkOrderCandidateRow(row: WorkOrderPurgeCandidateRow): SystemStoragePurgeCandidate {
  const title = row.title || "작업지시서명 없음";
  const totalSizeBytes = toNumber(row.total_size_bytes);
  const attachmentCount = toNumber(row.attachment_count);
  const memoCount = toNumber(row.memo_count);
  const thumbnailCount = toNumber(row.thumbnail_count);
  const previewModeLabel = attachmentCount > 0 || memoCount > 0 ? `첨부 ${attachmentCount}개 · 메모 ${memoCount}개` : "연결 항목 없음";

  return {
    trashItemId: `${WORKORDER_CANDIDATE_PREFIX}${row.id}`,
    candidateKind: "workorder",
    attachmentId: null,
    companyId: row.company_id,
    companyName: row.company_name || row.company_id || "고객사명 없음",
    workorderId: row.id,
    workorderTitle: title,
    fileName: title,
    fileTypeLabel: "작업지시서",
    previewUrl: null,
    previewMode: "file-type",
    previewModeLabel,
    storageKey: null,
    thumbnailKey: null,
    originalSizeBytes: totalSizeBytes,
    originalSizeLabel: formatBytes(totalSizeBytes),
    thumbnailCountLabel: thumbnailCount > 0 ? `썸네일 ${thumbnailCount}개` : "썸네일 없음",
    deletedAt: formatDate(row.deleted_at),
    purgeDueAt: formatDate(row.purge_due_at),
    overdueDays: getOverdueDays(row.purge_due_at),
    purgeStatus: row.purge_status || "pending",
    purgeStatusLabel: getPurgeStatusLabel(row.purge_status, null, "workorder"),
    lastPurgeError: null,
    attachmentCount,
    memoCount,
  };
}

async function listFilePurgeCandidateRows(limit: number): Promise<PurgeCandidateRow[]> {
  const result = await queryDb<PurgeCandidateRow>(
    `SELECT t.id,
            t.attachment_id,
            t.company_id,
            t.company_name,
            t.order_id,
            COALESCE(s.title, '작업지시서명 없음') AS workorder_title,
            t.original_name,
            t.mime_type,
            t.storage_key,
            t.thumbnail_key,
            t.size_bytes,
            t.deleted_at,
            (COALESCE(t.deleted_at, now()) + ($2::integer * interval '1 day')) AS purge_due_at,
            t.purge_status,
            t.last_purge_error
       FROM attachment_trash_items t
       LEFT JOIN spec_sheets s ON s.id = t.order_id
      WHERE t.restored_at IS NULL
        AND t.purged_at IS NULL
        AND (
          s.id IS NULL
          OR COALESCE(s.delete_status, 'active') <> 'purged'
          OR t.purge_status = 'purge_requested'
        )
        AND (s.id IS NULL OR s.purged_at IS NULL OR t.purge_status = 'purge_requested')
        AND (
          t.order_id IS NULL
          OR (s.deleted_at IS NULL AND COALESCE(s.is_active, true) = true)
          OR COALESCE(t.delete_reason, '') <> $3
          OR (COALESCE(s.delete_status, 'active') = 'purged' AND t.purge_status = 'purge_requested')
        )
        AND (
          t.purge_status = 'purge_requested'
          OR (t.purge_status = 'pending' AND (COALESCE(t.deleted_at, now()) + ($2::integer * interval '1 day')) <= now())
          OR t.last_purge_error IS NOT NULL
        )
      ORDER BY purge_due_at ASC, t.deleted_at ASC
      LIMIT $1`,
    [limit, COMPANY_FILE_TRASH_RETENTION_DAYS, WORKORDER_BUNDLE_DELETE_REASON],
  );
  return result.rows;
}

async function listWorkOrderPurgeCandidateRows(input: { limit: number; includeFuturePending?: boolean; workOrderIds?: string[] }): Promise<WorkOrderPurgeCandidateRow[]> {
  const workOrderIds = input.workOrderIds ?? [];
  const params: unknown[] = [input.limit, COMPANY_FILE_TRASH_RETENTION_DAYS];
  let idFilter = "";
  if (workOrderIds.length > 0) {
    params.push(workOrderIds);
    idFilter = `AND s.id = ANY($${params.length}::text[])`;
  }

  const statusFilter = input.includeFuturePending
    ? `AND COALESCE(NULLIF(s.purge_status, 'none'), 'pending') IN ('pending', 'purge_requested', 'failed')`
    : `AND (
          COALESCE(NULLIF(s.purge_status, 'none'), 'pending') = 'purge_requested'
          OR (COALESCE(NULLIF(s.purge_status, 'none'), 'pending') = 'pending' AND (COALESCE(s.deleted_at, now()) + ($2::integer * interval '1 day')) <= now())
          OR COALESCE(NULLIF(s.purge_status, 'none'), 'pending') = 'failed'
        )`;

  const result = await queryDb<WorkOrderPurgeCandidateRow>(
    `SELECT s.id,
            s.company_id,
            s.company_name,
            s.title,
            s.status,
            s.deleted_at,
            (COALESCE(s.deleted_at, now()) + ($2::integer * interval '1 day')) AS purge_due_at,
            COALESCE(NULLIF(s.purge_status, 'none'), 'pending') AS purge_status,
            COUNT(DISTINCT a.id) FILTER (WHERE a.deleted_at IS NOT NULL OR COALESCE(a.is_active, true) = false)::text AS attachment_count,
            COUNT(DISTINCT m.id) FILTER (WHERE m.deleted_at IS NOT NULL OR COALESCE(m.is_active, true) = false)::text AS memo_count,
            COALESCE(SUM(COALESCE(a.size_bytes, 0)) FILTER (WHERE a.deleted_at IS NOT NULL OR COALESCE(a.is_active, true) = false), 0)::text AS total_size_bytes,
            COUNT(DISTINCT a.id) FILTER (WHERE a.thumbnail_key IS NOT NULL AND a.thumbnail_key <> '')::text AS thumbnail_count
       FROM spec_sheets s
       LEFT JOIN attachments a ON a.order_id = s.id
       LEFT JOIN memos m ON m.order_id = s.id
      WHERE (s.deleted_at IS NOT NULL OR COALESCE(s.is_active, true) = false)
        AND COALESCE(s.delete_status, 'active') <> 'purged'
        AND s.purged_at IS NULL
        ${idFilter}
        ${statusFilter}
      GROUP BY s.id, s.company_id, s.company_name, s.title, s.status, s.deleted_at, s.purge_status
      ORDER BY purge_due_at ASC, s.deleted_at ASC
      LIMIT $1`,
    params,
  );
  return result.rows;
}

export async function getSystemStoragePurgeCandidateSnapshot(limit = 200): Promise<SystemStoragePurgeCandidateSnapshot> {
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 500);
  const [fileRows, workOrderRows] = await Promise.all([
    listFilePurgeCandidateRows(safeLimit),
    // 시스템관리자 실제 삭제 후보는 고객관리자가 영구삭제 요청했거나
    // 보관 기간이 도래한 항목만 노출한다. 단순 휴지통 pending 항목은 고객관리자 복구 가능 상태이므로 숨긴다.
    listWorkOrderPurgeCandidateRows({ limit: safeLimit, includeFuturePending: false }),
  ]);

  const candidates = [...workOrderRows.map(mapWorkOrderCandidateRow), ...fileRows.map(mapFileCandidateRow)].slice(0, safeLimit);
  const companyIds = new Set(candidates.map((candidate) => candidate.companyId || candidate.companyName));
  const totalOriginalBytes = candidates.reduce((sum, candidate) => sum + candidate.originalSizeBytes, 0);
  const thumbnailObjectCount = candidates.filter((candidate) => candidate.thumbnailKey).length;
  const requestedCount = candidates.filter((candidate) => candidate.purgeStatus === "purge_requested").length;
  const failedCount = candidates.filter((candidate) => candidate.lastPurgeError || candidate.purgeStatus === "failed").length;
  const pendingCount = candidates.filter((candidate) => candidate.purgeStatus === "pending" && !candidate.lastPurgeError).length;

  return {
    summary: {
      candidateCount: candidates.length,
      fileCandidateCount: candidates.filter((candidate) => candidate.candidateKind === "file").length,
      workorderCandidateCount: candidates.filter((candidate) => candidate.candidateKind === "workorder").length,
      requestedCount,
      pendingCount,
      failedCount,
      retryRequiredCount: failedCount,
      companyCount: companyIds.size,
      totalOriginalBytes,
      totalOriginalSizeLabel: formatBytes(totalOriginalBytes),
      thumbnailObjectCount,
      retentionDays: COMPANY_FILE_TRASH_RETENTION_DAYS,
    },
    candidates,
  };
}

export type SystemStoragePurgeRunInput = {
  trashItemIds?: string[];
  mode?: "selected" | "all-due";
  limit?: number;
  actorId?: string | null;
};

export type SystemStoragePurgeRunItemResult = {
  trashItemId: string;
  attachmentId: string | null;
  storageKey: string | null;
  thumbnailKey: string | null;
  status: "purged" | "failed";
  errorMessage?: string;
};

export type SystemStoragePurgeRunResult = {
  requestedCount: number;
  candidateCount: number;
  purgedCount: number;
  failedCount: number;
  items: SystemStoragePurgeRunItemResult[];
};

function normalizeTrashItemIds(ids: string[] | undefined): string[] {
  return Array.from(new Set((ids ?? []).map((id) => id.trim()).filter(Boolean)));
}

function getPurgeErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error || "UNKNOWN_ERROR");
}

function getPurgeDeleteKeys(candidate: Pick<PurgeCandidateRow, "storage_key" | "thumbnail_key">): string[] {
  return Array.from(
    new Set([candidate.storage_key, candidate.thumbnail_key].filter((key): key is string => typeof key === "string" && key.trim().length > 0)),
  );
}

async function listFilePurgeRunCandidates(input: SystemStoragePurgeRunInput, fileTrashIds: string[]): Promise<PurgeCandidateRow[]> {
  const safeLimit = Math.min(Math.max(Math.trunc(input.limit ?? 100), 1), 200);

  if (input.mode === "selected") {
    if (fileTrashIds.length === 0) return [];
    const result = await queryDb<PurgeCandidateRow>(
      `SELECT t.id,
              t.attachment_id,
              t.company_id,
              t.company_name,
              t.order_id,
              COALESCE(s.title, '작업지시서명 없음') AS workorder_title,
              t.original_name,
              t.mime_type,
              t.storage_key,
              t.thumbnail_key,
              t.size_bytes,
              t.deleted_at,
              (COALESCE(t.deleted_at, now()) + ($2::integer * interval '1 day')) AS purge_due_at,
              t.purge_status,
              t.last_purge_error
         FROM attachment_trash_items t
         LEFT JOIN spec_sheets s ON s.id = t.order_id
        WHERE t.id = ANY($1::text[])
          AND t.restored_at IS NULL
          AND t.purged_at IS NULL
          AND (
            s.id IS NULL
            OR COALESCE(s.delete_status, 'active') <> 'purged'
            OR t.purge_status = 'purge_requested'
          )
          AND (s.id IS NULL OR s.purged_at IS NULL OR t.purge_status = 'purge_requested')
          AND (
            t.order_id IS NULL
            OR (s.deleted_at IS NULL AND COALESCE(s.is_active, true) = true)
            OR COALESCE(t.delete_reason, '') <> $4
            OR (COALESCE(s.delete_status, 'active') = 'purged' AND t.purge_status = 'purge_requested')
          )
          AND (
            t.purge_status = 'purge_requested'
            OR (t.purge_status = 'pending' AND (COALESCE(t.deleted_at, now()) + ($2::integer * interval '1 day')) <= now())
            OR t.last_purge_error IS NOT NULL
          )
        ORDER BY purge_due_at ASC, t.deleted_at ASC
        LIMIT $3`,
      [fileTrashIds, COMPANY_FILE_TRASH_RETENTION_DAYS, safeLimit, WORKORDER_BUNDLE_DELETE_REASON],
    );
    return result.rows;
  }

  return listFilePurgeCandidateRows(safeLimit);
}

async function listSystemStoragePurgeRunCandidates(input: SystemStoragePurgeRunInput): Promise<SystemStoragePurgeRunCandidate[]> {
  const allIds = normalizeTrashItemIds(input.trashItemIds);
  const fileTrashIds = parseFileTrashIds(allIds);
  const workOrderIds = parseWorkOrderCandidateIds(allIds);
  const safeLimit = Math.min(Math.max(Math.trunc(input.limit ?? 100), 1), 200);

  const [fileRows, workOrderRows] = await Promise.all([
    listFilePurgeRunCandidates(input, fileTrashIds),
    input.mode === "selected"
      ? listWorkOrderPurgeCandidateRows({ limit: safeLimit, includeFuturePending: true, workOrderIds })
      : listWorkOrderPurgeCandidateRows({ limit: safeLimit, includeFuturePending: false }),
  ]);

  return [
    ...workOrderRows.map((row) => ({ ...row, candidateKind: "workorder" as const })),
    ...fileRows.map((row) => ({ ...row, candidateKind: "file" as const })),
  ];
}

async function purgeSystemFileCandidate(
  candidate: PurgeCandidateRow,
  actorId: string | null | undefined,
): Promise<SystemStoragePurgeRunItemResult> {
  try {
    const keys = getPurgeDeleteKeys(candidate);
    for (const key of keys) {
      await deleteR2ObjectViaWorker({ key });
      deleteCachedR2UrlsByKey(key);
    }

    await markAttachmentTrashItemsPurged({ trashItemIds: [candidate.id], actorId: actorId ?? "system-storage-purge" });

    return {
      trashItemId: candidate.id,
      attachmentId: candidate.attachment_id,
      storageKey: candidate.storage_key,
      thumbnailKey: candidate.thumbnail_key,
      status: "purged",
    };
  } catch (error) {
    const errorMessage = getPurgeErrorMessage(error);
    await markAttachmentTrashItemPurgeFailed({ trashItemId: candidate.id, errorMessage });

    return {
      trashItemId: candidate.id,
      attachmentId: candidate.attachment_id,
      storageKey: candidate.storage_key,
      thumbnailKey: candidate.thumbnail_key,
      status: "failed",
      errorMessage,
    };
  }
}

async function purgeSystemWorkOrderCandidate(
  candidate: WorkOrderPurgeCandidateRow,
  actorId: string | null | undefined,
): Promise<SystemStoragePurgeRunItemResult> {
  try {
    const result = await queryDb<{ affected_count: string | number }>(
      `WITH target_workorder AS (
         SELECT id
           FROM spec_sheets
          WHERE id = $1
            AND (deleted_at IS NOT NULL OR COALESCE(is_active, true) = false)
            AND COALESCE(delete_status, 'active') <> 'purged'
            AND purged_at IS NULL
       ), marked_workorder AS (
         UPDATE spec_sheets
            SET is_active = false,
                delete_status = 'purged',
                purge_status = 'purged',
                purge_requested_at = COALESCE(purge_requested_at, now()),
                purged_at = now(),
                purged_by = $2,
                updated_at = now()
          WHERE id IN (SELECT id FROM target_workorder)
          RETURNING id
       ), bundle_trash AS (
         SELECT t.id, t.attachment_id
           FROM attachment_trash_items t
          WHERE t.order_id = $1
            AND t.delete_reason = $3
            AND t.restored_at IS NULL
            AND t.purged_at IS NULL
            AND t.purge_status IN ('pending', 'purge_requested')
       ), marked_attachments AS (
         UPDATE attachments
            SET is_active = false,
                purge_after_at = now(),
                updated_at = now()
          WHERE id IN (SELECT attachment_id FROM bundle_trash)
          RETURNING id
       ), marked_trash AS (
         UPDATE attachment_trash_items
            SET purge_status = 'purge_requested',
                purge_after_at = now(),
                updated_at = now()
          WHERE id IN (SELECT id FROM bundle_trash)
          RETURNING id
       ), marked_memos AS (
         UPDATE memos
            SET is_active = false,
                delete_status = 'purged',
                purge_status = 'purged',
                purge_requested_at = COALESCE(purge_requested_at, now()),
                purged_at = now(),
                purged_by = $2,
                updated_at = now()
          WHERE order_id = $1
            AND COALESCE(delete_status, 'active') <> 'purged'
          RETURNING id
       )
       SELECT COUNT(*)::text AS affected_count
         FROM marked_workorder`,
      [candidate.id, actorId ?? "system-storage-purge", WORKORDER_BUNDLE_DELETE_REASON],
    );

    const affectedCount = toNumber(result.rows[0]?.affected_count ?? 0);
    if (affectedCount === 0) {
      throw new Error("WORKORDER_PURGE_CANDIDATE_NOT_FOUND");
    }

    return {
      trashItemId: `${WORKORDER_CANDIDATE_PREFIX}${candidate.id}`,
      attachmentId: null,
      storageKey: null,
      thumbnailKey: null,
      status: "purged",
    };
  } catch (error) {
    return {
      trashItemId: `${WORKORDER_CANDIDATE_PREFIX}${candidate.id}`,
      attachmentId: null,
      storageKey: null,
      thumbnailKey: null,
      status: "failed",
      errorMessage: getPurgeErrorMessage(error),
    };
  }
}

async function purgeSystemStorageCandidate(
  candidate: SystemStoragePurgeRunCandidate,
  actorId: string | null | undefined,
): Promise<SystemStoragePurgeRunItemResult> {
  return candidate.candidateKind === "workorder"
    ? purgeSystemWorkOrderCandidate(candidate, actorId)
    : purgeSystemFileCandidate(candidate, actorId);
}

export async function runSystemStoragePurge(input: SystemStoragePurgeRunInput): Promise<SystemStoragePurgeRunResult> {
  const requestedCount = input.mode === "selected" ? normalizeTrashItemIds(input.trashItemIds).length : 0;
  const candidates = await listSystemStoragePurgeRunCandidates(input);
  const items: SystemStoragePurgeRunItemResult[] = [];

  for (const candidate of candidates) {
    items.push(await purgeSystemStorageCandidate(candidate, input.actorId));
  }

  return {
    requestedCount,
    candidateCount: candidates.length,
    purgedCount: items.filter((item) => item.status === "purged").length,
    failedCount: items.filter((item) => item.status === "failed").length,
    items,
  };
}
