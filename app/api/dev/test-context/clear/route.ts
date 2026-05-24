import { NextResponse } from "next/server";

import { getCurrentWaflAuthSession } from "@/lib/auth/currentSession";
import { getDevTestContextDisabledReason, isDevTestContextEnabled } from "@/lib/dev/testContext/config";
import { WAFL_DEV_TEST_CONTEXT_COOKIE } from "@/lib/dev/testContext/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isDevTestContextEnabled()) {
    return NextResponse.json({ error: "DEV_TEST_CONTEXT_DISABLED", reason: getDevTestContextDisabledReason() }, { status: 404 });
  }

  const actualSession = await getCurrentWaflAuthSession();
  if (!actualSession) {
    return NextResponse.json({ error: "SESSION_REQUIRED" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(WAFL_DEV_TEST_CONTEXT_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: new URL(request.url).protocol === "https:",
    path: "/",
    maxAge: 0,
  });

  return response;
}
