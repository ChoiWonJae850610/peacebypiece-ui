import "server-only";

import { randomUUID } from "crypto";

import { deleteCachedR2UrlsByKey } from "@/lib/storage/r2/r2UrlCache";
import {
  createR2WorkerUploadUrl,
  deleteR2ObjectViaWorker,
  isR2WorkerUploadConfigured,
} from "@/lib/storage/r2/r2WorkerUpload";
import type { CompanyOnboardingFileMetadata } from "@/lib/admin/settings/companyTypes";
import {
  COMPANY_ONBOARDING_FILE_ERROR_CODES,
  createCompanyOnboardingFileStorageKey,
  isCompanyOnboardingFileStorageKeyForCompany,
  validateCompanyOnboardingFileInput,
} from "@/lib/admin/settings/companyOnboardingFilePolicy";
import {
  createCompanyOnboardingFileMetadata,
  getActiveCompanyOnboardingFileMetadata,
  softDeleteActiveCompanyOnboardingFileMetadataByType,
  softDeleteCompanyOnboardingFileMetadata,
} from "@/lib/admin/settings/companyOnboardingFileRepository";

export type UploadCompanyOnboardingFileInput = {
  companyId: string;
  uploadedByUserId: string;
  fileType: string | null | undefined;
  file: File;
};

export type DeleteCompanyOnboardingFileInput = {
  companyId: string;
  fileId: string;
};

async function readWorkerError(response: Response): Promise<string> {
  const body = await response.text().catch(() => "");
  if (!body) return `${COMPANY_ONBOARDING_FILE_ERROR_CODES.uploadFailed}_${response.status}`;

  try {
    const parsed = JSON.parse(body) as { error?: string; message?: string };
    return parsed.message || parsed.error || body;
  } catch {
    return body;
  }
}

function assertR2WorkerConfigured(): void {
  if (!isR2WorkerUploadConfigured()) {
    throw new Error(COMPANY_ONBOARDING_FILE_ERROR_CODES.uploadNotConfigured);
  }
}

async function uploadFileToR2(input: { storageKey: string; mimeType: string; file: File }): Promise<void> {
  const upload = createR2WorkerUploadUrl({ key: input.storageKey, contentType: input.mimeType });
  const response = await fetch(upload.url, {
    method: upload.method,
    headers: upload.headers,
    body: await input.file.arrayBuffer(),
  });

  if (!response.ok) {
    const message = await readWorkerError(response);
    throw new Error(message || COMPANY_ONBOARDING_FILE_ERROR_CODES.uploadFailed);
  }
}

async function deleteUploadedObjectQuietly(input: { storageKey: string; reason: string }): Promise<void> {
  try {
    await deleteR2ObjectViaWorker({ key: input.storageKey });
    deleteCachedR2UrlsByKey(input.storageKey);
  } catch (error) {
    console.error("[COMPANY_ONBOARDING_FILE_R2_DELETE_FAILED]", {
      storageKey: input.storageKey,
      reason: input.reason,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

async function cleanupReplacedCompanyOnboardingFiles(
  files: readonly CompanyOnboardingFileMetadata[],
): Promise<void> {
  await Promise.all(
    files.map((file) =>
      deleteUploadedObjectQuietly({
        storageKey: file.storageKey,
        reason: "replace",
      }),
    ),
  );
}

export async function uploadCompanyOnboardingFile(
  input: UploadCompanyOnboardingFileInput,
): Promise<CompanyOnboardingFileMetadata> {
  assertR2WorkerConfigured();

  const validation = validateCompanyOnboardingFileInput({
    fileType: input.fileType,
    mimeType: input.file.type,
    sizeBytes: input.file.size,
  });

  if (!validation.ok) {
    throw new Error(validation.error);
  }

  const fileId = randomUUID();
  const originalName = input.file.name?.trim() || `${validation.fileType}-${fileId}`;
  const storageKey = createCompanyOnboardingFileStorageKey({
    companyId: input.companyId,
    fileType: validation.fileType,
    originalName,
    mimeType: validation.mimeType,
    fileId,
  });

  if (!isCompanyOnboardingFileStorageKeyForCompany({
    key: storageKey,
    companyId: input.companyId,
    fileType: validation.fileType,
  })) {
    throw new Error(COMPANY_ONBOARDING_FILE_ERROR_CODES.uploadFailed);
  }

  await uploadFileToR2({ storageKey, mimeType: validation.mimeType, file: input.file });

  try {
    const metadata = await createCompanyOnboardingFileMetadata({
      id: fileId,
      companyId: input.companyId,
      fileType: validation.fileType,
      originalName,
      storageKey,
      mimeType: validation.mimeType,
      sizeBytes: validation.sizeBytes,
      uploadedByUserId: input.uploadedByUserId,
    });

    const replacedFiles = await softDeleteActiveCompanyOnboardingFileMetadataByType({
      companyId: input.companyId,
      fileType: validation.fileType,
      excludeFileId: metadata.id,
    });

    deleteCachedR2UrlsByKey(storageKey);
    replacedFiles.forEach((file) => deleteCachedR2UrlsByKey(file.storageKey));
    await cleanupReplacedCompanyOnboardingFiles(replacedFiles);
    return metadata;
  } catch (error) {
    await deleteUploadedObjectQuietly({ storageKey, reason: "metadata-save-failed" });
    throw new Error(error instanceof Error ? error.message : COMPANY_ONBOARDING_FILE_ERROR_CODES.metadataSaveFailed);
  }
}

export async function deleteCompanyOnboardingFile(
  input: DeleteCompanyOnboardingFileInput,
): Promise<CompanyOnboardingFileMetadata | null> {
  assertR2WorkerConfigured();

  const file = await getActiveCompanyOnboardingFileMetadata({
    companyId: input.companyId,
    fileId: input.fileId,
  });

  if (!file) return null;

  if (!isCompanyOnboardingFileStorageKeyForCompany({
    key: file.storageKey,
    companyId: input.companyId,
    fileType: file.fileType,
  })) {
    throw new Error(COMPANY_ONBOARDING_FILE_ERROR_CODES.deleteFailed);
  }

  await deleteR2ObjectViaWorker({ key: file.storageKey });
  const deleted = await softDeleteCompanyOnboardingFileMetadata({
    companyId: input.companyId,
    fileId: input.fileId,
  });

  deleteCachedR2UrlsByKey(file.storageKey);
  return deleted;
}
