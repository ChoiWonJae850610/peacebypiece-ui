import { NextResponse } from "next/server";

import { getCurrentWaflAuthSession, getCurrentWaflSession } from "@/lib/auth/currentSession";
import { isActiveSystemAdminSession } from "@/lib/auth/systemAdminAccess";
import { getDevTestContextDisabledReason, isDevTestContextEnabled } from "@/lib/dev/testContext/config";
import { buildDevTestContextOptions } from "@/lib/dev/testContext/service";
import { canSwitchTestAccount } from "@/lib/runtime/runtimePolicy";

export const dynamic = "force-dynamic";

export async function GET() {
  const actualSession = await getCurrentWaflAuthSession();
  if (!actualSession) {
    return NextResponse.json({ error: "SESSION_REQUIRED" }, { status: 401 });
  }
  const isSystemAdmin = await isActiveSystemAdminSession(actualSession);
  if (!isSystemAdmin) {
    return NextResponse.json({ error: "SYSTEM_ADMIN_REQUIRED" }, { status: 403 });
  }
  const effectiveSession = (await getCurrentWaflSession()) ?? actualSession;

  if (!canSwitchTestAccount({ isSystemAdmin }) || !isDevTestContextEnabled()) {
    return NextResponse.json(
      {
        actualSession,
        effectiveSession,
        activeTarget: null,
        targets: [],
        devTestContextEnabled: false,
        disabledReason: getDevTestContextDisabledReason(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const options = await buildDevTestContextOptions(actualSession, effectiveSession);

  return NextResponse.json(
    { ...options, devTestContextEnabled: true, disabledReason: null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
