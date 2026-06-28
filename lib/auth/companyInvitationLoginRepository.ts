import "server-only";

import { randomUUID } from "crypto";

import { isDatabaseConfigured, withDbTransaction, type DbTransactionClient } from "@/lib/db/client";
import type { GoogleUserProfile } from "./googleOAuth";
import type { WaflSessionPayload } from "./session";
import { invitationRepository } from "@/lib/invitations/invitationRepository";
import { getMemberRoleTemplatePermissions } from "@/lib/permissions";
import { SESSION_ROLE } from "@/lib/constants/sessionRoles";
import { MEMBER_ROLE_TEMPLATE_CODE } from "@/lib/permissions/memberPermissionMatrix";

const COMPANY_ADMIN_ROLE_TEMPLATE_CODE = MEMBER_ROLE_TEMPLATE_CODE.companyAdmin;

type CompanyAdminInvitationLoginResult = {
  redirectPath: string;
  session: WaflSessionPayload;
};

type CompanyRow = {
  id: string;
  name: string;
};

type UserRow = {
  id: string;
  company_id: string;
  company_name?: string | null;
  email: string | null;
  name: string;
  google_sub: string | null;
  google_picture_url: string | null;
  role: string;
};

type CompanyMemberRow = {
  id: string;
  company_id: string;
  user_id: string;
  status: string;
  role_template_code: string | null;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function buildDraftCompanyName(): string {
  return "회사 정보 입력 전";
}

async function findExistingUser(client: DbTransactionClient, profile: GoogleUserProfile): Promise<UserRow | null> {
  const result = await client.query<UserRow>(
    `
      SELECT
        users.id,
        users.company_id,
        companies.name AS company_name,
        users.email,
        users.name,
        users.google_sub,
        users.google_picture_url,
        users.role
        FROM users
        LEFT JOIN companies ON companies.id = users.company_id
       WHERE users.google_sub = $1::text
          OR lower(users.email) = lower($2::text)
       ORDER BY CASE WHEN users.google_sub = $1::text THEN 0 ELSE 1 END
       LIMIT 1
    `,
    [profile.sub, normalizeEmail(profile.email)],
  );

  return result.rows[0] ?? null;
}

async function createProfileRequiredCompany(client: DbTransactionClient): Promise<CompanyRow> {
  const result = await client.query<CompanyRow>(
    `
      INSERT INTO companies (
        id,
        name,
        business_name,
        memo,
        is_active,
        onboarding_status,
        status
      )
      VALUES ($1::text, $2::text, NULL, 'system invitation pending onboarding', true, 'profile_required', 'pending')
      RETURNING id, name
    `,
    [randomUUID(), buildDraftCompanyName()],
  );

  const row = result.rows[0];
  if (!row) throw new Error("COMPANY_CREATE_FAILED");
  return row;
}

async function createCompanyAdminUser(
  client: DbTransactionClient,
  input: { companyId: string; profile: GoogleUserProfile },
): Promise<UserRow> {
  const existing = await findExistingUser(client, input.profile);
  if (existing) {
    if (existing.company_id !== input.companyId) {
      throw new Error("GOOGLE_ACCOUNT_ALREADY_LINKED");
    }

    const updated = await client.query<UserRow>(
      `
        UPDATE users
           SET google_sub = COALESCE(google_sub, $2::text),
               email = COALESCE(NULLIF(email, ''), $3::text),
               name = COALESCE(NULLIF(name, ''), $4::text),
               google_picture_url = $5::text,
               role = 'admin',
               last_login_at = now(),
               updated_at = now()
         WHERE id = $1::text
         RETURNING id, company_id, email, name, google_sub, google_picture_url, role
      `,
      [existing.id, input.profile.sub, normalizeEmail(input.profile.email), input.profile.name, normalizeText(input.profile.picture)],
    );
    return updated.rows[0] ?? existing;
  }

  const result = await client.query<UserRow>(
    `
      INSERT INTO users (
        id,
        company_id,
        email,
        name,
        role,
        google_sub,
        google_picture_url,
        is_active,
        last_login_at
      )
      VALUES ($1::text, $2::text, $3::text, $4::text, 'admin', $5::text, $6::text, true, now())
      RETURNING id, company_id, email, name, google_sub, google_picture_url, role
    `,
    [
      randomUUID(),
      input.companyId,
      normalizeEmail(input.profile.email),
      input.profile.name || normalizeEmail(input.profile.email),
      input.profile.sub,
      normalizeText(input.profile.picture),
    ],
  );

  const row = result.rows[0];
  if (!row) throw new Error("USER_CREATE_FAILED");
  return row;
}

async function createApprovedCompanyAdminMember(
  client: DbTransactionClient,
  input: { companyId: string; userId: string; displayName: string },
): Promise<CompanyMemberRow> {
  const existing = await client.query<CompanyMemberRow>(
    `
      SELECT id, company_id, user_id, status, role_template_code
        FROM company_members
       WHERE company_id = $1::text
         AND user_id = $2::text
       LIMIT 1
    `,
    [input.companyId, input.userId],
  );

  if (existing.rows[0]) return existing.rows[0];

  const result = await client.query<CompanyMemberRow>(
    `
      INSERT INTO company_members (
        company_id,
        user_id,
        status,
        role_template_code,
        display_name,
        approved_at
      )
      VALUES ($1::text, $2::text, 'approved', $3::text, $4::text, now())
      RETURNING id, company_id, user_id, status, role_template_code
    `,
    [input.companyId, input.userId, COMPANY_ADMIN_ROLE_TEMPLATE_CODE, input.displayName],
  );

  const row = result.rows[0];
  if (!row) throw new Error("COMPANY_MEMBER_CREATE_FAILED");
  return row;
}

async function insertCompanyAdminPermissions(
  client: DbTransactionClient,
  input: { companyMemberId: string; grantedByUserId: string | null },
): Promise<void> {
  const permissionCodes = getMemberRoleTemplatePermissions(COMPANY_ADMIN_ROLE_TEMPLATE_CODE);

  for (const permissionCode of permissionCodes) {
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
      [input.companyMemberId, permissionCode, input.grantedByUserId],
    );
  }
}

