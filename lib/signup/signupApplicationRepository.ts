import type {
  SignupApplicationPlanCode,
  SignupApplicationCompanyInput,
  SignupApplicationFileRecord,
  SignupApplicationIdentity,
  SignupApplicationProvisionedIds,
  SignupApplicationRecord,
  SignupApplicationStatus,
} from "./signupApplicationTypes";
import { queryDb, type DbQueryResult, type DbQueryResultRow, type DbTransactionClient } from "@/lib/db/client";

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
  updateDraft(input: {
    applicationId: string;
    owner: SignupApplicationOwner;
    company: SignupApplicationCompanyInput;
  }): Promise<SignupApplicationRecord>;
  submitDraft(input: {
    applicationId: string;
    owner: SignupApplicationOwner;
    now: Date;
    expectedStatus: "draft" | "changes_requested";
    compareAndSet: true;
  }): Promise<SignupApplicationRecord>;
  cancelApplicantApplication(input: {
    applicationId: string;
    owner: SignupApplicationOwner;
    now: Date;
    expectedStatuses: readonly ("draft" | "submitted" | "changes_requested")[];
    compareAndSet: true;
  }): Promise<SignupApplicationRecord>;
  findById(applicationId: string): Promise<SignupApplicationRecord | null>;
  findApplicantOwnedApplication(input: {
    applicationId: string;
    owner: SignupApplicationOwner;
  }): Promise<SignupApplicationRecord | null>;
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

export type SignupApplicationOwner = {
  googleSub: string;
  emailNormalized: string;
};

