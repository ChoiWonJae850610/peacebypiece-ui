import { AdminCard, AdminStatCard } from "@/components/admin/layout/AdminCard";
import type { AdminStatsSnapshot } from "@/lib/admin/stats/types";
import { buildAdminStatsDashboardViewModel } from "@/lib/admin/stats/presentation";
import type { getI18n } from "@/lib/i18n";

type AdminStatsDashboardProps = {
  stats: AdminStatsSnapshot;
  pageText: ReturnType<typeof getI18n>["admin"]["dashboardPage"];
};

export default function AdminStatsDashboard({ stats, pageText }: AdminStatsDashboardProps) {
  const viewModel = buildAdminStatsDashboardViewModel({
    sourceState: stats.sourceState,
    text: pageText,
    workorderFlow: stats.workorderFlow,
    partnerDistribution: stats.partnerDistribution,
    fileUsagePoints: stats.fileUsagePoints,
  });

  return (
    <>
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
              <p className="mt-1 text-xs text-stone-500">{viewModel.sourceDescription}</p>
            </div>
            <span className="rounded-full bg-[var(--admin-theme-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--admin-theme-text-on-surface)]">{pageText.currentMonth}</span>
          </div>

          <div className="mt-5 flex min-h-0 flex-1 items-end gap-4 rounded-[24px] border border-stone-100 bg-stone-50/70 px-5 pb-5 pt-7">
            {viewModel.workorderBars.map((item) => (
              <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-3">
                <div className="flex h-48 w-full items-end justify-center border-b border-stone-200">
                  <div className="w-full max-w-14 rounded-t-3xl bg-[var(--admin-theme-surface)] shadow-sm" style={{ height: `${item.heightPercent}%` }} aria-label={item.ariaLabel} />
                </div>
                <div className="text-center">
                  <p className="text-base font-semibold text-stone-950">{item.value}</p>
                  <p className="mt-1 text-xs font-medium text-stone-500">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </AdminCard>

        <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-5 overflow-hidden">
          <AdminCard className="min-h-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-stone-950">{pageText.partnersTitle}</h2>
              </div>
              <span className="text-xs font-semibold text-stone-400">{viewModel.totalPartnerCount}{pageText.partnerCountSuffix}</span>
            </div>
            <div className="mt-5 grid gap-3">
              {viewModel.partnerBars.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-xs font-semibold text-stone-600">
                    <span>{item.label}</span>
                    <span>{item.value}{pageText.partnerCountSuffix}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-stone-100">
                    <div className="h-2 rounded-full bg-[var(--admin-theme-surface)]" style={{ width: `${item.widthPercent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </AdminCard>

          <AdminCard className="flex min-h-0 flex-col overflow-hidden">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-stone-950">{pageText.fileUsageTitle}</h2>
              </div>
            </div>
            <div className="mt-4 grid min-h-0 gap-2 overflow-y-auto pr-1">
              {viewModel.fileUsageBars.map((item) => (
                <div key={item.label} className="rounded-2xl border border-stone-100 bg-stone-50 px-4 py-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-stone-600">
                    <span>{item.label}</span>
                    <span>{item.valueLabel}</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-white">
                    <div className="h-2 rounded-full bg-[var(--admin-theme-surface)]" style={{ width: `${item.widthPercent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </AdminCard>
        </div>
      </section>
    </>
  );
}
