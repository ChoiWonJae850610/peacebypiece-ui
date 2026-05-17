import "server-only";

import { isDatabaseConfigured, queryDb, withDbTransaction, type DbTransactionClient } from "@/lib/db/client";
import {
  MEMBER_PERMISSION_CATALOG,
  MEMBER_ROLE_TEMPLATE_POLICIES,
  isMemberPermissionCode,
  type MemberPermissionCode,
  type MemberPermissionRoleTemplateCode,
} from "@/lib/permissions";
import type {
  AdminCompanyMemberRecord,
  AdminCompanyMemberStatus,
  AdminMemberRepository,
  ListAdminCompanyMembersInput,
  ListAdminCompanyMembersResult,
  UpdateAdminCompanyMemberPermissionsInput,
  UpdateAdminCompanyMemberPermissionsResult,
} from "./memberTypes";

const DEFAULT_MEMBER_LIST_LIMIT = 50;
const MEMBER_STATUSES: readonly AdminCompanyMemberStatus[] = ["approved", "pending", "rejected", "suspended"] as const;


type AdminCompanyMemberDbRow = {
  id: string;
  company_id: string;
  user_id: string;
  email: string | null;
  phone: string | null;
  birthday: string | Date | null;
  user_name: string | null;
  display_name: string | null;
  role_template_code: string | null;
  status: AdminCompanyMemberStatus;
  permission_codes: string[] | null;
  approved_at: string | Date | null;
  last_active_at: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
};

