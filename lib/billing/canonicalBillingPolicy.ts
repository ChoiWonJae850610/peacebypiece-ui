import { COMPANY_TRIAL_DAYS, TRIAL_MEMBER_LIMIT, TRIAL_STORAGE_LIMIT_BYTES } from "./companyTrialPolicy";
import { BYTES_PER_GB, BYTES_PER_MB } from "./storageQuotaPolicy";

export const BILLING_CURRENCY = "KRW" as const;
export const BILLING_VAT_POLICY = "vat_included" as const;
export const STORAGE_ADD_ON_UNIT_BYTES = BYTES_PER_GB;
export const STORAGE_ADD_ON_PRICE_KRW = 7000;

export type BillingPlanCode = "trial" | "lite" | "flow" | "studio" | "custom";

export type CanonicalBillingPlan = {
  code: BillingPlanCode;
  label: string;
  monthlyPriceKrw: number | null;
  vatPolicy: typeof BILLING_VAT_POLICY;
  storageLimitBytes: number | null;
  memberLimit: number | null;
  monthlyCompanyWideExportLimit: number | null;
  negotiated: boolean;
};

export const CANONICAL_BILLING_PLANS: Record<BillingPlanCode, CanonicalBillingPlan> = {
  trial: {
    code: "trial",
    label: "Trial",
    monthlyPriceKrw: 0,
    vatPolicy: BILLING_VAT_POLICY,
    storageLimitBytes: TRIAL_STORAGE_LIMIT_BYTES,
    memberLimit: TRIAL_MEMBER_LIMIT,
    monthlyCompanyWideExportLimit: 0,
    negotiated: false,
  },
  lite: {
    code: "lite",
    label: "Lite",
    monthlyPriceKrw: 9900,
    vatPolicy: BILLING_VAT_POLICY,
    storageLimitBytes: 500 * BYTES_PER_MB,
    memberLimit: 3,
    monthlyCompanyWideExportLimit: 1,
    negotiated: false,
  },
  flow: {
    code: "flow",
    label: "Flow",
    monthlyPriceKrw: 19900,
    vatPolicy: BILLING_VAT_POLICY,
    storageLimitBytes: Math.round(1.5 * BYTES_PER_GB),
    memberLimit: 10,
    monthlyCompanyWideExportLimit: 3,
    negotiated: false,
  },
  studio: {
    code: "studio",
    label: "Studio",
    monthlyPriceKrw: 39900,
    vatPolicy: BILLING_VAT_POLICY,
    storageLimitBytes: 5 * BYTES_PER_GB,
    memberLimit: 30,
    monthlyCompanyWideExportLimit: 10,
    negotiated: false,
  },
  custom: {
    code: "custom",
    label: "Custom",
    monthlyPriceKrw: null,
    vatPolicy: BILLING_VAT_POLICY,
    storageLimitBytes: null,
    memberLimit: null,
    monthlyCompanyWideExportLimit: null,
    negotiated: true,
  },
};

export function getCanonicalBillingPlan(planCode: BillingPlanCode): CanonicalBillingPlan {
  return CANONICAL_BILLING_PLANS[planCode];
}

export function getTrialBillingNotice(input: {
  approvedAt: Date;
  selectedPaidPlanCode: Exclude<BillingPlanCode, "trial">;
}) {
  const plan = getCanonicalBillingPlan(input.selectedPaidPlanCode);
  const trialEndsAt = new Date(input.approvedAt);
  trialEndsAt.setDate(trialEndsAt.getDate() + COMPANY_TRIAL_DAYS);

  return {
    todayChargeKrw: 0,
    currency: BILLING_CURRENCY,
    selectedPlanCode: plan.code,
    selectedPlanLabel: plan.label,
    scheduledBillingAt: trialEndsAt.toISOString(),
    scheduledAmountKrw: plan.monthlyPriceKrw,
    cancellationPolicy: "Trial cancellation keeps access until trial end and cancels the scheduled charge.",
  };
}
