export const SIGNUP_APPLICATION_STATUSES = [
  "draft",
  "submitted",
  "reviewing",
  "changes_requested",
  "approved",
  "rejected",
  "canceled",
  "provisioning_failed",
] as const;

export type SignupApplicationStatus = (typeof SIGNUP_APPLICATION_STATUSES)[number];

export const SIGNUP_APPLICATION_FINAL_STATUSES = ["approved", "rejected", "canceled"] as const;

export const SIGNUP_APPLICATION_ACTIVE_STATUSES = [
  "submitted",
  "reviewing",
  "changes_requested",
  "approved",
  "provisioning_failed",
] as const satisfies readonly SignupApplicationStatus[];

export const SIGNUP_APPLICATION_PLAN_CODES = ["lite", "flow", "studio", "custom"] as const;

export type SignupApplicationPlanCode = (typeof SIGNUP_APPLICATION_PLAN_CODES)[number];

export const SIGNUP_BUSINESS_VALIDATION_STATUSES = [
  "not_checked",
  "valid",
  "invalid",
  "api_failed",
  "manual_review",
] as const;

export type SignupBusinessValidationStatus =
  (typeof SIGNUP_BUSINESS_VALIDATION_STATUSES)[number];

export const SIGNUP_PROVISIONING_STATUSES = [
  "not_started",
  "in_progress",
  "completed",
  "failed",
] as const;

export type SignupProvisioningStatus = (typeof SIGNUP_PROVISIONING_STATUSES)[number];

export type SignupApplicationIdentity = {
  googleSub: string;
  email: string;
  emailNormalized: string;
  emailVerified: true;
  applicantName: string;
  googlePictureUrl?: string | null;
};

export type SignupApplicationCompanyInput = {
  requestedCompanyName: string;
  businessName: string;
  businessRegistrationNumber: string;
  businessRegistrationNumberNormalized: string;
  requestedPlanCode: SignupApplicationPlanCode;
};

export type SignupApplicationRecord = SignupApplicationIdentity &
  SignupApplicationCompanyInput & {
    id: string;
    status: SignupApplicationStatus;
    businessValidationStatus: SignupBusinessValidationStatus;
    businessValidationSummary: Record<string, unknown>;
    businessValidationCheckedAt: string | null;
    correctionRequestedAt: string | null;
    correctionDueAt: string | null;
    correctionReason: string | null;
    correctionCount: number;
    reviewedBySystemUserId: string | null;
    reviewedAt: string | null;
    rejectionReason: string | null;
    provisioningStatus: SignupProvisioningStatus;
    provisioningStartedAt: string | null;
    provisioningCompletedAt: string | null;
    provisioningErrorCode: string | null;
    provisioningAttemptCount: number;
    createdCompanyId: string | null;
    createdUserId: string | null;
    createdCompanyMemberId: string | null;
    createdSubscriptionId: string | null;
    submittedAt: string | null;
    approvedAt: string | null;
    rejectedAt: string | null;
    canceledAt: string | null;
    createdAt: string;
    updatedAt: string;
  };

export type SignupApplicationProvisionedIds = {
  companyId: string;
  userId: string;
  companyMemberId: string;
  subscriptionId: string;
};

export type SignupApplicationFileRecord = {
  id: string;
  applicationId: string;
  fileType: "business_registration";
  originalName: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  reviewedBySystemUserId: string | null;
  reviewedAt: string | null;
  approvedCompanyFileId: string | null;
  deletedAt: string | null;
};
