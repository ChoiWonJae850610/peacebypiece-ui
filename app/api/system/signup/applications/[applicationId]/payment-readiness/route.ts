import { NextResponse } from "next/server";

import { createWaflRuntimeBlockedResponse } from "@/lib/auth/apiRouteGuards";
import {
  getSignupPaymentReadiness,
  revokeSignupPaymentReadiness,
  upsertSignupSimulatorPaymentReadiness,
} from "@/lib/billing/signupPaymentReadinessRepository";
import { getServerRuntimeMode, isServerProductionRuntime } from "@/lib/runtime/serverRuntime";
import { requireSystemAdminScope } from "@/lib/system/sessionScope";
import { getSignupReviewApplicationDetail } from "@/lib/system/signupReviewRepository";
import type { BillingRuntimeEnvironment } from "@/lib/billing/billingOperationsTypes";

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

function toBillingEnvironment(): BillingRuntimeEnvironment {
  const mode = getServerRuntimeMode();
  if (mode === "development" || mode === "local" || mode === "test") {
    return mode;
  }
  if (mode === "dev" || mode === "demo") return "dev_test";
  return isServerProductionRuntime() ? "production" : "dev_test";
}

function summarizeReadiness(readiness: Awaited<ReturnType<typeof getSignupPaymentReadiness>>) {
  if (!readiness) {
    return {
      ready: false,
      state: "not_ready",
      providerCode: null,
      maskedDisplay: null,
      environment: null,
      verifiedAt: null,
      isSimulator: false,
    };
  }
  return {
    ready: readiness.readinessState === "ready",
    state: readiness.readinessState,
    providerCode: readiness.providerCode,
    maskedDisplay: readiness.maskedCardDisplay,
    environment: readiness.environment,
    verifiedAt: readiness.verifiedAt,
    isSimulator: readiness.isSimulator,
  };
}

async function requireApplication(applicationId: string) {
  const application = await getSignupReviewApplicationDetail(applicationId);
  return application;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const scope = await requireSystemAdminScope();
  if (!scope.ok) return scope.response;

  const { applicationId } = await params;
  const application = await requireApplication(applicationId);
  if (!application) return jsonError("SIGNUP_REVIEW_APPLICATION_NOT_FOUND", 404);

  const readiness = await getSignupPaymentReadiness(applicationId);
  return NextResponse.json(
    {
      ok: true,
      readiness: summarizeReadiness(readiness),
      productionBlocked: isServerProductionRuntime(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const scope = await requireSystemAdminScope();
  if (!scope.ok) return scope.response;
  if (!isSameOrigin(request)) return jsonError("SIGNUP_REVIEW_SAME_ORIGIN_REQUIRED", 403);
  if (isServerProductionRuntime()) return createWaflRuntimeBlockedResponse("signup fake payment readiness is dev/test only");

  const { applicationId } = await params;
  const application = await requireApplication(applicationId);
  if (!application) return jsonError("SIGNUP_REVIEW_APPLICATION_NOT_FOUND", 404);
  if (application.status === "approved" || application.status === "rejected" || application.status === "canceled") {
    return jsonError("SIGNUP_PAYMENT_READINESS_STATUS_CLOSED", 409);
  }

  const readiness = await upsertSignupSimulatorPaymentReadiness({
    applicationId,
    actorSystemUserId: scope.systemScope.userId,
    environment: toBillingEnvironment(),
    idempotencyKey: `signup-payment-readiness:${applicationId}`,
  });
  return NextResponse.json(
    { ok: true, readiness: summarizeReadiness(readiness) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const scope = await requireSystemAdminScope();
  if (!scope.ok) return scope.response;
  if (!isSameOrigin(request)) return jsonError("SIGNUP_REVIEW_SAME_ORIGIN_REQUIRED", 403);
  if (isServerProductionRuntime()) return createWaflRuntimeBlockedResponse("signup fake payment readiness is dev/test only");

  const { applicationId } = await params;
  const application = await requireApplication(applicationId);
  if (!application) return jsonError("SIGNUP_REVIEW_APPLICATION_NOT_FOUND", 404);
  await revokeSignupPaymentReadiness({
    applicationId,
    actorSystemUserId: scope.systemScope.userId,
  });
  return NextResponse.json(
    { ok: true, readiness: summarizeReadiness(null) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
