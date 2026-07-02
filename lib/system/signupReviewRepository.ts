import "server-only";

import { createHash } from "node:crypto";

import type { DbQueryResultRow } from "@/lib/db/client";
import { queryDb } from "@/lib/db/client";
import { SIGNUP_REQUIRED_CONSENT_POLICIES } from "@/lib/signup/signupConsentPolicy";

export type SignupReviewStatus =
  | "draft"
  | "submitted"
  | "reviewing"
  | "changes_requested"
  | "approved"
  | "rejected"
  | "canceled"
  | "provisioning_failed";

export const SIGNUP_REVIEW_DEFAULT_STATUSES: SignupReviewStatus[] = [
  "submitted",
  "reviewing",
  "changes_requested",
];

export const SIGNUP_REVIEW_FILTER_STATUSES: SignupReviewStatus[] = [
  "submitted",
  "reviewing",
  "changes_requested",
  "rejected",
  "provisioning_failed",
  "approved",
];

const REVIEW_REASON_MAX_LENGTH = 600;
const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 25;
const REQUIRED_CONSENT_COUNT = SIGNUP_REQUIRED_CONSENT_POLICIES.length;

function sqlStringLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

const REQUIRED_CONSENT_TYPES_SQL = SIGNUP_REQUIRED_CONSENT_POLICIES.map((policy) => sqlStringLiteral(policy.consentType)).join(", ");
const CURRENT_CONSENT_POLICY_VALUES_SQL = SIGNUP_REQUIRED_CONSENT_POLICIES.map(
  (policy) => `(${sqlStringLiteral(policy.consentType)}, ${sqlStringLiteral(policy.policyCode)}, ${sqlStringLiteral(policy.policyVersion)})`,
).join(", ");

type SignupReviewRow = DbQueryResultRow & {
  id: string;
  status: SignupReviewStatus;
  email: string;
  email_normalized: string;
  applicant_name: string;
  requested_company_name: string;
  business_name: string;
  business_registration_number_normalized: string;
  requested_plan_code: string;
  submitted_at: Date | string | null;
  correction_requested_at: Date | string | null;
  correction_due_at: Date | string | null;
  correction_reason: string | null;
  correction_count: number | string;
  rejection_reason: string | null;
  rejected_at: Date | string | null;
  provisioning_status: string;
  provisioning_error_code: string | null;
  business_validation_status: string;
  business_validation_checked_at: Date | string | null;
  reviewed_at: Date | string | null;
  updated_at: Date | string;
  created_at: Date | string;
  active_certificate_id: string | null;
  active_certificate_original_name: string | null;
  active_certificate_mime_type: string | null;
  active_certificate_size_bytes: number | string | null;
  active_certificate_uploaded_at: Date | string | null;
  active_consent_count: number | string;
  current_consent_count: number | string;
  payment_readiness_state: string | null;
  payment_provider_code: string | null;
  payment_masked_display: string | null;
  payment_environment: string | null;
  payment_verified_at: Date | string | null;
};

type SignupConsentRow = DbQueryResultRow & {
  id: string;
  consent_type: string;
  policy_code: string;
  policy_version: string;
  agreed_at: Date | string;
  revoked_at: Date | string | null;
};

export type SignupReviewListItem = {
  id: string;
  status: SignupReviewStatus;
  applicantName: string;
  emailDisplay: string;
  requestedCompanyName: string;
  businessName: string;
  businessRegistrationNumberMasked: string;
  requestedPlanCode: string;
  submittedAt: string | null;
  correctionDueAt: string | null;
  correctionReason: string | null;
  rejectionReason: string | null;
  provisioningErrorCode: string | null;
  certificate: {
    exists: boolean;
    fileId: string | null;
    originalName: string | null;
    mimeType: string | null;
    sizeBytes: number | null;
    uploadedAt: string | null;
  };
  requiredConsentTypesPresent: boolean;
  requiredConsentVersionsCurrent: boolean;
  requiredConsentsComplete: boolean;
  activeConsentCount: number;
  currentConsentCount: number;
  paymentReadiness: {
    ready: boolean;
    state: string;
    providerCode: string | null;
    maskedDisplay: string | null;
    environment: string | null;
    verifiedAt: string | null;
  };
};

