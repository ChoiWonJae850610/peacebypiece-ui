import AdminOperationsDashboard from "@/components/admin/dashboard/AdminOperationsDashboard";
import AdminShell from "@/components/admin/layout/AdminShell";
import { APP_VERSION } from "@/lib/constants/app";
import { WORKSPACE_COMPANY_NAME } from "@/lib/constants/company";
import AdminConsoleSections from "@/components/admin/dashboard/AdminConsoleSections";
import { getAdminNavigationItems } from "@/lib/admin/adminDashboard.presentation";
import { getAdminOperationalDashboardSnapshots } from "@/lib/admin/adminOperations.repository";

export default async function AdminPage() {
  const snapshots = await getAdminOperationalDashboardSnapshots();

  return (
    <AdminShell
      companyName={WORKSPACE_COMPANY_NAME}
      appVersion={APP_VERSION}
      navigationItems={getAdminNavigationItems("/admin")}
      title="고객관리자 메인"
    >
      <AdminOperationsDashboard snapshots={snapshots} />

      <AdminConsoleSections />
    </AdminShell>
  );
}
