"use client";

import { useEffect, useMemo, useState } from "react";

import { getTodayAdminLocalDateValue } from "@/components/admin/common/AdminDateRangePicker";
import AdminStatsOverviewSection from "@/components/admin/dashboard/AdminStatsOverviewSection";
import { AdminStatsPeriodControls } from "@/components/admin/dashboard/AdminStatsPeriodControls";
import { AdminStatsInlineToggle } from "@/components/admin/dashboard/AdminStatsInlineToggle";
import { AdminStatsWorkflowSection } from "@/components/admin/dashboard/AdminStatsWorkflowSection";
import {
  AdminStatsAnalysisCardShell,
  AdminStatsBarListCard,
  PeriodSummaryCard,
  PeriodTopCard,
} from "@/components/admin/dashboard/AdminStatsAnalysisCards";
import { FactoryPerformanceTable } from "@/components/admin/dashboard/AdminStatsFactoryPerformanceTable";
import {
  ADMIN_STATS_ACCENT_TEXT_CLASS,
  ADMIN_STATS_BODY_CLASS,
  ADMIN_STATS_WARNING_TEXT_CLASS,
} from "@/components/admin/common/adminSemanticClassNames";
import { AdminBasicDonutChart } from "@/components/admin/dashboard/AdminBasicStatsCharts";
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
  const [activePeriodPresetKey, setActivePeriodPresetKey] = useState<
    "7d" | "30d" | null
  >(null);
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
  const updateCustomStartDate = (value: string) => {
    setActivePeriodPresetKey(null);
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
    setActivePeriodPresetKey(null);
    if (!value) {
      setCustomEndDate("");
      return;
    }
    if (value > todayDateValue) return;
    if (customStartDate && value < customStartDate) return;
    setCustomEndDate(value);
  };

  const getRelativeAdminDateValue = (baseDateValue: string, daysBefore: number) => {
    const [year, month, day] = baseDateValue.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() - daysBefore);
    const nextYear = date.getFullYear();
    const nextMonth = String(date.getMonth() + 1).padStart(2, "0");
    const nextDay = String(date.getDate()).padStart(2, "0");
    return `${nextYear}-${nextMonth}-${nextDay}`;
  };

  const setPresetCustomPeriod = (key: AdminStatsSnapshot["periodOptions"][number]["key"]) => {
    if (key !== "7d" && key !== "30d") return;

    if (activePeriodPresetKey === key) {
      setActivePeriodPresetKey(null);
      setCustomStartDate("");
      setCustomEndDate("");
      return;
    }

    setActivePeriodPresetKey(key);
    setCustomEndDate(todayDateValue);
    setCustomStartDate(getRelativeAdminDateValue(todayDateValue, key === "7d" ? 7 : 30));
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
  const activePeriodOptions = stats.periodOptions
    .filter((item) => item.key === "7d" || item.key === "30d")
    .map((item) => ({
      ...item,
      active: item.key === activePeriodPresetKey,
    }));
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
  const getFactoryMetricTooltip = (item: AdminStatsSnapshot["factoryPerformance"][number]) =>
    buildAdminFactoryMetricTooltip(item, pageText, pt);
  const factoryPerformanceLabels = {
    factory: pt("factoryColumn", pageText.factoryColumn),
    delayRate: pt("delayRateColumn", pageText.delayRateColumn),
    qualityRate: pt("qualityRateColumn", pageText.qualityRateColumn),
  };

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



  return (
    <div className="grid gap-4">
      <AdminStatsOverviewSection
        eyebrow={statsOverviewEyebrow}
        title={statsOverviewTitle}
        description={statsOverviewDescription}
        cards={currentSummaryCards}
      />

      <AdminStatsWorkflowSection
        eyebrow={statsAnalysisEyebrow}
        title={pt("workflowAnalysisTitle", pageText.workflowAnalysisTitle)}
        description={statsAnalysisDescription}
        tabs={statsSectionTabs.map((item) => ({
          id: item.key,
          label: item.label,
          title: item.description,
        }))}
        activeTabId={activeStatsSection}
        onTabChange={(nextId) => changeStatsSection(nextId as AdminStatsSectionKey)}
        activeContentKey={activeStatsSection}
        isAnimating={isStatsSectionAnimating}
        direction={statsSectionDirection}
      >
        {activeStatsSection === "production" ? (
          <div className="grid auto-rows-fr gap-2.5 xl:grid-cols-2">
                  <AdminStatsAnalysisCardShell
                    eyebrow={pt(
                      "productionMixEyebrow",
                      pageText.productionMixEyebrow,
                    )}
                    title={pt(
                      "productionMixTitle",
                      pageText.productionMixTitle,
                    )}
                    minHeight="tall"
                    bodyClassName="mt-1.5 min-w-0 flex-1"
                    actions={
                      <AdminStatsInlineToggle
                        items={(["first", "second"] as const).map((key) => ({
                          key,
                          label: categoryDepthLabels[key],
                        }))}
                        value={categoryDepth}
                        onChange={(nextDepth) => {
                          setCategoryDepth(nextDepth);
                          setSelectedCategoryLabel(null);
                        }}
                        ariaLabel={pt(
                          "categoryDepthToggleAriaLabel",
                          pageText.productionMixTitle,
                        )}
                      />
                    }
                  >
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
                  </AdminStatsAnalysisCardShell>

                  <AdminStatsBarListCard
                    title={categoryDetailTitle}
                    points={categoryDetailPoints}
                    emptyLabel={categoryDetailEmptyLabel}
                  />
                </div>
              ) : null}

              {activeStatsSection === "factory" ? (
                <div className="grid auto-rows-fr gap-2.5 xl:grid-cols-2">
                  <AdminStatsBarListCard
                    title={pt(
                      "factoryPerformanceTitle",
                      pageText.factoryPerformanceTitle,
                    )}
                    points={viewModel.factoryProductionBars}
                    emptyLabel={pt(
                      "factoryPerformanceEmpty",
                      pageText.factoryPerformanceEmpty,
                    )}
                  />
                  <AdminStatsAnalysisCardShell
                    eyebrow={pt("delayQualityEyebrow", pageText.delayQualityEyebrow)}
                    title={pt("delayQualityTitle", pageText.delayQualityTitle)}
                    minHeight="tall"
                    bodyClassName="mt-3 flex-1"
                  >
                    <FactoryPerformanceTable
                      items={translatedStats.factoryPerformance.slice(0, 5)}
                      emptyLabel={pt(
                        "factoryPerformanceEmpty",
                        pageText.factoryPerformanceEmpty,
                      )}
                      columns={factoryPerformanceLabels}
                      countSuffix={pt(
                        "workorderCountSuffix",
                        pageText.workorderCountSuffix,
                      )}
                      zeroPercentLabel={zeroPercentLabel}
                      getTooltip={getFactoryMetricTooltip}
                    />
                  </AdminStatsAnalysisCardShell>
                </div>
              ) : null}

              {activeStatsSection === "period" ? (
                <div>
                  <AdminStatsPeriodControls
                    title={pt("periodAnalysisTitle", pageText.periodAnalysisTitle)}
                    startDate={customStartDate}
                    endDate={customEndDate}
                    maxDateValue={todayDateValue}
                    labels={dateRangeLabels}
                    locale={locale}
                    periodOptions={activePeriodOptions}
                    resetHref="/workspace/stats?period=30d"
                    applyHref={customPeriodHref}
                    resetLabel={pt("customReset", pageText.customReset)}
                    applyLabel={pt("customApplyShort", pageText.customApply)}
                    isApplyEnabled={isCustomPeriodValid}
                    buildPeriodSectionHref={buildPeriodSectionHref}
                    onPeriodOptionSelect={setPresetCustomPeriod}
                    onStartDateChange={updateCustomStartDate}
                    onEndDateChange={updateCustomEndDate}
                  />
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
      </AdminStatsWorkflowSection>
    </div>
  );
}
