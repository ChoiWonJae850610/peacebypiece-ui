import "server-only";

import { randomUUID } from "crypto";

import { deleteCachedR2UrlsByKey } from "@/lib/storage/r2/r2UrlCache";
import {
  createR2WorkerUploadUrl,
  deleteR2ObjectViaWorker,
  isR2WorkerUploadConfigured,
  R2WorkerRequestError,
} from "@/lib/storage/r2/r2WorkerUpload";
import type { SignupApplicantSessionPayload } from "./signupApplicantSession";
import { createSignupApplicantOwner } from "./currentSignupApplicantSession";
import { SignupApplicationApiError } from "./signupApplicationApiError";
import type { SignupApplicationFileRecord } from "./signupApplicationTypes";
import {
  orchestrateSignupApplicationCertificateDelete,
  orchestrateSignupApplicationCertificateUpload,
  summarizeSignupApplicationCertificateRecord,
} from "./signupApplicationCertificateOrchestration.mjs";
import {
  SIGNUP_APPLICATION_CERTIFICATE_ERROR_CODES,
  SIGNUP_APPLICATION_CERTIFICATE_MAX_BYTES,
  buildSignupApplicationCertificateStorageKey,
  getSignupApplicationCertificateExtension,
  isSignupApplicationCertificateMimeTypeAllowed,
  isSignupApplicationCertificateSizeAllowed,
  isSignupApplicationCertificateStorageKey,
  isSignupApplicationCertificateStorageKeyConsistentWithMime,
  normalizeSignupApplicationCertificateMimeType,
  sanitizeSignupApplicationCertificateOriginalName,
  validateSignupApplicationCertificateBytes,
  type SignupApplicationCertificateMimeType,
} from "./signupApplicationFilePolicy";
import { createPostgresSignupApplicationCertificateRepository } from "./signupApplicationCertificateRepository";

export type SignupApplicationCertificateView = {
  id: string;
  applicationId: string;
  fileType: "business_registration";
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  reviewedAt: string | null;
  approvedCompanyFileId: string | null;
};

type StorageAdapter = {
  upload(input: { storageKey: string; mimeType: string; bytes: Uint8Array }): Promise<void>;
  delete(input: { storageKey: string }): Promise<void>;
};

function summarizeCertificate(file: SignupApplicationFileRecord | null): SignupApplicationCertificateView | null {
  return summarizeSignupApplicationCertificateRecord(file) as SignupApplicationCertificateView | null;
}

async function readWorkerError(response: Response): Promise<{ code: string; status: number; retryable: boolean }> {
  await response.text().catch(() => "");
  return {
    code: `${SIGNUP_APPLICATION_CERTIFICATE_ERROR_CODES.uploadFailed}_${response.status}`,
    status: response.status,
    retryable: response.status === 408 || response.status === 429 || response.status >= 500,
  };
}

function createDefaultStorageAdapter(): StorageAdapter {
  return {
    async upload(input) {
      const upload = createR2WorkerUploadUrl({
        key: input.storageKey,
        contentType: input.mimeType,
      });
      const response = await fetch(upload.url, {
        method: upload.method,
        headers: upload.headers,
        body: input.bytes.buffer.slice(
          input.bytes.byteOffset,
          input.bytes.byteOffset + input.bytes.byteLength,
        ) as ArrayBuffer,
      });
      if (!response.ok) {
        const safeError = await readWorkerError(response);
        throw new R2WorkerRequestError(safeError);
      }
    },
    async delete(input) {
      await deleteR2ObjectViaWorker({ key: input.storageKey });
    },
  };
}

async function deleteUploadedObjectQuietly(input: {
  adapter: StorageAdapter;
  storageKey: string;
  reason: string;
}): Promise<void> {
  try {
    await input.adapter.delete({ storageKey: input.storageKey });
    deleteCachedR2UrlsByKey(input.storageKey);
  } catch (error) {
    const r2Error = error instanceof R2WorkerRequestError ? error : null;
    console.error("[SIGNUP_CERTIFICATE_R2_CLEANUP_FAILED]", {
      operation: "delete",
      hasStorageKey: Boolean(input.storageKey),
      reason: input.reason,
      status: r2Error?.status,
      retryable: r2Error?.retryable ?? false,
      cleanupBacklog: "0.24.28",
    });
  }
}

