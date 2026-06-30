import "server-only";

import { randomUUID } from "node:crypto";

import {
  TRIAL_MEMBER_LIMIT,
  TRIAL_PLAN_CODE,
  TRIAL_STORAGE_LIMIT_BYTES,
  getTrialEndsAt,
} from "@/lib/billing/companyTrialPolicy";
import { withDbTransaction, type DbQueryResultRow, type DbTransactionClient } from "@/lib/db/client";
import {
  MEMBER_PERMISSION_CATALOG,
  getCompanyAdminMemberRoleTemplateCode,
  getMemberRoleTemplatePermissions,
  type MemberPermissionCode,
} from "@/lib/permissions";
import { SIGNUP_REQUIRED_CONSENT_POLICIES } from "@/lib/signup/signupConsentPolicy";
import type {
  SignupApplicationPlanCode,
  SignupApplicationProvisionedIds,
  SignupApplicationRecord,
} from "./signupApplicationTypes";
import type {
  SignupApprovalProvisioningInput,
  SignupApprovalProvisioningPort,
  SignupApprovalProvisioningResult,
} from "./signupApplicationProvisioning";

export type SignupProvisioningSafeCode =
  | "SIGNUP_APPROVAL_EMAIL_NOT_VERIFIED"
  | "SIGNUP_APPROVAL_CONSENT_INCOMPLETE"
  | "SIGNUP_APPROVAL_CONSENT_OUTDATED"
  | "SIGNUP_APPROVAL_CERTIFICATE_MISSING"
  | "SIGNUP_APPROVAL_STATUS_CONFLICT"
  | "SIGNUP_APPROVAL_IDENTITY_CONFLICT"
  | "SIGNUP_APPROVAL_PLAN_INVALID"
  | "SIGNUP_PROVISIONING_ALREADY_RUNNING"
  | "SIGNUP_PROVISIONING_FAILED";

export class SignupProvisioningPlanError extends Error {
  constructor(readonly code: SignupProvisioningSafeCode) {
    super(code);
    this.name = "SignupProvisioningPlanError";
  }
}

export type SignupProvisioningPlan = {
  applicationId: string;
  status: SignupApplicationRecord["status"] | null;
  canProvision: boolean;
  blockingReasons: SignupProvisioningSafeCode[];
  wouldCreateCompany: boolean;
  wouldCreateUser: boolean;
  wouldReuseUser: boolean;
  wouldCreateMembership: boolean;
  wouldAssignCompanyAdmin: boolean;
  wouldCreateTrialSubscription: boolean;
  wouldLinkCertificate: boolean;
  requestedPlanCode: SignupApplicationPlanCode | null;
  trial: {
    startedAt: string | null;
    endsAt: string | null;
    storageLimitBytes: number;
    memberLimit: number;
  };
};

type SignupProvisioningApplicationRow = DbQueryResultRow & {
  id: string;
  status: SignupApplicationRecord["status"];
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
  provisioning_status: SignupApplicationRecord["provisioningStatus"];
  provisioning_started_at: Date | string | null;
  provisioning_completed_at: Date | string | null;
  provisioning_error_code: string | null;
  provisioning_attempt_count: number | string;
  reviewed_by_system_user_id: string | null;
  reviewed_at: Date | string | null;
  created_company_id: string | null;
  created_user_id: string | null;
  created_company_member_id: string | null;
  created_subscription_id: string | null;
};

type UserRow = DbQueryResultRow & {
  id: string;
  company_id: string;
  email: string | null;
  google_sub: string | null;
  status: string | null;
};

type CertificateRow = DbQueryResultRow & {
  id: string;
  original_name: string;
  storage_key: string;
  mime_type: string;
  size_bytes: number | string;
  approved_company_file_id: string | null;
};

const ALLOWED_REQUESTED_PLAN_CODES = new Set<SignupApplicationPlanCode>([
  "lite",
  "flow",
  "studio",
  "custom",
]);

function iso(value: Date | string | null): string | null {
  if (value === null) return null;
  return value instanceof Date ? value.toISOString() : String(value);
}

function assertSafePlan(value: string): asserts value is SignupApplicationPlanCode {
  if (!ALLOWED_REQUESTED_PLAN_CODES.has(value as SignupApplicationPlanCode)) {
    throw new SignupProvisioningPlanError("SIGNUP_APPROVAL_PLAN_INVALID");
  }
}

