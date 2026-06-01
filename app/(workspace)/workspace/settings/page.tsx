import { redirect } from "next/navigation";

import WorkspacePageShell from "@/components/workspace/layout/WorkspacePageShell";
import AdminSettingsHub from "@/components/admin/settings/AdminSettingsHub";
import { getAdminSettingsCompanyScope } from "@/lib/admin/settings/sessionScope";
import { requireWaflSessionForArea } from "@/lib/auth/routeGuard";

export default async function AdminSettingsPage() {
  const session = await requireWaflSessionForArea("workspace");
  if (session.role !== "company_admin") {
    redirect("/workspace?error=ADMIN_SETTINGS_REQUIRED");
  }

  const companyScope = await getAdminSettingsCompanyScope();

  if (!companyScope) {
    redirect("/login");
  }

  return (
    <WorkspacePageShell
      session={session}
      activeHref="/workspace/settings"
      companyName={companyScope.companyName}
      title="환경설정"
      description="회사 계정 정보, 기준정보, 요금제, 개발 건의를 관리합니다."
    >
      <AdminSettingsHub />
    </WorkspacePageShell>
  );
}
