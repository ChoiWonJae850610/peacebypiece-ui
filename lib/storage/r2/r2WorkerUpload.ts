import {
  createWorkOrderImageDerivativeKeys,
  isSupportedWorkOrderAttachmentStorageKey,
  type WorkOrderImageDerivativeKeys,
} from "@/lib/storage/r2/r2Keys";
import { isSupportedCompanyOnboardingFileStorageKey } from "@/lib/admin/settings/companyOnboardingFilePolicy";
import { isSupportedCompanyFileStorageKey } from "@/lib/admin/settings/companyFilePolicy";
import { isSupportedSignupApplicationCertificateStorageKey } from "@/lib/signup/signupApplicationFilePolicy";
import { createR2WorkerSignature, createR2WorkerSignedUrl, normalizeWorkerBaseUrl } from "@/lib/storage/r2/r2WorkerSignature.mjs";
import { timingSafeEqual } from "crypto";

export type R2WorkerUploadConfig = {
  uploadUrl: string;
  secret: string;
};

export type CreateR2WorkerUploadUrlInput = {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
};

export type CreateR2WorkerFileUrlInput = {
  key: string;
  expiresInSeconds?: number;
};

export type CreateR2WorkerDeleteUrlInput = {
  key: string;
  expiresInSeconds?: number;
};

export type R2WorkerUploadUrlResult = {
  url: string;
  method: "PUT";
  headers: Record<string, string>;
  expiresInSeconds: number;
};

export type R2WorkerUploadProxyUrlResult = R2WorkerUploadUrlResult;

export type R2WorkerFileUrlResult = {
  url: string;
  method: "GET";
  expiresInSeconds: number;
};

export type R2WorkerObject = {
  readonly contentType: string;
  readonly body: Buffer;
};

export type R2WorkerDeleteUrlResult = {
  url: string;
  method: "DELETE";
  expiresInSeconds: number;
};

export class R2WorkerRequestError extends Error {
  code: string;
  status: number;
  retryable: boolean;

  constructor(input: { code: string; status: number; retryable: boolean }) {
    super(input.code);
    this.name = "R2WorkerRequestError";
    this.code = input.code;
    this.status = input.status;
    this.retryable = input.retryable;
  }
}

const DEFAULT_WORKER_UPLOAD_EXPIRES_SECONDS = 10 * 60;
const DEFAULT_WORKER_FILE_EXPIRES_SECONDS = 5 * 60;
const DEFAULT_WORKER_DELETE_EXPIRES_SECONDS = 5 * 60;
const DEFAULT_WORKER_DERIVATIVE_EXPIRES_SECONDS = 5 * 60;

function readEnv(name: string): string | null {
  const value = process.env[name];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function assertSafeWorkerStorageKey(key: string): string {
  const value = key.trim().replace(/^\/+/, "");
  const isSupportedWorkOrderKey = isSupportedWorkOrderAttachmentStorageKey(value);
  const isSupportedCompanyOnboardingKey = isSupportedCompanyOnboardingFileStorageKey(value) && value.startsWith("companies/");
  const isSupportedCompanyFileKey = isSupportedCompanyFileStorageKey(value) && value.startsWith("companies/");
  const isSupportedSignupCertificateKey = isSupportedSignupApplicationCertificateStorageKey(value);

  if ((!isSupportedWorkOrderKey && !isSupportedCompanyOnboardingKey && !isSupportedCompanyFileKey && !isSupportedSignupCertificateKey) || value.includes("..")) {
    throw new Error("R2_WORKER_INVALID_STORAGE_KEY");
  }
  return value;
}

async function readWorkerError(response: Response): Promise<{ body: string; code: string; status: number; retryable: boolean }> {
  const body = await response.text().catch(() => "");
  let workerCode = "";
  try {
    const parsed = JSON.parse(body) as { error?: unknown };
    if (typeof parsed.error === "string") {
      workerCode = parsed.error
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 120);
    }
  } catch {
    // Non-JSON Worker failures keep the bounded status-derived code below.
  }
  return {
    body,
    code: workerCode || `R2_WORKER_REQUEST_FAILED_${response.status}`,
    status: response.status,
    retryable: response.status === 408 || response.status === 429 || response.status >= 500,
  };
}

function isR2WorkerObjectNotFound(status: number, body: string): boolean {
  return status === 404 || /(?:WORKER_FILE_NOT_FOUND|OBJECT_NOT_FOUND|NOT_FOUND|NO_SUCH_KEY)/i.test(body);
}

function isR2WorkerMethodNotAllowed(status: number, body: string): boolean {
  return status === 405 || /METHOD_NOT_ALLOWED/i.test(body);
}