function getTrialSnapshot(approvedAt: Date) {
  return {
    startedAt: approvedAt,
    endsAt: getTrialEndsAt(approvedAt),
    storageLimitBytes: TRIAL_STORAGE_LIMIT_BYTES,
    memberLimit: TRIAL_MEMBER_LIMIT,
  };
}

function getUserRoleForCompanyAdmin(): string {
  return "admin";
}

async function selectApplicationForUpdate(
  client: DbTransactionClient,
  applicationId: string,
): Promise<SignupProvisioningApplicationRow | null> {
  const result = await client.query<SignupProvisioningApplicationRow>(
    `
      SELECT
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
        provisioning_status,
        provisioning_started_at,
        provisioning_completed_at,
        provisioning_error_code,
        provisioning_attempt_count,
        reviewed_by_system_user_id,
        reviewed_at,
        created_company_id,
        created_user_id,
        created_company_member_id,
        created_subscription_id
      FROM signup_applications
      WHERE id = $1
      FOR UPDATE
    `,
    [applicationId],
  );
  return result.rows[0] ?? null;
}

async function selectApplicationSnapshot(
  client: DbTransactionClient,
  applicationId: string,
): Promise<SignupProvisioningApplicationRow | null> {
  const result = await client.query<SignupProvisioningApplicationRow>(
    `
      SELECT
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
        provisioning_status,
        provisioning_started_at,
        provisioning_completed_at,
        provisioning_error_code,
        provisioning_attempt_count,
        reviewed_by_system_user_id,
        reviewed_at,
        created_company_id,
        created_user_id,
        created_company_member_id,
        created_subscription_id
      FROM signup_applications
      WHERE id = $1
      LIMIT 1
    `,
    [applicationId],
  );
  return result.rows[0] ?? null;
}

async function selectActiveCertificate(
  client: DbTransactionClient,
  applicationId: string,
): Promise<CertificateRow | null> {
  const result = await client.query<CertificateRow>(
    `
      SELECT
        file.id,
        file.original_name,
        file.storage_key,
        file.mime_type,
        file.size_bytes,
        file.approved_company_file_id
      FROM signup_application_files file
      WHERE file.application_id = $1
        AND file.file_type = 'business_registration'
        AND file.deleted_at IS NULL
      ORDER BY file.uploaded_at DESC, file.id DESC
      LIMIT 1
    `,
    [applicationId],
  );
  return result.rows[0] ?? null;
}

async function getConsentCounts(
  client: DbTransactionClient,
  applicationId: string,
): Promise<{ activeCount: number; currentCount: number }> {
  const result = await client.query<{ active_count: number | string; current_count: number | string }>(
    `
      WITH required(consent_type, policy_code, policy_version) AS (
        SELECT * FROM unnest($2::text[], $3::text[], $4::text[])
      )
      SELECT
        (
          SELECT count(DISTINCT consent.consent_type)::int
          FROM signup_application_consents consent
          JOIN required ON required.consent_type = consent.consent_type
          WHERE consent.application_id = $1
            AND consent.revoked_at IS NULL
        ) AS active_count,
        (
          SELECT count(DISTINCT consent.consent_type)::int
          FROM signup_application_consents consent
          JOIN required
            ON required.consent_type = consent.consent_type
           AND required.policy_code = consent.policy_code
           AND required.policy_version = consent.policy_version
          WHERE consent.application_id = $1
            AND consent.revoked_at IS NULL
        ) AS current_count
    `,
    [
      applicationId,
      SIGNUP_REQUIRED_CONSENT_POLICIES.map((policy) => policy.consentType),
      SIGNUP_REQUIRED_CONSENT_POLICIES.map((policy) => policy.policyCode),
      SIGNUP_REQUIRED_CONSENT_POLICIES.map((policy) => policy.policyVersion),
    ],
  );
  const row = result.rows[0];
  return {
    activeCount: Number(row?.active_count ?? 0),
    currentCount: Number(row?.current_count ?? 0),
  };
}

async function selectUserByGoogleSub(
  client: DbTransactionClient,
  googleSub: string,
): Promise<UserRow | null> {
  const result = await client.query<UserRow>(
    `
      SELECT id, company_id, email, google_sub, status
      FROM users
      WHERE google_sub = $1
      LIMIT 1
    `,
    [googleSub],
  );
  return result.rows[0] ?? null;
}

