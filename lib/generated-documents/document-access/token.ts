import "server-only";

import { createHash, createHmac } from "node:crypto";

import { getWaflSessionSigningSecret } from "@/lib/auth/session";
import {
  DOCUMENT_ACCESS_HASH_PATTERN,
  DOCUMENT_ACCESS_RAW_TOKEN_PATTERN,
} from "./constants";

const TOKEN_NAMESPACE = "document-share-token:v1";
const IDEMPOTENCY_NAMESPACE = "document-share-idempotency:v1";

function hmac(namespace: string, parts: readonly string[]): Buffer {
  const signer = createHmac("sha256", getWaflSessionSigningSecret());
  signer.update(namespace, "utf8");
  for (const part of parts) {
    signer.update("\0", "utf8");
    signer.update(part, "utf8");
  }
  return signer.digest();
}

export function deriveDocumentAccessToken(input: {
  readonly companyId: string;
  readonly generatedDocumentId: string;
  readonly commandCode: string;
  readonly idempotencyKey: string;
}): string {
  const token = hmac(TOKEN_NAMESPACE, [
    input.companyId,
    input.generatedDocumentId,
    input.commandCode,
    input.idempotencyKey,
  ]).toString("base64url");
  if (!DOCUMENT_ACCESS_RAW_TOKEN_PATTERN.test(token)) throw new Error("DOCUMENT_ACCESS_TOKEN_DERIVATION_FAILED");
  return token;
}

export function hashDocumentAccessToken(rawToken: string): string {
  if (!DOCUMENT_ACCESS_RAW_TOKEN_PATTERN.test(rawToken)) throw new Error("DOCUMENT_ACCESS_TOKEN_INVALID");
  const hash = createHash("sha256").update(rawToken, "utf8").digest("hex");
  if (!DOCUMENT_ACCESS_HASH_PATTERN.test(hash)) throw new Error("DOCUMENT_ACCESS_TOKEN_HASH_FAILED");
  return hash;
}

export function scopeDocumentAccessIdempotencyKey(input: {
  readonly companyId: string;
  readonly generatedDocumentId: string;
  readonly commandCode: string;
  readonly idempotencyKey: string;
}): string {
  return hmac(IDEMPOTENCY_NAMESPACE, [
    input.companyId,
    input.generatedDocumentId,
    input.commandCode,
    input.idempotencyKey,
  ]).toString("hex");
}

export function hashDocumentAccessRequest(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value), "utf8").digest("hex");
}

export function createDocumentViewerUrl(origin: string, rawToken: string): string {
  if (!DOCUMENT_ACCESS_RAW_TOKEN_PATTERN.test(rawToken)) throw new Error("DOCUMENT_ACCESS_TOKEN_INVALID");
  const url = new URL("/v", origin);
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("DOCUMENT_VIEWER_ORIGIN_INVALID");
  url.hash = `t=${rawToken}`;
  return url.toString();
}
