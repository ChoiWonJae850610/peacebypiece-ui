import "server-only";

import { cookies } from "next/headers";

import {
  WAFL_SIGNUP_APPLICANT_SESSION_COOKIE,
  verifySignupApplicantSessionCookieValue,
  type SignupApplicantSessionPayload,
} from "./signupApplicantSession";

export async function getCurrentSignupApplicantSession(): Promise<SignupApplicantSessionPayload | null> {
  const cookieStore = await cookies();
  return verifySignupApplicantSessionCookieValue(cookieStore.get(WAFL_SIGNUP_APPLICANT_SESSION_COOKIE)?.value);
}

export function createSignupApplicantOwner(session: SignupApplicantSessionPayload) {
  return {
    googleSub: session.googleSub,
    emailNormalized: session.emailNormalized,
  };
}
