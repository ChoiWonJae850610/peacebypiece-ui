import { NextResponse } from "next/server";

import { WAFL_AUTH_SESSION_COOKIE } from "@/lib/auth/session";
import { WAFL_DEV_TEST_CONTEXT_COOKIE } from "@/lib/dev/testContext/session";
import { getMobileDevSessionRuntimeConfig, isExternalMobileConnectRequest } from "@/lib/mobile-dev-session/config";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "private, no-store" } as const;

export async function POST(request: Request) {
  const config = getMobileDevSessionRuntimeConfig();
  if (!config || !isExternalMobileConnectRequest(request, config)) {
    return new NextResponse(null, { status: 404, headers: noStore });
  }

  const response = NextResponse.json({ ok: true, disconnected: true }, { headers: noStore });
  for (const name of [WAFL_AUTH_SESSION_COOKIE, WAFL_DEV_TEST_CONTEXT_COOKIE]) {
    response.cookies.set(name, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
  }
  return response;
}
