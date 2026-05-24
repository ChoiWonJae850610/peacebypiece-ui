import "server-only";

import { isDatabaseConfigured, queryDb, withDbTransaction, type DbTransactionClient } from "@/lib/db/client";
import type { GoogleUserProfile } from "./googleOAuth";
import type { WaflSessionPayload, WaflSessionRole } from "./session";

type LoginUserRow = {
  id: string;
  company_id: string;
  email: string | null;
  name: string;
  google_sub: string | null;
  google_picture_url: string | null;
  role: string;
  is_active: boolean;
};

type CompanyMembershipRow = {
  company_member_id: string;
  company_id: string;
  company_name: string;
  role_template_code: string | null;
  status: string;
};

type SystemUserRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
};

type PendingJoinRequestRow = {
  id: string;
  applicant_email: string;
  request_type: string;
  status: string;
};

export type WaflLoginResult =
  | {
      status: "authenticated";
      redirectPath: string;
      session: WaflSessionPayload;
    }
  | {
      status: "pending_approval";
      redirectPath: string;
    }
  | {
      status: "not_found";
      redirectPath: string;
    };

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function findSystemUserByEmail(email: string): Promise<SystemUserRow | null> {
  const result = await queryDb<SystemUserRow>(
    `
      SELECT id, email, name, role, is_active
      FROM system_users
      WHERE lower(email) = lower($1)
        AND is_active = true
      LIMIT 1
    `,
    [email],
  );

  return result.rows[0] ?? null;
}

async function findUserForGoogleProfile(
  client: DbTransactionClient,
  profile: GoogleUserProfile,
): Promise<LoginUserRow | null> {
  const byGoogleSub = await client.query<LoginUserRow>(
    `
      SELECT id, company_id, email, name, google_sub, google_picture_url, role, is_active
      FROM users
      WHERE google_sub = $1
      LIMIT 1
    `,
    [profile.sub],
  );

  if (byGoogleSub.rows[0]) return byGoogleSub.rows[0];

  const byEmail = await client.query<LoginUserRow>(
    `
      SELECT id, company_id, email, name, google_sub, google_picture_url, role, is_active
      FROM users
      WHERE lower(email) = lower($1)
      LIMIT 1
    `,
    [profile.email],
  );

  return byEmail.rows[0] ?? null;
}

async function updateUserGoogleProfile(
  client: DbTransactionClient,
  user: LoginUserRow,
  profile: GoogleUserProfile,
): Promise<LoginUserRow> {
  if (user.google_sub && user.google_sub !== profile.sub) {
    throw new Error("GOOGLE_ACCOUNT_ALREADY_LINKED");
  }

  const result = await client.query<LoginUserRow>(
    `
      UPDATE users
      SET
        google_sub = COALESCE(google_sub, $2),
        email = COALESCE(NULLIF(email, ''), $3),
        name = COALESCE(NULLIF(name, ''), $4),
        google_picture_url = $5,
        last_login_at = now(),
        updated_at = now()
      WHERE id = $1
      RETURNING id, company_id, email, name, google_sub, google_picture_url, role, is_active
    `,
    [user.id, profile.sub, normalizeEmail(profile.email), profile.name, profile.picture],
  );

  return result.rows[0] ?? user;
}

async function findApprovedCompanyMembership(
  client: DbTransactionClient,
  userId: string,
): Promise<CompanyMembershipRow | null> {
  const result = await client.query<CompanyMembershipRow>(
    `
      SELECT
        cm.id AS company_member_id,
        cm.company_id,
        c.name AS company_name,
        cm.role_template_code,
        cm.status
      FROM company_members cm
      JOIN companies c ON c.id = cm.company_id
      WHERE cm.user_id = $1
        AND cm.status = 'approved'
      ORDER BY cm.approved_at DESC NULLS LAST, cm.created_at DESC
      LIMIT 1
    `,
    [userId],
  );

  return result.rows[0] ?? null;
}

async function findPendingJoinRequest(email: string, googleSub: string): Promise<PendingJoinRequestRow | null> {
  const result = await queryDb<PendingJoinRequestRow>(
    `
      SELECT id, applicant_email, request_type, status
      FROM join_requests
      WHERE status = 'pending'
        AND request_type = 'member'
        AND (lower(applicant_email) = lower($1) OR google_sub = $2)
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [email, googleSub],
  );

  return result.rows[0] ?? null;
}

function resolveCompanyRole(user: LoginUserRow, membership: CompanyMembershipRow): WaflSessionRole {
  if (user.role === "admin" || membership.role_template_code === "company_admin") {
    return "company_admin";
  }
  return "member";
}

function resolveCompanyRedirect(role: WaflSessionRole): string {
  if (role === "company_admin") return "/workspace";
  return "/workspace";
}

export async function completeGoogleLogin(profile: GoogleUserProfile): Promise<WaflLoginResult> {
  if (!isDatabaseConfigured()) {
    throw new Error("DB_NOT_CONFIGURED");
  }

  const systemUser = await findSystemUserByEmail(profile.email);
  if (systemUser) {
    return {
      status: "authenticated",
      redirectPath: "/system",
      session: {
        userId: systemUser.id,
        companyId: null,
        companyMemberId: null,
        companyName: null,
        role: "system_admin",
        email: normalizeEmail(systemUser.email),
        name: systemUser.name,
        issuedAt: new Date().toISOString(),
      },
    };
  }

  const loginResult = await withDbTransaction<WaflLoginResult>(async (client) => {
    const user = await findUserForGoogleProfile(client, profile);
    if (!user || !user.is_active) {
      return {
        status: "not_found",
        redirectPath: `/login?error=${encodeURIComponent("ACCOUNT_NOT_FOUND")}`,
      };
    }

    const updatedUser = await updateUserGoogleProfile(client, user, profile);
    const membership = await findApprovedCompanyMembership(client, updatedUser.id);

    if (!membership) {
      return {
        status: "pending_approval",
        redirectPath: `/pending?type=member&email=${encodeURIComponent(profile.email)}`,
      };
    }

    const role = resolveCompanyRole(updatedUser, membership);

    return {
      status: "authenticated",
      redirectPath: resolveCompanyRedirect(role),
      session: {
        userId: updatedUser.id,
        companyId: membership.company_id,
        companyMemberId: membership.company_member_id,
        companyName: membership.company_name,
        role,
        email: normalizeEmail(updatedUser.email ?? profile.email),
        name: updatedUser.name || profile.name,
        issuedAt: new Date().toISOString(),
      },
    };
  });

  if (loginResult.status === "not_found") {
    const pendingJoinRequest = await findPendingJoinRequest(profile.email, profile.sub);
    if (pendingJoinRequest) {
      return {
        status: "pending_approval",
        redirectPath: `/pending?type=member&requestId=${encodeURIComponent(pendingJoinRequest.id)}`,
      };
    }
  }

  return loginResult;
}
