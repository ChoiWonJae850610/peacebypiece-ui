import { NextResponse } from "next/server";

import { getCurrentWaflSession } from "@/lib/auth/currentSession";
import { listCurrentPolicyAgreementStatus } from "@/lib/policies/policyAgreementRepository";

export const runtime = "nodejs";

export async function GET() {
  const session = await getCurrentWaflSession();
  const companyId = session?.companyId?.trim();
  const userId = session?.userId?.trim();

  if (!session || !companyId || !userId) {
    return NextResponse.json({ ok: false, error: "POLICY_SESSION_REQUIRED" }, { status: 401 });
  }

  try {
    const status = await listCurrentPolicyAgreementStatus({ companyId, userId });
    return NextResponse.json({ ok: true, status });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "POLICY_CURRENT_STATUS_FAILED",
        message: error instanceof Error ? error.message : String(error || "UNKNOWN_POLICY_ERROR"),
      },
      { status: 500 },
    );
  }
}
