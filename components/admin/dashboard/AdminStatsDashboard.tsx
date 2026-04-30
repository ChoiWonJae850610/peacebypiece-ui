"use client";

import Link from "next/link";

import { AdminCard, AdminStatCard } from "@/components/admin/layout/AdminCard";
import type { AdminStatsSnapshot } from "@/lib/admin/stats/types";
import { buildAdminStatsDashboardViewModel } from "@/lib/admin/stats/presentation";
import type { getI18n } from "@/lib/i18n";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

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

function translateStatsLabel(label: string, t: ReturnType<typeof useAdminTranslation>) {
  const map: Record<string, string> = {
    "전체 작업지시서": t("statsUi.summaries.totalWorkorders.label", label),
    "DB 기준 전체 작업지시서 수": t("statsUi.summaries.totalWorkorders.description", label),
    "협력업체 수": t("statsUi.summaries.partnerCount.label", label),
    "활성 협력업체 수": t("statsUi.summaries.partnerCount.description", label),
    "파일 사용량": t("statsUi.summaries.fileUsage.label", label),
    "현재 첨부파일 사용량": t("statsUi.summaries.fileUsage.description", label),
    "완료된 작업지시서": t("statsUi.summaries.completedInPeriod.label", label),
    "선택 기간 안에 완료 처리된 작업": t("statsUi.summaries.completedInPeriod.description", label),
    "작성": t("statsUi.flowBuckets.writing", label),
    "검토": t("statsUi.flowBuckets.review", label),
    "발주": t("statsUi.flowBuckets.order", label),
    "입고": t("statsUi.flowBuckets.inbound", label),
    "완료": t("statsUi.flowBuckets.completed", label),
    "공장": t("statsUi.partnerBuckets.factory", label),
    "원단": t("statsUi.partnerBuckets.fabric", label),
    "부자재": t("statsUi.partnerBuckets.subsidiary", label),
    "외주": t("statsUi.partnerBuckets.outsourcing", label),
    "전체 사용량": t("statsUi.fileUsage.total", label),
    "첨부파일": t("statsUi.fileUsage.active", label),
    "휴지통": t("statsUi.fileUsage.trash", label),
    "1차": t("statsUi.productionRounds.first", label),
    "2차": t("statsUi.productionRounds.second", label),
    "3차 이상": t("statsUi.productionRounds.thirdOrMore", label),
    "3차": t("statsUi.productionRounds.thirdOrMore", label),
    "분류 미지정": t("statsUi.unknownLabel", label),
    "7일": t("statsUi.periods.sevenDays", label),
    "15일": t("statsUi.periods.fifteenDays", label),
    "30일": t("statsUi.periods.thirtyDays", label),
    "월별": t("statsUi.periods.monthly", label),
    "이번달": t("dashboardPage.currentMonth", label),
  };
  return map[label] ?? label;
}

function translateStatsText<T extends { label: string; description?: string }>(items: readonly T[], t: ReturnType<typeof useAdminTranslation>): T[] {
  return items.map((item) => ({ ...item, label: translateStatsLabel(item.label, t), description: item.description ? translateStatsLabel(item.description, t) : item.description }));
}

