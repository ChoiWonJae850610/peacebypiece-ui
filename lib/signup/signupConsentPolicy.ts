export const SIGNUP_REQUIRED_CONSENT_TYPES = [
  "terms_of_service",
  "privacy_policy",
] as const;

export type SignupConsentType = (typeof SIGNUP_REQUIRED_CONSENT_TYPES)[number];

export type SignupConsentPolicy = {
  consentType: SignupConsentType;
  policyCode: string;
  policyVersion: string;
  label: string;
  required: true;
};

export const SIGNUP_CONSENT_POLICIES: Record<SignupConsentType, SignupConsentPolicy> = {
  terms_of_service: {
    consentType: "terms_of_service",
    policyCode: "wafl_terms_of_service",
    policyVersion: "0.24.26",
    label: "WAFL 이용약관",
    required: true,
  },
  privacy_policy: {
    consentType: "privacy_policy",
    policyCode: "wafl_privacy_policy",
    policyVersion: "0.24.26",
    label: "개인정보 처리방침",
    required: true,
  },
};

export const SIGNUP_REQUIRED_CONSENT_POLICIES = SIGNUP_REQUIRED_CONSENT_TYPES.map(
  (consentType) => SIGNUP_CONSENT_POLICIES[consentType],
);

export function isSignupConsentType(value: unknown): value is SignupConsentType {
  return typeof value === "string" && SIGNUP_REQUIRED_CONSENT_TYPES.includes(value as SignupConsentType);
}
