import "server-only";

import { queryDb } from "@/lib/db/client";
import type { CompanyFileType } from "@/lib/admin/settings/companyFileTypes";
import { getCurrentCompanySubscription } from "@/lib/billing/companySubscriptionRepository";
import {
  evaluateStorageQuotaForUpload,
  STORAGE_QUOTA_UPLOAD_ERROR_CODES,
  type StorageQuotaUploadDecision,
} from "@/lib/billing/storageQuotaPolicy";

type ActiveCompanyFileSizeRow = Record<string, unknown> & {
  size_bytes: string | number | null;
};

export type CompanyFileStorageQuotaResult =
  | { ok: true; decision: StorageQuotaUploadDecision }
  | { ok: false; error: typeof STORAGE_QUOTA_UPLOAD_ERROR_CODES.unavailable; message: string };

function toNonNegativeInteger(value: unknown): number {
  const numericValue = Math.trunc(Number(value ?? 0));
  return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : 0;
}

async function getReplaceableCompanyFileSize(input: {
  companyId: string;
  fileType: CompanyFileType;
}): Promise<number> {
  const result = await queryDb<ActiveCompanyFileSizeRow>(
    `SELECT COALESCE(size_bytes, 0)::bigint AS size_bytes
       FROM company_files
      WHERE company_id = $1::text
        AND file_type = $2::text
        AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1`,
    [input.companyId, input.fileType],
  );
  return toNonNegativeInteger(result.rows[0]?.size_bytes);
}

export async function checkCompanyFileUploadStorageQuota(input: {
  companyId: string;
  fileType: CompanyFileType;
  incomingSizeBytes: number;
}): Promise<CompanyFileStorageQuotaResult> {
  const companyId = input.companyId.trim();
  if (!companyId) {
    return {
      ok: false,
      error: STORAGE_QUOTA_UPLOAD_ERROR_CODES.unavailable,
      message: "회사 범위를 확인할 수 없어 저장공간 한도를 검증할 수 없습니다.",
    };
  }

  const subscription = await getCurrentCompanySubscription(companyId);
  if (!subscription) {
    return {
      ok: false,
      error: STORAGE_QUOTA_UPLOAD_ERROR_CODES.unavailable,
      message: "고객사 요금제·저장공간 정보를 확인할 수 없습니다.",
    };
  }

  const replaceableBytes = await getReplaceableCompanyFileSize({ companyId, fileType: input.fileType });
  return {
    ok: true,
    decision: evaluateStorageQuotaForUpload({
      storageLimitBytes: subscription.storageLimitBytes,
      storageUsedBytes: subscription.storageUsedBytes,
      incomingSizeBytes: input.incomingSizeBytes,
      replaceableBytes,
    }),
  };
}
