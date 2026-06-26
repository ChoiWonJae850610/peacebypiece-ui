export type R2WorkerSignatureMethod = "PUT" | "GET" | "DELETE" | string;

export function normalizeWorkerBaseUrl(value: string | null | undefined): string;

export function createR2WorkerSignature(input: {
  secret: string;
  method: R2WorkerSignatureMethod;
  key: string;
  contentType?: string;
  expiresAt: number;
}): string;

export function createR2WorkerSignedUrl(input: {
  uploadUrl: string;
  secret: string;
  method: R2WorkerSignatureMethod;
  key: string;
  contentType?: string;
  expiresAt: number;
}): string;
