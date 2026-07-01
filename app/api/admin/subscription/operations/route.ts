import { NextResponse } from "next/server";

import { requireAdminSettingsCompanyScope } from "@/lib/admin/settings/sessionScope";
import { createWaflRuntimeBlockedResponse } from "@/lib/auth/apiRouteGuards";
import { getCurrentCompanySubscription } from "@/lib/billing/companySubscriptionRepository";
import {
  cancelCompanySubscriptionAtPeriodEnd,
  convertTrialToPaidWithSimulator,
  getDeletionPlanDryRun,
  quoteCompanyPlanDowngrade,
  quoteCompanyPlanUpgrade,
  reverseCompanySubscriptionCancellation,
} from "@/lib/billing/billingOperationsService";
import type { BillingPlanCode } from "@/lib/billing/canonicalBillingPolicy";
import { isServerProductionRuntime } from "@/lib/runtime/serverRuntime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(code: string, status: number, extra: Record<string, unknown> = {}) {
  return NextResponse.json(
    { ok: false, code, ...extra },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const url = new URL(request.url);
  return origin === `${url.protocol}//${url.host}`;
}

function readPaidPlan(value: unknown): Exclude<BillingPlanCode, "trial"> | null {
  return value === "lite" || value === "flow" || value === "studio" || value === "custom" ? value : null;
}

export async function POST(request: Request) {
  const scopeResult = await requireAdminSettingsCompanyScope({
    allowProfileRequired: false,
    allowApprovalPending: false,
    allowSubscriptionManagement: true,
  });
  if (!scopeResult.ok) return scopeResult.response;
  if (!isSameOrigin(request)) return jsonError("BILLING_SAME_ORIGIN_REQUIRED", 403);

  const body = await request.json().catch(() => ({})) as {
    action?: unknown;
    targetPlanCode?: unknown;
    simulatorSuccess?: unknown;
  };
  const action = typeof body.action === "string" ? body.action : "";
  const companyId = scopeResult.companyScope.companyId;

  if (action === "upgrade_quote") {
    const targetPlanCode = readPaidPlan(body.targetPlanCode);
    if (!targetPlanCode) return jsonError("BILLING_TARGET_PLAN_INVALID", 400);
    const quote = await quoteCompanyPlanUpgrade({ companyId, targetPlanCode });
    return NextResponse.json({ ok: true, quote }, { headers: { "Cache-Control": "no-store" } });
  }

  if (action === "downgrade_quote") {
    const targetPlanCode = readPaidPlan(body.targetPlanCode);
    if (!targetPlanCode) return jsonError("BILLING_TARGET_PLAN_INVALID", 400);
    const subscription = await getCurrentCompanySubscription(companyId);
    const quote = await quoteCompanyPlanDowngrade({
      companyId,
      targetPlanCode,
      storageUsedBytes: subscription?.storageUsedBytes ?? 0,
      activeMemberCount: subscription?.activeMemberCount ?? 0,
    });
    return NextResponse.json({ ok: true, quote }, { headers: { "Cache-Control": "no-store" } });
  }

  if (action === "trial_conversion_simulator") {
    if (isServerProductionRuntime()) return createWaflRuntimeBlockedResponse("billing simulator is dev/test only");
    const result = await convertTrialToPaidWithSimulator({
      companyId,
      success: body.simulatorSuccess !== false,
    });
    return NextResponse.json(result, { status: result.ok ? 200 : 409, headers: { "Cache-Control": "no-store" } });
  }

  if (action === "cancel") {
    const result = await cancelCompanySubscriptionAtPeriodEnd({
      companyId,
      actorUserId: scopeResult.companyScope.userId,
    });
    return NextResponse.json(result, { status: result.ok ? 200 : 409, headers: { "Cache-Control": "no-store" } });
  }

  if (action === "reverse_cancel") {
    const result = await reverseCompanySubscriptionCancellation({
      companyId,
      actorUserId: scopeResult.companyScope.userId,
    });
    return NextResponse.json(result, { status: result.ok ? 200 : 409, headers: { "Cache-Control": "no-store" } });
  }

  if (action === "deletion_plan_dry_run") {
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

  return jsonError("BILLING_ACTION_UNSUPPORTED", 400);
}
