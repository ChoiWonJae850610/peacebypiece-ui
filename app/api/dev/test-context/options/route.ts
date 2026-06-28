import { NextResponse } from "next/server";

import { getCurrentWaflAuthSession, getCurrentWaflSession } from "@/lib/auth/currentSession";
import { isActiveSystemAdminSession } from "@/lib/auth/systemAdminAccess";
import {
  getDevTestContextDisabledReasonForSystemAdmin,
  isDevTestContextActionAllowedForSystemAdmin,
} from "@/lib/dev/testContext/config";
import { buildDevTestContextOptions } from "@/lib/dev/testContext/service";

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
  const options = await buildDevTestContextOptions(actualSession, effectiveSession);
  const devTestContextEnabled = isDevTestContextActionAllowedForSystemAdmin(isSystemAdmin);

  return NextResponse.json(
    {
      ...options,
      devTestContextEnabled,
      disabledReason: devTestContextEnabled ? null : getDevTestContextDisabledReasonForSystemAdmin(isSystemAdmin),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
