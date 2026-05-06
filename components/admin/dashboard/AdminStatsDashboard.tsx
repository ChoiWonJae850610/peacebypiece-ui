"use client";

import Link from "next/link";

import { AdminCard, AdminStatCard } from "@/components/admin/layout/AdminCard";
import { AdminBasicBarChart, AdminBasicDonutChart } from "@/components/admin/dashboard/AdminBasicStatsCharts";
import type { AdminStatsSnapshot } from "@/lib/admin/stats/types";
import { buildAdminStatsDashboardViewModel } from "@/lib/admin/stats/presentation";
import type { getI18n } from "@/lib/i18n";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

type AdminStatsDashboardProps = {
  stats: AdminStatsSnapshot;
  pageText: ReturnType<typeof getI18n>["admin"]["dashboardPage"];
};

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
    "누적": t("statsUi.periods.all", label),
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

      <section className="grid gap-4 lg:grid-cols-2">
        <AdminCard className="px-4 py-4">
          <p className="text-xs font-semibold text-stone-500">{pt("monthlyNoticeTitle", pageText.monthlyNoticeTitle)}</p>
          <p className="mt-2 text-sm leading-6 text-stone-600">{pt("monthlyNoticeDescription", pageText.monthlyNoticeDescription)}</p>
        </AdminCard>
        <AdminCard className="px-4 py-4">
          <p className="text-xs font-semibold text-stone-500">{pt("cumulativeNoticeTitle", pageText.cumulativeNoticeTitle)}</p>
          <p className="mt-2 text-sm leading-6 text-stone-600">{pt("cumulativeNoticeDescription", pageText.cumulativeNoticeDescription)}</p>
        </AdminCard>
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

          <AdminBasicBarChart points={translatedStats.workorderFlow} emptyLabel={pt("emptyFlowLabel", pageText.emptyFlowLabel)} valueSuffix={pt("workorderCountSuffix", pageText.workorderCountSuffix)} />
        </AdminCard>

        <div className="grid min-h-0 grid-rows-[auto_auto] gap-5 overflow-hidden">
          <AdminCard className="min-h-0">
            <h2 className="text-lg font-semibold text-stone-950">{pt("partnerDonutTitle", pageText.partnerDonutTitle)}</h2>
            <div className="mt-5">
              <AdminBasicDonutChart points={translatedStats.partnerDistribution} totalLabel={pt("partnerCountSuffix", pageText.partnerCountSuffix)} valueSuffix={pt("partnerCountSuffix", pageText.partnerCountSuffix)} />
            </div>
          </AdminCard>

          <AdminCard className="min-h-0">
            <h2 className="text-lg font-semibold text-stone-950">{pt("fileDonutTitle", pageText.fileDonutTitle)}</h2>
            <div className="mt-5">
              <AdminBasicDonutChart points={translatedStats.fileUsagePoints} totalLabel={pt("fileUsageTotalLabel", "전체")} />
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
            <AdminBasicDonutChart points={translatedStats.productionRoundDistribution} totalLabel={pt("workorderCountSuffix", pageText.workorderCountSuffix)} valueSuffix={pt("workorderCountSuffix", pageText.workorderCountSuffix)} />
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
