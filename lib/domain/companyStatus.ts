import type { CompanyOnboardingStatus, CompanySubscriptionStatus } from "@/lib/admin/settings/companyTypes";
import type { InvitationStatus } from "@/lib/invitations/invitationTypes";
import type { JoinRequestStatus } from "@/lib/invitations/joinRequestTypes";

export const COMPANY_ONBOARDING_STATUS = {
  profileRequired: "profile_required",
  approvalPending: "approval_pending",
  active: "active",
  rejected: "rejected",
} as const satisfies Record<string, CompanyOnboardingStatus>;

export const COMPANY_ONBOARDING_STATUSES = [
  COMPANY_ONBOARDING_STATUS.profileRequired,
  COMPANY_ONBOARDING_STATUS.approvalPending,
  COMPANY_ONBOARDING_STATUS.active,
  COMPANY_ONBOARDING_STATUS.rejected,
] as const satisfies readonly CompanyOnboardingStatus[];

export const COMPANY_SUBSCRIPTION_STATUS = {
  trialing: "trialing",
  trialExpired: "trial_expired",
  active: "active",
  pastDue: "past_due",
  canceled: "canceled",
} as const satisfies Record<string, CompanySubscriptionStatus>;

export const COMPANY_SUBSCRIPTION_STATUSES = [
  COMPANY_SUBSCRIPTION_STATUS.trialing,
  COMPANY_SUBSCRIPTION_STATUS.trialExpired,
  COMPANY_SUBSCRIPTION_STATUS.active,
  COMPANY_SUBSCRIPTION_STATUS.pastDue,
  COMPANY_SUBSCRIPTION_STATUS.canceled,
] as const satisfies readonly CompanySubscriptionStatus[];

export const JOIN_REQUEST_STATUS = {
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
  cancelled: "cancelled",
} as const satisfies Record<string, JoinRequestStatus>;

export const JOIN_REQUEST_STATUSES = [
  JOIN_REQUEST_STATUS.pending,
  JOIN_REQUEST_STATUS.approved,
  JOIN_REQUEST_STATUS.rejected,
  JOIN_REQUEST_STATUS.cancelled,
] as const satisfies readonly JoinRequestStatus[];

export const INVITATION_STATUS = {
  draft: "draft",
  pending: "pending",
  active: "active",
  accepted: "accepted",
  expired: "expired",
  revoked: "revoked",
  cancelled: "cancelled",
} as const satisfies Record<string, InvitationStatus>;

export const INVITATION_STATUSES = [
  INVITATION_STATUS.draft,
  INVITATION_STATUS.pending,
  INVITATION_STATUS.active,
  INVITATION_STATUS.accepted,
  INVITATION_STATUS.expired,
  INVITATION_STATUS.revoked,
  INVITATION_STATUS.cancelled,
] as const satisfies readonly InvitationStatus[];

export function isCompanyOnboardingStatus(value: string | null | undefined): value is CompanyOnboardingStatus {
  return COMPANY_ONBOARDING_STATUSES.includes(value as CompanyOnboardingStatus);
}

export function normalizeCompanyOnboardingStatus(
  value: string | null | undefined,
  fallback: CompanyOnboardingStatus = COMPANY_ONBOARDING_STATUS.profileRequired,
): CompanyOnboardingStatus {
  return isCompanyOnboardingStatus(value) ? value : fallback;
}

export function isCompanySubscriptionStatus(value: string | null | undefined): value is CompanySubscriptionStatus {
  return COMPANY_SUBSCRIPTION_STATUSES.includes(value as CompanySubscriptionStatus);
}

export function normalizeCompanySubscriptionStatusOrNull(
  value: string | null | undefined,
): CompanySubscriptionStatus | null {
  return isCompanySubscriptionStatus(value) ? value : null;
}

export function isCompanyAccessLimitedStatus(status: CompanySubscriptionStatus | null | undefined): boolean {
  return (
    status === COMPANY_SUBSCRIPTION_STATUS.trialExpired ||
    status === COMPANY_SUBSCRIPTION_STATUS.pastDue ||
    status === COMPANY_SUBSCRIPTION_STATUS.canceled
  );
}

export function isJoinRequestStatus(value: string | null | undefined): value is JoinRequestStatus {
  return JOIN_REQUEST_STATUSES.includes(value as JoinRequestStatus);
}

export function normalizeJoinRequestStatus(
  value: string | null | undefined,
  fallback: JoinRequestStatus = JOIN_REQUEST_STATUS.pending,
): JoinRequestStatus {
  return isJoinRequestStatus(value) ? value : fallback;
}

export function isInvitationStatus(value: string | null | undefined): value is InvitationStatus {
  return INVITATION_STATUSES.includes(value as InvitationStatus);
}

export function normalizeInvitationStatus(
  value: string | null | undefined,
  fallback: InvitationStatus = INVITATION_STATUS.pending,
): InvitationStatus {
  return isInvitationStatus(value) ? value : fallback;
}