export type SignupReviewConsentEvidence = {
  id: string;
  consentType: string;
  policyCode: string;
  policyVersion: string;
  agreedAt: string;
  revokedAt: string | null;
};

export type SignupReviewDetail = SignupReviewListItem & {
  emailVerified: boolean;
  identityEvidence: {
    googleEmailVerified: boolean;
    googleSubjectFingerprint: string;
  };
  businessValidationStatus: string;
  businessValidationCheckedAt: string | null;
  reviewedAt: string | null;
  updatedAt: string;
  createdAt: string;
  consents: SignupReviewConsentEvidence[];
  certificateViewerPath: string | null;
  approveEligibility: {
    eligible: boolean;
    reasons: string[];
    checks: {
      reviewStatusReady: boolean;
      emailVerified: boolean;
      requiredConsentTypesPresent: boolean;
      requiredConsentVersionsCurrent: boolean;
      certificatePresent: boolean;
      paymentReadinessReady: boolean;
      provisioningNotStarted: boolean;
    };
  };
};

export type SignupReviewListResult = {
  applications: SignupReviewListItem[];
  summary: {
    submitted: number;
    reviewing: number;
    changesRequested: number;
    provisioningFailed: number;
    paymentReadinessMissing: number;
  };
  pagination: {
    limit: number;
    offset: number;
    nextOffset: number | null;
    hasMore: boolean;
  };
  filters: SignupReviewStatus[];
};

type SignupReviewDetailRow = SignupReviewRow & {
  google_sub: string;
  email_verified: boolean;
};

function iso(value: Date | string | null): string | null {
  if (value === null) return null;
  return value instanceof Date ? value.toISOString() : String(value);
}

function normalizeLimit(value: unknown): number {
  const parsed = Number(value ?? DEFAULT_LIMIT);
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT;
  return Math.min(Math.max(Math.trunc(parsed), 1), MAX_LIMIT);
}

function normalizeOffset(value: unknown): number {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(Math.trunc(parsed), 0);
}

export function normalizeSignupReviewStatuses(value: unknown): SignupReviewStatus[] {
  const raw = Array.isArray(value) ? value : String(value ?? "").split(",");
  const statuses = raw
    .map((item) => String(item ?? "").trim())
    .filter((item): item is SignupReviewStatus => SIGNUP_REVIEW_FILTER_STATUSES.includes(item as SignupReviewStatus));
  return statuses.length > 0 ? [...new Set(statuses)] : SIGNUP_REVIEW_DEFAULT_STATUSES;
}

function maskEmail(value: string): string {
  const [name = "", domain = ""] = value.split("@");
  if (!domain) return value;
  const visible = name.slice(0, Math.min(2, name.length));
  return `${visible}${"*".repeat(Math.max(2, name.length - visible.length))}@${domain}`;
}

export function maskBusinessRegistrationNumber(value: string | null | undefined): string {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length !== 10) return "**********";
  return `${digits.slice(0, 3)}-**-${digits.slice(5, 10)}`;
}

function fingerprint(value: string | null | undefined): string {
  const normalized = String(value ?? "");
  if (!normalized) return "unavailable";
  return createHash("sha256").update(normalized, "utf8").digest("hex").slice(0, 16);
}

