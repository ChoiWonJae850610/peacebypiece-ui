import "server-only";

import { NextResponse } from "next/server";

import { getCurrentWaflSession } from "@/lib/auth/currentSession";
import { createCompanyApiAccessBlockedResponse, type CompanyApiAccessGuardOptions } from "@/lib/billing/companyApiAccessGuard";
import { adminMemberRepository } from "@/lib/admin/members/memberRepository";
import { hasMemberPermission, type MemberPermissionCode } from "@/lib/permissions";

export const ADMIN_SETTINGS_COMPANY_SESSION_REQUIRED =
  "ADMIN_SETTINGS_COMPANY_SESSION_REQUIRED";
export const ADMIN_SETTINGS_COMPANY_PERMISSION_REQUIRED =
  "ADMIN_SETTINGS_COMPANY_PERMISSION_REQUIRED";

export type AdminSettingsCompanyScope = {
  companyId: string;
  companyName: string | null;
  userId: string;
};

export type AdminSettingsCompanyScopeResult =
  | { ok: true; companyScope: AdminSettingsCompanyScope }
  | { ok: false; response: NextResponse };

async function hasAdminSettingsPermission(input: {
  companyId: string;
  companyMemberId: string | null;
  role: string;
  permissionCode: MemberPermissionCode;
}): Promise<boolean> {
  if (input.role === "company_admin") return true;
  if (input.role !== "member" || !input.companyMemberId) return false;

  const { members } = await adminMemberRepository.listCompanyMembers({
    companyId: input.companyId,
    status: "all",
    limit: 200,
  });
  const member = members.find((item) => item.id === input.companyMemberId);

  return Boolean(
    member &&
      member.status === "approved" &&
      hasMemberPermission(member, input.permissionCode),
  );
}

export async function requireAdminSettingsCompanyPermission(
  permissionCode: MemberPermissionCode,
  options: CompanyApiAccessGuardOptions = {},
): Promise<AdminSettingsCompanyScopeResult> {
  const session = await getCurrentWaflSession();
  const companyId = session?.companyId?.trim();

  if (!session || !companyId) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: ADMIN_SETTINGS_COMPANY_SESSION_REQUIRED },
        { status: 401 },
      ),
    };
  }

  const blockedResponse = await createCompanyApiAccessBlockedResponse(companyId, options);
  if (blockedResponse) {
    return { ok: false, response: blockedResponse };
  }

  if (
    !(await hasAdminSettingsPermission({
      companyId,
      companyMemberId: session.companyMemberId,
      role: session.role,
      permissionCode,
    }))
  ) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          error: ADMIN_SETTINGS_COMPANY_PERMISSION_REQUIRED,
          permissionCode,
        },
        { status: 403 },
      ),
    };
  }

  return {
    ok: true,
    companyScope: {
      companyId,
      companyName: session.companyName,
      userId: session.userId,
    },
  };
}

export async function requireAdminSettingsCompanyScope(
  options: CompanyApiAccessGuardOptions = {},
): Promise<AdminSettingsCompanyScopeResult> {
  const session = await getCurrentWaflSession();
  const companyId = session?.companyId?.trim();

  if (!session || !companyId) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: ADMIN_SETTINGS_COMPANY_SESSION_REQUIRED },
        { status: 401 },
      ),
    };
  }

  const blockedResponse = await createCompanyApiAccessBlockedResponse(companyId, options);
  if (blockedResponse) {
    return { ok: false, response: blockedResponse };
  }

  return {
    ok: true,
    companyScope: {
      companyId,
      companyName: session.companyName,
      userId: session.userId,
    },
  };
}

export async function getAdminSettingsCompanyScope(): Promise<AdminSettingsCompanyScope | null> {
  const session = await getCurrentWaflSession();
  const companyId = session?.companyId?.trim();

  if (!session || !companyId) {
    return null;
  }

  return {
    companyId,
    companyName: session.companyName,
    userId: session.userId,
  };
}
