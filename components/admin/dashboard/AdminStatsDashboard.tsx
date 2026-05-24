"use client";

import { useEffect, useMemo, useState } from "react";

import {
  AdminButton,
  AdminLinkButton,
} from "@/components/workspace/common/AdminButton";
import AdminSegmentedTabs from "@/components/admin/common/AdminSegmentedTabs";
import AdminSummaryMetricCards from "@/components/admin/common/AdminSummaryMetricCards";
import {
  AdminDateRangePicker,
  getTodayAdminLocalDateValue,
} from "@/components/workspace/common/AdminDateRangePicker";
import { AdminEmptyState } from "@/components/admin/common/AdminEmptyState";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import { AdminSection } from "@/components/admin/common/AdminSection";
import {
  ADMIN_STATS_ACCENT_BAR_CLASS,
  ADMIN_STATS_ACCENT_TEXT_CLASS,
  ADMIN_STATS_BODY_CLASS,
  ADMIN_STATS_IDLE_ITEM_CLASS,
  ADMIN_STATS_ITEM_MUTED_CLASS,
  ADMIN_STATS_MUTED_PANEL_CLASS,
  ADMIN_STATS_PANEL_CLASS,
  ADMIN_STATS_PANEL_TIGHT_CLASS,
  ADMIN_STATS_SELECTED_ITEM_CLASS,
  ADMIN_STATS_SUBTLE_TEXT_CLASS,
  ADMIN_STATS_TITLE_CLASS,
  ADMIN_STATS_TRACK_CLASS,
  ADMIN_STATS_TRACK_INSET_CLASS,
  ADMIN_STATS_WARNING_TEXT_CLASS,
} from "@/components/workspace/common/workspaceSemanticClassNames";
import AdminTable from "@/components/admin/common/AdminTable";
import { AdminCard } from "@/components/admin/layout/AdminCard";
import { AdminBasicDonutChart } from "@/components/admin/dashboard/AdminBasicStatsCharts";
import type { AdminTableColumn } from "@/lib/admin/common/types";
import type {
  AdminStatsPeriodTopMode,
  AdminStatsSnapshot,
} from "@/lib/admin/stats/types";
import { buildAdminStatsDashboardViewModel } from "@/lib/admin/stats/presentation";
import {
  buildAdminFactoryMetricTooltip,
  buildAdminStatsPeriodSummaryItems,
  buildAdminStatsPeriodTopBasisMap,
  buildAdminStatsPeriodTopEmptyMap,
  buildAdminStatsPeriodTopSuffixMap,
  buildAdminStatsPeriodTopTitleMap,
  buildAdminStatsRatioBars,
  buildAdminStatsSectionTabs,
  formatAdminStatsCount,
  formatAdminStatsPercent,
  formatAdminStatsStorageGb,
  formatAdminStatsStorageMb,
  translateAdminStatsLabel,
  translateAdminStatsText,
  type AdminStatsSectionKey,
} from "@/lib/admin/stats/dashboardPresentation";
import type { getI18n } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

type CategoryDepthKey = "first" | "second";
type AdminStatsDashboardProps = {
  stats: AdminStatsSnapshot;
  pageText: ReturnType<typeof getI18n>["admin"]["dashboardPage"];
  initialSection?: AdminStatsSectionKey;
  initialPeriodTopMode?: AdminStatsPeriodTopMode;
};
type AdminStatsFactoryPerformanceItem =
  AdminStatsSnapshot["factoryPerformance"][number];

