import { randomUUID } from "crypto";

import { isDatabaseConfigured, queryDb, withDbTransaction, type DbTransactionClient } from "@/lib/db/client";
import {
  MEMBER_PERMISSION_CATALOG,
  getMemberRoleTemplatePermissions,
  isMemberPermissionCode,
  type MemberPermissionCode,
  type MemberPermissionRoleTemplateCode,
} from "@/lib/permissions";
import {
  getTrialEndsAt,
  TRIAL_MEMBER_LIMIT,
  TRIAL_PLAN_CODE,
  TRIAL_STORAGE_LIMIT_BYTES,
} from "@/lib/billing/companyTrialPolicy";
import { initializeCompanyStandards } from "@/lib/system/standards/companyStandardsInitializationRepository";
import { invitationRepository } from "./invitationRepository";
import type { InvitationRecord, InvitationScope } from "./invitationTypes";
import type {
  JoinRequestCreateResult,
  JoinRequestDraft,
  JoinRequestRecord,
  JoinRequestLookupInput,
  JoinRequestListResult,
  JoinRequestRepository,
  JoinRequestType,
  CompanyJoinRequestApproveInput,
  CompanyJoinRequestApprovalResult,
  CompanyJoinRequestRejectInput,
  CompanyJoinRequestRejectionResult,
  CompanyJoinRequestReopenInput,
  CompanyJoinRequestReopenResult,
  MemberJoinRequestApproveInput,
  MemberJoinRequestApprovalResult,
  MemberJoinRequestRejectInput,
  MemberJoinRequestRejectionResult,
} from "./joinRequestTypes";

const inMemoryJoinRequests: JoinRequestRecord[] = [];

function normalizeText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function readExpectedScope(requestType: JoinRequestType): InvitationRecord["scope"] {
  return requestType === "company" ? "system_to_company_admin" : "company_to_member";
}

function assertJoinRequestInput(draft: JoinRequestDraft): void {
  if (!draft.rawToken.trim()) {
    throw new Error("INVITATION_TOKEN_REQUIRED");
  }

  if (!draft.applicantName.trim()) {
    throw new Error("APPLICANT_NAME_REQUIRED");
  }

  if (!draft.applicantEmail.trim()) {
    throw new Error("APPLICANT_EMAIL_REQUIRED");
  }

  if (draft.requestType === "company" && !draft.requestedCompanyName?.trim()) {
    throw new Error("REQUESTED_COMPANY_NAME_REQUIRED");
  }
}

function assertInvitationMatchesRequest(
  invitation: InvitationRecord,
  draft: JoinRequestDraft,
): void {
  const expectedScope = readExpectedScope(draft.requestType);

  if (invitation.scope !== expectedScope) {
    throw new Error("INVITATION_SCOPE_MISMATCH");
  }

  if (invitation.status !== "pending" && invitation.status !== "active") {
    throw new Error("INVITATION_NOT_ACTIVE");
  }

  if (new Date(invitation.expiresAt).getTime() <= Date.now()) {
    throw new Error("INVITATION_EXPIRED");
  }
}

type JoinRequestDbRow = {
  id: string;
  invitation_id: string | null;
  user_id: string | null;
  applicant_email: string;
  request_type: JoinRequestType;
  requested_company_name: string | null;
  business_name: string | null;
  applicant_name: string | null;
  applicant_phone: string | null;
  google_sub: string | null;
  google_picture_url: string | null;
  request_memo: string | null;
  status: JoinRequestRecord["status"];
  reviewed_by_user_id: string | null;
  reviewed_by_system_user_id: string | null;
  reviewed_at: Date | string | null;
  created_company_id: string | null;
  rejection_reason: string | null;
  created_at: Date | string;
  updated_at: Date | string;
  invitation_id_joined?: string | null;
  invitation_company_id?: string | null;
  invitation_recipient_email?: string | null;
  invitation_recipient_role?: InvitationRecord["recipientRole"] | null;
  invitation_permission_preset?: InvitationRecord["permissionPreset"] | null;
  invitation_scope?: InvitationScope | null;
  invitation_status?: InvitationRecord["status"] | null;
  invitation_expires_at?: Date | string | null;
  created_company_onboarding_status?: string | null;
  created_company_subscription_status?: string | null;
  created_company_requested_plan_code?: string | null;
  created_company_trial_ends_at?: Date | string | null;
};

