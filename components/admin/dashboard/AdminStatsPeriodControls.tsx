"use client";

import { useRef } from "react";
import { Check, RotateCcw } from "lucide-react";

import {
  AdminCompactActionButton,
  AdminIconActionLink,
} from "@/components/admin/common/AdminIconActionButton";
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
import { useElementSize } from "@/lib/responsive/useElementSize";

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

const PERIOD_CONTROLS_INLINE_MIN_WIDTH = 620;

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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { width: containerWidth } = useElementSize(containerRef);
  const isInlineControls = containerWidth >= PERIOD_CONTROLS_INLINE_MIN_WIDTH;

  return (
    <div
      ref={containerRef}
      data-wafl-component="stats-period-controls"
      className={`min-w-0 rounded-[var(--pbp-radius-wafl)] border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] px-2.5 py-2 shadow-none sm:px-3 ${ADMIN_STATS_PANEL_TIGHT_CLASS}`}
    >
      <div
        className={
          isInlineControls
            ? "grid grid-cols-[minmax(88px,auto)_minmax(0,1fr)] items-center gap-2"
            : "grid gap-2"
        }
      >
        <div className="min-w-0">
          <h3 className={`text-sm font-semibold ${ADMIN_STATS_TITLE_CLASS}`}>
            {title}
          </h3>
        </div>
        <div
          className={
            isInlineControls
              ? "flex min-w-0 items-center justify-end gap-1.5"
              : "grid min-w-0 gap-2"
          }
        >
          <div
            className={
              isInlineControls
                ? "min-w-0 flex-1 max-w-[300px]"
                : "min-w-0 w-full"
            }
          >
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
          <div
            className={
              isInlineControls
                ? "flex shrink-0 items-center justify-end gap-1.5"
                : "flex min-w-0 flex-wrap items-center justify-start gap-1.5"
            }
          >
            {periodOptions.map((item) => (
              <AdminCompactActionButton
                key={item.key}
                active={item.active}
                onClick={() => onPeriodOptionSelect(item.key)}
              >
                {translateAdminStatsLabel(item.label, t)}
              </AdminCompactActionButton>
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
    </div>
  );
}
