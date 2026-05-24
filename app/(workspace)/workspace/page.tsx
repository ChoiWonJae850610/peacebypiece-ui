import AdminOperationsDashboard from "@/components/admin/dashboard/AdminOperationsDashboard";
import WorkspaceShell from "@/components/workspace/layout/WorkspaceShell";
import { redirect } from "next/navigation";

import { APP_VERSION } from "@/lib/constants/app";
import { requireWaflSessionForArea } from "@/lib/auth/routeGuard";
import AdminConsoleSections from "@/components/admin/dashboard/AdminConsoleSections";
import { getWorkspaceNavigationItems } from "@/lib/navigation/workspaceNavigation";
import { getAdminOperationalDashboardSnapshots } from "@/lib/admin/adminOperations.repository";

function AdminInvitationOnboardingEntry() {
  return (
    <section className="rounded-[28px] border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-6 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--pbp-accent)]">Company onboarding</p>
      <h2 className="mt-3 text-xl font-bold tracking-tight text-[var(--pbp-text-primary)]">고객사 정보를 입력해 주세요.</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--pbp-text-muted)]">
        초대 링크를 통해 Google 로그인한 상태입니다. 회사 정보와 관리자 정보를 입력하고 승인 요청을 완료하면 시스템관리자 검토 목록에 표시됩니다.
      </p>
    </section>
  );
}

export default async function AdminPage() {
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
        navigationItems={getWorkspaceNavigationItems("/workspace")}
        title="고객사 정보 입력"
        description="초대 링크로 시작한 고객사 관리자 등록을 완료합니다."
      >
        <AdminInvitationOnboardingEntry />
      </WorkspaceShell>
    );
  }

  const snapshots = await getAdminOperationalDashboardSnapshots(companyId);

  return (
    <WorkspaceShell
      companyName={session.companyName ?? ""}
      appVersion={APP_VERSION}
      navigationItems={getWorkspaceNavigationItems("/workspace")}
      title="고객관리자 메인"
    >
      <AdminOperationsDashboard snapshots={snapshots} />

      <AdminConsoleSections />
    </WorkspaceShell>
  );
}
