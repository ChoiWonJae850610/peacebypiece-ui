import "server-only";

import { redirect } from "next/navigation";

import { getCurrentWaflSession } from "@/lib/auth/currentSession";
import { getCompanyAccessState } from "@/lib/billing/companyAccessRepository";
import { createDevSystemAdminSession, isDevSystemAdminEntryEnabled } from "@/lib/system/devSystemAdmin";
import type { WaflSessionPayload, WaflSessionRole } from "@/lib/auth/session";

type ProtectedArea = "admin" | "system" | "worker";

type CompanyAccessGuardOptions = {
  allowBlockedCompanyAccess?: boolean;
};

function getRoleHomePath(role: WaflSessionRole): string {
  if (role === "system_admin") return "/system";
  if (role === "company_admin") return "/admin";
  return "/worker";
}

function getCompanyAccessBlockedPath(area: ProtectedArea): string {
  return area === "admin" ? "/admin/subscription" : "/service-paused";
}

function canAccessProtectedArea(role: WaflSessionRole, area: ProtectedArea): boolean {
  if (area === "system") return role === "system_admin";
  if (area === "admin") return role === "company_admin";
  return role === "member" || role === "company_admin";
}

function shouldCheckCompanyAccess(area: ProtectedArea, role: WaflSessionRole): boolean {
  if (area === "worker") return role === "member" || role === "company_admin";
  return area === "admin" && role === "company_admin";
}

export async function requireWaflSessionForArea(
  area: ProtectedArea,
  options: CompanyAccessGuardOptions = {},
): Promise<WaflSessionPayload> {
  const session = await getCurrentWaflSession();
  if (!session) {
    if (area === "system" && isDevSystemAdminEntryEnabled()) {
      return createDevSystemAdminSession();
    }

    redirect("/?error=SESSION_REQUIRED");
  }

  if (!canAccessProtectedArea(session.role, area)) {
    redirect(getRoleHomePath(session.role));
  }

  if (session.companyId && shouldCheckCompanyAccess(area, session.role)) {
    const accessState = await getCompanyAccessState(session.companyId);
    if (accessState?.accessBlocked && !options.allowBlockedCompanyAccess) {
      redirect(getCompanyAccessBlockedPath(area));
    }
  }

  return session;
}
