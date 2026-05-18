import { DEFAULT_PLAN_DEFINITIONS } from "@/lib/billing/defaultPlans";
import { DEFAULT_PLAN_CODES } from "@/lib/billing/planPolicy";
import { formatStorageBytes } from "@/lib/billing/storageQuotaPolicy";
import type { CompanyAccessState } from "@/lib/billing/companyAccessRepository";

export type AdminSubscriptionPlanCard = {
  code: string;
  name: string;
  priceLabel: string;
  storageLabel: string;
  memberLabel: string;
  statusLabel: string;
  description: string;
};

export type AdminSubscriptionMetric = {
  label: string;
  value: string;
  description: string;
};

export type AdminSubscriptionCopy = {
  eyebrow: string;
  title: string;
  description: string;
  status: {
    unknown: string;
    trialExpired: string;
    pastDue: string;
    canceled: string;
    active: string;
    trialing: string;
  };
  statusDescription: string;
  primaryActionLabel: string;
  secondaryActionLabel: string;
  memberNoticeTitle: string;
  memberNoticeDescription: string;
  metricLabels: {
    currentStatus: string;
    trialStartedAt: string;
    trialEndsAt: string;
  };
  metricDescriptions: {
    currentStatus: string;
    trialStartedAt: string;
    trialEndsAt: string;
  };
  unsetDateLabel: string;
  planStatus: {
    active: string;
    preparing: string;
  };
  planDescription: string;
  storageLabel: string;
  memberLabel: string;
  freePriceLabel: string;
  monthlyPriceSuffix: string;
  policyNotes: readonly string[];
};

export type AdminSubscriptionViewModel = {
  eyebrow: string;
  title: string;
  description: string;
  statusLabel: string;
  statusDescription: string;
  primaryActionLabel: string;
  secondaryActionLabel: string;
  memberNoticeTitle: string;
  memberNoticeDescription: string;
  storageLabel: string;
  memberLabel: string;
  metrics: AdminSubscriptionMetric[];
  plans: AdminSubscriptionPlanCard[];
  policyNotes: readonly string[];
};

function formatKrw(value: number, copy: AdminSubscriptionCopy): string {
  if (value <= 0) return copy.freePriceLabel;
  return `${value.toLocaleString("ko-KR")}${copy.monthlyPriceSuffix}`;
}

function formatDateTime(value: string | null | undefined, copy: AdminSubscriptionCopy): string {
  if (!value) return copy.unsetDateLabel;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return copy.unsetDateLabel;

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function resolveStatusLabel(accessState: CompanyAccessState | null, copy: AdminSubscriptionCopy): string {
  if (!accessState) return copy.status.unknown;
  if (accessState.subscriptionStatus === "trial_expired" || accessState.trialExpired) return copy.status.trialExpired;
  if (accessState.subscriptionStatus === "past_due") return copy.status.pastDue;
  if (accessState.subscriptionStatus === "canceled") return copy.status.canceled;
  if (accessState.subscriptionStatus === "active") return copy.status.active;
  return copy.status.trialing;
}

function buildPlanCards(copy: AdminSubscriptionCopy): AdminSubscriptionPlanCard[] {
  return DEFAULT_PLAN_DEFINITIONS.filter((plan) => plan.code !== DEFAULT_PLAN_CODES.TRIAL).map((plan) => ({
    code: plan.code,
    name: plan.name,
    priceLabel: formatKrw(plan.priceKrw, copy),
    storageLabel: formatStorageBytes(plan.storage.includedStorageBytes),
    memberLabel: `${plan.members.includedMembers.toLocaleString("ko-KR")}${copy.memberLabel}`,
    statusLabel: plan.status === "active" ? copy.planStatus.active : copy.planStatus.preparing,
    description: copy.planDescription,
  }));
}

export function buildAdminSubscriptionViewModel(
  accessState: CompanyAccessState | null,
  copy: AdminSubscriptionCopy,
): AdminSubscriptionViewModel {
  const statusLabel = resolveStatusLabel(accessState, copy);

  return {
    eyebrow: copy.eyebrow,
    title: copy.title,
    description: copy.description,
    statusLabel,
    statusDescription: copy.statusDescription,
    primaryActionLabel: copy.primaryActionLabel,
    secondaryActionLabel: copy.secondaryActionLabel,
    memberNoticeTitle: copy.memberNoticeTitle,
    memberNoticeDescription: copy.memberNoticeDescription,
    storageLabel: copy.storageLabel,
    memberLabel: copy.memberLabel,
    metrics: [
      {
        label: copy.metricLabels.currentStatus,
        value: statusLabel,
        description: copy.metricDescriptions.currentStatus,
      },
      {
        label: copy.metricLabels.trialStartedAt,
        value: formatDateTime(accessState?.trialStartedAt, copy),
        description: copy.metricDescriptions.trialStartedAt,
      },
      {
        label: copy.metricLabels.trialEndsAt,
        value: formatDateTime(accessState?.trialEndsAt, copy),
        description: copy.metricDescriptions.trialEndsAt,
      },
    ],
    plans: buildPlanCards(copy),
    policyNotes: copy.policyNotes,
  };
}
