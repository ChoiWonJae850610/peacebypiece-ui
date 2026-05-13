"use client";

import { useEffect, useMemo, useState } from "react";

import { AdminButton, AdminLinkButton } from "@/components/admin/common/AdminButton";
import { AdminDateRangePicker, getTodayAdminLocalDateValue } from "@/components/admin/common/AdminDateRangePicker";
import { AdminEmptyState } from "@/components/admin/common/AdminEmptyState";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import AdminTable from "@/components/admin/common/AdminTable";
import { AdminCard } from "@/components/admin/layout/AdminCard";
import { AdminBasicBarChart, AdminBasicDonutChart } from "@/components/admin/dashboard/AdminBasicStatsCharts";
import type { AdminTableColumn } from "@/lib/admin/common/types";
import type { AdminStatsPeriodTopMode, AdminStatsSnapshot } from "@/lib/admin/stats/types";
import { buildAdminStatsDashboardViewModel } from "@/lib/admin/stats/presentation";
import type { getI18n } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

type AdminStatsDashboardProps = {
  stats: AdminStatsSnapshot;
  pageText: ReturnType<typeof getI18n>["admin"]["dashboardPage"];
};

type CategoryDepthKey = "first" | "second";
type AdminStatsSectionKey = "production" | "factory" | "period";
type AdminStatsFactoryPerformanceItem = AdminStatsSnapshot["factoryPerformance"][number];


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

function formatCount(value: number | undefined, suffix = "") {
  const normalizedValue = Math.max(0, Math.round(value ?? 0)).toLocaleString("ko-KR");
  if (!suffix) return normalizedValue;
  const shouldUseSpacing = /^[A-Za-z%]+$/.test(suffix);
  return shouldUseSpacing ? `${normalizedValue} ${suffix}` : `${normalizedValue}${suffix}`;
}

function formatPercent(value: number | null | undefined, pendingLabel: string) {
  if (value === null || value === undefined) return pendingLabel;
  return `${value.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}%`;
}

function formatStorageGb(bytes: number, limitBytes: number) {
  const usedGb = bytes / 1024 / 1024 / 1024;
  const limitGb = limitBytes / 1024 / 1024 / 1024;
  return `${usedGb.toFixed(2)}GB / ${limitGb.toFixed(2)}GB`;
}

function formatStorageMb(bytes: number, usedSuffix: string) {
  return `${(bytes / 1024 / 1024).toLocaleString("ko-KR", { maximumFractionDigits: 2 })}MB ${usedSuffix}`;
}

function buildAdminStatsRatioBars(points: Array<{ label: string; value: number; valueLabel?: string }>) {
  const total = points.reduce((sum, item) => sum + item.value, 0);
  return points.map((item) => ({
    ...item,
    limit: total,
    valueLabel: item.valueLabel ?? String(item.value),
    widthPercent: total > 0 ? Math.max(4, Math.round((item.value / total) * 100)) : 0,
  }));
}

