import { randomUUID } from "crypto";

import { isDatabaseConfigured, queryDb, withDbTransaction, type DbTransactionClient } from "@/lib/db/client";
import {
  MEMBER_PERMISSION_CATALOG,
  getMemberRoleTemplatePermissions,
  isMemberPermissionCode,
  type MemberPermissionCode,
  type MemberPermissionRoleTemplateCode,
} from "@/lib/permissions";
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
};

function toIsoString(value: Date | string | null): string | null {
  if (value === null) return null;
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
    invitation: row.invitation_id_joined && row.invitation_recipient_email && row.invitation_recipient_role && row.invitation_permission_preset && row.invitation_scope && row.invitation_status && row.invitation_expires_at
      ? {
          id: row.invitation_id_joined,
          companyId: row.invitation_company_id ?? null,
          recipientEmail: row.invitation_recipient_email,
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
      WHERE invitation_id = $1
        AND lower(applicant_email) = lower($2)
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
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')
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
        invitations.expires_at AS invitation_expires_at
      FROM join_requests
      LEFT JOIN invitations ON invitations.id = join_requests.invitation_id
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

function resolveJoinRequestCompanyId(joinRequest: JoinRequestRecord): string {
  const companyId = joinRequest.invitation?.companyId?.trim();
  if (!companyId) {
    throw new Error("INVITATION_COMPANY_REQUIRED");
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
        invitations.expires_at AS invitation_expires_at
      FROM join_requests
      LEFT JOIN invitations ON invitations.id = join_requests.invitation_id
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

    if (preferred.rows[0]) return preferred.rows[0];
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

    if (existingGoogleUser.rows[0]) return existingGoogleUser.rows[0];
  }

  const existing = await client.query<UserDbRow>(
    `
      SELECT id, company_id, email, name, role, google_sub, google_picture_url, phone, birthday
        FROM users
       WHERE company_id = $1
         AND lower(email) = lower($2)
       LIMIT 1
    `,
    [input.companyId, normalizedEmail],
  );

  if (existing.rows[0]) {
    if (input.googleSub?.trim() && !existing.rows[0].google_sub) {
      await client.query(
        `
          UPDATE users
             SET google_sub = $2,
                 google_picture_url = COALESCE($3, google_picture_url),
                 phone = COALESCE($4, phone),
                 phone_source = CASE WHEN $4::text IS NULL THEN phone_source ELSE COALESCE(phone_source, 'user') END,
                 updated_at = now()
           WHERE id = $1
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
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::text, CASE WHEN $8::text IS NULL THEN NULL ELSE 'user' END, NULL, NULL, true)
      RETURNING id, company_id, email, name, role, google_sub, google_picture_url, phone, birthday
    `,
    [
      randomUUID(),
      input.companyId,
      normalizedEmail,
      displayName,
      input.roleTemplateCode,
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
      SELECT id, company_id, user_id, status, role_template_code
        FROM company_members
       WHERE company_id = $1
         AND user_id = $2
       LIMIT 1
    `,
    [input.companyId, input.userId],
  );

  if (existing.rows[0]) {
    throw new Error("COMPANY_MEMBER_ALREADY_EXISTS");
  }

  const result = await client.query<CompanyMemberDbRow>(
    `
      INSERT INTO company_members (
        company_id,
        user_id,
        status,
        role_template_code,
        display_name,
        approved_by,
        approved_at
      )
      VALUES ($1, $2, 'approved', $3, $4, $5, now())
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

  for (const permissionCode of input.permissionCodes) {
    await client.query(
      `
        INSERT INTO member_permissions (company_member_id, permission_code, is_enabled, granted_by, granted_at)
        VALUES ($1, $2, true, $3, now())
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

function normalizeCompanyName(value: string | null | undefined): string {
  return value?.trim() || "";
}

function resolveCompanyAdminPermissionCodes(): readonly MemberPermissionCode[] {
  return normalizeMemberPermissionCodeList(null, COMPANY_ADMIN_ROLE_TEMPLATE_CODE);
}

async function assertCompanyNameAvailable(
  client: DbTransactionClient,
  companyName: string,
): Promise<void> {
  const existing = await client.query<CompanyDbRow>(
    `
      SELECT id, name, business_name, storage_limit_bytes
        FROM companies
       WHERE lower(name) = lower($1)
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
      INSERT INTO companies (id, name, business_name, memo, is_active)
      VALUES ($1, $2, $3, $4, true)
      RETURNING id, name, business_name, storage_limit_bytes
    `,
    [
      companyId,
      input.companyName,
      normalizeText(input.businessName),
      normalizeText(input.memo),
    ],
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("COMPANY_CREATE_FAILED");
  }

  return row;
}

async function assignCompanyOwner(
  client: DbTransactionClient,
  input: { companyId: string; userId: string },
): Promise<void> {
  await client.query(
    `
      UPDATE companies
         SET owner_user_id = $2,
             updated_at = now()
       WHERE id = $1
    `,
    [input.companyId, input.userId],
  );
}

async function approveDbCompanyJoinRequest(
  input: CompanyJoinRequestApproveInput,
): Promise<CompanyJoinRequestApprovalResult> {
  return withDbTransaction(async (client) => {
    const joinRequest = await selectDbJoinRequestById(client, input.requestId);
    if (!joinRequest) {
      throw new Error("JOIN_REQUEST_NOT_FOUND");
    }

    assertPendingCompanyJoinRequest(joinRequest);

    const companyName = normalizeCompanyName(joinRequest.requestedCompanyName);
    await assertCompanyNameAvailable(client, companyName);

    const company = await insertApprovedCompany(client, {
      companyName,
      businessName: joinRequest.businessName,
      memo: joinRequest.requestMemo,
    });
    const permissionCodes = resolveCompanyAdminPermissionCodes();
    const user = await findOrCreateMemberUser(client, {
      companyId: company.id,
      applicantEmail: joinRequest.applicantEmail,
      applicantName: joinRequest.applicantName,
      roleTemplateCode: COMPANY_ADMIN_ROLE_TEMPLATE_CODE,
      preferredUserId: joinRequest.userId,
    });
    const companyMember = await insertApprovedCompanyMember(client, {
      companyId: company.id,
      userId: user.id,
      displayName: joinRequest.applicantName,
      roleTemplateCode: COMPANY_ADMIN_ROLE_TEMPLATE_CODE,
      approvedByUserId: null,
    });

    await assignCompanyOwner(client, { companyId: company.id, userId: user.id });

    await insertMemberPermissions(client, {
      companyMemberId: companyMember.id,
      permissionCodes,
      grantedByUserId: null,
    });

    await client.query(
      `
        UPDATE join_requests
           SET status = 'approved',
               user_id = $2,
               reviewed_by_system_user_id = $3,
               reviewed_at = now(),
               created_company_id = $4,
               updated_at = now()
         WHERE id = $1
      `,
      [joinRequest.id, user.id, input.approvedBySystemUserId ?? null, company.id],
    );

    if (joinRequest.invitationId) {
      await client.query(
        `
          UPDATE invitations
             SET status = 'accepted',
                 accepted_at = now(),
                 accepted_user_id = $2,
                 updated_at = now()
           WHERE id = $1
        `,
        [joinRequest.invitationId, user.id],
      );
    }

    const standardsInitialization = await initializeCompanyStandards({
      companyId: company.id,
      transactionClient: client,
    });

    const updatedJoinRequest = await selectDbJoinRequestById(client, joinRequest.id);
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
      standardsInitialization,
    };
  });
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
    const reasonCode = normalizeText(input.reasonCode) ?? "system_admin_rejected";

    await client.query(
      `
        UPDATE join_requests
           SET status = 'rejected',
               reviewed_by_system_user_id = $2,
               reviewed_at = now(),
               rejection_reason = $3,
               updated_at = now()
         WHERE id = $1
      `,
      [joinRequest.id, input.rejectedBySystemUserId ?? null, reasonCode],
    );

    if (joinRequest.invitationId) {
      await client.query(
        `
          UPDATE invitations
             SET status = 'cancelled',
                 cancelled_at = now(),
                 cancelled_by_system_user_id = $2,
                 updated_at = now()
           WHERE id = $1
             AND status IN ('pending', 'active')
        `,
        [joinRequest.invitationId, input.rejectedBySystemUserId ?? null],
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

async function approveDbMemberJoinRequest(
  input: MemberJoinRequestApproveInput,
): Promise<MemberJoinRequestApprovalResult> {
  return withDbTransaction(async (client) => {
    const joinRequest = await selectDbJoinRequestById(client, input.requestId);
    if (!joinRequest) {
      throw new Error("JOIN_REQUEST_NOT_FOUND");
    }

    assertPendingMemberJoinRequest(joinRequest);

    const companyId = resolveJoinRequestCompanyId(joinRequest);
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
               user_id = $2,
               reviewed_by_user_id = $3,
               reviewed_at = now(),
               updated_at = now()
         WHERE id = $1
      `,
      [joinRequest.id, user.id, input.approvedByUserId ?? null],
    );

    if (joinRequest.invitationId) {
      await client.query(
        `
          UPDATE invitations
             SET status = 'accepted',
                 accepted_at = now(),
                 accepted_user_id = $2,
                 updated_at = now()
           WHERE id = $1
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
    const reasonCode = normalizeText(input.reasonCode) ?? "customer_admin_rejected";

    await client.query(
      `
        UPDATE join_requests
           SET status = 'rejected',
               reviewed_by_user_id = $2,
               reviewed_at = now(),
               rejection_reason = $3,
               updated_at = now()
         WHERE id = $1
      `,
      [joinRequest.id, input.rejectedByUserId ?? null, reasonCode],
    );

    if (joinRequest.invitationId) {
      await client.query(
        `
          UPDATE invitations
             SET status = 'cancelled',
                 cancelled_at = now(),
                 cancelled_by_user_id = $2,
                 updated_at = now()
           WHERE id = $1
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
      companyId: joinRequest.invitation?.companyId ?? null,
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

  const companyId = resolveJoinRequestCompanyId(joinRequest);
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

  return { joinRequest: updated, companyId: joinRequest.invitation?.companyId ?? null };
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
      if (!trimmedId) {
        throw new Error("JOIN_REQUEST_ID_REQUIRED");
      }

      if (isDatabaseConfigured()) {
        return approveDbMemberJoinRequest({ ...input, requestId: trimmedId });
      }

      return approveInMemoryMemberJoinRequest({ ...input, requestId: trimmedId });
    },

    async rejectMemberJoinRequest(input: MemberJoinRequestRejectInput): Promise<MemberJoinRequestRejectionResult> {
      const trimmedId = input.requestId.trim();
      if (!trimmedId) {
        throw new Error("JOIN_REQUEST_ID_REQUIRED");
      }

      if (isDatabaseConfigured()) {
        return rejectDbMemberJoinRequest({ ...input, requestId: trimmedId });
      }

      return rejectInMemoryMemberJoinRequest({ ...input, requestId: trimmedId });
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
  };
}

export const joinRequestRepository = createJoinRequestRepository();
