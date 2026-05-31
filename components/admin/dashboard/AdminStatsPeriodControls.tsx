"use client";

import { AdminLinkButton } from "@/components/admin/common/AdminButton";
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
      <div className="grid min-w-0 gap-2 md:grid-cols-[minmax(240px,1fr)_auto] md:items-center">
        <div className="min-w-0">
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
        <div className="flex min-w-0 flex-wrap items-center justify-start gap-1.5 md:justify-end">
          {periodOptions.map((item) => (
            <AdminLinkButton
              key={item.key}
              href={buildPeriodSectionHref(item.href)}
              aria-current={item.active ? "page" : undefined}
              variant={item.active ? "primary" : "secondary"}
              size="sm"
              className="min-h-7 shrink-0 px-2.5 py-1 text-[11px]"
            >
              {translateAdminStatsLabel(item.label, t)}
            </AdminLinkButton>
          ))}
          <AdminLinkButton
            href={buildPeriodSectionHref(resetHref)}
            variant="secondary"
            size="sm"
            className="min-h-7 shrink-0 px-2.5 py-1 text-[11px]"
          >
            {resetLabel}
          </AdminLinkButton>
          <AdminLinkButton
            href={applyHref}
            aria-disabled={!isApplyEnabled}
            variant={isApplyEnabled ? "primary" : "secondary"}
            size="sm"
            className={`min-h-7 shrink-0 px-2.5 py-1 text-[11px] ${isApplyEnabled ? "" : "pointer-events-none opacity-50"}`}
          >
            {applyLabel}
          </AdminLinkButton>
        </div>
      </div>
    </div>
  );
}
