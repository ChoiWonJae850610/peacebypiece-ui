import AdminSubscriptionConsole from "@/components/admin/billing/AdminSubscriptionConsole";
import WorkspacePageShell from "@/components/workspace/layout/WorkspacePageShell";
import { buildAdminSubscriptionViewModel } from "@/lib/admin/billing/adminSubscription.presentation";
import { requireWorkspacePagePermission } from "@/lib/auth/routeGuard";
import { getCompanyAccessState } from "@/lib/billing/companyAccessRepository";
import { getI18n } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function AdminSubscriptionPage() {
  const session = await requireWorkspacePagePermission("settings.read", { allowBlockedCompanyAccess: true });
  const accessState = session.companyId ? await getCompanyAccessState(session.companyId) : null;
  const i18n = getI18n();
  const viewModel = buildAdminSubscriptionViewModel(accessState, i18n.admin.subscriptionPage);

  return (
    <WorkspacePageShell
      session={session}
      activeHref="/workspace/subscription"
      title={i18n.admin.subscriptionPage.shellTitle}
      description={i18n.admin.subscriptionPage.shellDescription}
    >
      <AdminSubscriptionConsole viewModel={viewModel} />
    </WorkspacePageShell>
  );
}
