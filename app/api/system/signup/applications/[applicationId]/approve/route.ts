import { NextResponse } from "next/server";

import { requireSystemAdminScope } from "@/lib/system/sessionScope";
import { createPostgresSignupApplicationRepository } from "@/lib/signup/signupApplicationRepository";
import {
  getSignupApprovalProvisioningExecutionGate,
} from "@/lib/signup/signupApplicationProvisioningPolicy";
import {
  SignupProvisioningPlanError,
  createPostgresSignupApprovalProvisioningRepository,
  getSignupProvisioningPlan,
} from "@/lib/signup/signupApplicationProvisioningRepository";
import { createSignupApplicationService, SignupProvisioningPersistedError } from "@/lib/signup/signupApplicationService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const url = new URL(request.url);
  return origin === `${url.protocol}//${url.host}`;
}

function jsonError(code: string, status: number, extra: Record<string, unknown> = {}) {
  return NextResponse.json(
    { ok: false, code, ...extra },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function statusForProvisioningError(error: unknown): number {
  if (error instanceof SignupProvisioningPlanError) {
    if (error.code === "SIGNUP_APPROVAL_STATUS_CONFLICT") return 409;
    if (error.code === "SIGNUP_PROVISIONING_ALREADY_RUNNING") return 409;
    return 400;
  }
  if (error instanceof SignupProvisioningPersistedError) return 500;
  return 500;
}

function codeForProvisioningError(error: unknown): string {
  if (error instanceof SignupProvisioningPlanError) return error.code;
  if (error instanceof SignupProvisioningPersistedError) return error.code;
  return "SIGNUP_PROVISIONING_FAILED";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const scope = await requireSystemAdminScope();
  if (!scope.ok) return scope.response;
  if (!isSameOrigin(request)) {
    return jsonError("SIGNUP_REVIEW_SAME_ORIGIN_REQUIRED", 403);
  }

  const { applicationId } = await params;
  const body = await request.json().catch(() => ({})) as { confirmation?: unknown };
  const plan = await getSignupProvisioningPlan({ applicationId });
  const gate = getSignupApprovalProvisioningExecutionGate({
    confirmation: typeof body.confirmation === "string" ? body.confirmation : null,
  });
  if (!gate.enabled) {
    return jsonError("SIGNUP_PROVISIONING_EXECUTION_BLOCKED", 423, {
      gate,
      plan,
    });
  }

  try {
    const repository = createPostgresSignupApplicationRepository();
    const application = await repository.findById(applicationId);
    if (!application) {
      return jsonError("SIGNUP_REVIEW_APPLICATION_NOT_FOUND", 404);
    }
    const service = createSignupApplicationService({
      repository,
      provisioning: createPostgresSignupApprovalProvisioningRepository(),
    });
    const approved = await service.approveAndProvision({
      application,
      approvedBySystemUserId: scope.systemScope.userId,
      now: new Date(),
    });
    return NextResponse.json(
      { ok: true, application: approved },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return jsonError(
      codeForProvisioningError(error),
      statusForProvisioningError(error),
    );
  }
}