function PeriodSummaryCard({
  title,
  items,
  selectedKey,
  onSelect,
}: {
  title: string;
  items: Array<{
    key: AdminStatsPeriodTopMode;
    label: string;
    value: string;
    description: string;
  }>;
  selectedKey: AdminStatsPeriodTopMode;
  onSelect: (key: AdminStatsPeriodTopMode) => void;
}) {
  return (
    <div
      className={`${ADMIN_STATS_MUTED_PANEL_CLASS} flex h-full min-h-[188px] flex-col p-2.5 sm:min-h-[204px] sm:p-3`}
    >
      <h3 className={`text-sm font-semibold ${ADMIN_STATS_TITLE_CLASS}`}>
        {title}
      </h3>
      <div className="mt-2 grid flex-1 content-start gap-1">
        {items.map((item) => {
          const isSelected = item.key === selectedKey;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect(item.key)}
              className={`min-h-[52px] rounded-2xl border px-2.5 py-2 text-left shadow-sm transition sm:px-3 ${isSelected ? ADMIN_STATS_SELECTED_ITEM_CLASS : ADMIN_STATS_IDLE_ITEM_CLASS}`}
              aria-pressed={isSelected}
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                <div className="min-w-0">
                  <p
                    className={`text-sm font-semibold ${ADMIN_STATS_TITLE_CLASS}`}
                  >
                    {item.label}
                  </p>
                  <p
                    className={`mt-0.5 line-clamp-1 text-[11px] font-semibold leading-4 ${ADMIN_STATS_SUBTLE_TEXT_CLASS}`}
                  >
                    {item.description}
                  </p>
                </div>
                <p
                  className={`shrink-0 text-base font-bold ${ADMIN_STATS_TITLE_CLASS} sm:text-lg`}
                >
                  {item.value}
                </p>
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
      <p
        className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${ADMIN_STATS_SUBTLE_TEXT_CLASS}`}
      >
        {eyebrow}
      </p>
      <h2 className={`mt-1 text-base font-semibold ${ADMIN_STATS_TITLE_CLASS}`}>
        {title}
      </h2>
      <div className="mt-3 grid flex-1 content-center gap-3">
        {items.length > 0 ? (
          items.map((item, index) => (
            <div
              key={`${item.label}-${index}`}
              className={`${ADMIN_STATS_ITEM_MUTED_CLASS} px-3 py-2`}
            >
              <div
                className={`flex items-start justify-between gap-2 text-sm font-semibold ${ADMIN_STATS_BODY_CLASS}`}
              >
                <span className="truncate pr-3">
                  {index + 1}. {item.label}
                </span>
                <span className={`shrink-0 ${ADMIN_STATS_TITLE_CLASS}`}>
                  {formatAdminStatsCount(item.value, valueSuffix)}
                </span>
              </div>
              <div
                className={`mt-1.5 h-1.5 rounded-full ${ADMIN_STATS_TRACK_INSET_CLASS}`}
              >
                <div
                  className={`h-1.5 rounded-full ${ADMIN_STATS_ACCENT_BAR_CLASS}`}
                  style={{ width: `${item.widthPercent}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <AdminEmptyState title={emptyLabel} />
        )}
      </div>
    </AdminCard>
  );
}

