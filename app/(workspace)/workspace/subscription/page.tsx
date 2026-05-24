import AdminSubscriptionConsole from "@/components/admin/billing/AdminSubscriptionConsole";
import WorkspaceShell from "@/components/workspace/layout/WorkspaceShell";
import { buildAdminSubscriptionViewModel } from "@/lib/admin/billing/adminSubscription.presentation";
import { getWorkspaceNavigationItems } from "@/lib/navigation/workspaceNavigation";
import { requireWaflSessionForArea } from "@/lib/auth/routeGuard";
import { getCompanyAccessState } from "@/lib/billing/companyAccessRepository";
import { APP_VERSION } from "@/lib/constants/app";
import { getI18n } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function AdminSubscriptionPage() {
  const session = await requireWaflSessionForArea("workspace", { allowBlockedCompanyAccess: true });
  const accessState = session.companyId ? await getCompanyAccessState(session.companyId) : null;
  const i18n = getI18n();
  const viewModel = buildAdminSubscriptionViewModel(accessState, i18n.admin.subscriptionPage);

  return (
    <WorkspaceShell
      companyName={session.companyName ?? ""}
      appVersion={APP_VERSION}
      navigationItems={getWorkspaceNavigationItems("/workspace/subscription")}
      title={i18n.admin.subscriptionPage.shellTitle}
      description={i18n.admin.subscriptionPage.shellDescription}
    >
      <AdminSubscriptionConsole viewModel={viewModel} />
    </WorkspaceShell>
  );
}
