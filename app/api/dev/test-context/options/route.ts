import { NextResponse } from "next/server";

import { getCurrentWaflAuthSession, getCurrentWaflSession } from "@/lib/auth/currentSession";
import { getDevTestContextDisabledReason, isDevTestContextEnabled } from "@/lib/dev/testContext/config";
import { buildDevTestContextOptions } from "@/lib/dev/testContext/service";

export const dynamic = "force-dynamic";

export async function GET() {
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

  const effectiveSession = (await getCurrentWaflSession()) ?? actualSession;
  const options = await buildDevTestContextOptions(actualSession, effectiveSession);

  return NextResponse.json(options, { headers: { "Cache-Control": "no-store" } });
}