async function hasEmailOnlyUserConflict(
  client: DbTransactionClient,
  input: { emailNormalized: string; googleSub: string },
): Promise<boolean> {
  const result = await client.query<{ exists: boolean }>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM users
        WHERE lower(email) = $1
          AND (google_sub IS NULL OR google_sub <> $2)
        LIMIT 1
      ) AS exists
    `,
    [input.emailNormalized, input.googleSub],
  );
  return result.rows[0]?.exists === true;
}

async function hasCompanyIdentityConflict(
  client: DbTransactionClient,
  app: SignupProvisioningApplicationRow,
): Promise<boolean> {
  const result = await client.query<{ exists: boolean }>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM companies
        WHERE is_active = true
          AND (
            lower(name) = lower($1)
            OR regexp_replace(COALESCE(business_registration_number, ''), '[^0-9]', '', 'g') = $2
          )
        LIMIT 1
      ) AS exists
    `,
    [app.requested_company_name, app.business_registration_number_normalized],
  );
  return result.rows[0]?.exists === true;
}

async function assertProvisioningEligibility(
  client: DbTransactionClient,
  app: SignupProvisioningApplicationRow,
): Promise<CertificateRow> {
  assertSafePlan(app.requested_plan_code);
  if (app.status === "approved" && app.provisioning_status === "completed") {
    throw new SignupProvisioningPlanError("SIGNUP_PROVISIONING_ALREADY_RUNNING");
  }
  if (app.status !== "reviewing" || app.provisioning_status !== "not_started") {
    throw new SignupProvisioningPlanError("SIGNUP_APPROVAL_STATUS_CONFLICT");
  }
  if (app.email_verified !== true) {
    throw new SignupProvisioningPlanError("SIGNUP_APPROVAL_EMAIL_NOT_VERIFIED");
  }

  const consentCounts = await getConsentCounts(client, app.id);
  if (consentCounts.activeCount < SIGNUP_REQUIRED_CONSENT_POLICIES.length) {
    throw new SignupProvisioningPlanError("SIGNUP_APPROVAL_CONSENT_INCOMPLETE");
  }
  if (consentCounts.currentCount < SIGNUP_REQUIRED_CONSENT_POLICIES.length) {
    throw new SignupProvisioningPlanError("SIGNUP_APPROVAL_CONSENT_OUTDATED");
  }

  const certificate = await selectActiveCertificate(client, app.id);
  if (!certificate) {
    throw new SignupProvisioningPlanError("SIGNUP_APPROVAL_CERTIFICATE_MISSING");
  }
  if (await hasEmailOnlyUserConflict(client, { emailNormalized: app.email_normalized, googleSub: app.google_sub })) {
    throw new SignupProvisioningPlanError("SIGNUP_APPROVAL_IDENTITY_CONFLICT");
  }
  if (await hasCompanyIdentityConflict(client, app)) {
    throw new SignupProvisioningPlanError("SIGNUP_APPROVAL_IDENTITY_CONFLICT");
  }
  return certificate;
}

async function insertCompany(
  client: DbTransactionClient,
  input: { app: SignupProvisioningApplicationRow; approvedAt: Date },
): Promise<string> {
  const companyId = randomUUID();
  const trial = getTrialSnapshot(input.approvedAt);
  await client.query(
    `
      INSERT INTO companies (
        id,
        name,
        business_name,
        business_registration_number,
        requested_plan_code,
        plan_code,
        is_active,
        status,
        onboarding_status,
        billing_status,
        subscription_status,
        trial_started_at,
        trial_ends_at,
        storage_limit_bytes,
        member_limit,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, true, 'active', 'active', 'trial', 'trialing', $7, $8, $9, $10, $7, $7)
    `,
    [
      companyId,
      input.app.requested_company_name,
      input.app.business_name,
      input.app.business_registration_number,
      input.app.requested_plan_code,
      TRIAL_PLAN_CODE,
      trial.startedAt,
      trial.endsAt,
      trial.storageLimitBytes,
      trial.memberLimit,
    ],
  );
  return companyId;
}

