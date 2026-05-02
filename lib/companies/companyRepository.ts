import "server-only";

import { queryDb } from "@/lib/db/client";

import type {
  CompanyDetail,
  CompanyPermissionSummary,
  CompanyRepository,
  CompanySummary,
  CompanyUserSummary,
} from "./companyTypes";

type CompanyRow = {
  id: string;
  name: string;
  memo: string | null;
  is_active: boolean;
  billing_status: string | null;
  storage_limit_bytes: string | number | null;
  member_limit: number | null;
  created_at: Date | string | null;
  updated_at: Date | string | null;
};

type CompanyUserRow = {
  id: string;
  company_id: string;
  user_id: string;
  email: string | null;
  name: string;
  role: string;
  display_name: string | null;
  is_active: boolean;
  joined_at: Date | string | null;
  created_at: Date | string | null;
  updated_at: Date | string | null;
};

type RolePermissionRow = {
  role: string;
  permission_key: string;
};

function toIsoString(value: Date | string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}

function toNullableNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = typeof value === "number" ? value : Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function toCompanySummary(row: CompanyRow): CompanySummary {
  return {
    id: row.id,
    name: row.name,
    memo: row.memo,
    isActive: row.is_active,
    billingStatus: row.billing_status,
    storageLimitBytes: toNullableNumber(row.storage_limit_bytes),
    memberLimit: row.member_limit,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  };
}

function toCompanyUserSummary(row: CompanyUserRow): CompanyUserSummary {
  return {
    id: row.id,
    companyId: row.company_id,
    userId: row.user_id,
    email: row.email,
    name: row.name,
    role: row.role,
    displayName: row.display_name,
    isActive: row.is_active,
    joinedAt: toIsoString(row.joined_at),
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  };
}

function groupRolePermissions(
  rows: RolePermissionRow[],
): CompanyPermissionSummary[] {
  const grouped = new Map<string, string[]>();

  for (const row of rows) {
    const permissions = grouped.get(row.role) ?? [];
    permissions.push(row.permission_key);
    grouped.set(row.role, permissions);
  }

  return Array.from(grouped.entries()).map(([role, permissions]) => ({
    role,
    permissions: permissions.sort(),
  }));
}

export function createDbCompanyRepository(): CompanyRepository {
  return {
    async listCompanies(): Promise<CompanySummary[]> {
      const result = await queryDb<CompanyRow>(
        `
        SELECT
          id,
          name,
          memo,
          is_active,
          billing_status,
          storage_limit_bytes,
          member_limit,
          created_at,
          updated_at
        FROM companies
        ORDER BY is_active DESC, name ASC
        `,
      );

      return result.rows.map(toCompanySummary);
    },

    async getCompanyDetail(companyId: string): Promise<CompanyDetail | null> {
      const companyResult = await queryDb<CompanyRow>(
        `
        SELECT
          id,
          name,
          memo,
          is_active,
          billing_status,
          storage_limit_bytes,
          member_limit,
          created_at,
          updated_at
        FROM companies
        WHERE id = $1
        LIMIT 1
        `,
        [companyId],
      );

      const companyRow = companyResult.rows[0];

      if (!companyRow) {
        return null;
      }

      const [users, rolePermissions] = await Promise.all([
        this.listCompanyUsers(companyId),
        this.listRolePermissions(),
      ]);

      return {
        company: toCompanySummary(companyRow),
        users,
        rolePermissions,
      };
    },

    async listCompanyUsers(companyId: string): Promise<CompanyUserSummary[]> {
      const result = await queryDb<CompanyUserRow>(
        `
        SELECT
          cu.id,
          cu.company_id,
          cu.user_id,
          u.email,
          u.name,
          cu.role,
          cu.display_name,
          cu.is_active,
          cu.joined_at,
          cu.created_at,
          cu.updated_at
        FROM company_users cu
        JOIN users u ON u.id = cu.user_id
        WHERE cu.company_id = $1
        ORDER BY cu.is_active DESC, cu.role ASC, COALESCE(cu.display_name, u.name) ASC
        `,
        [companyId],
      );

      return result.rows.map(toCompanyUserSummary);
    },

    async listRolePermissions(): Promise<CompanyPermissionSummary[]> {
      const result = await queryDb<RolePermissionRow>(
        `
        SELECT
          role,
          permission_key
        FROM role_permissions
        WHERE is_enabled = true
        ORDER BY role ASC, permission_key ASC
        `,
      );

      return groupRolePermissions(result.rows);
    },
  };
}

export const companyRepository = createDbCompanyRepository();