async function cleanupInactiveCertificateObjects(input: {
  adapter: StorageAdapter;
  applicationId: string;
  files: readonly SignupApplicationFileRecord[];
}): Promise<void> {
  const seenKeys = new Set<string>();
  for (const inactiveFile of input.files) {
    if (seenKeys.has(inactiveFile.storageKey)) continue;
    seenKeys.add(inactiveFile.storageKey);
    if (
      !isSignupApplicationCertificateStorageKey({
        storageKey: inactiveFile.storageKey,
        applicationId: input.applicationId,
        fileId: inactiveFile.id,
      })
      || !isSignupApplicationCertificateStorageKeyConsistentWithMime({
        storageKey: inactiveFile.storageKey,
        mimeType: inactiveFile.mimeType,
      })
    ) {
      console.error("[SIGNUP_CERTIFICATE_R2_CLEANUP_PENDING]", {
        operation: "delete",
        hasStorageKey: Boolean(inactiveFile.storageKey),
        reason: "invalid-replaced-key",
        cleanupBacklog: "0.24.28",
      });
      continue;
    }

    await deleteUploadedObjectQuietly({
      adapter: input.adapter,
      storageKey: inactiveFile.storageKey,
      reason: "replace-after-metadata-commit",
    });
  }
}

function assertSessionApplicationId(session: SignupApplicantSessionPayload): string {
  const applicationId = session.applicationId?.trim();
  if (!applicationId) {
    throw new SignupApplicationApiError(SIGNUP_APPLICATION_CERTIFICATE_ERROR_CODES.applicationIdRequired, 400);
  }
  return applicationId;
}

async function parseCertificateFile(file: File): Promise<{
  originalName: string;
  mimeType: SignupApplicationCertificateMimeType;
  sizeBytes: number;
  extension: "png" | "jpg" | "pdf";
  bytes: Uint8Array;
}> {
  const rawOriginalName = String(file.name ?? "").trim();
  const originalName = sanitizeSignupApplicationCertificateOriginalName(rawOriginalName);
  const mimeType = normalizeSignupApplicationCertificateMimeType(file.type);
  if (!isSignupApplicationCertificateMimeTypeAllowed(mimeType)) {
    throw new SignupApplicationApiError(SIGNUP_APPLICATION_CERTIFICATE_ERROR_CODES.mimeTypeUnsupported, 400);
  }

  const sizeBytes = Math.trunc(Number(file.size ?? 0));
  if (!isSignupApplicationCertificateSizeAllowed(sizeBytes)) {
    throw new SignupApplicationApiError(SIGNUP_APPLICATION_CERTIFICATE_ERROR_CODES.fileSizeUnsupported, 400);
  }

  let extension: "png" | "jpg" | "pdf";
  try {
    extension = getSignupApplicationCertificateExtension({ originalName: rawOriginalName, mimeType });
  } catch {
    throw new SignupApplicationApiError(SIGNUP_APPLICATION_CERTIFICATE_ERROR_CODES.extensionUnsupported, 400);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.byteLength !== sizeBytes || bytes.byteLength > SIGNUP_APPLICATION_CERTIFICATE_MAX_BYTES) {
    throw new SignupApplicationApiError(SIGNUP_APPLICATION_CERTIFICATE_ERROR_CODES.fileSizeUnsupported, 400);
  }
  if (!validateSignupApplicationCertificateBytes({ bytes, mimeType })) {
    throw new SignupApplicationApiError(SIGNUP_APPLICATION_CERTIFICATE_ERROR_CODES.fileSignatureUnsupported, 400);
  }

  return { originalName, mimeType, sizeBytes, extension, bytes };
}

export async function getOwnedSignupApplicationCertificate(input: {
  session: SignupApplicantSessionPayload;
}): Promise<SignupApplicationCertificateView | null> {
  const applicationId = assertSessionApplicationId(input.session);
  const file = await createPostgresSignupApplicationCertificateRepository().findActiveOwnedCertificate({
    applicationId,
    owner: createSignupApplicantOwner(input.session),
  });
  return summarizeCertificate(file);
}