async function findOrCreateUser(
  client: DbTransactionClient,
  input: { app: SignupProvisioningApplicationRow; companyId: string; approvedAt: Date },
): Promise<{ userId: string; reused: boolean }> {
  const existing = await selectUserByGoogleSub(client, input.app.google_sub);
  if (existing) {
    if (existing.email && existing.email.trim().toLowerCase() !== input.app.email_normalized) {
      throw new SignupProvisioningPlanError("SIGNUP_APPROVAL_IDENTITY_CONFLICT");
    }
    if (existing.status && !["active", "pending"].includes(existing.status)) {
      throw new SignupProvisioningPlanError("SIGNUP_APPROVAL_IDENTITY_CONFLICT");
    }
    await client.query(
      `
        UPDATE users
        SET company_id = $2,
            email = COALESCE(email, $3),
            name = $4,
            display_name = COALESCE(display_name, $4),
            google_picture_url = COALESCE($5, google_picture_url),
            avatar_url = COALESCE($5, avatar_url),
            role = $6,
            auth_provider = COALESCE(auth_provider, 'google'),
            provider_user_id = COALESCE(provider_user_id, $7),
            email_verified = true,
            status = 'active',
            is_active = true,
            updated_at = $8
        WHERE id = $1
      `,
      [
        existing.id,
        input.companyId,
        input.app.email,
        input.app.applicant_name,
        input.app.google_picture_url,
        getUserRoleForCompanyAdmin(),
        input.app.google_sub,
        input.approvedAt,
      ],
    );
    return { userId: existing.id, reused: true };
  }

  const userId = randomUUID();
  await client.query(
    `
      INSERT INTO users (
        id,
        company_id,
        email,
        name,
        display_name,
        google_sub,
        google_picture_url,
        avatar_url,
        auth_provider,
        provider_user_id,
        email_verified,
        role,
        status,
        is_active,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $4, $5, $6, $6, 'google', $5, true, $7, 'active', true, $8, $8)
    `,
    [
      userId,
      input.companyId,
      input.app.email,
      input.app.applicant_name,
      input.app.google_sub,
      input.app.google_picture_url,
      getUserRoleForCompanyAdmin(),
      input.approvedAt,
    ],
  );
  return { userId, reused: false };
}

async function insertCompanyMember(
  client: DbTransactionClient,
  input: { companyId: string; userId: string; displayName: string; approvedAt: Date },
): Promise<string> {
  const memberId = randomUUID();
  await client.query(
    `
      INSERT INTO company_members (
        id,
        company_id,
        user_id,
        status,
        role_template_code,
        display_name,
        approved_at,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, 'approved', $4, $5, $6, $6, $6)
      ON CONFLICT (company_id, user_id)
      DO UPDATE SET
        status = 'approved',
        role_template_code = EXCLUDED.role_template_code,
        display_name = COALESCE(EXCLUDED.display_name, company_members.display_name),
        approved_at = COALESCE(company_members.approved_at, EXCLUDED.approved_at),
        updated_at = EXCLUDED.updated_at
      RETURNING id
    `,
    [
      memberId,
      input.companyId,
      input.userId,
      getCompanyAdminMemberRoleTemplateCode(),
      input.displayName,
      input.approvedAt,
    ],
  );
  const existing = await client.query<{ id: string }>(
    `
      SELECT id FROM company_members
      WHERE company_id = $1 AND user_id = $2
      LIMIT 1
    `,
    [input.companyId, input.userId],
  );
  return existing.rows[0]?.id ?? memberId;
}

async function insertMemberPermissions(
  client: DbTransactionClient,
  input: { companyMemberId: string; approvedBySystemUserId: string },
): Promise<void> {
  const permissionCodes = getMemberRoleTemplatePermissions(getCompanyAdminMemberRoleTemplateCode());
  const catalogItems = MEMBER_PERMISSION_CATALOG.filter((item) =>
    permissionCodes.includes(item.code),
  );

  for (const item of catalogItems) {
    await client.query(
      `
        INSERT INTO permission_catalog (
          permission_key,
          label,
          description,
          category,
          permission_group,
          label_key,
          description_key,
          is_system_permission,
          sort_order,
          is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
        ON CONFLICT (permission_key) DO UPDATE SET
          permission_group = EXCLUDED.permission_group,
          label_key = EXCLUDED.label_key,
          description_key = EXCLUDED.description_key,
          is_system_permission = EXCLUDED.is_system_permission,
          sort_order = EXCLUDED.sort_order,
          is_active = true,
          updated_at = now()
      `,
      [
        item.code,
        item.labelKey,
        item.descriptionKey,
        item.group,
        item.group,
        item.labelKey,
        item.descriptionKey,
        item.systemOnly,
        item.sortOrder,
      ],
    );
  }

  for (const permissionCode of permissionCodes as readonly MemberPermissionCode[]) {
    await client.query(
      `
        INSERT INTO member_permissions (company_member_id, permission_code, is_enabled, granted_by, granted_at)
        VALUES ($1, $2, true, NULL, now())
        ON CONFLICT (company_member_id, permission_code)
        DO UPDATE SET
          is_enabled = true,
          granted_at = now(),
          updated_at = now()
      `,
      [input.companyMemberId, permissionCode],
    );
  }
}

