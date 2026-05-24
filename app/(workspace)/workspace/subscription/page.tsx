import AdminSubscriptionConsole from "@/components/admin/billing/AdminSubscriptionConsole";
import AdminShell from "@/components/admin/layout/AdminShell";
import { buildAdminSubscriptionViewModel } from "@/lib/admin/billing/adminSubscription.presentation";
import { getAdminNavigationItems } from "@/lib/admin/adminDashboard.presentation";
import { requireWaflSessionForArea } from "@/lib/auth/routeGuard";
import { getCompanyAccessState } from "@/lib/billing/companyAccessRepository";
import { APP_VERSION } from "@/lib/constants/app";
import { getI18n } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function AdminSubscriptionPage() {
  const session = await requireWaflSessionForArea("admin", { allowBlockedCompanyAccess: true });
  const accessState = session.companyId ? await getCompanyAccessState(session.companyId) : null;
  const i18n = getI18n();
  const viewModel = buildAdminSubscriptionViewModel(accessState, i18n.admin.subscriptionPage);

  return (
    <AdminShell
      companyName={session.companyName ?? ""}
      appVersion={APP_VERSION}
      navigationItems={getAdminNavigationItems("/workspace/subscription")}
      title={i18n.admin.subscriptionPage.shellTitle}
      description={i18n.admin.subscriptionPage.shellDescription}
    >
      <AdminSubscriptionConsole viewModel={viewModel} />
    </AdminShell>
  );
}
