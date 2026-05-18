export const COMPANY_TRIAL_DAYS = 7;
export const TRIAL_PLAN_CODE = "trial" as const;
export const TRIAL_STORAGE_LIMIT_BYTES = 1024 * 1024 * 1024;
export const TRIAL_MEMBER_LIMIT = 5;
export const COMPANY_SUBSCRIPTION_STATUSES = [
  "trialing",
  "trial_expired",
  "active",
  "past_due",
  "canceled",
] as const;

export type CompanySubscriptionStatus = (typeof COMPANY_SUBSCRIPTION_STATUSES)[number];

export type CompanyTrialWindow = {
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  subscriptionStatus: CompanySubscriptionStatus;
  isTrialExpired: boolean;
};

export function getTrialEndsAt(startedAt: Date = new Date()): Date {
  const trialEndsAt = new Date(startedAt);
  trialEndsAt.setDate(trialEndsAt.getDate() + COMPANY_TRIAL_DAYS);
  return trialEndsAt;
}

export function normalizeCompanySubscriptionStatus(
  value: string | null | undefined,
): CompanySubscriptionStatus {
  if (COMPANY_SUBSCRIPTION_STATUSES.includes(value as CompanySubscriptionStatus)) {
    return value as CompanySubscriptionStatus;
  }

  return "trialing";
}

export function isCompanyTrialExpired(input: {
  subscriptionStatus: string | null | undefined;
  trialEndsAt: string | Date | null | undefined;
  now?: Date;
}): boolean {
  const status = normalizeCompanySubscriptionStatus(input.subscriptionStatus);
  if (status === "active") return false;
  if (status === "trial_expired" || status === "past_due" || status === "canceled") return true;
  if (!input.trialEndsAt) return false;

  const endsAt =
    input.trialEndsAt instanceof Date
      ? input.trialEndsAt
      : new Date(input.trialEndsAt);
  const now = input.now ?? new Date();

  return Number.isFinite(endsAt.getTime()) && endsAt.getTime() <= now.getTime();
}
