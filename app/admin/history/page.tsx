import AdminWorkOrderHistoryPage from "@/components/admin/history/AdminWorkOrderHistoryPage";
import AdminShell from "@/components/admin/layout/AdminShell";
import { getAdminNavigationItems } from "@/lib/admin/adminDashboard.presentation";
import { listAdminHistoryEvents } from "@/lib/admin/history/repository";
import { APP_VERSION } from "@/lib/constants/app";
import { WORKSPACE_COMPANY_NAME } from "@/lib/constants/company";
import { getI18n } from "@/lib/i18n";

export default async function AdminHistoryPage() {
  const i18n = getI18n();
  const pageText = i18n.admin.historyPage;
  const historyEvents = await listAdminHistoryEvents();

  return (
    <AdminShell
      companyName={WORKSPACE_COMPANY_NAME}
      appVersion={APP_VERSION}
      navigationItems={getAdminNavigationItems("/admin/history")}
      title={`${WORKSPACE_COMPANY_NAME} · ${pageText.title}`}
    >
      <AdminWorkOrderHistoryPage initialHistoryEvents={historyEvents} />
    </AdminShell>
  );
}