function mapListItem(row: SignupReviewRow): SignupReviewListItem {
  const activeConsentCount = Number(row.active_consent_count ?? 0);
  const currentConsentCount = Number(row.current_consent_count ?? 0);
  const requiredConsentTypesPresent = activeConsentCount >= REQUIRED_CONSENT_COUNT;
  const requiredConsentVersionsCurrent = currentConsentCount >= REQUIRED_CONSENT_COUNT;
  return {
    id: row.id,
    status: row.status,
    applicantName: row.applicant_name,
    emailDisplay: maskEmail(row.email_normalized || row.email),
    requestedCompanyName: row.requested_company_name,
    businessName: row.business_name,
    businessRegistrationNumberMasked: maskBusinessRegistrationNumber(row.business_registration_number_normalized),
    requestedPlanCode: row.requested_plan_code,
    submittedAt: iso(row.submitted_at),
    correctionDueAt: iso(row.correction_due_at),
    correctionReason: row.correction_reason,
    rejectionReason: row.rejection_reason,
    provisioningErrorCode: row.provisioning_error_code,
    certificate: {
      exists: Boolean(row.active_certificate_id),
      fileId: row.active_certificate_id,
      originalName: row.active_certificate_original_name,
      mimeType: row.active_certificate_mime_type,
      sizeBytes: row.active_certificate_size_bytes === null ? null : Number(row.active_certificate_size_bytes),
      uploadedAt: iso(row.active_certificate_uploaded_at),
    },
    requiredConsentTypesPresent,
    requiredConsentVersionsCurrent,
    requiredConsentsComplete: requiredConsentTypesPresent && requiredConsentVersionsCurrent,
    activeConsentCount,
    currentConsentCount,
    paymentReadiness: {
      ready: row.payment_readiness_state === "ready",
      state: row.payment_readiness_state ?? "not_ready",
      providerCode: row.payment_provider_code,
      maskedDisplay: row.payment_masked_display,
      environment: row.payment_environment,
      verifiedAt: iso(row.payment_verified_at),
    },
  };
}

function mapDetail(row: SignupReviewDetailRow, consents: SignupConsentRow[]): SignupReviewDetail {
  const listItem = mapListItem(row);
  const emailVerified = row.email_verified === true;
  const certificateViewerPath = listItem.certificate.fileId
    ? `/api/system/signup/applications/${encodeURIComponent(row.id)}/certificate/${encodeURIComponent(listItem.certificate.fileId)}/view`
    : null;
  const approveChecks = {
    reviewStatusReady: row.status === "reviewing",
    emailVerified,
    requiredConsentTypesPresent: listItem.requiredConsentTypesPresent,
    requiredConsentVersionsCurrent: listItem.requiredConsentVersionsCurrent,
    certificatePresent: listItem.certificate.exists,
    paymentReadinessReady: listItem.paymentReadiness.ready,
    provisioningNotStarted: row.provisioning_status === "not_started",
  };
  const approveReasons = [
    approveChecks.reviewStatusReady ? null : "status must be reviewing",
    approveChecks.emailVerified ? null : "Google email_verified must be true",
    approveChecks.requiredConsentTypesPresent ? null : "required consent types are missing",
    approveChecks.requiredConsentVersionsCurrent ? null : "required consent versions are not current",
    approveChecks.certificatePresent ? null : "business certificate is missing",
    approveChecks.paymentReadinessReady ? null : "payment readiness is required",
    approveChecks.provisioningNotStarted ? null : "provisioning already started or completed",
  ].filter((reason): reason is string => Boolean(reason));

  return {
    ...listItem,
    emailVerified,
    identityEvidence: {
      googleEmailVerified: row.email_verified === true,
      googleSubjectFingerprint: fingerprint(row.google_sub),
    },
    businessValidationStatus: row.business_validation_status,
    businessValidationCheckedAt: iso(row.business_validation_checked_at),
    reviewedAt: iso(row.reviewed_at),
    updatedAt: iso(row.updated_at) ?? "",
    createdAt: iso(row.created_at) ?? "",
    consents: consents.map((consent) => ({
      id: consent.id,
      consentType: consent.consent_type,
      policyCode: consent.policy_code,
      policyVersion: consent.policy_version,
      agreedAt: iso(consent.agreed_at) ?? "",
      revokedAt: iso(consent.revoked_at),
    })),
    certificateViewerPath,
    approveEligibility: {
      eligible: approveReasons.length === 0,
      reasons: approveReasons,
      checks: approveChecks,
    },
  };
}

