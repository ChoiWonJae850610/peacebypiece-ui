import { NextResponse } from "next/server";

import { getCurrentSignupApplicantSession } from "@/lib/signup/currentSignupApplicantSession";
import {
  createSignupApplicationDraft,
  getOwnedSignupApplication,
  parseSignupApplicationCompanyInput,
  SignupApplicationApiError,
  summarizeSignupApplication,
  updateOwnedSignupApplicationDraft,
} from "@/lib/signup/signupApplicationApiService";
import {
  type SignupApplicantOnboardingState,
  createSignupApplicantSessionCookieValue,
  createSignupApplicantSessionPayload,
  WAFL_SIGNUP_APPLICANT_SESSION_COOKIE,
} from "@/lib/signup/signupApplicantSession";

function jsonError(error: unknown): NextResponse {
  if (error instanceof SignupApplicationApiError) {
    return NextResponse.json({ ok: false, code: error.code }, { status: error.status, headers: { "Cache-Control": "no-store" } });
  }
  return NextResponse.json({ ok: false, code: "SIGNUP_APPLICATION_UNAVAILABLE" }, { status: 500, headers: { "Cache-Control": "no-store" } });
}

async function requireApplicantSession() {
  const session = await getCurrentSignupApplicantSession();
  if (!session) throw new SignupApplicationApiError("SIGNUP_APPLICANT_SESSION_REQUIRED", 401);
  return session;
}

async function setApplicantSessionApplicationId(response: NextResponse, input: {
  session: Awaited<ReturnType<typeof requireApplicantSession>>;
  applicationId: string;
  onboardingState: SignupApplicantOnboardingState;
  secure: boolean;
}) {
  const payload = createSignupApplicantSessionPayload({
    ...input.session,
    applicationId: input.applicationId,
    onboardingState: input.onboardingState,
  });
  response.cookies.set(WAFL_SIGNUP_APPLICANT_SESSION_COOKIE, createSignupApplicantSessionCookieValue(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: input.secure,
    path: "/",
    maxAge: 60 * 60 * 24,
  });
}

export async function GET() {
  try {
    const session = await requireApplicantSession();
    if (!session.applicationId) {
      return NextResponse.json({ ok: true, application: null }, { headers: { "Cache-Control": "no-store" } });
    }
    const application = await getOwnedSignupApplication(session);
    return NextResponse.json({ ok: true, application: summarizeSignupApplication(application) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApplicantSession();
    const company = parseSignupApplicationCompanyInput(await request.json().catch(() => null));
    const application = await createSignupApplicationDraft({ session, company });
    const response = NextResponse.json({ ok: true, application: summarizeSignupApplication(application) }, { headers: { "Cache-Control": "no-store" } });
    await setApplicantSessionApplicationId(response, {
      session,
      applicationId: application.id,
      onboardingState: "draft",
      secure: new URL(request.url).protocol === "https:",
    });
    return response;
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireApplicantSession();
    const company = parseSignupApplicationCompanyInput(await request.json().catch(() => null));
    const application = await updateOwnedSignupApplicationDraft({ session, company });
    return NextResponse.json({ ok: true, application: summarizeSignupApplication(application) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(error);
  }
}
