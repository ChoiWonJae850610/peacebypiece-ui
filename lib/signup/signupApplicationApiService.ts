import "server-only";

import type { SignupApplicantSessionPayload } from "./signupApplicantSession";
import { createSignupApplicantOwner } from "./currentSignupApplicantSession";
import {
  createPostgresSignupApplicationRepository,
  normalizeBusinessRegistrationNumber,
  normalizeSignupEmail,
  SignupApplicationConflictError,
  SignupApplicationDuplicateError,
  type SignupApplicationCreateInput,
} from "./signupApplicationRepository";
import type {
  SignupApplicationCompanyInput,
  SignupApplicationPlanCode,
  SignupApplicationRecord,
} from "./signupApplicationTypes";
import { assertOwnedSignupRequiredConsents } from "./signupConsentApiService";
import { SignupApplicationApiError } from "./signupApplicationApiError";

function readString(payload: Record<string, unknown>, key: string): string {
  const value = payload[key];
  return typeof value === "string" ? value.trim() : "";
}

function readPlanCode(payload: Record<string, unknown>): SignupApplicationPlanCode {
  const value = readString(payload, "requestedPlanCode");
  if (value === "lite" || value === "flow" || value === "studio" || value === "custom") return value;
  throw new SignupApplicationApiError("SIGNUP_PAYLOAD_INVALID", 400);
}

function assertRequiredCompanyInput(company: SignupApplicationCompanyInput): void {
  if (
    !company.requestedCompanyName
    || !company.businessName
    || !company.businessRegistrationNumber
    || !company.businessRegistrationNumberNormalized
  ) {
    throw new SignupApplicationApiError("SIGNUP_PAYLOAD_INVALID", 400);
  }
}

export function parseSignupApplicationCompanyInput(payload: unknown): SignupApplicationCompanyInput {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new SignupApplicationApiError("SIGNUP_PAYLOAD_INVALID", 400);
  }
  const record = payload as Record<string, unknown>;
  const businessRegistrationNumber = readString(record, "businessRegistrationNumber");
  let businessRegistrationNumberNormalized: string;
  try {
    businessRegistrationNumberNormalized = normalizeBusinessRegistrationNumber(businessRegistrationNumber);
  } catch {
    throw new SignupApplicationApiError("SIGNUP_PAYLOAD_INVALID", 400);
  }

  const company = {
    requestedCompanyName: readString(record, "requestedCompanyName"),
    businessName: readString(record, "businessName"),
    businessRegistrationNumber,
    businessRegistrationNumberNormalized,
    requestedPlanCode: readPlanCode(record),
  };
  assertRequiredCompanyInput(company);
  return company;
}

function mapRepositoryError(error: unknown): never {
  if (error instanceof SignupApplicationDuplicateError) {
    if (error.target === "email") throw new SignupApplicationApiError("SIGNUP_DUPLICATE_EMAIL", 409);
    if (error.target === "google_sub") throw new SignupApplicationApiError("SIGNUP_DUPLICATE_GOOGLE_SUB", 409);
    if (error.target === "business_registration") throw new SignupApplicationApiError("SIGNUP_DUPLICATE_BUSINESS_REGISTRATION", 409);
    throw new SignupApplicationApiError("SIGNUP_DUPLICATE_PROVISIONED_RESOURCE", 409);
  }
  if (error instanceof SignupApplicationConflictError) {
    throw new SignupApplicationApiError("SIGNUP_APPLICATION_CONFLICT", 409);
  }
  throw error;
}

