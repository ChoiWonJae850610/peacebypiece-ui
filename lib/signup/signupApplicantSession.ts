import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

export const WAFL_SIGNUP_APPLICANT_SESSION_COOKIE = "wafl_signup_applicant_session";

export type SignupApplicantSessionPayload = {
  googleSub: string;
  email: string;
  emailNormalized: string;
  emailVerified: true;
  applicantName: string;
  googlePictureUrl: string | null;
  applicationId: string | null;
  onboardingState: "verified_identity" | "draft" | "submitted" | "changes_requested" | "reviewing" | "rejected" | "canceled" | "provisioning_failed";
  issuedAt: string;
  expiresAt: string;
};

export type SignupApplicantOnboardingState = SignupApplicantSessionPayload["onboardingState"];

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

function isSignupOnboardingState(value: unknown): value is SignupApplicantSessionPayload["onboardingState"] {
  return (
    value === "verified_identity"
    || value === "draft"
    || value === "submitted"
    || value === "changes_requested"
    || value === "reviewing"
    || value === "rejected"
    || value === "canceled"
    || value === "provisioning_failed"
  );
}

export function createSignupApplicantSessionPayload(input: {
  googleSub: string;
  email: string;
  emailNormalized: string;
  applicantName: string;
  googlePictureUrl?: string | null;
  applicationId?: string | null;
  onboardingState?: SignupApplicantSessionPayload["onboardingState"];
  now?: Date;
}): SignupApplicantSessionPayload {
  const now = input.now ?? new Date();
  const expiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 24);

  return {
    googleSub: input.googleSub.trim(),
    email: input.email.trim().toLowerCase(),
    emailNormalized: input.emailNormalized.trim().toLowerCase(),
    emailVerified: true,
    applicantName: input.applicantName.trim(),
    googlePictureUrl: input.googlePictureUrl?.trim() || null,
    applicationId: input.applicationId?.trim() || null,
    onboardingState: input.onboardingState ?? (input.applicationId ? "draft" : "verified_identity"),
    issuedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
}

export function createSignupApplicantSessionCookieValue(payload: SignupApplicantSessionPayload): string {
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifySignupApplicantSessionCookieValue(value: string | null | undefined): SignupApplicantSessionPayload | null {
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
    const parsed = JSON.parse(fromBase64Url(encodedPayload)) as Partial<SignupApplicantSessionPayload>;
    if (!parsed.googleSub || !parsed.email || !parsed.emailNormalized || !parsed.applicantName) return null;
    if (parsed.emailVerified !== true) return null;
    if (!parsed.issuedAt || !parsed.expiresAt || Date.parse(parsed.expiresAt) <= Date.now()) return null;
    if (!isSignupOnboardingState(parsed.onboardingState)) return null;

    return {
      googleSub: parsed.googleSub,
      email: parsed.email,
      emailNormalized: parsed.emailNormalized,
      emailVerified: true,
      applicantName: parsed.applicantName,
      googlePictureUrl: typeof parsed.googlePictureUrl === "string" ? parsed.googlePictureUrl : null,
      applicationId: typeof parsed.applicationId === "string" ? parsed.applicationId : null,
      onboardingState: parsed.onboardingState,
      issuedAt: parsed.issuedAt,
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return null;
  }
}
