import AdminStatsDashboard from "@/components/admin/dashboard/AdminStatsDashboard";
import AdminShell from "@/components/admin/layout/AdminShell";
import { getAdminNavigationItems } from "@/lib/admin/adminDashboard.presentation";
import { getAdminStatsSnapshot } from "@/lib/admin/stats/repository";
import { APP_VERSION } from "@/lib/constants/app";
import { WORKSPACE_COMPANY_NAME } from "@/lib/constants/company";
import { getI18n } from "@/lib/i18n";

export default async function AdminDashboardPage() {
  const pageText = getI18n().admin.dashboardPage;
  const stats = await getAdminStatsSnapshot();

  return (
    <AdminShell
      companyName={WORKSPACE_COMPANY_NAME}
      appVersion={APP_VERSION}
      navigationItems={getAdminNavigationItems("/admin/dashboard")}
      title={pageText.title}
      description={pageText.description}
    >
      <AdminStatsDashboard stats={stats} pageText={pageText} />
    </AdminShell>
  );
}
