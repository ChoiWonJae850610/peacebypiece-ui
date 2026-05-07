"use client";

import { useState } from "react";
import Link from "next/link";

import { AdminCard } from "@/components/admin/layout/AdminCard";
import { AdminBasicBarChart, AdminBasicDonutChart } from "@/components/admin/dashboard/AdminBasicStatsCharts";
import type { AdminStatsSnapshot } from "@/lib/admin/stats/types";
import { buildAdminStatsDashboardViewModel } from "@/lib/admin/stats/presentation";
import type { getI18n } from "@/lib/i18n";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

type AdminStatsDashboardProps = {
  stats: AdminStatsSnapshot;
  pageText: ReturnType<typeof getI18n>["admin"]["dashboardPage"];
};

type RoundFilterKey = "first" | "second" | "third";

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
    "30일": t("statsUi.periods.thirtyDays", label),
  };
  return map[label] ?? label;
}

function translateStatsText<T extends { label: string; description?: string }>(items: readonly T[], t: ReturnType<typeof useAdminTranslation>): T[] {
  return items.map((item) => ({ ...item, label: translateStatsLabel(item.label, t), description: item.description ? translateStatsLabel(item.description, t) : item.description }));
}

function formatCount(value: number | undefined, suffix = "건") {
  return `${Math.max(0, Math.round(value ?? 0)).toLocaleString("ko-KR")}${suffix}`;
}

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) return "준비중";
  return `${value.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}%`;
}

function formatStorageGb(bytes: number, limitBytes: number) {
  const usedGb = bytes / 1024 / 1024 / 1024;
  const limitGb = limitBytes / 1024 / 1024 / 1024;
  return `${usedGb.toFixed(2)}GB / ${limitGb.toFixed(2)}GB`;
}

function formatStorageMb(bytes: number) {
  return `${(bytes / 1024 / 1024).toLocaleString("ko-KR", { maximumFractionDigits: 2 })}MB 사용`;
}

function CurrentSummaryCard({ label, value, description, subValue }: { label: string; value: string; description: string; subValue?: string }) {
  return (
    <div className="rounded-[24px] border border-stone-100 bg-white px-5 py-4 shadow-sm">
      <p className="text-xs font-semibold text-stone-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-stone-950">{value}</p>
      <p className="mt-1 text-xs font-semibold text-stone-500">{description}</p>
      {subValue ? <p className="mt-2 text-[11px] font-semibold text-stone-400">{subValue}</p> : null}
    </div>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-stone-100 bg-stone-50 px-4 py-3">
      <p className="text-xs font-semibold text-stone-500">{label}</p>
      <p className="mt-2 text-lg font-bold text-stone-950">{value}</p>
    </div>
  );
}

