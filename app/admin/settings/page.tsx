import AdminShell from "@/components/admin/layout/AdminShell";
import AdminSettingsHub from "@/components/admin/settings/AdminSettingsHub";
import { getAdminNavigationItems } from "@/lib/admin/adminDashboard.presentation";
import { APP_VERSION } from "@/lib/constants/app";
import { WORKSPACE_COMPANY_NAME } from "@/lib/constants/company";

export default function AdminSettingsPage() {
  return (
    <AdminShell
      companyName={WORKSPACE_COMPANY_NAME}
      appVersion={APP_VERSION}
      navigationItems={getAdminNavigationItems("/admin/settings")}
      title="환경설정"
      description="회사 운영 기준과 계정 관련 설정을 관리합니다."
    >
      <AdminSettingsHub />
    </AdminShell>
  );
}
