"use client";

import { useState } from "react";
import Link from "next/link";

import { AdminCard, AdminStatCard } from "@/components/admin/layout/AdminCard";
import { AdminBasicBarChart, AdminBasicDonutChart } from "@/components/admin/dashboard/AdminBasicStatsCharts";
import type { AdminStatsSnapshot } from "@/lib/admin/stats/types";
import { buildAdminStatsDashboardViewModel } from "@/lib/admin/stats/presentation";
import { ADMIN_STATS_CACHE_POLICIES, ADMIN_STATS_TANSTACK_QUERY_DECISION } from "@/lib/admin/stats/cachePolicy";
import { ADMIN_STATS_PERFORMANCE_POLICY, ADMIN_STATS_PERFORMANCE_TARGETS } from "@/lib/admin/stats/performancePolicy";
import { ADMIN_STATS_AGGREGATE_READINESS_ITEMS, ADMIN_STATS_AGGREGATE_READINESS_POLICY } from "@/lib/admin/stats/aggregateReadinessPolicy";
import { ADMIN_PREMIUM_STATS_READINESS_ITEMS, buildAdminAdvancedStatsPreviewCards } from "@/lib/admin/stats/featureGate";
import { isDebugFeatureEnabled } from "@/lib/constants/runtimeMode";
import type { getI18n } from "@/lib/i18n";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

type AdminStatsDashboardProps = {
  stats: AdminStatsSnapshot;
  pageText: ReturnType<typeof getI18n>["admin"]["dashboardPage"];
};

type StatsPlanKey = "basic" | "standard" | "growth" | "premium";

const ADMIN_STATS_PLAN_OPTIONS: { key: StatsPlanKey; label: string; description: string }[] = [
  { key: "basic", label: "Basic", description: "기본" },
  { key: "standard", label: "Standard", description: "분류·업체" },
  { key: "growth", label: "Growth", description: "리오더" },
  { key: "premium", label: "Premium", description: "고급" },
];

const ADMIN_STATS_PLAN_ORDER: Record<StatsPlanKey, number> = {
  basic: 0,
  standard: 1,
  growth: 2,
  premium: 3,
};

const ADVANCED_CARD_MIN_PLAN: Record<string, StatsPlanKey> = {
  "category-top": "standard",
  "factory-performance": "standard",
  "reorder-ranking": "growth",
  "quality-risk": "premium",
};