function createR2WorkerRequestError(input: { status: number; retryable: boolean }): R2WorkerRequestError {
  return new R2WorkerRequestError({
    code: `R2_WORKER_DELETE_FAILED_${input.status}`,
    status: input.status,
    retryable: input.retryable,
  });
}

export function getR2WorkerUploadConfig(): R2WorkerUploadConfig | null {
  const uploadUrl = readEnv("R2_WORKER_UPLOAD_URL");
  const secret = readEnv("R2_WORKER_UPLOAD_SECRET");
  if (!uploadUrl || !secret) return null;
  return { uploadUrl: normalizeWorkerBaseUrl(uploadUrl), secret };
}

export function isR2WorkerUploadConfigured(): boolean {
  return getR2WorkerUploadConfig() !== null;
}

export function createR2WorkerUploadSignature(input: {
  secret: string;
  key: string;
  contentType: string;
  expiresAt: number;
}): string {
  return createR2WorkerSignature({
    secret: input.secret,
    method: "PUT",
    key: input.key,
    contentType: input.contentType,
    expiresAt: input.expiresAt,
  });
}

export function createR2WorkerFileSignature(input: {
  secret: string;
  key: string;
  expiresAt: number;
}): string {
  return createR2WorkerSignature({
    secret: input.secret,
    method: "GET",
    key: input.key,
    expiresAt: input.expiresAt,
  });
}

export function createR2WorkerDeleteSignature(input: {
  secret: string;
  key: string;
  expiresAt: number;
}): string {
  return createR2WorkerSignature({
    secret: input.secret,
    method: "DELETE",
    key: input.key,
    expiresAt: input.expiresAt,
  });
}

export function createR2WorkerUploadUrl(input: CreateR2WorkerUploadUrlInput): R2WorkerUploadUrlResult {
  const config = getR2WorkerUploadConfig();
  if (!config) throw new Error("R2_WORKER_UPLOAD_NOT_CONFIGURED");

  const key = assertSafeWorkerStorageKey(input.key);
  const contentType = input.contentType || "application/octet-stream";
  const expiresInSeconds = input.expiresInSeconds ?? DEFAULT_WORKER_UPLOAD_EXPIRES_SECONDS;
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const url = createR2WorkerSignedUrl({
    uploadUrl: config.uploadUrl,
    secret: config.secret,
    method: "PUT",
    key,
    contentType,
    expiresAt,
  });

  return { url, method: "PUT", headers: { "Content-Type": contentType }, expiresInSeconds };
}

export function createR2WorkerUploadProxyUrl(
  input: CreateR2WorkerUploadUrlInput,
): R2WorkerUploadProxyUrlResult {
  const config = getR2WorkerUploadConfig();
  if (!config) throw new Error("R2_WORKER_UPLOAD_NOT_CONFIGURED");
  const key = assertSafeWorkerStorageKey(input.key);
  const contentType = input.contentType || "application/octet-stream";
  const expiresInSeconds = input.expiresInSeconds ?? DEFAULT_WORKER_UPLOAD_EXPIRES_SECONDS;
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const signature = createR2WorkerUploadSignature({
    secret: config.secret,
    key,
    contentType,
    expiresAt,
  });
  const query = new URLSearchParams({
    key,
    contentType,
    expires: String(expiresAt),
    signature,
  });
  return {
    url: `/api/v2/work-orders/files/upload?${query.toString()}`,
    method: "PUT",
    headers: { "Content-Type": contentType },
    expiresInSeconds,
  };
}

export function verifyR2WorkerUploadProxyCapability(input: {
  key: string;
  contentType: string;
  expiresAt: number;
  signature: string;
}): { key: string; contentType: string } | null {
  const config = getR2WorkerUploadConfig();
  if (!config || !Number.isSafeInteger(input.expiresAt) || input.expiresAt < Math.floor(Date.now() / 1000)) return null;
  let key: string;
  try {
    key = assertSafeWorkerStorageKey(input.key);
  } catch {
    return null;
  }
  const contentType = input.contentType || "application/octet-stream";
  const expected = createR2WorkerUploadSignature({
    secret: config.secret,
    key,
    contentType,
    expiresAt: input.expiresAt,
  });
  const actualBytes = Buffer.from(input.signature);
  const expectedBytes = Buffer.from(expected);
  if (actualBytes.length !== expectedBytes.length || !timingSafeEqual(actualBytes, expectedBytes)) return null;
  return { key, contentType };
}

export function createR2WorkerFileUrl(input: CreateR2WorkerFileUrlInput): R2WorkerFileUrlResult {
  const config = getR2WorkerUploadConfig();
  if (!config) throw new Error("R2_WORKER_UPLOAD_NOT_CONFIGURED");

  const key = assertSafeWorkerStorageKey(input.key);
  const expiresInSeconds = input.expiresInSeconds ?? DEFAULT_WORKER_FILE_EXPIRES_SECONDS;
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const url = createR2WorkerSignedUrl({
    uploadUrl: config.uploadUrl,
    secret: config.secret,
    method: "GET",
    key,
    expiresAt,
  });

  return { url, method: "GET", expiresInSeconds };
}

