import "server-only";

import { COMPANY_FILE_TRASH_RETENTION_DAYS } from "@/lib/admin/settings/companyDefaults";
import { markAttachmentTrashItemPurgeFailed, markAttachmentTrashItemsPurged } from "@/lib/admin/files/serverActions";
import { deleteR2ObjectViaWorker } from "@/lib/storage/r2/r2WorkerUpload";
import { deleteCachedR2UrlsByKey } from "@/lib/storage/r2/r2UrlCache";
import { queryDb } from "@/lib/db/client";
import type { DbQueryResultRow } from "@/lib/db/client";

const WORKORDER_BUNDLE_DELETE_REASON = "작업지시서 삭제로 함께 휴지통 이동";

export type SystemStoragePurgeCandidate = {
  trashItemId: string;
  attachmentId: string;
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
};

export type SystemStoragePurgeCandidateSummary = {
  candidateCount: number;
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

function getPurgeStatusLabel(status: string | null | undefined, error: string | null | undefined): string {
  if (error) return "삭제 실패";
  if (status === "purge_requested") return "영구삭제 요청";
  if (status === "pending") return "30일 경과";
  return status || "후보";
}

function getOverdueDays(purgeDueAt: string | Date | null | undefined): number {
  const date = toDate(purgeDueAt);
  if (!date) return 0;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
}

function mapCandidateRow(row: PurgeCandidateRow): SystemStoragePurgeCandidate {
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
    purgeStatusLabel: getPurgeStatusLabel(row.purge_status, row.last_purge_error),
    lastPurgeError: row.last_purge_error,
  };
}

export async function getSystemStoragePurgeCandidateSnapshot(limit = 200): Promise<SystemStoragePurgeCandidateSnapshot> {
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 500);
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
          t.order_id IS NULL
          OR (s.deleted_at IS NULL AND COALESCE(s.is_active, true) = true)
          OR COALESCE(t.delete_reason, '') <> $3
        )
        AND (
          t.purge_status = 'purge_requested'
          OR (t.purge_status = 'pending' AND (COALESCE(t.deleted_at, now()) + ($2::integer * interval '1 day')) <= now())
          OR t.last_purge_error IS NOT NULL
        )
      ORDER BY purge_due_at ASC, t.deleted_at ASC
      LIMIT $1`,
    [safeLimit, COMPANY_FILE_TRASH_RETENTION_DAYS, WORKORDER_BUNDLE_DELETE_REASON],
  );

  const candidates = result.rows.map(mapCandidateRow);
  const companyIds = new Set(candidates.map((candidate) => candidate.companyId || candidate.companyName));
  const totalOriginalBytes = candidates.reduce((sum, candidate) => sum + candidate.originalSizeBytes, 0);
  const thumbnailObjectCount = candidates.filter((candidate) => candidate.thumbnailKey).length;

  return {
    summary: {
      candidateCount: candidates.length,
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
  attachmentId: string;
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

type PurgeRunCandidateRow = PurgeCandidateRow;

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

async function listSystemStoragePurgeRunCandidates(input: SystemStoragePurgeRunInput): Promise<PurgeRunCandidateRow[]> {
  const safeLimit = Math.min(Math.max(Math.trunc(input.limit ?? 100), 1), 200);
  const trashItemIds = normalizeTrashItemIds(input.trashItemIds);

  if (input.mode === "selected") {
    if (trashItemIds.length === 0) return [];

    const result = await queryDb<PurgeRunCandidateRow>(
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
            t.order_id IS NULL
            OR (s.deleted_at IS NULL AND COALESCE(s.is_active, true) = true)
            OR COALESCE(t.delete_reason, '') <> $4
          )
          AND (
            t.purge_status = 'purge_requested'
            OR (t.purge_status = 'pending' AND (COALESCE(t.deleted_at, now()) + ($2::integer * interval '1 day')) <= now())
            OR t.last_purge_error IS NOT NULL
          )
        ORDER BY purge_due_at ASC, t.deleted_at ASC
        LIMIT $3`,
      [trashItemIds, COMPANY_FILE_TRASH_RETENTION_DAYS, safeLimit, WORKORDER_BUNDLE_DELETE_REASON],
    );

    return result.rows;
  }

  const result = await queryDb<PurgeRunCandidateRow>(
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
          t.order_id IS NULL
          OR (s.deleted_at IS NULL AND COALESCE(s.is_active, true) = true)
          OR COALESCE(t.delete_reason, '') <> $3
        )
        AND (
          t.purge_status = 'purge_requested'
          OR (t.purge_status = 'pending' AND (COALESCE(t.deleted_at, now()) + ($2::integer * interval '1 day')) <= now())
          OR t.last_purge_error IS NOT NULL
        )
      ORDER BY purge_due_at ASC, t.deleted_at ASC
      LIMIT $1`,
    [safeLimit, COMPANY_FILE_TRASH_RETENTION_DAYS, WORKORDER_BUNDLE_DELETE_REASON],
  );

  return result.rows;
}

async function purgeSystemStorageCandidate(
  candidate: PurgeRunCandidateRow,
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
