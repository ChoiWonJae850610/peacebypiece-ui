import { NextResponse } from "next/server";

import { requireSystemAdminScope } from "@/lib/system/sessionScope";
import {
  getSignupReviewApplicationDetail,
  isSignupReviewTransitionAction,
  transitionSignupReviewApplication,
  type SignupReviewStatus,
} from "@/lib/system/signupReviewRepository";

export const runtime = "nodejs";

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const url = new URL(request.url);
  return origin === `${url.protocol}//${url.host}`;
}

function statusForError(error: unknown): number {
  const code = error instanceof Error ? error.message : "";
  if (code === "SIGNUP_REVIEW_REASON_REQUIRED" || code === "SIGNUP_REVIEW_EXPECTED_STATUS_INVALID") return 400;
  if (code === "SIGNUP_REVIEW_TRANSITION_CONFLICT") return 409;
  if (code === "SIGNUP_REVIEW_APPLICATION_NOT_FOUND") return 404;
  return 500;
}

function codeForError(error: unknown): string {
  const code = error instanceof Error ? error.message : "";
  if (
    code === "SIGNUP_REVIEW_REASON_REQUIRED"
    || code === "SIGNUP_REVIEW_EXPECTED_STATUS_INVALID"
    || code === "SIGNUP_REVIEW_TRANSITION_CONFLICT"
    || code === "SIGNUP_REVIEW_APPLICATION_NOT_FOUND"
  ) {
    return code;
  }
  return "SIGNUP_REVIEW_TRANSITION_FAILED";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const scope = await requireSystemAdminScope();
  if (!scope.ok) return scope.response;

  const { applicationId } = await params;
  try {
    const application = await getSignupReviewApplicationDetail(applicationId);
    if (!application) {
      return NextResponse.json(
        { ok: false, code: "SIGNUP_REVIEW_APPLICATION_NOT_FOUND" },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.json({ ok: true, application }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(
      { ok: false, code: "SIGNUP_REVIEW_DETAIL_UNAVAILABLE" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const scope = await requireSystemAdminScope();
  if (!scope.ok) return scope.response;
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { ok: false, code: "SIGNUP_REVIEW_SAME_ORIGIN_REQUIRED" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { applicationId } = await params;
  try {
    const body = (await request.json()) as {
      action?: unknown;
      expectedStatus?: unknown;
      reason?: unknown;
    };
    if (!isSignupReviewTransitionAction(body.action)) {
      return NextResponse.json(
        { ok: false, code: "SIGNUP_REVIEW_ACTION_INVALID" },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }
    const application = await transitionSignupReviewApplication({
      applicationId,
      action: body.action,
      expectedStatus: String(body.expectedStatus ?? "") as SignupReviewStatus,
      actorSystemUserId: scope.systemScope.userId,
      reason: body.reason,
    });
    return NextResponse.json({ ok: true, application }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json(
      { ok: false, code: codeForError(error) },
      { status: statusForError(error), headers: { "Cache-Control": "no-store" } },
    );
  }
}
