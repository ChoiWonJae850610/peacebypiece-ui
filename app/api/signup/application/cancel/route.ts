import { NextResponse } from "next/server";

import { getCurrentSignupApplicantSession } from "@/lib/signup/currentSignupApplicantSession";
import {
  cancelOwnedSignupApplication,
  summarizeSignupApplication,
} from "@/lib/signup/signupApplicationApiService";
import { SignupApplicationApiError } from "@/lib/signup/signupApplicationApiError";
import { assertSignupRateLimitExtensionPoint, createSignupMutationForbiddenResponse, isSameOriginSignupMutation } from "@/lib/signup/signupRequestGuards";

function jsonError(error: unknown): NextResponse {
  if (error instanceof SignupApplicationApiError) {
    return NextResponse.json({ ok: false, code: error.code }, { status: error.status, headers: { "Cache-Control": "no-store" } });
  }
  return NextResponse.json({ ok: false, code: "SIGNUP_APPLICATION_CANCEL_UNAVAILABLE" }, { status: 500, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  try {
    if (!isSameOriginSignupMutation(request)) return createSignupMutationForbiddenResponse();
    assertSignupRateLimitExtensionPoint();
    const session = await getCurrentSignupApplicantSession();
    if (!session) throw new SignupApplicationApiError("SIGNUP_APPLICANT_SESSION_REQUIRED", 401);
    const application = await cancelOwnedSignupApplication({ session });
    return NextResponse.json({ ok: true, application: summarizeSignupApplication(application) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(error);
  }
}
