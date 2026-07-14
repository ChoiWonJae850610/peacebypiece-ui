import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { getWaflSessionSigningSecret } from "@/lib/auth/session";
import {
  DOCUMENT_ACCESS_UUID_PATTERN,
  DOCUMENT_VIEWER_SESSION_MAX_AGE_SECONDS,
} from "./constants";

const VIEWER_SESSION_NAMESPACE = "wafl-document-viewer-session:v1";

export type DocumentViewerSession = {
  readonly version: 1;
  readonly tokenId: string;
  readonly generatedDocumentId: string;
  readonly expiresAt: string;
  readonly nonce: string;
};

function sign(encoded: string): string {
  return createHmac("sha256", getWaflSessionSigningSecret())
    .update(VIEWER_SESSION_NAMESPACE, "utf8")
    .update("\0", "utf8")
    .update(encoded, "utf8")
    .digest("base64url");
}

export function createDocumentViewerSession(input: {
  readonly tokenId: string;
  readonly generatedDocumentId: string;
  readonly tokenExpiresAt: string;
  readonly now?: Date;
}): { readonly value: string; readonly maxAgeSeconds: number; readonly expiresAt: string } {
  if (!DOCUMENT_ACCESS_UUID_PATTERN.test(input.tokenId)
      || !DOCUMENT_ACCESS_UUID_PATTERN.test(input.generatedDocumentId)) {
    throw new Error("DOCUMENT_VIEWER_SESSION_ID_INVALID");
  }
  const now = input.now ?? new Date();
  const tokenExpires = Date.parse(input.tokenExpiresAt);
  if (!Number.isFinite(tokenExpires) || tokenExpires <= now.getTime()) throw new Error("DOCUMENT_VIEWER_SESSION_EXPIRED");
  const maxAgeSeconds = Math.max(1, Math.min(
    DOCUMENT_VIEWER_SESSION_MAX_AGE_SECONDS,
    Math.floor((tokenExpires - now.getTime()) / 1000),
  ));
  const expiresAt = new Date(now.getTime() + maxAgeSeconds * 1000).toISOString();
  const payload: DocumentViewerSession = {
    version: 1,
    tokenId: input.tokenId,
    generatedDocumentId: input.generatedDocumentId,
    expiresAt,
    nonce: createHmac("sha256", getWaflSessionSigningSecret())
      .update(`${VIEWER_SESSION_NAMESPACE}\0${input.tokenId}\0${expiresAt}`)
      .digest("base64url")
      .slice(0, 16),
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return { value: `${encoded}.${sign(encoded)}`, maxAgeSeconds, expiresAt };
}

export function verifyDocumentViewerSession(value: string | null | undefined): DocumentViewerSession | null {
  const [encoded, receivedSignature, extra] = value?.trim().split(".") ?? [];
  if (!encoded || !receivedSignature || extra) return null;
  const expectedSignature = sign(encoded);
  const received = Buffer.from(receivedSignature, "utf8");
  const expected = Buffer.from(expectedSignature, "utf8");
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Partial<DocumentViewerSession>;
    if (parsed.version !== 1
        || !parsed.tokenId
        || !parsed.generatedDocumentId
        || !parsed.expiresAt
        || !parsed.nonce
        || !DOCUMENT_ACCESS_UUID_PATTERN.test(parsed.tokenId)
        || !DOCUMENT_ACCESS_UUID_PATTERN.test(parsed.generatedDocumentId)
        || Date.parse(parsed.expiresAt) <= Date.now()) return null;
    return parsed as DocumentViewerSession;
  } catch {
    return null;
  }
}
