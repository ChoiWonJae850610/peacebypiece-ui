import { NextResponse } from "next/server";

import {
  GOOGLE_OAUTH_STATE_COOKIE,
  createGoogleOAuthAuthorizationUrl,
  createGoogleOAuthNonce,
  encodeGoogleOAuthState,
  type GoogleOAuthRequestType,
} from "@/lib/auth/googleOAuth";

function readRequestType(url: URL): GoogleOAuthRequestType {
  const intent = url.searchParams.get("intent")?.trim();
  const requestType = url.searchParams.get("requestType")?.trim();
  if (intent === "login" || requestType === "login") return "login";
  if (requestType === "company") return "company";
  return "member";
}

function toErrorRedirect(request: Request, requestType: GoogleOAuthRequestType, error: string, token: string | null): NextResponse {
  if (requestType === "login") {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, request.url));
  }

  if (token) {
    const inviteBase = requestType === "company" ? "company" : "member";
    return NextResponse.redirect(new URL(`/invite/${inviteBase}/${encodeURIComponent(token)}?error=${encodeURIComponent(error)}`, request.url));
  }

  return NextResponse.redirect(new URL(`/invite/error?error=${encodeURIComponent(error)}`, request.url));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestType = readRequestType(url);
  const token = url.searchParams.get("token")?.trim() || null;

  try {
    if ((requestType === "member" || requestType === "company") && !token) {
      return toErrorRedirect(request, requestType, "INVITATION_TOKEN_REQUIRED", token);
    }

    const nonce = createGoogleOAuthNonce();
    const state = encodeGoogleOAuthState({
      nonce,
      token,
      requestType,
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
    return toErrorRedirect(request, requestType, message, token);
  }
}
