import "server-only";

import { NextResponse } from "next/server";

import { getCurrentWaflSession } from "@/lib/auth/currentSession";
import type { PartnerCompanyScope } from "@/lib/partners/types";

export const PARTNER_COMPANY_SESSION_REQUIRED = "PARTNER_COMPANY_SESSION_REQUIRED";

export type PartnerCompanyScopeResult =
  | { ok: true; companyScope: PartnerCompanyScope; userId: string }
  | { ok: false; response: NextResponse };

export async function requirePartnerCompanyScope(): Promise<PartnerCompanyScopeResult> {
  const session = await getCurrentWaflSession();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json(
        { partners: [], processDefinitions: [], error: PARTNER_COMPANY_SESSION_REQUIRED },
        { status: 401 },
      ),
    };
  }

  const companyId = session.companyId?.trim();
  if (!companyId) {
    return {
      ok: false,
      response: NextResponse.json(
        { partners: [], processDefinitions: [], error: PARTNER_COMPANY_SESSION_REQUIRED },
        { status: 401 },
      ),
    };
  }

  return {
    ok: true,
    companyScope: {
      companyId,
      companyName: session.companyName,
    },
    userId: session.userId,
  };
}
