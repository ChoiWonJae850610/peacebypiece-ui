import "server-only";

import { queryDb } from "@/lib/db/client";
import {
  COMPANY_SUBSCRIPTION_LABELS,
  getDefaultCompanySubscriptionLimits,
  normalizeCompanySubscriptionPlanCode,
  normalizeCompanySubscriptionStatus,
  type CompanySubscriptionPlanCode,
  type CompanySubscriptionStatus,
} from "@/lib/billing/companySubscriptionPolicy";

export type CompanySubscriptionSnapshot = {
  id: string | null;
  companyId: string;
  planCode: CompanySubscriptionPlanCode;
  planLabel: string;
  status: CompanySubscriptionStatus;
  statusLabel: string;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  currentPeriodStartedAt: string | null;
  currentPeriodEndsAt: string | null;
  cancelScheduledAt: string | null;
  canceledAt: string | null;
  storageLimitBytes: number;
  storageUsedBytes: number;
  storageUsageRatio: number;
  storageUsagePercent: number;
  storageDisplayUsagePercent: number;
  storageRemainingBytes: number;
  storageState: "healthy" | "warning" | "blocked" | "over_limit";
  memberLimit: number;
  activeMemberCount: number;
  source: "company_subscriptions" | "company_fallback";
  updatedAt: string | null;
};

type CompanySubscriptionRow = Record<string, unknown> & {
  id: string;
  company_id: string;
  plan_code: string;
  status: string;
  trial_started_at: string | Date | null;
  trial_ends_at: string | Date | null;
  current_period_started_at: string | Date | null;
  current_period_ends_at: string | Date | null;
  cancel_scheduled_at: string | Date | null;
  canceled_at: string | Date | null;
  storage_limit_bytes: string | number;
  member_limit: string | number;
  updated_at: string | Date | null;
};

type CompanyFallbackRow = Record<string, unknown> & {
  id: string;
  requested_plan_code: string | null;
  subscription_status: string | null;
  trial_started_at: string | Date | null;
  trial_ends_at: string | Date | null;
  storage_limit_bytes: string | number | null;
  member_limit: string | number | null;
  updated_at: string | Date | null;
};

type UsageRow = Record<string, unknown> & {
  storage_used_bytes: string | number | null;
  active_member_count: string | number | null;
};

