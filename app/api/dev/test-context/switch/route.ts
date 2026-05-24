import { NextResponse } from "next/server";

import { getCurrentWaflAuthSession } from "@/lib/auth/currentSession";
import { getDevTestContextDisabledReason, isDevTestContextEnabled } from "@/lib/dev/testContext/config";
import { createDevTestContextOverlayPayload } from "@/lib/dev/testContext/service";
import { createDevTestContextCookieValue, WAFL_DEV_TEST_CONTEXT_COOKIE } from "@/lib/dev/testContext/session";

export const dynamic = "force-dynamic";

type SwitchRequestBody = {
  companyMemberId?: unknown;
};

export async function POST(request: Request) {
  if (!isDevTestContextEnabled()) {
    return NextResponse.json({ error: "DEV_TEST_CONTEXT_DISABLED", reason: getDevTestContextDisabledReason() }, { status: 404 });
  }

  const actualSession = await getCurrentWaflAuthSession();
  if (!actualSession) {
    return NextResponse.json({ error: "SESSION_REQUIRED" }, { status: 401 });
  }
  if (actualSession.role === "system_admin") {
    return NextResponse.json({ error: "SYSTEM_ADMIN_NOT_ALLOWED" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as SwitchRequestBody | null;
  const companyMemberId = typeof body?.companyMemberId === "string" ? body.companyMemberId.trim() : "";
  if (!companyMemberId) {
    return NextResponse.json({ error: "COMPANY_MEMBER_ID_REQUIRED" }, { status: 400 });
  }

  const result = await createDevTestContextOverlayPayload(actualSession, companyMemberId);
  if (!result) {
    return NextResponse.json({ error: "INVALID_TEST_CONTEXT_TARGET" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true, target: result.target }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(WAFL_DEV_TEST_CONTEXT_COOKIE, createDevTestContextCookieValue(result.payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: new URL(request.url).protocol === "https:",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}
