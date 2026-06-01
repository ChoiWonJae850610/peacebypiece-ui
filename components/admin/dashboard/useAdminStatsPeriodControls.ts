import { useCallback, useMemo, useState } from "react";

import { getTodayAdminLocalDateValue } from "@/components/admin/common/AdminDateRangePicker";
import type { AdminDateRangePickerLabels } from "@/components/admin/common/AdminDateRangePicker";
import type { AdminStatsPeriodTopMode, AdminStatsSnapshot } from "@/lib/admin/stats/types";
import type { getI18n } from "@/lib/i18n";

type AdminStatsPageText = ReturnType<typeof getI18n>["admin"]["dashboardPage"];
type AdminStatsPeriodOption = AdminStatsSnapshot["periodOptions"][number];
type AdminStatsPeriodPresetKey = "7d" | "30d";
type AdminStatsTranslate = (key: string, fallback?: string) => string;

type UseAdminStatsPeriodControlsArgs = {
  stats: AdminStatsSnapshot;
  pageText: AdminStatsPageText;
  translate: AdminStatsTranslate;
  selectedPeriodTopMode: AdminStatsPeriodTopMode;
};

const PERIOD_PRESET_DAYS_BEFORE: Record<AdminStatsPeriodPresetKey, number> = {
  "7d": 7,
  "30d": 30,
};

const isAdminStatsPeriodPresetKey = (
  key: AdminStatsPeriodOption["key"],
): key is AdminStatsPeriodPresetKey => key === "7d" || key === "30d";

const getRelativeAdminDateValue = (baseDateValue: string, daysBefore: number) => {
  const [year, month, day] = baseDateValue.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - daysBefore);
  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, "0");
  const nextDay = String(date.getDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
};

export function useAdminStatsPeriodControls({
  stats,
  pageText,
  translate,
  selectedPeriodTopMode,
}: UseAdminStatsPeriodControlsArgs) {
  const todayDateValue = getTodayAdminLocalDateValue();
  const [customStartDate, setCustomStartDate] = useState(
    stats.selectedPeriodRange.isCustom
      ? stats.selectedPeriodRange.startDate
      : "",
  );
  const [customEndDate, setCustomEndDate] = useState(
    stats.selectedPeriodRange.isCustom ? stats.selectedPeriodRange.endDate : "",
  );
  const [activePeriodPresetKey, setActivePeriodPresetKey] = useState<
    AdminStatsPeriodPresetKey | null
  >(null);

  const dateRangeLabels: AdminDateRangePickerLabels = useMemo(
    () => ({
      start: translate("customStartDateLabel", pageText.customStartDateLabel),
      end: translate("customEndDateLabel", pageText.customEndDateLabel),
      clear: translate("customClear", pageText.customReset),
      done: translate("customDone", pageText.customDone),
      selected: translate(
        "customDateRangeSelected",
        pageText.customDateRangeSelected,
      ),
      notSelected: translate(
        "customDateRangeEmpty",
        pageText.customDateRangeEmpty,
      ),
      calendarAria: translate(
        "customDateRangeCalendarAria",
        pageText.customDateRangeCalendarAria,
      ),
    }),
    [pageText, translate],
  );

  const activePeriodOptions = useMemo(
    () =>
      stats.periodOptions
        .filter((item) => item.key === "7d" || item.key === "30d")
        .map((item) => ({
          ...item,
          active: item.key === activePeriodPresetKey,
        })),
    [activePeriodPresetKey, stats.periodOptions],
  );

  const buildPeriodSectionHref = useCallback(
    (href: string) => {
      const separator = href.includes("?") ? "&" : "?";
      return `${href}${separator}section=period&topMode=${selectedPeriodTopMode}`;
    },
    [selectedPeriodTopMode],
  );

  const updateCustomStartDate = useCallback(
    (value: string) => {
      setActivePeriodPresetKey(null);
      if (!value) {
        setCustomStartDate("");
        setCustomEndDate("");
        return;
      }
      if (value > todayDateValue) return;
      setCustomStartDate(value);
      setCustomEndDate((currentEndDate) =>
        currentEndDate && currentEndDate < value ? "" : currentEndDate,
      );
    },
    [todayDateValue],
  );

  const updateCustomEndDate = useCallback(
    (value: string) => {
      setActivePeriodPresetKey(null);
      if (!value) {
        setCustomEndDate("");
        return;
      }
      if (value > todayDateValue) return;
      if (customStartDate && value < customStartDate) return;
      setCustomEndDate(value);
    },
    [customStartDate, todayDateValue],
  );

  const setPresetCustomPeriod = useCallback(
    (key: AdminStatsPeriodOption["key"]) => {
      if (!isAdminStatsPeriodPresetKey(key)) return;
      const daysBefore = PERIOD_PRESET_DAYS_BEFORE[key];

      if (activePeriodPresetKey === key) {
        setActivePeriodPresetKey(null);
        setCustomStartDate("");
        setCustomEndDate("");
        return;
      }

      setActivePeriodPresetKey(key);
      setCustomEndDate(todayDateValue);
      setCustomStartDate(getRelativeAdminDateValue(todayDateValue, daysBefore));
    },
    [activePeriodPresetKey, todayDateValue],
  );

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
    ? translate("customPeriodInvalidOrder", pageText.customPeriodInvalidOrder)
    : !isCustomPeriodNotFuture
      ? translate("customPeriodFutureBlocked", pageText.customPeriodFutureBlocked)
      : customEndDate && !isCustomEndSelectable
        ? translate("customPeriodInvalidOrder", pageText.customPeriodInvalidOrder)
        : "";

  return {
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
  };
}
