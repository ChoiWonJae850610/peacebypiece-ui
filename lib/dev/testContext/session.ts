import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import type { WaflSessionRole } from "@/lib/auth/session";

export const WAFL_DEV_TEST_CONTEXT_COOKIE = "wafl_dev_test_context";

export type DevTestContextOverlayRole = WaflSessionRole;

export type DevTestContextOverlayPayload = {
  originalUserId: string;
  targetKey: string;
  targetUserId: string;
  targetCompanyId: string | null;
  targetCompanyMemberId: string | null;
  targetRole: DevTestContextOverlayRole;
  issuedAt: string;
};

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function isDevTestContextOverlayRole(value: unknown): value is DevTestContextOverlayRole {
  return value === "company_admin" || value === "member" || value === "system_admin";
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
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;

  try {
    const parsed = JSON.parse(fromBase64Url(encodedPayload)) as Partial<DevTestContextOverlayPayload>;
    if (!parsed.originalUserId || !parsed.targetKey || !parsed.targetUserId || !parsed.issuedAt) return null;
    if (!isDevTestContextOverlayRole(parsed.targetRole)) return null;
    const companyId = typeof parsed.targetCompanyId === "string" ? parsed.targetCompanyId : null;
    const companyMemberId = typeof parsed.targetCompanyMemberId === "string" ? parsed.targetCompanyMemberId : null;
    if (parsed.targetRole !== "system_admin" && (!companyId || !companyMemberId)) return null;

    return {
      originalUserId: parsed.originalUserId,
      targetKey: parsed.targetKey,
      targetUserId: parsed.targetUserId,
      targetCompanyId: companyId,
      targetCompanyMemberId: companyMemberId,
      targetRole: parsed.targetRole,
      issuedAt: parsed.issuedAt,
    };
  } catch {
    return null;
  }
}
