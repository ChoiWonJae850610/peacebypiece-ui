import "server-only";

import type { WaflSessionPayload } from "@/lib/auth/session";
import {
  getCompanyAdminMemberRoleTemplateCode,
  getMemberRoleTemplatePermissions,
  mergeDefaultMemberBaseReadPermissions,
  type MemberPermissionCode,
} from "@/lib/permissions";
import { ADMIN_COMPANY_MEMBER_STATUS_FILTER } from "@/lib/domain/memberStatus";
import { adminMemberRepository } from "./memberRepository";

export async function resolveMemberWorkspacePermissionCodes(
  session: WaflSessionPayload,
): Promise<readonly MemberPermissionCode[]> {
  if (session.role === "company_admin") {
    return getMemberRoleTemplatePermissions(getCompanyAdminMemberRoleTemplateCode());
  }

  if (session.role !== "member" || !session.companyId || !session.companyMemberId) {
    return [];
  }

  try {
    const { members } = await adminMemberRepository.listCompanyMembers({
      companyId: session.companyId,
      status: ADMIN_COMPANY_MEMBER_STATUS_FILTER.all,
      limit: 100,
    });

    return mergeDefaultMemberBaseReadPermissions(members.find((member) => member.id === session.companyMemberId)?.permissionCodes ?? []);
  } catch {
    return mergeDefaultMemberBaseReadPermissions([]);
  }
}
