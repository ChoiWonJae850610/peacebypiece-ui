import "server-only";

import { queryDb } from "@/lib/db/client";

import type {
  BillingCycle,
  CompanyId,
  CompanyPlanAssignment,
  CompanyPlanAssignmentStatus,
  PlanDefinition,
  PlanStatus,
  StorageUsageSnapshot,
} from "./planTypes";
import type {
  SystemBillingCompanySummary,
  SystemBillingOverview,
} from "./systemBillingTypes";

type PlanRow = {
  id: string;
  code: string;
  name: string;
  status: PlanStatus;
  billing_cycle: BillingCycle;
  price_krw: string | number;
  included_storage_bytes: string | number;
  max_storage_bytes: string | number | null;
  allow_storage_override: boolean;
  included_members: number;
  max_members: number | null;
  allow_member_override: boolean;
  workorder_limit_enabled: boolean;
  inventory_enabled: boolean;
  system_stats_enabled: boolean;
  advanced_stats_enabled: boolean;
  invitation_enabled: boolean;
  storage_management_enabled: boolean;
  created_at: Date | string | null;
  updated_at: Date | string | null;
};

type BillingCompanyRow = {
  company_id: string;
  company_name: string;
  is_active: boolean;
  billing_status: string | null;
  member_count: string | number | null;
  assignment_id: string | null;
  assignment_plan_id: string | null;
  assignment_status: CompanyPlanAssignmentStatus | null;
  override_storage_limit_bytes: string | number | null;
  override_member_limit: number | null;
  override_price_krw: string | number | null;
  override_memo: string | null;
  starts_at: Date | string | null;
  ends_at: Date | string | null;
  assignment_created_at: Date | string | null;
  assignment_updated_at: Date | string | null;
  usage_snapshot_id: string | null;
  used_bytes: string | number | null;
  attachment_count: string | number | null;
  usage_source: StorageUsageSnapshot["source"] | null;
  measured_at: Date | string | null;
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

function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const parsed = typeof value === "number" ? value : Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function toNullableNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = typeof value === "number" ? value : Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function toPlan(row: PlanRow): PlanDefinition {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    status: row.status,
    billingCycle: row.billing_cycle,
    priceKrw: toNumber(row.price_krw),
    storage: {
      includedStorageBytes: toNumber(row.included_storage_bytes),
      maxStorageBytes: toNullableNumber(row.max_storage_bytes),
      allowStorageOverride: row.allow_storage_override,
    },
    members: {
      includedMembers: row.included_members,
      maxMembers: row.max_members,
      allowMemberOverride: row.allow_member_override,
    },
    features: {
      workorderLimitEnabled: row.workorder_limit_enabled,
      inventoryEnabled: row.inventory_enabled,
      systemStatsEnabled: row.system_stats_enabled,
      advancedStatsEnabled: row.advanced_stats_enabled,
      invitationEnabled: row.invitation_enabled,
      storageManagementEnabled: row.storage_management_enabled,
    },
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  };
}

function createCompanyPlanAssignment(
  row: BillingCompanyRow,
): CompanyPlanAssignment | null {
  if (!row.assignment_id || !row.assignment_plan_id || !row.assignment_status) {
    return null;
  }

  return {
    id: row.assignment_id,
    companyId: row.company_id,
    planId: row.assignment_plan_id,
    status: row.assignment_status,
    override: {
      storageLimitBytes: toNullableNumber(row.override_storage_limit_bytes),
      memberLimit: row.override_member_limit,
      priceKrw: toNullableNumber(row.override_price_krw),
      memo: row.override_memo,
    },
    startsAt: toIsoString(row.starts_at) ?? new Date().toISOString(),
    endsAt: toIsoString(row.ends_at),
    createdAt: toIsoString(row.assignment_created_at),
    updatedAt: toIsoString(row.assignment_updated_at),
  };
}

function createStorageUsage(row: BillingCompanyRow): StorageUsageSnapshot | null {
  if (!row.usage_snapshot_id || !row.usage_source || !row.measured_at) {
    return null;
  }

  return {
    id: row.usage_snapshot_id,
    companyId: row.company_id,
    usedBytes: toNumber(row.used_bytes),
    attachmentCount: toNumber(row.attachment_count),
    measuredAt: toIsoString(row.measured_at) ?? new Date().toISOString(),
    source: row.usage_source,
  };
}

function resolveStorageLimit(
  plan: PlanDefinition | null,
  assignment: CompanyPlanAssignment | null,
): number | null {
  if (assignment?.override?.storageLimitBytes !== null && assignment?.override?.storageLimitBytes !== undefined) {
    return assignment.override.storageLimitBytes;
  }

  return plan?.storage.includedStorageBytes ?? null;
}

