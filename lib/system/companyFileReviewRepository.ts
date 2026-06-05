import "server-only";

import { queryDb, withDbTransaction } from "@/lib/db/client";
import type { CompanyFileReviewStatus, CompanyFileType } from "@/lib/admin/settings/companyFileTypes";

export type SystemCompanyFileReviewAction = "approved" | "rejected";

export type SystemCompanyFileReviewRecord = {
  id: string;
  companyId: string;
  companyName: string;
  businessName: string | null;
  fileType: CompanyFileType;
  originalName: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  reviewStatus: CompanyFileReviewStatus;
  uploadedByUserId: string | null;
  uploaderName: string | null;
  reviewerName: string | null;
  reviewedBySystemUserId: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
};

type SystemCompanyFileReviewRow = {
  id: string;
  company_id: string;
  company_name: string;
  business_name: string | null;
  file_type: CompanyFileType;
  original_name: string;
  storage_key: string;
  mime_type: string;
  size_bytes: string | number;
  review_status: CompanyFileReviewStatus;
  uploaded_by_user_id: string | null;
  uploader_name: string | null;
  reviewer_name: string | null;
  reviewed_by_system_user_id: string | null;
  reviewed_at: Date | string | null;
  rejection_reason: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

const SYSTEM_COMPANY_FILE_REVIEW_SELECT = `
  file.id,
  file.company_id,
  company.name AS company_name,
  company.business_name,
  file.file_type,
  file.original_name,
  file.storage_key,
  file.mime_type,
  file.size_bytes,
  file.review_status,
  file.uploaded_by_user_id,
  uploader.name AS uploader_name,
  reviewer.name AS reviewer_name,
  file.reviewed_by_system_user_id,
  file.reviewed_at,
  file.rejection_reason,
  file.created_at,
  file.updated_at
`;

function toIsoString(value: Date | string | null): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function normalizeReviewStatus(value: unknown): CompanyFileReviewStatus {
  if (value === "not_required" || value === "pending_review" || value === "approved" || value === "rejected") {
    return value;
  }
  return "pending_review";
}

function toSystemCompanyFileReviewRecord(row: SystemCompanyFileReviewRow): SystemCompanyFileReviewRecord {
  return {
    id: row.id,
    companyId: row.company_id,
    companyName: row.company_name,
    businessName: row.business_name,
    fileType: row.file_type,
    originalName: row.original_name,
    storageKey: row.storage_key,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes ?? 0),
    reviewStatus: normalizeReviewStatus(row.review_status),
    uploadedByUserId: row.uploaded_by_user_id,
    uploaderName: row.uploader_name,
    reviewerName: row.reviewer_name,
    reviewedBySystemUserId: row.reviewed_by_system_user_id,
    reviewedAt: toIsoString(row.reviewed_at),
    rejectionReason: row.rejection_reason,
    createdAt: toIsoString(row.created_at) || "",
    updatedAt: toIsoString(row.updated_at) || "",
  };
}

function normalizeLimit(value: number | undefined): number {
  if (!Number.isFinite(value)) return 50;
  return Math.min(Math.max(Math.trunc(value || 50), 1), 200);
}

function normalizeReviewReason(value: unknown, action: SystemCompanyFileReviewAction): string | null {
  if (typeof value !== "string") {
    if (action === "rejected") throw new Error("SYSTEM_COMPANY_FILE_REJECTION_REASON_REQUIRED");
    return null;
  }

  const reason = value.trim().replace(/\s+/g, " ");
  if (!reason) {
    if (action === "rejected") throw new Error("SYSTEM_COMPANY_FILE_REJECTION_REASON_REQUIRED");
    return null;
  }
  if (reason.length > 1200) {
    throw new Error("SYSTEM_COMPANY_FILE_REVIEW_REASON_TOO_LONG");
  }
  return reason;
}

export function isSystemCompanyFileReviewAction(value: unknown): value is SystemCompanyFileReviewAction {
  return value === "approved" || value === "rejected";
}

export async function listSystemCompanyFileReviews(limit?: number): Promise<SystemCompanyFileReviewRecord[]> {
  const result = await queryDb<SystemCompanyFileReviewRow>(
    `SELECT ${SYSTEM_COMPANY_FILE_REVIEW_SELECT}
       FROM company_files file
       INNER JOIN companies company
          ON company.id = file.company_id
       LEFT JOIN users uploader
          ON uploader.id = file.uploaded_by_user_id
       LEFT JOIN system_users reviewer
          ON reviewer.id = file.reviewed_by_system_user_id
      WHERE file.deleted_at IS NULL
        AND file.file_type = 'business_registration'
      ORDER BY
        CASE file.review_status
          WHEN 'pending_review' THEN 0
          WHEN 'rejected' THEN 1
          WHEN 'approved' THEN 2
          ELSE 3
        END ASC,
        file.created_at DESC,
        file.id DESC
      LIMIT $1`,
    [normalizeLimit(limit)],
  );

  return result.rows.map(toSystemCompanyFileReviewRecord);
}

export async function updateSystemCompanyFileReview({
  fileId,
  reviewerUserId,
  action,
  reviewReason,
}: {
  fileId: string;
  reviewerUserId: string;
  action: SystemCompanyFileReviewAction;
  reviewReason?: unknown;
}): Promise<SystemCompanyFileReviewRecord> {
  const normalizedFileId = typeof fileId === "string" ? fileId.trim() : "";
  if (!normalizedFileId) throw new Error("SYSTEM_COMPANY_FILE_ID_REQUIRED");

  const normalizedReviewerUserId = typeof reviewerUserId === "string" ? reviewerUserId.trim() : "";
  if (!normalizedReviewerUserId) throw new Error("SYSTEM_COMPANY_FILE_REVIEWER_REQUIRED");

  const normalizedReason = normalizeReviewReason(reviewReason, action);

  return withDbTransaction(async (client) => {
    const result = await client.query<SystemCompanyFileReviewRow>(
      `WITH updated_file AS (
         UPDATE company_files file
            SET review_status = $2,
                reviewed_by_system_user_id = $3,
                reviewed_at = now(),
                rejection_reason = $4,
                updated_at = now()
          WHERE file.id = $1
            AND file.deleted_at IS NULL
            AND file.file_type = 'business_registration'
          RETURNING file.*
       )
       SELECT
         updated_file.id,
         updated_file.company_id,
         company.name AS company_name,
         company.business_name,
         updated_file.file_type,
         updated_file.original_name,
         updated_file.storage_key,
         updated_file.mime_type,
         updated_file.size_bytes,
         updated_file.review_status,
         updated_file.uploaded_by_user_id,
         uploader.name AS uploader_name,
         reviewer.name AS reviewer_name,
         updated_file.reviewed_by_system_user_id,
         updated_file.reviewed_at,
         updated_file.rejection_reason,
         updated_file.created_at,
         updated_file.updated_at
       FROM updated_file
       INNER JOIN companies company
          ON company.id = updated_file.company_id
       LEFT JOIN users uploader
          ON uploader.id = updated_file.uploaded_by_user_id
       LEFT JOIN system_users reviewer
          ON reviewer.id = updated_file.reviewed_by_system_user_id`,
      [normalizedFileId, action, normalizedReviewerUserId, action === "rejected" ? normalizedReason : null],
    );

    const row = result.rows[0];
    if (!row) throw new Error("SYSTEM_COMPANY_FILE_NOT_FOUND");
    return toSystemCompanyFileReviewRecord(row);
  });
}
