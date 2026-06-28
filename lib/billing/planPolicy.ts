import type {
  CompanyPlanAssignment,
  PlanDefinition,
  ResolvedCompanyPlanPolicy,
} from "./planTypes";

export const DEFAULT_PLAN_CODES = {
  TRIAL: "trial",
  STARTER: "starter",
  TEAM: "team",
  BUSINESS: "business",
} as const;

export const DEFAULT_PLAN_STORAGE_LIMITS = {
  TRIAL: 100 * 1024 * 1024,
  STARTER: 5 * 1024 * 1024 * 1024,
  TEAM: 50 * 1024 * 1024 * 1024,
  BUSINESS: 200 * 1024 * 1024 * 1024,
} as const;

export const DEFAULT_PLAN_MEMBER_LIMITS = {
  TRIAL: 3,
  STARTER: 3,
  TEAM: 15,
  BUSINESS: 50,
} as const;

export function resolveCompanyPlanPolicy(
  plan: PlanDefinition,
  assignment: CompanyPlanAssignment,
): ResolvedCompanyPlanPolicy {
  const storageOverride = assignment.override?.storageLimitBytes;
  const memberOverride = assignment.override?.memberLimit;
  const priceOverride = assignment.override?.priceKrw;

  const useStorageOverride =
    plan.storage.allowStorageOverride &&
    typeof storageOverride === "number" &&
    storageOverride >= 0;

  const useMemberOverride =
    plan.members.allowMemberOverride &&
    typeof memberOverride === "number" &&
    memberOverride >= 0;

  const usePriceOverride =
    typeof priceOverride === "number" && priceOverride >= 0;

  return {
    companyId: assignment.companyId,
    planId: plan.id,
    planCode: plan.code,
    planName: plan.name,
    storageLimitBytes: useStorageOverride
      ? storageOverride
      : plan.storage.includedStorageBytes,
    memberLimit: useMemberOverride ? memberOverride : plan.members.includedMembers,
    priceKrw: usePriceOverride ? priceOverride : plan.priceKrw,
    features: plan.features,
    source: {
      storage: useStorageOverride ? "override" : "plan",
      member: useMemberOverride ? "override" : "plan",
      price: usePriceOverride ? "override" : "plan",
    },
  };
}

export function isStorageUsageExceeded(
  usedBytes: number,
  policy: ResolvedCompanyPlanPolicy,
): boolean {
  return usedBytes > policy.storageLimitBytes;
}

export function isMemberLimitExceeded(
  memberCount: number,
  policy: ResolvedCompanyPlanPolicy,
): boolean {
  return memberCount > policy.memberLimit;
}

export function getStorageUsageRatio(
  usedBytes: number,
  policy: ResolvedCompanyPlanPolicy,
): number {
  if (policy.storageLimitBytes <= 0) {
    return 0;
  }

  return usedBytes / policy.storageLimitBytes;
}
