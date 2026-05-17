import "server-only";

import type { WaflSessionPayload } from "@/lib/auth/session";
import {
  getMemberRoleTemplatePermissions,
  type MemberPermissionCode,
} from "@/lib/permissions";
import { adminMemberRepository } from "./memberRepository";

export async function resolveMemberWorkspacePermissionCodes(
  session: WaflSessionPayload,
): Promise<readonly MemberPermissionCode[]> {
  if (session.role === "company_admin") {
    return getMemberRoleTemplatePermissions("company_admin");
  }

  if (session.role !== "member" || !session.companyId || !session.companyMemberId) {
    return [];
  }

  try {
    const { members } = await adminMemberRepository.listCompanyMembers({
      companyId: session.companyId,
      status: "all",
      limit: 100,
    });

    return members.find((member) => member.id === session.companyMemberId)?.permissionCodes ?? [];
  } catch {
    return [];
  }
}
