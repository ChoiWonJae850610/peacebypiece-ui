import "server-only";

import { buildUserRoleState, toRoleType } from "@/lib/constants/roles";
import { WORKSPACE_COMPANY_ID } from "@/lib/constants/company";
import { queryDb } from "@/lib/db/client";
import type { RoleType } from "@/types/permission";
import type { UserProfile } from "@/types/user";

type AdminUserAccessRow = Record<string, unknown> & {
  id: string;
  name: string;
  roles: unknown;
};

const COMPANY_ROLE_TO_WORKORDER_ROLE: Record<string, RoleType | null> = {
  company_admin: "admin",
  designer: "designer",
  inspector: "inspector",
  inventory_manager: "inspector",
  viewer: null,
};

function toWorkOrderRole(value: unknown): RoleType | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (normalized in COMPANY_ROLE_TO_WORKORDER_ROLE) {
    return COMPANY_ROLE_TO_WORKORDER_ROLE[normalized] ?? null;
  }
  return toRoleType(normalized);
}

function normalizeRoleList(value: unknown): RoleType[] {
  const source = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? [value]
      : [];
  return source
    .map((item) => toWorkOrderRole(item))
    .filter((item): item is RoleType => item !== null);
}

function mapUserAccessRow(row: AdminUserAccessRow): UserProfile | null {
  const roles = normalizeRoleList(row.roles);
  if (roles.length === 0) return null;

  return {
    id: row.id,
    name: row.name,
    ...buildUserRoleState(roles),
  };
}

async function listFromCompanyMembers(
  companyId: string,
): Promise<UserProfile[]> {
  const result = await queryDb<AdminUserAccessRow>(
    `SELECT users.id,
            COALESCE(company_members.display_name, users.name, users.email, users.id) AS name,
            ARRAY_AGG(DISTINCT company_members.role_template_code ORDER BY company_members.role_template_code) AS roles
       FROM company_members
       INNER JOIN users ON users.id = company_members.user_id
      WHERE company_members.company_id = $1
        AND company_members.status = 'approved'
        AND COALESCE(users.is_active, true) = true
      GROUP BY users.id, users.name, users.email
      ORDER BY name ASC`,
    [companyId],
  );

  return result.rows
    .map(mapUserAccessRow)
    .filter((user): user is UserProfile => user !== null);
}

async function listFromCompanyUsers(companyId: string): Promise<UserProfile[]> {
  const result = await queryDb<AdminUserAccessRow>(
    `SELECT u.id,
            u.name,
            ARRAY_AGG(DISTINCT cu.role ORDER BY cu.role) AS roles
       FROM users u
       INNER JOIN company_users cu ON cu.user_id = u.id
      WHERE cu.company_id = $1
        AND u.is_active = TRUE
        AND cu.is_active = TRUE
      GROUP BY u.id, u.name
      ORDER BY u.name ASC`,
    [companyId],
  );

  return result.rows
    .map(mapUserAccessRow)
    .filter((user): user is UserProfile => user !== null);
}

async function listFromUserCompanyRole(
  companyId: string,
): Promise<UserProfile[]> {
  const result = await queryDb<AdminUserAccessRow>(
    `SELECT id,
            name,
            ARRAY[role] AS roles
       FROM users
      WHERE company_id = $1
        AND is_active = TRUE
      ORDER BY name ASC`,
    [companyId],
  );

  return result.rows
    .map(mapUserAccessRow)
    .filter((user): user is UserProfile => user !== null);
}

export async function listCompanyUserAccessProfiles(
  companyId = WORKSPACE_COMPANY_ID,
): Promise<UserProfile[]> {
  try {
    const members = await listFromCompanyMembers(companyId);
    if (members.length > 0) return members;
  } catch {
    // Continue to legacy access tables below.
  }

  try {
    const companyUsers = await listFromCompanyUsers(companyId);
    if (companyUsers.length > 0) return companyUsers;
  } catch {
    // Continue to legacy user.company_id fallback below.
  }

  return listFromUserCompanyRole(companyId);
}
