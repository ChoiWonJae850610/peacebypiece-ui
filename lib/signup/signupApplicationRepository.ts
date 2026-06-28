import type {
  SignupApplicationCompanyInput,
  SignupApplicationFileRecord,
  SignupApplicationIdentity,
  SignupApplicationProvisionedIds,
  SignupApplicationRecord,
  SignupApplicationStatus,
} from "./signupApplicationTypes";

export const SIGNUP_APPLICATION_DUPLICATE_CONSTRAINTS = {
  activeEmail: "signup_applications_active_email_idx",
  activeGoogleSub: "signup_applications_active_google_sub_idx",
  activeBusinessRegistration: "signup_applications_active_business_registration_idx",
  createdCompany: "signup_applications_created_company_idx",
  createdUser: "signup_applications_created_user_idx",
  createdCompanyMember: "signup_applications_created_member_idx",
  createdSubscription: "signup_applications_created_subscription_idx",
} as const;

export type SignupApplicationCreateInput = SignupApplicationIdentity &
  SignupApplicationCompanyInput;

export type SignupApplicationDuplicateConstraint =
  (typeof SIGNUP_APPLICATION_DUPLICATE_CONSTRAINTS)[keyof typeof SIGNUP_APPLICATION_DUPLICATE_CONSTRAINTS];

export type SignupApplicationDuplicateTarget =
  | "email"
  | "google_sub"
  | "business_registration"
  | "created_company"
  | "created_user"
  | "created_company_member"
  | "created_subscription";

export type SignupApplicationRepository = {
  createDraft(input: SignupApplicationCreateInput): Promise<SignupApplicationRecord>;
  findById(applicationId: string): Promise<SignupApplicationRecord | null>;
  findActiveByEmail(emailNormalized: string): Promise<SignupApplicationRecord | null>;
  findActiveByGoogleSub(googleSub: string): Promise<SignupApplicationRecord | null>;
  findActiveByBusinessRegistrationNormalized(
    businessRegistrationNumberNormalized: string,
  ): Promise<SignupApplicationRecord | null>;
  listReviewQueue(input: {
    status?: SignupApplicationStatus;
    limit: number;
    cursorCreatedAt?: string | null;
  }): Promise<SignupApplicationRecord[]>;
  findApplicationCertificate(input: {
    applicationId: string;
    fileId: string;
  }): Promise<SignupApplicationFileRecord | null>;
  transitionStatus(input: {
    applicationId: string;
    from: SignupApplicationStatus;
    to: SignupApplicationStatus;
    systemUserId?: string | null;
    reason?: string | null;
    now: Date;
    compareAndSet: true;
  }): Promise<SignupApplicationRecord>;
  markProvisioningStarted(input: {
    applicationId: string;
    systemUserId: string;
    now: Date;
    expectedStatus: "reviewing";
    compareAndSet: true;
  }): Promise<SignupApplicationRecord>;
  markProvisioningCompleted(input: {
    applicationId: string;
    provisionedIds: SignupApplicationProvisionedIds;
    now: Date;
    idempotencyKey: string;
  }): Promise<SignupApplicationRecord>;
  markProvisioningFailed(input: {
    applicationId: string;
    errorCode: string;
    now: Date;
    expectedProvisioningStatus: "in_progress";
    compareAndSet: true;
  }): Promise<SignupApplicationRecord>;
  retryFailedProvisioning(input: {
    applicationId: string;
    systemUserId: string;
    now: Date;
    expectedStatus: "provisioning_failed";
    compareAndSet: true;
  }): Promise<SignupApplicationRecord>;
  mapDuplicateConstraint(constraintName: string): SignupApplicationDuplicateTarget | null;
};

export function normalizeSignupEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function assertSignupApplicationCreateInput(input: SignupApplicationCreateInput): void {
  assertNonEmpty("googleSub", input.googleSub);
  assertNonEmpty("email", input.email);
  assertNonEmpty("applicantName", input.applicantName);
  assertNonEmpty("requestedCompanyName", input.requestedCompanyName);
  assertNonEmpty("businessName", input.businessName);

  if (input.email !== input.email.trim()) {
    throw new Error("Signup application raw email must be trimmed.");
  }
  if (input.emailNormalized !== normalizeSignupEmail(input.email)) {
    throw new Error("Signup application normalized email must equal lower(trim(email)).");
  }
  if (input.businessRegistrationNumberNormalized !== normalizeBusinessRegistrationNumber(input.businessRegistrationNumber)) {
    throw new Error("Signup application normalized business registration number mismatch.");
  }
}

export function normalizeBusinessRegistrationNumber(value: string): string {
  const normalized = value.replace(/\D/g, "");
  if (!/^\d{10}$/.test(normalized)) {
    throw new Error("Business registration number must normalize to exactly 10 digits.");
  }
  return normalized;
}

export function mapSignupApplicationDuplicateConstraint(
  constraintName: string,
): SignupApplicationDuplicateTarget | null {
  switch (constraintName) {
    case SIGNUP_APPLICATION_DUPLICATE_CONSTRAINTS.activeEmail:
      return "email";
    case SIGNUP_APPLICATION_DUPLICATE_CONSTRAINTS.activeGoogleSub:
      return "google_sub";
    case SIGNUP_APPLICATION_DUPLICATE_CONSTRAINTS.activeBusinessRegistration:
      return "business_registration";
    case SIGNUP_APPLICATION_DUPLICATE_CONSTRAINTS.createdCompany:
      return "created_company";
    case SIGNUP_APPLICATION_DUPLICATE_CONSTRAINTS.createdUser:
      return "created_user";
    case SIGNUP_APPLICATION_DUPLICATE_CONSTRAINTS.createdCompanyMember:
      return "created_company_member";
    case SIGNUP_APPLICATION_DUPLICATE_CONSTRAINTS.createdSubscription:
      return "created_subscription";
    default:
      return null;
  }
}

function assertNonEmpty(fieldName: string, value: string): void {
  if (value.trim().length === 0) {
    throw new Error(`Signup application ${fieldName} is required.`);
  }
}
