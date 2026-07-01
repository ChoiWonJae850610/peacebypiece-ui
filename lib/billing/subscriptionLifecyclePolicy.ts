import type { BillingPlanCode } from "./canonicalBillingPolicy";
import { CANONICAL_BILLING_PLANS } from "./canonicalBillingPolicy";

export const PAYMENT_RETRY_DAY_OFFSETS = [0, 3, 7, 14, 21, 30] as const;

export const SUBSCRIPTION_LIFECYCLE_STATES = [
  "active",
  "cancel_scheduled",
  "payment_past_due",
  "restricted",
  "terminated",
  "recovery_window",
  "deletion_scheduled",
  "deleting",
  "deleted",
  "deletion_failed",
  "legal_hold",
] as const;

export type SubscriptionLifecycleState = (typeof SUBSCRIPTION_LIFECYCLE_STATES)[number];

export type BillingChangeQuote = {
  changeType: "upgrade" | "downgrade";
  currentPlanCode: BillingPlanCode;
  targetPlanCode: BillingPlanCode;
  remainingRatio: number;
  amountKrw: number;
  currency: "KRW";
  vatIncluded: true;
  roundingPolicy: "ceil_positive_krw_floor_refund_krw";
};

function requirePricedPlan(planCode: BillingPlanCode): number {
  const price = CANONICAL_BILLING_PLANS[planCode].monthlyPriceKrw;
  if (price === null) throw new Error("CUSTOM_PLAN_PRICE_NEGOTIATED");
  return price;
}

function normalizeRemainingRatio(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function quoteUpgradeProration(input: {
  currentPlanCode: BillingPlanCode;
  targetPlanCode: BillingPlanCode;
  remainingRatio: number;
}): BillingChangeQuote {
  const currentPrice = requirePricedPlan(input.currentPlanCode);
  const targetPrice = requirePricedPlan(input.targetPlanCode);
  const remainingRatio = normalizeRemainingRatio(input.remainingRatio);
  return {
    changeType: "upgrade",
    currentPlanCode: input.currentPlanCode,
    targetPlanCode: input.targetPlanCode,
    remainingRatio,
    amountKrw: Math.max(0, Math.ceil((targetPrice - currentPrice) * remainingRatio)),
    currency: "KRW",
    vatIncluded: true,
    roundingPolicy: "ceil_positive_krw_floor_refund_krw",
  };
}

export function quoteDowngradeRefund(input: {
  currentPlanCode: BillingPlanCode;
  targetPlanCode: BillingPlanCode;
  remainingRatio: number;
}): BillingChangeQuote {
  const currentPrice = requirePricedPlan(input.currentPlanCode);
  const targetPrice = requirePricedPlan(input.targetPlanCode);
  const remainingRatio = normalizeRemainingRatio(input.remainingRatio);
  return {
    changeType: "downgrade",
    currentPlanCode: input.currentPlanCode,
    targetPlanCode: input.targetPlanCode,
    remainingRatio,
    amountKrw: Math.max(0, Math.floor((currentPrice - targetPrice) * remainingRatio)),
    currency: "KRW",
    vatIncluded: true,
    roundingPolicy: "ceil_positive_krw_floor_refund_krw",
  };
}

export function checkDowngradeEligibility(input: {
  targetPlanCode: BillingPlanCode;
  storageUsedBytes: number;
  activeMemberCount: number;
}) {
  const target = CANONICAL_BILLING_PLANS[input.targetPlanCode];
  const storageLimitBytes = target.storageLimitBytes ?? Number.POSITIVE_INFINITY;
  const memberLimit = target.memberLimit ?? Number.POSITIVE_INFINITY;
  const reasons = [
    input.storageUsedBytes > storageLimitBytes ? "storage_over_target_limit" : null,
    input.activeMemberCount > memberLimit ? "member_count_over_target_limit" : null,
  ].filter((reason): reason is string => Boolean(reason));

  return {
    eligible: reasons.length === 0,
    reasons,
    noForcedDeletion: true,
    noForcedMemberDisable: true,
  };
}

export function buildRetrySchedule(paymentFailedAt: Date) {
  return PAYMENT_RETRY_DAY_OFFSETS.map((dayOffset) => {
    const dueAt = new Date(paymentFailedAt);
    dueAt.setDate(dueAt.getDate() + dayOffset);
    return {
      dayOffset,
      dueAt: dueAt.toISOString(),
      serviceState:
        dayOffset >= 30 ? "terminated" : dayOffset >= 7 ? "restricted" : "payment_past_due",
    };
  });
}

export function getRecoveryWindow(input: { terminatedAt: Date }) {
  const recoveryEndsAt = new Date(input.terminatedAt);
  recoveryEndsAt.setDate(recoveryEndsAt.getDate() + 30);
  recoveryEndsAt.setHours(0, 0, 0, 0);
  return {
    viewAllowed: true,
    exportAllowed: true,
    recoveryAllowed: true,
    recoveryEndsAt: recoveryEndsAt.toISOString(),
    deletionWarningOffsetDays: 1,
    deletionRetryCadence: "hourly",
  };
}
