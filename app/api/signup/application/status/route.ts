import { NextResponse } from "next/server";

import { getCurrentSignupApplicantSession } from "@/lib/signup/currentSignupApplicantSession";
import {
  getOwnedSignupApplication,
  SignupApplicationApiError,
  summarizeSignupApplication,
} from "@/lib/signup/signupApplicationApiService";

function jsonError(error: unknown): NextResponse {
  if (error instanceof SignupApplicationApiError) {
    return NextResponse.json({ ok: false, code: error.code }, { status: error.status, headers: { "Cache-Control": "no-store" } });
  }
  return NextResponse.json({ ok: false, code: "SIGNUP_APPLICATION_STATUS_UNAVAILABLE" }, { status: 500, headers: { "Cache-Control": "no-store" } });
}

export async function GET() {
  try {
    const session = await getCurrentSignupApplicantSession();
    if (!session) throw new SignupApplicationApiError("SIGNUP_APPLICANT_SESSION_REQUIRED", 401);
    const application = await getOwnedSignupApplication(session);
    return NextResponse.json({ ok: true, application: summarizeSignupApplication(application) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(error);
  }
}
