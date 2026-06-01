"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

import { AdminButton } from "@/components/admin/common/AdminButton";
import AdminStatsOverviewSection from "@/components/admin/dashboard/AdminStatsOverviewSection";
import { AdminStatsFactorySection } from "@/components/admin/dashboard/AdminStatsFactorySection";
import { AdminStatsPeriodSection } from "@/components/admin/dashboard/AdminStatsPeriodSection";
import { useAdminStatsPeriodControls } from "@/components/admin/dashboard/useAdminStatsPeriodControls";
import { AdminStatsProductionSection } from "@/components/admin/dashboard/AdminStatsProductionSection";
import { AdminStatsWorkflowSection } from "@/components/admin/dashboard/AdminStatsWorkflowSection";
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
  translateAdminStatsLabel,
  translateAdminStatsText,
  type AdminStatsSectionKey,
} from "@/lib/admin/stats/dashboardPresentation";
import type { getI18n } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";
import { showWaflLoadingToast, showWaflToast } from "@/components/common/ToastMessage";

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
  const router = useRouter();
  const [isStatsRefreshing, startStatsRefreshTransition] = useTransition();
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
  const statsOverviewEyebrow = pt("statsOverviewEyebrow", "Current overview");
  const statsOverviewTitle = pt("statsOverviewTitle", "운영 누적 지표");
  const statsOverviewDescription = pt(
    "statsOverviewDescription",
    "현재 회사 기준의 누적 생산, 납기, 검수, 저장소 사용량을 먼저 확인합니다.",
  );
  const statsAnalysisEyebrow = pt("statsAnalysisEyebrow", "Analysis");
  const statsAnalysisDescription = pt(
    "statsAnalysisDescription",
    "생산 구성, 업체 성과, 기간별 흐름을 확인합니다.",
  );
  const {
    todayDateValue,
    customStartDate,
    customEndDate,
    dateRangeLabels,
    activePeriodOptions,
    buildPeriodSectionHref,
    updateCustomStartDate,
    updateCustomEndDate,
    setPresetCustomPeriod,
    isCustomPeriodValid,
    customPeriodHref,
    customPeriodMessage,
  } = useAdminStatsPeriodControls({
    stats,
    pageText,
    translate: pt,
    selectedPeriodTopMode,
  });
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
  const getFactoryMetricTooltip = (
    item: AdminStatsSnapshot["factoryPerformance"][number],
  ) => buildAdminFactoryMetricTooltip(item, pageText, pt);
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

  const refreshStatsData = () => {
    showWaflLoadingToast(pt("statsRefreshLoading", "통계 데이터를 불러오는 중입니다."));
    startStatsRefreshTransition(() => {
      router.refresh();
      window.setTimeout(() => {
        showWaflToast({
          message: pt("statsRefreshCompleted", "통계 데이터를 새로고침했습니다."),
          tone: "success",
        });
      }, 450);
    });
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
        onTabChange={(nextId) =>
          changeStatsSection(nextId as AdminStatsSectionKey)
        }
        actions={
          <AdminButton
            type="button"
            variant="icon"
            onClick={refreshStatsData}
            disabled={isStatsRefreshing}
            title={pt("statsRefreshLabel", "통계 데이터 새로고침")}
            aria-label={pt("statsRefreshLabel", "통계 데이터 새로고침")}
            className="h-8 min-h-8 w-8 px-0 py-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isStatsRefreshing ? "animate-spin" : ""}`} aria-hidden="true" />
            <span className="sr-only">
              {isStatsRefreshing
                ? pt("statsRefreshing", "새로고침 중")
                : pt("statsRefresh", "새로고침")}
            </span>
          </AdminButton>
        }
        activeContentKey={activeStatsSection}
        isAnimating={isStatsSectionAnimating}
        direction={statsSectionDirection}
      >
        {activeStatsSection === "production" ? (
          <AdminStatsProductionSection
            title={pt("productionMixTitle", pageText.productionMixTitle)}
            eyebrow={pt("productionMixEyebrow", pageText.productionMixEyebrow)}
            categoryDepth={categoryDepth}
            categoryDepthLabels={categoryDepthLabels}
            selectedCategoryDepthLabel={selectedCategoryDepthLabel}
            selectedCategoryDepthBars={selectedCategoryDepthBars}
            selectedCategoryDepthTotal={selectedCategoryDepthTotal}
            normalizedSelectedCategoryLabel={normalizedSelectedCategoryLabel}
            categoryDetailTitle={categoryDetailTitle}
            categoryDetailPoints={categoryDetailPoints}
            categoryDetailEmptyLabel={categoryDetailEmptyLabel}
            workorderSuffix={workorderSuffix}
            productionMixEmpty={pt(
              "productionMixEmpty",
              pageText.productionMixEmpty,
            )}
            selectedItemLabel={pt("selectedItemLabel", pageText.selectedItemLabel)}
            categoryDepthToggleAriaLabel={pt(
              "categoryDepthToggleAriaLabel",
              pageText.productionMixTitle,
            )}
            onCategoryDepthChange={setCategoryDepth}
            onSelectedCategoryChange={setSelectedCategoryLabel}
          />
        ) : null}

        {activeStatsSection === "factory" ? (
          <AdminStatsFactorySection
            factoryProductionBars={viewModel.factoryProductionBars}
            factoryPerformanceItems={translatedStats.factoryPerformance.slice(0, 5)}
            factoryPerformanceTitle={pt(
              "factoryPerformanceTitle",
              pageText.factoryPerformanceTitle,
            )}
            factoryPerformanceEmpty={pt(
              "factoryPerformanceEmpty",
              pageText.factoryPerformanceEmpty,
            )}
            delayQualityEyebrow={pt(
              "delayQualityEyebrow",
              pageText.delayQualityEyebrow,
            )}
            delayQualityTitle={pt("delayQualityTitle", pageText.delayQualityTitle)}
            columns={factoryPerformanceLabels}
            countSuffix={workorderSuffix}
            zeroPercentLabel={zeroPercentLabel}
            getTooltip={getFactoryMetricTooltip}
          />
        ) : null}

        {activeStatsSection === "period" ? (
          <AdminStatsPeriodSection
            title={pt("periodAnalysisTitle", pageText.periodAnalysisTitle)}
            startDate={customStartDate}
            endDate={customEndDate}
            maxDateValue={todayDateValue}
            labels={dateRangeLabels}
            locale={locale}
            periodOptions={activePeriodOptions}
            applyHref={customPeriodHref}
            resetLabel={pt("customReset", pageText.customReset)}
            applyLabel={pt("customApplyShort", pageText.customApply)}
            isApplyEnabled={isCustomPeriodValid}
            buildPeriodSectionHref={buildPeriodSectionHref}
            onPeriodOptionSelect={setPresetCustomPeriod}
            onStartDateChange={updateCustomStartDate}
            onEndDateChange={updateCustomEndDate}
            customPeriodMessage={customPeriodMessage}
            periodTopEyebrow={pt("periodTopEyebrow", pageText.reorderTopEyebrow)}
            periodTopTitle={periodTopModeTitle[selectedPeriodTopMode]}
            periodTopBasis={periodTopModeBasis[selectedPeriodTopMode]}
            periodTopItems={selectedPeriodTopProducts}
            periodTopEmptyLabel={periodTopModeEmpty[selectedPeriodTopMode]}
            periodTopValueSuffix={periodTopValueSuffix}
            periodSummaryTitle={pt(
              "periodSummaryTitle",
              pageText.periodSummaryTitle,
            )}
            periodSummaryItems={periodSummaryItems}
            selectedPeriodTopMode={selectedPeriodTopMode}
            onPeriodTopModeSelect={setSelectedPeriodTopMode}
          />
        ) : null}
      </AdminStatsWorkflowSection>
    </div>
  );
}