export default function AdminStatsDashboard({
  stats,
  pageText,
  initialSection = "production",
  initialPeriodTopMode = "reorder",
}: AdminStatsDashboardProps) {
  const t = useAdminTranslation();
  const { locale } = useI18n();
  const pt = (key: string, fallback = "") =>
    t(`dashboardPage.${key}`, fallback);
  const [categoryDepth, setCategoryDepth] = useState<CategoryDepthKey>("first");
  const [selectedCategoryLabel, setSelectedCategoryLabel] = useState<
    string | null
  >(null);
  const [selectedPeriodTopMode, setSelectedPeriodTopMode] =
    useState<AdminStatsPeriodTopMode>(initialPeriodTopMode);
  const [activeStatsSection, setActiveStatsSection] =
    useState<AdminStatsSectionKey>(initialSection);
  const [statsSectionDirection, setStatsSectionDirection] = useState(1);
  const [isStatsSectionAnimating, setIsStatsSectionAnimating] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(
    stats.selectedPeriodRange.isCustom
      ? stats.selectedPeriodRange.startDate
      : "",
  );
  const [customEndDate, setCustomEndDate] = useState(
    stats.selectedPeriodRange.isCustom ? stats.selectedPeriodRange.endDate : "",
  );
  const todayDateValue = getTodayAdminLocalDateValue();
  const dateRangeLabels = {
    start: pt("customStartDateLabel", pageText.customStartDateLabel),
    end: pt("customEndDateLabel", pageText.customEndDateLabel),
    clear: pt("customClear", pageText.customReset),
    done: pt("customDone", pageText.customDone),
    selected: pt("customDateRangeSelected", pageText.customDateRangeSelected),
    notSelected: pt("customDateRangeEmpty", pageText.customDateRangeEmpty),
    calendarAria: pt(
      "customDateRangeCalendarAria",
      pageText.customDateRangeCalendarAria,
    ),
  };
  const statsOverviewEyebrow = pt("statsOverviewEyebrow", "Current overview");
  const statsOverviewTitle = pt("statsOverviewTitle", "운영 누적 지표");
  const statsOverviewDescription = pt(
    "statsOverviewDescription",
    "현재 회사 기준의 누적 생산, 납기, 검수, 저장소 사용량을 먼저 확인합니다.",
  );
  const statsAnalysisEyebrow = pt("statsAnalysisEyebrow", "Analysis");
  const statsAnalysisDescription = pt(
    "statsAnalysisDescription",
    "생산 구성, 업체 성과, 기간별 흐름을 탭으로 전환해 확인합니다.",
  );
  const selectedPeriodBadgeLabel = pt("selectedPeriodBadgeLabel", "선택 기간");
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
    summaries: translateAdminStatsText(stats.summaries, t),
    workorderFlow: translateAdminStatsText(stats.workorderFlow, t),
    partnerDistribution: translateAdminStatsText(stats.partnerDistribution, t),
    fileUsagePoints: translateAdminStatsText(stats.fileUsagePoints, t),
    keyMetrics: translateAdminStatsText(stats.keyMetrics, t),
    productionRoundDistribution: translateAdminStatsText(
      stats.productionRoundDistribution,
      t,
    ),
    factoryProductionDistribution: translateAdminStatsText(
      stats.factoryProductionDistribution,
      t,
    ),
    productionCategoryDistribution: translateAdminStatsText(
      stats.productionCategoryDistribution,
      t,
    ),
    productionCategoryByRound: {
      first: translateAdminStatsText(stats.productionCategoryByRound.first, t),
      second: translateAdminStatsText(
        stats.productionCategoryByRound.second,
        t,
      ),
      third: translateAdminStatsText(stats.productionCategoryByRound.third, t),
    },
    productionCategoryDrilldown: {
      firstToSecond: Object.fromEntries(
        Object.entries(stats.productionCategoryDrilldown.firstToSecond).map(
          ([label, items]) => [
            translateAdminStatsLabel(label, t),
            translateAdminStatsText(items, t),
          ],
        ),
      ),
      secondToThird: Object.fromEntries(
        Object.entries(stats.productionCategoryDrilldown.secondToThird).map(
          ([label, items]) => [
            translateAdminStatsLabel(label, t),
            translateAdminStatsText(items, t),
          ],
        ),
      ),
    },
    reorderTopProducts: translateAdminStatsText(stats.reorderTopProducts, t),
    periodTopProducts: {
      completed: translateAdminStatsText(stats.periodTopProducts.completed, t),
      reorder: translateAdminStatsText(stats.periodTopProducts.reorder, t),
      defect: translateAdminStatsText(stats.periodTopProducts.defect, t),
    },
    factoryPerformance: stats.factoryPerformance,
    attachmentTrashCards: translateAdminStatsText(
      stats.attachmentTrashCards,
      t,
    ),
  };

  const viewModel = buildAdminStatsDashboardViewModel({
    sourceState: stats.sourceState,
    text: pageText,
    workorderFlow: translatedStats.workorderFlow,
    partnerDistribution: translatedStats.partnerDistribution,
    fileUsagePoints: translatedStats.fileUsagePoints,
    keyMetrics: translatedStats.keyMetrics,
    productionRoundDistribution: translatedStats.productionRoundDistribution,
    factoryProductionDistribution:
      translatedStats.factoryProductionDistribution,
    productionCategoryDistribution:
      translatedStats.productionCategoryDistribution,
    attachmentTrashCards: translatedStats.attachmentTrashCards,
  });

  const totalReorderCount = stats.currentOverview.reorderCount;
  const activePeriodOptions = stats.periodOptions.filter(
    (item) => item.key === "7d" || item.key === "30d",
  );
  const activePeriodLabel = translateAdminStatsLabel(
    stats.selectedPeriodRange.label,
    t,
  );
  const buildPeriodSectionHref = (href: string) => {
    const separator = href.includes("?") ? "&" : "?";
    return `${href}${separator}section=period&topMode=${selectedPeriodTopMode}`;
  };
  const isCustomPeriodReady = Boolean(customStartDate && customEndDate);
  const isCustomPeriodOrderValid =
    !isCustomPeriodReady || customStartDate <= customEndDate;
  const isCustomPeriodNotFuture =
    (!customStartDate || customStartDate <= todayDateValue) &&
    (!customEndDate || customEndDate <= todayDateValue);
  const isCustomEndSelectable =
    !customEndDate || !customStartDate || customEndDate >= customStartDate;
  const isCustomPeriodValid =
    isCustomPeriodReady &&
    isCustomPeriodOrderValid &&
    isCustomPeriodNotFuture &&
    isCustomEndSelectable;
  const customPeriodHref = buildPeriodSectionHref(
    isCustomPeriodValid
      ? `/workspace/stats?period=custom&startDate=${customStartDate}&endDate=${customEndDate}`
      : "/workspace/stats?period=30d",
  );
  const customPeriodMessage = !isCustomPeriodOrderValid
    ? pt("customPeriodInvalidOrder", pageText.customPeriodInvalidOrder)
    : !isCustomPeriodNotFuture
      ? pt("customPeriodFutureBlocked", pageText.customPeriodFutureBlocked)
      : customEndDate && !isCustomEndSelectable
        ? pt("customPeriodInvalidOrder", pageText.customPeriodInvalidOrder)
        : "";
  const storageUsePercent =
    stats.currentOverview.storageLimitBytes > 0
      ? Math.round(
          (stats.currentOverview.storageUsedBytes /
            stats.currentOverview.storageLimitBytes) *
            1000,
        ) / 10
      : 0;
  const zeroPercentLabel = "0%";
  const workorderSuffix = pt(
    "workorderCountSuffix",
    pageText.workorderCountSuffix,
  );
  const formatCurrentRateBasis = (count: number, target: number) => {
    const normalizedTarget = Math.max(0, Math.round(target));
    if (normalizedTarget <= 0) {
      return `${formatAdminStatsCount(0, workorderSuffix)} ${pt("currentRateBasisTargetSuffix", "기준")}`;
    }

    return pt("currentRateBasis", pageText.currentRateBasis)
      .replace("{count}", formatAdminStatsCount(count, workorderSuffix))
      .replace(
        "{target}",
        formatAdminStatsCount(normalizedTarget, workorderSuffix),
      );
  };
  const currentSummaryCards = [
    {
      id: "produced",
      label: pt("currentProducedLabel", pageText.currentProducedLabel),
      value: formatAdminStatsCount(
        stats.currentOverview.totalProducedCount,
        pt("workorderCountSuffix", pageText.workorderCountSuffix),
      ),
      helper: pt(
        "currentReorderDescription",
        pageText.currentReorderDescription,
      ).replace(
        "{count}",
        formatAdminStatsCount(
          totalReorderCount,
          pt("workorderCountSuffix", pageText.workorderCountSuffix),
        ),
      ),
    },
    {
      id: "delay",
      label: pt("currentDelayRateLabel", pageText.currentDelayRateLabel),
      value: formatAdminStatsPercent(
        stats.currentOverview.dueDelayRate,
        zeroPercentLabel,
      ),
      helper: formatCurrentRateBasis(
        stats.currentOverview.dueDelayCount,
        stats.currentOverview.dueDateTargetCount,
      ),
    },
    {
      id: "quality",
      label: pt("currentQualityRateLabel", pageText.currentQualityRateLabel),
      value: formatAdminStatsPercent(
        stats.currentOverview.qualityIssueRate,
        zeroPercentLabel,
      ),
      helper: formatCurrentRateBasis(
        stats.currentOverview.qualityIssueCount,
        stats.currentOverview.qualityTargetCount,
      ),
    },
    {
      id: "storage",
      label: pt("currentStorageUsageLabel", pageText.currentStorageUsageLabel),
      value: `${storageUsePercent}%`,
      helper: formatAdminStatsStorageGb(
        stats.currentOverview.storageUsedBytes,
        stats.currentOverview.storageLimitBytes,
      ),
    },
  ];
  const periodSummaryItems = buildAdminStatsPeriodSummaryItems({
    pageText,
    translate: pt,
    completedCount: stats.periodSummary.completedCount,
    reorderCount: stats.periodSummary.reorderCount,
    qualityIssueCount: stats.periodSummary.qualityIssueCount,
  });
  const categoryDepthLabels: Record<CategoryDepthKey, string> = {
    first: pt("categoryDepthFirst", pageText.categoryDepthFirst),
    second: pt("categoryDepthSecond", pageText.categoryDepthSecond),
  };

  const selectedCategoryDepthLabel = categoryDepthLabels[categoryDepth];
  const selectedCategoryDepthBars = useMemo(
    () =>
      buildAdminStatsRatioBars(
        translatedStats.productionCategoryByRound[categoryDepth],
      ).slice(0, 5),
    [categoryDepth, translatedStats.productionCategoryByRound],
  );
  const selectedCategoryDepthTotal = selectedCategoryDepthBars.reduce(
    (sum, item) => sum + item.value,
    0,
  );
  const normalizedSelectedCategoryLabel = selectedCategoryDepthBars.some(
    (item) => item.label === selectedCategoryLabel,
  )
    ? selectedCategoryLabel
    : (selectedCategoryDepthBars[0]?.label ?? null);
  const drilldownKey =
    categoryDepth === "first" ? "firstToSecond" : "secondToThird";
  const categoryDetailPoints = useMemo(
    () =>
      normalizedSelectedCategoryLabel
        ? buildAdminStatsRatioBars(
            translatedStats.productionCategoryDrilldown[drilldownKey][
              normalizedSelectedCategoryLabel
            ] ?? [],
          ).slice(0, 5)
        : [],
    [
      drilldownKey,
      normalizedSelectedCategoryLabel,
      translatedStats.productionCategoryDrilldown,
    ],
  );
  const fallbackSelectedCategory =
    normalizedSelectedCategoryLabel ??
    pt("selectedCategoryFallback", pageText.selectedCategoryFallback);
  const categoryDetailTitle =
    categoryDepth === "first"
      ? pt(
          "categoryDetailTitleFirst",
          pageText.categoryDetailTitleFirst,
        ).replace("{label}", fallbackSelectedCategory)
      : pt(
          "categoryDetailTitleSecond",
          pageText.categoryDetailTitleSecond,
        ).replace("{label}", fallbackSelectedCategory);
  const categoryDetailEmptyLabel =
    categoryDepth === "first"
      ? pt("categoryDetailEmptyFirst", pageText.categoryDetailEmptyFirst)
      : pt("categoryDetailEmptySecond", pageText.categoryDetailEmptySecond);
  const periodTopModeTitle = buildAdminStatsPeriodTopTitleMap(pageText, pt);
  const periodTopModeEmpty = buildAdminStatsPeriodTopEmptyMap(pageText, pt);
  const periodTopModeBasis = buildAdminStatsPeriodTopBasisMap(pageText, pt);
  const periodTopValueSuffixByMode = buildAdminStatsPeriodTopSuffixMap(
    pageText,
    pt,
  );
  const periodTopValueSuffix =
    periodTopValueSuffixByMode[selectedPeriodTopMode];
  const selectedPeriodTopProducts = useMemo(
    () =>
      buildAdminStatsRatioBars(
        translatedStats.periodTopProducts[selectedPeriodTopMode] ?? [],
      ).slice(0, 5),
    [selectedPeriodTopMode, translatedStats.periodTopProducts],
  );
  const getFactoryMetricTooltip = (item: AdminStatsFactoryPerformanceItem) =>
    buildAdminFactoryMetricTooltip(item, pageText, pt);
  const factoryPerformanceColumns = useMemo<
    AdminTableColumn<AdminStatsFactoryPerformanceItem>[]
  >(
    () => [
      {
        key: "factory",
        label: pt("factoryColumn", pageText.factoryColumn),
        className: "min-w-0",
        render: (item) => (
          <span
            className={`block truncate text-xs font-semibold ${ADMIN_STATS_BODY_CLASS}`}
            title={getFactoryMetricTooltip(item)}
          >
            {item.label} ·{" "}
            {formatAdminStatsCount(
              item.productionCount,
              pt("workorderCountSuffix", pageText.workorderCountSuffix),
            )}
          </span>
        ),
      },
      {
        key: "delayRate",
        label: pt("delayRateColumn", pageText.delayRateColumn),
        render: (item) => (
          <AdminStatusBadge
            tone={
              item.dueDelayRate && item.dueDelayRate > 0 ? "warning" : "success"
            }
            size="xs"
            className="cursor-help"
            title={getFactoryMetricTooltip(item)}
          >
            {formatAdminStatsPercent(item.dueDelayRate, zeroPercentLabel)}
          </AdminStatusBadge>
        ),
      },
      {
        key: "qualityRate",
        label: pt("qualityRateColumn", pageText.qualityRateColumn),
        render: (item) => (
          <AdminStatusBadge
            tone={
              item.qualityIssueRate && item.qualityIssueRate > 0
                ? "warning"
                : "success"
            }
            size="xs"
            className="cursor-help"
            title={getFactoryMetricTooltip(item)}
          >
            {formatAdminStatsPercent(item.qualityIssueRate, zeroPercentLabel)}
          </AdminStatusBadge>
        ),
      },
    ],
    [pageText, t],
  );

  const statsSectionTabs = buildAdminStatsSectionTabs(pageText, pt);
  const activeStatsSectionIndex = statsSectionTabs.findIndex(
    (item) => item.key === activeStatsSection,
  );
  const changeStatsSection = (nextKey: AdminStatsSectionKey) => {
    if (nextKey === activeStatsSection) return;
    const nextIndex = statsSectionTabs.findIndex(
      (item) => item.key === nextKey,
    );
    setStatsSectionDirection(nextIndex >= activeStatsSectionIndex ? 1 : -1);
    setIsStatsSectionAnimating(true);
    setActiveStatsSection(nextKey);
  };

  useEffect(() => {
    setSelectedCategoryLabel((current) => {
      if (
        current &&
        selectedCategoryDepthBars.some((item) => item.label === current)
      )
        return current;
      return selectedCategoryDepthBars[0]?.label ?? null;
    });
  }, [categoryDepth, selectedCategoryDepthBars]);

  useEffect(() => {
    setActiveStatsSection(initialSection);
  }, [initialSection]);

  useEffect(() => {
    setSelectedPeriodTopMode(initialPeriodTopMode);
  }, [initialPeriodTopMode]);

  useEffect(() => {
    if (!isStatsSectionAnimating) return;
    const animationFrame = window.requestAnimationFrame(() => {
      setIsStatsSectionAnimating(false);
    });
    return () => window.cancelAnimationFrame(animationFrame);
  }, [activeStatsSection, isStatsSectionAnimating]);

  const renderBarList = (
    title: string,
    points: Array<{
      label: string;
      value: number;
      widthPercent: number;
      valueLabel?: string;
    }>,
    emptyLabel: string,
  ) => (
    <AdminCard className="flex h-full min-h-[252px] flex-col p-3.5 sm:min-h-[286px] sm:p-4">
      <h2 className={`text-base font-semibold ${ADMIN_STATS_TITLE_CLASS}`}>
        {title}
      </h2>
      <div className="mt-3 grid flex-1 content-center gap-3">
        {points.length > 0 ? (
          points.map((item) => (
            <div key={item.label}>
              <div
                className={`flex items-center justify-between text-xs font-semibold ${ADMIN_STATS_BODY_CLASS}`}
              >
                <span className="truncate pr-2">
                  {translateAdminStatsLabel(item.label, t)}
                </span>
                <span>{item.value}</span>
              </div>
              <div
                className={`mt-2.5 h-2.5 rounded-full ${ADMIN_STATS_TRACK_CLASS}`}
              >
                <div
                  className={`h-2.5 rounded-full ${ADMIN_STATS_ACCENT_BAR_CLASS}`}
                  style={{ width: `${item.widthPercent}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <AdminEmptyState title={emptyLabel} />
        )}
      </div>
    </AdminCard>
  );

  return (
    <div className="grid gap-4">
      <AdminSection
        eyebrow={statsOverviewEyebrow}
        title={statsOverviewTitle}
        description={statsOverviewDescription}
        className="overflow-hidden border-[var(--pbp-border-strong)] bg-[linear-gradient(135deg,var(--pbp-surface-soft),var(--pbp-surface))] p-5 shadow-[var(--pbp-shadow-elevated)]"
        headerClassName="items-end"
        actions={
          <AdminStatusBadge tone="brand">
            {selectedPeriodBadgeLabel}: {activePeriodLabel}
          </AdminStatusBadge>
        }
        bodyClassName="mt-5"
      >
        <AdminSummaryMetricCards cards={currentSummaryCards} gridClassName="grid gap-3 md:grid-cols-2 xl:grid-cols-4" />
      </AdminSection>

      <AdminSection
        eyebrow={statsAnalysisEyebrow}
        title={pt("workflowAnalysisTitle", pageText.workflowAnalysisTitle)}
        description={statsAnalysisDescription}
        actions={
          <AdminStatusBadge tone="neutral">
            {selectedPeriodBadgeLabel}: {activePeriodLabel}
          </AdminStatusBadge>
        }
        bodyClassName="mt-4"
      >
        <div
          className={`${ADMIN_STATS_PANEL_CLASS} overflow-hidden px-2 py-2 sm:px-2.5 sm:py-2.5`}
        >
          <div className="flex flex-wrap items-center justify-start border-b border-[var(--pbp-border)] pb-1.5 sm:justify-end">
            <AdminSegmentedTabs
              items={statsSectionTabs.map((item) => ({
                id: item.key,
                label: item.label,
                title: item.description,
              }))}
              activeId={activeStatsSection}
              onChange={changeStatsSection}
            />
          </div>

          <div className="mt-2 min-h-[284px] overflow-hidden">
            <div
              key={activeStatsSection}
              className={`transform-gpu transition-[opacity,transform] duration-200 ease-out motion-reduce:transform-none motion-reduce:transition-none ${isStatsSectionAnimating ? (statsSectionDirection >= 0 ? "translate-x-3 opacity-0" : "-translate-x-3 opacity-0") : "translate-x-0 opacity-100"}`}
            >
              {activeStatsSection === "production" ? (
                <div className="grid auto-rows-fr gap-2.5 xl:grid-cols-2">
                  <AdminCard className="flex h-full min-h-[252px] flex-col p-3.5 sm:min-h-[286px] sm:p-4">
                    <div className="flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
                      <div>
                        <p
                          className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${ADMIN_STATS_SUBTLE_TEXT_CLASS}`}
                        >
                          {pt(
                            "productionMixEyebrow",
                            pageText.productionMixEyebrow,
                          )}
                        </p>
                        <h2
                          className={`mt-1 text-base font-semibold ${ADMIN_STATS_TITLE_CLASS}`}
                        >
                          {pt(
                            "productionMixTitle",
                            pageText.productionMixTitle,
                          )}
                        </h2>
                      </div>
                      <div className="flex w-full overflow-x-auto rounded-full border border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] p-1 sm:w-auto">
                        {(["first", "second"] as const).map((key) => (
                          <AdminButton
                            key={key}
                            type="button"
                            onClick={() => {
                              setCategoryDepth(key);
                              setSelectedCategoryLabel(null);
                            }}
                            variant={
                              categoryDepth === key ? "secondary" : "ghost"
                            }
                            size="sm"
                            className="min-h-7 shrink-0 px-3 py-1 text-xs"
                          >
                            {categoryDepthLabels[key]}
                          </AdminButton>
                        ))}
                      </div>
                    </div>
                    <div className="mt-1.5 min-w-0 flex-1">
                      <AdminBasicDonutChart
                        points={selectedCategoryDepthBars}
                        totalLabel={pt(
                          "workorderCountSuffix",
                          pageText.workorderCountSuffix,
                        )}
                        valueSuffix={pt(
                          "workorderCountSuffix",
                          pageText.workorderCountSuffix,
                        )}
                        emptyLabel={pt(
                          "productionMixEmpty",
                          pageText.productionMixEmpty,
                        )}
                        compact
                        selectedLabel={normalizedSelectedCategoryLabel}
                        onSelectPoint={setSelectedCategoryLabel}
                      />
                    </div>
                    <p
                      className={`mt-1 text-[11px] font-semibold ${ADMIN_STATS_BODY_CLASS}`}
                    >
                      {selectedCategoryDepthLabel} ·{" "}
                      {formatAdminStatsCount(
                        selectedCategoryDepthTotal,
                        pt(
                          "workorderCountSuffix",
                          pageText.workorderCountSuffix,
                        ),
                      )}
                    </p>
                    {normalizedSelectedCategoryLabel ? (
                      <p
                        className={`mt-0.5 text-[11px] font-semibold ${ADMIN_STATS_ACCENT_TEXT_CLASS}`}
                      >
                        {pt("selectedItemLabel", pageText.selectedItemLabel)}:{" "}
                        {normalizedSelectedCategoryLabel}
                      </p>
                    ) : null}
                  </AdminCard>

                  {renderBarList(
                    categoryDetailTitle,
                    categoryDetailPoints,
                    categoryDetailEmptyLabel,
                  )}
                </div>
              ) : null}

              {activeStatsSection === "factory" ? (
                <div className="grid auto-rows-fr gap-2.5 xl:grid-cols-2">
                  {renderBarList(
                    pt(
                      "factoryPerformanceTitle",
                      pageText.factoryPerformanceTitle,
                    ),
                    viewModel.factoryProductionBars,
                    pt(
                      "factoryPerformanceEmpty",
                      pageText.factoryPerformanceEmpty,
                    ),
                  )}
                  <AdminCard className="flex h-full min-h-[252px] flex-col p-3.5 sm:min-h-[286px] sm:p-4">
                    <p
                      className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${ADMIN_STATS_SUBTLE_TEXT_CLASS}`}
                    >
                      {pt("delayQualityEyebrow", pageText.delayQualityEyebrow)}
                    </p>
                    <h2
                      className={`mt-1 text-base font-semibold ${ADMIN_STATS_TITLE_CLASS}`}
                    >
                      {pt("delayQualityTitle", pageText.delayQualityTitle)}
                    </h2>
                    <AdminTable
                      items={translatedStats.factoryPerformance.slice(0, 5)}
                      columns={factoryPerformanceColumns}
                      getRowKey={(item) => item.label}
                      emptyLabel={pt(
                        "factoryPerformanceEmpty",
                        pageText.factoryPerformanceEmpty,
                      )}
                      className="mt-3 min-h-[218px] rounded-2xl border-[var(--pbp-border)]"
                      gridTemplateColumns="minmax(180px,1.2fr) minmax(96px,0.8fr) minmax(96px,0.8fr)"
                      rowBaseClassName="grid w-full min-w-[420px] gap-3 px-3 py-2 text-left text-[11px] md:min-w-0 md:items-center"
                      headerClassName="hidden min-w-[420px] gap-3 bg-[var(--pbp-surface-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--pbp-text-muted)] md:grid md:min-w-0"
                    />
                  </AdminCard>
                </div>
              ) : null}

              {activeStatsSection === "period" ? (
                <div>
                  <div
                    className={`${ADMIN_STATS_PANEL_TIGHT_CLASS} flex flex-col items-stretch gap-2 px-2.5 py-2 sm:px-3 lg:flex-row lg:items-center lg:justify-between`}
                  >
                    <div>
                      <h3
                        className={`text-sm font-semibold ${ADMIN_STATS_TITLE_CLASS}`}
                      >
                        {pt(
                          "periodAnalysisTitle",
                          pageText.periodAnalysisTitle,
                        )}
                      </h3>
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
                          href={buildPeriodSectionHref(item.href)}
                          aria-current={item.active ? "page" : undefined}
                          variant={item.active ? "primary" : "secondary"}
                          size="sm"
                          className="min-h-8 shrink-0 px-3 py-1.5 text-xs"
                        >
                          {translateAdminStatsLabel(item.label, t)}
                        </AdminLinkButton>
                      ))}
                      <AdminLinkButton
                        href={buildPeriodSectionHref("/workspace/stats?period=30d")}
                        variant="secondary"
                        size="sm"
                        className="min-h-8 shrink-0 px-3 py-1.5 text-xs"
                      >
                        {pt("customReset", pageText.customReset)}
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
                  {customPeriodMessage ? (
                    <p
                      className={`mt-3 text-xs font-semibold ${ADMIN_STATS_WARNING_TEXT_CLASS}`}
                    >
                      {customPeriodMessage}
                    </p>
                  ) : null}
                  <div className="mt-3 grid auto-rows-fr gap-3 xl:grid-cols-2">
                    <PeriodTopCard
                      eyebrow={pt(
                        "periodTopEyebrow",
                        pageText.reorderTopEyebrow,
                      )}
                      title={periodTopModeTitle[selectedPeriodTopMode]}
                      basis={periodTopModeBasis[selectedPeriodTopMode]}
                      items={selectedPeriodTopProducts}
                      emptyLabel={periodTopModeEmpty[selectedPeriodTopMode]}
                      valueSuffix={periodTopValueSuffix}
                    />
                    <PeriodSummaryCard
                      title={pt(
                        "periodSummaryTitle",
                        pageText.periodSummaryTitle,
                      )}
                      items={periodSummaryItems}
                      selectedKey={selectedPeriodTopMode}
                      onSelect={setSelectedPeriodTopMode}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </AdminSection>
    </div>
  );
}
