import AdminOperationsDashboard from "@/components/admin/dashboard/AdminOperationsDashboard";
import AdminShell from "@/components/admin/layout/AdminShell";
import { APP_VERSION } from "@/lib/constants/app";
import { requireWaflSessionForArea } from "@/lib/auth/routeGuard";
import AdminConsoleSections from "@/components/admin/dashboard/AdminConsoleSections";
import { getAdminNavigationItems } from "@/lib/admin/adminDashboard.presentation";
import { getAdminOperationalDashboardSnapshots } from "@/lib/admin/adminOperations.repository";

export default async function AdminPage() {
  const session = await requireWaflSessionForArea("admin");
  const companyId = session.companyId?.trim();

  if (!companyId) {
    throw new Error("ADMIN_COMPANY_SESSION_REQUIRED");
  }

  const snapshots = await getAdminOperationalDashboardSnapshots(companyId);

  return (
    <AdminShell
      companyName={session.companyName ?? ""}
      appVersion={APP_VERSION}
      navigationItems={getAdminNavigationItems("/admin")}
      title="고객관리자 메인"
    >
      <AdminOperationsDashboard snapshots={snapshots} />

      <AdminConsoleSections />
    </AdminShell>
  );
}
