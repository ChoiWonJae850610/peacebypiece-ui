import "server-only";

import { queryDb } from "@/lib/db/client";

import {
  resolvePermissions,
} from "./permissionPolicy";
import type {
  PermissionCatalogItem,
  PermissionKey,
  RolePermissionMap,
  UserPermissionMap,
} from "./permissionTypes";

type PermissionCatalogRow = {
  permission_key: string;
  label: string;
  description: string | null;
  category: string;
  is_active: boolean;
};

type RolePermissionRow = {
  role: string;
  permission_key: string;
};

type UserPermissionRow = {
  company_user_id: string;
  role: string;
  permission_key: string | null;
};

function groupRolePermissions(rows: RolePermissionRow[]): RolePermissionMap[] {
  const grouped = new Map<string, PermissionKey[]>();

  for (const row of rows) {
    const permissions = grouped.get(row.role) ?? [];
    permissions.push(row.permission_key);
    grouped.set(row.role, permissions);
  }

  return Array.from(grouped.entries()).map(([role, permissions]) => ({
    role,
    permissions: Array.from(new Set(permissions)).sort(),
  }));
}

export async function listPermissionCatalog(): Promise<PermissionCatalogItem[]> {
  const result = await queryDb<PermissionCatalogRow>(
    `
    SELECT
      permission_key,
      label,
      description,
      category,
      is_active
    FROM permission_catalog
    WHERE is_active = true
    ORDER BY category ASC, permission_key ASC
    `,
  );

  return result.rows.map((row) => ({
    permissionKey: row.permission_key,
    label: row.label,
    description: row.description,
    category: row.category,
    isActive: row.is_active,
  }));
}

export async function listRolePermissionMaps(): Promise<RolePermissionMap[]> {
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
}

export async function getCompanyUserPermissionMap(
  companyUserId: string,
): Promise<UserPermissionMap | null> {
  const result = await queryDb<UserPermissionRow>(
    `
    SELECT
      cu.id AS company_user_id,
      cu.role,
      cup.permission_key
    FROM company_users cu
    LEFT JOIN company_user_permissions cup
      ON cup.company_user_id = cu.id
      AND cup.is_enabled = true
    WHERE cu.id = $1
    ORDER BY cup.permission_key ASC
    `,
    [companyUserId],
  );

  const first = result.rows[0];

  if (!first) {
    return null;
  }

  const rolePermissionMaps = await listRolePermissionMaps();
  const rolePermissions =
    rolePermissionMaps.find((item) => item.role === first.role)?.permissions ?? [];

  const explicitPermissions = result.rows
    .map((row) => row.permission_key)
    .filter((permission): permission is string => Boolean(permission));

  const resolvedPermissions = resolvePermissions({
    role: first.role,
    rolePermissions,
    explicitPermissions,
  });

  return {
    companyUserId: first.company_user_id,
    role: first.role,
    rolePermissions,
    explicitPermissions,
    resolvedPermissions,
  };
}