type SignupApplicationRow = DbQueryResultRow & {
  id: string;
  status: SignupApplicationStatus;
  google_sub: string;
  email: string;
  email_normalized: string;
  email_verified: boolean;
  applicant_name: string;
  google_picture_url: string | null;
  requested_company_name: string;
  business_name: string;
  business_registration_number: string;
  business_registration_number_normalized: string;
  requested_plan_code: SignupApplicationPlanCode;
  business_validation_status: SignupApplicationRecord["businessValidationStatus"];
  business_validation_summary: Record<string, unknown>;
  business_validation_checked_at: Date | string | null;
  correction_requested_at: Date | string | null;
  correction_due_at: Date | string | null;
  correction_reason: string | null;
  correction_count: number;
  reviewed_by_system_user_id: string | null;
  reviewed_at: Date | string | null;
  rejection_reason: string | null;
  provisioning_status: SignupApplicationRecord["provisioningStatus"];
  provisioning_started_at: Date | string | null;
  provisioning_completed_at: Date | string | null;
  provisioning_error_code: string | null;
  provisioning_attempt_count: number;
  created_company_id: string | null;
  created_user_id: string | null;
  created_company_member_id: string | null;
  created_subscription_id: string | null;
  submitted_at: Date | string | null;
  approved_at: Date | string | null;
  rejected_at: Date | string | null;
  canceled_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

type SignupApplicationFileRow = DbQueryResultRow & {
  id: string;
  application_id: string;
  file_type: "business_registration";
  original_name: string;
  storage_key: string;
  mime_type: string;
  size_bytes: number | string;
  uploaded_at: Date | string;
  reviewed_by_system_user_id: string | null;
  reviewed_at: Date | string | null;
  approved_company_file_id: string | null;
  deleted_at: Date | string | null;
};

const SIGNUP_APPLICATION_RETURNING_COLUMNS = `
  id,
  status,
  google_sub,
  email,
  email_normalized,
  email_verified,
  applicant_name,
  google_picture_url,
  requested_company_name,
  business_name,
  business_registration_number,
  business_registration_number_normalized,
  requested_plan_code,
  business_validation_status,
  business_validation_summary,
  business_validation_checked_at,
  correction_requested_at,
  correction_due_at,
  correction_reason,
  correction_count,
  reviewed_by_system_user_id,
  reviewed_at,
  rejection_reason,
  provisioning_status,
  provisioning_started_at,
  provisioning_completed_at,
  provisioning_error_code,
  provisioning_attempt_count,
  created_company_id,
  created_user_id,
  created_company_member_id,
  created_subscription_id,
  submitted_at,
  approved_at,
  rejected_at,
  canceled_at,
  created_at,
  updated_at
`;

function iso(value: Date | string | null): string | null {
  if (value === null) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function mapApplicationRow(row: SignupApplicationRow): SignupApplicationRecord {
  return {
    id: row.id,
    status: row.status,
    googleSub: row.google_sub,
    email: row.email,
    emailNormalized: row.email_normalized,
    emailVerified: true,
    applicantName: row.applicant_name,
    googlePictureUrl: row.google_picture_url,
    requestedCompanyName: row.requested_company_name,
    businessName: row.business_name,
    businessRegistrationNumber: row.business_registration_number,
    businessRegistrationNumberNormalized: row.business_registration_number_normalized,
    requestedPlanCode: row.requested_plan_code,
    businessValidationStatus: row.business_validation_status,
    businessValidationSummary: row.business_validation_summary,
    businessValidationCheckedAt: iso(row.business_validation_checked_at),
    correctionRequestedAt: iso(row.correction_requested_at),
    correctionDueAt: iso(row.correction_due_at),
    correctionReason: row.correction_reason,
    correctionCount: row.correction_count,
    reviewedBySystemUserId: row.reviewed_by_system_user_id,
    reviewedAt: iso(row.reviewed_at),
    rejectionReason: row.rejection_reason,
    provisioningStatus: row.provisioning_status,
    provisioningStartedAt: iso(row.provisioning_started_at),
    provisioningCompletedAt: iso(row.provisioning_completed_at),
    provisioningErrorCode: row.provisioning_error_code,
    provisioningAttemptCount: row.provisioning_attempt_count,
    createdCompanyId: row.created_company_id,
    createdUserId: row.created_user_id,
    createdCompanyMemberId: row.created_company_member_id,
    createdSubscriptionId: row.created_subscription_id,
    submittedAt: iso(row.submitted_at),
    approvedAt: iso(row.approved_at),
    rejectedAt: iso(row.rejected_at),
    canceledAt: iso(row.canceled_at),
    createdAt: iso(row.created_at) ?? "",
    updatedAt: iso(row.updated_at) ?? "",
  };
}

function mapFileRow(row: SignupApplicationFileRow): SignupApplicationFileRecord {
  return {
    id: row.id,
    applicationId: row.application_id,
    fileType: row.file_type,
    originalName: row.original_name,
    storageKey: row.storage_key,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes),
    uploadedAt: iso(row.uploaded_at) ?? "",
    reviewedBySystemUserId: row.reviewed_by_system_user_id,
    reviewedAt: iso(row.reviewed_at),
    approvedCompanyFileId: row.approved_company_file_id,
    deletedAt: iso(row.deleted_at),
  };
}

function assertAllowedPlanCode(value: string): asserts value is SignupApplicationPlanCode {
  if (!["lite", "flow", "studio", "custom"].includes(value)) {
    throw new Error("SIGNUP_PLAN_NOT_ALLOWED");
  }
}

function normalizeCompanyInput(input: SignupApplicationCompanyInput): SignupApplicationCompanyInput {
  const requestedPlanCode = input.requestedPlanCode.trim();
  assertAllowedPlanCode(requestedPlanCode);
  return {
    requestedCompanyName: input.requestedCompanyName.trim(),
    businessName: input.businessName.trim(),
    businessRegistrationNumber: input.businessRegistrationNumber.trim(),
    businessRegistrationNumberNormalized: normalizeBusinessRegistrationNumber(input.businessRegistrationNumber),
    requestedPlanCode,
  };
}

function isUniqueViolation(error: unknown): error is { code: string; constraint?: string } {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code: unknown }).code === "23505");
}

export class SignupApplicationDuplicateError extends Error {
  constructor(readonly target: SignupApplicationDuplicateTarget) {
    super(`SIGNUP_DUPLICATE_${target.toUpperCase()}`);
    this.name = "SignupApplicationDuplicateError";
  }
}

export class SignupApplicationConflictError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "SignupApplicationConflictError";
  }
}

function mapRepositoryError(error: unknown): never {
  if (isUniqueViolation(error)) {
    const target = mapSignupApplicationDuplicateConstraint(error.constraint ?? "");
    if (target) throw new SignupApplicationDuplicateError(target);
  }
  throw error;
}

type Queryable = {
  query: <TRow extends DbQueryResultRow = DbQueryResultRow>(text: string, params?: unknown[]) => Promise<DbQueryResult<TRow>>;
};

function getQueryable(client?: DbTransactionClient | null): Queryable {
  return client ?? { query: queryDb };
}

function oneOrConflict(result: DbQueryResult<SignupApplicationRow>, code: string): SignupApplicationRecord {
  const row = result.rows[0];
  if (!row) throw new SignupApplicationConflictError(code);
  return mapApplicationRow(row);
}

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