export function summarizeSignupApplication(application: SignupApplicationRecord) {
  return {
    id: application.id,
    status: application.status,
    email: application.email,
    emailNormalized: application.emailNormalized,
    applicantName: application.applicantName,
    requestedCompanyName: application.requestedCompanyName,
    businessName: application.businessName,
    businessRegistrationNumberNormalized: application.businessRegistrationNumberNormalized,
    requestedPlanCode: application.requestedPlanCode,
    businessValidationStatus: application.businessValidationStatus,
    correctionRequestedAt: application.correctionRequestedAt,
    correctionDueAt: application.correctionDueAt,
    correctionReason: application.correctionReason,
    submittedAt: application.submittedAt,
    reviewedAt: application.reviewedAt,
    rejectedAt: application.rejectedAt,
    canceledAt: application.canceledAt,
    provisioningStatus: application.provisioningStatus,
    provisioningErrorCode: application.provisioningErrorCode,
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
  };
}

export async function createSignupApplicationDraft(input: {
  session: SignupApplicantSessionPayload;
  company: SignupApplicationCompanyInput;
}): Promise<SignupApplicationRecord> {
  if (input.session.applicationId) {
    throw new SignupApplicationApiError("SIGNUP_APPLICATION_CONFLICT", 409);
  }
  const repository = createPostgresSignupApplicationRepository();
  const createInput: SignupApplicationCreateInput = {
    googleSub: input.session.googleSub,
    email: input.session.email,
    emailNormalized: normalizeSignupEmail(input.session.email),
    emailVerified: true,
    applicantName: input.session.applicantName,
    googlePictureUrl: input.session.googlePictureUrl,
    ...input.company,
  };

  try {
    return await repository.createDraft(createInput);
  } catch (error) {
    return mapRepositoryError(error);
  }
}

export async function getOwnedSignupApplication(
  session: SignupApplicantSessionPayload,
): Promise<SignupApplicationRecord> {
  if (!session.applicationId) {
    throw new SignupApplicationApiError("SIGNUP_APPLICATION_ID_REQUIRED", 400);
  }
  const application = await createPostgresSignupApplicationRepository().findApplicantOwnedApplication({
    applicationId: session.applicationId,
    owner: createSignupApplicantOwner(session),
  });
  if (!application) {
    throw new SignupApplicationApiError("SIGNUP_APPLICATION_NOT_FOUND", 404);
  }
  return application;
}

export async function updateOwnedSignupApplicationDraft(input: {
  session: SignupApplicantSessionPayload;
  company: SignupApplicationCompanyInput;
}): Promise<SignupApplicationRecord> {
  if (!input.session.applicationId) {
    throw new SignupApplicationApiError("SIGNUP_APPLICATION_ID_REQUIRED", 400);
  }
  try {
    return await createPostgresSignupApplicationRepository().updateDraft({
      applicationId: input.session.applicationId,
      owner: createSignupApplicantOwner(input.session),
      company: input.company,
    });
  } catch (error) {
    return mapRepositoryError(error);
  }
}

export async function submitOwnedSignupApplication(input: {
  session: SignupApplicantSessionPayload;
}): Promise<SignupApplicationRecord> {
  const application = await getOwnedSignupApplication(input.session);
  if (application.status !== "draft" && application.status !== "changes_requested") {
    throw new SignupApplicationApiError("SIGNUP_APPLICATION_CONFLICT", 409);
  }
  await assertOwnedSignupRequiredConsents(input.session);
  return createPostgresSignupApplicationRepository().submitDraft({
    applicationId: application.id,
    owner: createSignupApplicantOwner(input.session),
    now: new Date(),
    expectedStatus: application.status,
    compareAndSet: true,
  });
}

export async function cancelOwnedSignupApplication(input: {
  session: SignupApplicantSessionPayload;
}): Promise<SignupApplicationRecord> {
  const application = await getOwnedSignupApplication(input.session);
  if (!["draft", "submitted", "changes_requested"].includes(application.status)) {
    throw new SignupApplicationApiError("SIGNUP_APPLICATION_CONFLICT", 409);
  }
  return createPostgresSignupApplicationRepository().cancelApplicantApplication({
    applicationId: application.id,
    owner: createSignupApplicantOwner(input.session),
    now: new Date(),
    expectedStatuses: ["draft", "submitted", "changes_requested"],
    compareAndSet: true,
  });
}
