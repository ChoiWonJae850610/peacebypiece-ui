import "server-only";

import { NextResponse } from "next/server";

import { getCurrentWaflSession } from "@/lib/auth/currentSession";
import { createCompanyApiAccessBlockedResponse } from "@/lib/billing/companyApiAccessGuard";

export const ADMIN_FILE_COMPANY_SESSION_REQUIRED = "ADMIN_FILE_COMPANY_SESSION_REQUIRED";

export type AdminFileCompanyScope = {
  companyId: string;
  companyName: string | null;
  userId: string;
};

export type AdminFileCompanyScopeResult =
  | { ok: true; companyScope: AdminFileCompanyScope }
  | { ok: false; response: NextResponse };

export async function requireAdminFileCompanyScope(): Promise<AdminFileCompanyScopeResult> {
  const session = await getCurrentWaflSession();
  const companyId = session?.companyId?.trim();

  if (!session || !companyId) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: ADMIN_FILE_COMPANY_SESSION_REQUIRED },
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
