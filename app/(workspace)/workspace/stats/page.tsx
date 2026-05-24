import { redirect } from "next/navigation";

import AdminStatsDashboard from "@/components/admin/dashboard/AdminStatsDashboard";
import WorkspaceShell from "@/components/workspace/layout/WorkspaceShell";
import { getWorkspaceNavigationItems } from "@/lib/navigation/workspaceNavigation";
import { getAdminStatsSnapshot } from "@/lib/admin/stats/repository";
import { normalizeAdminPeriodTopMode, normalizeAdminStatsPageSection } from "@/lib/admin/stats/dashboardPresentation";
import { APP_VERSION } from "@/lib/constants/app";
import { getI18n } from "@/lib/i18n";
import { getAdminStatsCompanyScope } from "@/lib/admin/stats/sessionScope";
import { requireWorkspacePagePermission } from "@/lib/auth/routeGuard";


type AdminStatsPageProps = {
  searchParams?: Promise<{
    period?: string | string[];
    startDate?: string | string[];
    endDate?: string | string[];
    section?: string | string[];
    topMode?: string | string[];
  }>;
};

export default async function AdminStatsPage({ searchParams }: AdminStatsPageProps) {
  const session = await requireWorkspacePagePermission("stats.read");
  const pageText = getI18n().admin.dashboardPage;
  const companyScope = await getAdminStatsCompanyScope();

  if (!companyScope) {
    redirect("/login");
  }

  const resolvedSearchParams = await searchParams;
  const stats = await getAdminStatsSnapshot(
    companyScope,
    resolvedSearchParams?.period,
    resolvedSearchParams?.startDate,
    resolvedSearchParams?.endDate,
  );
  const initialSection = normalizeAdminStatsPageSection(resolvedSearchParams?.section);
  const initialPeriodTopMode = normalizeAdminPeriodTopMode(resolvedSearchParams?.topMode);

  return (
    <WorkspaceShell
      companyName={companyScope.companyName ?? ""}
      appVersion={APP_VERSION}
      navigationItems={getWorkspaceNavigationItems("/workspace/stats", { role: session.role })}
      title={pageText.title}
      description={pageText.description}
    >
      <AdminStatsDashboard stats={stats} pageText={pageText} initialSection={initialSection} initialPeriodTopMode={initialPeriodTopMode} />
    </WorkspaceShell>
  );
}