function resolveMemberLimit(
  plan: PlanDefinition | null,
  assignment: CompanyPlanAssignment | null,
): number | null {
  if (assignment?.override?.memberLimit !== null && assignment?.override?.memberLimit !== undefined) {
    return assignment.override.memberLimit;
  }

  return plan?.members.includedMembers ?? null;
}

function resolvePrice(
  plan: PlanDefinition | null,
  assignment: CompanyPlanAssignment | null,
): number | null {
  if (assignment?.override?.priceKrw !== null && assignment?.override?.priceKrw !== undefined) {
    return assignment.override.priceKrw;
  }

  return plan?.priceKrw ?? null;
}

function createUsageRatio(
  storageUsage: StorageUsageSnapshot | null,
  storageLimitBytes: number | null,
): number {
  if (!storageUsage || !storageLimitBytes || storageLimitBytes <= 0) {
    return 0;
  }

  return Math.min(1, storageUsage.usedBytes / storageLimitBytes);
}

async function listPlans(): Promise<PlanDefinition[]> {
  const result = await queryDb<PlanRow>(
    `
    SELECT
      id,
      code,
      name,
      status,
      billing_cycle,
      price_krw,
      included_storage_bytes,
      max_storage_bytes,
      allow_storage_override,
      included_members,
      max_members,
      allow_member_override,
      workorder_limit_enabled,
      inventory_enabled,
      system_stats_enabled,
      advanced_stats_enabled,
      invitation_enabled,
      storage_management_enabled,
      created_at,
      updated_at
    FROM plans
    ORDER BY price_krw ASC, code ASC
    `,
  );

  return result.rows.map(toPlan);
}

async function listBillingCompanyRows(): Promise<BillingCompanyRow[]> {
  const result = await queryDb<BillingCompanyRow>(
    `
    SELECT
      c.id AS company_id,
      c.name AS company_name,
      c.is_active,
      c.billing_status,
      COUNT(cu.id) FILTER (WHERE cu.is_active = true) AS member_count,
      cpa.id AS assignment_id,
      cpa.plan_id AS assignment_plan_id,
      cpa.status AS assignment_status,
      cpa.override_storage_limit_bytes,
      cpa.override_member_limit,
      cpa.override_price_krw,
      cpa.override_memo,
      cpa.starts_at,
      cpa.ends_at,
      cpa.created_at AS assignment_created_at,
      cpa.updated_at AS assignment_updated_at,
      sus.id AS usage_snapshot_id,
      sus.used_bytes,
      sus.attachment_count,
      sus.source AS usage_source,
      sus.measured_at
    FROM companies c
    LEFT JOIN company_users cu ON cu.company_id = c.id
    LEFT JOIN company_plan_assignments cpa
      ON cpa.company_id = c.id
      AND cpa.status = 'active'
    LEFT JOIN latest_storage_usage_snapshots sus
      ON sus.company_id = c.id
    GROUP BY
      c.id,
      c.name,
      c.is_active,
      c.billing_status,
      cpa.id,
      cpa.plan_id,
      cpa.status,
      cpa.override_storage_limit_bytes,
      cpa.override_member_limit,
      cpa.override_price_krw,
      cpa.override_memo,
      cpa.starts_at,
      cpa.ends_at,
      cpa.created_at,
      cpa.updated_at,
      sus.id,
      sus.used_bytes,
      sus.attachment_count,
      sus.source,
      sus.measured_at
    ORDER BY c.is_active DESC, c.name ASC
    `,
  );

  return result.rows;
}

export async function getSystemBillingOverview(): Promise<SystemBillingOverview> {
  const [plans, companyRows] = await Promise.all([
    listPlans(),
    listBillingCompanyRows(),
  ]);

  const plansById = new Map(plans.map((plan) => [plan.id, plan]));

  const companies: SystemBillingCompanySummary[] = companyRows.map((row) => {
    const assignedPlan = createCompanyPlanAssignment(row);
    const plan = assignedPlan ? plansById.get(assignedPlan.planId) ?? null : null;
    const storageUsage = createStorageUsage(row);
    const effectiveStorageLimitBytes = resolveStorageLimit(plan, assignedPlan);
    const effectiveMemberLimit = resolveMemberLimit(plan, assignedPlan);
    const effectivePriceKrw = resolvePrice(plan, assignedPlan);

    return {
      id: row.company_id,
      name: row.company_name,
      isActive: row.is_active,
      billingStatus: row.billing_status,
      assignedPlan,
      plan,
      storageUsage,
      storageUsageRatio: createUsageRatio(
        storageUsage,
        effectiveStorageLimitBytes,
      ),
      effectiveStorageLimitBytes,
      effectiveMemberLimit,
      effectivePriceKrw,
      memberCount: toNumber(row.member_count),
    };
  });

  return {
    plans,
    companies,
    generatedAt: new Date().toISOString(),
  };
}
