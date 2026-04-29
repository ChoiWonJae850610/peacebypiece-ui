import AdminShell from "@/components/admin/layout/AdminShell";
import { AdminCard, AdminStatCard } from "@/components/admin/layout/AdminCard";
import {
  getAdminNavigationItems,
  getAdminStatMaxFlowValue,
  getAdminStatTotalPartnerCount,
} from "@/lib/admin/adminDashboard.presentation";
import { getAdminStatsSnapshot } from "@/lib/admin/adminStats.repository";
import { APP_VERSION } from "@/lib/constants/app";
import { WORKSPACE_COMPANY_NAME } from "@/lib/constants/company";
import { getI18n } from "@/lib/i18n";

export default async function AdminDashboardPage() {
  const pageText = getI18n().admin.dashboardPage;
  const stats = await getAdminStatsSnapshot();
  const maxFlowValue = getAdminStatMaxFlowValue(stats.workorderFlow);
  const totalPartnerCount = getAdminStatTotalPartnerCount(stats.partnerDistribution);
  const sourceDescription =
    stats.sourceState === "db"
      ? pageText.dbSourceDescription
      : stats.sourceState === "not_configured"
        ? pageText.dbNotConfiguredDescription
        : pageText.dbErrorDescription;

  return (
    <AdminShell
      companyName={WORKSPACE_COMPANY_NAME}
      appVersion={APP_VERSION}
      navigationItems={getAdminNavigationItems("/admin/dashboard")}
      title={pageText.title}
      description={pageText.description}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.summaries.map((item) => (
          <AdminStatCard key={item.label} label={item.label} value={item.value} description={item.description} href={null} accent={item.accent} />
        ))}
      </section>

      <section className="grid min-h-0 flex-1 gap-5 overflow-hidden xl:grid-cols-[1.2fr_0.8fr]">
        <AdminCard className="flex min-h-0 flex-col overflow-hidden">
          <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-stone-950">{pageText.workorderFlowTitle}</h2>
              <p className="mt-1 text-xs text-stone-500">{sourceDescription}</p>
            </div>
            <span className="rounded-full bg-[var(--admin-theme-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--admin-theme-text-on-surface)]">{pageText.currentMonth}</span>
          </div>

          <div className="mt-5 flex min-h-0 flex-1 items-end gap-4 rounded-[24px] border border-stone-100 bg-stone-50/70 px-5 pb-5 pt-7">
            {stats.workorderFlow.map((item) => {
              const height = Math.max(8, Math.round((item.value / maxFlowValue) * 100));
              return (
                <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-3">
                  <div className="flex h-48 w-full items-end justify-center border-b border-stone-200">
                    <div className="w-full max-w-14 rounded-t-3xl bg-[var(--admin-theme-surface)] shadow-sm" style={{ height: `${height}%` }} aria-label={`${item.label} ${item.value}건`} />
                  </div>
                  <div className="text-center">
                    <p className="text-base font-semibold text-stone-950">{item.value}</p>
                    <p className="mt-1 text-xs font-medium text-stone-500">{item.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </AdminCard>

        <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-5 overflow-hidden">
          <AdminCard className="min-h-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-stone-950">{pageText.partnersTitle}</h2>
              </div>
              <span className="text-xs font-semibold text-stone-400">{totalPartnerCount}{pageText.partnerCountSuffix}</span>
            </div>
            <div className="mt-5 grid gap-3">
              {stats.partnerDistribution.map((item) => {
                const width = totalPartnerCount > 0 ? Math.round((item.value / totalPartnerCount) * 100) : 0;
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-xs font-semibold text-stone-600">
                      <span>{item.label}</span>
                      <span>{item.value}{pageText.partnerCountSuffix}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-stone-100">
                      <div className="h-2 rounded-full bg-[var(--admin-theme-surface)]" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </AdminCard>

          <AdminCard className="flex min-h-0 flex-col overflow-hidden">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-stone-950">{pageText.fileUsageTitle}</h2>
              </div>
            </div>
            <div className="mt-4 grid min-h-0 gap-2 overflow-y-auto pr-1">
              {stats.fileUsagePoints.map((item) => {
                const width = item.limit > 0 ? Math.min(100, Math.round((item.value / item.limit) * 100)) : 0;
                return (
                  <div key={item.label} className="rounded-2xl border border-stone-100 bg-stone-50 px-4 py-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-stone-600">
                      <span>{item.label}</span>
                      <span>{item.valueLabel}</span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-white">
                      <div className="h-2 rounded-full bg-[var(--admin-theme-surface)]" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </AdminCard>
        </div>
      </section>
    </AdminShell>
  );
}
