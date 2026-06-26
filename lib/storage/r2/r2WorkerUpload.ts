import { isSupportedWorkOrderAttachmentStorageKey } from "@/lib/storage/r2/r2Keys";
import { isSupportedCompanyOnboardingFileStorageKey } from "@/lib/admin/settings/companyOnboardingFilePolicy";
import { isSupportedCompanyFileStorageKey } from "@/lib/admin/settings/companyFilePolicy";
import { createR2WorkerSignature, createR2WorkerSignedUrl, normalizeWorkerBaseUrl } from "@/lib/storage/r2/r2WorkerSignature.mjs";

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

export type R2WorkerFileUrlResult = {
  url: string;
  method: "GET";
  expiresInSeconds: number;
};

export type R2WorkerDeleteUrlResult = {
  url: string;
  method: "DELETE";
  expiresInSeconds: number;
};

const DEFAULT_WORKER_UPLOAD_EXPIRES_SECONDS = 10 * 60;
const DEFAULT_WORKER_FILE_EXPIRES_SECONDS = 5 * 60;
const DEFAULT_WORKER_DELETE_EXPIRES_SECONDS = 5 * 60;

function readEnv(name: string): string | null {
  const value = process.env[name];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function assertSafeWorkerStorageKey(key: string): string {
  const value = key.trim().replace(/^\/+/, "");
  const isSupportedWorkOrderKey = isSupportedWorkOrderAttachmentStorageKey(value);
  const isSupportedCompanyOnboardingKey = isSupportedCompanyOnboardingFileStorageKey(value) && value.startsWith("companies/");
  const isSupportedCompanyFileKey = isSupportedCompanyFileStorageKey(value) && value.startsWith("companies/");

  if ((!isSupportedWorkOrderKey && !isSupportedCompanyOnboardingKey && !isSupportedCompanyFileKey) || value.includes("..")) {
    throw new Error("R2_WORKER_INVALID_STORAGE_KEY");
  }
  return value;
}

async function readWorkerError(response: Response): Promise<string> {
  const body = await response.text().catch(() => "");
  if (!body) return `R2_WORKER_REQUEST_FAILED_${response.status}`;

  try {
    const parsed = JSON.parse(body) as { error?: string; message?: string };
    return parsed.message || parsed.error || body;
  } catch {
    return body;
  }
}

function isR2WorkerObjectNotFound(status: number, message: string): boolean {
  return status === 404 || /(?:WORKER_FILE_NOT_FOUND|OBJECT_NOT_FOUND|NOT_FOUND|NO_SUCH_KEY)/i.test(message);
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
  if (isR2WorkerObjectNotFound(deleteResponse.status, deleteError)) return;

  const shouldTryPostFallback = deleteResponse.status === 405 || /METHOD_NOT_ALLOWED/i.test(deleteError);
  if (!shouldTryPostFallback) {
    throw new Error(deleteError || "R2_WORKER_DELETE_FAILED");
  }

  const fallbackUrl = new URL(request.url);
  fallbackUrl.searchParams.set("action", "delete");
  const fallbackResponse = await fetch(fallbackUrl.toString(), { method: "POST" });
  if (!fallbackResponse.ok) {
    const fallbackError = await readWorkerError(fallbackResponse);
    if (isR2WorkerObjectNotFound(fallbackResponse.status, fallbackError)) return;
    throw new Error(fallbackError || deleteError || "R2_WORKER_DELETE_FAILED");
  }
}
