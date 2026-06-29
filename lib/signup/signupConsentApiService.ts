import "server-only";

import type { SignupApplicantSessionPayload } from "./signupApplicantSession";
import { createSignupApplicantOwner } from "./currentSignupApplicantSession";
import { SignupApplicationApiError } from "./signupApplicationApiError";
import {
  SIGNUP_CONSENT_POLICIES,
  SIGNUP_REQUIRED_CONSENT_POLICIES,
  isSignupConsentType,
  type SignupConsentType,
} from "./signupConsentPolicy";
import {
  SignupConsentConflictError,
  createPostgresSignupConsentRepository,
  type SignupApplicationConsentRecord,
} from "./signupConsentRepository";

export function summarizeSignupConsent(consent: SignupApplicationConsentRecord) {
  return {
    id: consent.id,
    applicationId: consent.applicationId,
    consentType: consent.consentType,
    policyCode: consent.policyCode,
    policyVersion: consent.policyVersion,
    agreedAt: consent.agreedAt,
    revokedAt: consent.revokedAt,
  };
}

export function summarizeSignupConsentPolicies() {
  return SIGNUP_REQUIRED_CONSENT_POLICIES.map((policy) => ({
    consentType: policy.consentType,
    policyCode: policy.policyCode,
    policyVersion: policy.policyVersion,
    label: policy.label,
    required: true,
  }));
}

export function parseSignupConsentType(payload: unknown): SignupConsentType {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new SignupApplicationApiError("SIGNUP_PAYLOAD_INVALID", 400);
  }
  const consentType = (payload as Record<string, unknown>).consentType;
  if (!isSignupConsentType(consentType)) {
    throw new SignupApplicationApiError("SIGNUP_PAYLOAD_INVALID", 400);
  }
  return consentType;
}

function requireApplicationId(session: SignupApplicantSessionPayload): string {
  if (!session.applicationId) {
    throw new SignupApplicationApiError("SIGNUP_APPLICATION_ID_REQUIRED", 400);
  }
  return session.applicationId;
}

function mapConsentError(error: unknown): never {
  if (error instanceof SignupConsentConflictError) {
    throw new SignupApplicationApiError(error.code === "SIGNUP_CONSENT_REQUIRED" ? "SIGNUP_CONSENT_REQUIRED" : "SIGNUP_APPLICATION_CONFLICT", 409);
  }
  throw error;
}

export async function listOwnedSignupConsents(
  session: SignupApplicantSessionPayload,
): Promise<SignupApplicationConsentRecord[]> {
  const applicationId = requireApplicationId(session);
  return createPostgresSignupConsentRepository().listActiveConsents({
    applicationId,
    owner: createSignupApplicantOwner(session),
  });
}

export async function createOwnedSignupConsent(input: {
  session: SignupApplicantSessionPayload;
  consentType: SignupConsentType;
}): Promise<SignupApplicationConsentRecord> {
  const applicationId = requireApplicationId(input.session);
  try {
    return await createPostgresSignupConsentRepository().createCurrentConsent({
      applicationId,
      owner: createSignupApplicantOwner(input.session),
      policy: SIGNUP_CONSENT_POLICIES[input.consentType],
      now: new Date(),
    });
  } catch (error) {
    return mapConsentError(error);
  }
}

export async function revokeOwnedSignupConsent(input: {
  session: SignupApplicantSessionPayload;
  consentType: SignupConsentType;
}): Promise<SignupApplicationConsentRecord | null> {
  const applicationId = requireApplicationId(input.session);
  try {
    return await createPostgresSignupConsentRepository().revokeActiveConsent({
      applicationId,
      owner: createSignupApplicantOwner(input.session),
      consentType: input.consentType,
      now: new Date(),
      reasonCode: "applicant_unchecked",
    });
  } catch (error) {
    return mapConsentError(error);
  }
}

export async function assertOwnedSignupRequiredConsents(
  session: SignupApplicantSessionPayload,
): Promise<never | void> {
  const applicationId = requireApplicationId(session);
  try {
    await createPostgresSignupConsentRepository().assertRequiredActiveConsents({
      applicationId,
      owner: createSignupApplicantOwner(session),
      policies: SIGNUP_REQUIRED_CONSENT_POLICIES,
    });
  } catch (error) {
    return mapConsentError(error);
  }
}
