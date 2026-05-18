import "server-only";

import { NextResponse } from "next/server";

import { getCurrentWaflSession } from "@/lib/auth/currentSession";
import { createCompanyApiAccessBlockedResponse, type CompanyApiAccessGuardOptions } from "@/lib/billing/companyApiAccessGuard";

export const ADMIN_SETTINGS_COMPANY_SESSION_REQUIRED =
  "ADMIN_SETTINGS_COMPANY_SESSION_REQUIRED";

export type AdminSettingsCompanyScope = {
  companyId: string;
  companyName: string | null;
  userId: string;
};

export type AdminSettingsCompanyScopeResult =
  | { ok: true; companyScope: AdminSettingsCompanyScope }
  | { ok: false; response: NextResponse };

export async function requireAdminSettingsCompanyScope(
  options: CompanyApiAccessGuardOptions = {},
): Promise<AdminSettingsCompanyScopeResult> {
  const session = await getCurrentWaflSession();
  const companyId = session?.companyId?.trim();

  if (!session || !companyId) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: ADMIN_SETTINGS_COMPANY_SESSION_REQUIRED },
        { status: 401 },
      ),
    };
  }

  const blockedResponse = await createCompanyApiAccessBlockedResponse(companyId, options);
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

export async function getAdminSettingsCompanyScope(): Promise<AdminSettingsCompanyScope | null> {
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
