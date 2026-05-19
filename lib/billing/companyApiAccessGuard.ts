import "server-only";

import { NextResponse } from "next/server";

import { getCompanyAccessState, type CompanyAccessState } from "@/lib/billing/companyAccessRepository";

export const COMPANY_API_ACCESS_ERROR_CODES = {
  profileRequired: "COMPANY_PROFILE_REQUIRED",
  approvalPending: "COMPANY_APPROVAL_PENDING",
  rejected: "COMPANY_ONBOARDING_REJECTED",
  trialExpired: "TRIAL_EXPIRED",
  pastDue: "SUBSCRIPTION_PAST_DUE",
  canceled: "SUBSCRIPTION_CANCELED",
} as const;

export const COMPANY_API_ACCESS_BLOCK_REASONS = {
  profileRequired: "profile_required",
  approvalPending: "approval_pending",
  rejected: "rejected",
  trialExpired: "trial_expired",
  pastDue: "past_due",
  canceled: "canceled",
} as const;

export type CompanyApiAccessErrorCode =
  (typeof COMPANY_API_ACCESS_ERROR_CODES)[keyof typeof COMPANY_API_ACCESS_ERROR_CODES];

export type CompanyApiAccessBlockReason =
  (typeof COMPANY_API_ACCESS_BLOCK_REASONS)[keyof typeof COMPANY_API_ACCESS_BLOCK_REASONS];

export type CompanyApiAccessGuardOptions = {
  allowProfileRequired?: boolean;
  allowApprovalPending?: boolean;
  allowRejected?: boolean;
  allowTrialExpired?: boolean;
  allowPastDue?: boolean;
  allowCanceled?: boolean;
  allowSubscriptionManagement?: boolean;
};

export type CompanyApiAccessBlockedPayload = {
  ok: false;
  error: CompanyApiAccessErrorCode;
  code: CompanyApiAccessErrorCode;
  reason: CompanyApiAccessBlockReason;
  accessBlocked: true;
  companyAccess: {
    companyId: string;
    onboardingStatus: string;
    subscriptionStatus: string;
    trialExpired: boolean;
  };
};

type CompanyApiAccessBlockDecision = {
  code: CompanyApiAccessErrorCode;
  reason: CompanyApiAccessBlockReason;
};

function createBlockedPayload(input: {
  decision: CompanyApiAccessBlockDecision;
  state: CompanyAccessState;
}): CompanyApiAccessBlockedPayload {
  return {
    ok: false,
    error: input.decision.code,
    code: input.decision.code,
    reason: input.decision.reason,
    accessBlocked: true,
    companyAccess: {
      companyId: input.state.companyId,
      onboardingStatus: input.state.onboardingStatus,
      subscriptionStatus: input.state.subscriptionStatus,
      trialExpired: input.state.trialExpired,
    },
  };
}

function getBlockedStatus(code: CompanyApiAccessErrorCode): number {
  if (
    code === COMPANY_API_ACCESS_ERROR_CODES.trialExpired ||
    code === COMPANY_API_ACCESS_ERROR_CODES.pastDue ||
    code === COMPANY_API_ACCESS_ERROR_CODES.canceled
  ) {
    return 402;
  }

  return 403;
}

function isSubscriptionExceptionAllowed(
  decision: CompanyApiAccessBlockDecision,
  options: CompanyApiAccessGuardOptions,
): boolean {
  if (options.allowSubscriptionManagement) return true;
  if (decision.reason === COMPANY_API_ACCESS_BLOCK_REASONS.trialExpired) {
    return Boolean(options.allowTrialExpired);
  }
  if (decision.reason === COMPANY_API_ACCESS_BLOCK_REASONS.pastDue) {
    return Boolean(options.allowPastDue);
  }
  if (decision.reason === COMPANY_API_ACCESS_BLOCK_REASONS.canceled) {
    return Boolean(options.allowCanceled);
  }

  return false;
}

function resolveBlockedCompanyApiDecision(
  state: CompanyAccessState,
  options: CompanyApiAccessGuardOptions,
): CompanyApiAccessBlockDecision | null {
  if (state.onboardingStatus === COMPANY_API_ACCESS_BLOCK_REASONS.rejected) {
    return options.allowRejected
      ? null
      : {
          code: COMPANY_API_ACCESS_ERROR_CODES.rejected,
          reason: COMPANY_API_ACCESS_BLOCK_REASONS.rejected,
        };
  }

  if (
    state.onboardingStatus === COMPANY_API_ACCESS_BLOCK_REASONS.profileRequired &&
    !options.allowProfileRequired
  ) {
    return {
      code: COMPANY_API_ACCESS_ERROR_CODES.profileRequired,
      reason: COMPANY_API_ACCESS_BLOCK_REASONS.profileRequired,
    };
  }

  if (
    state.onboardingStatus === COMPANY_API_ACCESS_BLOCK_REASONS.approvalPending &&
    !options.allowApprovalPending
  ) {
    return {
      code: COMPANY_API_ACCESS_ERROR_CODES.approvalPending,
      reason: COMPANY_API_ACCESS_BLOCK_REASONS.approvalPending,
    };
  }

  if (state.subscriptionStatus === COMPANY_API_ACCESS_BLOCK_REASONS.canceled) {
    const decision = {
      code: COMPANY_API_ACCESS_ERROR_CODES.canceled,
      reason: COMPANY_API_ACCESS_BLOCK_REASONS.canceled,
    } satisfies CompanyApiAccessBlockDecision;
    return isSubscriptionExceptionAllowed(decision, options) ? null : decision;
  }

  if (state.subscriptionStatus === COMPANY_API_ACCESS_BLOCK_REASONS.pastDue) {
    const decision = {
      code: COMPANY_API_ACCESS_ERROR_CODES.pastDue,
      reason: COMPANY_API_ACCESS_BLOCK_REASONS.pastDue,
    } satisfies CompanyApiAccessBlockDecision;
    return isSubscriptionExceptionAllowed(decision, options) ? null : decision;
  }

  if (state.trialExpired) {
    const decision = {
      code: COMPANY_API_ACCESS_ERROR_CODES.trialExpired,
      reason: COMPANY_API_ACCESS_BLOCK_REASONS.trialExpired,
    } satisfies CompanyApiAccessBlockDecision;
    return isSubscriptionExceptionAllowed(decision, options) ? null : decision;
  }

  return null;
}

export async function createCompanyApiAccessBlockedResponse(
  companyId: string,
  options: CompanyApiAccessGuardOptions = {},
): Promise<NextResponse | null> {
  const state = await getCompanyAccessState(companyId);
  if (!state) return null;

  const decision = resolveBlockedCompanyApiDecision(state, options);
  if (!decision) return null;

  return NextResponse.json(createBlockedPayload({ decision, state }), {
    status: getBlockedStatus(decision.code),
    headers: { "Cache-Control": "no-store" },
  });
}