function toIso(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function toNonNegativeInteger(value: unknown, fallback: number): number {
  const numericValue = Math.trunc(Number(value));
  return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : fallback;
}

function getRatio(usedBytes: number, limitBytes: number): number {
  if (!Number.isFinite(limitBytes) || limitBytes <= 0) return 0;
  return usedBytes / limitBytes;
}

function getStorageState(usedBytes: number, limitBytes: number): CompanySubscriptionSnapshot["storageState"] {
  const ratio = getRatio(usedBytes, limitBytes);
  if (ratio > 1) return "over_limit";
  if (ratio >= 1) return "blocked";
  if (ratio >= 0.8) return "warning";
  return "healthy";
}

async function getCompanySubscriptionRow(companyId: string): Promise<CompanySubscriptionRow | null> {
  const result = await queryDb<CompanySubscriptionRow>(
    `SELECT
       id,
       company_id,
       plan_code,
       status,
       trial_started_at,
       trial_ends_at,
       current_period_started_at,
       current_period_ends_at,
       cancel_scheduled_at,
       canceled_at,
       storage_limit_bytes,
       member_limit,
       updated_at
     FROM company_subscriptions
     WHERE company_id = $1::text
     LIMIT 1`,
    [companyId],
  );
  return result.rows[0] ?? null;
}

async function getCompanyFallbackRow(companyId: string): Promise<CompanyFallbackRow | null> {
  const result = await queryDb<CompanyFallbackRow>(
    `SELECT
       id,
       requested_plan_code,
       subscription_status,
       trial_started_at,
       trial_ends_at,
       storage_limit_bytes,
       member_limit,
       updated_at
     FROM companies
     WHERE id = $1::text
     LIMIT 1`,
    [companyId],
  );
  return result.rows[0] ?? null;
}

async function getCompanyUsage(companyId: string): Promise<{ storageUsedBytes: number; activeMemberCount: number }> {
  const result = await queryDb<UsageRow>(
    `SELECT
       (
         COALESCE((
           SELECT SUM(COALESCE(size_bytes, 0))::bigint
           FROM attachments
           WHERE company_id = $1::text
             AND deleted_at IS NULL
             AND COALESCE(is_active, true) = true
         ), 0)
         + COALESCE((
           SELECT SUM(COALESCE(size_bytes, 0))::bigint
           FROM attachment_trash_items
           WHERE company_id = $1::text
             AND restored_at IS NULL
             AND purged_at IS NULL
         ), 0)
         + COALESCE((
           SELECT SUM(COALESCE(size_bytes, 0))::bigint
           FROM company_files
           WHERE company_id = $1::text
             AND deleted_at IS NULL
         ), 0)
         + COALESCE((
           SELECT SUM(COALESCE(size_bytes, 0))::bigint
           FROM company_onboarding_files
           WHERE company_id = $1::text
             AND deleted_at IS NULL
         ), 0)
         + COALESCE((
           SELECT SUM(COALESCE(file.size_bytes, 0))::bigint
           FROM signup_application_files file
           JOIN signup_applications app ON app.id = file.application_id
           WHERE app.created_company_id = $1::text
             AND app.status = 'approved'
             AND file.file_type = 'business_registration'
             AND file.deleted_at IS NULL
             AND file.approved_company_file_id IS NULL
         ), 0)
       )::bigint AS storage_used_bytes,
       COALESCE((
         SELECT COUNT(*)::int
         FROM users
         WHERE company_id = $1::text
           AND is_active = true
           AND role <> 'system'
       ), 0)::int AS active_member_count`,
    [companyId],
  );
  const row = result.rows[0];
  return {
    storageUsedBytes: toNonNegativeInteger(row?.storage_used_bytes, 0),
    activeMemberCount: toNonNegativeInteger(row?.active_member_count, 0),
  };
}

function mapSubscriptionRow(row: CompanySubscriptionRow, usage: { storageUsedBytes: number; activeMemberCount: number }): CompanySubscriptionSnapshot {
  const planCode = normalizeCompanySubscriptionPlanCode(row.plan_code);
  const status = normalizeCompanySubscriptionStatus(row.status);
  const limits = getDefaultCompanySubscriptionLimits(planCode);
  const storageLimitBytes = toNonNegativeInteger(row.storage_limit_bytes, limits.storageLimitBytes);
  const memberLimit = toNonNegativeInteger(row.member_limit, limits.memberLimit);

  return {
    id: row.id,
    companyId: row.company_id,
    planCode,
    planLabel: COMPANY_SUBSCRIPTION_LABELS.plan[planCode],
    status,
    statusLabel: COMPANY_SUBSCRIPTION_LABELS.status[status],
    trialStartedAt: toIso(row.trial_started_at),
    trialEndsAt: toIso(row.trial_ends_at),
    currentPeriodStartedAt: toIso(row.current_period_started_at),
    currentPeriodEndsAt: toIso(row.current_period_ends_at),
    cancelScheduledAt: toIso(row.cancel_scheduled_at),
    canceledAt: toIso(row.canceled_at),
    storageLimitBytes,
    storageUsedBytes: usage.storageUsedBytes,
    storageUsageRatio: getRatio(usage.storageUsedBytes, storageLimitBytes),
    storageUsagePercent: Math.round(getRatio(usage.storageUsedBytes, storageLimitBytes) * 100),
    storageDisplayUsagePercent: Math.min(100, Math.max(0, Math.round(getRatio(usage.storageUsedBytes, storageLimitBytes) * 100))),
    storageRemainingBytes: Math.max(0, storageLimitBytes - usage.storageUsedBytes),
    storageState: getStorageState(usage.storageUsedBytes, storageLimitBytes),
    memberLimit,
    activeMemberCount: usage.activeMemberCount,
    source: "company_subscriptions",
    updatedAt: toIso(row.updated_at),
  };
}

function mapFallbackRow(row: CompanyFallbackRow, usage: { storageUsedBytes: number; activeMemberCount: number }): CompanySubscriptionSnapshot {
  const planCode = normalizeCompanySubscriptionPlanCode(row.requested_plan_code);
  const status = normalizeCompanySubscriptionStatus(row.subscription_status);
  const limits = getDefaultCompanySubscriptionLimits(planCode);
  const storageLimitBytes = toNonNegativeInteger(row.storage_limit_bytes, limits.storageLimitBytes);
  const memberLimit = toNonNegativeInteger(row.member_limit, limits.memberLimit);

  return {
    id: null,
    companyId: row.id,
    planCode,
    planLabel: COMPANY_SUBSCRIPTION_LABELS.plan[planCode],
    status,
    statusLabel: COMPANY_SUBSCRIPTION_LABELS.status[status],
    trialStartedAt: toIso(row.trial_started_at),
    trialEndsAt: toIso(row.trial_ends_at),
    currentPeriodStartedAt: null,
    currentPeriodEndsAt: null,
    cancelScheduledAt: null,
    canceledAt: null,
    storageLimitBytes,
    storageUsedBytes: usage.storageUsedBytes,
    storageUsageRatio: getRatio(usage.storageUsedBytes, storageLimitBytes),
    storageUsagePercent: Math.round(getRatio(usage.storageUsedBytes, storageLimitBytes) * 100),
    storageDisplayUsagePercent: Math.min(100, Math.max(0, Math.round(getRatio(usage.storageUsedBytes, storageLimitBytes) * 100))),
    storageRemainingBytes: Math.max(0, storageLimitBytes - usage.storageUsedBytes),
    storageState: getStorageState(usage.storageUsedBytes, storageLimitBytes),
    memberLimit,
    activeMemberCount: usage.activeMemberCount,
    source: "company_fallback",
    updatedAt: toIso(row.updated_at),
  };
}

export async function getCurrentCompanySubscription(companyId: string): Promise<CompanySubscriptionSnapshot | null> {
  const normalizedCompanyId = companyId.trim();
  if (!normalizedCompanyId) return null;

  const usage = await getCompanyUsage(normalizedCompanyId);
  const subscriptionRow = await getCompanySubscriptionRow(normalizedCompanyId);
  if (subscriptionRow) return mapSubscriptionRow(subscriptionRow, usage);

  const fallbackRow = await getCompanyFallbackRow(normalizedCompanyId);
  return fallbackRow ? mapFallbackRow(fallbackRow, usage) : null;
}
