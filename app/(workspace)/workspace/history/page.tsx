import AdminWorkOrderHistoryPage from "@/components/admin/history/AdminWorkOrderHistoryPage";
import WorkspacePageShell from "@/components/workspace/layout/WorkspacePageShell";
import { listAdminHistoryEvents } from "@/lib/admin/history/repository";
import { requireWorkspacePagePermission } from "@/lib/auth/routeGuard";
import { getI18n } from "@/lib/i18n";

export default async function AdminHistoryPage() {
  const session = await requireWorkspacePagePermission("audit.read.company");
  const companyId = session.companyId?.trim();

  if (!companyId) {
    throw new Error("ADMIN_COMPANY_SESSION_REQUIRED");
  }

  const i18n = getI18n();
  const pageText = i18n.admin.historyPage;
  const historyEvents = await listAdminHistoryEvents(companyId);

  return (
    <WorkspacePageShell
      session={session}
      activeHref="/workspace/history"
      title={`${session.companyName ?? ""} · ${pageText.title}`}
    >
      <AdminWorkOrderHistoryPage initialHistoryEvents={historyEvents} />
    </WorkspacePageShell>
  );
}
