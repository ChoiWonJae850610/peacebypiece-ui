import { NextResponse } from "next/server";

import { getCurrentWaflSession } from "@/lib/auth/currentSession";
import { agreeToCurrentRequiredPolicies } from "@/lib/policies/policyAgreementRepository";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getCurrentWaflSession();
  const companyId = session?.companyId?.trim();
  const userId = session?.userId?.trim();

  if (!session || !companyId || !userId) {
    return NextResponse.json({ ok: false, error: "POLICY_SESSION_REQUIRED" }, { status: 401 });
  }

  try {
    const status = await agreeToCurrentRequiredPolicies({
      companyId,
      userId,
      agreementSource: "workspace_legal",
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({ ok: true, status });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "POLICY_AGREEMENT_FAILED",
        message: error instanceof Error ? error.message : String(error || "UNKNOWN_POLICY_ERROR"),
      },
      { status: 500 },
    );
  }
}
