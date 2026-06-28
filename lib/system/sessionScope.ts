import "server-only";

import { NextResponse } from "next/server";

import { getCurrentWaflAuthSession } from "@/lib/auth/currentSession";
import { isActiveSystemAdminSession } from "@/lib/auth/systemAdminAccess";

export const SYSTEM_ADMIN_SESSION_REQUIRED = "SYSTEM_ADMIN_SESSION_REQUIRED";
export const SYSTEM_ADMIN_ROLE_REQUIRED = "SYSTEM_ADMIN_ROLE_REQUIRED";

export type SystemAdminScope = {
  userId: string;
  email: string;
  name: string;
  isDevEntry?: boolean;
};

export type SystemAdminScopeResult =
  | { ok: true; systemScope: SystemAdminScope }
  | { ok: false; response: NextResponse };

export async function requireSystemAdminScope(): Promise<SystemAdminScopeResult> {
  const session = await getCurrentWaflAuthSession();

  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: SYSTEM_ADMIN_SESSION_REQUIRED }, { status: 401 }),
    };
  }

  if (session.role !== "system_admin") {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: SYSTEM_ADMIN_ROLE_REQUIRED }, { status: 403 }),
    };
  }

  if (!(await isActiveSystemAdminSession(session))) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: SYSTEM_ADMIN_ROLE_REQUIRED }, { status: 403 }),
    };
  }

  return {
    ok: true,
    systemScope: {
      userId: session.userId,
      email: session.email,
      name: session.name,
    },
  };
}
