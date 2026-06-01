"use client";

import { AdminStatsPeriodControls } from "@/components/admin/dashboard/AdminStatsPeriodControls";
import {
  PeriodSummaryCard,
  PeriodTopCard,
} from "@/components/admin/dashboard/AdminStatsAnalysisCards";
import { ADMIN_STATS_WARNING_TEXT_CLASS } from "@/components/admin/common/adminSemanticClassNames";
import type { AdminDateRangePickerLabels } from "@/components/admin/common/AdminDateRangePicker";
import type { AdminStatsPeriodTopMode, AdminStatsSnapshot } from "@/lib/admin/stats/types";
import type { Locale } from "@/lib/i18n";

type AdminStatsRatioBar = {
  label: string;
  value: number;
  widthPercent: number;
  valueLabel?: string;
};

type PeriodSummaryItem = {
  key: AdminStatsPeriodTopMode;
  label: string;
  value: string;
  description: string;
};

type AdminStatsPeriodSectionProps = {
  title: string;
  startDate: string;
  endDate: string;
  maxDateValue: string;
  labels: AdminDateRangePickerLabels;
  locale: Locale;
  periodOptions: AdminStatsSnapshot["periodOptions"];
  applyHref: string;
  resetLabel: string;
  applyLabel: string;
  isApplyEnabled: boolean;
  buildPeriodSectionHref: (href: string) => string;
  onPeriodOptionSelect: (key: AdminStatsSnapshot["periodOptions"][number]["key"]) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  customPeriodMessage: string;
  periodTopEyebrow: string;
  periodTopTitle: string;
  periodTopBasis: string;
  periodTopItems: AdminStatsRatioBar[];
  periodTopEmptyLabel: string;
  periodTopValueSuffix: string;
  periodSummaryTitle: string;
  periodSummaryItems: PeriodSummaryItem[];
  selectedPeriodTopMode: AdminStatsPeriodTopMode;
  onPeriodTopModeSelect: (key: AdminStatsPeriodTopMode) => void;
};

export function AdminStatsPeriodSection({
  title,
  startDate,
  endDate,
  maxDateValue,
  labels,
  locale,
  periodOptions,
  applyHref,
  resetLabel,
  applyLabel,
  isApplyEnabled,
  buildPeriodSectionHref,
  onPeriodOptionSelect,
  onStartDateChange,
  onEndDateChange,
  customPeriodMessage,
  periodTopEyebrow,
  periodTopTitle,
  periodTopBasis,
  periodTopItems,
  periodTopEmptyLabel,
  periodTopValueSuffix,
  periodSummaryTitle,
  periodSummaryItems,
  selectedPeriodTopMode,
  onPeriodTopModeSelect,
}: AdminStatsPeriodSectionProps) {
  return (
    <div>
      <AdminStatsPeriodControls
        title={title}
        startDate={startDate}
        endDate={endDate}
        maxDateValue={maxDateValue}
        labels={labels}
        locale={locale}
        periodOptions={periodOptions}
        resetHref="/workspace/stats?period=30d"
        applyHref={applyHref}
        resetLabel={resetLabel}
        applyLabel={applyLabel}
        isApplyEnabled={isApplyEnabled}
        buildPeriodSectionHref={buildPeriodSectionHref}
        onPeriodOptionSelect={onPeriodOptionSelect}
        onStartDateChange={onStartDateChange}
        onEndDateChange={onEndDateChange}
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
          eyebrow={periodTopEyebrow}
          title={periodTopTitle}
          basis={periodTopBasis}
          items={periodTopItems}
          emptyLabel={periodTopEmptyLabel}
          valueSuffix={periodTopValueSuffix}
        />
        <PeriodSummaryCard
          title={periodSummaryTitle}
          items={periodSummaryItems}
          selectedKey={selectedPeriodTopMode}
          onSelect={onPeriodTopModeSelect}
        />
      </div>
    </div>
  );
}
