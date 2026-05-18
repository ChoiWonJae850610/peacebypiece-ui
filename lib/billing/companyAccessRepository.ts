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

export type CompanyAccessState = {
  companyId: string;
  onboardingStatus: string;
  subscriptionStatus: ReturnType<typeof normalizeCompanySubscriptionStatus>;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  trialExpired: boolean;
  accessBlocked: boolean;
};

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

  return {
    companyId: row.company_id,
    onboardingStatus: row.onboarding_status ?? "profile_required",
    subscriptionStatus,
    trialStartedAt: toIso(row.trial_started_at),
    trialEndsAt: toIso(row.trial_ends_at),
    trialExpired,
    accessBlocked: row.onboarding_status === "rejected" || trialExpired || subscriptionStatus === "past_due" || subscriptionStatus === "canceled",
  };
}
