import "server-only";

import { NextResponse } from "next/server";

import { adminMemberRepository } from "@/lib/admin/members/memberRepository";
import { createCompanyApiAccessBlockedResponse, type CompanyApiAccessGuardOptions } from "@/lib/billing/companyApiAccessGuard";
import { getCurrentWaflSession } from "@/lib/auth/currentSession";
import type { WaflSessionPayload } from "@/lib/auth/session";
import { hasMemberPermission, type MemberPermissionCode } from "@/lib/permissions";

export type WorkspaceApiVisibilityScope =
  | { mode: "company" }
  | {
      mode: "assigned";
      userId: string;
      companyMemberId: string | null;
    };

export type WorkspaceApiCompanyScope = {
  companyId: string;
  companyName?: string | null;
  visibility?: WorkspaceApiVisibilityScope;
};

export type WorkspaceApiGuardOptions = {
  permissionCode?: MemberPermissionCode;
  companyAccessOptions?: CompanyApiAccessGuardOptions;
};

export type WorkspaceApiGuardResult =
  | {
      ok: true;
      session: WaflSessionPayload;
      scope: WorkspaceApiCompanyScope;
    }
  | {
      ok: false;
      response: NextResponse;
    };

export type SystemApiGuardResult =
  | {
      ok: true;
      session: WaflSessionPayload;
    }
  | {
      ok: false;
      response: NextResponse;
    };

function createApiErrorResponse(
  message: string,
  code: string,
  status: number,
  extra?: Record<string, unknown>,
): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      message,
      code,
      ...(extra ?? {}),
    },
    { status },
  );
}

export function createApiSessionRequiredResponse(area: "workspace" | "system" | "me" = "workspace"): NextResponse {
  return createApiErrorResponse(
    `${area} session is required for this request.`,
    "API_SESSION_REQUIRED",
    401,
    { area },
  );
}

export function createWorkspaceCompanyRequiredResponse(): NextResponse {
  return createApiErrorResponse(
    "Company session is required for workspace requests.",
    "COMPANY_SESSION_REQUIRED",
    401,
  );
}

export function createWorkspacePermissionRequiredResponse(
  permissionCode: MemberPermissionCode,
): NextResponse {
  return createApiErrorResponse(
    "Current user does not have permission to access this workspace action.",
    "WORKSPACE_PERMISSION_REQUIRED",
    403,
    { permissionCode },
  );
}

export function createSystemAdminRequiredResponse(): NextResponse {
  return createApiErrorResponse(
    "System administrator session is required for this request.",
    "SYSTEM_ADMIN_REQUIRED",
    403,
  );
}

function buildWorkspaceApiScope(session: WaflSessionPayload): WorkspaceApiCompanyScope | null {
  const companyId = session.companyId?.trim();
  if (!companyId) return null;

  return {
    companyId,
    companyName: session.companyName,
    visibility:
      session.role === "member"
        ? {
            mode: "assigned",
            userId: session.userId,
            companyMemberId: session.companyMemberId,
          }
        : { mode: "company" },
  };
}

export async function hasWorkspaceApiPermission(
  session: WaflSessionPayload,
  permissionCode: MemberPermissionCode,
): Promise<boolean> {
  if (session.role === "company_admin") return true;
  if (session.role !== "member" || !session.companyId || !session.companyMemberId) return false;

  const { members } = await adminMemberRepository.listCompanyMembers({
    companyId: session.companyId,
    status: "all",
    limit: 200,
  });
  const member = members.find((item) => item.id === session.companyMemberId);

  return Boolean(
    member &&
      member.status === "approved" &&
      hasMemberPermission(member, permissionCode),
  );
}

export async function requireWorkspaceApiGuard(
  options: WorkspaceApiGuardOptions = {},
): Promise<WorkspaceApiGuardResult> {
  const session = await getCurrentWaflSession();
  if (!session) {
    return { ok: false, response: createApiSessionRequiredResponse("workspace") };
  }

  if (session.role !== "company_admin" && session.role !== "member") {
    return { ok: false, response: createWorkspaceCompanyRequiredResponse() };
  }

  const scope = buildWorkspaceApiScope(session);
  if (!scope) {
    return { ok: false, response: createWorkspaceCompanyRequiredResponse() };
  }

  const blockedResponse = await createCompanyApiAccessBlockedResponse(
    scope.companyId,
    options.companyAccessOptions,
  );
  if (blockedResponse) {
    return { ok: false, response: blockedResponse };
  }

  if (options.permissionCode) {
    const hasPermission = await hasWorkspaceApiPermission(
      session,
      options.permissionCode,
    );
    if (!hasPermission) {
      return {
        ok: false,
        response: createWorkspacePermissionRequiredResponse(options.permissionCode),
      };
    }
  }

  return { ok: true, session, scope };
}

export async function requireSystemApiGuard(): Promise<SystemApiGuardResult> {
  const session = await getCurrentWaflSession();
  if (!session) {
    return { ok: false, response: createApiSessionRequiredResponse("system") };
  }

  if (session.role !== "system_admin") {
    return { ok: false, response: createSystemAdminRequiredResponse() };
  }

  return { ok: true, session };
}
