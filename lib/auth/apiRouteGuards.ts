import "server-only";

import { NextResponse } from "next/server";

import { adminMemberRepository } from "@/lib/admin/members/memberRepository";
import { createCompanyApiAccessBlockedResponse, type CompanyApiAccessGuardOptions } from "@/lib/billing/companyApiAccessGuard";
import { getCurrentWaflSession } from "@/lib/auth/currentSession";
import type { WaflSessionPayload } from "@/lib/auth/session";
import { isCompanyAdminSessionRole, isMemberSessionRole, isSystemAdminSessionRole, isWorkspaceSessionRole } from "@/lib/constants/sessionRoles";
import { hasMemberPermission, type MemberPermissionCode } from "@/lib/permissions";

export const WAFL_API_ERROR_CODES = {
  permissionDenied: "WAFL_PERMISSION_DENIED",
  notFound: "WAFL_NOT_FOUND",
  runtimeBlocked: "WAFL_RUNTIME_BLOCKED",
} as const;

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
    { status, headers: { "Cache-Control": "no-store" } },
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

export function createWorkspaceMemberSessionInvalidResponse(): NextResponse {
  return createApiErrorResponse(
    "Current member session is no longer active or does not match the signed-in user.",
    "WORKSPACE_MEMBER_SESSION_INVALID",
    403,
  );
}

export function createWorkspacePermissionRequiredResponse(
  permissionCode: MemberPermissionCode,
): NextResponse {
  return createApiErrorResponse(
    "Current user does not have permission to access this workspace action.",
    WAFL_API_ERROR_CODES.permissionDenied,
    403,
    { permissionCode },
  );
}

export function createSystemAdminRequiredResponse(): NextResponse {
  return createApiErrorResponse(
    "System administrator session is required for this request.",
    WAFL_API_ERROR_CODES.permissionDenied,
    403,
  );
}

export function createWaflNotFoundResponse(): NextResponse {
  return createApiErrorResponse(
    "The requested resource was not found.",
    WAFL_API_ERROR_CODES.notFound,
    404,
  );
}

export function createWaflRuntimeBlockedResponse(reason: string): NextResponse {
  return createApiErrorResponse(
    "This action is blocked in the current runtime.",
    WAFL_API_ERROR_CODES.runtimeBlocked,
    403,
    { reason },
  );
}

function buildWorkspaceApiScope(session: WaflSessionPayload): WorkspaceApiCompanyScope | null {
  const companyId = session.companyId?.trim();
  if (!companyId) return null;

  return {
    companyId,
    companyName: session.companyName,
    visibility:
      isMemberSessionRole(session.role)
        ? {
            mode: "assigned",
            userId: session.userId,
            companyMemberId: session.companyMemberId,
          }
        : { mode: "company" },
  };
}

async function getValidatedWorkspaceMember(session: WaflSessionPayload) {
  if (!isMemberSessionRole(session.role) || !session.companyId || !session.companyMemberId) return null;

  const member = await adminMemberRepository.getCompanyMember({
    companyId: session.companyId,
    companyMemberId: session.companyMemberId,
  });

  if (!member || member.status !== "approved" || member.userId !== session.userId) return null;
  return member;
}

export async function hasWorkspaceApiPermission(
  session: WaflSessionPayload,
  permissionCode: MemberPermissionCode,
): Promise<boolean> {
  if (isCompanyAdminSessionRole(session.role)) return true;
  const member = await getValidatedWorkspaceMember(session);
  return Boolean(member && hasMemberPermission(member, permissionCode));
}

export async function requireWorkspaceApiGuard(
  options: WorkspaceApiGuardOptions = {},
): Promise<WorkspaceApiGuardResult> {
  const session = await getCurrentWaflSession();
  if (!session) {
    return { ok: false, response: createApiSessionRequiredResponse("workspace") };
  }

  if (!isWorkspaceSessionRole(session.role)) {
    return { ok: false, response: createWorkspaceCompanyRequiredResponse() };
  }

  const scope = buildWorkspaceApiScope(session);
  if (!scope) {
    return { ok: false, response: createWorkspaceCompanyRequiredResponse() };
  }

  if (isMemberSessionRole(session.role)) {
    const member = await getValidatedWorkspaceMember(session);
    if (!member) {
      return { ok: false, response: createWorkspaceMemberSessionInvalidResponse() };
    }
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

  if (!isSystemAdminSessionRole(session.role)) {
    return { ok: false, response: createSystemAdminRequiredResponse() };
  }

  return { ok: true, session };
}
