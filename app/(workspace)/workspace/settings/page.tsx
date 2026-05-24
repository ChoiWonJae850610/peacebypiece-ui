import { redirect } from "next/navigation";

import WorkspaceShell from "@/components/workspace/layout/WorkspaceShell";
import AdminSettingsHub from "@/components/admin/settings/AdminSettingsHub";
import { getWorkspaceNavigationItems } from "@/lib/navigation/workspaceNavigation";
import { APP_VERSION } from "@/lib/constants/app";
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
    <WorkspaceShell
      companyName={companyScope.companyName ?? ""}
      appVersion={APP_VERSION}
      navigationItems={getWorkspaceNavigationItems("/workspace/settings", { role: session.role })}
      title="환경설정"
      description="회사 계정 정보, 기준정보, 요금제, 개발 건의를 관리합니다."
    >
      <AdminSettingsHub />
    </WorkspaceShell>
  );
}
