import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

export const WAFL_DEV_TEST_CONTEXT_COOKIE = "wafl_dev_test_context";

export type DevTestContextOverlayPayload = {
  originalUserId: string;
  targetUserId: string;
  targetCompanyId: string;
  targetCompanyMemberId: string;
  targetRole: "company_admin" | "member";
  issuedAt: string;
};

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function readDevTestContextSecret(): string {
  const explicit = process.env.WAFL_SESSION_SECRET?.trim();
  if (explicit) return explicit;

  const googleSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  if (googleSecret) return googleSecret;

  throw new Error("WAFL_SESSION_SECRET_REQUIRED");
}

function sign(value: string): string {
  return createHmac("sha256", readDevTestContextSecret()).update(value).digest("base64url");
}

export function createDevTestContextCookieValue(payload: DevTestContextOverlayPayload): string {
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyDevTestContextCookieValue(value: string | null | undefined): DevTestContextOverlayPayload | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const [encodedPayload, receivedSignature] = trimmed.split(".");
  if (!encodedPayload || !receivedSignature) return null;

  const expectedSignature = sign(encodedPayload);
  const received = Buffer.from(receivedSignature);
  const expected = Buffer.from(expectedSignature);

  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return null;
  }

  try {
    const parsed = JSON.parse(fromBase64Url(encodedPayload)) as Partial<DevTestContextOverlayPayload>;
    if (!parsed.originalUserId || !parsed.targetUserId || !parsed.targetCompanyId || !parsed.targetCompanyMemberId || !parsed.targetRole || !parsed.issuedAt) {
      return null;
    }
    if (parsed.targetRole !== "company_admin" && parsed.targetRole !== "member") return null;

    return {
      originalUserId: parsed.originalUserId,
      targetUserId: parsed.targetUserId,
      targetCompanyId: parsed.targetCompanyId,
      targetCompanyMemberId: parsed.targetCompanyMemberId,
      targetRole: parsed.targetRole,
      issuedAt: parsed.issuedAt,
    };
  } catch {
    return null;
  }
}
