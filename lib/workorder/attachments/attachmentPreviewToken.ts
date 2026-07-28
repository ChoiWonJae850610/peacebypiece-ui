import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { getWaflSessionSigningSecret } from "@/lib/auth/session";

export const ATTACHMENT_PREVIEW_TOKEN_TTL_SECONDS = 120;

type AttachmentPreviewTokenPayload = {
  readonly companyId: string;
  readonly workOrderId: string;
  readonly attachmentId: string;
  readonly expiresAt: number;
};

export type AttachmentPreviewTokenVerification =
  | { readonly ok: true; readonly payload: AttachmentPreviewTokenPayload }
  | { readonly ok: false; readonly reason: "invalid" | "expired" };

function sign(encoded: string): string {
  return createHmac("sha256", getWaflSessionSigningSecret())
    .update(`work-order-attachment-preview:${encoded}`)
    .digest("base64url");
}

export function createAttachmentPreviewToken(
  input: Omit<AttachmentPreviewTokenPayload, "expiresAt"> & {
    readonly nowSeconds?: number;
    readonly ttlSeconds?: number;
  },
): { readonly token: string; readonly expiresAt: number } {
  const nowSeconds = Math.floor(input.nowSeconds ?? Date.now() / 1000);
  const ttlSeconds = Math.min(
    Math.max(Math.floor(input.ttlSeconds ?? ATTACHMENT_PREVIEW_TOKEN_TTL_SECONDS), 1),
    ATTACHMENT_PREVIEW_TOKEN_TTL_SECONDS,
  );
  const payload: AttachmentPreviewTokenPayload = {
    companyId: input.companyId,
    workOrderId: input.workOrderId,
    attachmentId: input.attachmentId,
    expiresAt: nowSeconds + ttlSeconds,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return { token: `${encoded}.${sign(encoded)}`, expiresAt: payload.expiresAt };
}

export function verifyAttachmentPreviewToken(
  token: string | null | undefined,
  nowSeconds = Math.floor(Date.now() / 1000),
): AttachmentPreviewTokenVerification {
  const [encoded, receivedSignature, extra] = token?.trim().split(".") ?? [];
  if (!encoded || !receivedSignature || extra) return { ok: false, reason: "invalid" };
  const expectedSignature = sign(encoded);
  const received = Buffer.from(receivedSignature);
  const expected = Buffer.from(expectedSignature);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return { ok: false, reason: "invalid" };
  }
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Partial<AttachmentPreviewTokenPayload>;
    const expiresAt = payload.expiresAt;
    if (
      typeof payload.companyId !== "string"
      || typeof payload.workOrderId !== "string"
      || typeof payload.attachmentId !== "string"
      || typeof expiresAt !== "number"
      || !Number.isSafeInteger(expiresAt)
    ) return { ok: false, reason: "invalid" };
    if (expiresAt <= nowSeconds) return { ok: false, reason: "expired" };
    if (expiresAt > nowSeconds + ATTACHMENT_PREVIEW_TOKEN_TTL_SECONDS) {
      return { ok: false, reason: "invalid" };
    }
    return {
      ok: true,
      payload: {
        companyId: payload.companyId,
        workOrderId: payload.workOrderId,
        attachmentId: payload.attachmentId,
        expiresAt,
      },
    };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}