function toIsoString(value: Date | string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toJoinRequestRecord(row: JoinRequestDbRow): JoinRequestRecord {
  return {
    id: row.id,
    invitationId: row.invitation_id,
    userId: row.user_id,
    applicantEmail: row.applicant_email,
    requestType: row.request_type,
    requestedCompanyName: row.requested_company_name,
    businessName: row.business_name,
    applicantName: row.applicant_name,
    applicantPhone: row.applicant_phone,
    googleSub: row.google_sub,
    googlePictureUrl: row.google_picture_url,
    requestMemo: row.request_memo,
    status: row.status,
    reviewedByUserId: row.reviewed_by_user_id,
    reviewedBySystemUserId: row.reviewed_by_system_user_id,
    reviewedAt: toIsoString(row.reviewed_at),
    createdCompanyId: row.created_company_id,
    rejectionReason: row.rejection_reason,
    createdAt: toIsoString(row.created_at) ?? new Date().toISOString(),
    updatedAt: toIsoString(row.updated_at) ?? new Date().toISOString(),
    companyOnboardingStatus: row.created_company_onboarding_status ?? null,
    companySubscriptionStatus: row.created_company_subscription_status ?? null,
    companyRequestedPlanCode: row.created_company_requested_plan_code ?? null,
    companyTrialEndsAt: toIsoString(row.created_company_trial_ends_at),
    invitation: row.invitation_id_joined && row.invitation_recipient_role && row.invitation_permission_preset && row.invitation_scope && row.invitation_status && row.invitation_expires_at
      ? {
          id: row.invitation_id_joined,
          companyId: row.invitation_company_id ?? null,
          recipientEmail: row.invitation_recipient_email ?? null,
          recipientRole: row.invitation_recipient_role,
          permissionPreset: row.invitation_permission_preset,
          scope: row.invitation_scope,
          status: row.invitation_status,
          expiresAt: toIsoString(row.invitation_expires_at) ?? new Date().toISOString(),
        }
      : null,
  };
}

function createInMemoryJoinRequest(
  invitation: InvitationRecord,
  draft: JoinRequestDraft,
): JoinRequestRecord {
  const now = new Date().toISOString();

  const existing = inMemoryJoinRequests.find(
    (item) =>
      item.invitationId === invitation.id &&
      item.status === "pending" &&
      item.applicantEmail === normalizeEmail(draft.applicantEmail),
  );

  if (existing) {
    throw new Error("JOIN_REQUEST_ALREADY_PENDING");
  }

  return {
    id: randomUUID(),
    invitationId: invitation.id,
    userId: draft.userId ?? null,
    applicantEmail: normalizeEmail(draft.applicantEmail),
    requestType: draft.requestType,
    requestedCompanyName: normalizeText(draft.requestedCompanyName),
    businessName: normalizeText(draft.businessName),
    applicantName: normalizeText(draft.applicantName),
    applicantPhone: normalizeText(draft.applicantPhone),
    googleSub: normalizeText(draft.googleSub),
    googlePictureUrl: normalizeText(draft.googlePictureUrl),
    requestMemo: normalizeText(draft.requestMemo),
    status: "pending",
    reviewedByUserId: null,
    reviewedBySystemUserId: null,
    reviewedAt: null,
    createdCompanyId: null,
    rejectionReason: null,
    createdAt: now,
    updatedAt: now,
  };
}

async function createDbJoinRequest(
  invitation: InvitationRecord,
  draft: JoinRequestDraft,
): Promise<JoinRequestRecord> {
  const existing = await queryDb<JoinRequestDbRow>(
    `
      SELECT
        id,
        invitation_id,
        user_id,
        applicant_email,
        request_type,
        requested_company_name,
        business_name,
        applicant_name,
        applicant_phone,
        google_sub,
        google_picture_url,
        request_memo,
        status,
        reviewed_by_user_id,
        reviewed_by_system_user_id,
        reviewed_at,
        created_company_id,
        rejection_reason,
        created_at,
        updated_at
      FROM join_requests
      WHERE invitation_id = $1::text
        AND lower(applicant_email) = lower($2::text)
        AND status = 'pending'
      LIMIT 1
    `,
    [invitation.id, normalizeEmail(draft.applicantEmail)],
  );

  if (existing.rows[0]) {
    throw new Error("JOIN_REQUEST_ALREADY_PENDING");
  }

  const result = await queryDb<JoinRequestDbRow>(
    `
      INSERT INTO join_requests (
        invitation_id,
        user_id,
        applicant_email,
        request_type,
        requested_company_name,
        business_name,
        applicant_name,
        applicant_phone,
        google_sub,
        google_picture_url,
        request_memo,
        status
      )
      VALUES ($1::text, $2::text, $3::text, $4::text, $5::text, $6::text, $7::text, $8::text, $9::text, $10::text, $11::text, 'pending')
      RETURNING
        id,
        invitation_id,
        user_id,
        applicant_email,
        request_type,
        requested_company_name,
        business_name,
        applicant_name,
        applicant_phone,
        google_sub,
        google_picture_url,
        request_memo,
        status,
        reviewed_by_user_id,
        reviewed_by_system_user_id,
        reviewed_at,
        created_company_id,
        rejection_reason,
        created_at,
        updated_at
    `,
    [
      invitation.id,
      draft.userId ?? null,
      normalizeEmail(draft.applicantEmail),
      draft.requestType,
      normalizeText(draft.requestedCompanyName),
      normalizeText(draft.businessName),
      normalizeText(draft.applicantName),
      normalizeText(draft.applicantPhone),
      normalizeText(draft.googleSub),
      normalizeText(draft.googlePictureUrl),
      normalizeText(draft.requestMemo),
    ],
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("JOIN_REQUEST_CREATE_FAILED");
  }

  return toJoinRequestRecord(row);
}


function normalizeLookupLimit(limit: number | null | undefined): number {
  if (!limit || !Number.isFinite(limit)) return 10;
  return Math.min(Math.max(Math.trunc(limit), 1), 50);
}

function filterInMemoryJoinRequests(input: JoinRequestLookupInput): JoinRequestRecord[] {
  const normalizedEmail = input.applicantEmail ? normalizeEmail(input.applicantEmail) : null;
  const limit = normalizeLookupLimit(input.limit);

  return inMemoryJoinRequests
    .filter((item) => {
      if (input.id && item.id !== input.id) return false;
      if (normalizedEmail && item.applicantEmail !== normalizedEmail) return false;
      if (input.requestType && item.requestType !== input.requestType) return false;
      if (input.status && item.status !== input.status) return false;
      if (input.invitationScope && item.invitation?.scope !== input.invitationScope) return false;
      if (input.invitationCompanyId && item.invitation?.companyId !== input.invitationCompanyId) return false;
      // In-memory mode does not carry company onboarding rows; keep only DB-backed filtering for this field.
      return true;
    })
    .slice(0, limit);
}

function buildJoinRequestListResult(joinRequests: JoinRequestRecord[]): JoinRequestListResult {
  return {
    joinRequests,
    primaryJoinRequest: joinRequests[0] ?? null,
  };
}

async function listDbJoinRequests(input: JoinRequestLookupInput): Promise<JoinRequestRecord[]> {
  const conditions: string[] = [];
  const values: Array<string | number> = [];

  if (input.id?.trim()) {
    values.push(input.id.trim());
    conditions.push(`join_requests.id = $${values.length}`);
  }

  if (input.applicantEmail?.trim()) {
    values.push(normalizeEmail(input.applicantEmail));
    conditions.push(`lower(join_requests.applicant_email) = lower($${values.length})`);
  }

  if (input.requestType) {
    values.push(input.requestType);
    conditions.push(`join_requests.request_type = $${values.length}`);
  }

  if (input.status) {
    values.push(input.status);
    conditions.push(`join_requests.status = $${values.length}`);
  }

  if (input.invitationScope) {
    values.push(input.invitationScope);
    conditions.push(`invitations.scope = $${values.length}`);
  }

  if (input.invitationCompanyId?.trim()) {
    values.push(input.invitationCompanyId.trim());
    conditions.push(`invitations.company_id = $${values.length}`);
  }

  if (input.createdCompanyOnboardingStatus?.trim()) {
    values.push(input.createdCompanyOnboardingStatus.trim());
    conditions.push(`created_companies.onboarding_status = $${values.length}`);
  }

  values.push(normalizeLookupLimit(input.limit));

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const result = await queryDb<JoinRequestDbRow>(
    `
      SELECT
        join_requests.id,
        join_requests.invitation_id,
        join_requests.user_id,
        join_requests.applicant_email,
        join_requests.request_type,
        join_requests.requested_company_name,
        join_requests.business_name,
        join_requests.applicant_name,
        join_requests.applicant_phone,
        join_requests.google_sub,
        join_requests.google_picture_url,
        join_requests.request_memo,
        join_requests.status,
        join_requests.reviewed_by_user_id,
        join_requests.reviewed_by_system_user_id,
        join_requests.reviewed_at,
        join_requests.created_company_id,
        join_requests.rejection_reason,
        join_requests.created_at,
        join_requests.updated_at,
        invitations.id AS invitation_id_joined,
        invitations.company_id AS invitation_company_id,
        invitations.recipient_email AS invitation_recipient_email,
        invitations.recipient_role AS invitation_recipient_role,
        invitations.permission_preset AS invitation_permission_preset,
        invitations.scope AS invitation_scope,
        invitations.status AS invitation_status,
        invitations.expires_at AS invitation_expires_at,
        created_companies.onboarding_status AS created_company_onboarding_status,
        created_companies.subscription_status AS created_company_subscription_status,
        created_companies.requested_plan_code AS created_company_requested_plan_code,
        created_companies.trial_ends_at AS created_company_trial_ends_at
      FROM join_requests
      LEFT JOIN invitations ON invitations.id = join_requests.invitation_id
      LEFT JOIN companies created_companies ON created_companies.id = join_requests.created_company_id
      ${whereClause}
      ORDER BY join_requests.created_at DESC
      LIMIT $${values.length}
    `,
    values,
  );

  return result.rows.map(toJoinRequestRecord);
}

function readRedirectPath(requestType: JoinRequestType, joinRequestId: string): string {
  const typeParam = requestType === "company" ? "company" : "member";
  return `/pending?type=${typeParam}&requestId=${encodeURIComponent(joinRequestId)}`;
}


type UserDbRow = {
  id: string;
  company_id: string;
  email: string | null;
  name: string;
  role: string;
  google_sub?: string | null;
  google_picture_url?: string | null;
  phone?: string | null;
  birthday?: string | Date | null;
};

type CompanyMemberDbRow = {
  id: string;
  company_id: string;
  user_id: string;
  status: string;
  role_template_code: string | null;
};

const MEMBER_ROLE_TEMPLATE_CODES: readonly MemberPermissionRoleTemplateCode[] = [
  "company_admin",
  "designer",
  "inspector",
  "inventory_manager",
  "viewer",
] as const;

const MEMBER_INVITATION_ROLE_TEMPLATE_CODES: readonly MemberPermissionRoleTemplateCode[] = [
  "designer",
  "inspector",
  "inventory_manager",
  "viewer",
] as const;

function isMemberRoleTemplateCode(value: string | null | undefined): value is MemberPermissionRoleTemplateCode {
  return MEMBER_ROLE_TEMPLATE_CODES.includes(value as MemberPermissionRoleTemplateCode);
}

function isMemberInvitationRoleTemplateCode(value: string | null | undefined): value is MemberPermissionRoleTemplateCode {
  return MEMBER_INVITATION_ROLE_TEMPLATE_CODES.includes(value as MemberPermissionRoleTemplateCode);
}

function resolveMemberRoleTemplateCode(
  joinRequest: JoinRequestRecord,
  requestedRoleTemplateCode?: MemberPermissionRoleTemplateCode | null,
): MemberPermissionRoleTemplateCode {
  if (isMemberInvitationRoleTemplateCode(requestedRoleTemplateCode)) {
    return requestedRoleTemplateCode;
  }

  if (isMemberInvitationRoleTemplateCode(joinRequest.invitation?.permissionPreset)) {
    return joinRequest.invitation.permissionPreset;
  }

  if (isMemberInvitationRoleTemplateCode(joinRequest.invitation?.recipientRole)) {
    return joinRequest.invitation.recipientRole;
  }

  return "viewer";
}

function isCompanyMemberPermissionCode(value: string): value is MemberPermissionCode {
  const permission = MEMBER_PERMISSION_CATALOG.find((item) => item.code === value);
  return Boolean(permission && !permission.systemOnly && isMemberPermissionCode(value));
}

function normalizeMemberPermissionCodeList(
  permissionCodes: readonly MemberPermissionCode[] | null | undefined,
  roleTemplateCode: MemberPermissionRoleTemplateCode,
): readonly MemberPermissionCode[] {
  const source = permissionCodes && permissionCodes.length > 0
    ? permissionCodes
    : getMemberRoleTemplatePermissions(roleTemplateCode);

  return Array.from(
    new Set(
      source.filter((permissionCode): permissionCode is MemberPermissionCode =>
        typeof permissionCode === "string" && isCompanyMemberPermissionCode(permissionCode),
      ),
    ),
  );
}

function assertPendingMemberJoinRequest(joinRequest: JoinRequestRecord): void {
  if (joinRequest.requestType !== "member") {
    throw new Error("JOIN_REQUEST_MEMBER_ONLY");
  }

  if (joinRequest.status !== "pending") {
    throw new Error("JOIN_REQUEST_ALREADY_REVIEWED");
  }

  if (joinRequest.invitation?.scope !== "company_to_member") {
    throw new Error("INVITATION_SCOPE_MISMATCH");
  }
}

function assertPendingCompanyJoinRequest(joinRequest: JoinRequestRecord): void {
  if (joinRequest.requestType !== "company") {
    throw new Error("JOIN_REQUEST_COMPANY_ONLY");
  }

  if (joinRequest.status !== "pending") {
    throw new Error("JOIN_REQUEST_ALREADY_REVIEWED");
  }

  if (joinRequest.invitation?.scope !== "system_to_company_admin") {
    throw new Error("INVITATION_SCOPE_MISMATCH");
  }

  if (!joinRequest.requestedCompanyName?.trim()) {
    throw new Error("REQUESTED_COMPANY_NAME_REQUIRED");
  }
}

function assertRejectedCompanyJoinRequest(joinRequest: JoinRequestRecord): void {
  if (joinRequest.requestType !== "company") {
    throw new Error("JOIN_REQUEST_COMPANY_ONLY");
  }

  if (joinRequest.status !== "rejected" && joinRequest.companyOnboardingStatus !== "rejected") {
    throw new Error("COMPANY_JOIN_REQUEST_REOPEN_TARGET_REQUIRED");
  }

  if (joinRequest.invitation?.scope !== "system_to_company_admin") {
    throw new Error("INVITATION_SCOPE_MISMATCH");
  }
}

function resolveJoinRequestCompanyId(joinRequest: JoinRequestRecord): string {
  const companyId = joinRequest.invitation?.companyId?.trim();
  if (!companyId) {
    throw new Error("INVITATION_COMPANY_REQUIRED");
  }

  return companyId;
}

function assertJoinRequestCompanyScope(
  joinRequest: JoinRequestRecord,
  expectedCompanyId: string,
): string {
  const companyId = resolveJoinRequestCompanyId(joinRequest);
  if (companyId !== expectedCompanyId.trim()) {
    throw new Error("JOIN_REQUEST_COMPANY_SCOPE_MISMATCH");
  }

  return companyId;
}

async function selectDbJoinRequestById(
  client: DbTransactionClient,
  requestId: string,
): Promise<JoinRequestRecord | null> {
  const result = await client.query<JoinRequestDbRow>(
    `
      SELECT
        join_requests.id,
        join_requests.invitation_id,
        join_requests.user_id,
        join_requests.applicant_email,
        join_requests.request_type,
        join_requests.requested_company_name,
        join_requests.business_name,
        join_requests.applicant_name,
        join_requests.applicant_phone,
        join_requests.google_sub,
        join_requests.google_picture_url,
        join_requests.request_memo,
        join_requests.status,
        join_requests.reviewed_by_user_id,
        join_requests.reviewed_by_system_user_id,
        join_requests.reviewed_at,
        join_requests.created_company_id,
        join_requests.rejection_reason,
        join_requests.created_at,
        join_requests.updated_at,
        invitations.id AS invitation_id_joined,
        invitations.company_id AS invitation_company_id,
        invitations.recipient_email AS invitation_recipient_email,
        invitations.recipient_role AS invitation_recipient_role,
        invitations.permission_preset AS invitation_permission_preset,
        invitations.scope AS invitation_scope,
        invitations.status AS invitation_status,
        invitations.expires_at AS invitation_expires_at,
        created_companies.onboarding_status AS created_company_onboarding_status,
        created_companies.subscription_status AS created_company_subscription_status,
        created_companies.requested_plan_code AS created_company_requested_plan_code,
        created_companies.trial_ends_at AS created_company_trial_ends_at
      FROM join_requests
      LEFT JOIN invitations ON invitations.id = join_requests.invitation_id
      LEFT JOIN companies created_companies ON created_companies.id = join_requests.created_company_id
      WHERE join_requests.id = $1
      LIMIT 1
    `,
    [requestId],
  );

  const row = result.rows[0];
  return row ? toJoinRequestRecord(row) : null;
}

async function findOrCreateMemberUser(
  client: DbTransactionClient,
  input: {
    companyId: string;
    applicantEmail: string;
    applicantName: string | null;
    applicantPhone?: string | null;
    googleSub?: string | null;
    googlePictureUrl?: string | null;
    roleTemplateCode: MemberPermissionRoleTemplateCode;
    preferredUserId?: string | null;
  },
): Promise<UserDbRow> {
  const normalizedEmail = normalizeEmail(input.applicantEmail);

  if (input.preferredUserId?.trim()) {
    const preferred = await client.query<UserDbRow>(
      `SELECT id, company_id, email, name, role, google_sub, google_picture_url, phone, birthday FROM users WHERE id = $1 LIMIT 1`,
      [input.preferredUserId.trim()],
    );

    if (preferred.rows[0]) {
      const updated = await client.query<UserDbRow>(
        `
          UPDATE users
             SET company_id = $2::text,
                 name = COALESCE($3::text, name),
                 role = $4::text,
                 google_sub = COALESCE($5::text, google_sub),
                 google_picture_url = COALESCE($6::text, google_picture_url),
                 phone = COALESCE($7::text, phone),
                 phone_source = CASE WHEN $7::text IS NULL THEN phone_source ELSE COALESCE(phone_source, 'user') END,
                 updated_at = now()
           WHERE id = $1::text
           RETURNING id, company_id, email, name, role, google_sub, google_picture_url, phone, birthday
        `,
        [
          preferred.rows[0].id,
          input.companyId,
          normalizeText(input.applicantName),
          getUserRoleForRoleTemplate(input.roleTemplateCode),
          normalizeText(input.googleSub),
          normalizeText(input.googlePictureUrl),
          normalizeText(input.applicantPhone),
        ],
      );
      return updated.rows[0] ?? preferred.rows[0];
    }
  }

  if (input.googleSub?.trim()) {
    const existingGoogleUser = await client.query<UserDbRow>(
      `
        SELECT id, company_id, email, name, role, google_sub, google_picture_url, phone, birthday
          FROM users
         WHERE google_sub = $1
         LIMIT 1
      `,
      [input.googleSub.trim()],
    );

    if (existingGoogleUser.rows[0]) {
      const updated = await client.query<UserDbRow>(
        `
          UPDATE users
             SET company_id = $2::text,
                 name = COALESCE($3::text, name),
                 role = $4::text,
                 google_picture_url = COALESCE($5::text, google_picture_url),
                 phone = COALESCE($6::text, phone),
                 phone_source = CASE WHEN $6::text IS NULL THEN phone_source ELSE COALESCE(phone_source, 'user') END,
                 updated_at = now()
           WHERE id = $1::text
           RETURNING id, company_id, email, name, role, google_sub, google_picture_url, phone, birthday
        `,
        [
          existingGoogleUser.rows[0].id,
          input.companyId,
          normalizeText(input.applicantName),
          getUserRoleForRoleTemplate(input.roleTemplateCode),
          normalizeText(input.googlePictureUrl),
          normalizeText(input.applicantPhone),
        ],
      );
      return updated.rows[0] ?? existingGoogleUser.rows[0];
    }
  }

  const existing = await client.query<UserDbRow>(
    `
      SELECT id, company_id, email, name, role, google_sub, google_picture_url, phone, birthday
        FROM users
       WHERE company_id = $1::text
         AND lower(email) = lower($2::text)
       LIMIT 1
    `,
    [input.companyId, normalizedEmail],
  );

  if (existing.rows[0]) {
    if (input.googleSub?.trim() && !existing.rows[0].google_sub) {
      await client.query(
        `
          UPDATE users
             SET google_sub = $2::text,
                 google_picture_url = COALESCE($3::text, google_picture_url),
                 phone = COALESCE($4::text, phone),
                 phone_source = CASE WHEN $4::text IS NULL THEN phone_source ELSE COALESCE(phone_source, 'user') END,
                 updated_at = now()
           WHERE id = $1::text
        `,
        [
          existing.rows[0].id,
          input.googleSub.trim(),
          normalizeText(input.googlePictureUrl),
          normalizeText(input.applicantPhone),
        ],
      );
    }
    return existing.rows[0];
  }

  const displayName = input.applicantName?.trim() || normalizedEmail;
  const result = await client.query<UserDbRow>(
    `
      INSERT INTO users (
        id,
        company_id,
        email,
        name,
        role,
        google_sub,
        google_picture_url,
        phone,
        phone_source,
        birthday,
        birthday_source,
        is_active
      )
      VALUES ($1::text, $2::text, $3::text, $4::text, $5::text, $6::text, $7::text, $8::text, CASE WHEN $8::text IS NULL THEN NULL ELSE 'user' END, NULL, NULL, true)
      RETURNING id, company_id, email, name, role, google_sub, google_picture_url, phone, birthday
    `,
    [
      randomUUID(),
      input.companyId,
      normalizedEmail,
      displayName,
      getUserRoleForRoleTemplate(input.roleTemplateCode),
      normalizeText(input.googleSub),
      normalizeText(input.googlePictureUrl),
      normalizeText(input.applicantPhone),
    ],
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("MEMBER_USER_CREATE_FAILED");
  }

  return row;
}

async function insertApprovedCompanyMember(
  client: DbTransactionClient,
  input: {
    companyId: string;
    userId: string;
    displayName: string | null;
    roleTemplateCode: MemberPermissionRoleTemplateCode;
    approvedByUserId?: string | null;
  },
): Promise<CompanyMemberDbRow> {
  const existing = await client.query<CompanyMemberDbRow>(
    `
      WITH approval_input AS (
        SELECT
          $1::text AS company_id,
          $2::text AS user_id
      )
      SELECT company_members.id,
             company_members.company_id,
             company_members.user_id,
             company_members.status,
             company_members.role_template_code
        FROM company_members
        JOIN approval_input
          ON company_members.company_id = approval_input.company_id
         AND company_members.user_id = approval_input.user_id
       LIMIT 1
    `,
    [input.companyId, input.userId],
  );

  if (existing.rows[0]) {
    const updated = await client.query<CompanyMemberDbRow>(
      `
        WITH approval_input AS (
          SELECT
            $1::text AS member_id,
            $2::text AS role_template_code,
            $3::text AS display_name,
            $4::text AS approved_by
        )
        UPDATE company_members
           SET status = 'approved',
               role_template_code = approval_input.role_template_code,
               display_name = COALESCE(approval_input.display_name, company_members.display_name),
               approved_by = approval_input.approved_by,
               approved_at = COALESCE(company_members.approved_at, now()),
               rejected_by = NULL,
               rejected_at = NULL,
               suspended_by = NULL,
               suspended_at = NULL,
               updated_at = now()
          FROM approval_input
         WHERE company_members.id = approval_input.member_id
         RETURNING company_members.id,
                   company_members.company_id,
                   company_members.user_id,
                   company_members.status,
                   company_members.role_template_code
      `,
      [
        existing.rows[0].id,
        input.roleTemplateCode,
        input.displayName,
        input.approvedByUserId ?? null,
      ],
    );

    return updated.rows[0] ?? existing.rows[0];
  }

  const result = await client.query<CompanyMemberDbRow>(
    `
      WITH approval_input AS (
        SELECT
          $1::text AS company_id,
          $2::text AS user_id,
          $3::text AS role_template_code,
          $4::text AS display_name,
          $5::text AS approved_by
      )
      INSERT INTO company_members (
        company_id,
        user_id,
        status,
        role_template_code,
        display_name,
        approved_by,
        approved_at
      )
      SELECT
        approval_input.company_id,
        approval_input.user_id,
        'approved'::text,
        approval_input.role_template_code,
        approval_input.display_name,
        approval_input.approved_by,
        now()
      FROM approval_input
      RETURNING id, company_id, user_id, status, role_template_code
    `,
    [
      input.companyId,
      input.userId,
      input.roleTemplateCode,
      input.displayName,
      input.approvedByUserId ?? null,
    ],
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("COMPANY_MEMBER_CREATE_FAILED");
  }

  return row;
}

async function ensureMemberPermissionCatalogEntries(
  client: DbTransactionClient,
  permissionCodes: readonly MemberPermissionCode[],
): Promise<void> {
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
        VALUES ($1::text, $2::text, $3::text, $4::text, $5::text, $6::text, $7::text, $8::boolean, $9::integer, true)
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
}


async function insertMemberPermissions(
  client: DbTransactionClient,
  input: {
    companyMemberId: string;
    permissionCodes: readonly MemberPermissionCode[];
    grantedByUserId?: string | null;
  },
): Promise<void> {
  if (input.permissionCodes.length === 0) {
    throw new Error("MEMBER_PERMISSION_REQUIRED");
  }

  await ensureMemberPermissionCatalogEntries(client, input.permissionCodes);

  for (const permissionCode of input.permissionCodes) {
    await client.query(
      `
        INSERT INTO member_permissions (company_member_id, permission_code, is_enabled, granted_by, granted_at)
        VALUES ($1::text, $2::text, true, $3::text, now())
        ON CONFLICT (company_member_id, permission_code)
        DO UPDATE SET
          is_enabled = true,
          granted_by = EXCLUDED.granted_by,
          granted_at = now(),
          updated_at = now()
      `,
      [input.companyMemberId, permissionCode, input.grantedByUserId ?? null],
    );
  }
}


type CompanyDbRow = {
  id: string;
  name: string;
  business_name: string | null;
  storage_limit_bytes: number | string | null;
};

const COMPANY_ADMIN_ROLE_TEMPLATE_CODE: MemberPermissionRoleTemplateCode = "company_admin";

function getUserRoleForRoleTemplate(roleTemplateCode: MemberPermissionRoleTemplateCode): string {
  return roleTemplateCode === COMPANY_ADMIN_ROLE_TEMPLATE_CODE ? "admin" : roleTemplateCode;
}

function normalizeCompanyName(value: string | null | undefined): string {
  return value?.trim() || "";
}

function resolveCompanyAdminPermissionCodes(): readonly MemberPermissionCode[] {
  return normalizeMemberPermissionCodeList(null, COMPANY_ADMIN_ROLE_TEMPLATE_CODE);
}

async function assertCompanyNameAvailable(
  client: DbTransactionClient,
  companyName: string,
  exceptCompanyId?: string | null,
): Promise<void> {
  const trimmedExceptCompanyId = exceptCompanyId?.trim() || null;
  const existing = trimmedExceptCompanyId
    ? await client.query<CompanyDbRow>(
        `
          SELECT id, name, business_name, storage_limit_bytes
            FROM companies
           WHERE lower(name) = lower($1::text)
             AND id <> $2::text
           LIMIT 1
        `,
        [companyName, trimmedExceptCompanyId],
      )
    : await client.query<CompanyDbRow>(
        `
          SELECT id, name, business_name, storage_limit_bytes
            FROM companies
           WHERE lower(name) = lower($1::text)
           LIMIT 1
        `,
        [companyName],
      );

  if (existing.rows[0]) {
    throw new Error("COMPANY_ALREADY_EXISTS");
  }
}

async function insertApprovedCompany(
  client: DbTransactionClient,
  input: {
    companyName: string;
    businessName?: string | null;
    memo?: string | null;
  },
): Promise<CompanyDbRow> {
  const companyId = randomUUID();
  const result = await client.query<CompanyDbRow>(
    `
      INSERT INTO companies (
        id,
        name,
        business_name,
        memo,
        is_active,
        onboarding_status,
        billing_status,
        subscription_status,
        trial_started_at,
        trial_ends_at,
        storage_limit_bytes,
        member_limit
      )
      VALUES ($1::text, $2::text, $3::text, $4::text, true, 'active', 'trial', 'trialing', $5::timestamptz, $6::timestamptz, $7::bigint, $8::integer)
      RETURNING id, name, business_name, storage_limit_bytes
    `,
    [
      companyId,
      input.companyName,
      normalizeText(input.businessName),
      normalizeText(input.memo),
      new Date().toISOString(),
      getTrialEndsAt().toISOString(),
      TRIAL_STORAGE_LIMIT_BYTES,
      TRIAL_MEMBER_LIMIT,
    ],
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("COMPANY_CREATE_FAILED");
  }

  return row;
}

async function approveExistingProfileRequiredCompany(
  client: DbTransactionClient,
  input: {
    companyId: string;
    companyName: string;
    businessName?: string | null;
    memo?: string | null;
  },
): Promise<CompanyDbRow> {
  const trialStartedAt = new Date();
  const trialEndsAt = getTrialEndsAt(trialStartedAt);

  const result = await client.query<CompanyDbRow>(
    `
      UPDATE companies
         SET name = $2::text,
             business_name = $3::text,
             memo = $4::text,
             is_active = true,
             onboarding_status = 'active',
             billing_status = 'trial',
             subscription_status = 'trialing',
             trial_started_at = $5::timestamptz,
             trial_ends_at = $6::timestamptz,
             storage_limit_bytes = COALESCE(storage_limit_bytes, $7::bigint),
             member_limit = COALESCE(member_limit, $8::integer),
             updated_at = now()
       WHERE id = $1::text
       RETURNING id, name, business_name, storage_limit_bytes
    `,
    [
      input.companyId,
      input.companyName,
      normalizeText(input.businessName),
      normalizeText(input.memo),
      trialStartedAt.toISOString(),
      trialEndsAt.toISOString(),
      TRIAL_STORAGE_LIMIT_BYTES,
      TRIAL_MEMBER_LIMIT,
    ],
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("COMPANY_APPROVAL_TARGET_NOT_FOUND");
  }

  return row;
}

async function assignTrialPlanToCompany(
  client: DbTransactionClient,
  companyId: string,
): Promise<void> {
  await client.query(
    `
      INSERT INTO company_plan_assignments (
        company_id,
        plan_id,
        status,
        override_storage_limit_bytes,
        override_member_limit,
        override_price_krw,
        override_memo,
        starts_at,
        ends_at
      )
      SELECT
        $1::text,
        plans.id,
        'active',
        $2::bigint,
        $3::integer,
        0,
        '7일 무료 체험 자동 부여',
        now(),
        now() + interval '7 days'
      FROM plans
      WHERE plans.code = $4::text
      ON CONFLICT DO NOTHING
    `,
    [companyId, TRIAL_STORAGE_LIMIT_BYTES, TRIAL_MEMBER_LIMIT, TRIAL_PLAN_CODE],
  );
}

async function assignCompanyOwner(
  client: DbTransactionClient,
  input: { companyId: string; userId: string },
): Promise<void> {
  await client.query(
    `
      UPDATE companies
         SET owner_user_id = $2::text,
             updated_at = now()
       WHERE id = $1::text
    `,
    [input.companyId, input.userId],
  );
}


async function resolveExistingSystemReviewerId(
  client: DbTransactionClient,
  systemUserId: string | null | undefined,
): Promise<string | null> {
  const trimmed = systemUserId?.trim();
  if (!trimmed) return null;

  const result = await client.query<{ id: string }>(
    `
      SELECT id
        FROM system_users
       WHERE id = $1::text
       LIMIT 1
    `,
    [trimmed],
  );

  return result.rows[0]?.id ?? null;
}


function createSkippedStandardsInitializationResult(
  companyId: string,
): Awaited<ReturnType<typeof initializeCompanyStandards>> {
  return {
    companyId,
    unitStandardsLinked: 0,
    processStandardsLinked: 0,
    productCategoriesCopied: 0,
    defaultTemplateId: null,
    skippedProductCategories: true,
    repository: { mode: "unavailable", supportsWrite: false },
  };
}



function normalizeDbApprovalStepError(stage: string, error: unknown): Error {
  const rawMessage = error instanceof Error ? error.message : String(error || "UNKNOWN_APPROVAL_ERROR");
  if (rawMessage.startsWith("COMPANY_APPROVAL_STEP_FAILED:")) {
    return error instanceof Error ? error : new Error(rawMessage);
  }

  if (rawMessage.includes("could not determine data type of parameter")) {
    return new Error(`COMPANY_APPROVAL_STEP_FAILED:${stage}:POSTGRES_PARAMETER_TYPE_ERROR:${rawMessage}`);
  }

  return new Error(`COMPANY_APPROVAL_STEP_FAILED:${stage}:${rawMessage}`);
}

async function runCompanyApprovalStep<TResult>(
  stage: string,
  operation: () => Promise<TResult>,
): Promise<TResult> {
  try {
    return await operation();
  } catch (error) {
    throw normalizeDbApprovalStepError(stage, error);
  }
}

async function approveDbCompanyJoinRequest(
  input: CompanyJoinRequestApproveInput,
): Promise<CompanyJoinRequestApprovalResult> {
  const approval = await withDbTransaction(async (client) => {
    const joinRequest = await runCompanyApprovalStep("select_join_request", () =>
      selectDbJoinRequestById(client, input.requestId),
    );
    if (!joinRequest) {
      throw new Error("JOIN_REQUEST_NOT_FOUND");
    }

    assertPendingCompanyJoinRequest(joinRequest);

    const reviewedBySystemUserId = await runCompanyApprovalStep("resolve_system_reviewer", () =>
      resolveExistingSystemReviewerId(client, input.approvedBySystemUserId),
    );
    const companyName = normalizeCompanyName(joinRequest.requestedCompanyName);
    await runCompanyApprovalStep("assert_company_name", () =>
      assertCompanyNameAvailable(client, companyName, joinRequest.createdCompanyId),
    );

    const company = joinRequest.createdCompanyId
      ? await runCompanyApprovalStep("approve_existing_company", () =>
          approveExistingProfileRequiredCompany(client, {
            companyId: joinRequest.createdCompanyId as string,
            companyName,
            businessName: joinRequest.businessName,
            memo: joinRequest.requestMemo,
          }),
        )
      : await runCompanyApprovalStep("insert_company", () =>
          insertApprovedCompany(client, {
            companyName,
            businessName: joinRequest.businessName,
            memo: joinRequest.requestMemo,
          }),
        );
    await runCompanyApprovalStep("assign_trial_plan", () => assignTrialPlanToCompany(client, company.id));

    const permissionCodes = resolveCompanyAdminPermissionCodes();
    const user = await runCompanyApprovalStep("find_or_create_user", () =>
      findOrCreateMemberUser(client, {
        companyId: company.id,
        applicantEmail: joinRequest.applicantEmail,
        applicantName: joinRequest.applicantName,
        applicantPhone: joinRequest.applicantPhone,
        googleSub: joinRequest.googleSub,
        googlePictureUrl: joinRequest.googlePictureUrl,
        roleTemplateCode: COMPANY_ADMIN_ROLE_TEMPLATE_CODE,
        preferredUserId: joinRequest.userId,
      }),
    );
    const companyMember = await runCompanyApprovalStep("insert_company_member", () =>
      insertApprovedCompanyMember(client, {
        companyId: company.id,
        userId: user.id,
        displayName: joinRequest.applicantName,
        roleTemplateCode: COMPANY_ADMIN_ROLE_TEMPLATE_CODE,
        approvedByUserId: null,
      }),
    );

    await runCompanyApprovalStep("assign_company_owner", () =>
      assignCompanyOwner(client, { companyId: company.id, userId: user.id }),
    );

    await runCompanyApprovalStep("insert_member_permissions", () =>
      insertMemberPermissions(client, {
        companyMemberId: companyMember.id,
        permissionCodes,
        grantedByUserId: null,
      }),
    );

    await runCompanyApprovalStep("update_join_request", () =>
      client.query(
        `
          UPDATE join_requests
             SET status = 'approved',
                 user_id = $2::text,
                 reviewed_by_system_user_id = $3::text,
                 reviewed_at = now(),
                 created_company_id = $4::text,
                 updated_at = now()
           WHERE id = $1::text
        `,
        [joinRequest.id, user.id, reviewedBySystemUserId, company.id],
      ),
    );

    if (joinRequest.invitationId) {
      await runCompanyApprovalStep("update_invitation", () =>
        client.query(
          `
            UPDATE invitations
               SET status = 'accepted',
                   accepted_at = now(),
                   accepted_user_id = $2::text,
                   updated_at = now()
             WHERE id = $1::text
          `,
          [joinRequest.invitationId, user.id],
        ),
      );
    }

    const updatedJoinRequest = await runCompanyApprovalStep("reload_join_request", () =>
      selectDbJoinRequestById(client, joinRequest.id),
    );
    if (!updatedJoinRequest) {
      throw new Error("JOIN_REQUEST_NOT_FOUND");
    }

    return {
      joinRequest: updatedJoinRequest,
      companyId: company.id,
      companyName: company.name,
      userId: user.id,
      companyMemberId: companyMember.id,
      permissionCodes,
    };
  });

  const standardsInitialization = await initializeCompanyStandards({
    companyId: approval.companyId,
  }).catch(() => createSkippedStandardsInitializationResult(approval.companyId));

  return {
    ...approval,
    standardsInitialization,
  };
}

function approveInMemoryCompanyJoinRequest(
  input: CompanyJoinRequestApproveInput,
): CompanyJoinRequestApprovalResult {
  const index = inMemoryJoinRequests.findIndex((item) => item.id === input.requestId);
  const joinRequest = index >= 0 ? inMemoryJoinRequests[index] : null;
  if (!joinRequest) throw new Error("JOIN_REQUEST_NOT_FOUND");
  assertPendingCompanyJoinRequest(joinRequest);

  const now = new Date().toISOString();
  const companyId = randomUUID();
  const userId = joinRequest.userId ?? randomUUID();
  const companyMemberId = randomUUID();
  const updated: JoinRequestRecord = {
    ...joinRequest,
    userId,
    status: "approved",
    reviewedBySystemUserId: input.approvedBySystemUserId ?? null,
    reviewedAt: now,
    createdCompanyId: companyId,
    updatedAt: now,
  };
  inMemoryJoinRequests[index] = updated;

  return {
    joinRequest: updated,
    companyId,
    companyName: normalizeCompanyName(joinRequest.requestedCompanyName),
    userId,
    companyMemberId,
    permissionCodes: resolveCompanyAdminPermissionCodes(),
    standardsInitialization: {
      companyId,
      unitStandardsLinked: 0,
      processStandardsLinked: 0,
      productCategoriesCopied: 0,
      defaultTemplateId: null,
      skippedProductCategories: false,
      repository: { mode: "unavailable", supportsWrite: false },
    },
  };
}


async function rejectDbCompanyJoinRequest(
  input: CompanyJoinRequestRejectInput,
): Promise<CompanyJoinRequestRejectionResult> {
  return withDbTransaction(async (client) => {
    const joinRequest = await selectDbJoinRequestById(client, input.requestId);
    if (!joinRequest) {
      throw new Error("JOIN_REQUEST_NOT_FOUND");
    }

    assertPendingCompanyJoinRequest(joinRequest);
    const rejectedBySystemUserId = await resolveExistingSystemReviewerId(client, input.rejectedBySystemUserId);
    const reasonCode = normalizeText(input.reasonCode) ?? "system_admin_rejected";

    await client.query(
      `
        UPDATE join_requests
           SET status = 'rejected',
               reviewed_by_system_user_id = $2::text,
               reviewed_at = now(),
               rejection_reason = $3::text,
               updated_at = now()
         WHERE id = $1::text
      `,
      [joinRequest.id, rejectedBySystemUserId, reasonCode],
    );

    if (joinRequest.createdCompanyId) {
      await client.query(
        `
          UPDATE companies
             SET onboarding_status = 'rejected',
                 subscription_status = 'canceled',
                 trial_started_at = NULL,
                 trial_ends_at = NULL,
                 updated_at = now()
           WHERE id = $1::text
             AND onboarding_status = 'approval_pending'
        `,
        [joinRequest.createdCompanyId],
      );
    }

    if (joinRequest.invitationId) {
      await client.query(
        `
          UPDATE invitations
             SET status = 'cancelled',
                 cancelled_at = now(),
                 cancelled_by_system_user_id = $2::text,
                 updated_at = now()
           WHERE id = $1::text
             AND status IN ('pending', 'active')
        `,
        [joinRequest.invitationId, rejectedBySystemUserId],
      );
    }

    const updatedJoinRequest = await selectDbJoinRequestById(client, joinRequest.id);
    if (!updatedJoinRequest) {
      throw new Error("JOIN_REQUEST_NOT_FOUND");
    }

    return { joinRequest: updatedJoinRequest };
  });
}

function rejectInMemoryCompanyJoinRequest(
  input: CompanyJoinRequestRejectInput,
): CompanyJoinRequestRejectionResult {
  const index = inMemoryJoinRequests.findIndex((item) => item.id === input.requestId);
  const joinRequest = index >= 0 ? inMemoryJoinRequests[index] : null;
  if (!joinRequest) throw new Error("JOIN_REQUEST_NOT_FOUND");
  assertPendingCompanyJoinRequest(joinRequest);

  const now = new Date().toISOString();
  const updated: JoinRequestRecord = {
    ...joinRequest,
    status: "rejected",
    reviewedBySystemUserId: input.rejectedBySystemUserId ?? null,
    reviewedAt: now,
    rejectionReason: normalizeText(input.reasonCode) ?? "system_admin_rejected",
    updatedAt: now,
  };
  inMemoryJoinRequests[index] = updated;

  return { joinRequest: updated };
}

async function reopenDbCompanyJoinRequest(
  input: CompanyJoinRequestReopenInput,
): Promise<CompanyJoinRequestReopenResult> {
  return withDbTransaction(async (client) => {
    const joinRequest = await selectDbJoinRequestById(client, input.requestId);
    if (!joinRequest) {
      throw new Error("JOIN_REQUEST_NOT_FOUND");
    }

    assertRejectedCompanyJoinRequest(joinRequest);

    await client.query(
      `
        UPDATE join_requests
           SET status = 'pending',
               reviewed_by_system_user_id = NULL,
               reviewed_at = NULL,
               rejection_reason = NULL,
               updated_at = now()
         WHERE id = $1::text
      `,
      [joinRequest.id],
    );

    if (joinRequest.createdCompanyId) {
      await client.query(
        `
          UPDATE companies
             SET onboarding_status = 'profile_required',
                 onboarding_completed_at = NULL,
                 billing_status = 'trial',
                 subscription_status = 'trialing',
                 trial_started_at = NULL,
                 trial_ends_at = NULL,
                 updated_at = now()
           WHERE id = $1::text
        `,
        [joinRequest.createdCompanyId],
      );
    }

    const updatedJoinRequest = await selectDbJoinRequestById(client, joinRequest.id);
    if (!updatedJoinRequest) {
      throw new Error("JOIN_REQUEST_NOT_FOUND");
    }

    return { joinRequest: updatedJoinRequest };
  });
}

function reopenInMemoryCompanyJoinRequest(
  input: CompanyJoinRequestReopenInput,
): CompanyJoinRequestReopenResult {
  const index = inMemoryJoinRequests.findIndex((item) => item.id === input.requestId);
  const joinRequest = index >= 0 ? inMemoryJoinRequests[index] : null;
  if (!joinRequest) throw new Error("JOIN_REQUEST_NOT_FOUND");
  assertRejectedCompanyJoinRequest(joinRequest);

  const now = new Date().toISOString();
  const updated: JoinRequestRecord = {
    ...joinRequest,
    status: "pending",
    reviewedBySystemUserId: null,
    reviewedAt: null,
    rejectionReason: null,
    updatedAt: now,
  };
  inMemoryJoinRequests[index] = updated;

  return { joinRequest: updated };
}

async function approveDbMemberJoinRequest(
  input: MemberJoinRequestApproveInput,
): Promise<MemberJoinRequestApprovalResult> {
  return withDbTransaction(async (client) => {
    const joinRequest = await selectDbJoinRequestById(client, input.requestId);
    if (!joinRequest) {
      throw new Error("JOIN_REQUEST_NOT_FOUND");
    }

    assertPendingMemberJoinRequest(joinRequest);

    const companyId = assertJoinRequestCompanyScope(joinRequest, input.companyId);
    const roleTemplateCode = resolveMemberRoleTemplateCode(joinRequest, input.roleTemplateCode);
    const permissionCodes = normalizeMemberPermissionCodeList(input.permissionCodes, roleTemplateCode);
    const user = await findOrCreateMemberUser(client, {
      companyId,
      applicantEmail: joinRequest.applicantEmail,
      applicantName: joinRequest.applicantName,
      applicantPhone: joinRequest.applicantPhone,
      googleSub: joinRequest.googleSub,
      googlePictureUrl: joinRequest.googlePictureUrl,
      roleTemplateCode,
      preferredUserId: joinRequest.userId,
    });
    const companyMember = await insertApprovedCompanyMember(client, {
      companyId,
      userId: user.id,
      displayName: joinRequest.applicantName,
      roleTemplateCode,
      approvedByUserId: input.approvedByUserId ?? null,
    });

    await insertMemberPermissions(client, {
      companyMemberId: companyMember.id,
      permissionCodes,
      grantedByUserId: input.approvedByUserId ?? null,
    });

    await client.query(
      `
        UPDATE join_requests
           SET status = 'approved',
               user_id = $2::text,
               reviewed_by_user_id = $3::text,
               reviewed_at = now(),
               updated_at = now()
         WHERE id = $1::text
      `,
      [joinRequest.id, user.id, input.approvedByUserId ?? null],
    );

    if (joinRequest.invitationId) {
      await client.query(
        `
          UPDATE invitations
             SET status = 'accepted',
                 accepted_at = now(),
                 accepted_user_id = $2::text,
                 updated_at = now()
           WHERE id = $1::text
        `,
        [joinRequest.invitationId, user.id],
      );
    }

    const updatedJoinRequest = await selectDbJoinRequestById(client, joinRequest.id);
    if (!updatedJoinRequest) {
      throw new Error("JOIN_REQUEST_NOT_FOUND");
    }

    return {
      joinRequest: updatedJoinRequest,
      companyMemberId: companyMember.id,
      userId: user.id,
      companyId,
      permissionCodes,
      roleTemplateCode,
    };
  });
}

async function rejectDbMemberJoinRequest(
  input: MemberJoinRequestRejectInput,
): Promise<MemberJoinRequestRejectionResult> {
  return withDbTransaction(async (client) => {
    const joinRequest = await selectDbJoinRequestById(client, input.requestId);
    if (!joinRequest) {
      throw new Error("JOIN_REQUEST_NOT_FOUND");
    }

    assertPendingMemberJoinRequest(joinRequest);
    const companyId = assertJoinRequestCompanyScope(joinRequest, input.companyId);
    const reasonCode = normalizeText(input.reasonCode) ?? "customer_admin_rejected";

    await client.query(
      `
        UPDATE join_requests
           SET status = 'rejected',
               reviewed_by_user_id = $2::text,
               reviewed_at = now(),
               rejection_reason = $3::text,
               updated_at = now()
         WHERE id = $1::text
      `,
      [joinRequest.id, input.rejectedByUserId ?? null, reasonCode],
    );

    if (joinRequest.invitationId) {
      await client.query(
        `
          UPDATE invitations
             SET status = 'cancelled',
                 cancelled_at = now(),
                 cancelled_by_user_id = $2::text,
                 updated_at = now()
           WHERE id = $1::text
             AND status IN ('pending', 'active')
        `,
        [joinRequest.invitationId, input.rejectedByUserId ?? null],
      );
    }

    const updatedJoinRequest = await selectDbJoinRequestById(client, joinRequest.id);
    if (!updatedJoinRequest) {
      throw new Error("JOIN_REQUEST_NOT_FOUND");
    }

    return {
      joinRequest: updatedJoinRequest,
      companyId,
    };
  });
}

function approveInMemoryMemberJoinRequest(
  input: MemberJoinRequestApproveInput,
): MemberJoinRequestApprovalResult {
  const index = inMemoryJoinRequests.findIndex((item) => item.id === input.requestId);
  const joinRequest = index >= 0 ? inMemoryJoinRequests[index] : null;
  if (!joinRequest) throw new Error("JOIN_REQUEST_NOT_FOUND");
  assertPendingMemberJoinRequest(joinRequest);

  const companyId = assertJoinRequestCompanyScope(joinRequest, input.companyId);
  const roleTemplateCode = resolveMemberRoleTemplateCode(joinRequest, input.roleTemplateCode);
  const permissionCodes = normalizeMemberPermissionCodeList(input.permissionCodes, roleTemplateCode);
  const userId = joinRequest.userId ?? randomUUID();
  const companyMemberId = randomUUID();
  const now = new Date().toISOString();
  const updated: JoinRequestRecord = {
    ...joinRequest,
    userId,
    status: "approved",
    reviewedByUserId: input.approvedByUserId ?? null,
    reviewedAt: now,
    updatedAt: now,
  };
  inMemoryJoinRequests[index] = updated;

  return { joinRequest: updated, companyMemberId, userId, companyId, permissionCodes, roleTemplateCode };
}

function rejectInMemoryMemberJoinRequest(input: MemberJoinRequestRejectInput): MemberJoinRequestRejectionResult {
  const index = inMemoryJoinRequests.findIndex((item) => item.id === input.requestId);
  const joinRequest = index >= 0 ? inMemoryJoinRequests[index] : null;
  if (!joinRequest) throw new Error("JOIN_REQUEST_NOT_FOUND");
  assertPendingMemberJoinRequest(joinRequest);
  const companyId = assertJoinRequestCompanyScope(joinRequest, input.companyId);

  const now = new Date().toISOString();
  const updated: JoinRequestRecord = {
    ...joinRequest,
    status: "rejected",
    reviewedByUserId: input.rejectedByUserId ?? null,
    reviewedAt: now,
    rejectionReason: normalizeText(input.reasonCode) ?? "customer_admin_rejected",
    updatedAt: now,
  };
  inMemoryJoinRequests[index] = updated;

  return { joinRequest: updated, companyId };
}

export function createJoinRequestRepository(): JoinRequestRepository {
  return {
    async createJoinRequest(draft: JoinRequestDraft): Promise<JoinRequestCreateResult> {
      assertJoinRequestInput(draft);

      const invitation = await invitationRepository.findInvitationByRawToken(draft.rawToken);
      if (!invitation) {
        throw new Error("INVITATION_NOT_FOUND");
      }

      assertInvitationMatchesRequest(invitation, draft);

      const joinRequest = isDatabaseConfigured()
        ? await createDbJoinRequest(invitation, draft)
        : createInMemoryJoinRequest(invitation, draft);

      if (!isDatabaseConfigured()) {
        inMemoryJoinRequests.unshift(joinRequest);
      }

      return {
        invitation,
        joinRequest,
        redirectPath: readRedirectPath(draft.requestType, joinRequest.id),
      };
    },

    async listJoinRequests(input: JoinRequestLookupInput): Promise<JoinRequestListResult> {
      const joinRequests = isDatabaseConfigured()
        ? await listDbJoinRequests(input)
        : filterInMemoryJoinRequests(input);

      return buildJoinRequestListResult(joinRequests);
    },

    async findJoinRequestById(id: string): Promise<JoinRequestRecord | null> {
      const trimmedId = id.trim();
      if (!trimmedId) return null;

      const result = await this.listJoinRequests({ id: trimmedId, limit: 1 });
      return result.primaryJoinRequest;
    },

    async approveMemberJoinRequest(input: MemberJoinRequestApproveInput): Promise<MemberJoinRequestApprovalResult> {
      const trimmedId = input.requestId.trim();
      const companyId = input.companyId.trim();
      if (!companyId) {
        throw new Error("COMPANY_ID_REQUIRED");
      }
      if (!trimmedId) {
        throw new Error("JOIN_REQUEST_ID_REQUIRED");
      }

      if (isDatabaseConfigured()) {
        return approveDbMemberJoinRequest({ ...input, companyId, requestId: trimmedId });
      }

      return approveInMemoryMemberJoinRequest({ ...input, companyId, requestId: trimmedId });
    },

    async rejectMemberJoinRequest(input: MemberJoinRequestRejectInput): Promise<MemberJoinRequestRejectionResult> {
      const trimmedId = input.requestId.trim();
      const companyId = input.companyId.trim();
      if (!companyId) {
        throw new Error("COMPANY_ID_REQUIRED");
      }
      if (!trimmedId) {
        throw new Error("JOIN_REQUEST_ID_REQUIRED");
      }

      if (isDatabaseConfigured()) {
        return rejectDbMemberJoinRequest({ ...input, companyId, requestId: trimmedId });
      }

      return rejectInMemoryMemberJoinRequest({ ...input, companyId, requestId: trimmedId });
    },

    async approveCompanyJoinRequest(input: CompanyJoinRequestApproveInput): Promise<CompanyJoinRequestApprovalResult> {
      const trimmedId = input.requestId.trim();
      if (!trimmedId) {
        throw new Error("JOIN_REQUEST_ID_REQUIRED");
      }

      if (isDatabaseConfigured()) {
        return approveDbCompanyJoinRequest({ ...input, requestId: trimmedId });
      }

      return approveInMemoryCompanyJoinRequest({ ...input, requestId: trimmedId });
    },

    async rejectCompanyJoinRequest(input: CompanyJoinRequestRejectInput): Promise<CompanyJoinRequestRejectionResult> {
      const trimmedId = input.requestId.trim();
      if (!trimmedId) {
        throw new Error("JOIN_REQUEST_ID_REQUIRED");
      }

      if (isDatabaseConfigured()) {
        return rejectDbCompanyJoinRequest({ ...input, requestId: trimmedId });
      }

      return rejectInMemoryCompanyJoinRequest({ ...input, requestId: trimmedId });
    },
    async reopenCompanyJoinRequest(input: CompanyJoinRequestReopenInput): Promise<CompanyJoinRequestReopenResult> {
      const trimmedId = input.requestId.trim();
      if (!trimmedId) {
        throw new Error("JOIN_REQUEST_ID_REQUIRED");
      }

      if (isDatabaseConfigured()) {
        return reopenDbCompanyJoinRequest({ ...input, requestId: trimmedId });
      }

      return reopenInMemoryCompanyJoinRequest({ ...input, requestId: trimmedId });
    },
  };
}

export const joinRequestRepository = createJoinRequestRepository();