const BASE_SELECT = `
  app.id,
  app.status,
  app.email,
  app.email_normalized,
  app.applicant_name,
  app.requested_company_name,
  app.business_name,
  app.business_registration_number_normalized,
  app.requested_plan_code,
  app.submitted_at,
  app.correction_requested_at,
  app.correction_due_at,
  app.correction_reason,
  app.correction_count,
  app.rejection_reason,
  app.rejected_at,
  app.provisioning_status,
  app.provisioning_error_code,
  app.business_validation_status,
  app.business_validation_checked_at,
  app.reviewed_at,
  app.updated_at,
  app.created_at,
  cert.id AS active_certificate_id,
  cert.original_name AS active_certificate_original_name,
  cert.mime_type AS active_certificate_mime_type,
  cert.size_bytes AS active_certificate_size_bytes,
  cert.uploaded_at AS active_certificate_uploaded_at,
  (
    SELECT count(DISTINCT consent.consent_type)::int
    FROM signup_application_consents consent
    WHERE consent.application_id = app.id
      AND consent.revoked_at IS NULL
      AND consent.consent_type IN (${REQUIRED_CONSENT_TYPES_SQL})
  ) AS active_consent_count,
  (
    SELECT count(DISTINCT consent.consent_type)::int
    FROM signup_application_consents consent
    WHERE consent.application_id = app.id
      AND consent.revoked_at IS NULL
      AND (consent.consent_type, consent.policy_code, consent.policy_version) IN (
        VALUES ${CURRENT_CONSENT_POLICY_VALUES_SQL}
      )
  ) AS current_consent_count
  ,
  payment.readiness_state AS payment_readiness_state,
  payment.provider_code AS payment_provider_code,
  payment.masked_display AS payment_masked_display,
  payment.environment AS payment_environment,
  payment.verified_at AS payment_verified_at
`;

const BASE_FROM = `
  FROM signup_applications app
  LEFT JOIN LATERAL (
    SELECT file.id, file.original_name, file.mime_type, file.size_bytes, file.uploaded_at
    FROM signup_application_files file
    WHERE file.application_id = app.id
      AND file.file_type = 'business_registration'
      AND file.deleted_at IS NULL
    ORDER BY file.uploaded_at DESC, file.id DESC
    LIMIT 1
  ) cert ON true
  LEFT JOIN LATERAL (
    SELECT
      signup_payment.readiness_state,
      signup_payment.provider_code,
      signup_payment.masked_display,
      signup_payment.environment,
      signup_payment.verified_at
    FROM signup_payment_method_references signup_payment
    WHERE signup_payment.application_id = app.id
      AND signup_payment.revoked_at IS NULL
    ORDER BY signup_payment.verified_at DESC NULLS LAST, signup_payment.updated_at DESC, signup_payment.id DESC
    LIMIT 1
  ) payment ON true
`;

