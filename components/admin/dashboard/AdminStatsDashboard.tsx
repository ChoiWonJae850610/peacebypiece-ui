"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { DayPicker, type DateRange } from "react-day-picker";
import { enUS, ko } from "date-fns/locale";

import { AdminCard } from "@/components/admin/layout/AdminCard";
import { AdminBasicBarChart, AdminBasicDonutChart } from "@/components/admin/dashboard/AdminBasicStatsCharts";
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

type AdminStatsDateRangePickerLabels = {
  start: string;
  end: string;
  clear: string;
  done: string;
  selected: string;
  notSelected: string;
  calendarAria: string;
};

function parseLocalDateValue(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function toLocalDateValue(date: Date | undefined) {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTodayLocalDateValue() {
  return toLocalDateValue(new Date());
}

function formatDateDisplay(value: string, locale: "ko" | "en") {
  const date = parseLocalDateValue(value);
  if (!date) return "—";
  return date.toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function AdminStatsDateRangePicker({
  startDate,
  endDate,
  maxDateValue,
  labels,
  locale,
  onStartDateChange,
  onEndDateChange,
}: {
  startDate: string;
  endDate: string;
  maxDateValue: string;
  labels: AdminStatsDateRangePickerLabels;
  locale: "ko" | "en";
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
}) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const selectedStartDate = parseLocalDateValue(startDate);
  const selectedEndDate = parseLocalDateValue(endDate);
  const selected: DateRange | undefined = selectedStartDate
    ? { from: selectedStartDate, to: selectedEndDate }
    : undefined;
  const maxDate = parseLocalDateValue(maxDateValue);
  const dayPickerLocale = locale === "ko" ? ko : enUS;

  useEffect(() => {
    if (!isCalendarOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!pickerRef.current) return;
      if (event.target instanceof Node && pickerRef.current.contains(event.target)) return;
      setIsCalendarOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsCalendarOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCalendarOpen]);

  const handleSelect = (range: DateRange | undefined) => {
    const nextStart = toLocalDateValue(range?.from);
    const nextEnd = toLocalDateValue(range?.to);
    onStartDateChange(nextStart);
    onEndDateChange(nextEnd);
  };

  const clearSelection = () => {
    onStartDateChange("");
    onEndDateChange("");
  };

  const selectedSummary = startDate && endDate
    ? labels.selected.replace("{start}", formatDateDisplay(startDate, locale)).replace("{end}", formatDateDisplay(endDate, locale))
    : labels.notSelected;

  return (
    <div ref={pickerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsCalendarOpen((current) => !current)}
        className="flex w-full min-w-[280px] flex-col gap-1.5 rounded-2xl border border-stone-100 bg-white p-1.5 text-left shadow-sm transition hover:border-stone-200 hover:bg-stone-50 sm:flex-row"
        aria-expanded={isCalendarOpen}
        aria-label={labels.calendarAria}
      >
        <span className="min-w-0 flex-1 rounded-xl bg-stone-50 px-3 py-1.5">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-400">{labels.start}</span>
          <span className="mt-0.5 block text-xs font-semibold text-stone-800">{formatDateDisplay(startDate, locale)}</span>
        </span>
        <span className="min-w-0 flex-1 rounded-xl bg-stone-50 px-3 py-1.5">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-400">{labels.end}</span>
          <span className="mt-0.5 block text-xs font-semibold text-stone-800">{formatDateDisplay(endDate, locale)}</span>
        </span>
      </button>

      {isCalendarOpen ? (
        <div className="absolute left-0 top-[calc(100%+8px)] z-30 w-[min(320px,calc(100vw-3rem))] rounded-[22px] border border-stone-100 bg-white p-3 shadow-2xl">
          <DayPicker
            mode="range"
            selected={selected}
            onSelect={handleSelect}
            locale={dayPickerLocale}
            disabled={maxDate ? { after: maxDate } : undefined}
            showOutsideDays
            fixedWeeks
            aria-label={labels.calendarAria}
            classNames={{
              root: "text-sm text-stone-700",
              months: "grid gap-3",
              month: "space-y-2",
              month_caption: "flex items-center justify-center px-2 py-1 text-sm font-semibold text-stone-950",
              caption_label: "text-sm font-semibold",
              nav: "flex items-center justify-between",
              button_previous: "rounded-full border border-stone-200 px-2 py-1 text-stone-500 hover:bg-stone-50",
              button_next: "rounded-full border border-stone-200 px-2 py-1 text-stone-500 hover:bg-stone-50",
              weekdays: "grid grid-cols-7 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-400",
              week: "grid grid-cols-7 gap-1",
              day: "flex items-center justify-center",
              day_button: "h-7 w-7 rounded-full text-[11px] font-semibold transition hover:bg-stone-100 disabled:text-stone-300",
              today: "font-bold text-[var(--admin-theme-surface)]",
              selected: "rounded-full bg-[var(--admin-theme-surface)] text-[var(--admin-theme-text-on-surface)]",
              range_start: "rounded-l-full bg-[var(--admin-theme-surface)] text-[var(--admin-theme-text-on-surface)]",
              range_end: "rounded-r-full bg-[var(--admin-theme-surface)] text-[var(--admin-theme-text-on-surface)]",
              range_middle: "rounded-none bg-stone-100 text-stone-900",
              outside: "text-stone-300",
              disabled: "text-stone-300 opacity-40",
            }}
          />
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-stone-100 pt-3">
            <p className="min-w-0 flex-1 text-xs font-semibold text-stone-500">{selectedSummary}</p>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={clearSelection}
                className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-600 transition hover:bg-stone-50"
              >
                {labels.clear}
              </button>
              <button
                type="button"
                onClick={() => setIsCalendarOpen(false)}
                className="rounded-full bg-stone-950 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-stone-800"
              >
                {labels.done}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
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
    <div className="flex h-full min-h-[240px] flex-col rounded-[24px] border border-stone-100 bg-stone-50/70 p-4">
      <h3 className="text-sm font-semibold text-stone-950">{title}</h3>
      <div className="mt-3 grid flex-1 content-start gap-2">
        {items.map((item) => {
          const isSelected = item.key === selectedKey;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect(item.key)}
              className={`min-h-[68px] rounded-2xl border px-4 py-3 text-left shadow-sm transition ${isSelected ? "border-stone-950 bg-white" : "border-stone-100 bg-white hover:border-stone-200 hover:bg-stone-50"}`}
              aria-pressed={isSelected}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-stone-800">{item.label}</p>
                  <p className="mt-1 text-[11px] font-semibold leading-5 text-stone-400">{item.description}</p>
                </div>
                <p className="shrink-0 text-lg font-bold text-stone-950">{item.value}</p>
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
  basis,
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
    <AdminCard className="flex h-full min-h-[240px] flex-col">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">{eyebrow}</p>
      <h2 className="mt-2 text-lg font-semibold text-stone-950">{title}</h2>
      <p className="mt-1 text-xs font-semibold leading-5 text-stone-500">{basis}</p>
      <div className="mt-4 grid flex-1 content-start gap-3">
        {items.length > 0 ? items.map((item, index) => (
          <div key={`${item.label}-${index}`} className="rounded-2xl bg-stone-50 px-4 py-3">
            <div className="flex items-center justify-between text-sm font-semibold text-stone-700">
              <span className="truncate pr-3">{index + 1}. {item.label}</span>
              <span className="shrink-0 text-stone-950">{formatCount(item.value, valueSuffix)}</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-white">
              <div className="h-1.5 rounded-full bg-[var(--admin-theme-surface)]" style={{ width: `${item.widthPercent}%` }} />
            </div>
          </div>
        )) : <p className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-4 text-sm font-semibold text-stone-500">{emptyLabel}</p>}
      </div>
    </AdminCard>
  );
}

function CurrentSummaryCard({ label, value, description, subValue }: { label: string; value: string; description: string; subValue?: string }) {
  return (
    <div className="flex h-full min-h-[138px] flex-col rounded-[24px] border border-stone-100 bg-white px-5 py-4 shadow-sm">
      <p className="text-xs font-semibold text-stone-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-stone-950">{value}</p>
      <p className="mt-1 flex-1 text-xs font-semibold leading-5 text-stone-500">{description}</p>
      {subValue ? <p className="mt-2 text-[11px] font-semibold text-stone-400">{subValue}</p> : null}
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
  const todayDateValue = getTodayLocalDateValue();
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
    <AdminCard className="flex h-full min-h-[300px] flex-col">
      <h2 className="text-lg font-semibold text-stone-950">{title}</h2>
      <div className="mt-4 grid flex-1 content-start gap-3">
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
              <p>1. full_reset.sql</p>
              <p>2. full_reset_smoke_test.sql</p>
              <p>3. seed_stats_demo_0_9_2071.sql</p>
            </div>
          </div>
        </AdminCard>
      ) : null}

      <section>
        <div className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-4">
          <CurrentSummaryCard label={pt("currentProducedLabel", pageText.currentProducedLabel)} value={formatCount(stats.currentOverview.totalProducedCount, pt("workorderCountSuffix", pageText.workorderCountSuffix))} description={pt("currentReorderDescription", pageText.currentReorderDescription).replace("{count}", formatCount(totalReorderCount, pt("workorderCountSuffix", pageText.workorderCountSuffix)))} />
          <CurrentSummaryCard label={pt("currentDelayRateLabel", pageText.currentDelayRateLabel)} value={formatPercent(stats.currentOverview.dueDelayRate, pt("pendingLabel", pageText.pendingLabel))} description={pt("currentRateBasis", pageText.currentRateBasis).replace("{count}", formatCount(stats.currentOverview.dueDelayCount, pt("workorderCountSuffix", pageText.workorderCountSuffix))).replace("{target}", formatCount(stats.currentOverview.dueDateTargetCount, pt("workorderCountSuffix", pageText.workorderCountSuffix)))} />
          <CurrentSummaryCard label={pt("currentQualityRateLabel", pageText.currentQualityRateLabel)} value={formatPercent(stats.currentOverview.qualityIssueRate, pt("pendingLabel", pageText.pendingLabel))} description={pt("currentRateBasis", pageText.currentRateBasis).replace("{count}", formatCount(stats.currentOverview.qualityIssueCount, pt("workorderCountSuffix", pageText.workorderCountSuffix))).replace("{target}", formatCount(stats.currentOverview.qualityTargetCount, pt("workorderCountSuffix", pageText.workorderCountSuffix)))} />
          <CurrentSummaryCard label={pt("currentStorageUsageLabel", pageText.currentStorageUsageLabel)} value={`${storageUsePercent}%`} description={formatStorageGb(stats.currentOverview.storageUsedBytes, stats.currentOverview.storageLimitBytes)} subValue={formatStorageMb(stats.currentOverview.storageUsedBytes, pt("usedSuffix", pageText.usedSuffix))} />
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-stone-100 bg-white px-4 py-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">{pt("statsSectionEyebrow", "dashboard sections")}</p>
            <h2 className="mt-1.5 text-lg font-semibold text-stone-950">{pt("statsSectionTitle", "통계 섹션")}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-full bg-stone-50 p-1">
            {statsSectionTabs.map((item) => {
              const isActive = item.key === activeStatsSection;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => changeStatsSection(item.key)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${isActive ? "bg-[var(--admin-theme-surface)] text-[var(--admin-theme-text-on-surface)] shadow-sm" : "text-stone-500 hover:bg-white hover:text-stone-800"}`}
                  aria-pressed={isActive}
                  title={item.description}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 min-h-[340px] overflow-hidden">
          <div
            key={activeStatsSection}
            className={`transform-gpu transition-[opacity,transform] duration-200 ease-out motion-reduce:transform-none motion-reduce:transition-none ${isStatsSectionAnimating ? (statsSectionDirection >= 0 ? "translate-x-3 opacity-0" : "-translate-x-3 opacity-0") : "translate-x-0 opacity-100"}`}
          >
          {activeStatsSection === "production" ? (
            <div className="grid auto-rows-fr gap-4 xl:grid-cols-2">
              <AdminCard className="flex h-full min-h-[300px] flex-col">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">{pt("productionMixEyebrow", pageText.productionMixEyebrow)}</p>
                    <h2 className="mt-2 text-lg font-semibold text-stone-950">{pt("productionMixTitle", pageText.productionMixTitle)}</h2>
                  </div>
                  <div className="flex rounded-full bg-stone-100 p-1">
                    {(["first", "second"] as const).map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setCategoryDepth(key);
                          setSelectedCategoryLabel(null);
                        }}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${categoryDepth === key ? "bg-white text-stone-950 shadow-sm" : "text-stone-500"}`}
                      >
                        {categoryDepthLabels[key]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-4 flex-1">
                  <AdminBasicDonutChart points={selectedCategoryDepthBars} totalLabel={pt("workorderCountSuffix", pageText.workorderCountSuffix)} valueSuffix={pt("workorderCountSuffix", pageText.workorderCountSuffix)} emptyLabel={pt("productionMixEmpty", pageText.productionMixEmpty)} compact selectedLabel={normalizedSelectedCategoryLabel} onSelectPoint={setSelectedCategoryLabel} />
                </div>
                <p className="mt-4 text-xs font-semibold text-stone-500">{pt("currentBasis", pageText.currentBasis)}: {selectedCategoryDepthLabel} · {formatCount(selectedCategoryDepthTotal, pt("workorderCountSuffix", pageText.workorderCountSuffix))}</p>
                {normalizedSelectedCategoryLabel ? <p className="mt-1 text-xs font-semibold text-[var(--admin-theme-surface)]">{pt("selectedItemLabel", pageText.selectedItemLabel)}: {normalizedSelectedCategoryLabel}</p> : null}
              </AdminCard>

              {renderBarList(categoryDetailTitle, categoryDetailPoints, categoryDetailEmptyLabel)}
            </div>
          ) : null}

          {activeStatsSection === "factory" ? (
            <div className="grid auto-rows-fr gap-4 xl:grid-cols-2">
              {renderBarList(pt("factoryPerformanceTitle", pageText.factoryPerformanceTitle), viewModel.factoryProductionBars, pt("factoryPerformanceEmpty", pageText.factoryPerformanceEmpty))}
              <AdminCard className="flex h-full min-h-[300px] flex-col">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">{pt("delayQualityEyebrow", pageText.delayQualityEyebrow)}</p>
                <h2 className="mt-2 text-lg font-semibold text-stone-950">{pt("delayQualityTitle", pageText.delayQualityTitle)}</h2>
                <div className="mt-4 flex-1 overflow-hidden rounded-2xl border border-stone-100">
                  <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr] bg-stone-50 px-4 py-3 text-xs font-semibold text-stone-500">
                    <span>{pt("factoryColumn", pageText.factoryColumn)}</span>
                    <span>{pt("delayRateColumn", pageText.delayRateColumn)}</span>
                    <span>{pt("qualityRateColumn", pageText.qualityRateColumn)}</span>
                  </div>
                  {translatedStats.factoryPerformance.length > 0 ? translatedStats.factoryPerformance.slice(0, 5).map((item) => {
                    const tooltip = buildFactoryMetricTooltip(item);
                    return (
                      <div key={item.label} title={tooltip} className="grid grid-cols-[1.2fr_0.8fr_0.8fr] border-t border-stone-100 px-4 py-3 text-xs font-semibold text-stone-700">
                        <span className="truncate pr-3">{item.label} · {formatCount(item.productionCount, pt("workorderCountSuffix", pageText.workorderCountSuffix))}</span>
                        <span className="cursor-help underline decoration-stone-300 decoration-dotted underline-offset-4">{formatPercent(item.dueDelayRate, pt("pendingLabel", pageText.pendingLabel))}</span>
                        <span className="cursor-help underline decoration-stone-300 decoration-dotted underline-offset-4">{formatPercent(item.qualityIssueRate, pt("pendingLabel", pageText.pendingLabel))}</span>
                      </div>
                    );
                  }) : (
                    <p className="border-t border-stone-100 px-4 py-4 text-sm font-semibold text-stone-500">{pt("factoryPerformanceEmpty", pageText.factoryPerformanceEmpty)}</p>
                  )}
                </div>
              </AdminCard>
            </div>
          ) : null}

          {activeStatsSection === "period" ? (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-stone-100 bg-stone-50/70 px-4 py-2.5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">{pt("periodAnalysisEyebrow", pageText.periodAnalysisEyebrow)}</p>
                  <h3 className="mt-1 text-sm font-semibold text-stone-950">{pt("periodAnalysisTitle", pageText.periodAnalysisTitle)}</h3>
                </div>
                <div className="flex w-full flex-wrap items-center justify-start gap-2 lg:w-auto lg:justify-end">
                  <div className="w-full min-w-[280px] max-w-[440px] flex-1 sm:w-auto sm:flex-none">
                    <AdminStatsDateRangePicker
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
                    <Link
                      key={item.key}
                      href={item.href}
                      aria-current={item.active ? "page" : undefined}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${item.active ? "bg-[var(--admin-theme-surface)] text-[var(--admin-theme-text-on-surface)]" : "bg-white text-stone-500 hover:bg-stone-100"}`}
                    >
                      {translateStatsLabel(item.label, t)}
                    </Link>
                  ))}
                  <Link
                    href="/admin/dashboard?period=30d"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 bg-white text-sm font-semibold text-stone-500 shadow-sm transition hover:bg-stone-50"
                    aria-label={pt("customReset", pageText.customReset)}
                    title={pt("customReset", pageText.customReset)}
                  >
                    ↻
                  </Link>
                  <Link
                    href={customPeriodHref}
                    aria-disabled={!isCustomPeriodValid}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${isCustomPeriodValid ? "bg-stone-950 text-white hover:bg-stone-800" : "pointer-events-none bg-stone-100 text-stone-400"}`}
                  >
                    {pt("customApplyShort", pageText.customApply)}
                  </Link>
                </div>
              </div>
              {customPeriodMessage ? <p className="mt-3 text-xs font-semibold text-amber-700">{customPeriodMessage}</p> : null}
              <div className="mt-4 grid auto-rows-fr gap-4 xl:grid-cols-2">
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
