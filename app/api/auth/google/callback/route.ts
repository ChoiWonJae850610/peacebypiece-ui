import { NextResponse } from "next/server";

import {
  GOOGLE_OAUTH_STATE_COOKIE,
  decodeGoogleOAuthState,
  exchangeGoogleOAuthCode,
  fetchGoogleUserProfile,
} from "@/lib/auth/googleOAuth";
import { joinRequestRepository } from "@/lib/invitations/joinRequestRepository";

function redirectToInvitation(request: Request, token: string, error: string): NextResponse {
  return NextResponse.redirect(new URL(`/invite/member/${encodeURIComponent(token)}?error=${encodeURIComponent(error)}`, request.url));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code")?.trim() || "";
  const state = decodeGoogleOAuthState(url.searchParams.get("state"));
  const storedNonce = request.headers.get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${GOOGLE_OAUTH_STATE_COOKIE}=`))
    ?.split("=")[1];

  if (!state) {
    return NextResponse.redirect(new URL("/invite/error?error=GOOGLE_OAUTH_STATE_INVALID", request.url));
  }

  if (!code) {
    return redirectToInvitation(request, state.token, "GOOGLE_OAUTH_CODE_REQUIRED");
  }

  if (!storedNonce || storedNonce !== state.nonce) {
    return redirectToInvitation(request, state.token, "GOOGLE_OAUTH_STATE_MISMATCH");
  }

  try {
    const accessToken = await exchangeGoogleOAuthCode({ request, code });
    const profile = await fetchGoogleUserProfile(accessToken);
    const result = await joinRequestRepository.createJoinRequest({
      rawToken: state.token,
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
    return redirectToInvitation(request, state.token, message);
  }
}
