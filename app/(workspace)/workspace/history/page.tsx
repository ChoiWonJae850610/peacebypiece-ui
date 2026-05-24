import AdminWorkOrderHistoryPage from "@/components/admin/history/AdminWorkOrderHistoryPage";
import WorkspaceShell from "@/components/workspace/layout/WorkspaceShell";
import { getWorkspaceNavigationItems } from "@/lib/navigation/workspaceNavigation";
import { listAdminHistoryEvents } from "@/lib/admin/history/repository";
import { APP_VERSION } from "@/lib/constants/app";
import { requireWaflSessionForArea } from "@/lib/auth/routeGuard";
import { getI18n } from "@/lib/i18n";

export default async function AdminHistoryPage() {
  const session = await requireWaflSessionForArea("workspace");
  const companyId = session.companyId?.trim();

  if (!companyId) {
    throw new Error("ADMIN_COMPANY_SESSION_REQUIRED");
  }

  const i18n = getI18n();
  const pageText = i18n.admin.historyPage;
  const historyEvents = await listAdminHistoryEvents(companyId);

  return (
    <WorkspaceShell
      companyName={session.companyName ?? ""}
      appVersion={APP_VERSION}
      navigationItems={getWorkspaceNavigationItems("/workspace/history")}
      title={`${session.companyName ?? ""} · ${pageText.title}`}
    >
      <AdminWorkOrderHistoryPage initialHistoryEvents={historyEvents} />
    </WorkspaceShell>
  );
}
