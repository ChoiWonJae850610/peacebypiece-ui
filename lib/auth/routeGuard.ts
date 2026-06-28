import "server-only";

import { redirect } from "next/navigation";

import { getCurrentWaflSession } from "@/lib/auth/currentSession";
import { getCompanyAccessState, resolveCompanyAccessBlockReason, type CompanyAccessBlockReason } from "@/lib/billing/companyAccessRepository";
import type { WaflSessionPayload, WaflSessionRole } from "@/lib/auth/session";
import { isCompanyAdminSessionRole, isSystemAdminSessionRole, isWorkspaceSessionRole, SESSION_ROLE } from "@/lib/constants/sessionRoles";
import { hasWorkspaceApiPermission } from "@/lib/auth/apiRouteGuards";
import { buildLoginPath } from "@/lib/auth/returnPath";
import type { MemberPermissionCode } from "@/lib/permissions";
import { getCurrentSignupApplicantSession } from "@/lib/signup/currentSignupApplicantSession";

type ProtectedArea = "workspace" | "system" | "worker" | "me";

type CompanyAccessGuardOptions = {
  allowBlockedCompanyAccess?: boolean;
  returnTo?: string;
};

function getRoleHomePath(role: WaflSessionRole): string {
  if (isSystemAdminSessionRole(role)) return "/system";
  return "/workspace";
}

function getCompanyAccessBlockedPath(area: ProtectedArea, reason: CompanyAccessBlockReason): string {
  if (area !== "workspace") return "/service-paused";
  if (reason === "rejected" || reason === "profile_required" || reason === "approval_pending") {
    return "/service-paused";
  }

  return "/workspace/subscription";
}

function canAccessProtectedArea(role: WaflSessionRole, area: ProtectedArea): boolean {
  if (area === "system") return isSystemAdminSessionRole(role);
  if (area === "workspace" || area === "worker") return isWorkspaceSessionRole(role);
  if (area === "me") return isWorkspaceSessionRole(role) || isSystemAdminSessionRole(role);
  return false;
}

function shouldCheckCompanyAccess(area: ProtectedArea, role: WaflSessionRole): boolean {
  if (area === "worker") return isWorkspaceSessionRole(role);
  return area === "workspace" && isCompanyAdminSessionRole(role);
}

export async function requireWaflSessionForArea(
  area: ProtectedArea,
  options: CompanyAccessGuardOptions = {},
): Promise<WaflSessionPayload> {
  const applicantSession = await getCurrentSignupApplicantSession();
  if (applicantSession && (area === "workspace" || area === "worker")) {
    redirect("/pending?type=signup");
  }

  const session = await getCurrentWaflSession();
  if (!session) {
    redirect(buildLoginPath(options.returnTo, "SESSION_REQUIRED"));
  }

  if (!canAccessProtectedArea(session.role, area)) {
    redirect(getRoleHomePath(session.role));
  }

  if (session.companyId && shouldCheckCompanyAccess(area, session.role)) {
    const accessState = await getCompanyAccessState(session.companyId);
    const blockedReason = accessState
      ? resolveCompanyAccessBlockReason({
          onboardingStatus: accessState.onboardingStatus,
          subscriptionStatus: accessState.subscriptionStatus,
          trialExpired: accessState.trialExpired,
        })
      : null;

    if (blockedReason && !options.allowBlockedCompanyAccess) {
      redirect(getCompanyAccessBlockedPath(area, blockedReason));
    }
  }

  return session;
}


export async function requireWorkspacePagePermission(
  permissionCode: MemberPermissionCode,
  options: CompanyAccessGuardOptions = {},
): Promise<WaflSessionPayload> {
  const session = await requireWaflSessionForArea("workspace", options);

  if (session.role === SESSION_ROLE.companyAdmin) return session;

  const hasPermission = await hasWorkspaceApiPermission(session, permissionCode);
  if (!hasPermission) {
    redirect("/workspace?error=WORKSPACE_PERMISSION_REQUIRED");
  }

  return session;
}
