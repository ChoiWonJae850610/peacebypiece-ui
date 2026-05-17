import "server-only";

import { randomUUID } from "crypto";

import { isDatabaseConfigured, queryDb, withDbTransaction } from "@/lib/db/client";
import type {
  CompanyId,
  CompanyPermissionKey,
  CompanyRepository,
  CompanyRole,
  CompanyStatus,
  CompanySummary,
  CompanyUserSummary,
  CreateCompanyInput,
  ListCompaniesQuery,
} from "./companyTypes";

const notConnectedMessage =
  "Company repository requires a configured database. Seed or reset data through DB scripts instead of code fallback data.";

export class CompanyRepositoryNotConnectedError extends Error {
  constructor() {
    super(notConnectedMessage);
    this.name = "CompanyRepositoryNotConnectedError";
  }
}

type CompanyRow = Record<string, unknown> & {
  id: string;
  name: string;
  memo: string | null;
  is_active: boolean;
  member_count: number | string | null;
  storage_limit_bytes: number | string | null;
  storage_used_bytes: number | string | null;
  created_at: string | Date | null;
  updated_at: string | Date | null;
};

type CompanyUserRow = Record<string, unknown> & {
  id: string;
  company_id: string;
  user_id: string;
  email: string | null;
  name: string | null;
  display_name: string | null;
  role: string | null;
  permission_keys: string[] | null;
  is_active: boolean;
  joined_at: string | Date | null;
};

const COMPANY_ROLES = new Set<CompanyRole>(["admin", "designer", "inspector", "inventory_manager", "viewer"]);
const COMPANY_PERMISSIONS = new Set<CompanyPermissionKey>([
  "workorder.create",
  "workorder.edit",
  "workorder.request_review",
  "workorder.skip_review",
  "workorder.request_order",
  "workorder.inspect",
  "workorder.complete",
  "inventory.manage",
  "partner.manage",
  "member.invite",
  "billing.manage",
  "storage.manage",
  "stats.view",
  "system.audit.view",
]);

function ensureDatabaseConfigured() {
  if (!isDatabaseConfigured()) {
    throw new CompanyRepositoryNotConnectedError();
  }
}