function isStatsPlanAtLeast(selectedPlan: StatsPlanKey, requiredPlan: StatsPlanKey) {
  return ADMIN_STATS_PLAN_ORDER[selectedPlan] >= ADMIN_STATS_PLAN_ORDER[requiredPlan];
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
  const hasVisibleStatsData =
    viewModel.totalFlowValue > 0 ||
    viewModel.totalPartnerCount > 0 ||
    viewModel.totalRoundCount > 0 ||
    viewModel.totalCategoryCount > 0 ||
    viewModel.totalFactoryProductionCount > 0 ||
    translatedStats.fileUsagePoints.some((item) => item.value > 0) ||
    translatedStats.keyMetrics.some((item) => item.value > 0);

  const topCategory = viewModel.categoryBars.find((item) => item.value > 0);
  const topFactory = viewModel.factoryProductionBars.find((item) => item.value > 0);
  const reorderRounds = translatedStats.productionRoundDistribution.filter((item) => item.value > 0 && item.label !== translateStatsLabel("1차", t));
  const topReorder = reorderRounds.reduce<(typeof reorderRounds)[number] | undefined>((current, item) => (!current || item.value > current.value ? item : current), undefined);
  const totalReorderCount = reorderRounds.reduce((sum, item) => sum + item.value, 0);
  const advancedStatsPreviewCards = buildAdminAdvancedStatsPreviewCards({
    categoryTopLabel: topCategory?.label,
    categoryTopValue: topCategory?.value,
    factoryTopLabel: topFactory?.label,
    factoryTopValue: topFactory?.value,
    reorderTopLabel: topReorder?.label,
    reorderTopValue: topReorder?.value,
    totalReorderCount,
    qualityRiskCount: Number(viewModel.keyMetrics.find((item) => item.key === "defectCount")?.value ?? 0),
  });

  const [selectedPlan, setSelectedPlan] = useState<StatsPlanKey>("basic");
  const selectedPlanOption = ADMIN_STATS_PLAN_OPTIONS.find((item) => item.key === selectedPlan) ?? ADMIN_STATS_PLAN_OPTIONS[0];
  const visibleAdvancedStatsPreviewCards = advancedStatsPreviewCards.filter((item) => {
    const requiredPlan = ADVANCED_CARD_MIN_PLAN[item.key] ?? "premium";
    return isStatsPlanAtLeast(selectedPlan, requiredPlan);
  });
  const showStandardStats = isStatsPlanAtLeast(selectedPlan, "standard");
  const showGrowthStats = isStatsPlanAtLeast(selectedPlan, "growth");
  const showPremiumStats = isStatsPlanAtLeast(selectedPlan, "premium");
  const showOperationNotes = isDebugFeatureEnabled("adminStatsDevSections");

  return (
    <>
      <section className="rounded-[28px] border border-stone-100 bg-white px-5 py-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">Stats</p>
            <h2 className="mt-2 text-2xl font-bold text-stone-950">관리자 통계</h2>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="flex flex-wrap justify-end gap-2">
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
            </div>
            <div className="flex flex-wrap justify-end gap-2 rounded-full bg-stone-50 p-1">
              {ADMIN_STATS_PLAN_OPTIONS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSelectedPlan(item.key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${selectedPlan === item.key ? "bg-white text-stone-950 shadow-sm" : "text-stone-500 hover:text-stone-800"}`}
                  aria-pressed={selectedPlan === item.key}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {!hasVisibleStatsData ? (
        <AdminCard className="border-dashed border-amber-200 bg-amber-50/55 px-5 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">Demo seed required</p>
              <h2 className="mt-2 text-lg font-semibold text-stone-950">통계 확인용 데이터가 아직 없습니다</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
                차트 확인은 개발용 seed SQL 실행 후 진행하세요.
              </p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-xs font-semibold leading-5 text-stone-600 shadow-sm">
              <p>1. full_reset.sql</p>
              <p>2. full_reset_smoke_test.sql</p>
              <p>3. seed_stats_demo_0_9_2071.sql</p>
            </div>
          </div>
        </AdminCard>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {translatedStats.summaries.slice(0, 4).map((item) => (
          <AdminStatCard key={item.label} label={item.label} value={item.value} description={item.description} href={null} accent={item.accent} />
        ))}
      </section>

      <section id="basic-stats" className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <AdminCard className="flex min-h-[360px] flex-col">
          <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">Basic</p>
              <h2 className="mt-2 text-lg font-semibold text-stone-950">{pt("workorderFlowTitle", pageText.workorderFlowTitle)}</h2>
            </div>
            <span className="rounded-full bg-[var(--admin-theme-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--admin-theme-text-on-surface)]">{translateStatsLabel(stats.periodOptions.find((item) => item.active)?.label ?? pt("currentMonth", pageText.currentMonth), t)}</span>
          </div>
          <AdminBasicBarChart points={translatedStats.workorderFlow} emptyLabel={pt("emptyFlowLabel", pageText.emptyFlowLabel)} valueSuffix={pt("workorderCountSuffix", pageText.workorderCountSuffix)} />
        </AdminCard>

        <div className="grid gap-5">
          <AdminCard className="min-h-0">
            <h2 className="text-lg font-semibold text-stone-950">{pt("partnerDonutTitle", pageText.partnerDonutTitle)}</h2>
            <div className="mt-5">
              <AdminBasicDonutChart points={translatedStats.partnerDistribution} totalLabel={pt("partnerCountSuffix", pageText.partnerCountSuffix)} valueSuffix={pt("partnerCountSuffix", pageText.partnerCountSuffix)} emptyLabel="협력업체 데이터 없음" compact />
            </div>
          </AdminCard>

          <AdminCard className="min-h-0">
            <h2 className="text-lg font-semibold text-stone-950">{pt("fileDonutTitle", pageText.fileDonutTitle)}</h2>
            <div className="mt-5">
              <AdminBasicDonutChart points={translatedStats.fileUsagePoints} totalLabel={pt("fileUsageTotalLabel", "전체")} emptyLabel="파일 사용 데이터 없음" compact />
            </div>
          </AdminCard>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
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
            <AdminBasicDonutChart points={translatedStats.productionRoundDistribution} totalLabel={pt("workorderCountSuffix", pageText.workorderCountSuffix)} valueSuffix={pt("workorderCountSuffix", pageText.workorderCountSuffix)} emptyLabel="생산 단계 데이터 없음" compact />
          </div>
        </AdminCard>
      </section>

      {showStandardStats ? (
        <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <AdminCard>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">Standard</p>
                <h2 className="mt-2 text-lg font-semibold text-stone-950">Standard 통계</h2>
              </div>
              <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-500">Standard 이상</span>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {visibleAdvancedStatsPreviewCards.filter((item) => item.planLabel === "Standard").map((item) => (
                <article key={item.key} className="rounded-3xl border border-stone-200 bg-stone-50/70 p-4">
                  <h3 className="text-sm font-semibold text-stone-950">{item.title}</h3>
                  <div className="mt-4 rounded-2xl bg-white px-3 py-3 shadow-sm">
                    <p className="text-[11px] font-semibold text-stone-400">{item.metricLabel}</p>
                    <p className="mt-1 text-lg font-bold text-stone-950">{item.metricValue}</p>
                  </div>
                </article>
              ))}
            </div>
          </AdminCard>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-1">
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
          </div>
        </section>
      ) : null}

      {showGrowthStats ? (
        <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
          <AdminCard>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">Growth</p>
            <h2 className="mt-2 text-lg font-semibold text-stone-950">리오더 통계</h2>
          </AdminCard>
          <div className="grid gap-3 md:grid-cols-2">
            {visibleAdvancedStatsPreviewCards.filter((item) => item.planLabel === "Growth").map((item) => (
              <AdminCard key={item.key} className="px-4 py-4">
                <h3 className="text-sm font-semibold text-stone-950">{item.title}</h3>
                <p className="mt-3 text-2xl font-bold text-stone-950">{item.metricValue}</p>
                <p className="mt-2 text-xs leading-5 text-stone-500">{item.metricLabel}</p>
              </AdminCard>
            ))}
          </div>
        </section>
      ) : null}

      {showPremiumStats ? (
        <section id="premium-readiness" className="grid gap-4 lg:grid-cols-[0.72fr_1.28fr]">
          <AdminCard>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">Premium</p>
            <h2 className="mt-2 text-lg font-semibold text-stone-950">Premium 통계 준비 상태</h2>
          </AdminCard>

          <div className="grid gap-3 md:grid-cols-2">
            {ADMIN_PREMIUM_STATS_READINESS_ITEMS.map((item) => (
              <AdminCard key={item.key} className="px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-stone-950">{item.title}</h3>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.statusLabel === "가능" ? "bg-emerald-50 text-emerald-700" : item.statusLabel === "부분 가능" ? "bg-amber-50 text-amber-700" : "bg-stone-100 text-stone-500"}`}>
                    {item.statusLabel}
                  </span>
                </div>
                <p className="mt-3 text-xs leading-5 text-stone-500">{item.dataSource}</p>
                <p className="mt-3 rounded-2xl bg-stone-50 px-3 py-2 text-xs leading-5 text-stone-600">{item.nextAction}</p>
              </AdminCard>
            ))}
          </div>
        </section>
      ) : null}

      {showOperationNotes ? (
        <details className="group rounded-[28px] border border-stone-100 bg-white p-5 shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">Operation notes</p>
              <h2 className="mt-2 text-lg font-semibold text-stone-950">운영/개발 기준</h2>
              <p className="mt-1 text-xs leading-5 text-stone-500">개발 모드 플래그가 켜진 경우에만 표시합니다.</p>
            </div>
            <span className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-600 group-open:hidden">펼치기</span>
            <span className="hidden rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-600 group-open:inline-flex">접기</span>
          </summary>

          <div className="mt-5 grid gap-4">
            <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <AdminCard>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">Cache policy</p>
                <h2 className="mt-2 text-lg font-semibold text-stone-950">통계 API 캐싱 기준</h2>
                <p className="mt-2 text-sm leading-6 text-stone-600">{ADMIN_STATS_TANSTACK_QUERY_DECISION.reason}</p>
              </AdminCard>
              <div className="grid gap-3 md:grid-cols-3">
                {ADMIN_STATS_CACHE_POLICIES.map((item) => (
                  <AdminCard key={item.key} className="px-4 py-4">
                    <h3 className="text-sm font-semibold text-stone-950">{item.label}</h3>
                    <p className="mt-3 text-2xl font-bold text-stone-950">{item.staleSeconds === 0 ? "캐시 없음" : `${item.staleSeconds}초`}</p>
                    <p className="mt-2 text-xs leading-5 text-stone-500">{item.invalidation}</p>
                  </AdminCard>
                ))}
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <AdminCard>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">Aggregate strategy</p>
                <h2 className="mt-2 text-lg font-semibold text-stone-950">summary table / materialized view 검토</h2>
                <p className="mt-2 text-sm leading-6 text-stone-600">{ADMIN_STATS_AGGREGATE_READINESS_POLICY.nextStep}</p>
              </AdminCard>
              <div className="grid gap-3 md:grid-cols-2">
                {ADMIN_STATS_AGGREGATE_READINESS_ITEMS.map((item) => (
                  <AdminCard key={item.key} className="px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-sm font-semibold text-stone-950">{item.title}</h3>
                      <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-semibold text-stone-500">{item.status}</span>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-stone-500">{item.decision}</p>
                  </AdminCard>
                ))}
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
              <AdminCard>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">Performance baseline</p>
                <h2 className="mt-2 text-lg font-semibold text-stone-950">성능 측정 기준</h2>
                <p className="mt-2 text-sm leading-6 text-stone-600">{ADMIN_STATS_PERFORMANCE_POLICY.nextStep}</p>
              </AdminCard>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {ADMIN_STATS_PERFORMANCE_TARGETS.map((item) => (
                  <AdminCard key={item.key} className="px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-sm font-semibold text-stone-950">{item.label}</h3>
                      <span className="shrink-0 rounded-full bg-[var(--admin-theme-surface)] px-2.5 py-1 text-[11px] font-semibold text-[var(--admin-theme-text-on-surface)]">{item.target}</span>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-stone-500">{item.measureAt}</p>
                  </AdminCard>
                ))}
              </div>
            </section>
          </div>
        </details>
      ) : null}
    </>
  );
}
