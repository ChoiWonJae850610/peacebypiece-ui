import AdminOperationsDashboard from "@/components/admin/dashboard/AdminOperationsDashboard";
import AdminShell from "@/components/admin/layout/AdminShell";
import { getAdminNavigationItems } from "@/lib/admin/adminDashboard.presentation";
import { getAdminOperationalDashboardSnapshots } from "@/lib/admin/adminOperations.repository";
import { APP_VERSION } from "@/lib/constants/app";
import { WORKSPACE_COMPANY_NAME } from "@/lib/constants/company";

export default async function AdminPage() {
  const snapshots = await getAdminOperationalDashboardSnapshots();

  return (
    <AdminShell
      companyName={WORKSPACE_COMPANY_NAME}
      appVersion={APP_VERSION}
      navigationItems={getAdminNavigationItems("/admin")}
      title="관리자 운영 화면"
    >
      <AdminOperationsDashboard snapshots={snapshots} />
    </AdminShell>
  );
}