export function createPostgresSignupApplicationRepository(
  client?: DbTransactionClient | null,
): SignupApplicationRepository {
  const db = getQueryable(client);

  async function queryOne(
    text: string,
    params: unknown[],
  ): Promise<SignupApplicationRecord | null> {
    const result = await db.query<SignupApplicationRow>(text, params);
    return result.rows[0] ? mapApplicationRow(result.rows[0]) : null;
  }

  return {
    async createDraft(input) {
      const company = normalizeCompanyInput(input);
      const createInput = {
        ...input,
        ...company,
        email: input.email.trim(),
        emailNormalized: normalizeSignupEmail(input.email),
        googleSub: input.googleSub.trim(),
        applicantName: input.applicantName.trim(),
        googlePictureUrl: input.googlePictureUrl?.trim() || null,
      };
      assertSignupApplicationCreateInput(createInput);

      try {
        const result = await db.query<SignupApplicationRow>(
          `
            INSERT INTO signup_applications (
              google_sub,
              email,
              email_normalized,
              email_verified,
              applicant_name,
              google_picture_url,
              requested_company_name,
              business_name,
              business_registration_number,
              business_registration_number_normalized,
              requested_plan_code
            ) VALUES ($1, $2, $3, true, $4, $5, $6, $7, $8, $9, $10)
            RETURNING ${SIGNUP_APPLICATION_RETURNING_COLUMNS}
          `,
          [
            createInput.googleSub,
            createInput.email,
            createInput.emailNormalized,
            createInput.applicantName,
            createInput.googlePictureUrl,
            createInput.requestedCompanyName,
            createInput.businessName,
            createInput.businessRegistrationNumber,
            createInput.businessRegistrationNumberNormalized,
            createInput.requestedPlanCode,
          ],
        );

        return oneOrConflict(result, "SIGNUP_APPLICATION_CREATE_FAILED");
      } catch (error) {
        return mapRepositoryError(error);
      }
    },

    async updateDraft(input) {
      const company = normalizeCompanyInput(input.company);
      const result = await db.query<SignupApplicationRow>(
        `
          UPDATE signup_applications
          SET
            requested_company_name = $4,
            business_name = $5,
            business_registration_number = $6,
            business_registration_number_normalized = $7,
            requested_plan_code = $8,
            updated_at = now()
          WHERE id = $1
            AND google_sub = $2
            AND email_normalized = $3
            AND status IN ('draft', 'changes_requested')
          RETURNING ${SIGNUP_APPLICATION_RETURNING_COLUMNS}
        `,
        [
          input.applicationId,
          input.owner.googleSub,
          input.owner.emailNormalized,
          company.requestedCompanyName,
          company.businessName,
          company.businessRegistrationNumber,
          company.businessRegistrationNumberNormalized,
          company.requestedPlanCode,
        ],
      );

      return oneOrConflict(result, "SIGNUP_APPLICATION_UPDATE_NOT_ALLOWED");
    },

    async submitDraft(input) {
      const result = await db.query<SignupApplicationRow>(
        `
          UPDATE signup_applications
          SET
            status = 'submitted',
            submitted_at = COALESCE(submitted_at, $4),
            correction_requested_at = NULL,
            correction_due_at = NULL,
            correction_reason = NULL,
            updated_at = $4
          WHERE id = $1
            AND google_sub = $2
            AND email_normalized = $3
            AND status = $5
          RETURNING ${SIGNUP_APPLICATION_RETURNING_COLUMNS}
        `,
        [
          input.applicationId,
          input.owner.googleSub,
          input.owner.emailNormalized,
          input.now,
          input.expectedStatus,
        ],
      );

      return oneOrConflict(result, "SIGNUP_APPLICATION_SUBMIT_CONFLICT");
    },

    async cancelApplicantApplication(input) {
      const result = await db.query<SignupApplicationRow>(
        `
          UPDATE signup_applications
          SET
            status = 'canceled',
            canceled_at = $4,
            updated_at = $4
          WHERE id = $1
            AND google_sub = $2
            AND email_normalized = $3
            AND status = ANY($5::text[])
          RETURNING ${SIGNUP_APPLICATION_RETURNING_COLUMNS}
        `,
        [
          input.applicationId,
          input.owner.googleSub,
          input.owner.emailNormalized,
          input.now,
          input.expectedStatuses,
        ],
      );

      return oneOrConflict(result, "SIGNUP_APPLICATION_CANCEL_CONFLICT");
    },

    async findById(applicationId) {
      return queryOne(
        `
          SELECT ${SIGNUP_APPLICATION_RETURNING_COLUMNS}
          FROM signup_applications
          WHERE id = $1
          LIMIT 1
        `,
        [applicationId],
      );
    },

    async findApplicantOwnedApplication(input) {
      return queryOne(
        `
          SELECT ${SIGNUP_APPLICATION_RETURNING_COLUMNS}
          FROM signup_applications
          WHERE id = $1
            AND google_sub = $2
            AND email_normalized = $3
          LIMIT 1
        `,
        [input.applicationId, input.owner.googleSub, input.owner.emailNormalized],
      );
    },

    async findActiveByEmail(emailNormalized) {
      return queryOne(
        `
          SELECT ${SIGNUP_APPLICATION_RETURNING_COLUMNS}
          FROM signup_applications
          WHERE email_normalized = $1
            AND status IN ('submitted', 'reviewing', 'changes_requested', 'approved', 'provisioning_failed')
          ORDER BY created_at DESC
          LIMIT 1
        `,
        [emailNormalized],
      );
    },

    async findActiveByGoogleSub(googleSub) {
      return queryOne(
        `
          SELECT ${SIGNUP_APPLICATION_RETURNING_COLUMNS}
          FROM signup_applications
          WHERE google_sub = $1
            AND status IN ('submitted', 'reviewing', 'changes_requested', 'approved', 'provisioning_failed')
          ORDER BY created_at DESC
          LIMIT 1
        `,
        [googleSub],
      );
    },

    async findActiveByBusinessRegistrationNormalized(businessRegistrationNumberNormalized) {
      return queryOne(
        `
          SELECT ${SIGNUP_APPLICATION_RETURNING_COLUMNS}
          FROM signup_applications
          WHERE business_registration_number_normalized = $1
            AND status IN ('submitted', 'reviewing', 'changes_requested', 'approved', 'provisioning_failed')
          ORDER BY created_at DESC
          LIMIT 1
        `,
        [businessRegistrationNumberNormalized],
      );
    },

    async listReviewQueue(input) {
      const limit = Math.min(Math.max(input.limit, 1), 100);
      const result = await db.query<SignupApplicationRow>(
        `
          SELECT ${SIGNUP_APPLICATION_RETURNING_COLUMNS}
          FROM signup_applications
          WHERE ($1::text IS NULL OR status = $1)
            AND ($2::timestamptz IS NULL OR created_at < $2)
            AND status IN ('submitted', 'reviewing', 'changes_requested', 'provisioning_failed')
          ORDER BY created_at DESC
          LIMIT $3
        `,
        [input.status ?? null, input.cursorCreatedAt ?? null, limit],
      );

      return result.rows.map(mapApplicationRow);
    },

    async findApplicationCertificate(input) {
      const result = await db.query<SignupApplicationFileRow>(
        `
          SELECT
            id,
            application_id,
            file_type,
            original_name,
            storage_key,
            mime_type,
            size_bytes,
            uploaded_at,
            reviewed_by_system_user_id,
            reviewed_at,
            approved_company_file_id,
            deleted_at
          FROM signup_application_files
          WHERE application_id = $1
            AND id = $2
            AND deleted_at IS NULL
            AND file_type = 'business_registration'
          LIMIT 1
        `,
        [input.applicationId, input.fileId],
      );

      return result.rows[0] ? mapFileRow(result.rows[0]) : null;
    },

    async transitionStatus(input) {
      const result = await db.query<SignupApplicationRow>(
        `
          UPDATE signup_applications
          SET
            status = $3,
            reviewed_by_system_user_id = COALESCE($4, reviewed_by_system_user_id),
            reviewed_at = CASE WHEN $4::text IS NULL THEN reviewed_at ELSE $6 END,
            correction_requested_at = CASE WHEN $3 = 'changes_requested' THEN $6 ELSE correction_requested_at END,
            correction_due_at = CASE WHEN $3 = 'changes_requested' THEN $6 + interval '3 days' ELSE correction_due_at END,
            correction_reason = CASE WHEN $3 = 'changes_requested' THEN $5 ELSE correction_reason END,
            correction_count = CASE WHEN $3 = 'changes_requested' THEN correction_count + 1 ELSE correction_count END,
            rejection_reason = CASE WHEN $3 = 'rejected' THEN $5 ELSE rejection_reason END,
            rejected_at = CASE WHEN $3 = 'rejected' THEN $6 ELSE rejected_at END,
            canceled_at = CASE WHEN $3 = 'canceled' THEN $6 ELSE canceled_at END,
            updated_at = $6
          WHERE id = $1
            AND status = $2
          RETURNING ${SIGNUP_APPLICATION_RETURNING_COLUMNS}
        `,
        [
          input.applicationId,
          input.from,
          input.to,
          input.systemUserId ?? null,
          input.reason ?? null,
          input.now,
        ],
      );

      return oneOrConflict(result, "SIGNUP_APPLICATION_STATUS_CONFLICT");
    },

    async markProvisioningStarted(input) {
      const result = await db.query<SignupApplicationRow>(
        `
          UPDATE signup_applications
          SET
            provisioning_status = 'in_progress',
            provisioning_started_at = COALESCE(provisioning_started_at, $3),
            provisioning_attempt_count = provisioning_attempt_count + 1,
            reviewed_by_system_user_id = $2,
            reviewed_at = $3,
            updated_at = $3
          WHERE id = $1
            AND status = $4
            AND provisioning_status = 'not_started'
          RETURNING ${SIGNUP_APPLICATION_RETURNING_COLUMNS}
        `,
        [input.applicationId, input.systemUserId, input.now, input.expectedStatus],
      );

      return oneOrConflict(result, "SIGNUP_PROVISIONING_START_CONFLICT");
    },

    async markProvisioningCompleted(input) {
      const existing = await queryOne(
        `
          SELECT ${SIGNUP_APPLICATION_RETURNING_COLUMNS}
          FROM signup_applications
          WHERE id = $1
          LIMIT 1
        `,
        [input.applicationId],
      );
      if (existing?.status === "approved" && existing.provisioningStatus === "completed") {
        return existing;
      }

      try {
        const result = await db.query<SignupApplicationRow>(
          `
            UPDATE signup_applications
            SET
              status = 'approved',
              provisioning_status = 'completed',
              provisioning_completed_at = $6,
              approved_at = $6,
              created_company_id = $2,
              created_user_id = $3,
              created_company_member_id = $4,
              created_subscription_id = $5,
              updated_at = $6
            WHERE id = $1
              AND provisioning_status = 'in_progress'
            RETURNING ${SIGNUP_APPLICATION_RETURNING_COLUMNS}
          `,
          [
            input.applicationId,
            input.provisionedIds.companyId,
            input.provisionedIds.userId,
            input.provisionedIds.companyMemberId,
            input.provisionedIds.subscriptionId,
            input.now,
          ],
        );

        return oneOrConflict(result, "SIGNUP_PROVISIONING_COMPLETE_CONFLICT");
      } catch (error) {
        return mapRepositoryError(error);
      }
    },

    async markProvisioningFailed(input) {
      const result = await db.query<SignupApplicationRow>(
        `
          UPDATE signup_applications
          SET
            status = 'provisioning_failed',
            provisioning_status = 'failed',
            provisioning_error_code = $2,
            updated_at = $3
          WHERE id = $1
            AND provisioning_status = $4
          RETURNING ${SIGNUP_APPLICATION_RETURNING_COLUMNS}
        `,
        [
          input.applicationId,
          input.errorCode,
          input.now,
          input.expectedProvisioningStatus,
        ],
      );

      return oneOrConflict(result, "SIGNUP_PROVISIONING_FAIL_CONFLICT");
    },

    async retryFailedProvisioning(input) {
      const result = await db.query<SignupApplicationRow>(
        `
          UPDATE signup_applications
          SET
            status = 'reviewing',
            provisioning_status = 'not_started',
            provisioning_error_code = NULL,
            provisioning_started_at = NULL,
            reviewed_by_system_user_id = $2,
            reviewed_at = $3,
            updated_at = $3
          WHERE id = $1
            AND status = $4
            AND provisioning_status = 'failed'
          RETURNING ${SIGNUP_APPLICATION_RETURNING_COLUMNS}
        `,
        [input.applicationId, input.systemUserId, input.now, input.expectedStatus],
      );

      return oneOrConflict(result, "SIGNUP_PROVISIONING_RETRY_CONFLICT");
    },

    mapDuplicateConstraint: mapSignupApplicationDuplicateConstraint,
  };
}
