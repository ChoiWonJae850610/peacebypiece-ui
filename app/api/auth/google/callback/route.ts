import { NextResponse } from "next/server";

import {
  GOOGLE_OAUTH_STATE_COOKIE,
  decodeGoogleOAuthState,
  exchangeGoogleOAuthCode,
  fetchGoogleUserProfile,
} from "@/lib/auth/googleOAuth";
import { completeGoogleLogin } from "@/lib/auth/loginRepository";
import { normalizeSafeReturnPath } from "@/lib/auth/returnPath";
import { createWaflSessionCookieValue, WAFL_AUTH_SESSION_COOKIE } from "@/lib/auth/session";
import { joinRequestRepository } from "@/lib/invitations/joinRequestRepository";
import { completeCompanyAdminInvitationLogin } from "@/lib/auth/companyInvitationLoginRepository";
import {
  createSignupApplicantSessionCookieValue,
  createSignupApplicantSessionPayload,
  WAFL_SIGNUP_APPLICANT_SESSION_COOKIE,
} from "@/lib/signup/signupApplicantSession";
import { normalizeSignupEmail } from "@/lib/signup/signupApplicationRepository";

function redirectToInvitation(request: Request, requestType: "member" | "company", token: string, error: string): NextResponse {
  return NextResponse.redirect(new URL(`/invite/${requestType}/${encodeURIComponent(token)}?error=${encodeURIComponent(error)}`, request.url));
}

function redirectToLogin(request: Request, error: string): NextResponse {
  return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, request.url));
}

function redirectToSignupPending(request: Request, error?: string): NextResponse {
  const suffix = error ? `&error=${encodeURIComponent(error)}` : "";
  return NextResponse.redirect(new URL(`/pending?type=signup${suffix}`, request.url));
}

function readStoredNonce(request: Request): string | null {
  return request.headers.get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${GOOGLE_OAUTH_STATE_COOKIE}=`))
    ?.split("=")[1] ?? null;
}

function createSessionResponse(request: Request, redirectPath: string, session: Parameters<typeof createWaflSessionCookieValue>[0]): NextResponse {
  const response = NextResponse.redirect(new URL(redirectPath, request.url));
  response.cookies.set(WAFL_AUTH_SESSION_COOKIE, createWaflSessionCookieValue(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: new URL(request.url).protocol === "https:",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  response.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE);
  response.cookies.set(WAFL_SIGNUP_APPLICANT_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: new URL(request.url).protocol === "https:",
    path: "/",
    maxAge: 0,
  });
  return response;
}

function createSignupApplicantSessionResponse(request: Request, profile: Awaited<ReturnType<typeof fetchGoogleUserProfile>>): NextResponse {
  if (profile.emailVerified !== true) {
    return redirectToSignupPending(request, "GOOGLE_EMAIL_NOT_VERIFIED");
  }

  const response = redirectToSignupPending(request);
  response.cookies.set(
    WAFL_SIGNUP_APPLICANT_SESSION_COOKIE,
    createSignupApplicantSessionCookieValue(createSignupApplicantSessionPayload({
      googleSub: profile.sub,
      email: profile.email,
      emailNormalized: normalizeSignupEmail(profile.email),
      applicantName: profile.name,
      googlePictureUrl: profile.picture,
      onboardingState: "verified_identity",
    })),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: new URL(request.url).protocol === "https:",
      path: "/",
      maxAge: 60 * 60 * 24,
    },
  );
  response.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE);
  return response;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code")?.trim() || "";
  const state = decodeGoogleOAuthState(url.searchParams.get("state"));
  const storedNonce = readStoredNonce(request);

  if (!state) {
    return NextResponse.redirect(new URL("/invite/error?error=GOOGLE_OAUTH_STATE_INVALID", request.url));
  }

  if (!code) {
    return state.requestType === "login"
      ? redirectToLogin(request, "GOOGLE_OAUTH_CODE_REQUIRED")
      : redirectToInvitation(request, state.requestType === "company" ? "company" : "member", state.token ?? "", "GOOGLE_OAUTH_CODE_REQUIRED");
  }

  if (!storedNonce || storedNonce !== state.nonce) {
    return state.requestType === "login"
      ? redirectToLogin(request, "GOOGLE_OAUTH_STATE_MISMATCH")
      : redirectToInvitation(request, state.requestType === "company" ? "company" : "member", state.token ?? "", "GOOGLE_OAUTH_STATE_MISMATCH");
  }

  try {
    const accessToken = await exchangeGoogleOAuthCode({ request, code });
    const profile = await fetchGoogleUserProfile(accessToken);

    if (state.requestType === "signup") {
      return createSignupApplicantSessionResponse(request, profile);
    }

    if (state.requestType === "login") {
      const result = await completeGoogleLogin(profile);
      if (result.status === "authenticated") {
        return createSessionResponse(request, normalizeSafeReturnPath(state.returnTo) ?? result.redirectPath, result.session);
      }

      const response = NextResponse.redirect(new URL(result.redirectPath, request.url));
      response.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE);
      return response;
    }

    const token = state.token ?? "";
    if (state.requestType === "company") {
      const result = await completeCompanyAdminInvitationLogin(profile, token);
      return createSessionResponse(request, result.redirectPath, result.session);
    }

    const result = await joinRequestRepository.createJoinRequest({
      rawToken: token,
      requestType: "member",
      applicantName: profile.name,
      applicantEmail: profile.email,
      applicantPhone: null,
      googleSub: profile.sub,
      googlePictureUrl: profile.picture,
      requestMemo: null,
      userId: null,
    });

    const response = NextResponse.redirect(new URL(result.redirectPath, request.url));
    response.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "GOOGLE_OAUTH_CALLBACK_FAILED";
    if (state.requestType === "signup") return redirectToSignupPending(request, message);
    return state.requestType === "login"
      ? redirectToLogin(request, message)
      : redirectToInvitation(request, state.requestType === "company" ? "company" : "member", state.token ?? "", message);
  }
}
