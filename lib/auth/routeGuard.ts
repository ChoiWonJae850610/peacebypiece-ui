import "server-only";

import { redirect } from "next/navigation";

import { getCurrentWaflSession } from "@/lib/auth/currentSession";
import type { WaflSessionPayload, WaflSessionRole } from "@/lib/auth/session";

type ProtectedArea = "admin" | "system" | "worker";

function getRoleHomePath(role: WaflSessionRole): string {
  if (role === "system_admin") return "/system";
  if (role === "company_admin") return "/admin";
  return "/worker";
}

function canAccessProtectedArea(role: WaflSessionRole, area: ProtectedArea): boolean {
  if (area === "system") return role === "system_admin";
  if (area === "admin") return role === "company_admin";
  return role === "member" || role === "company_admin";
}

export async function requireWaflSessionForArea(area: ProtectedArea): Promise<WaflSessionPayload> {
  const session = await getCurrentWaflSession();
  if (!session) {
    redirect("/?error=SESSION_REQUIRED");
  }

  if (!canAccessProtectedArea(session.role, area)) {
    redirect(getRoleHomePath(session.role));
  }

  return session;
}
