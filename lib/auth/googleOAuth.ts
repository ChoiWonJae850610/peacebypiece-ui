import { randomBytes } from "crypto";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

export const GOOGLE_OAUTH_STATE_COOKIE = "wafl_google_oauth_state";

export type GoogleOAuthRequestType = "member" | "company" | "login" | "signup";

export type GoogleOAuthStatePayload = {
  nonce: string;
  token: string | null;
  requestType: GoogleOAuthRequestType;
  returnTo: string | null;
};

export type GoogleUserProfile = {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture: string | null;
};

type GoogleTokenResponse = {
  access_token?: string;
  id_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

type GoogleUserInfoResponse = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

export function createGoogleOAuthNonce(): string {
  return randomBytes(24).toString("base64url");
}

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

export function encodeGoogleOAuthState(payload: GoogleOAuthStatePayload): string {
  return toBase64Url(JSON.stringify(payload));
}

export function decodeGoogleOAuthState(value: string | null): GoogleOAuthStatePayload | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(fromBase64Url(value)) as Partial<GoogleOAuthStatePayload>;
    const requestType = parsed.requestType === "member" || parsed.requestType === "company" || parsed.requestType === "login" || parsed.requestType === "signup" ? parsed.requestType : null;
    const nonce = typeof parsed.nonce === "string" ? parsed.nonce.trim() : "";
    const token = typeof parsed.token === "string" ? parsed.token.trim() : null;
    const returnTo = typeof parsed.returnTo === "string" ? parsed.returnTo.trim() : null;

    if (!requestType || !nonce) return null;
    if ((requestType === "member" || requestType === "company") && !token) return null;
    return { requestType, nonce, token, returnTo };
  } catch {
    return null;
  }
}

export function readGoogleOAuthClientId(): string {
  const value = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  if (!value) throw new Error("GOOGLE_OAUTH_CLIENT_ID_REQUIRED");
  return value;
}

export function readGoogleOAuthClientSecret(): string {
  const value = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  if (!value) throw new Error("GOOGLE_OAUTH_CLIENT_SECRET_REQUIRED");
  return value;
}

export function resolveGoogleOAuthRedirectUri(request: Request): string {
  const configured = process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim();
  if (configured) return configured;

  const url = new URL(request.url);
  return `${url.origin}/api/auth/google/callback`;
}

export function createGoogleOAuthAuthorizationUrl(input: {
  request: Request;
  state: string;
}): string {
  const url = new URL(GOOGLE_AUTH_URL);
  url.searchParams.set("client_id", readGoogleOAuthClientId());
  url.searchParams.set("redirect_uri", resolveGoogleOAuthRedirectUri(input.request));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", input.state);
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

export async function exchangeGoogleOAuthCode(input: {
  request: Request;
  code: string;
}): Promise<string> {
  const body = new URLSearchParams();
  body.set("code", input.code);
  body.set("client_id", readGoogleOAuthClientId());
  body.set("client_secret", readGoogleOAuthClientSecret());
  body.set("redirect_uri", resolveGoogleOAuthRedirectUri(input.request));
  body.set("grant_type", "authorization_code");

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const payload = (await response.json().catch(() => ({}))) as GoogleTokenResponse;

  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error || "GOOGLE_TOKEN_EXCHANGE_FAILED");
  }

  return payload.access_token;
}

export async function fetchGoogleUserProfile(accessToken: string): Promise<GoogleUserProfile> {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const payload = (await response.json().catch(() => ({}))) as GoogleUserInfoResponse;

  if (!response.ok) {
    throw new Error("GOOGLE_USERINFO_FETCH_FAILED");
  }

  const sub = payload.sub?.trim();
  const email = payload.email?.trim().toLowerCase();
  const name = payload.name?.trim() || email;

  if (!sub) throw new Error("GOOGLE_SUB_REQUIRED");
  if (!email) throw new Error("GOOGLE_EMAIL_REQUIRED");

  return {
    sub,
    email,
    emailVerified: payload.email_verified === true,
    name: name || email,
    picture: payload.picture?.trim() || null,
  };
}
