import "server-only";

import { queryDb } from "@/lib/db/client";
import type { CompanyOnboardingFileMetadata, CompanyOnboardingFileType } from "@/lib/admin/settings/companyTypes";

export type CreateCompanyOnboardingFileMetadataInput = {
  id: string;
  companyId: string;
  fileType: CompanyOnboardingFileType;
  originalName: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  uploadedByUserId?: string | null;
};

type CompanyOnboardingFileRow = {
  id: string;
  company_id: string;
  file_type: CompanyOnboardingFileType;
  original_name: string;
  storage_key: string;
  mime_type: string;
  size_bytes: string | number;
  uploaded_by_user_id: string | null;
  created_at: string | Date | null;
  deleted_at: string | Date | null;
};

function toIso(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return value;
}

function mapRow(row: CompanyOnboardingFileRow): CompanyOnboardingFileMetadata {
  return {
    id: row.id,
    companyId: row.company_id,
    fileType: row.file_type,
    originalName: row.original_name,
    storageKey: row.storage_key,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes ?? 0),
    uploadedByUserId: row.uploaded_by_user_id,
    createdAt: toIso(row.created_at),
    deletedAt: toIso(row.deleted_at),
  };
}

export async function createCompanyOnboardingFileMetadata(
  input: CreateCompanyOnboardingFileMetadataInput,
): Promise<CompanyOnboardingFileMetadata> {
  const result = await queryDb<CompanyOnboardingFileRow>(
    `
      INSERT INTO company_onboarding_files (
        id,
        company_id,
        file_type,
        original_name,
        storage_key,
        mime_type,
        size_bytes,
        uploaded_by_user_id
      )
      VALUES ($1::text, $2::text, $3::text, $4::text, $5::text, $6::text, $7::bigint, $8::text)
      RETURNING
        id,
        company_id,
        file_type,
        original_name,
        storage_key,
        mime_type,
        size_bytes,
        uploaded_by_user_id,
        created_at,
        deleted_at
    `,
    [
      input.id,
      input.companyId,
      input.fileType,
      input.originalName,
      input.storageKey,
      input.mimeType,
      input.sizeBytes,
      input.uploadedByUserId ?? null,
    ],
  );

  return mapRow(result.rows[0]);
}

export async function listActiveCompanyOnboardingFileMetadata(input: {
  companyId: string;
  fileType?: CompanyOnboardingFileType;
}): Promise<CompanyOnboardingFileMetadata[]> {
  const values: string[] = [input.companyId];
  const fileTypeCondition = input.fileType ? "AND file_type = $2::text" : "";
  if (input.fileType) values.push(input.fileType);

  const result = await queryDb<CompanyOnboardingFileRow>(
    `
      SELECT
        id,
        company_id,
        file_type,
        original_name,
        storage_key,
        mime_type,
        size_bytes,
        uploaded_by_user_id,
        created_at,
        deleted_at
      FROM company_onboarding_files
      WHERE company_id = $1::text
        AND deleted_at IS NULL
        ${fileTypeCondition}
      ORDER BY created_at DESC, id DESC
    `,
    values,
  );

  return result.rows.map(mapRow);
}

export async function getActiveCompanyOnboardingFileMetadata(input: {
  companyId: string;
  fileId: string;
}): Promise<CompanyOnboardingFileMetadata | null> {
  const result = await queryDb<CompanyOnboardingFileRow>(
    `
      SELECT
        id,
        company_id,
        file_type,
        original_name,
        storage_key,
        mime_type,
        size_bytes,
        uploaded_by_user_id,
        created_at,
        deleted_at
      FROM company_onboarding_files
      WHERE company_id = $1::text
        AND id = $2::text
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [input.companyId, input.fileId],
  );

  const row = result.rows[0];
  return row ? mapRow(row) : null;
}

export async function softDeleteCompanyOnboardingFileMetadata(input: {
  companyId: string;
  fileId: string;
}): Promise<CompanyOnboardingFileMetadata | null> {
  const result = await queryDb<CompanyOnboardingFileRow>(
    `
      UPDATE company_onboarding_files
         SET deleted_at = now()
       WHERE company_id = $1::text
         AND id = $2::text
         AND deleted_at IS NULL
      RETURNING
        id,
        company_id,
        file_type,
        original_name,
        storage_key,
        mime_type,
        size_bytes,
        uploaded_by_user_id,
        created_at,
        deleted_at
    `,
    [input.companyId, input.fileId],
  );

  const row = result.rows[0];
  return row ? mapRow(row) : null;
}

export async function softDeleteActiveCompanyOnboardingFileMetadataByType(input: {
  companyId: string;
  fileType: CompanyOnboardingFileType;
  excludeFileId?: string | null;
}): Promise<CompanyOnboardingFileMetadata[]> {
  const values = [input.companyId, input.fileType, input.excludeFileId ?? ""];
  const result = await queryDb<CompanyOnboardingFileRow>(
    `
      UPDATE company_onboarding_files
         SET deleted_at = now()
       WHERE company_id = $1::text
         AND file_type = $2::text
         AND deleted_at IS NULL
         AND id <> $3::text
      RETURNING
        id,
        company_id,
        file_type,
        original_name,
        storage_key,
        mime_type,
        size_bytes,
        uploaded_by_user_id,
        created_at,
        deleted_at
    `,
    values,
  );

  return result.rows.map(mapRow);
}
