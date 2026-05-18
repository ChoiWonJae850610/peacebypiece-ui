import "server-only";

import { NextResponse } from "next/server";

import { getCurrentWaflSession } from "@/lib/auth/currentSession";
import { createCompanyApiAccessBlockedResponse } from "@/lib/billing/companyApiAccessGuard";

export const ADMIN_MEMBER_COMPANY_SESSION_REQUIRED =
  "ADMIN_MEMBER_COMPANY_SESSION_REQUIRED";

export type AdminMemberCompanyScope = {
  companyId: string;
  companyName: string | null;
  userId: string;
};

export type AdminMemberCompanyScopeResult =
  | { ok: true; companyScope: AdminMemberCompanyScope }
  | { ok: false; response: NextResponse };

export async function requireAdminMemberCompanyScope(): Promise<AdminMemberCompanyScopeResult> {
  const session = await getCurrentWaflSession();
  const companyId = session?.companyId?.trim();

  if (!session || !companyId) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: ADMIN_MEMBER_COMPANY_SESSION_REQUIRED },
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

export async function getAdminMemberCompanyScope(): Promise<AdminMemberCompanyScope | null> {
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
