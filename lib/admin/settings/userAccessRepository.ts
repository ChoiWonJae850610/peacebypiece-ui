import "server-only";

import { buildUserRoleState, toRoleType } from "@/lib/constants/roles";
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
      GROUP BY users.id, users.name, users.email, company_members.display_name
      ORDER BY name ASC`,
    [companyId],
  );

  return result.rows
    .map(mapUserAccessRow)
    .filter((user): user is UserProfile => user !== null);
}


export async function listCompanyUserAccessProfiles(
  companyId: string,
): Promise<UserProfile[]> {
  const normalizedCompanyId = companyId.trim();
  if (!normalizedCompanyId) {
    throw new Error("COMPANY_SESSION_REQUIRED");
  }

  return listFromCompanyMembers(normalizedCompanyId);
}
