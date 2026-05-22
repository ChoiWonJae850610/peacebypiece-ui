import "server-only";

import { buildUserRoleState, toRoleType } from "@/lib/constants/roles";
import { queryDb } from "@/lib/db/client";
import type { RoleType } from "@/types/permission";
import type { UserProfile } from "@/types/user";

type AdminUserAccessRow = Record<string, unknown> & {
  id: string;
  company_member_id: string;
  name: string | null;
  email: string | null;
  display_name: string | null;
  roles: unknown;
  permission_codes: unknown;
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

function normalizePermissionCodeList(value: unknown): string[] {
  const source = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? [value]
      : [];
  return Array.from(
    new Set(
      source
        .map((item) => String(item ?? "").trim())
        .filter(Boolean),
    ),
  );
}

function normalizeDisplayName(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    const normalized = String(value ?? "").trim().replace(/\s+/g, " ");
    if (normalized) return normalized;
  }
  return "-";
}

function mapUserAccessRow(row: AdminUserAccessRow): UserProfile | null {
  const roles = normalizeRoleList(row.roles);
  if (roles.length === 0) return null;

  return {
    id: row.id,
    companyMemberId: row.company_member_id,
    name: normalizeDisplayName(row.display_name, row.name, row.email, row.id),
    permissionCodes: normalizePermissionCodeList(row.permission_codes),
    ...buildUserRoleState(roles),
  };
}

async function listFromCompanyMembers(
  companyId: string,
): Promise<UserProfile[]> {
  const result = await queryDb<AdminUserAccessRow>(
    `SELECT users.id,
            company_members.id AS company_member_id,
            users.name,
            users.email,
            company_members.display_name,
            ARRAY_AGG(DISTINCT company_members.role_template_code ORDER BY company_members.role_template_code) AS roles,
            COALESCE(
              ARRAY_AGG(DISTINCT member_permissions.permission_code ORDER BY member_permissions.permission_code)
                FILTER (WHERE member_permissions.is_enabled = true),
              ARRAY[]::text[]
            ) AS permission_codes
       FROM company_members
       INNER JOIN users ON users.id = company_members.user_id
       LEFT JOIN member_permissions ON member_permissions.company_member_id = company_members.id
      WHERE company_members.company_id = $1
        AND company_members.status = 'approved'
        AND COALESCE(company_members.role_template_code, 'viewer') <> 'company_admin'
        AND COALESCE(users.is_active, true) = true
      GROUP BY users.id, users.name, users.email, company_members.id, company_members.display_name
      ORDER BY COALESCE(NULLIF(company_members.display_name, ''), NULLIF(users.name, ''), users.email, users.id) ASC`,
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