export async function readR2ObjectViaWorker(input: CreateR2WorkerFileUrlInput): Promise<R2WorkerObject> {
  const request = createR2WorkerFileUrl(input);
  const response = await fetch(request.url, { method: request.method });
  if (!response.ok) {
    const workerError = await readWorkerError(response);
    throw new R2WorkerRequestError(workerError);
  }
  return {
    contentType: response.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase() ?? "",
    body: Buffer.from(await response.arrayBuffer()),
  };
}

export function createR2WorkerDeleteUrl(input: CreateR2WorkerDeleteUrlInput): R2WorkerDeleteUrlResult {
  const config = getR2WorkerUploadConfig();
  if (!config) throw new Error("R2_WORKER_UPLOAD_NOT_CONFIGURED");

  const key = assertSafeWorkerStorageKey(input.key);
  const expiresInSeconds = input.expiresInSeconds ?? DEFAULT_WORKER_DELETE_EXPIRES_SECONDS;
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const url = createR2WorkerSignedUrl({
    uploadUrl: config.uploadUrl,
    secret: config.secret,
    method: "DELETE",
    key,
    expiresAt,
  });

  return { url, method: "DELETE", expiresInSeconds };
}

export async function deleteR2ObjectViaWorker(input: CreateR2WorkerDeleteUrlInput): Promise<void> {
  const request = createR2WorkerDeleteUrl(input);
  const deleteResponse = await fetch(request.url, { method: request.method });
  if (deleteResponse.ok) return;

  const deleteError = await readWorkerError(deleteResponse);
  if (isR2WorkerObjectNotFound(deleteResponse.status, deleteError.body)) return;

  const shouldTryPostFallback = isR2WorkerMethodNotAllowed(deleteResponse.status, deleteError.body);
  if (!shouldTryPostFallback) {
    throw createR2WorkerRequestError(deleteError);
  }

  const fallbackUrl = new URL(request.url);
  fallbackUrl.searchParams.set("action", "delete");
  const fallbackResponse = await fetch(fallbackUrl.toString(), { method: "POST" });
  if (!fallbackResponse.ok) {
    const fallbackError = await readWorkerError(fallbackResponse);
    if (isR2WorkerObjectNotFound(fallbackResponse.status, fallbackError.body)) return;
    throw createR2WorkerRequestError(fallbackError);
  }
}

export async function createWorkOrderImageDerivativesViaWorker(input: {
  key: string;
  expiresInSeconds?: number;
}): Promise<WorkOrderImageDerivativeKeys> {
  const config = getR2WorkerUploadConfig();
  if (!config) throw new Error("R2_WORKER_UPLOAD_NOT_CONFIGURED");
  const key = assertSafeWorkerStorageKey(input.key);
  const expectedKeys = createWorkOrderImageDerivativeKeys(key);
  const expiresInSeconds = input.expiresInSeconds ?? DEFAULT_WORKER_DERIVATIVE_EXPIRES_SECONDS;
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const signed = createR2WorkerSignedUrl({
    uploadUrl: config.uploadUrl,
    secret: config.secret,
    method: "POST",
    key,
    expiresAt,
  });
  const url = new URL(signed);
  url.searchParams.set("action", "derive");
  const response = await fetch(url, { method: "POST" });
  if (!response.ok) {
    const workerError = await readWorkerError(response);
    throw new R2WorkerRequestError(workerError);
  }
  const body = await response.json().catch(() => null) as {
    readonly ok?: boolean;
    readonly keys?: Partial<WorkOrderImageDerivativeKeys>;
  } | null;
  if (
    body?.ok !== true
    || body.keys?.thumbnail !== expectedKeys.thumbnail
    || body.keys?.medium !== expectedKeys.medium
    || body.keys?.large !== expectedKeys.large
  ) {
    throw new R2WorkerRequestError({
      code: "R2_WORKER_DERIVATIVE_RESPONSE_INVALID",
      status: 502,
      retryable: false,
    });
  }
  return expectedKeys;
}

export async function deleteWorkOrderImageFamilyViaWorker(input: {
  storageObjectKey: string;
}): Promise<void> {
  const original = assertSafeWorkerStorageKey(input.storageObjectKey);
  const derivatives = createWorkOrderImageDerivativeKeys(original);
  for (const key of [derivatives.thumbnail, derivatives.medium, derivatives.large, original]) {
    await deleteR2ObjectViaWorker({ key });
  }
}
