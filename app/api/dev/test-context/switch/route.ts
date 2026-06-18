import { NextResponse } from "next/server";

import { getCurrentWaflAuthSession } from "@/lib/auth/currentSession";
import { isActiveSystemAdminSession } from "@/lib/auth/systemAdminAccess";
import { getDevTestContextDisabledReason, isDevTestContextEnabled } from "@/lib/dev/testContext/config";
import { createDevTestContextOverlayPayload } from "@/lib/dev/testContext/service";
import { createDevTestContextCookieValue, WAFL_DEV_TEST_CONTEXT_COOKIE } from "@/lib/dev/testContext/session";
import { createSystemAuditLogSafe } from "@/lib/system/audit/repository";

export const dynamic = "force-dynamic";

type SwitchRequestBody = {
  targetKey?: unknown;
};

export async function POST(request: Request) {
  if (!isDevTestContextEnabled()) {
    return NextResponse.json({ error: "DEV_TEST_CONTEXT_DISABLED", reason: getDevTestContextDisabledReason() }, { status: 404 });
  }

  const actualSession = await getCurrentWaflAuthSession();
  if (!actualSession) {
    return NextResponse.json({ error: "SESSION_REQUIRED" }, { status: 401 });
  }
  if (!(await isActiveSystemAdminSession(actualSession))) {
    return NextResponse.json({ error: "SYSTEM_ADMIN_REQUIRED" }, { status: 403 });
  }
  const body = (await request.json().catch(() => null)) as SwitchRequestBody | null;
  const targetKey = typeof body?.targetKey === "string" ? body.targetKey.trim() : "";
  if (!targetKey) {
    return NextResponse.json({ error: "TARGET_KEY_REQUIRED" }, { status: 400 });
  }

  const result = await createDevTestContextOverlayPayload(actualSession, targetKey);
  if (!result) {
    return NextResponse.json({ error: "INVALID_TEST_CONTEXT_TARGET" }, { status: 400 });
  }

  await createSystemAuditLogSafe({
    actorUserId: actualSession.userId,
    actorRole: actualSession.role === "system_admin" ? "system_admin" : "customer_admin",
    companyId: actualSession.companyId,
    targetType: "auth",
    targetId: result.target.userId,
    eventType: "dev_test.context_switched",
    severity: "medium",
    summary: `개발 테스트 컨텍스트 전환: ${actualSession.email} → ${result.target.role}`,
    metadata: { targetKey: result.target.targetKey, targetRole: result.target.role, targetCompanyId: result.target.companyId, targetEmail: result.target.email },
  });

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
