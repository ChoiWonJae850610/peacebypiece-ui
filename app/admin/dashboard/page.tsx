import AdminStatsDashboard from "@/components/admin/dashboard/AdminStatsDashboard";
import AdminShell from "@/components/admin/layout/AdminShell";
import { getAdminNavigationItems } from "@/lib/admin/adminDashboard.presentation";
import { getAdminStatsSnapshot } from "@/lib/admin/stats/repository";
import { APP_VERSION } from "@/lib/constants/app";
import { WORKSPACE_COMPANY_NAME } from "@/lib/constants/company";
import { getI18n } from "@/lib/i18n";

type AdminDashboardSectionKey = "production" | "factory" | "period";

type AdminDashboardPageProps = {
  searchParams?: Promise<{ period?: string | string[]; startDate?: string | string[]; endDate?: string | string[]; section?: string | string[] }>;
};

function normalizeAdminDashboardSection(value: string | string[] | undefined): AdminDashboardSectionKey {
  const rawValue = Array.isArray(value) ? value[0] : value;
  if (rawValue === "factory" || rawValue === "period") return rawValue;
  return "production";
}

export default async function AdminDashboardPage({ searchParams }: AdminDashboardPageProps) {
  const pageText = getI18n().admin.dashboardPage;
  const resolvedSearchParams = await searchParams;
  const stats = await getAdminStatsSnapshot(resolvedSearchParams?.period, resolvedSearchParams?.startDate, resolvedSearchParams?.endDate);
  const initialSection = normalizeAdminDashboardSection(resolvedSearchParams?.section);

  return (
    <AdminShell
      companyName={WORKSPACE_COMPANY_NAME}
      appVersion={APP_VERSION}
      navigationItems={getAdminNavigationItems("/admin/dashboard")}
      title={pageText.title}
      description={pageText.description}
    >
      <AdminStatsDashboard stats={stats} pageText={pageText} initialSection={initialSection} />
    </AdminShell>
  );
}
