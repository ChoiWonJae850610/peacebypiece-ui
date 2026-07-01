import { NextResponse } from "next/server";

import { createWaflRuntimeBlockedResponse } from "@/lib/auth/apiRouteGuards";
import { requireSystemAdminScope } from "@/lib/system/sessionScope";
import { convertTrialToPaidWithSimulator, getDeletionPlanDryRun } from "@/lib/billing/billingOperationsService";
import { isServerProductionRuntime } from "@/lib/runtime/serverRuntime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(code: string, status: number) {
  return NextResponse.json({ ok: false, code }, { status, headers: { "Cache-Control": "no-store" } });
}

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const url = new URL(request.url);
  return origin === `${url.protocol}//${url.host}`;
}

export async function POST(request: Request) {
  const scope = await requireSystemAdminScope();
  if (!scope.ok) return scope.response;
  if (!isSameOrigin(request)) return jsonError("SYSTEM_BILLING_SAME_ORIGIN_REQUIRED", 403);

  const body = await request.json().catch(() => ({})) as {
    action?: unknown;
    companyId?: unknown;
    simulatorSuccess?: unknown;
  };
  const companyId = typeof body.companyId === "string" ? body.companyId.trim() : "";
  if (!companyId) return jsonError("SYSTEM_BILLING_COMPANY_REQUIRED", 400);

  if (body.action === "trial_conversion_simulator") {
    if (isServerProductionRuntime()) return createWaflRuntimeBlockedResponse("billing simulator is dev/test only");
    const result = await convertTrialToPaidWithSimulator({
      companyId,
      success: body.simulatorSuccess !== false,
      idempotencyKey: `system-trial-conversion:${companyId}:${scope.systemScope.userId}`,
    });
    return NextResponse.json(result, { status: result.ok ? 200 : 409, headers: { "Cache-Control": "no-store" } });
  }

  if (body.action === "deletion_plan_dry_run") {
    return NextResponse.json(
      {
        ok: true,
        plan: getDeletionPlanDryRun({
          companyId,
          legalHold: false,
          dbRowScopes: ["billing_*", "company_export_*", "company-owned rows"],
          r2ObjectKeys: [],
        }),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  return jsonError("SYSTEM_BILLING_ACTION_UNSUPPORTED", 400);
}
