import Link from "next/link";

import { AdminCard, AdminStatCard } from "@/components/admin/layout/AdminCard";
import type { AdminStatsSnapshot } from "@/lib/admin/stats/types";
import { buildAdminStatsDashboardViewModel } from "@/lib/admin/stats/presentation";
import type { getI18n } from "@/lib/i18n";

type AdminStatsDashboardProps = {
  stats: AdminStatsSnapshot;
  pageText: ReturnType<typeof getI18n>["admin"]["dashboardPage"];
};

type DonutProps = {
  segments: { label: string; value: number; percent: number; strokeDasharray: string; strokeDashoffset: number }[];
  total: number;
  suffix: string;
};

function AdminStatsDonut({ segments, total, suffix }: DonutProps) {
  return (
    <div className="grid gap-4 md:grid-cols-[140px_minmax(0,1fr)]">
      <div className="relative mx-auto h-32 w-32">
        <svg viewBox="0 0 36 36" className="h-32 w-32 -rotate-90">
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="4" className="text-stone-100" />
          {segments.map((item) => (
            <circle
              key={item.label}
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={item.strokeDasharray}
              strokeDashoffset={item.strokeDashoffset}
              pathLength="100"
              className="text-[var(--admin-theme-surface)]"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xl font-bold text-stone-950">{total}</span>
          <span className="text-[11px] font-semibold text-stone-400">{suffix}</span>
        </div>
      </div>
      <div className="grid content-center gap-2">
        {segments.map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-2xl bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-600">
            <span>{item.label}</span>
            <span>{item.value}{suffix} · {item.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminStatsDashboard({ stats, pageText }: AdminStatsDashboardProps) {
  const viewModel = buildAdminStatsDashboardViewModel({
    sourceState: stats.sourceState,
    text: pageText,
    workorderFlow: stats.workorderFlow,
    partnerDistribution: stats.partnerDistribution,
    fileUsagePoints: stats.fileUsagePoints,
    keyMetrics: stats.keyMetrics,
    productionRoundDistribution: stats.productionRoundDistribution,
    factoryProductionDistribution: stats.factoryProductionDistribution,
    productionCategoryDistribution: stats.productionCategoryDistribution,
    attachmentTrashCards: stats.attachmentTrashCards,
  });

  return (
    <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.summaries.map((item) => (
          <AdminStatCard key={item.label} label={item.label} value={item.value} description={item.description} href={null} accent={item.accent} />
        ))}
      </section>

      <section className="flex flex-wrap items-center gap-2 rounded-[24px] border border-stone-100 bg-white p-3 shadow-sm">
        <span className="px-2 text-xs font-semibold text-stone-500">{pageText.periodTitle}</span>
        {stats.periodOptions.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            aria-current={item.active ? "page" : undefined}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${item.active ? "bg-[var(--admin-theme-surface)] text-[var(--admin-theme-text-on-surface)]" : "bg-stone-50 text-stone-500 hover:bg-stone-100"}`}
          >
            {item.label}
          </Link>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {viewModel.keyMetrics.map((item) => (
          <AdminCard key={item.key ?? item.label} className="px-4 py-4">
            <p className="text-xs font-semibold text-stone-500">{item.label}</p>
            <p className="mt-2 text-2xl font-bold text-stone-950">{item.value}</p>
            <p className="mt-1 text-xs leading-5 text-stone-400">{item.description}</p>
          </AdminCard>
        ))}
      </section>

      <section className="grid min-h-0 flex-1 gap-5 overflow-hidden xl:grid-cols-[1.2fr_0.8fr]">
        <AdminCard className="flex min-h-0 flex-col overflow-hidden">
          <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-stone-950">{pageText.workorderFlowTitle}</h2>
              <p className="mt-1 text-xs text-stone-500">{viewModel.sourceDescription}</p>
            </div>
            <span className="rounded-full bg-[var(--admin-theme-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--admin-theme-text-on-surface)]">{stats.periodOptions.find((item) => item.active)?.label ?? pageText.currentMonth}</span>
          </div>

          <div className="relative mt-5 flex min-h-0 flex-1 items-end gap-4 rounded-[22px] border border-stone-100 bg-stone-50/70 px-5 pb-5 pt-7">
            {viewModel.totalFlowValue === 0 ? (
              <div className="absolute inset-x-5 top-5 rounded-2xl border border-dashed border-stone-300 bg-white/75 px-4 py-3 text-center text-xs font-semibold text-stone-500">
                {pageText.emptyFlowLabel}
              </div>
            ) : null}
            {viewModel.workorderBars.map((item) => (
              <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-3">
                <div className="flex h-48 w-full items-end justify-center border-b border-stone-200">
                  <div className={`w-full max-w-14 rounded-t-3xl shadow-sm transition ${item.isEmpty ? "bg-stone-200" : "bg-[var(--admin-theme-surface)]"}`} style={{ height: `${item.heightPercent}%` }} aria-label={item.ariaLabel} />
                </div>
                <div className="text-center">
                  <p className="text-base font-semibold text-stone-950">{item.value}</p>
                  <p className="mt-1 text-xs font-medium text-stone-500">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </AdminCard>

        <div className="grid min-h-0 grid-rows-[auto_auto] gap-5 overflow-hidden">
          <AdminCard className="min-h-0">
            <h2 className="text-lg font-semibold text-stone-950">{pageText.partnerDonutTitle}</h2>
            <div className="mt-5">
              <AdminStatsDonut segments={viewModel.partnerDonut} total={viewModel.totalPartnerCount} suffix={pageText.partnerCountSuffix} />
            </div>
          </AdminCard>

          <AdminCard className="min-h-0">
            <h2 className="text-lg font-semibold text-stone-950">{pageText.fileDonutTitle}</h2>
            <div className="mt-5">
              <AdminStatsDonut segments={viewModel.fileUsageDonut} total={stats.fileUsagePoints.reduce((sum, item) => sum + item.value, 0)} suffix="" />
            </div>
          </AdminCard>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-4">
        <AdminCard>
          <h2 className="text-lg font-semibold text-stone-950">{pageText.attachmentTrashTitle}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {viewModel.attachmentTrashCards.map((item) => (
              <div key={item.label} className="rounded-2xl border border-stone-100 bg-stone-50 px-4 py-3">
                <p className="text-xs font-semibold text-stone-500">{item.label}</p>
                <p className="mt-2 text-xl font-bold text-stone-950">{item.value}</p>
              </div>
            ))}
          </div>
        </AdminCard>

        <AdminCard>
          <h2 className="text-lg font-semibold text-stone-950">{pageText.productionRoundTitle}</h2>
          <div className="mt-5">
            <AdminStatsDonut segments={viewModel.roundDonut} total={viewModel.totalRoundCount} suffix={pageText.workorderCountSuffix} />
          </div>
        </AdminCard>

        <AdminCard>
          <h2 className="text-lg font-semibold text-stone-950">{pageText.factoryProductionTitle}</h2>
          <div className="mt-5 grid gap-3">
            {viewModel.factoryProductionBars.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-xs font-semibold text-stone-600"><span className="truncate pr-2">{item.label}</span><span>{item.value}</span></div>
                <div className="mt-2 h-2 rounded-full bg-stone-100"><div className="h-2 rounded-full bg-[var(--admin-theme-surface)]" style={{ width: `${item.widthPercent}%` }} /></div>
              </div>
            ))}
          </div>
        </AdminCard>

        <AdminCard>
          <h2 className="text-lg font-semibold text-stone-950">{pageText.categoryDistributionTitle}</h2>
          <div className="mt-5 grid gap-3">
            {viewModel.categoryBars.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-xs font-semibold text-stone-600"><span className="truncate pr-2">{item.label}</span><span>{item.value}</span></div>
                <div className="mt-2 h-2 rounded-full bg-stone-100"><div className="h-2 rounded-full bg-[var(--admin-theme-surface)]" style={{ width: `${item.widthPercent}%` }} /></div>
              </div>
            ))}
          </div>
        </AdminCard>
      </section>
    </>
  );
}