export default function AdminStatsDashboard({ stats, pageText }: AdminStatsDashboardProps) {
  const t = useAdminTranslation();
  const pt = (key: string, fallback: string) => t(`dashboardPage.${key}`, fallback);
  const translatedStats = {
    ...stats,
    summaries: translateStatsText(stats.summaries, t),
    workorderFlow: translateStatsText(stats.workorderFlow, t),
    partnerDistribution: translateStatsText(stats.partnerDistribution, t),
    fileUsagePoints: translateStatsText(stats.fileUsagePoints, t),
    keyMetrics: translateStatsText(stats.keyMetrics, t),
    productionRoundDistribution: translateStatsText(stats.productionRoundDistribution, t),
    factoryProductionDistribution: translateStatsText(stats.factoryProductionDistribution, t),
    productionCategoryDistribution: translateStatsText(stats.productionCategoryDistribution, t),
    attachmentTrashCards: translateStatsText(stats.attachmentTrashCards, t),
  };
  const viewModel = buildAdminStatsDashboardViewModel({
    sourceState: stats.sourceState,
    text: pageText,
    workorderFlow: translatedStats.workorderFlow,
    partnerDistribution: translatedStats.partnerDistribution,
    fileUsagePoints: translatedStats.fileUsagePoints,
    keyMetrics: translatedStats.keyMetrics,
    productionRoundDistribution: translatedStats.productionRoundDistribution,
    factoryProductionDistribution: translatedStats.factoryProductionDistribution,
    productionCategoryDistribution: translatedStats.productionCategoryDistribution,
    attachmentTrashCards: translatedStats.attachmentTrashCards,
  });

  return (
    <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {translatedStats.summaries.map((item) => (
          <AdminStatCard key={item.label} label={item.label} value={item.value} description={item.description} href={null} accent={item.accent} />
        ))}
      </section>

      <section className="flex flex-wrap items-center gap-2 rounded-[24px] border border-stone-100 bg-white p-3 shadow-sm">
        <span className="px-2 text-xs font-semibold text-stone-500">{pt("periodTitle", pageText.periodTitle)}</span>
        {stats.periodOptions.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            aria-current={item.active ? "page" : undefined}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${item.active ? "bg-[var(--admin-theme-surface)] text-[var(--admin-theme-text-on-surface)]" : "bg-stone-50 text-stone-500 hover:bg-stone-100"}`}
          >
            {translateStatsLabel(item.label, t)}
          </Link>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {viewModel.keyMetrics.map((item) => (
          <AdminCard key={item.key ?? item.label} className="px-4 py-4">
            <p className="text-xs font-semibold text-stone-500">{translateStatsLabel(item.label, t)}</p>
            <p className="mt-2 text-2xl font-bold text-stone-950">{item.value}</p>
            <p className="mt-1 text-xs leading-5 text-stone-400">{item.description}</p>
          </AdminCard>
        ))}
      </section>

      <section className="grid min-h-0 flex-1 gap-5 overflow-hidden xl:grid-cols-[1.2fr_0.8fr]">
        <AdminCard className="flex min-h-0 flex-col overflow-hidden">
          <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-stone-950">{pt("workorderFlowTitle", pageText.workorderFlowTitle)}</h2>
              <p className="mt-1 text-xs text-stone-500">{viewModel.sourceDescription}</p>
            </div>
            <span className="rounded-full bg-[var(--admin-theme-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--admin-theme-text-on-surface)]">{translateStatsLabel(stats.periodOptions.find((item) => item.active)?.label ?? pt("currentMonth", pageText.currentMonth), t)}</span>
          </div>

          <div className="relative mt-5 flex min-h-0 flex-1 items-end gap-4 rounded-[22px] border border-stone-100 bg-stone-50/70 px-5 pb-5 pt-7">
            {viewModel.totalFlowValue === 0 ? (
              <div className="absolute inset-x-5 top-5 rounded-2xl border border-dashed border-stone-300 bg-white/75 px-4 py-3 text-center text-xs font-semibold text-stone-500">
                {pt("emptyFlowLabel", pageText.emptyFlowLabel)}
              </div>
            ) : null}
            {viewModel.workorderBars.map((item) => (
              <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-3">
                <div className="flex h-48 w-full items-end justify-center border-b border-stone-200">
                  <div className={`w-full max-w-14 rounded-t-3xl shadow-sm transition ${item.isEmpty ? "bg-stone-200" : "bg-[var(--admin-theme-surface)]"}`} style={{ height: `${item.heightPercent}%` }} aria-label={item.ariaLabel} />
                </div>
                <div className="text-center">
                  <p className="text-base font-semibold text-stone-950">{item.value}</p>
                  <p className="mt-1 text-xs font-medium text-stone-500">{translateStatsLabel(item.label, t)}</p>
                </div>
              </div>
            ))}
          </div>
        </AdminCard>

        <div className="grid min-h-0 grid-rows-[auto_auto] gap-5 overflow-hidden">
          <AdminCard className="min-h-0">
            <h2 className="text-lg font-semibold text-stone-950">{pt("partnerDonutTitle", pageText.partnerDonutTitle)}</h2>
            <div className="mt-5">
              <AdminStatsDonut segments={viewModel.partnerDonut} total={viewModel.totalPartnerCount} suffix={pt("partnerCountSuffix", pageText.partnerCountSuffix)} />
            </div>
          </AdminCard>

          <AdminCard className="min-h-0">
            <h2 className="text-lg font-semibold text-stone-950">{pt("fileDonutTitle", pageText.fileDonutTitle)}</h2>
            <div className="mt-5">
              <AdminStatsDonut segments={viewModel.fileUsageDonut} total={translatedStats.fileUsagePoints.reduce((sum, item) => sum + item.value, 0)} suffix="" />
            </div>
          </AdminCard>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-4">
        <AdminCard>
          <h2 className="text-lg font-semibold text-stone-950">{pt("attachmentTrashTitle", pageText.attachmentTrashTitle)}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {viewModel.attachmentTrashCards.map((item) => (
              <div key={item.label} className="rounded-2xl border border-stone-100 bg-stone-50 px-4 py-3">
                <p className="text-xs font-semibold text-stone-500">{translateStatsLabel(item.label, t)}</p>
                <p className="mt-2 text-xl font-bold text-stone-950">{item.value}</p>
              </div>
            ))}
          </div>
        </AdminCard>

        <AdminCard>
          <h2 className="text-lg font-semibold text-stone-950">{pt("productionRoundTitle", pageText.productionRoundTitle)}</h2>
          <div className="mt-5">
            <AdminStatsDonut segments={viewModel.roundDonut} total={viewModel.totalRoundCount} suffix={pt("workorderCountSuffix", pageText.workorderCountSuffix)} />
          </div>
        </AdminCard>

        <AdminCard>
          <h2 className="text-lg font-semibold text-stone-950">{pt("factoryProductionTitle", pageText.factoryProductionTitle)}</h2>
          <div className="mt-5 grid gap-3">
            {viewModel.factoryProductionBars.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-xs font-semibold text-stone-600"><span className="truncate pr-2">{translateStatsLabel(item.label, t)}</span><span>{item.value}</span></div>
                <div className="mt-2 h-2 rounded-full bg-stone-100"><div className="h-2 rounded-full bg-[var(--admin-theme-surface)]" style={{ width: `${item.widthPercent}%` }} /></div>
              </div>
            ))}
          </div>
        </AdminCard>

        <AdminCard>
          <h2 className="text-lg font-semibold text-stone-950">{pt("categoryDistributionTitle", pageText.categoryDistributionTitle)}</h2>
          <div className="mt-5 grid gap-3">
            {viewModel.categoryBars.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-xs font-semibold text-stone-600"><span className="truncate pr-2">{translateStatsLabel(item.label, t)}</span><span>{item.value}</span></div>
                <div className="mt-2 h-2 rounded-full bg-stone-100"><div className="h-2 rounded-full bg-[var(--admin-theme-surface)]" style={{ width: `${item.widthPercent}%` }} /></div>
              </div>
            ))}
          </div>
        </AdminCard>
      </section>
    </>
  );
}