async function insertTrialSubscription(
  client: DbTransactionClient,
  input: { companyId: string; approvedAt: Date },
): Promise<string> {
  const subscriptionId = randomUUID();
  const trial = getTrialSnapshot(input.approvedAt);
  await client.query(
    `
      INSERT INTO company_subscriptions (
        id,
        company_id,
        plan_code,
        status,
        trial_started_at,
        trial_ends_at,
        current_period_started_at,
        current_period_ends_at,
        storage_limit_bytes,
        member_limit,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, 'trialing', $4, $5, $4, $5, $6, $7, $4, $4)
      ON CONFLICT (company_id) DO UPDATE SET
        plan_code = EXCLUDED.plan_code,
        status = 'trialing',
        trial_started_at = COALESCE(company_subscriptions.trial_started_at, EXCLUDED.trial_started_at),
        trial_ends_at = COALESCE(company_subscriptions.trial_ends_at, EXCLUDED.trial_ends_at),
        current_period_started_at = COALESCE(company_subscriptions.current_period_started_at, EXCLUDED.current_period_started_at),
        current_period_ends_at = COALESCE(company_subscriptions.current_period_ends_at, EXCLUDED.current_period_ends_at),
        storage_limit_bytes = EXCLUDED.storage_limit_bytes,
        member_limit = EXCLUDED.member_limit,
        updated_at = EXCLUDED.updated_at
      RETURNING id
    `,
    [
      subscriptionId,
      input.companyId,
      TRIAL_PLAN_CODE,
      trial.startedAt,
      trial.endsAt,
      trial.storageLimitBytes,
      trial.memberLimit,
    ],
  );
  const existing = await client.query<{ id: string }>(
    "SELECT id FROM company_subscriptions WHERE company_id = $1 LIMIT 1",
    [input.companyId],
  );
  return existing.rows[0]?.id ?? subscriptionId;
}

async function linkCertificateToCompanyFile(
  client: DbTransactionClient,
  input: {
    app: SignupProvisioningApplicationRow;
    certificate: CertificateRow;
    companyId: string;
    reviewedBySystemUserId: string;
    approvedAt: Date;
  },
): Promise<string> {
  if (input.certificate.approved_company_file_id) {
    return input.certificate.approved_company_file_id;
  }
  const companyFileId = randomUUID();
  await client.query(
    `
      INSERT INTO company_files (
        id,
        company_id,
        file_type,
        original_name,
        storage_key,
        mime_type,
        size_bytes,
        review_status,
        reviewed_by_system_user_id,
        reviewed_at,
        created_at,
        updated_at
      )
      VALUES ($1, $2, 'business_registration', $3, $4, $5, $6, 'approved', $7, $8, $8, $8)
    `,
    [
      companyFileId,
      input.companyId,
      input.certificate.original_name,
      input.certificate.storage_key,
      input.certificate.mime_type,
      input.certificate.size_bytes,
      input.reviewedBySystemUserId,
      input.approvedAt,
    ],
  );
  await client.query(
    `
      UPDATE signup_application_files
      SET reviewed_by_system_user_id = $3,
          reviewed_at = $4,
          approved_company_file_id = $5
      WHERE id = $1
        AND application_id = $2
        AND deleted_at IS NULL
    `,
    [
      input.certificate.id,
      input.app.id,
      input.reviewedBySystemUserId,
      input.approvedAt,
      companyFileId,
    ],
  );
  return companyFileId;
}

