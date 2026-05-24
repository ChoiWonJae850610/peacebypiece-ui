import WorkspaceShell from "@/components/workspace/layout/WorkspaceShell";
import { redirect } from "next/navigation";

import { APP_VERSION } from "@/lib/constants/app";
import { requireWaflSessionForArea } from "@/lib/auth/routeGuard";
import AdminInvitationOnboardingEntry from "@/components/admin/dashboard/AdminInvitationOnboardingEntry";
import AdminConsoleSections from "@/components/admin/dashboard/AdminConsoleSections";
import AdminOperationsDashboard from "@/components/admin/dashboard/AdminOperationsDashboard";
import { adminMemberRepository } from "@/lib/admin/members/memberRepository";
import { getWorkspaceNavigationItems } from "@/lib/navigation/workspaceNavigation";
import { getAdminOperationalDashboardSnapshots } from "@/lib/admin/adminOperations.repository";
import type { WaflSessionPayload } from "@/lib/auth/session";
import type { MemberPermissionCode } from "@/lib/permissions";

async function readMemberPermissionCodes(session: WaflSessionPayload): Promise<readonly MemberPermissionCode[]> {
  if (session.role === "company_admin") return [];
  if (!session.companyId || !session.companyMemberId) return [];

  const { members } = await adminMemberRepository.listCompanyMembers({
    companyId: session.companyId,
    status: "all",
    limit: 200,
  });
  const member = members.find((item) => item.id === session.companyMemberId);

  return member?.status === "approved" ? member.permissionCodes : [];
}

export default async function WorkspacePage() {
  const session = await requireWaflSessionForArea("workspace");
  const companyId = session.companyId?.trim();

  if (!companyId) {
    if (!session.companyInvitationToken?.trim()) {
      redirect("/login?error=COMPANY_INVITATION_REQUIRED");
    }

    return (
      <WorkspaceShell
        companyName=""
        appVersion={APP_VERSION}
        navigationItems={getWorkspaceNavigationItems("/workspace", { role: session.role })}
        title="고객사 정보 입력"
        description="초대 링크로 시작한 고객사 관리자 등록을 완료합니다."
      >
        <AdminInvitationOnboardingEntry />
      </WorkspaceShell>
    );
  }

  if (session.role === "company_admin") {
    const snapshots = await getAdminOperationalDashboardSnapshots(companyId);

    return (
      <WorkspaceShell
        companyName={session.companyName ?? ""}
        appVersion={APP_VERSION}
        navigationItems={getWorkspaceNavigationItems("/workspace", { role: session.role })}
        title="고객관리자 메인"
      >
        <AdminOperationsDashboard snapshots={snapshots} />

        <AdminConsoleSections role={session.role} />
      </WorkspaceShell>
    );
  }

  const permissionCodes = await readMemberPermissionCodes(session);

  return (
    <WorkspaceShell
      companyName={session.companyName ?? ""}
      appVersion={APP_VERSION}
      navigationItems={getWorkspaceNavigationItems("/workspace", { role: session.role })}
      title="업무 홈"
      description="권한이 부여된 업무 화면으로 이동합니다."
    >
      <AdminConsoleSections permissionCodes={permissionCodes} role={session.role} />
    </WorkspaceShell>
  );
}
