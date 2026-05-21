import "server-only";

import { isDatabaseConfigured, queryDb, withDbTransaction, type DbTransactionClient } from "@/lib/db/client";
import {
  ADMIN_COMPANY_MEMBER_STATUS,
  isApprovedAdminCompanyMemberStatus,
  normalizeAdminCompanyMemberStatusOrNull,
} from "@/lib/domain/memberStatus";
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
  UpdateAdminCompanyMemberInput,
  UpdateAdminCompanyMemberResult,
  UpdateAdminCompanyMemberPermissionsInput,
  UpdateAdminCompanyMemberPermissionsResult,
} from "./memberTypes";

const DEFAULT_MEMBER_LIST_LIMIT = 50;
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
  return normalizeAdminCompanyMemberStatusOrNull(value);
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

async function ensureMemberPermissionCatalogEntries(
  client: DbTransactionClient,
  permissionCodes: readonly MemberPermissionCode[],
): Promise<void> {
  const catalogItems = MEMBER_PERMISSION_CATALOG.filter((item) =>
    permissionCodes.includes(item.code),
  );

  for (const item of catalogItems) {
    await client.query(
      `
        INSERT INTO permission_catalog (
          permission_key,
          label,
          description,
          category,
          permission_group,
          label_key,
          description_key,
          is_system_permission,
          sort_order,
          is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
        ON CONFLICT (permission_key) DO UPDATE SET
          permission_group = EXCLUDED.permission_group,
          label_key = EXCLUDED.label_key,
          description_key = EXCLUDED.description_key,
          is_system_permission = EXCLUDED.is_system_permission,
          sort_order = EXCLUDED.sort_order,
          is_active = true,
          updated_at = now()
      `,
      [
        item.code,
        item.labelKey,
        item.descriptionKey,
        item.group,
        item.group,
        item.labelKey,
        item.descriptionKey,
        item.systemOnly,
        item.sortOrder,
      ],
    );
  }
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


function assertMemberUpdateInput(input: UpdateAdminCompanyMemberInput): {
  displayName?: string | null;
  phone?: string | null;
  status?: AdminCompanyMemberStatus | null;
  roleTemplateCode?: MemberPermissionRoleTemplateCode | null;
  permissionCodes?: readonly MemberPermissionCode[] | null;
} {
  if (!input.companyId.trim()) {
    throw new Error("COMPANY_ID_REQUIRED");
  }

  if (!input.companyMemberId.trim()) {
    throw new Error("COMPANY_MEMBER_ID_REQUIRED");
  }

  const nextStatus = input.status === undefined || input.status === null ? undefined : readMemberStatus(input.status);
  if (input.status !== undefined && input.status !== null && !nextStatus) {
    throw new Error("COMPANY_MEMBER_STATUS_INVALID");
  }

  const roleTemplateCode =
    input.roleTemplateCode === undefined || input.roleTemplateCode === null
      ? undefined
      : toRoleTemplateCode(input.roleTemplateCode);

  return {
    displayName:
      input.displayName === undefined
        ? undefined
        : input.displayName?.trim() || null,
    phone:
      input.phone === undefined
        ? undefined
        : input.phone?.trim() || null,
    status: nextStatus,
    roleTemplateCode,
    permissionCodes:
      input.permissionCodes === undefined
        ? undefined
        : normalizePermissionCodes(input.permissionCodes),
  };
}

async function countApprovedPermissionHolders(
  client: DbTransactionClient,
  companyId: string,
  permissionCode: MemberPermissionCode,
  excludingCompanyMemberId: string,
): Promise<number> {
  const result = await client.query<{ count: string }>(
    `
      SELECT count(*)::text AS count
        FROM company_members
        JOIN member_permissions ON member_permissions.company_member_id = company_members.id
       WHERE company_members.company_id = $1
         AND company_members.id <> $2
         AND company_members.status = 'approved'
         AND member_permissions.permission_code = $3
         AND member_permissions.is_enabled = true
    `,
    [companyId, excludingCompanyMemberId, permissionCode],
  );

  return Number(result.rows[0]?.count ?? 0);
}

async function assertAdminContinuity(
  client: DbTransactionClient,
  current: AdminCompanyMemberRecord,
  nextStatus: AdminCompanyMemberStatus,
  nextPermissionCodes: readonly MemberPermissionCode[],
): Promise<void> {
  const currentlyCanManageMembers = isApprovedAdminCompanyMemberStatus(current.status) && current.permissionCodes.includes("member.permission.update");
  const willManageMembers = nextStatus === ADMIN_COMPANY_MEMBER_STATUS.approved && nextPermissionCodes.includes("member.permission.update");

  if (!currentlyCanManageMembers || willManageMembers) return;

  const remainingAdminCount = await countApprovedPermissionHolders(
    client,
    current.companyId,
    "member.permission.update",
    current.id,
  );

  if (remainingAdminCount <= 0) {
    throw new Error("LAST_ADMIN_PERMISSION_REMOVAL_BLOCKED");
  }
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
         AND COALESCE(company_members.role_template_code, 'viewer') <> 'company_admin'
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

  const whereClauses = [
    "company_members.company_id = $1",
    "COALESCE(company_members.role_template_code, 'viewer') <> 'company_admin'",
  ];
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


async function updateDbCompanyMember(
  input: UpdateAdminCompanyMemberInput,
): Promise<UpdateAdminCompanyMemberResult> {
  const normalized = assertMemberUpdateInput(input);

  return withDbTransaction(async (client) => {
    const current = await selectCompanyMemberById(client, input.companyMemberId, input.companyId);
    if (!current) {
      throw new Error("COMPANY_MEMBER_NOT_FOUND");
    }

    const nextStatus = normalized.status ?? current.status;
    const nextPermissionCodes = normalized.permissionCodes ?? current.permissionCodes;

    if (
      input.updatedByUserId &&
      current.userId === input.updatedByUserId &&
      current.permissionCodes.includes("member.permission.update") &&
      !nextPermissionCodes.includes("member.permission.update")
    ) {
      throw new Error("SELF_PERMISSION_UPDATE_REMOVAL_BLOCKED");
    }

    if (
      input.updatedByUserId &&
      current.userId === input.updatedByUserId &&
      isApprovedAdminCompanyMemberStatus(current.status) &&
      nextStatus !== ADMIN_COMPANY_MEMBER_STATUS.approved
    ) {
      throw new Error("SELF_STATUS_UPDATE_BLOCKED");
    }

    await assertAdminContinuity(client, current, nextStatus, nextPermissionCodes);

    await client.query(
      `
        UPDATE users
           SET name = COALESCE($2::text, users.name),
               phone = $3::text,
               phone_source = CASE WHEN $3::text IS NULL THEN users.phone_source ELSE 'user' END,
               updated_at = now()
         WHERE id = $1
      `,
      [current.userId, normalized.displayName ?? current.name, normalized.phone ?? null],
    );

    await client.query(
      `
        UPDATE company_members
           SET display_name = $2::text,
               role_template_code = $3::text,
               status = $4::text,
               approved_at = CASE WHEN $4::text = 'approved' AND approved_at IS NULL THEN now() ELSE approved_at END,
               approved_by = CASE WHEN $4::text = 'approved' AND approved_by IS NULL THEN $5::text ELSE approved_by END,
               rejected_at = CASE WHEN $4::text = 'rejected' THEN COALESCE(rejected_at, now()) ELSE NULL END,
               rejected_by = CASE WHEN $4::text = 'rejected' THEN COALESCE(rejected_by, $5::text) ELSE NULL END,
               suspended_at = CASE WHEN $4::text = 'suspended' THEN COALESCE(suspended_at, now()) ELSE NULL END,
               suspended_by = CASE WHEN $4::text = 'suspended' THEN COALESCE(suspended_by, $5::text) ELSE NULL END,
               updated_at = now()
         WHERE id = $1
           AND company_id = $6
      `,
      [
        current.id,
        normalized.displayName ?? current.displayName ?? current.name,
        normalized.roleTemplateCode ?? current.roleTemplateCode,
        nextStatus,
        input.updatedByUserId ?? null,
        input.companyId,
      ],
    );

    if (normalized.permissionCodes !== undefined) {
      if (nextPermissionCodes.length === 0) {
        throw new Error("MEMBER_PERMISSION_REQUIRED");
      }

      await ensureMemberPermissionCatalogEntries(client, nextPermissionCodes);

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
    }

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


async function updateDbCompanyMemberPermissions(
  input: UpdateAdminCompanyMemberPermissionsInput,
): Promise<UpdateAdminCompanyMemberPermissionsResult> {
  const nextPermissionCodes = assertPermissionUpdateInput(input);

  return withDbTransaction(async (client) => {
    const current = await selectCompanyMemberById(client, input.companyMemberId, input.companyId);
    if (!current) {
      throw new Error("COMPANY_MEMBER_NOT_FOUND");
    }

    if (!isApprovedAdminCompanyMemberStatus(current.status)) {
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

    await assertAdminContinuity(client, current, current.status, nextPermissionCodes);

    await ensureMemberPermissionCatalogEntries(client, nextPermissionCodes);

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

    async updateCompanyMember(input) {
      if (!isDatabaseConfigured()) {
        throw new Error("DATABASE_NOT_CONFIGURED");
      }

      return updateDbCompanyMember(input);
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
