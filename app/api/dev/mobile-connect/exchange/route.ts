import { NextResponse } from "next/server";

import { createWaflSessionCookieValue, WAFL_AUTH_SESSION_COOKIE } from "@/lib/auth/session";
import { getMobileDevSessionRuntimeConfig, isExternalMobileConnectRequest } from "@/lib/mobile-dev-session/config";
import { isMobileConnectCode } from "@/lib/mobile-dev-session/registryCore.mjs";
import { exchangeMobileConnectCode } from "@/lib/mobile-dev-session/service";
import type { MobileConnectErrorResponse, MobileConnectExchangeResponse } from "@/lib/mobile-dev-session/types";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "private, no-store" } as const;
const MAX_SESSION_AGE_SECONDS = 2 * 60 * 60;

function unavailable() {
  return NextResponse.json<MobileConnectErrorResponse>(
    { ok: false, code: "MOBILE_CONNECT_CODE_UNAVAILABLE", message: "연결 코드가 만료되었거나 사용할 수 없습니다." },
    { status: 400, headers: noStore },
  );
}

export async function POST(request: Request) {
  const config = getMobileDevSessionRuntimeConfig();
  if (!config || !isExternalMobileConnectRequest(request, config)) {
    return new NextResponse(null, { status: 404, headers: noStore });
  }

  let code: unknown;
  try {
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return unavailable();
    ({ code } = (await request.json()) as { code?: unknown });
  } catch {
    return unavailable();
  }
  if (!isMobileConnectCode(code)) return unavailable();

  const result = exchangeMobileConnectCode(code, config.runToken);
  if (!result.ok) return unavailable();

  const response = NextResponse.json<MobileConnectExchangeResponse>(
    { ok: true, connected: true },
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