export async function listSignupReviewApplications(input: {
  statuses?: unknown;
  limit?: unknown;
  offset?: unknown;
} = {}): Promise<SignupReviewListResult> {
  const statuses = normalizeSignupReviewStatuses(input.statuses);
  const limit = normalizeLimit(input.limit);
  const offset = normalizeOffset(input.offset);
  const result = await queryDb<SignupReviewRow>(
    `
      SELECT ${BASE_SELECT}
      ${BASE_FROM}
      WHERE app.status = ANY($1::text[])
      ORDER BY
        CASE app.status
          WHEN 'submitted' THEN 0
          WHEN 'reviewing' THEN 1
          WHEN 'changes_requested' THEN 2
          WHEN 'provisioning_failed' THEN 3
          WHEN 'rejected' THEN 4
          WHEN 'approved' THEN 5
          ELSE 9
        END ASC,
        COALESCE(app.submitted_at, app.created_at) ASC,
        app.id ASC
      LIMIT $2::int + 1 OFFSET $3::int
    `,
    [statuses, limit, offset],
  );
  const summaryResult = await queryDb<DbQueryResultRow & {
    submitted_count: number | string;
    reviewing_count: number | string;
    changes_requested_count: number | string;
    provisioning_failed_count: number | string;
    payment_readiness_missing_count: number | string;
  }>(
    `
      SELECT
        count(*) FILTER (WHERE app.status = 'submitted')::int AS submitted_count,
        count(*) FILTER (WHERE app.status = 'reviewing')::int AS reviewing_count,
        count(*) FILTER (WHERE app.status = 'changes_requested')::int AS changes_requested_count,
        count(*) FILTER (WHERE app.status = 'provisioning_failed')::int AS provisioning_failed_count,
        count(*) FILTER (
          WHERE app.status IN ('submitted', 'reviewing')
            AND COALESCE(payment.readiness_state, 'not_ready') <> 'ready'
        )::int AS payment_readiness_missing_count
      ${BASE_FROM}
      WHERE app.status IN ('submitted', 'reviewing', 'changes_requested', 'provisioning_failed')
    `,
  );
  const summaryRow = summaryResult.rows[0];
  const rows = result.rows.slice(0, limit);
  const hasMore = result.rows.length > limit;
  return {
    applications: rows.map(mapListItem),
    summary: {
      submitted: Number(summaryRow?.submitted_count ?? 0),
      reviewing: Number(summaryRow?.reviewing_count ?? 0),
      changesRequested: Number(summaryRow?.changes_requested_count ?? 0),
      provisioningFailed: Number(summaryRow?.provisioning_failed_count ?? 0),
      paymentReadinessMissing: Number(summaryRow?.payment_readiness_missing_count ?? 0),
    },
    pagination: {
      limit,
      offset,
      nextOffset: hasMore ? offset + limit : null,
      hasMore,
    },
    filters: statuses,
  };
}

export async function getSignupReviewApplicationDetail(applicationId: string): Promise<SignupReviewDetail | null> {
  const normalizedId = applicationId.trim();
  if (!normalizedId) return null;
  const appResult = await queryDb<SignupReviewDetailRow>(
    `
      SELECT
        ${BASE_SELECT},
        app.google_sub,
        app.email_verified
      ${BASE_FROM}
      WHERE app.id = $1
      LIMIT 1
    `,
    [normalizedId],
  );
  const row = appResult.rows[0];
  if (!row) return null;

  const consentResult = await queryDb<SignupConsentRow>(
    `
      SELECT id, consent_type, policy_code, policy_version, agreed_at, revoked_at
      FROM signup_application_consents
      WHERE application_id = $1
      ORDER BY consent_type ASC, agreed_at DESC, id ASC
    `,
    [normalizedId],
  );
  return mapDetail(row, consentResult.rows);
}

function sanitizeReviewReason(value: unknown): string {
  const reason = String(value ?? "").trim().replace(/\s+/g, " ").slice(0, REVIEW_REASON_MAX_LENGTH);
  if (!reason) throw new Error("SIGNUP_REVIEW_REASON_REQUIRED");
  return reason;
}

async function insertSignupReviewNotificationOutbox(input: {
  applicationId: string;
  templateCode: "signup_correction_requested";
  reason: string;
  scheduledAt?: Date;
}): Promise<void> {
  await queryDb(
    `
      INSERT INTO billing_notification_outbox (
        id,
        template_code,
        recipient_scope,
        safe_payload,
        status,
        scheduled_at,
        environment,
        idempotency_key,
        created_at,
        updated_at
      )
      VALUES (
        gen_random_uuid()::text,
        $1,
        'applicant',
        $2::jsonb,
        'pending',
        COALESCE($3, now()),
        'dev_test',
        $4,
        now(),
        now()
      )
      ON CONFLICT (idempotency_key) DO NOTHING
    `,
    [
      input.templateCode,
      JSON.stringify({
        applicationId: input.applicationId,
        reason: input.reason,
        actualEmailDelivery: false,
      }),
      input.scheduledAt ?? null,
      `signup-review:${input.templateCode}:${input.applicationId}`,
    ],
  );
}

