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

function normalizeRoleList(value: unknown): RoleType[] {
  const source = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
  return source.map((item) => toRoleType(item)).filter((item): item is RoleType => item !== null);
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

  return result.rows.map(mapUserAccessRow).filter((user): user is UserProfile => user !== null);
}

async function listFromUserCompanyRole(companyId: string): Promise<UserProfile[]> {
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

  return result.rows.map(mapUserAccessRow).filter((user): user is UserProfile => user !== null);
}

export async function listCompanyUserAccessProfiles(companyId = WORKSPACE_COMPANY_ID): Promise<UserProfile[]> {
  try {
    return await listFromCompanyUsers(companyId);
  } catch {
    return listFromUserCompanyRole(companyId);
  }
}
