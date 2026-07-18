import "server-only";

import { getCurrentWaflAuthSession, getCurrentWaflSession } from "@/lib/auth/currentSession";
import { requireWorkspaceApiGuard } from "@/lib/auth/apiRouteGuards";
import { isActiveSystemAdminSession } from "@/lib/auth/systemAdminAccess";
import type { WaflSessionPayload } from "@/lib/auth/session";
import { buildDevTestContextOptions } from "@/lib/dev/testContext/service";
import { getWorkOrderV2ReadRuntimeGuard } from "@/lib/domain/work-orders/read/runtimeGuard";
import { getMobileDevSessionRegistry } from "@/lib/mobile-dev-session/registry";

const ROLE_LABELS: Record<WaflSessionPayload["role"], string> = {
  company_admin: "고객사 관리자",
  member: "구성원",
  system_admin: "시스템 관리자",
};

export type MobileConnectIssueResult =
  | {
      readonly ok: true;
      readonly code: string;
      readonly expiresAt: string;
      readonly effectiveUserName: string;
      readonly effectiveCompanyName: string;
      readonly effectiveRoleLabel: string;
    }
  | { readonly ok: false; readonly reason: "unauthorized" | "forbidden" | "runtime-blocked" };

export async function issueMobileConnectCode(runToken: string): Promise<MobileConnectIssueResult> {
  const readRuntime = getWorkOrderV2ReadRuntimeGuard();
  if (!readRuntime.ok) return { ok: false, reason: "runtime-blocked" };

  const [actualSession, effectiveSession] = await Promise.all([
    getCurrentWaflAuthSession(),
    getCurrentWaflSession(),
  ]);
  if (!actualSession || !effectiveSession) return { ok: false, reason: "unauthorized" };
  if (!(await isActiveSystemAdminSession(actualSession))) return { ok: false, reason: "forbidden" };

  const context = await buildDevTestContextOptions(actualSession, effectiveSession);
  if (!context.activeTarget || context.activeTarget.targetType !== "company") {
    return { ok: false, reason: "forbidden" };
  }

  const workspaceGuard = await requireWorkspaceApiGuard({ permissionCode: "workorder.read" });
  if (!workspaceGuard.ok || !effectiveSession.companyId || !effectiveSession.companyMemberId || !effectiveSession.companyName) {
    return { ok: false, reason: "forbidden" };
  }

  const issuedAt = new Date().toISOString();
  const issued = getMobileDevSessionRegistry().issue({
    runToken,
    payload: {
      ...effectiveSession,
      issuedAt,
      companyInvitationToken: null,
    },
  });

  return {
    ok: true,
    code: issued.code,
    expiresAt: new Date(issued.expiresAt).toISOString(),
    effectiveUserName: effectiveSession.name,
    effectiveCompanyName: effectiveSession.companyName,
    effectiveRoleLabel: ROLE_LABELS[effectiveSession.role],
  };
}

export function exchangeMobileConnectCode(code: unknown, runToken: string) {
  return getMobileDevSessionRegistry().exchange({ code, runToken });
}