async function insertAuditLog(
  client: DbTransactionClient,
  input: {
    app: SignupProvisioningApplicationRow;
    approvedBySystemUserId: string;
    provisionedIds: SignupApplicationProvisionedIds;
    approvedAt: Date;
  },
): Promise<void> {
  await client.query(
    `
      INSERT INTO audit_logs (
        id,
        actor_user_id,
        actor_role,
        company_id,
        target_type,
        target_id,
        event_type,
        severity,
        summary,
        metadata,
        created_at
      )
      VALUES ($1, $2, 'system_admin', $3, 'company', $3, 'signup.approved', 'high', $4, $5::jsonb, $6)
    `,
    [
      randomUUID(),
      input.approvedBySystemUserId,
      input.provisionedIds.companyId,
      `${input.app.requested_company_name} 가입 승인 및 Trial provisioning`,
      JSON.stringify({
        applicationId: input.app.id,
        requestedPlanCode: input.app.requested_plan_code,
        companyId: input.provisionedIds.companyId,
        userId: input.provisionedIds.userId,
        companyMemberId: input.provisionedIds.companyMemberId,
        subscriptionId: input.provisionedIds.subscriptionId,
        trialStorageLimitBytes: TRIAL_STORAGE_LIMIT_BYTES,
        trialMemberLimit: TRIAL_MEMBER_LIMIT,
      }),
      input.approvedAt,
    ],
  );
}

async function markProvisioningFailedOutsideTransaction(input: {
  applicationId: string;
  approvedBySystemUserId: string;
  approvedAt: Date;
  errorCode: SignupProvisioningSafeCode;
}): Promise<void> {
  await withDbTransaction(async (client) => {
    await client.query(
      `
        UPDATE signup_applications
        SET status = 'provisioning_failed',
            provisioning_status = 'failed',
            provisioning_started_at = COALESCE(provisioning_started_at, $3),
            provisioning_error_code = $4,
            provisioning_attempt_count = provisioning_attempt_count + 1,
            reviewed_by_system_user_id = $2,
            reviewed_at = $3,
            updated_at = $3
        WHERE id = $1
          AND status = 'reviewing'
          AND provisioning_status IN ('not_started', 'in_progress')
      `,
      [
        input.applicationId,
        input.approvedBySystemUserId,
        input.approvedAt,
        input.errorCode,
      ],
    );
  });
}

function toSafeCode(error: unknown): SignupProvisioningSafeCode {
  if (error instanceof SignupProvisioningPlanError) return error.code;
  return "SIGNUP_PROVISIONING_FAILED";
}

function createBlockedPlan(input: {
  app: SignupProvisioningApplicationRow | null;
  approvedAt?: Date;
  blockingReasons: SignupProvisioningSafeCode[];
  wouldReuseUser?: boolean;
}): SignupProvisioningPlan {
  const trial = input.approvedAt ? getTrialSnapshot(input.approvedAt) : null;
  return {
    applicationId: input.app?.id ?? "",
    status: input.app?.status ?? null,
    canProvision: input.blockingReasons.length === 0,
    blockingReasons: input.blockingReasons,
    wouldCreateCompany: input.blockingReasons.length === 0,
    wouldCreateUser: input.blockingReasons.length === 0 && !input.wouldReuseUser,
    wouldReuseUser: input.blockingReasons.length === 0 && Boolean(input.wouldReuseUser),
    wouldCreateMembership: input.blockingReasons.length === 0,
    wouldAssignCompanyAdmin: input.blockingReasons.length === 0,
    wouldCreateTrialSubscription: input.blockingReasons.length === 0,
    wouldLinkCertificate: input.blockingReasons.length === 0,
    requestedPlanCode: input.app?.requested_plan_code ?? null,
    trial: {
      startedAt: iso(trial?.startedAt ?? null),
      endsAt: iso(trial?.endsAt ?? null),
      storageLimitBytes: TRIAL_STORAGE_LIMIT_BYTES,
      memberLimit: TRIAL_MEMBER_LIMIT,
    },
  };
}

