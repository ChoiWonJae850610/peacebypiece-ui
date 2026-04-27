import AdminWorkOrderHistoryPage from "@/components/admin/history/AdminWorkOrderHistoryPage";
import AdminShell from "@/components/admin/layout/AdminShell";
import { getAdminNavigationItems } from "@/lib/admin/adminDashboard.presentation";
import { APP_VERSION } from "@/lib/constants/app";
import { WORKSPACE_COMPANY_NAME } from "@/lib/constants/company";
import { getI18n } from "@/lib/i18n";

const i18n = getI18n();
const pageText = i18n.admin.historyPage;

export default function AdminHistoryPage() {
  return (
    <AdminShell
      companyName={WORKSPACE_COMPANY_NAME}
      appVersion={APP_VERSION}
      navigationItems={getAdminNavigationItems("/admin/history")}
      title={`${WORKSPACE_COMPANY_NAME} · ${pageText.title}`}
      description={pageText.description}
    >
      <AdminWorkOrderHistoryPage />
    </AdminShell>
  );
}
