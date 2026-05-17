import "server-only";

import { NextResponse } from "next/server";

import { getCurrentWaflSession } from "@/lib/auth/currentSession";
import { adminMemberRepository } from "@/lib/admin/members/memberRepository";
import { hasMemberPermission, type MemberPermissionCode } from "@/lib/permissions";
import type { WaflSessionPayload } from "@/lib/auth/session";
import type { PartnerCompanyScope } from "@/lib/partners/types";

export const PARTNER_COMPANY_SESSION_REQUIRED = "PARTNER_COMPANY_SESSION_REQUIRED";
export const PARTNER_COMPANY_PERMISSION_REQUIRED = "PARTNER_COMPANY_PERMISSION_REQUIRED";

export type PartnerCompanyScopeResult =
  | { ok: true; companyScope: PartnerCompanyScope; userId: string; session: WaflSessionPayload }
  | { ok: false; response: NextResponse };

async function hasPartnerPermission(session: WaflSessionPayload, permissionCode?: MemberPermissionCode): Promise<boolean> {
  if (!permissionCode) return true;
  if (session.role === "company_admin") return true;
  if (session.role !== "member" || !session.companyId || !session.companyMemberId) return false;

  const { members } = await adminMemberRepository.listCompanyMembers({
    companyId: session.companyId,
    status: "all",
    limit: 100,
  });
  const member = members.find((item) => item.id === session.companyMemberId);

  return Boolean(member && member.status === "approved" && hasMemberPermission(member, permissionCode));
}

export async function requirePartnerCompanyScope(permissionCode?: MemberPermissionCode): Promise<PartnerCompanyScopeResult> {
  const session = await getCurrentWaflSession();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json(
        { partners: [], processDefinitions: [], error: PARTNER_COMPANY_SESSION_REQUIRED },
        { status: 401 },
      ),
    };
  }

  const companyId = session.companyId?.trim();
  if (!companyId) {
    return {
      ok: false,
      response: NextResponse.json(
        { partners: [], processDefinitions: [], error: PARTNER_COMPANY_SESSION_REQUIRED },
        { status: 401 },
      ),
    };
  }

  if (!(await hasPartnerPermission(session, permissionCode))) {
    return {
      ok: false,
      response: NextResponse.json(
        { partners: [], processDefinitions: [], error: PARTNER_COMPANY_PERMISSION_REQUIRED, permissionCode },
        { status: 403 },
      ),
    };
  }

  return {
    ok: true,
    companyScope: {
      companyId,
      companyName: session.companyName,
    },
    userId: session.userId,
    session,
  };
}
