import { NextResponse } from "next/server";

import { createWaflSessionCookieValue, WAFL_AUTH_SESSION_COOKIE } from "@/lib/auth/session";
import { getMobileDevSessionRuntimeConfig, isTailscaleAutoConnectRequest } from "@/lib/mobile-dev-session/config";
import { createTailscaleDeveloperSession } from "@/lib/mobile-dev-session/tailscaleAutoConnect";
import type { MobileConnectErrorResponse, MobileDeveloperAutoConnectResponse } from "@/lib/mobile-dev-session/types";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "private, no-store" } as const;
const MAX_SESSION_AGE_SECONDS = 2 * 60 * 60;

function unavailable() {
  return NextResponse.json<MobileConnectErrorResponse>(
    { ok: false, code: "MOBILE_DEVELOPER_AUTO_CONNECT_UNAVAILABLE", message: "개발자 자동 연결을 사용할 수 없습니다." },
    { status: 403, headers: noStore },
  );
}

async function hasOnlyEmptyBody(request: Request): Promise<boolean> {
  const length = request.headers.get("content-length")?.trim();
  if (!length || length === "0") return true;
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return false;
  try {
    const value = await request.json();
    return Boolean(value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const config = getMobileDevSessionRuntimeConfig();
  if (!config || !isTailscaleAutoConnectRequest(request, config)) {
    return new NextResponse(null, { status: 404, headers: noStore });
  }
  if (!(await hasOnlyEmptyBody(request)) || !config.developerLoginSha256 || !config.developerSystemAdminEmailSha256) return unavailable();

  const result = await createTailscaleDeveloperSession({
    rawLoginHeader: request.headers.get("tailscale-user-login"),
    approvedLoginSha256: config.developerLoginSha256,
    approvedSystemAdminEmailSha256: config.developerSystemAdminEmailSha256,
  });
  if (!result.ok) return unavailable();

  const response = NextResponse.json<MobileDeveloperAutoConnectResponse>(
    { ok: true, connected: true, mode: "tailscale-developer" },
    { headers: noStore },
  );
  response.cookies.set(WAFL_AUTH_SESSION_COOKIE, createWaflSessionCookieValue(result.payload), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_SESSION_AGE_SECONDS,
  });
  return response;
}
