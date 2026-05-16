import { NextResponse } from "next/server";

import {
  GOOGLE_OAUTH_STATE_COOKIE,
  createGoogleOAuthAuthorizationUrl,
  createGoogleOAuthNonce,
  encodeGoogleOAuthState,
  type GoogleOAuthRequestType,
} from "@/lib/auth/googleOAuth";

function readRequestType(value: string | null): GoogleOAuthRequestType {
  return value === "member" ? "member" : "member";
}

function toErrorRedirect(request: Request, error: string): NextResponse {
  return NextResponse.redirect(new URL(`/invite/error?error=${encodeURIComponent(error)}`, request.url));
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token")?.trim() || "";
    if (!token) return toErrorRedirect(request, "INVITATION_TOKEN_REQUIRED");

    const nonce = createGoogleOAuthNonce();
    const state = encodeGoogleOAuthState({
      nonce,
      token,
      requestType: readRequestType(url.searchParams.get("requestType")),
    });
    const response = NextResponse.redirect(createGoogleOAuthAuthorizationUrl({ request, state }));
    response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, nonce, {
      httpOnly: true,
      sameSite: "lax",
      secure: new URL(request.url).protocol === "https:",
      path: "/",
      maxAge: 10 * 60,
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "GOOGLE_OAUTH_START_FAILED";
    return toErrorRedirect(request, message);
  }
}
