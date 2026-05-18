import { NextRequest, NextResponse } from "next/server";

import { getCurrentWaflSession } from "@/lib/auth/currentSession";
import { createCompanyApiAccessBlockedResponse } from "@/lib/billing/companyApiAccessGuard";
import {
  getCompanyOnboardingProfile,
  updateCompanyOnboardingProfile,
} from "@/lib/admin/settings/companyOnboardingRepository";
import type { CompanyOnboardingUpdateInput } from "@/lib/admin/settings/companyTypes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isUpdateBody(value: unknown): value is CompanyOnboardingUpdateInput {
  return typeof value === "object" && value !== null;
}

function getErrorCode(error: unknown): string {
  return error instanceof Error ? error.message : "COMPANY_ONBOARDING_SAVE_FAILED";
}



async function requireOnboardingCompanyApiAccess(companyId: string): Promise<NextResponse | null> {
  return createCompanyApiAccessBlockedResponse(companyId, {
    allowProfileRequired: true,
    allowApprovalPending: true,
    allowSubscriptionManagement: true,
  });
}
export async function GET() {
  const session = await getCurrentWaflSession();

  if (!session || session.role !== "company_admin" || !session.companyId) {
    return NextResponse.json(
      { profile: null, error: "COMPANY_ADMIN_SESSION_REQUIRED" },
      { status: 401 },
    );
  }

  const blockedResponse = await requireOnboardingCompanyApiAccess(session.companyId);
  if (blockedResponse) return blockedResponse;

  const profile = await getCompanyOnboardingProfile(session);

  if (!profile) {
    return NextResponse.json(
      { profile: null, error: "COMPANY_ONBOARDING_PROFILE_NOT_FOUND" },
      { status: 404 },
    );
  }

  return NextResponse.json({ profile }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: NextRequest) {
  const session = await getCurrentWaflSession();

  if (!session || session.role !== "company_admin" || !session.companyId) {
    return NextResponse.json(
      { profile: null, error: "COMPANY_ADMIN_SESSION_REQUIRED" },
      { status: 401 },
    );
  }

  const blockedResponse = await requireOnboardingCompanyApiAccess(session.companyId);
  if (blockedResponse) return blockedResponse;

  const body = (await request.json().catch(() => null)) as unknown;
  if (!isUpdateBody(body)) {
    return NextResponse.json(
      { profile: null, error: "COMPANY_ONBOARDING_PAYLOAD_REQUIRED" },
      { status: 400 },
    );
  }

  try {
    const profile = await updateCompanyOnboardingProfile(session, body);
    if (!profile) {
      return NextResponse.json(
        { profile: null, error: "COMPANY_ONBOARDING_PROFILE_NOT_FOUND" },
        { status: 404 },
      );
    }

    return NextResponse.json({ profile }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const code = getErrorCode(error);
    const status = code === "COMPANY_ONBOARDING_REQUIRED_FIELDS" ? 400 : 500;
    return NextResponse.json({ profile: null, error: code }, { status });
  }
}
