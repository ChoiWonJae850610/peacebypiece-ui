export type SignupApplicationApiErrorCode =
  | "SIGNUP_APPLICANT_SESSION_REQUIRED"
  | "SIGNUP_APPLICATION_ID_REQUIRED"
  | "SIGNUP_APPLICATION_NOT_FOUND"
  | "SIGNUP_APPLICATION_CONFLICT"
  | "SIGNUP_DUPLICATE_EMAIL"
  | "SIGNUP_DUPLICATE_GOOGLE_SUB"
  | "SIGNUP_DUPLICATE_BUSINESS_REGISTRATION"
  | "SIGNUP_DUPLICATE_PROVISIONED_RESOURCE"
  | "SIGNUP_CONSENT_REQUIRED"
  | "SIGNUP_PAYLOAD_INVALID";

export class SignupApplicationApiError extends Error {
  constructor(
    readonly code: SignupApplicationApiErrorCode,
    readonly status: number,
  ) {
    super(code);
    this.name = "SignupApplicationApiError";
  }
}