export async function getSignupProvisioningPlan(input: {
  applicationId: string;
  approvedAt?: Date;
}): Promise<SignupProvisioningPlan> {
  const approvedAt = input.approvedAt ?? new Date();
  return withDbTransaction(async (client) => {
    const app = await selectApplicationSnapshot(client, input.applicationId.trim());
    if (!app) {
      return createBlockedPlan({
        app: null,
        approvedAt,
        blockingReasons: ["SIGNUP_APPROVAL_STATUS_CONFLICT"],
      });
    }
    const blockingReasons: SignupProvisioningSafeCode[] = [];
    let existingGoogleUser: UserRow | null = null;
    try {
      await assertProvisioningEligibility(client, app);
      existingGoogleUser = await selectUserByGoogleSub(client, app.google_sub);
    } catch (error) {
      blockingReasons.push(toSafeCode(error));
    }
    return createBlockedPlan({
      app,
      approvedAt,
      blockingReasons,
      wouldReuseUser: Boolean(existingGoogleUser),
    });
  });
}

export class PostgresSignupApprovalProvisioningRepository implements SignupApprovalProvisioningPort {
  async provisionApprovedSignup(
    input: SignupApprovalProvisioningInput,
  ): Promise<SignupApprovalProvisioningResult> {
    const approvedAt = input.approvedAt;
    try {
      return await withDbTransaction(async (client) => {
        const app = await selectApplicationForUpdate(client, input.application.id);
        if (!app) {
          throw new SignupProvisioningPlanError("SIGNUP_APPROVAL_STATUS_CONFLICT");
        }
        if (
          app.status === "approved"
          && app.provisioning_status === "completed"
          && app.created_company_id
          && app.created_user_id
          && app.created_company_member_id
          && app.created_subscription_id
        ) {
          const trial = getTrialSnapshot(approvedAt);
          return {
            provisionedIds: {
              companyId: app.created_company_id,
              userId: app.created_user_id,
              companyMemberId: app.created_company_member_id,
              subscriptionId: app.created_subscription_id,
            },
            trial,
          };
        }

        const certificate = await assertProvisioningEligibility(client, app);

        await client.query(
          `
            UPDATE signup_applications
            SET provisioning_status = 'in_progress',
                provisioning_started_at = COALESCE(provisioning_started_at, $3),
                provisioning_attempt_count = provisioning_attempt_count + 1,
                reviewed_by_system_user_id = $2,
                reviewed_at = $3,
                updated_at = $3
            WHERE id = $1
              AND status = 'reviewing'
              AND provisioning_status = 'not_started'
          `,
          [app.id, input.approvedBySystemUserId, approvedAt],
        );

        const companyId = await insertCompany(client, { app, approvedAt });
        const user = await findOrCreateUser(client, { app, companyId, approvedAt });
        const companyMemberId = await insertCompanyMember(client, {
          companyId,
          userId: user.userId,
          displayName: app.applicant_name,
          approvedAt,
        });
        await insertMemberPermissions(client, {
          companyMemberId,
          approvedBySystemUserId: input.approvedBySystemUserId,
        });
        await client.query(
          "UPDATE companies SET owner_user_id = $2, updated_at = $3 WHERE id = $1",
          [companyId, user.userId, approvedAt],
        );
        const subscriptionId = await insertTrialSubscription(client, { companyId, approvedAt });
        await linkCertificateToCompanyFile(client, {
          app,
          certificate,
          companyId,
          reviewedBySystemUserId: input.approvedBySystemUserId,
          approvedAt,
        });

        const provisionedIds = {
          companyId,
          userId: user.userId,
          companyMemberId,
          subscriptionId,
        };
        const trial = getTrialSnapshot(approvedAt);
        await client.query(
          `
            UPDATE signup_applications
            SET status = 'approved',
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
          `,
          [app.id, companyId, user.userId, companyMemberId, subscriptionId, approvedAt],
        );
        await insertAuditLog(client, {
          app,
          approvedBySystemUserId: input.approvedBySystemUserId,
          provisionedIds,
          approvedAt,
        });
        return { provisionedIds, trial };
      });
    } catch (error) {
      const safeCode = toSafeCode(error);
      if (safeCode === "SIGNUP_PROVISIONING_FAILED") {
        await markProvisioningFailedOutsideTransaction({
          applicationId: input.application.id,
          approvedBySystemUserId: input.approvedBySystemUserId,
          approvedAt,
          errorCode: safeCode,
        }).catch(() => undefined);
      }
      throw error;
    }
  }
}

export function createPostgresSignupApprovalProvisioningRepository(): SignupApprovalProvisioningPort {
  return new PostgresSignupApprovalProvisioningRepository();
}