function toIso(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toCompanyStatus(isActive: boolean): CompanyStatus {
  return isActive ? "active" : "inactive";
}

function toCompanyRole(value: string | null | undefined): CompanyRole {
  return COMPANY_ROLES.has(value as CompanyRole) ? (value as CompanyRole) : "viewer";
}

function toPermissionKey(value: string | null | undefined): CompanyPermissionKey | null {
  return COMPANY_PERMISSIONS.has(value as CompanyPermissionKey) ? (value as CompanyPermissionKey) : null;
}

function mapCompany(row: CompanyRow): CompanySummary {
  return {
    id: row.id,
    name: row.name,
    memo: row.memo,
    status: toCompanyStatus(row.is_active),
    memberCount: toNumber(row.member_count) ?? 0,
    storageLimitBytes: toNumber(row.storage_limit_bytes),
    storageUsedBytes: toNumber(row.storage_used_bytes) ?? 0,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function mapCompanyUser(row: CompanyUserRow): CompanyUserSummary {
  const permissions = Array.from(
    new Set((row.permission_keys || []).map((permission) => toPermissionKey(permission)).filter((permission): permission is CompanyPermissionKey => Boolean(permission))),
  ).sort();

  return {
    id: row.id,
    companyId: row.company_id,
    userId: row.user_id,
    email: row.email ?? "",
    name: row.display_name?.trim() || row.name?.trim() || row.email?.trim() || row.user_id,
    role: toCompanyRole(row.role),
    permissions,
    isActive: row.is_active,
    joinedAt: toIso(row.joined_at),
  };
}

function getListCompaniesWhereClause(query?: ListCompaniesQuery): { clause: string; params: unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (!query?.includeInactive) {
    conditions.push("c.is_active = true");
  }

  const keyword = query?.keyword?.trim();
  if (keyword) {
    params.push(`%${keyword}%`);
    conditions.push(`c.name ILIKE $${params.length}`);
  }

  return {
    clause: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
    params,
  };
}

async function selectCompanyById(companyId: CompanyId): Promise<CompanySummary | null> {
  const result = await queryDb<CompanyRow>(
    `SELECT
       c.id,
       c.name,
       c.memo,
       c.is_active,
       COUNT(cu.id)::int AS member_count,
       c.storage_limit_bytes,
       COALESCE(s.used_bytes, 0)::bigint AS storage_used_bytes,
       c.created_at,
       c.updated_at
     FROM companies c
     LEFT JOIN company_users cu ON cu.company_id = c.id AND cu.is_active = true
     LEFT JOIN latest_storage_usage_snapshots s ON s.company_id = c.id
     WHERE c.id = $1
     GROUP BY c.id, s.used_bytes`,
    [companyId],
  );

  return result.rows[0] ? mapCompany(result.rows[0]) : null;
}

export function createCompanyRepository(): CompanyRepository {
  return {
    async listCompanies(query?: ListCompaniesQuery) {
      ensureDatabaseConfigured();
      const where = getListCompaniesWhereClause(query);
      const result = await queryDb<CompanyRow>(
        `SELECT
           c.id,
           c.name,
           c.memo,
           c.is_active,
           COUNT(cu.id)::int AS member_count,
           c.storage_limit_bytes,
           COALESCE(s.used_bytes, 0)::bigint AS storage_used_bytes,
           c.created_at,
           c.updated_at
         FROM companies c
         LEFT JOIN company_users cu ON cu.company_id = c.id AND cu.is_active = true
         LEFT JOIN latest_storage_usage_snapshots s ON s.company_id = c.id
         ${where.clause}
         GROUP BY c.id, s.used_bytes
         ORDER BY c.created_at DESC, c.name ASC`,
        where.params,
      );

      return result.rows.map(mapCompany);
    },

    async getCompany(companyId: CompanyId) {
      ensureDatabaseConfigured();
      return selectCompanyById(companyId);
    },

    async createCompany(input: CreateCompanyInput) {
      ensureDatabaseConfigured();
      const name = input.name?.trim();
      if (!name) {
        throw new Error("COMPANY_NAME_REQUIRED");
      }

      const id = `company-${randomUUID()}`;
      await withDbTransaction(async (client) => {
        await client.query(
          `INSERT INTO companies (id, name, memo, is_active)
           VALUES ($1, $2, $3, true)`,
          [id, name, input.memo?.trim() || null],
        );
        await client.query(
          `INSERT INTO company_settings (company_id)
           VALUES ($1)
           ON CONFLICT (company_id) DO NOTHING`,
          [id],
        );
      });

      const company = await selectCompanyById(id);
      if (!company) {
        throw new Error("COMPANY_CREATE_FAILED");
      }

      return company;
    },

    async listCompanyUsers(companyId: CompanyId) {
      ensureDatabaseConfigured();
      const result = await queryDb<CompanyUserRow>(
        `SELECT
           cu.id,
           cu.company_id,
           cu.user_id,
           u.email,
           u.name,
           cu.display_name,
           cu.role,
           COALESCE(
             array_agg(rp.permission_key ORDER BY rp.permission_key) FILTER (WHERE rp.permission_key IS NOT NULL AND rp.is_enabled = true),
             ARRAY[]::text[]
           ) AS permission_keys,
           cu.is_active,
           cu.joined_at
         FROM company_users cu
         JOIN users u ON u.id = cu.user_id
         LEFT JOIN role_permissions rp ON rp.role = cu.role AND rp.is_enabled = true
         WHERE cu.company_id = $1
         GROUP BY cu.id, u.email, u.name
         ORDER BY cu.joined_at DESC NULLS LAST, cu.created_at DESC`,
        [companyId],
      );

      return result.rows.map(mapCompanyUser);
    },
  };
}

export const companyRepository = createCompanyRepository();
