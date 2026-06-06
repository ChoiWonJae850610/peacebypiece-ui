import { NextResponse } from "next/server";

import { getCurrentCompanySubscription } from "@/lib/billing/companySubscriptionRepository";
import { requireAdminSettingsCompanyScope } from "@/lib/admin/settings/sessionScope";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error || "UNKNOWN_ERROR");
}

export async function GET() {
  const scopeResult = await requireAdminSettingsCompanyScope({
    allowProfileRequired: true,
    allowApprovalPending: true,
    allowSubscriptionManagement: true,
  });
  if (!scopeResult.ok) return scopeResult.response;

  try {
    const subscription = await getCurrentCompanySubscription(scopeResult.companyScope.companyId);
    if (!subscription) {
      return NextResponse.json(
        { ok: false, error: "ADMIN_COMPANY_SUBSCRIPTION_NOT_FOUND" },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(
      { ok: true, subscription },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("[ADMIN_COMPANY_SUBSCRIPTION_UNAVAILABLE]", { message, error });
    return NextResponse.json(
      { ok: false, error: "ADMIN_COMPANY_SUBSCRIPTION_UNAVAILABLE", message },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
