import "server-only";

import { NextResponse } from "next/server";

import { getCurrentWaflSession } from "@/lib/auth/currentSession";
import { createDevSystemAdminScope, isDevSystemAdminEntryEnabled } from "@/lib/system/devSystemAdmin";

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
  const session = await getCurrentWaflSession();

  if (!session) {
    if (isDevSystemAdminEntryEnabled()) {
      return { ok: true, systemScope: createDevSystemAdminScope() };
    }

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

  return {
    ok: true,
    systemScope: {
      userId: session.userId,
      email: session.email,
      name: session.name,
    },
  };
}
