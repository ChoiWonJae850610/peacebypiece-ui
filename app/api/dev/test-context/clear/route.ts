import { NextResponse } from "next/server";

import { getCurrentWaflAuthSession } from "@/lib/auth/currentSession";
import { isActiveSystemAdminSession } from "@/lib/auth/systemAdminAccess";
import {
  getDevTestContextDisabledReasonForSystemAdmin,
  isDevTestContextActionAllowedForSystemAdmin,
} from "@/lib/dev/testContext/config";
import { WAFL_DEV_TEST_CONTEXT_COOKIE } from "@/lib/dev/testContext/session";
import { createSystemAuditLogSafe } from "@/lib/system/audit/repository";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const actualSession = await getCurrentWaflAuthSession();
  if (!actualSession) {
    return NextResponse.json({ error: "SESSION_REQUIRED" }, { status: 401 });
  }
  const isSystemAdmin = await isActiveSystemAdminSession(actualSession);
  if (!isSystemAdmin) {
    return NextResponse.json({ error: "SYSTEM_ADMIN_REQUIRED" }, { status: 403 });
  }
  if (!isDevTestContextActionAllowedForSystemAdmin(isSystemAdmin)) {
    return NextResponse.json(
      { error: "DEV_TEST_CONTEXT_DISABLED", reason: getDevTestContextDisabledReasonForSystemAdmin(isSystemAdmin) },
      { status: 403 },
    );
  }

  await createSystemAuditLogSafe({
    actorUserId: actualSession.userId,
    actorRole: actualSession.role === "system_admin" ? "system_admin" : "customer_admin",
    companyId: actualSession.companyId,
    targetType: "auth",
    targetId: actualSession.userId,
    eventType: "dev_test.context_cleared",
    severity: "low",
    summary: `개발 테스트 컨텍스트 복구: ${actualSession.email}`,
    metadata: { restoredRole: actualSession.role, restoredCompanyId: actualSession.companyId },
  });

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
