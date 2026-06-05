import { NextResponse } from "next/server";

import { getCurrentWaflSession } from "@/lib/auth/currentSession";
import {
  agreeToRequiredPolicyReagreements,
  listRequiredPolicyReagreementStatus,
} from "@/lib/policies/policyAgreementRepository";

export const runtime = "nodejs";

function getRequestIpAddress(request: Request): string | null {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
}

async function getPolicyReagreementSession() {
  const session = await getCurrentWaflSession();
  const companyId = session?.companyId?.trim();
  const userId = session?.userId?.trim();

  if (!session || !companyId || !userId) {
    return { ok: false as const, response: NextResponse.json({ ok: false, error: "POLICY_SESSION_REQUIRED" }, { status: 401 }) };
  }

  return { ok: true as const, companyId, userId };
}

export async function GET() {
  const guard = await getPolicyReagreementSession();
  if (!guard.ok) return guard.response;

  try {
    const status = await listRequiredPolicyReagreementStatus({ companyId: guard.companyId, userId: guard.userId });
    return NextResponse.json({ ok: true, status });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "POLICY_REAGREEMENT_STATUS_FAILED",
        message: error instanceof Error ? error.message : String(error || "UNKNOWN_POLICY_REAGREEMENT_ERROR"),
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const guard = await getPolicyReagreementSession();
  if (!guard.ok) return guard.response;

  try {
    const status = await agreeToRequiredPolicyReagreements({
      companyId: guard.companyId,
      userId: guard.userId,
      agreementSource: "workspace_reagreement",
      ipAddress: getRequestIpAddress(request),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({ ok: true, status });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "POLICY_REAGREEMENT_SAVE_FAILED",
        message: error instanceof Error ? error.message : String(error || "UNKNOWN_POLICY_REAGREEMENT_ERROR"),
      },
      { status: 500 },
    );
  }
}
