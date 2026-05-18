import "server-only";

import { NextResponse } from "next/server";

import { getCurrentWaflSession } from "@/lib/auth/currentSession";
import { createCompanyApiAccessBlockedResponse } from "@/lib/billing/companyApiAccessGuard";

export const ADMIN_STATS_COMPANY_SESSION_REQUIRED =
  "ADMIN_STATS_COMPANY_SESSION_REQUIRED";

export type AdminStatsCompanyScope = {
  companyId: string;
  companyName: string | null;
  userId: string;
};

export type AdminStatsCompanyScopeResult =
  | { ok: true; companyScope: AdminStatsCompanyScope }
  | { ok: false; response: NextResponse };

export async function requireAdminStatsCompanyScope(): Promise<AdminStatsCompanyScopeResult> {
  const session = await getCurrentWaflSession();
  const companyId = session?.companyId?.trim();

  if (!session || !companyId) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: ADMIN_STATS_COMPANY_SESSION_REQUIRED },
        { status: 401 },
      ),
    };
  }

  const blockedResponse = await createCompanyApiAccessBlockedResponse(companyId);
  if (blockedResponse) {
    return { ok: false, response: blockedResponse };
  }

  return {
    ok: true,
    companyScope: {
      companyId,
      companyName: session.companyName,
      userId: session.userId,
    },
  };
}

export async function getAdminStatsCompanyScope(): Promise<AdminStatsCompanyScope | null> {
  const session = await getCurrentWaflSession();
  const companyId = session?.companyId?.trim();

  if (!session || !companyId) {
    return null;
  }

  return {
    companyId,
    companyName: session.companyName,
    userId: session.userId,
  };
}