function PeriodSummaryCard({
  title,
  items,
  selectedKey,
  onSelect,
}: {
  title: string;
  items: Array<{ key: AdminStatsPeriodTopMode; label: string; value: string; description: string }>;
  selectedKey: AdminStatsPeriodTopMode;
  onSelect: (key: AdminStatsPeriodTopMode) => void;
}) {
  return (
    <div className="flex h-full min-h-[188px] flex-col rounded-[20px] border border-stone-100 bg-stone-50/70 p-2.5 sm:min-h-[204px] sm:rounded-[22px] sm:p-3">
      <h3 className="text-sm font-semibold text-stone-950">{title}</h3>
      <div className="mt-2 grid flex-1 content-start gap-1">
        {items.map((item) => {
          const isSelected = item.key === selectedKey;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect(item.key)}
              className={`min-h-[52px] rounded-2xl border px-2.5 py-2 text-left shadow-sm transition sm:px-3 ${isSelected ? "border-stone-950 bg-white" : "border-stone-100 bg-white hover:border-stone-200 hover:bg-stone-50"}`}
              aria-pressed={isSelected}
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-stone-800">{item.label}</p>
                  <p className="mt-0.5 line-clamp-1 text-[11px] font-semibold leading-4 text-stone-400">{item.description}</p>
                </div>
                <p className="shrink-0 text-base font-bold text-stone-950 sm:text-lg">{item.value}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PeriodTopCard({
  eyebrow,
  title,
  items,
  emptyLabel,
  valueSuffix,
}: {
  eyebrow: string;
  title: string;
  basis: string;
  items: Array<{ label: string; value: number; widthPercent: number }>;
  emptyLabel: string;
  valueSuffix: string;
}) {
  return (
    <AdminCard className="flex h-full min-h-[188px] flex-col p-3 sm:min-h-[204px] sm:p-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">{eyebrow}</p>
      <h2 className="mt-1 text-base font-semibold text-stone-950">{title}</h2>
      <div className="mt-2 grid flex-1 content-start gap-2">
        {items.length > 0 ? items.map((item, index) => (
          <div key={`${item.label}-${index}`} className="rounded-2xl bg-stone-50 px-3 py-2">
            <div className="flex items-start justify-between gap-2 text-sm font-semibold text-stone-700">
              <span className="truncate pr-3">{index + 1}. {item.label}</span>
              <span className="shrink-0 text-stone-950">{formatCount(item.value, valueSuffix)}</span>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-white">
              <div className="h-1.5 rounded-full bg-[var(--admin-theme-surface)]" style={{ width: `${item.widthPercent}%` }} />
            </div>
          </div>
        )) : <AdminEmptyState title={emptyLabel} />}
      </div>
    </AdminCard>
  );
}

function CurrentSummaryCard({ label, value, description, subValue }: { label: string; value: string; description: string; subValue?: string }) {
  return (
    <div className="flex h-full min-h-[92px] flex-col rounded-[18px] border border-stone-100 bg-white px-3 py-2.5 shadow-sm sm:min-h-[96px] sm:rounded-[20px] sm:px-3.5">
      <p className="text-xs font-semibold text-stone-500">{label}</p>
      <p className="mt-1 text-base font-bold text-stone-950 sm:text-lg">{value}</p>
      <p className="mt-0.5 flex-1 text-[11px] font-semibold leading-4 text-stone-500">{description}</p>
      {subValue ? <p className="sr-only">{subValue}</p> : null}
    </div>
  );
}

export default function AdminStatsDashboard({ stats, pageText }: AdminStatsDashboardProps) {
  const t = useAdminTranslation();
  const { locale } = useI18n();
  const pt = (key: string, fallback: string) => t(`dashboardPage.${key}`, fallback);
  const [categoryDepth, setCategoryDepth] = useState<CategoryDepthKey>("first");
  const [selectedCategoryLabel, setSelectedCategoryLabel] = useState<string | null>(null);
  const [selectedPeriodTopMode, setSelectedPeriodTopMode] = useState<AdminStatsPeriodTopMode>("reorder");
  const [activeStatsSection, setActiveStatsSection] = useState<AdminStatsSectionKey>("production");
  const [statsSectionDirection, setStatsSectionDirection] = useState(1);
  const [isStatsSectionAnimating, setIsStatsSectionAnimating] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(stats.selectedPeriodRange.isCustom ? stats.selectedPeriodRange.startDate : "");
  const [customEndDate, setCustomEndDate] = useState(stats.selectedPeriodRange.isCustom ? stats.selectedPeriodRange.endDate : "");
  const todayDateValue = getTodayAdminLocalDateValue();
  const dateRangeLabels = {
    start: pt("customStartDateLabel", pageText.customStartDateLabel),
    end: pt("customEndDateLabel", pageText.customEndDateLabel),
    clear: pt("customClear", pageText.customReset),
    done: pt("customDone", pageText.customDone),
    selected: pt("customDateRangeSelected", pageText.customDateRangeSelected),
    notSelected: pt("customDateRangeEmpty", pageText.customDateRangeEmpty),
    calendarAria: pt("customDateRangeCalendarAria", pageText.customDateRangeCalendarAria),
  };
  const updateCustomStartDate = (value: string) => {
    if (!value) {
      setCustomStartDate("");
      setCustomEndDate("");
      return;
    }
    if (value > todayDateValue) return;
    setCustomStartDate(value);
    if (customEndDate && customEndDate < value) setCustomEndDate("");
  };
  const updateCustomEndDate = (value: string) => {
    if (!value) {
      setCustomEndDate("");
      return;
    }
    if (value > todayDateValue) return;
    if (customStartDate && value < customStartDate) return;
    setCustomEndDate(value);
  };

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
    productionCategoryDrilldown: {
      firstToSecond: Object.fromEntries(Object.entries(stats.productionCategoryDrilldown.firstToSecond).map(([label, items]) => [translateStatsLabel(label, t), translateStatsText(items, t)])),
      secondToThird: Object.fromEntries(Object.entries(stats.productionCategoryDrilldown.secondToThird).map(([label, items]) => [translateStatsLabel(label, t), translateStatsText(items, t)])),
    },
    reorderTopProducts: translateStatsText(stats.reorderTopProducts, t),
    periodTopProducts: {
      completed: translateStatsText(stats.periodTopProducts.completed, t),
      reorder: translateStatsText(stats.periodTopProducts.reorder, t),
      defect: translateStatsText(stats.periodTopProducts.defect, t),
    },
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
  const activePeriodLabel = translateStatsLabel(stats.selectedPeriodRange.label, t);
  const isCustomPeriodReady = Boolean(customStartDate && customEndDate);
  const isCustomPeriodOrderValid = !isCustomPeriodReady || customStartDate <= customEndDate;
  const isCustomPeriodNotFuture = (!customStartDate || customStartDate <= todayDateValue) && (!customEndDate || customEndDate <= todayDateValue);
  const isCustomEndSelectable = !customEndDate || !customStartDate || customEndDate >= customStartDate;
  const isCustomPeriodValid = isCustomPeriodReady && isCustomPeriodOrderValid && isCustomPeriodNotFuture && isCustomEndSelectable;
  const customPeriodHref = isCustomPeriodValid ? `/admin/dashboard?period=custom&startDate=${customStartDate}&endDate=${customEndDate}` : "/admin/dashboard?period=30d";
  const customPeriodMessage = !isCustomPeriodOrderValid
    ? pt("customPeriodInvalidOrder", pageText.customPeriodInvalidOrder)
    : !isCustomPeriodNotFuture
      ? pt("customPeriodFutureBlocked", pageText.customPeriodFutureBlocked)
      : customEndDate && !isCustomEndSelectable
        ? pt("customPeriodInvalidOrder", pageText.customPeriodInvalidOrder)
        : "";
  const storageUsePercent = stats.currentOverview.storageLimitBytes > 0 ? Math.round((stats.currentOverview.storageUsedBytes / stats.currentOverview.storageLimitBytes) * 1000) / 10 : 0;
  const periodSummaryItems = [
    {
      key: "completed" as const,
      label: pt("periodSummaryCompletedLabel", pageText.periodSummaryCompletedLabel),
      value: formatCount(stats.periodSummary.completedCount, pt("workorderCountSuffix", pageText.workorderCountSuffix)),
      description: pt("periodSummaryCompletedDescription", pageText.periodSummaryCompletedDescription),
    },
    {
      key: "reorder" as const,
      label: pt("periodSummaryReorderLabel", pageText.periodSummaryReorderLabel),
      value: formatCount(stats.periodSummary.reorderCount, pt("workorderCountSuffix", pageText.workorderCountSuffix)),
      description: pt("periodSummaryReorderDescription", pageText.periodSummaryReorderDescription),
    },
    {
      key: "defect" as const,
      label: pt("periodSummaryDefectLabel", pageText.periodSummaryDefectLabel),
      value: formatCount(stats.periodSummary.qualityIssueCount, pt("workorderCountSuffix", pageText.workorderCountSuffix)),
      description: pt("periodSummaryDefectDescription", pageText.periodSummaryDefectDescription),
    },
  ];
  const categoryDepthLabels: Record<CategoryDepthKey, string> = {
    first: pt("categoryDepthFirst", pageText.categoryDepthFirst),
    second: pt("categoryDepthSecond", pageText.categoryDepthSecond),
  };

  const selectedCategoryDepthLabel = categoryDepthLabels[categoryDepth];
  const selectedCategoryDepthBars = useMemo(
    () => buildAdminStatsRatioBars(translatedStats.productionCategoryByRound[categoryDepth]).slice(0, 5),
    [categoryDepth, translatedStats.productionCategoryByRound],
  );
  const selectedCategoryDepthTotal = selectedCategoryDepthBars.reduce((sum, item) => sum + item.value, 0);
  const normalizedSelectedCategoryLabel = selectedCategoryDepthBars.some((item) => item.label === selectedCategoryLabel) ? selectedCategoryLabel : (selectedCategoryDepthBars[0]?.label ?? null);
  const drilldownKey = categoryDepth === "first" ? "firstToSecond" : "secondToThird";
  const categoryDetailPoints = useMemo(
    () => normalizedSelectedCategoryLabel ? buildAdminStatsRatioBars(translatedStats.productionCategoryDrilldown[drilldownKey][normalizedSelectedCategoryLabel] ?? []).slice(0, 5) : [],
    [drilldownKey, normalizedSelectedCategoryLabel, translatedStats.productionCategoryDrilldown],
  );
  const fallbackSelectedCategory = normalizedSelectedCategoryLabel ?? pt("selectedCategoryFallback", pageText.selectedCategoryFallback);
  const categoryDetailTitle = categoryDepth === "first"
    ? pt("categoryDetailTitleFirst", pageText.categoryDetailTitleFirst).replace("{label}", fallbackSelectedCategory)
    : pt("categoryDetailTitleSecond", pageText.categoryDetailTitleSecond).replace("{label}", fallbackSelectedCategory);
  const categoryDetailEmptyLabel = categoryDepth === "first" ? pt("categoryDetailEmptyFirst", pageText.categoryDetailEmptyFirst) : pt("categoryDetailEmptySecond", pageText.categoryDetailEmptySecond);
  const periodTopModeTitle: Record<AdminStatsPeriodTopMode, string> = {
    completed: pt("periodTopCompletedTitle", pageText.periodTopCompletedTitle),
    reorder: pt("periodTopReorderTitle", pageText.reorderTopTitle),
    defect: pt("periodTopDefectTitle", pageText.periodTopDefectTitle),
  };
  const periodTopModeEmpty: Record<AdminStatsPeriodTopMode, string> = {
    completed: pt("periodTopCompletedEmpty", pageText.periodTopCompletedEmpty),
    reorder: pt("periodTopReorderEmpty", pageText.reorderEmpty),
    defect: pt("periodTopDefectEmpty", pageText.periodTopDefectEmpty),
  };
  const periodTopModeBasis: Record<AdminStatsPeriodTopMode, string> = {
    completed: pt("periodTopCompletedBasis", pageText.periodTopCompletedBasis),
    reorder: pt("periodTopReorderBasis", pageText.periodTopReorderBasis),
    defect: pt("periodTopDefectBasis", pageText.periodTopDefectBasis),
  };
  const periodTopValueSuffixByMode: Record<AdminStatsPeriodTopMode, string> = {
    completed: pt("quantityCountSuffix", "pcs"),
    reorder: pt("reorderRoundSuffix", pageText.reorderRoundSuffix),
    defect: pt("workorderCountSuffix", pageText.workorderCountSuffix),
  };
  const periodTopValueSuffix = periodTopValueSuffixByMode[selectedPeriodTopMode];
  const selectedPeriodTopProducts = useMemo(
    () => buildAdminStatsRatioBars(translatedStats.periodTopProducts[selectedPeriodTopMode] ?? []).slice(0, 5),
    [selectedPeriodTopMode, translatedStats.periodTopProducts],
  );
  const factoryPerformanceColumns = useMemo<AdminTableColumn<AdminStatsFactoryPerformanceItem>[]>(
    () => [
      {
        key: "factory",
        label: pt("factoryColumn", pageText.factoryColumn),
        className: "min-w-0",
        render: (item) => (
          <span className="block truncate text-xs font-semibold text-stone-700" title={buildFactoryMetricTooltip(item)}>
            {item.label} · {formatCount(item.productionCount, pt("workorderCountSuffix", pageText.workorderCountSuffix))}
          </span>
        ),
      },
      {
        key: "delayRate",
        label: pt("delayRateColumn", pageText.delayRateColumn),
        render: (item) => (
          <AdminStatusBadge tone={item.dueDelayRate && item.dueDelayRate > 0 ? "warning" : "success"} size="xs" className="cursor-help" title={buildFactoryMetricTooltip(item)}>
            {formatPercent(item.dueDelayRate, pt("pendingLabel", pageText.pendingLabel))}
          </AdminStatusBadge>
        ),
      },
      {
        key: "qualityRate",
        label: pt("qualityRateColumn", pageText.qualityRateColumn),
        render: (item) => (
          <AdminStatusBadge tone={item.qualityIssueRate && item.qualityIssueRate > 0 ? "warning" : "success"} size="xs" className="cursor-help" title={buildFactoryMetricTooltip(item)}>
            {formatPercent(item.qualityIssueRate, pt("pendingLabel", pageText.pendingLabel))}
          </AdminStatusBadge>
        ),
      },
    ],
    [pageText, t],
  );

  const statsSectionTabs: Array<{ key: AdminStatsSectionKey; label: string; description: string }> = [
    { key: "production", label: pt("statsSectionProductionLabel", "생산 구성"), description: pt("statsSectionProductionDescription", "생산품 유형과 상위 품목") },
    { key: "factory", label: pt("statsSectionFactoryLabel", "업체 성과"), description: pt("statsSectionFactoryDescription", "업체별 생산·납기·검수") },
    { key: "period", label: pt("statsSectionPeriodLabel", "기간 분석"), description: pt("statsSectionPeriodDescription", "기간별 리오더와 요약") },
  ];
  const activeStatsSectionIndex = statsSectionTabs.findIndex((item) => item.key === activeStatsSection);
  const changeStatsSection = (nextKey: AdminStatsSectionKey) => {
    if (nextKey === activeStatsSection) return;
    const nextIndex = statsSectionTabs.findIndex((item) => item.key === nextKey);
    setStatsSectionDirection(nextIndex >= activeStatsSectionIndex ? 1 : -1);
    setIsStatsSectionAnimating(true);
    setActiveStatsSection(nextKey);
  };

  useEffect(() => {
    setSelectedCategoryLabel((current) => {
      if (current && selectedCategoryDepthBars.some((item) => item.label === current)) return current;
      return selectedCategoryDepthBars[0]?.label ?? null;
    });
  }, [categoryDepth, selectedCategoryDepthBars]);

  useEffect(() => {
    if (!isStatsSectionAnimating) return;
    const animationFrame = window.requestAnimationFrame(() => {
      setIsStatsSectionAnimating(false);
    });
    return () => window.cancelAnimationFrame(animationFrame);
  }, [activeStatsSection, isStatsSectionAnimating]);

  const renderBarList = (title: string, points: Array<{ label: string; value: number; widthPercent: number; valueLabel?: string }>, emptyLabel: string) => (
    <AdminCard className="flex h-full min-h-[228px] flex-col p-3 sm:min-h-[246px] sm:p-3.5">
      <h2 className="text-base font-semibold text-stone-950">{title}</h2>
      <div className="mt-2 grid flex-1 content-start gap-2">
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
        )) : <AdminEmptyState title={emptyLabel} />}
      </div>
    </AdminCard>
  );

  const buildFactoryMetricTooltip = (item: {
    label: string;
    productionCount: number;
    dueDelayCount: number;
    dueDateTargetCount: number;
    qualityIssueCount: number;
    qualityTargetCount: number;
    dueDelayExamples?: string[];
    qualityIssueExamples?: string[];
  }) => {
    const dueExamples = item.dueDelayExamples?.slice(0, 3) ?? [];
    const qualityExamples = item.qualityIssueExamples?.slice(0, 3) ?? [];
    const countSuffix = pt("workorderCountSuffix", pageText.workorderCountSuffix);
    const lines = [
      pt("factoryTooltipProduction", pageText.factoryTooltipProduction).replace("{label}", item.label).replace("{count}", formatCount(item.productionCount, countSuffix)),
      pt("factoryTooltipDelay", pageText.factoryTooltipDelay).replace("{count}", formatCount(item.dueDelayCount, countSuffix)).replace("{target}", formatCount(item.dueDateTargetCount, countSuffix)),
      dueExamples.length > 0
        ? pt("factoryTooltipDelayExamples", pageText.factoryTooltipDelayExamples).replace("{items}", dueExamples.join(", "))
        : pt("factoryTooltipDelayNone", pageText.factoryTooltipDelayNone),
      pt("factoryTooltipQuality", pageText.factoryTooltipQuality).replace("{count}", formatCount(item.qualityIssueCount, countSuffix)).replace("{target}", formatCount(item.qualityTargetCount, countSuffix)),
      qualityExamples.length > 0
        ? pt("factoryTooltipQualityExamples", pageText.factoryTooltipQualityExamples).replace("{items}", qualityExamples.join(", "))
        : pt("factoryTooltipQualityNone", pageText.factoryTooltipQualityNone),
    ];
    return lines.join("\n");
  };

  return (
    <>
      {!hasVisibleStatsData ? (
        <AdminCard className="border-dashed border-amber-200 bg-amber-50/55 px-5 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">{pt("demoSeedEyebrow", pageText.demoSeedEyebrow)}</p>
              <h2 className="mt-2 text-lg font-semibold text-stone-950">{pt("demoSeedTitle", pageText.demoSeedTitle)}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{pt("demoSeedDescription", pageText.demoSeedDescription)}</p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-xs font-semibold leading-5 text-stone-600 shadow-sm">
              <p>1. db/schema/full_reset.sql</p>
              <p>2. db/seed/system_standards_seed.sql</p>
              <p>3. db/schema/full_reset_smoke_test.sql</p>
            </div>
          </div>
        </AdminCard>
      ) : null}

      <section>
        <div className="grid auto-rows-fr gap-2.5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-4">
          <CurrentSummaryCard label={pt("currentProducedLabel", pageText.currentProducedLabel)} value={formatCount(stats.currentOverview.totalProducedCount, pt("workorderCountSuffix", pageText.workorderCountSuffix))} description={pt("currentReorderDescription", pageText.currentReorderDescription).replace("{count}", formatCount(totalReorderCount, pt("workorderCountSuffix", pageText.workorderCountSuffix)))} />
          <CurrentSummaryCard label={pt("currentDelayRateLabel", pageText.currentDelayRateLabel)} value={formatPercent(stats.currentOverview.dueDelayRate, pt("pendingLabel", pageText.pendingLabel))} description={pt("currentRateBasis", pageText.currentRateBasis).replace("{count}", formatCount(stats.currentOverview.dueDelayCount, pt("workorderCountSuffix", pageText.workorderCountSuffix))).replace("{target}", formatCount(stats.currentOverview.dueDateTargetCount, pt("workorderCountSuffix", pageText.workorderCountSuffix)))} />
          <CurrentSummaryCard label={pt("currentQualityRateLabel", pageText.currentQualityRateLabel)} value={formatPercent(stats.currentOverview.qualityIssueRate, pt("pendingLabel", pageText.pendingLabel))} description={pt("currentRateBasis", pageText.currentRateBasis).replace("{count}", formatCount(stats.currentOverview.qualityIssueCount, pt("workorderCountSuffix", pageText.workorderCountSuffix))).replace("{target}", formatCount(stats.currentOverview.qualityTargetCount, pt("workorderCountSuffix", pageText.workorderCountSuffix)))} />
          <CurrentSummaryCard label={pt("currentStorageUsageLabel", pageText.currentStorageUsageLabel)} value={`${storageUsePercent}%`} description={formatStorageGb(stats.currentOverview.storageUsedBytes, stats.currentOverview.storageLimitBytes)} />
        </div>
      </section>

      <section className="overflow-hidden rounded-[20px] border border-stone-100 bg-white px-2 py-2 shadow-sm sm:rounded-[24px] sm:px-2.5 sm:py-2.5">
        <div className="flex flex-wrap items-center justify-start border-b border-stone-100 pb-1.5 sm:justify-end">
          <div className="flex w-full items-center gap-1.5 overflow-x-auto rounded-2xl bg-stone-50 p-1 sm:w-auto sm:flex-wrap sm:rounded-full">
            {statsSectionTabs.map((item) => {
              const isActive = item.key === activeStatsSection;
              return (
                <AdminButton
                  key={item.key}
                  type="button"
                  onClick={() => changeStatsSection(item.key)}
                  variant={isActive ? "primary" : "ghost"}
                  size="sm"
                  className="min-h-8 shrink-0 px-3 py-1.5 text-xs sm:px-3.5"
                  aria-pressed={isActive}
                  title={item.description}
                >
                  {item.label}
                </AdminButton>
              );
            })}
          </div>
        </div>

        <div className="mt-2 min-h-[284px] overflow-hidden">
          <div
            key={activeStatsSection}
            className={`transform-gpu transition-[opacity,transform] duration-200 ease-out motion-reduce:transform-none motion-reduce:transition-none ${isStatsSectionAnimating ? (statsSectionDirection >= 0 ? "translate-x-3 opacity-0" : "-translate-x-3 opacity-0") : "translate-x-0 opacity-100"}`}
          >
          {activeStatsSection === "production" ? (
            <div className="grid auto-rows-fr gap-2.5 xl:grid-cols-2">
              <AdminCard className="flex h-full min-h-[228px] flex-col p-3 sm:min-h-[246px] sm:p-3.5">
                <div className="flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">{pt("productionMixEyebrow", pageText.productionMixEyebrow)}</p>
                    <h2 className="mt-1 text-base font-semibold text-stone-950">{pt("productionMixTitle", pageText.productionMixTitle)}</h2>
                  </div>
                  <div className="flex w-full overflow-x-auto rounded-2xl bg-stone-100 p-1 sm:w-auto sm:rounded-full">
                    {(["first", "second"] as const).map((key) => (
                      <AdminButton
                        key={key}
                        type="button"
                        onClick={() => {
                          setCategoryDepth(key);
                          setSelectedCategoryLabel(null);
                        }}
                        variant={categoryDepth === key ? "secondary" : "ghost"}
                        size="sm"
                        className="min-h-7 shrink-0 px-3 py-1 text-xs"
                      >
                        {categoryDepthLabels[key]}
                      </AdminButton>
                    ))}
                  </div>
                </div>
                <div className="mt-1.5 min-w-0 flex-1">
                  <AdminBasicDonutChart points={selectedCategoryDepthBars} totalLabel={pt("workorderCountSuffix", pageText.workorderCountSuffix)} valueSuffix={pt("workorderCountSuffix", pageText.workorderCountSuffix)} emptyLabel={pt("productionMixEmpty", pageText.productionMixEmpty)} compact selectedLabel={normalizedSelectedCategoryLabel} onSelectPoint={setSelectedCategoryLabel} />
                </div>
                <p className="mt-1 text-[11px] font-semibold text-stone-500">{selectedCategoryDepthLabel} · {formatCount(selectedCategoryDepthTotal, pt("workorderCountSuffix", pageText.workorderCountSuffix))}</p>
                {normalizedSelectedCategoryLabel ? <p className="mt-0.5 text-[11px] font-semibold text-[var(--admin-theme-surface)]">{pt("selectedItemLabel", pageText.selectedItemLabel)}: {normalizedSelectedCategoryLabel}</p> : null}
              </AdminCard>

              {renderBarList(categoryDetailTitle, categoryDetailPoints, categoryDetailEmptyLabel)}
            </div>
          ) : null}

          {activeStatsSection === "factory" ? (
            <div className="grid auto-rows-fr gap-2.5 xl:grid-cols-2">
              {renderBarList(pt("factoryPerformanceTitle", pageText.factoryPerformanceTitle), viewModel.factoryProductionBars, pt("factoryPerformanceEmpty", pageText.factoryPerformanceEmpty))}
              <AdminCard className="flex h-full min-h-[228px] flex-col p-3 sm:min-h-[246px] sm:p-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">{pt("delayQualityEyebrow", pageText.delayQualityEyebrow)}</p>
                <h2 className="mt-1 text-base font-semibold text-stone-950">{pt("delayQualityTitle", pageText.delayQualityTitle)}</h2>
                <AdminTable
                  items={translatedStats.factoryPerformance.slice(0, 5)}
                  columns={factoryPerformanceColumns}
                  getRowKey={(item) => item.label}
                  emptyLabel={pt("factoryPerformanceEmpty", pageText.factoryPerformanceEmpty)}
                  className="mt-2 min-h-[190px] rounded-2xl border-stone-100"
                  gridTemplateColumns="minmax(180px,1.2fr) minmax(96px,0.8fr) minmax(96px,0.8fr)"
                  rowBaseClassName="grid w-full min-w-[420px] gap-3 px-3 py-2 text-left text-[11px] md:min-w-0 md:items-center"
                  headerClassName="hidden min-w-[420px] gap-3 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-500 md:grid md:min-w-0"
                />
              </AdminCard>
            </div>
          ) : null}

          {activeStatsSection === "period" ? (
            <div>
              <div className="flex flex-col items-stretch gap-2 rounded-[18px] border border-stone-100 bg-stone-50/70 px-2.5 py-2 sm:rounded-[20px] sm:px-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-stone-950">{pt("periodAnalysisTitle", pageText.periodAnalysisTitle)}</h3>
                </div>
                <div className="flex w-full flex-wrap items-center justify-start gap-2 lg:w-auto lg:justify-end">
                  <div className="w-full min-w-0 flex-1 sm:w-auto sm:min-w-[280px] sm:max-w-[440px] sm:flex-none">
                    <AdminDateRangePicker
                      startDate={customStartDate}
                      endDate={customEndDate}
                      maxDateValue={todayDateValue}
                      labels={dateRangeLabels}
                      locale={locale}
                      onStartDateChange={updateCustomStartDate}
                      onEndDateChange={updateCustomEndDate}
                    />
                  </div>
                  {activePeriodOptions.map((item) => (
                    <AdminLinkButton
                      key={item.key}
                      href={item.href}
                      aria-current={item.active ? "page" : undefined}
                      variant={item.active ? "primary" : "secondary"}
                      size="sm"
                      className="min-h-8 shrink-0 px-3 py-1.5 text-xs"
                    >
                      {translateStatsLabel(item.label, t)}
                    </AdminLinkButton>
                  ))}
                  <AdminLinkButton
                    href="/admin/dashboard?period=30d"
                    variant="secondary"
                    size="sm"
                    className="h-8 min-h-8 w-8 shrink-0 px-0 py-0 text-sm"
                    aria-label={pt("customReset", pageText.customReset)}
                    title={pt("customReset", pageText.customReset)}
                  >
                    ↻
                  </AdminLinkButton>
                  <AdminLinkButton
                    href={customPeriodHref}
                    aria-disabled={!isCustomPeriodValid}
                    variant={isCustomPeriodValid ? "primary" : "secondary"}
                    size="sm"
                    className={`min-h-8 shrink-0 px-3 py-1.5 text-xs ${isCustomPeriodValid ? "" : "pointer-events-none opacity-50"}`}
                  >
                    {pt("customApplyShort", pageText.customApply)}
                  </AdminLinkButton>
                </div>
              </div>
              {customPeriodMessage ? <p className="mt-3 text-xs font-semibold text-amber-700">{customPeriodMessage}</p> : null}
              <div className="mt-2 grid auto-rows-fr gap-2.5 xl:grid-cols-2">
                <PeriodTopCard
                  eyebrow={pt("periodTopEyebrow", pageText.reorderTopEyebrow)}
                  title={periodTopModeTitle[selectedPeriodTopMode]}
                  basis={periodTopModeBasis[selectedPeriodTopMode]}
                  items={selectedPeriodTopProducts}
                  emptyLabel={periodTopModeEmpty[selectedPeriodTopMode]}
                  valueSuffix={periodTopValueSuffix}
                />
                <PeriodSummaryCard
                  title={pt("periodSummaryTitle", pageText.periodSummaryTitle)}
                  items={periodSummaryItems}
                  selectedKey={selectedPeriodTopMode}
                  onSelect={setSelectedPeriodTopMode}
                />
              </div>
            </div>
          ) : null}
          </div>
        </div>
      </section>

    </>
  );
}
