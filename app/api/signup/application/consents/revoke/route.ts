import { NextResponse } from "next/server";

import { getCurrentSignupApplicantSession } from "@/lib/signup/currentSignupApplicantSession";
import {
  listOwnedSignupConsents,
  parseSignupConsentType,
  revokeOwnedSignupConsent,
  SignupApplicationApiError,
  summarizeSignupConsent,
  summarizeSignupConsentPolicies,
} from "@/lib/signup";
import { assertSignupRateLimitExtensionPoint, createSignupMutationForbiddenResponse, isSameOriginSignupMutation } from "@/lib/signup/signupRequestGuards";

function jsonError(error: unknown): NextResponse {
  if (error instanceof SignupApplicationApiError) {
    return NextResponse.json({ ok: false, code: error.code }, { status: error.status, headers: { "Cache-Control": "no-store" } });
  }
  return NextResponse.json({ ok: false, code: "SIGNUP_CONSENTS_UNAVAILABLE" }, { status: 500, headers: { "Cache-Control": "no-store" } });
}

async function requireApplicantSession() {
  const session = await getCurrentSignupApplicantSession();
  if (!session) throw new SignupApplicationApiError("SIGNUP_APPLICANT_SESSION_REQUIRED", 401);
  return session;
}

export async function POST(request: Request) {
  try {
    if (!isSameOriginSignupMutation(request)) return createSignupMutationForbiddenResponse();
    assertSignupRateLimitExtensionPoint();
    const session = await requireApplicantSession();
    const consentType = parseSignupConsentType(await request.json().catch(() => null));
    await revokeOwnedSignupConsent({ session, consentType });
    const consents = session.applicationId ? await listOwnedSignupConsents(session) : [];
    return NextResponse.json({
      ok: true,
      policies: summarizeSignupConsentPolicies(),
      consents: consents.map(summarizeSignupConsent),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(error);
  }
}
