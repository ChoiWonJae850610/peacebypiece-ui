"use client";

import Link from "next/link";

import { AdminCard, AdminStatCard } from "@/components/admin/layout/AdminCard";
import { AdminBasicBarChart, AdminBasicDonutChart } from "@/components/admin/dashboard/AdminBasicStatsCharts";
import type { AdminStatsSnapshot } from "@/lib/admin/stats/types";
import { buildAdminStatsDashboardViewModel } from "@/lib/admin/stats/presentation";
import { ADMIN_PREMIUM_STATS_READINESS_ITEMS, buildAdminAdvancedStatsPreviewCards } from "@/lib/admin/stats/featureGate";
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

  const formatCount = (value: number | undefined, suffix = "건") => `${Math.max(0, Math.round(value ?? 0)).toLocaleString("ko-KR")}${suffix}`;
  const formatFileSize = (value: number | undefined) => {
    const normalized = Math.max(0, value ?? 0);
    if (normalized >= 1024 * 1024 * 1024) return `${(normalized / 1024 / 1024 / 1024).toFixed(1)}GB`;
    if (normalized >= 1024 * 1024) return `${(normalized / 1024 / 1024).toFixed(1)}MB`;
    if (normalized >= 1024) return `${(normalized / 1024).toFixed(1)}KB`;
    return `${normalized.toLocaleString("ko-KR")}B`;
  };

  const totalWorkorderCount = viewModel.totalFlowValue;
  const completedCount = translatedStats.workorderFlow.find((item) => item.label === translateStatsLabel("완료", t))?.value ?? 0;
  const completionRate = totalWorkorderCount > 0 ? Math.round((completedCount / totalWorkorderCount) * 100) : 0;
  const totalFileBytes = translatedStats.fileUsagePoints.reduce((sum, item) => sum + item.value, 0);
  const activeFilePoint = translatedStats.fileUsagePoints.find((item) => item.label === translateStatsLabel("첨부파일", t));
  const trashFilePoint = translatedStats.fileUsagePoints.find((item) => item.label === translateStatsLabel("휴지통", t));

  const renderBarList = (title: string, points: typeof viewModel.categoryBars, emptyLabel: string) => (
    <AdminCard>
      <h2 className="text-lg font-semibold text-stone-950">{title}</h2>
      <div className="mt-5 grid gap-3">
        {points.length > 0 ? points.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between text-xs font-semibold text-stone-600">
              <span className="truncate pr-2">{translateStatsLabel(item.label, t)}</span>
              <span>{item.value}</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-stone-100">
              <div className="h-2 rounded-full bg-[var(--admin-theme-surface)]" style={{ width: `${item.widthPercent}%` }} />
            </div>
          </div>
        )) : <p className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-4 text-sm font-semibold text-stone-500">{emptyLabel}</p>}
      </div>
    </AdminCard>
  );

  const compactMetricItems = [
    { label: "첨부파일", value: activeFilePoint ? formatCount(activeFilePoint.value) : "0건" },
    { label: "휴지통", value: trashFilePoint ? formatCount(trashFilePoint.value) : "0건" },
    { label: "생산 단계", value: formatCount(viewModel.totalRoundCount) },
    { label: "리오더", value: formatCount(totalReorderCount) },
  ];

  return (
    <>
      <section className="rounded-[28px] border border-stone-100 bg-white px-5 py-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">Analytics</p>
            <h2 className="mt-2 text-2xl font-bold text-stone-950">통계정보</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">대시보드와 저장소의 단순 요약은 줄이고, 생산 흐름·협력업체·리오더 분석을 한 화면에서 확인합니다.</p>
          </div>
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
        </div>
      </section>

      {!hasVisibleStatsData ? (
        <AdminCard className="border-dashed border-amber-200 bg-amber-50/55 px-5 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">Demo seed required</p>
              <h2 className="mt-2 text-lg font-semibold text-stone-950">통계 확인용 데이터가 아직 없습니다</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">차트 확인은 개발용 seed SQL 실행 후 진행하세요.</p>
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
        <AdminStatCard label="작업지시서" value={formatCount(totalWorkorderCount)} description="선택 기간의 전체 작업 흐름" href={null} accent="bg-stone-950 text-white" />
        <AdminStatCard label="완료율" value={`${completionRate}%`} description="완료 작업 기준 진행 안정도" href={null} accent="bg-emerald-50 text-emerald-700" />
        <AdminStatCard label="리오더" value={formatCount(totalReorderCount)} description="2차 이상 반복 생산 합계" href={null} accent="bg-stone-100 text-stone-700" />
        <AdminStatCard label="저장소 요약" value={formatFileSize(totalFileBytes)} description="상세 관리는 저장소 메뉴에서 확인" href="/admin/files" accent="bg-amber-50 text-amber-700" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <AdminCard className="flex min-h-[360px] flex-col">
          <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">Workflow</p>
              <h2 className="mt-2 text-lg font-semibold text-stone-950">작업 흐름 분석</h2>
            </div>
            <span className="rounded-full bg-[var(--admin-theme-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--admin-theme-text-on-surface)]">
              {translateStatsLabel(stats.periodOptions.find((item) => item.active)?.label ?? pt("currentMonth", pageText.currentMonth), t)}
            </span>
          </div>
          <AdminBasicBarChart points={translatedStats.workorderFlow} emptyLabel={pt("emptyFlowLabel", pageText.emptyFlowLabel)} valueSuffix={pt("workorderCountSuffix", pageText.workorderCountSuffix)} />
        </AdminCard>

        <AdminCard>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">Storage summary</p>
          <h2 className="mt-2 text-lg font-semibold text-stone-950">저장소 요약</h2>
          <p className="mt-2 text-xs leading-5 text-stone-500">용량·휴지통 상세 관리는 저장소 메뉴로 분리합니다.</p>
          <div className="mt-5">
            <AdminBasicDonutChart points={translatedStats.fileUsagePoints} totalLabel={pt("fileUsageTotalLabel", "전체")} emptyLabel="파일 사용 데이터 없음" compact />
          </div>
        </AdminCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        {renderBarList("생산 분석 · 생산품유형 TOP", viewModel.categoryBars, "생산품유형 데이터 없음")}
        <AdminCard>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">Production stage</p>
          <h2 className="mt-2 text-lg font-semibold text-stone-950">생산 단계 비율</h2>
          <div className="mt-5">
            <AdminBasicDonutChart points={translatedStats.productionRoundDistribution} totalLabel={pt("workorderCountSuffix", pageText.workorderCountSuffix)} valueSuffix={pt("workorderCountSuffix", pageText.workorderCountSuffix)} emptyLabel="생산 단계 데이터 없음" compact />
          </div>
        </AdminCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        {renderBarList("협력업체 성과 분석", viewModel.factoryProductionBars, "협력업체 성과 데이터 없음")}
        <AdminCard>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">Partner mix</p>
          <h2 className="mt-2 text-lg font-semibold text-stone-950">협력업체 분포</h2>
          <div className="mt-5">
            <AdminBasicDonutChart points={translatedStats.partnerDistribution} totalLabel={pt("partnerCountSuffix", pageText.partnerCountSuffix)} valueSuffix={pt("partnerCountSuffix", pageText.partnerCountSuffix)} emptyLabel="협력업체 데이터 없음" compact />
          </div>
        </AdminCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <AdminCard>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">Reorder</p>
          <h2 className="mt-2 text-lg font-semibold text-stone-950">리오더 분석</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {advancedStatsPreviewCards.filter((item) => item.key === "reorder-ranking").map((item) => (
              <div key={item.key} className="rounded-2xl border border-stone-100 bg-stone-50 px-4 py-3">
                <p className="text-xs font-semibold text-stone-500">{item.title}</p>
                <p className="mt-2 text-xl font-bold text-stone-950">{item.metricValue}</p>
                <p className="mt-1 text-xs font-semibold text-stone-500">{item.metricLabel}</p>
              </div>
            ))}
            {advancedStatsPreviewCards.filter((item) => item.key === "reorder-ranking").length === 0 ? (
              <p className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-4 text-sm font-semibold text-stone-500">리오더 데이터 없음</p>
            ) : null}
          </div>
        </AdminCard>
        <AdminCard>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">Quality / due date</p>
          <h2 className="mt-2 text-lg font-semibold text-stone-950">품질·납기 준비 영역</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {ADMIN_PREMIUM_STATS_READINESS_ITEMS.map((item) => (
              <div key={item.key} className="rounded-2xl border border-stone-100 bg-stone-50 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-stone-950">{item.title}</h3>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.statusLabel === "가능" ? "bg-emerald-50 text-emerald-700" : item.statusLabel === "부분 가능" ? "bg-amber-50 text-amber-700" : "bg-stone-100 text-stone-500"}`}>{item.statusLabel}</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-stone-500">{item.nextAction}</p>
              </div>
            ))}
          </div>
        </AdminCard>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        {compactMetricItems.map((item) => (
          <div key={item.label} className="rounded-2xl border border-stone-100 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-semibold text-stone-500">{item.label}</p>
            <p className="mt-2 text-lg font-bold text-stone-950">{item.value}</p>
          </div>
        ))}
      </section>

    </>
  );
}