function toIso(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function readMemberStatus(value: string | null | undefined): AdminCompanyMemberStatus | null {
  return MEMBER_STATUSES.includes(value as AdminCompanyMemberStatus) ? (value as AdminCompanyMemberStatus) : null;
}

function normalizeLimit(value: number | null | undefined): number {
  if (!Number.isFinite(value)) return DEFAULT_MEMBER_LIST_LIMIT;
  return Math.min(Math.max(Math.trunc(Number(value)), 1), 100);
}

function isRoleTemplateCode(value: string | null | undefined): value is MemberPermissionRoleTemplateCode {
  return MEMBER_ROLE_TEMPLATE_POLICIES.some((role) => role.code === value);
}

function toRoleTemplateCode(value: string | null | undefined): MemberPermissionRoleTemplateCode {
  return isRoleTemplateCode(value) ? value : "viewer";
}

function isCompanyMemberPermissionCode(value: string | null | undefined): value is MemberPermissionCode {
  if (!value || !isMemberPermissionCode(value)) return false;
  const permission = MEMBER_PERMISSION_CATALOG.find((item) => item.code === value);
  return Boolean(permission && !permission.systemOnly);
}

function normalizePermissionCodes(values: readonly string[] | null | undefined): readonly MemberPermissionCode[] {
  return Array.from(
    new Set(
      (values || [])
        .map((value) => value.trim())
        .filter(isCompanyMemberPermissionCode),
    ),
  ).sort();
}

function assertPermissionUpdateInput(input: UpdateAdminCompanyMemberPermissionsInput): readonly MemberPermissionCode[] {
  if (!input.companyId.trim()) {
    throw new Error("COMPANY_ID_REQUIRED");
  }

  if (!input.companyMemberId.trim()) {
    throw new Error("COMPANY_MEMBER_ID_REQUIRED");
  }

  const permissionCodes = normalizePermissionCodes(input.permissionCodes);
  if (permissionCodes.length === 0) {
    throw new Error("MEMBER_PERMISSION_REQUIRED");
  }

  return permissionCodes;
}

function toAdminCompanyMemberRecord(row: AdminCompanyMemberDbRow): AdminCompanyMemberRecord {
  const permissionCodes = normalizePermissionCodes(row.permission_codes || []);
  const name = row.display_name?.trim() || row.user_name?.trim() || row.email?.trim() || row.user_id;

  return {
    id: row.id,
    companyId: row.company_id,
    userId: row.user_id,
    email: row.email,
    phone: row.phone,
    birthday: toIso(row.birthday),
    name,
    displayName: row.display_name,
    roleTemplateCode: toRoleTemplateCode(row.role_template_code),
    status: row.status,
    permissionCodes,
    permissionCount: permissionCodes.length,
    approvedAt: toIso(row.approved_at),
    lastActiveAt: toIso(row.last_active_at),
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
    updatedAt: toIso(row.updated_at) ?? new Date().toISOString(),
  };
}

async function selectCompanyMemberById(
  client: DbTransactionClient,
  companyMemberId: string,
  companyId: string,
): Promise<AdminCompanyMemberRecord | null> {
  const result = await client.query<AdminCompanyMemberDbRow>(
    `
      SELECT company_members.id,
             company_members.company_id,
             company_members.user_id,
             users.email,
             users.phone,
             users.birthday,
             users.name AS user_name,
             company_members.display_name,
             company_members.role_template_code,
             company_members.status,
             COALESCE(
               array_agg(member_permissions.permission_code ORDER BY member_permissions.permission_code)
                 FILTER (WHERE member_permissions.is_enabled = true),
               ARRAY[]::text[]
             ) AS permission_codes,
             company_members.approved_at,
             users.last_login_at AS last_active_at,
             company_members.created_at,
             company_members.updated_at
        FROM company_members
        JOIN users ON users.id = company_members.user_id
        LEFT JOIN member_permissions ON member_permissions.company_member_id = company_members.id
       WHERE company_members.id = $1
         AND company_members.company_id = $2
       GROUP BY company_members.id, users.id
       LIMIT 1
    `,
    [companyMemberId, companyId],
  );

  return result.rows[0] ? toAdminCompanyMemberRecord(result.rows[0]) : null;
}

async function listDbCompanyMembers(input: ListAdminCompanyMembersInput): Promise<ListAdminCompanyMembersResult> {
  const companyId = input.companyId.trim();
  if (!companyId) {
    throw new Error("COMPANY_ID_REQUIRED");
  }

  const whereClauses = ["company_members.company_id = $1"];
  const params: unknown[] = [companyId];
  const status = input.status === "all" ? null : readMemberStatus(input.status);

  if (status) {
    params.push(status);
    whereClauses.push(`company_members.status = $${params.length}`);
  }

  params.push(normalizeLimit(input.limit));
  const limitPlaceholder = `$${params.length}`;

  const result = await queryDb<AdminCompanyMemberDbRow>(
    `
      SELECT company_members.id,
             company_members.company_id,
             company_members.user_id,
             users.email,
             users.phone,
             users.birthday,
             users.name AS user_name,
             company_members.display_name,
             company_members.role_template_code,
             company_members.status,
             COALESCE(
               array_agg(member_permissions.permission_code ORDER BY member_permissions.permission_code)
                 FILTER (WHERE member_permissions.is_enabled = true),
               ARRAY[]::text[]
             ) AS permission_codes,
             company_members.approved_at,
             users.last_login_at AS last_active_at,
             company_members.created_at,
             company_members.updated_at
        FROM company_members
        JOIN users ON users.id = company_members.user_id
        LEFT JOIN member_permissions ON member_permissions.company_member_id = company_members.id
       WHERE ${whereClauses.join(" AND ")}
       GROUP BY company_members.id, users.id
       ORDER BY company_members.approved_at DESC NULLS LAST, company_members.created_at DESC
       LIMIT ${limitPlaceholder}
    `,
    params,
  );

  return { members: result.rows.map(toAdminCompanyMemberRecord) };
}

async function updateDbCompanyMemberPermissions(
  input: UpdateAdminCompanyMemberPermissionsInput,
): Promise<UpdateAdminCompanyMemberPermissionsResult> {
  const nextPermissionCodes = assertPermissionUpdateInput(input);

  return withDbTransaction(async (client) => {
    const current = await selectCompanyMemberById(client, input.companyMemberId, input.companyId);
    if (!current) {
      throw new Error("COMPANY_MEMBER_NOT_FOUND");
    }

    if (current.status !== "approved") {
      throw new Error("COMPANY_MEMBER_NOT_APPROVED");
    }

    if (
      input.updatedByUserId &&
      current.userId === input.updatedByUserId &&
      current.permissionCodes.includes("member.permission.update") &&
      !nextPermissionCodes.includes("member.permission.update")
    ) {
      throw new Error("SELF_PERMISSION_UPDATE_REMOVAL_BLOCKED");
    }

    await client.query(
      `
        UPDATE member_permissions
           SET is_enabled = false,
               updated_at = now()
         WHERE company_member_id = $1
      `,
      [current.id],
    );

    for (const permissionCode of nextPermissionCodes) {
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
        [current.id, permissionCode, input.updatedByUserId ?? null],
      );
    }

    await client.query(
      `
        UPDATE company_members
           SET updated_at = now()
         WHERE id = $1
      `,
      [current.id],
    );

    const updated = await selectCompanyMemberById(client, current.id, input.companyId);
    if (!updated) {
      throw new Error("COMPANY_MEMBER_NOT_FOUND");
    }

    return {
      member: updated,
      previousPermissionCodes: current.permissionCodes,
      nextPermissionCodes: updated.permissionCodes,
    };
  });
}

export function createAdminMemberRepository(): AdminMemberRepository {
  return {
    async listCompanyMembers(input) {
      if (!isDatabaseConfigured()) {
        return { members: [] };
      }

      return listDbCompanyMembers(input);
    },

    async updateCompanyMemberPermissions(input) {
      if (!isDatabaseConfigured()) {
        throw new Error("DATABASE_NOT_CONFIGURED");
      }

      return updateDbCompanyMemberPermissions(input);
    },
  };
}

export const adminMemberRepository = createAdminMemberRepository();