export type SignupReviewTransitionAction = "reviewing" | "changes_requested" | "rejected";

export function isSignupReviewTransitionAction(value: unknown): value is SignupReviewTransitionAction {
  return value === "reviewing" || value === "changes_requested" || value === "rejected";
}

export async function transitionSignupReviewApplication(input: {
  applicationId: string;
  action: SignupReviewTransitionAction;
  expectedStatus: SignupReviewStatus;
  actorSystemUserId: string;
  reason?: unknown;
}): Promise<SignupReviewDetail> {
  const applicationId = input.applicationId.trim();
  if (!applicationId) throw new Error("SIGNUP_REVIEW_APPLICATION_ID_REQUIRED");
  if (!SIGNUP_REVIEW_FILTER_STATUSES.includes(input.expectedStatus)) throw new Error("SIGNUP_REVIEW_EXPECTED_STATUS_INVALID");

  const actorSystemUserId = input.actorSystemUserId.trim();
  if (!actorSystemUserId) throw new Error("SIGNUP_REVIEW_ACTOR_REQUIRED");

  let result;
  if (input.action === "reviewing") {
    result = await queryDb<DbQueryResultRow>(
      `
        UPDATE signup_applications
        SET status = 'reviewing',
            reviewed_by_system_user_id = $2,
            reviewed_at = COALESCE(reviewed_at, now()),
            updated_at = now()
        WHERE id = $1
          AND status = $3
          AND status = 'submitted'
        RETURNING id
      `,
      [applicationId, actorSystemUserId, input.expectedStatus],
    );
  } else if (input.action === "changes_requested") {
    const reason = sanitizeReviewReason(input.reason);
    result = await queryDb<DbQueryResultRow>(
      `
        UPDATE signup_applications
        SET status = 'changes_requested',
            reviewed_by_system_user_id = $2,
            reviewed_at = now(),
            correction_requested_at = now(),
            correction_due_at = now() + interval '3 days',
            correction_reason = $4,
            correction_count = correction_count + 1,
            rejection_reason = NULL,
            rejected_at = NULL,
            updated_at = now()
        WHERE id = $1
          AND status = $3
          AND status IN ('submitted', 'reviewing')
        RETURNING id
      `,
      [applicationId, actorSystemUserId, input.expectedStatus, reason],
    );
  } else {
    const reason = sanitizeReviewReason(input.reason);
    result = await queryDb<DbQueryResultRow>(
      `
        UPDATE signup_applications
        SET status = 'rejected',
            reviewed_by_system_user_id = $2,
            reviewed_at = now(),
            rejection_reason = $4,
            rejected_at = now(),
            updated_at = now()
        WHERE id = $1
          AND status = $3
          AND status IN ('submitted', 'reviewing')
        RETURNING id
      `,
      [applicationId, actorSystemUserId, input.expectedStatus, reason],
    );
  }

  if (result.rowCount !== 1) throw new Error("SIGNUP_REVIEW_TRANSITION_CONFLICT");
  if (input.action === "changes_requested") {
    await insertSignupReviewNotificationOutbox({
      applicationId,
      templateCode: "signup_correction_requested",
      reason: sanitizeReviewReason(input.reason),
    });
  }
  const detail = await getSignupReviewApplicationDetail(applicationId);
  if (!detail) throw new Error("SIGNUP_REVIEW_APPLICATION_NOT_FOUND");
  return detail;
}
