import AdminStatsDashboard from "@/components/admin/dashboard/AdminStatsDashboard";
import AdminShell from "@/components/admin/layout/AdminShell";
import { getAdminNavigationItems } from "@/lib/admin/adminDashboard.presentation";
import { getAdminStatsSnapshot } from "@/lib/admin/stats/repository";
import { normalizeAdminPeriodTopMode, normalizeAdminStatsPageSection } from "@/lib/admin/stats/dashboardPresentation";
import { APP_VERSION } from "@/lib/constants/app";
import { WORKSPACE_COMPANY_NAME } from "@/lib/constants/company";
import { getI18n } from "@/lib/i18n";


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
  const pageText = getI18n().admin.dashboardPage;
  const resolvedSearchParams = await searchParams;
  const stats = await getAdminStatsSnapshot(resolvedSearchParams?.period, resolvedSearchParams?.startDate, resolvedSearchParams?.endDate);
  const initialSection = normalizeAdminStatsPageSection(resolvedSearchParams?.section);
  const initialPeriodTopMode = normalizeAdminPeriodTopMode(resolvedSearchParams?.topMode);

  return (
    <AdminShell
      companyName={WORKSPACE_COMPANY_NAME}
      appVersion={APP_VERSION}
      navigationItems={getAdminNavigationItems("/admin/stats")}
      title={pageText.title}
      description={pageText.description}
    >
      <AdminStatsDashboard stats={stats} pageText={pageText} initialSection={initialSection} initialPeriodTopMode={initialPeriodTopMode} />
    </AdminShell>
  );
}
