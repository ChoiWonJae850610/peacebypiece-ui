import { redirect } from "next/navigation";

import AdminShell from "@/components/admin/layout/AdminShell";
import AdminSettingsHub from "@/components/admin/settings/AdminSettingsHub";
import { getAdminNavigationItems } from "@/lib/admin/adminDashboard.presentation";
import { APP_VERSION } from "@/lib/constants/app";
import { getAdminSettingsCompanyScope } from "@/lib/admin/settings/sessionScope";

export default async function AdminSettingsPage() {
  const companyScope = await getAdminSettingsCompanyScope();

  if (!companyScope) {
    redirect("/login");
  }

  return (
    <AdminShell
      companyName={companyScope.companyName ?? ""}
      appVersion={APP_VERSION}
      navigationItems={getAdminNavigationItems("/workspace/settings")}
      title="환경설정"
      description="회사 계정 정보, 기준정보, 요금제, 개발 건의를 관리합니다."
    >
      <AdminSettingsHub />
    </AdminShell>
  );
}
