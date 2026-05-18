import "server-only";

import { NextResponse } from "next/server";

import { getCompanyAccessState, type CompanyAccessState } from "@/lib/billing/companyAccessRepository";

export const COMPANY_API_ACCESS_ERROR_CODES = {
  profileRequired: "COMPANY_PROFILE_REQUIRED",
  approvalPending: "COMPANY_APPROVAL_PENDING",
  rejected: "COMPANY_ONBOARDING_REJECTED",
  trialExpired: "TRIAL_EXPIRED",
  subscriptionBlocked: "SUBSCRIPTION_ACCESS_BLOCKED",
} as const;

export type CompanyApiAccessErrorCode =
  (typeof COMPANY_API_ACCESS_ERROR_CODES)[keyof typeof COMPANY_API_ACCESS_ERROR_CODES];

export type CompanyApiAccessGuardOptions = {
  allowProfileRequired?: boolean;
  allowApprovalPending?: boolean;
  allowSubscriptionManagement?: boolean;
};

export type CompanyApiAccessBlockedPayload = {
  ok: false;
  error: CompanyApiAccessErrorCode;
  code: CompanyApiAccessErrorCode;
  accessBlocked: true;
  companyAccess: {
    companyId: string;
    onboardingStatus: string;
    subscriptionStatus: string;
    trialExpired: boolean;
  };
};

function createBlockedPayload(input: {
  code: CompanyApiAccessErrorCode;
  state: CompanyAccessState;
}): CompanyApiAccessBlockedPayload {
  return {
    ok: false,
    error: input.code,
    code: input.code,
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
    code === COMPANY_API_ACCESS_ERROR_CODES.subscriptionBlocked
  ) {
    return 402;
  }

  return 403;
}

function resolveBlockedCompanyApiCode(
  state: CompanyAccessState,
  options: CompanyApiAccessGuardOptions,
): CompanyApiAccessErrorCode | null {
  if (state.onboardingStatus === "rejected") {
    return COMPANY_API_ACCESS_ERROR_CODES.rejected;
  }

  if (state.onboardingStatus === "profile_required" && !options.allowProfileRequired) {
    return COMPANY_API_ACCESS_ERROR_CODES.profileRequired;
  }

  if (state.onboardingStatus === "approval_pending" && !options.allowApprovalPending) {
    return COMPANY_API_ACCESS_ERROR_CODES.approvalPending;
  }

  if (options.allowSubscriptionManagement) {
    return null;
  }

  if (state.trialExpired) {
    return COMPANY_API_ACCESS_ERROR_CODES.trialExpired;
  }

  if (state.subscriptionStatus === "past_due" || state.subscriptionStatus === "canceled") {
    return COMPANY_API_ACCESS_ERROR_CODES.subscriptionBlocked;
  }

  return null;
}

export async function createCompanyApiAccessBlockedResponse(
  companyId: string,
  options: CompanyApiAccessGuardOptions = {},
): Promise<NextResponse | null> {
  const state = await getCompanyAccessState(companyId);
  if (!state) return null;

  const code = resolveBlockedCompanyApiCode(state, options);
  if (!code) return null;

  return NextResponse.json(createBlockedPayload({ code, state }), {
    status: getBlockedStatus(code),
  });
}
