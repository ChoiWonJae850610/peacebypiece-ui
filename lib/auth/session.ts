import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

export const WAFL_AUTH_SESSION_COOKIE = "wafl_auth_session";

export type WaflSessionRole = "company_admin" | "member" | "system_admin";

export type WaflSessionPayload = {
  userId: string;
  companyId: string | null;
  companyMemberId: string | null;
  role: WaflSessionRole;
  email: string;
  name: string;
  issuedAt: string;
};

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function readSessionSecret(): string {
  const explicit = process.env.WAFL_SESSION_SECRET?.trim();
  if (explicit) return explicit;

  const googleSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  if (googleSecret) return googleSecret;

  throw new Error("WAFL_SESSION_SECRET_REQUIRED");
}

function sign(value: string): string {
  return createHmac("sha256", readSessionSecret()).update(value).digest("base64url");
}

export function createWaflSessionCookieValue(payload: WaflSessionPayload): string {
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyWaflSessionCookieValue(value: string | null | undefined): WaflSessionPayload | null {
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
    const parsed = JSON.parse(fromBase64Url(encodedPayload)) as Partial<WaflSessionPayload>;
    if (!parsed.userId || !parsed.email || !parsed.name || !parsed.role || !parsed.issuedAt) return null;
    if (parsed.role !== "company_admin" && parsed.role !== "member" && parsed.role !== "system_admin") return null;

    return {
      userId: parsed.userId,
      companyId: parsed.companyId ?? null,
      companyMemberId: parsed.companyMemberId ?? null,
      role: parsed.role,
      email: parsed.email,
      name: parsed.name,
      issuedAt: parsed.issuedAt,
    };
  } catch {
    return null;
  }
}
