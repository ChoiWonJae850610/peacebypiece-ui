import "server-only";

import { isDatabaseConfigured, queryDb, type DbQueryResultRow } from "@/lib/db/client";

export type SystemDashboardCompanyRow = {
  id: string;
  name: string;
  active: boolean;
  onboardingStatus: string;
  planCode: string;
  memberCount: number;
  workOrderCount: number;
  storageUsedBytes: number;
  storageLimitBytes: number;
  storagePercent: number;
  lastActivityAt: string | null;
};

export type SystemDashboardStats = {
  source: "database";
  generatedAt: string;
  totals: {
    companies: number;
    activeCompanies: number;
    inactiveCompanies: number;
    members: number;
    workOrders: number;
    storageUsedBytes: number;
    storageLimitBytes: number;
    storageRiskCompanies: number;
    pendingInvitations: number;
  };
  planDistribution: Array<{ planCode: string; companyCount: number }>;
  companies: SystemDashboardCompanyRow[];
};

type SummaryRow = DbQueryResultRow & {
  companies: string | number;
  active_companies: string | number;
  members: string | number;
  workorders: string | number;
  storage_used_bytes: string | number;
  storage_limit_bytes: string | number;
  storage_risk_companies: string | number;
  pending_invitations: string | number;
};

type CompanyRow = DbQueryResultRow & {
  id: string;
  name: string;
  is_active: boolean;
  onboarding_status: string;
  plan_code: string | null;
  member_count: string | number;
  workorder_count: string | number;
  storage_used_bytes: string | number;
  storage_limit_bytes: string | number;
  last_activity_at: string | Date | null;
};

type PlanRow = DbQueryResultRow & {
  plan_code: string | null;
  company_count: string | number;
};

function toNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toIso(value: string | Date | null): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function getSystemDashboardStats(): Promise<SystemDashboardStats> {
  if (!isDatabaseConfigured()) {
    throw new Error("시스템 통계 DB 연결이 설정되지 않았습니다.");
  }

  const [summaryResult, companiesResult, planResult] = await Promise.all([
    queryDb<SummaryRow>(`
      WITH latest_storage AS (
        SELECT DISTINCT ON (company_id)
          company_id,
          used_bytes
        FROM storage_usage_snapshots
        ORDER BY company_id, measured_at DESC, created_at DESC
      ), active_subscriptions AS (
        SELECT DISTINCT ON (company_id)
          company_id,
          storage_limit_bytes
        FROM company_subscriptions
        WHERE status IN ('trialing', 'active', 'past_due', 'payment_failed', 'cancel_scheduled', 'suspended')
        ORDER BY company_id, updated_at DESC, created_at DESC
      ), company_usage AS (
        SELECT
          c.id,
          COALESCE(ls.used_bytes, 0)::bigint AS used_bytes,
          COALESCE(c.storage_limit_bytes, s.storage_limit_bytes, 0)::bigint AS storage_limit_bytes
        FROM companies c
        LEFT JOIN latest_storage ls ON ls.company_id = c.id
        LEFT JOIN active_subscriptions s ON s.company_id = c.id
      )
      SELECT
        (SELECT COUNT(*) FROM companies)::bigint AS companies,
        (SELECT COUNT(*) FROM companies WHERE is_active = true AND onboarding_status = 'active')::bigint AS active_companies,
        (SELECT COUNT(*) FROM company_members WHERE status = 'approved')::bigint AS members,
        (SELECT COUNT(*) FROM spec_sheets WHERE is_active = true AND delete_status IN ('active', 'restored'))::bigint AS workorders,
        COALESCE((SELECT SUM(used_bytes) FROM company_usage), 0)::bigint AS storage_used_bytes,
        COALESCE((SELECT SUM(storage_limit_bytes) FROM company_usage), 0)::bigint AS storage_limit_bytes,
        (SELECT COUNT(*) FROM company_usage WHERE storage_limit_bytes > 0 AND used_bytes * 100 >= storage_limit_bytes * 70)::bigint AS storage_risk_companies,
        (SELECT COUNT(*) FROM invitations WHERE status = 'pending' AND expires_at > now())::bigint AS pending_invitations
    `),
    queryDb<CompanyRow>(`
      WITH latest_storage AS (
        SELECT DISTINCT ON (company_id)
          company_id,
          used_bytes,
          measured_at
        FROM storage_usage_snapshots
        ORDER BY company_id, measured_at DESC, created_at DESC
      ), active_subscriptions AS (
        SELECT DISTINCT ON (company_id)
          company_id,
          plan_code,
          storage_limit_bytes
        FROM company_subscriptions
        WHERE status IN ('trialing', 'active', 'past_due', 'payment_failed', 'cancel_scheduled', 'suspended')
        ORDER BY company_id, updated_at DESC, created_at DESC
      ), member_counts AS (
        SELECT company_id, COUNT(*)::bigint AS member_count
        FROM company_members
        WHERE status = 'approved'
        GROUP BY company_id
      ), workorder_counts AS (
        SELECT company_id, COUNT(*)::bigint AS workorder_count, MAX(updated_at) AS last_activity_at
        FROM spec_sheets
        WHERE is_active = true AND delete_status IN ('active', 'restored')
        GROUP BY company_id
      )
      SELECT
        c.id,
        c.name,
        c.is_active,
        c.onboarding_status,
        COALESCE(s.plan_code, c.requested_plan_code, 'unassigned') AS plan_code,
        COALESCE(m.member_count, 0)::bigint AS member_count,
        COALESCE(w.workorder_count, 0)::bigint AS workorder_count,
        COALESCE(ls.used_bytes, 0)::bigint AS storage_used_bytes,
        COALESCE(c.storage_limit_bytes, s.storage_limit_bytes, 0)::bigint AS storage_limit_bytes,
        GREATEST(c.updated_at, w.last_activity_at, ls.measured_at) AS last_activity_at
      FROM companies c
      LEFT JOIN active_subscriptions s ON s.company_id = c.id
      LEFT JOIN latest_storage ls ON ls.company_id = c.id
      LEFT JOIN member_counts m ON m.company_id = c.id
      LEFT JOIN workorder_counts w ON w.company_id = c.id
      ORDER BY
        CASE WHEN COALESCE(c.storage_limit_bytes, s.storage_limit_bytes, 0) > 0
          THEN COALESCE(ls.used_bytes, 0)::numeric / COALESCE(c.storage_limit_bytes, s.storage_limit_bytes, 1)
          ELSE 0
        END DESC,
        c.updated_at DESC
      LIMIT 12
    `),
    queryDb<PlanRow>(`
      WITH active_subscriptions AS (
        SELECT DISTINCT ON (company_id)
          company_id,
          plan_code
        FROM company_subscriptions
        WHERE status IN ('trialing', 'active', 'past_due', 'payment_failed', 'cancel_scheduled', 'suspended')
        ORDER BY company_id, updated_at DESC, created_at DESC
      )
      SELECT COALESCE(s.plan_code, c.requested_plan_code, 'unassigned') AS plan_code, COUNT(*)::bigint AS company_count
      FROM companies c
      LEFT JOIN active_subscriptions s ON s.company_id = c.id
      GROUP BY COALESCE(s.plan_code, c.requested_plan_code, 'unassigned')
      ORDER BY company_count DESC, plan_code ASC
    `),
  ]);

  const summary = summaryResult.rows[0];
  const companies = companiesResult.rows.map((row) => {
    const used = toNumber(row.storage_used_bytes);
    const limit = toNumber(row.storage_limit_bytes);
    return {
      id: row.id,
      name: row.name,
      active: row.is_active,
      onboardingStatus: row.onboarding_status,
      planCode: row.plan_code ?? "unassigned",
      memberCount: toNumber(row.member_count),
      workOrderCount: toNumber(row.workorder_count),
      storageUsedBytes: used,
      storageLimitBytes: limit,
      storagePercent: limit > 0 ? Math.round((used / limit) * 1000) / 10 : 0,
      lastActivityAt: toIso(row.last_activity_at),
    } satisfies SystemDashboardCompanyRow;
  });

  const companyCount = toNumber(summary?.companies);
  const activeCompanies = toNumber(summary?.active_companies);

  return {
    source: "database",
    generatedAt: new Date().toISOString(),
    totals: {
      companies: companyCount,
      activeCompanies,
      inactiveCompanies: Math.max(0, companyCount - activeCompanies),
      members: toNumber(summary?.members),
      workOrders: toNumber(summary?.workorders),
      storageUsedBytes: toNumber(summary?.storage_used_bytes),
      storageLimitBytes: toNumber(summary?.storage_limit_bytes),
      storageRiskCompanies: toNumber(summary?.storage_risk_companies),
      pendingInvitations: toNumber(summary?.pending_invitations),
    },
    planDistribution: planResult.rows.map((row) => ({
      planCode: row.plan_code ?? "unassigned",
      companyCount: toNumber(row.company_count),
    })),
    companies,
  };
}