export async function uploadOwnedSignupApplicationCertificate(input: {
  session: SignupApplicantSessionPayload;
  file: File | null;
  storageAdapter?: StorageAdapter;
}): Promise<SignupApplicationCertificateView> {
  const applicationId = assertSessionApplicationId(input.session);
  if (!input.file) {
    throw new SignupApplicationApiError(SIGNUP_APPLICATION_CERTIFICATE_ERROR_CODES.fileRequired, 400);
  }
  if (!input.storageAdapter && !isR2WorkerUploadConfigured()) {
    throw new SignupApplicationApiError(SIGNUP_APPLICATION_CERTIFICATE_ERROR_CODES.uploadNotConfigured, 503);
  }

  const parsed = await parseCertificateFile(input.file);
  const fileId = randomUUID();
  const storageKey = buildSignupApplicationCertificateStorageKey({
    applicationId,
    fileId,
    extension: parsed.extension,
  });
  if (!isSignupApplicationCertificateStorageKey({ storageKey, applicationId, fileId })) {
    throw new SignupApplicationApiError(SIGNUP_APPLICATION_CERTIFICATE_ERROR_CODES.uploadFailed, 500);
  }

  return orchestrateSignupApplicationCertificateUpload({
    applicationId,
    fileId,
    owner: createSignupApplicantOwner(input.session),
    parsed,
    storageAdapter: input.storageAdapter ?? createDefaultStorageAdapter(),
    repository: createPostgresSignupApplicationCertificateRepository(),
    buildStorageKey: buildSignupApplicationCertificateStorageKey,
    isStorageKey: isSignupApplicationCertificateStorageKey,
    cleanupInactiveObjects: cleanupInactiveCertificateObjects,
    deleteUploadedObjectQuietly,
    deleteCachedUrl: deleteCachedR2UrlsByKey,
    createError(code: keyof typeof SIGNUP_APPLICATION_CERTIFICATE_ERROR_CODES, status: number) {
      return new SignupApplicationApiError(SIGNUP_APPLICATION_CERTIFICATE_ERROR_CODES[code], status);
    },
  }) as Promise<SignupApplicationCertificateView>;
}

export async function deleteOwnedSignupApplicationCertificate(input: {
  session: SignupApplicantSessionPayload;
  fileId?: string | null;
  storageAdapter?: StorageAdapter;
}): Promise<SignupApplicationCertificateView | null> {
  const applicationId = assertSessionApplicationId(input.session);
  try {
    return await orchestrateSignupApplicationCertificateDelete({
      applicationId,
      owner: createSignupApplicantOwner(input.session),
      fileId: input.fileId,
      repository: createPostgresSignupApplicationCertificateRepository(),
      storageAdapter: input.storageAdapter ?? createDefaultStorageAdapter(),
      storageConfigured: Boolean(input.storageAdapter) || isR2WorkerUploadConfigured(),
      deleteUploadedObjectQuietly,
      deleteCachedUrl: deleteCachedR2UrlsByKey,
      isStorageKey: isSignupApplicationCertificateStorageKey,
      isStorageKeyConsistentWithMime: isSignupApplicationCertificateStorageKeyConsistentWithMime,
      logCleanupPending(payload: Record<string, unknown>) {
        console.error("[SIGNUP_CERTIFICATE_R2_CLEANUP_PENDING]", payload);
      },
      createError(code: keyof typeof SIGNUP_APPLICATION_CERTIFICATE_ERROR_CODES, status: number) {
        return new SignupApplicationApiError(SIGNUP_APPLICATION_CERTIFICATE_ERROR_CODES[code], status);
      },
    }) as SignupApplicationCertificateView | null;
  } catch (error) {
    if (error instanceof SignupApplicationApiError) throw error;
    throw new SignupApplicationApiError(SIGNUP_APPLICATION_CERTIFICATE_ERROR_CODES.deleteFailed, 500);
  }
}

export { summarizeCertificate as summarizeSignupApplicationCertificate };
