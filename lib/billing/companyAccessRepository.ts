import "server-only";

import { queryDb } from "@/lib/db/client";
import { isCompanyTrialExpired, normalizeCompanySubscriptionStatus } from "@/lib/billing/companyTrialPolicy";

type CompanyAccessRow = {
  company_id: string;
  onboarding_status: string | null;
  subscription_status: string | null;
  trial_started_at: string | Date | null;
  trial_ends_at: string | Date | null;
};

export type CompanyAccessBlockReason =
  | "profile_required"
  | "approval_pending"
  | "rejected"
  | "trial_expired"
  | "subscription_blocked";

export type CompanyAccessState = {
  companyId: string;
  onboardingStatus: string;
  subscriptionStatus: ReturnType<typeof normalizeCompanySubscriptionStatus>;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  trialExpired: boolean;
  accessBlocked: boolean;
  workspaceBlockedReason: CompanyAccessBlockReason | null;
};

export function resolveCompanyAccessBlockReason(input: {
  onboardingStatus: string | null | undefined;
  subscriptionStatus: string | null | undefined;
  trialExpired: boolean;
}): CompanyAccessBlockReason | null {
  if (input.onboardingStatus === "profile_required") return "profile_required";
  if (input.onboardingStatus === "approval_pending") return "approval_pending";
  if (input.onboardingStatus === "rejected") return "rejected";
  if (input.trialExpired || input.subscriptionStatus === "trial_expired") return "trial_expired";
  if (input.subscriptionStatus === "past_due" || input.subscriptionStatus === "canceled") return "subscription_blocked";

  return null;
}

function isAdminAccessBlocked(input: {
  onboardingStatus: string | null | undefined;
  subscriptionStatus: string | null | undefined;
  trialExpired: boolean;
}): boolean {
  return (
    input.onboardingStatus === "rejected" ||
    input.trialExpired ||
    input.subscriptionStatus === "trial_expired" ||
    input.subscriptionStatus === "past_due" ||
    input.subscriptionStatus === "canceled"
  );
}

function toIso(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return value;
}

export async function getCompanyAccessState(companyId: string): Promise<CompanyAccessState | null> {
  const result = await queryDb<CompanyAccessRow>(
    `
      SELECT
        id AS company_id,
        onboarding_status,
        subscription_status,
        trial_started_at,
        trial_ends_at
      FROM companies
      WHERE id = $1::text
      LIMIT 1
    `,
    [companyId],
  );

  const row = result.rows[0];
  if (!row) return null;

  const trialExpired = isCompanyTrialExpired({
    subscriptionStatus: row.subscription_status,
    trialEndsAt: row.trial_ends_at,
  });
  const subscriptionStatus = normalizeCompanySubscriptionStatus(row.subscription_status);

  const onboardingStatus = row.onboarding_status ?? "profile_required";
  const workspaceBlockedReason = resolveCompanyAccessBlockReason({
    onboardingStatus,
    subscriptionStatus,
    trialExpired,
  });

  return {
    companyId: row.company_id,
    onboardingStatus,
    subscriptionStatus,
    trialStartedAt: toIso(row.trial_started_at),
    trialEndsAt: toIso(row.trial_ends_at),
    trialExpired,
    workspaceBlockedReason,
    accessBlocked: isAdminAccessBlocked({
      onboardingStatus,
      subscriptionStatus,
      trialExpired,
    }),
  };
}
