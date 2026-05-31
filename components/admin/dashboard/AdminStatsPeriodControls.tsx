"use client";

import { Check, RotateCcw } from "lucide-react";

import { AdminButton } from "@/components/admin/common/AdminButton";
import { AdminIconActionLink } from "@/components/admin/common/AdminIconActionButton";
import {
  AdminDateRangePicker,
  type AdminDateRangePickerLabels,
} from "@/components/admin/common/AdminDateRangePicker";
import {
  ADMIN_STATS_PANEL_TIGHT_CLASS,
  ADMIN_STATS_TITLE_CLASS,
} from "@/components/admin/common/adminSemanticClassNames";
import type { AdminStatsSnapshot } from "@/lib/admin/stats/types";
import { translateAdminStatsLabel } from "@/lib/admin/stats/dashboardPresentation";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

type AdminStatsPeriodOption = AdminStatsSnapshot["periodOptions"][number];

type AdminStatsPeriodControlsProps = {
  title: string;
  startDate: string;
  endDate: string;
  maxDateValue: string;
  labels: AdminDateRangePickerLabels;
  locale: "ko" | "en";
  periodOptions: AdminStatsPeriodOption[];
  resetHref: string;
  applyHref: string;
  resetLabel: string;
  applyLabel: string;
  isApplyEnabled: boolean;
  buildPeriodSectionHref: (href: string) => string;
  onPeriodOptionSelect: (key: AdminStatsPeriodOption["key"]) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
};

export function AdminStatsPeriodControls({
  title,
  startDate,
  endDate,
  maxDateValue,
  labels,
  locale,
  periodOptions,
  resetHref,
  applyHref,
  resetLabel,
  applyLabel,
  isApplyEnabled,
  buildPeriodSectionHref,
  onPeriodOptionSelect,
  onStartDateChange,
  onEndDateChange,
}: AdminStatsPeriodControlsProps) {
  const t = useAdminTranslation();

  return (
    <div
      className={`${ADMIN_STATS_PANEL_TIGHT_CLASS} grid gap-2 px-2.5 py-2 sm:px-3 lg:grid-cols-[minmax(140px,auto)_minmax(0,1fr)] lg:items-center`}
    >
      <div className="min-w-0">
        <h3 className={`text-sm font-semibold ${ADMIN_STATS_TITLE_CLASS}`}>
          {title}
        </h3>
      </div>
      <div className="flex min-w-0 flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 md:w-[420px] md:max-w-[420px]">
          <AdminDateRangePicker
            startDate={startDate}
            endDate={endDate}
            maxDateValue={maxDateValue}
            labels={labels}
            locale={locale}
            onStartDateChange={onStartDateChange}
            onEndDateChange={onEndDateChange}
          />
        </div>
        <div className="flex min-w-0 flex-wrap items-center justify-start gap-1.5 md:ml-auto md:justify-end">
          {periodOptions.map((item) => (
            <AdminButton
              key={item.key}
              type="button"
              aria-pressed={item.active}
              variant={item.active ? "primary" : "secondary"}
              size="sm"
              className="min-h-8 shrink-0 px-2.5 py-1 text-[11px]"
              onClick={() => onPeriodOptionSelect(item.key)}
            >
              {translateAdminStatsLabel(item.label, t)}
            </AdminButton>
          ))}
          <AdminIconActionLink
            href={buildPeriodSectionHref(resetHref)}
            label={resetLabel}
            tone="neutral"
          >
            <RotateCcw className="text-current" strokeWidth={2.4} aria-hidden="true" />
          </AdminIconActionLink>
          <AdminIconActionLink
            href={applyHref}
            label={applyLabel}
            tone="primary"
            disabled={!isApplyEnabled}
          >
            <Check className="text-current" strokeWidth={2.4} aria-hidden="true" />
          </AdminIconActionLink>
        </div>
      </div>
    </div>
  );
}