async function updateExistingCompanyAdminUserLogin(
  client: DbTransactionClient,
  input: { user: UserRow; profile: GoogleUserProfile },
): Promise<UserRow> {
  const updated = await client.query<UserRow>(
    `
      UPDATE users
         SET google_sub = COALESCE(google_sub, $2::text),
             email = COALESCE(NULLIF(email, ''), $3::text),
             name = COALESCE(NULLIF(name, ''), $4::text),
             google_picture_url = $5::text,
             role = 'admin',
             last_login_at = now(),
             updated_at = now()
       WHERE id = $1::text
       RETURNING id, company_id, email, name, google_sub, google_picture_url, role
    `,
    [input.user.id, input.profile.sub, normalizeEmail(input.profile.email), input.profile.name, normalizeText(input.profile.picture)],
  );

  return updated.rows[0] ?? input.user;
}

function assertActiveCompanyAdminInvitation(rawToken: string) {
  return invitationRepository.findInvitationByRawToken(rawToken).then((invitation) => {
    if (!invitation) throw new Error("INVITATION_NOT_FOUND");
    if (invitation.scope !== "system_to_company_admin") throw new Error("INVITATION_SCOPE_MISMATCH");
    if (invitation.status !== "pending" && invitation.status !== "active") throw new Error("INVITATION_NOT_ACTIVE");
    if (new Date(invitation.expiresAt).getTime() <= Date.now()) throw new Error("INVITATION_EXPIRED");
    return invitation;
  });
}

export async function completeCompanyAdminInvitationLogin(
  profile: GoogleUserProfile,
  rawToken: string,
): Promise<CompanyAdminInvitationLoginResult> {
  if (!isDatabaseConfigured()) {
    throw new Error("DB_NOT_CONFIGURED");
  }

  await assertActiveCompanyAdminInvitation(rawToken);

  return {
    redirectPath: "/workspace",
    session: {
      userId: `invitation:${profile.sub}`,
      companyId: null,
      companyMemberId: null,
      companyName: null,
      role: SESSION_ROLE.companyAdmin,
      email: normalizeEmail(profile.email),
      name: profile.name || normalizeEmail(profile.email),
      issuedAt: new Date().toISOString(),
      companyInvitationToken: rawToken,
      googleSub: profile.sub,
      googlePictureUrl: normalizeText(profile.picture),
    },
  };
}

export async function createCompanyAdminAccountFromInvitationSession(
  session: WaflSessionPayload,
): Promise<WaflSessionPayload> {
  if (!isDatabaseConfigured()) {
    throw new Error("DB_NOT_CONFIGURED");
  }

  const rawToken = session.companyInvitationToken?.trim();
  if (!rawToken) throw new Error("INVITATION_TOKEN_REQUIRED");
  const googleSub = session.googleSub?.trim();
  if (!googleSub) throw new Error("GOOGLE_SUB_REQUIRED");

  await assertActiveCompanyAdminInvitation(rawToken);

  const profile: GoogleUserProfile = {
    sub: googleSub,
    email: session.email,
    emailVerified: true,
    name: session.name,
    picture: session.googlePictureUrl ?? null,
  };

  return withDbTransaction(async (client) => {
    const existingUser = await findExistingUser(client, profile);
    const company = existingUser
      ? { id: existingUser.company_id, name: existingUser.company_name || buildDraftCompanyName() }
      : await createProfileRequiredCompany(client);
    const user = existingUser
      ? await updateExistingCompanyAdminUserLogin(client, { user: existingUser, profile })
      : await createCompanyAdminUser(client, { companyId: company.id, profile });

    const member = await createApprovedCompanyAdminMember(client, {
      companyId: company.id,
      userId: user.id,
      displayName: user.name || profile.name,
    });

    await insertCompanyAdminPermissions(client, {
      companyMemberId: member.id,
      grantedByUserId: null,
    });

    await client.query(
      `
        UPDATE companies
           SET owner_user_id = COALESCE(owner_user_id, $2::text),
               updated_at = now()
         WHERE id = $1::text
      `,
      [company.id, user.id],
    );

    return {
      userId: user.id,
      companyId: company.id,
      companyMemberId: member.id,
      companyName: company.name,
      role: SESSION_ROLE.companyAdmin,
      email: normalizeEmail(user.email ?? profile.email),
      name: user.name || profile.name,
      issuedAt: new Date().toISOString(),
      companyInvitationToken: rawToken,
      googleSub,
      googlePictureUrl: normalizeText(profile.picture),
    };
  });
}
