import { NextResponse } from "next/server";

import { requireSystemAdminScope } from "@/lib/system/sessionScope";
import { getSignupProvisioningPlan } from "@/lib/signup/signupApplicationProvisioningRepository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const scope = await requireSystemAdminScope();
  if (!scope.ok) return scope.response;

  const { applicationId } = await params;
  try {
    const plan = await getSignupProvisioningPlan({ applicationId });
    return NextResponse.json(
      { ok: true, plan },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { ok: false, code: "SIGNUP_PROVISIONING_PLAN_UNAVAILABLE" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
