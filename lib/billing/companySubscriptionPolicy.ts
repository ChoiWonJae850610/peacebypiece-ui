export const COMPANY_SUBSCRIPTION_PLAN_CODES = ["trial", "lite", "flow", "studio", "custom"] as const;
export type CompanySubscriptionPlanCode = (typeof COMPANY_SUBSCRIPTION_PLAN_CODES)[number];

export const COMPANY_SUBSCRIPTION_STATUSES = [
  "trialing",
  "active",
  "past_due",
  "payment_failed",
  "cancel_scheduled",
  "canceled",
  "suspended",
] as const;
export type CompanySubscriptionStatus = (typeof COMPANY_SUBSCRIPTION_STATUSES)[number];

export const COMPANY_SUBSCRIPTION_LIMITS = {
  trial: {
    storageLimitBytes: 100 * 1024 * 1024,
    memberLimit: 3,
  },
  lite: {
    storageLimitBytes: 500 * 1024 * 1024,
    memberLimit: 3,
  },
  flow: {
    storageLimitBytes: Math.round(1.5 * 1024 * 1024 * 1024),
    memberLimit: 10,
  },
  studio: {
    storageLimitBytes: 5 * 1024 * 1024 * 1024,
    memberLimit: 30,
  },
  custom: {
    storageLimitBytes: 5 * 1024 * 1024 * 1024,
    memberLimit: 30,
  },
} as const satisfies Record<CompanySubscriptionPlanCode, { storageLimitBytes: number; memberLimit: number }>;

export const COMPANY_SUBSCRIPTION_LABELS = {
  plan: {
    trial: "Trial",
    lite: "Lite",
    flow: "Flow",
    studio: "Studio",
    custom: "Custom",
  },
  status: {
    trialing: "무료체험 중",
    active: "정상 사용 중",
    past_due: "결제 확인 필요",
    payment_failed: "결제 실패",
    cancel_scheduled: "해지 예정",
    canceled: "해지 완료",
    suspended: "운영자 정지",
  },
} as const;

function isOneOf<TValue extends string>(value: string | null | undefined, candidates: readonly TValue[]): value is TValue {
  return Boolean(value && (candidates as readonly string[]).includes(value));
}

export function isCompanySubscriptionPlanCode(value: string | null | undefined): value is CompanySubscriptionPlanCode {
  return isOneOf(value, COMPANY_SUBSCRIPTION_PLAN_CODES);
}

export function isCompanySubscriptionStatus(value: string | null | undefined): value is CompanySubscriptionStatus {
  return isOneOf(value, COMPANY_SUBSCRIPTION_STATUSES);
}

export function normalizeCompanySubscriptionPlanCode(value: string | null | undefined): CompanySubscriptionPlanCode {
  return isCompanySubscriptionPlanCode(value) ? value : "trial";
}

export function normalizeCompanySubscriptionStatus(value: string | null | undefined): CompanySubscriptionStatus {
  return isCompanySubscriptionStatus(value) ? value : "trialing";
}

export function getDefaultCompanySubscriptionLimits(planCode: CompanySubscriptionPlanCode) {
  return COMPANY_SUBSCRIPTION_LIMITS[planCode];
}
