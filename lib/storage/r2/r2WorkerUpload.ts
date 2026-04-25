import { createHmac } from "crypto";

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

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

function createSignature(input: { secret: string; purpose: "upload" | "file" | "delete"; key: string; contentType?: string; expiresAt: number }): string {
  const payload = input.purpose === "upload"
    ? ["PUT", input.key, input.contentType || "application/octet-stream", String(input.expiresAt)].join("\n")
    : input.purpose === "delete"
      ? ["DELETE", input.key, String(input.expiresAt)].join("\n")
      : ["GET", input.key, String(input.expiresAt)].join("\n");

  return createHmac("sha256", input.secret).update(payload).digest("hex");
}

export function getR2WorkerUploadConfig(): R2WorkerUploadConfig | null {
  const uploadUrl = readEnv("R2_WORKER_UPLOAD_URL");
  const secret = readEnv("R2_WORKER_UPLOAD_SECRET");
  if (!uploadUrl || !secret) return null;
  return { uploadUrl: normalizeBaseUrl(uploadUrl), secret };
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
  return createSignature({
    secret: input.secret,
    purpose: "upload",
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
  return createSignature({
    secret: input.secret,
    purpose: "file",
    key: input.key,
    expiresAt: input.expiresAt,
  });
}

export function createR2WorkerDeleteSignature(input: {
  secret: string;
  key: string;
  expiresAt: number;
}): string {
  return createSignature({
    secret: input.secret,
    purpose: "delete",
    key: input.key,
    expiresAt: input.expiresAt,
  });
}

export function createR2WorkerUploadUrl(input: CreateR2WorkerUploadUrlInput): R2WorkerUploadUrlResult {
  const config = getR2WorkerUploadConfig();
  if (!config) throw new Error("R2_WORKER_UPLOAD_NOT_CONFIGURED");

  const contentType = input.contentType || "application/octet-stream";
  const expiresInSeconds = input.expiresInSeconds ?? DEFAULT_WORKER_UPLOAD_EXPIRES_SECONDS;
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const signature = createR2WorkerUploadSignature({ secret: config.secret, key: input.key, contentType, expiresAt });

  const url = new URL(config.uploadUrl);
  url.searchParams.set("key", input.key);
  url.searchParams.set("contentType", contentType);
  url.searchParams.set("expires", String(expiresAt));
  url.searchParams.set("signature", signature);

  return { url: url.toString(), method: "PUT", headers: { "Content-Type": contentType }, expiresInSeconds };
}

export function createR2WorkerFileUrl(input: CreateR2WorkerFileUrlInput): R2WorkerFileUrlResult {
  const config = getR2WorkerUploadConfig();
  if (!config) throw new Error("R2_WORKER_UPLOAD_NOT_CONFIGURED");

  const expiresInSeconds = input.expiresInSeconds ?? DEFAULT_WORKER_FILE_EXPIRES_SECONDS;
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const signature = createR2WorkerFileSignature({ secret: config.secret, key: input.key, expiresAt });

  const url = new URL(config.uploadUrl);
  url.searchParams.set("key", input.key);
  url.searchParams.set("expires", String(expiresAt));
  url.searchParams.set("signature", signature);

  return { url: url.toString(), method: "GET", expiresInSeconds };
}

export function createR2WorkerDeleteUrl(input: CreateR2WorkerDeleteUrlInput): R2WorkerDeleteUrlResult {
  const config = getR2WorkerUploadConfig();
  if (!config) throw new Error("R2_WORKER_UPLOAD_NOT_CONFIGURED");

  const expiresInSeconds = input.expiresInSeconds ?? DEFAULT_WORKER_DELETE_EXPIRES_SECONDS;
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const signature = createR2WorkerDeleteSignature({ secret: config.secret, key: input.key, expiresAt });

  const url = new URL(config.uploadUrl);
  url.searchParams.set("key", input.key);
  url.searchParams.set("expires", String(expiresAt));
  url.searchParams.set("signature", signature);

  return { url: url.toString(), method: "DELETE", expiresInSeconds };
}

export async function deleteR2ObjectViaWorker(input: CreateR2WorkerDeleteUrlInput): Promise<void> {
  const request = createR2WorkerDeleteUrl(input);
  const response = await fetch(request.url, { method: request.method });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string; message?: string } | null;
    throw new Error(body?.message || body?.error || "R2_WORKER_DELETE_FAILED");
  }
}
