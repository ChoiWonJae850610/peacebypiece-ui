import "server-only";

import { randomUUID } from "crypto";

import { queryDb, withDbTransaction } from "@/lib/db/client";
import {
  COMPANY_FILE_TYPES,
  type CompanyFileMetadata,
  type CompanyFileReviewStatus,
  type CompanyFileType,
  type CreateCompanyFileMetadataInput,
} from "@/lib/admin/settings/companyFileTypes";

const COMPANY_FILE_REVIEW_STATUS_VALUES = new Set<CompanyFileReviewStatus>([
  "not_required",
  "pending_review",
  "approved",
  "rejected",
]);

export class CompanyFileValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CompanyFileValidationError";
  }
}

type CompanyFileRow = Record<string, unknown> & {
  id: string;
  company_id: string;
  file_type: string;
  original_name: string;
  storage_key: string;
  mime_type: string;
  size_bytes: string | number;
  review_status: string;
  uploaded_by_user_id: string | null;
  reviewed_by_system_user_id: string | null;
  reviewed_at: string | Date | null;
  rejection_reason: string | null;
  replaced_by_file_id: string | null;
  created_at: string | Date | null;
  updated_at: string | Date | null;
  deleted_at: string | Date | null;
};

function toIso(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function toCompanyFileType(value: string): CompanyFileType {
  if ((COMPANY_FILE_TYPES as readonly string[]).includes(value)) {
    return value as CompanyFileType;
  }
  throw new CompanyFileValidationError(`Unsupported company file type: ${value}`);
}

function toReviewStatus(value: string): CompanyFileReviewStatus {
  return COMPANY_FILE_REVIEW_STATUS_VALUES.has(value as CompanyFileReviewStatus)
    ? (value as CompanyFileReviewStatus)
    : "pending_review";
}

function getDefaultReviewStatus(fileType: CompanyFileType): CompanyFileReviewStatus {
  return fileType === "business_registration" ? "pending_review" : "not_required";
}

function normalizeRequiredText(value: unknown, fieldName: string): string {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (!normalized) {
    throw new CompanyFileValidationError(`${fieldName} is required.`);
  }
  return normalized;
}

function normalizeSizeBytes(value: unknown): number {
  const numericValue = Math.trunc(Number(value));
  if (!Number.isFinite(numericValue) || numericValue < 0) {
    throw new CompanyFileValidationError("sizeBytes must be a non-negative number.");
  }
  return numericValue;
}

function mapRow(row: CompanyFileRow): CompanyFileMetadata {
  return {
    id: row.id,
    companyId: row.company_id,
    fileType: toCompanyFileType(row.file_type),
    originalName: row.original_name,
    storageKey: row.storage_key,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes ?? 0),
    reviewStatus: toReviewStatus(row.review_status),
    uploadedByUserId: row.uploaded_by_user_id,
    reviewedBySystemUserId: row.reviewed_by_system_user_id,
    reviewedAt: toIso(row.reviewed_at),
    rejectionReason: row.rejection_reason,
    replacedByFileId: row.replaced_by_file_id,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    deletedAt: toIso(row.deleted_at),
  };
}

const COMPANY_FILE_SELECT = `
  id,
  company_id,
  file_type,
  original_name,
  storage_key,
  mime_type,
  size_bytes,
  review_status,
  uploaded_by_user_id,
  reviewed_by_system_user_id,
  reviewed_at,
  rejection_reason,
  replaced_by_file_id,
  created_at,
  updated_at,
  deleted_at
`;

export function normalizeCompanyFileInput(input: CreateCompanyFileMetadataInput): CreateCompanyFileMetadataInput {
  return {
    companyId: normalizeRequiredText(input.companyId, "companyId"),
    fileType: toCompanyFileType(normalizeRequiredText(input.fileType, "fileType")),
    originalName: normalizeRequiredText(input.originalName, "originalName"),
    storageKey: normalizeRequiredText(input.storageKey, "storageKey"),
    mimeType: normalizeRequiredText(input.mimeType, "mimeType"),
    sizeBytes: normalizeSizeBytes(input.sizeBytes),
    uploadedByUserId: input.uploadedByUserId?.trim() || null,
  };
}

export async function listActiveCompanyFiles(companyId: string): Promise<CompanyFileMetadata[]> {
  const normalizedCompanyId = normalizeRequiredText(companyId, "companyId");
  const result = await queryDb<CompanyFileRow>(
    `SELECT ${COMPANY_FILE_SELECT}
       FROM company_files
      WHERE company_id = $1::text
        AND deleted_at IS NULL
      ORDER BY file_type ASC, created_at DESC, id DESC`,
    [normalizedCompanyId],
  );

  return result.rows.map(mapRow);
}

export async function getActiveCompanyFileById(input: {
  companyId: string;
  fileId: string;
}): Promise<CompanyFileMetadata | null> {
  const normalizedCompanyId = normalizeRequiredText(input.companyId, "companyId");
  const normalizedFileId = normalizeRequiredText(input.fileId, "fileId");
  const result = await queryDb<CompanyFileRow>(
    `SELECT ${COMPANY_FILE_SELECT}
       FROM company_files
      WHERE company_id = $1::text
        AND id = $2::text
        AND deleted_at IS NULL
      LIMIT 1`,
    [normalizedCompanyId, normalizedFileId],
  );

  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function createOrReplaceCompanyFileMetadata(
  input: CreateCompanyFileMetadataInput,
): Promise<CompanyFileMetadata> {
  const normalized = normalizeCompanyFileInput(input);
  const fileId = randomUUID();
  const reviewStatus = getDefaultReviewStatus(normalized.fileType);

  return withDbTransaction(async (client) => {
    const insertResult = await client.query<CompanyFileRow>(
      `INSERT INTO company_files (
         id,
         company_id,
         file_type,
         original_name,
         storage_key,
         mime_type,
         size_bytes,
         review_status,
         uploaded_by_user_id
       ) VALUES (
         $1::text,
         $2::text,
         $3::text,
         $4::text,
         $5::text,
         $6::text,
         $7::bigint,
         $8::text,
         $9::text
       )
       RETURNING ${COMPANY_FILE_SELECT}`,
      [
        fileId,
        normalized.companyId,
        normalized.fileType,
        normalized.originalName,
        normalized.storageKey,
        normalized.mimeType,
        normalized.sizeBytes,
        reviewStatus,
        normalized.uploadedByUserId ?? null,
      ],
    );

    await client.query(
      `UPDATE company_files
          SET deleted_at = now(),
              replaced_by_file_id = $1::text,
              updated_at = now()
        WHERE company_id = $2::text
          AND file_type = $3::text
          AND id <> $1::text
          AND deleted_at IS NULL`,
      [fileId, normalized.companyId, normalized.fileType],
    );

    return mapRow(insertResult.rows[0]);
  });
}