export default function AdminStatsDashboard({ stats, pageText }: AdminStatsDashboardProps) {
  const t = useAdminTranslation();
  const pt = (key: string, fallback: string) => t(`dashboardPage.${key}`, fallback);
  const [roundFilter, setRoundFilter] = useState<RoundFilterKey>("first");
  const [customStartDate, setCustomStartDate] = useState(stats.selectedPeriodRange.isCustom ? stats.selectedPeriodRange.startDate : "");
  const [customEndDate, setCustomEndDate] = useState(stats.selectedPeriodRange.isCustom ? stats.selectedPeriodRange.endDate : "");

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
    productionCategoryByRound: {
      first: translateStatsText(stats.productionCategoryByRound.first, t),
      second: translateStatsText(stats.productionCategoryByRound.second, t),
      third: translateStatsText(stats.productionCategoryByRound.third, t),
    },
    reorderTopProducts: translateStatsText(stats.reorderTopProducts, t),
    factoryPerformance: stats.factoryPerformance,
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

  const totalReorderCount = stats.currentOverview.reorderCount;
  const activePeriodOptions = stats.periodOptions.filter((item) => item.key === "7d" || item.key === "30d");
  const activePeriodLabel = stats.selectedPeriodRange.label;
  const customPeriodHref = customStartDate && customEndDate ? `/admin/dashboard?period=custom&startDate=${customStartDate}&endDate=${customEndDate}` : "/admin/dashboard?period=30d";
  const isCustomPeriodReady = Boolean(customStartDate && customEndDate);
  const storageUsePercent = stats.currentOverview.storageLimitBytes > 0 ? Math.round((stats.currentOverview.storageUsedBytes / stats.currentOverview.storageLimitBytes) * 1000) / 10 : 0;
  const roundFilterLabels: Record<RoundFilterKey, string> = {
    first: "1차",
    second: "2차",
    third: "3차 이상",
  };

  const selectedRoundLabel = roundFilterLabels[roundFilter];
  const toRatioBars = (points: { label: string; value: number; valueLabel?: string }[]) => {
    const total = points.reduce((sum, item) => sum + item.value, 0);
    return points.map((item) => ({ ...item, limit: total, valueLabel: item.valueLabel ?? String(item.value), widthPercent: total > 0 ? Math.max(4, Math.round((item.value / total) * 100)) : 0 }));
  };
  const selectedRoundCategoryBars = toRatioBars(translatedStats.productionCategoryByRound[roundFilter]).slice(0, 5);
  const selectedRoundTotal = selectedRoundCategoryBars.reduce((sum, item) => sum + item.value, 0);
  const reorderTopProducts = toRatioBars(translatedStats.reorderTopProducts).slice(0, 5);

  const renderBarList = (title: string, points: Array<{ label: string; value: number; widthPercent: number; valueLabel?: string }>, emptyLabel: string) => (
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

  return (
    <>
      <section className="rounded-[28px] border border-stone-100 bg-white px-5 py-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">Analytics</p>
        <h2 className="mt-2 text-2xl font-bold text-stone-950">통계정보</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-500">현재 시점 요약과 기간별 생산 분석을 분리해 확인합니다.</p>
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

      <section>
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">Current snapshot</p>
            <h2 className="mt-1 text-lg font-bold text-stone-950">현재 시점 요약</h2>
          </div>
          <p className="text-xs font-semibold text-stone-400">기간 필터 미적용</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <CurrentSummaryCard label="누적 생산" value={formatCount(stats.currentOverview.totalProducedCount)} description={`리오더 ${formatCount(totalReorderCount)}`} />
          <CurrentSummaryCard label="누적 납기 지연율" value={formatPercent(stats.currentOverview.dueDelayRate)} description={`${formatCount(stats.currentOverview.dueDelayCount)} / ${formatCount(stats.currentOverview.dueDateTargetCount)} 기준`} />
          <CurrentSummaryCard label="누적 검수/불량률" value={formatPercent(stats.currentOverview.qualityIssueRate)} description={`${formatCount(stats.currentOverview.qualityIssueCount)} / ${formatCount(stats.currentOverview.qualityTargetCount)} 기준`} />
          <CurrentSummaryCard label="현재 저장소 사용량" value={`${storageUsePercent}%`} description={formatStorageGb(stats.currentOverview.storageUsedBytes, stats.currentOverview.storageLimitBytes)} subValue={formatStorageMb(stats.currentOverview.storageUsedBytes)} />
        </div>
      </section>

      <section className="rounded-[28px] border border-stone-100 bg-white px-5 py-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">Period analysis</p>
            <h2 className="mt-2 text-lg font-semibold text-stone-950">기간별 분석 범위</h2>
            <p className="mt-1 text-xs font-semibold text-stone-500">작업 흐름과 리오더 분석에 적용합니다. 현재 범위: {activePeriodLabel}</p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {activePeriodOptions.map((item) => (
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
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <label className="grid gap-1 text-xs font-semibold text-stone-500">
            시작일
            <input type="date" value={customStartDate} onChange={(event) => setCustomStartDate(event.target.value)} className="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-semibold text-stone-700 outline-none focus:border-stone-400" />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-stone-500">
            종료일
            <input type="date" value={customEndDate} onChange={(event) => setCustomEndDate(event.target.value)} className="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-semibold text-stone-700 outline-none focus:border-stone-400" />
          </label>
          <div className="flex items-end gap-2">
            <Link
              href={customPeriodHref}
              aria-disabled={!isCustomPeriodReady}
              className={`rounded-2xl px-4 py-2 text-xs font-semibold transition ${isCustomPeriodReady ? "bg-stone-950 text-white hover:bg-stone-800" : "pointer-events-none bg-stone-100 text-stone-400"}`}
            >
              직접 선택 적용
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <AdminCard className="flex min-h-[360px] flex-col">
          <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">Workflow</p>
              <h2 className="mt-2 text-lg font-semibold text-stone-950">작업흐름분석</h2>
            </div>
            <span className="rounded-full bg-[var(--admin-theme-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--admin-theme-text-on-surface)]">{activePeriodLabel}</span>
          </div>
          <AdminBasicBarChart points={translatedStats.workorderFlow} emptyLabel={pt("emptyFlowLabel", pageText.emptyFlowLabel)} valueSuffix={pt("workorderCountSuffix", pageText.workorderCountSuffix)} />
        </AdminCard>

        <AdminCard>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">Reorder TOP5</p>
          <h2 className="mt-2 text-lg font-semibold text-stone-950">기간별 리오더 TOP5</h2>
          <div className="mt-5 grid gap-3">
            {reorderTopProducts.length > 0 ? reorderTopProducts.map((item, index) => (
              <div key={`${item.label}-${index}`} className="rounded-2xl bg-stone-50 px-4 py-3">
                <div className="flex items-center justify-between text-sm font-semibold text-stone-700">
                  <span className="truncate pr-3">{index + 1}. {item.label}</span>
                  <span className="shrink-0 text-stone-950">{formatCount(item.value)}</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-white">
                  <div className="h-1.5 rounded-full bg-[var(--admin-theme-surface)]" style={{ width: `${item.widthPercent}%` }} />
                </div>
              </div>
            )) : <p className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-4 text-sm font-semibold text-stone-500">리오더 데이터 없음</p>}
          </div>
        </AdminCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <AdminCard>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">Production mix</p>
              <h2 className="mt-2 text-lg font-semibold text-stone-950">생산품 유형 비율</h2>
            </div>
            <div className="flex rounded-full bg-stone-100 p-1">
              {(["first", "second", "third"] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRoundFilter(key)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${roundFilter === key ? "bg-white text-stone-950 shadow-sm" : "text-stone-500"}`}
                >
                  {roundFilterLabels[key]}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-5">
            <AdminBasicDonutChart points={selectedRoundCategoryBars} totalLabel={pt("workorderCountSuffix", pageText.workorderCountSuffix)} valueSuffix={pt("workorderCountSuffix", pageText.workorderCountSuffix)} emptyLabel="생산품 유형 데이터 없음" compact />
          </div>
          <p className="mt-4 text-xs font-semibold text-stone-500">현재 선택: {selectedRoundLabel} · {formatCount(selectedRoundTotal)}</p>
        </AdminCard>

        {renderBarList(`${selectedRoundLabel} 생산품유형 TOP5`, selectedRoundCategoryBars, "생산품유형 데이터 없음")}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        {renderBarList("업체 성과", viewModel.factoryProductionBars, "협력업체 성과 데이터 없음")}
        <AdminCard>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">Delay / quality</p>
          <h2 className="mt-2 text-lg font-semibold text-stone-950">업체별 납기·검수 지표</h2>
          <div className="mt-5 overflow-hidden rounded-2xl border border-stone-100">
            <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr] bg-stone-50 px-4 py-3 text-xs font-semibold text-stone-500">
              <span>업체</span>
              <span>납기 지연율</span>
              <span>검수/불량률</span>
            </div>
            {translatedStats.factoryPerformance.length > 0 ? translatedStats.factoryPerformance.slice(0, 5).map((item) => (
              <div key={item.label} className="grid grid-cols-[1.2fr_0.8fr_0.8fr] border-t border-stone-100 px-4 py-3 text-xs font-semibold text-stone-700">
                <span className="truncate pr-3">{item.label} · {formatCount(item.productionCount)}</span>
                <span>{formatPercent(item.dueDelayRate)}</span>
                <span>{formatPercent(item.qualityIssueRate)}</span>
              </div>
            )) : (
              <p className="border-t border-stone-100 px-4 py-4 text-sm font-semibold text-stone-500">업체 성과 데이터 없음</p>
            )}
          </div>
        </AdminCard>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <SmallMetric label="검토 대기" value={formatCount(translatedStats.keyMetrics.find((item) => item.key === "reviewWaiting")?.value)} />
        <SmallMetric label="검수 대기" value={formatCount(translatedStats.keyMetrics.find((item) => item.key === "inspectionWaiting")?.value)} />
        <SmallMetric label="납기 후보" value={formatCount(stats.currentOverview.dueDelayCount)} />
        <SmallMetric label="검수/불량 후보" value={formatCount(stats.currentOverview.qualityIssueCount)} />
      </section>
    </>
  );
}
