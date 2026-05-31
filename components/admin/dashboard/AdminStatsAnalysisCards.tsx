"use client";

import type { ReactNode } from "react";

import { AdminEmptyState } from "@/components/admin/common/AdminEmptyState";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import { AdminCard } from "@/components/admin/layout/AdminCard";
import { AppTooltip } from "@/components/common/ui";
import { AdminResponsiveTableShell } from "@/components/admin/common/responsiveTable/AdminResponsiveTableShell";
import {
  ADMIN_RESPONSIVE_TABLE_DIVIDER_CLASS,
  ADMIN_RESPONSIVE_TABLE_EMPTY_CLASS,
  ADMIN_RESPONSIVE_TABLE_HEADER_CLASS,
  ADMIN_RESPONSIVE_TABLE_PRIMARY_TEXT_CLASS,
  ADMIN_RESPONSIVE_TABLE_ROW_CLASS,
  ADMIN_RESPONSIVE_TABLE_SECONDARY_TEXT_CLASS,
} from "@/components/admin/common/responsiveTable/adminResponsiveTableStyles";
import {
  ADMIN_STATS_ACCENT_BAR_CLASS,
  ADMIN_STATS_BODY_CLASS,
  ADMIN_STATS_IDLE_ITEM_CLASS,
  ADMIN_STATS_ITEM_MUTED_CLASS,
  ADMIN_STATS_MUTED_PANEL_CLASS,
  ADMIN_STATS_SELECTED_ITEM_CLASS,
  ADMIN_STATS_SUBTLE_TEXT_CLASS,
  ADMIN_STATS_TITLE_CLASS,
  ADMIN_STATS_TRACK_CLASS,
  ADMIN_STATS_TRACK_INSET_CLASS,
} from "@/components/admin/common/adminSemanticClassNames";
import type {
  AdminStatsFactoryPerformance,
  AdminStatsPeriodTopMode,
} from "@/lib/admin/stats/types";
import {
  formatAdminStatsCount,
  formatAdminStatsPercent,
  translateAdminStatsLabel,
} from "@/lib/admin/stats/dashboardPresentation";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

type AdminStatsBarPoint = {
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

type AdminStatsBarRowDensity = "compact" | "standard";

function AdminStatsBarRow({
  label,
  valueLabel,
  widthPercent,
  density = "standard",
  indexLabel,
}: {
  label: string;
  valueLabel: string;
  widthPercent: number;
  density?: AdminStatsBarRowDensity;
  indexLabel?: string;
}) {
  const trackClass =
    density === "compact"
      ? `mt-1.5 h-1.5 rounded-full ${ADMIN_STATS_TRACK_INSET_CLASS}`
      : `mt-2.5 h-2.5 rounded-full ${ADMIN_STATS_TRACK_CLASS}`;
  const barClass =
    density === "compact"
      ? `h-1.5 rounded-full ${ADMIN_STATS_ACCENT_BAR_CLASS}`
      : `h-2.5 rounded-full ${ADMIN_STATS_ACCENT_BAR_CLASS}`;

  return (
    <div
      className={
        density === "compact"
          ? `${ADMIN_STATS_ITEM_MUTED_CLASS} px-3 py-2`
          : ""
      }
    >
      <div
        className={`flex items-center justify-between gap-2 ${
          density === "compact" ? "text-sm" : "text-xs"
        } font-semibold ${ADMIN_STATS_BODY_CLASS}`}
      >
        <span className="truncate pr-2">
          {indexLabel ? `${indexLabel}. ` : ""}
          {label}
        </span>
        <span className={`shrink-0 ${ADMIN_STATS_TITLE_CLASS}`}>{valueLabel}</span>
      </div>
      <div className={trackClass}>
        <div className={barClass} style={{ width: `${widthPercent}%` }} />
      </div>
    </div>
  );
}

export function AdminStatsAnalysisCardShell({
  eyebrow,
  title,
  actions,
  children,
  className = "",
  bodyClassName = "mt-3 grid flex-1 content-center gap-3",
  minHeight = "standard",
}: {
  eyebrow?: string;
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  minHeight?: "standard" | "tall";
}) {
  const minHeightClass =
    minHeight === "tall"
      ? "min-h-[252px] sm:min-h-[286px]"
      : "min-h-[188px] sm:min-h-[204px]";

  return (
    <AdminCard
      className={`flex h-full ${minHeightClass} flex-col p-3 sm:p-3.5 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {eyebrow ? (
            <p
              className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${ADMIN_STATS_SUBTLE_TEXT_CLASS}`}
            >
              {eyebrow}
            </p>
          ) : null}
          <h2 className={`mt-1 text-base font-semibold ${ADMIN_STATS_TITLE_CLASS}`}>
            {title}
          </h2>
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      <div className={bodyClassName}>{children}</div>
    </AdminCard>
  );
}

export function FactoryPerformanceTable({
  items,
  emptyLabel,
  columns,
  countSuffix,
  zeroPercentLabel,
  getTooltip,
}: {
  items: AdminStatsFactoryPerformance[];
  emptyLabel: string;
  columns: { factory: string; delayRate: string; qualityRate: string };
  countSuffix: string;
  zeroPercentLabel: string;
  getTooltip: (item: AdminStatsFactoryPerformance) => string;
}) {
  const gridTemplateColumns =
    "minmax(0,1.4fr) minmax(88px,0.75fr) minmax(88px,0.75fr)";

  return (
    <AdminResponsiveTableShell className="min-h-[218px]">
      <div
        className={ADMIN_RESPONSIVE_TABLE_HEADER_CLASS}
        style={{ gridTemplateColumns }}
      >
        <span>{columns.factory}</span>
        <span>{columns.delayRate}</span>
        <span>{columns.qualityRate}</span>
      </div>
      <div className={ADMIN_RESPONSIVE_TABLE_DIVIDER_CLASS}>
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.label}
              className={ADMIN_RESPONSIVE_TABLE_ROW_CLASS}
              style={{ gridTemplateColumns }}
            >
              <AppTooltip content={getTooltip(item)} side="top">
                <span className="block min-w-0 cursor-help">
                  <span className={`block ${ADMIN_RESPONSIVE_TABLE_PRIMARY_TEXT_CLASS}`}>
                    {item.label}
                  </span>
                  <span className={`block ${ADMIN_RESPONSIVE_TABLE_SECONDARY_TEXT_CLASS}`}>
                    {formatAdminStatsCount(item.productionCount, countSuffix)}
                  </span>
                </span>
              </AppTooltip>
              <AppTooltip content={getTooltip(item)} side="top">
                <span className="inline-flex min-w-0 cursor-help justify-start">
                  <AdminStatusBadge
                    tone={item.dueDelayRate && item.dueDelayRate > 0 ? "warning" : "success"}
                    size="xs"
                  >
                    {formatAdminStatsPercent(item.dueDelayRate, zeroPercentLabel)}
                  </AdminStatusBadge>
                </span>
              </AppTooltip>
              <AppTooltip content={getTooltip(item)} side="top">
                <span className="inline-flex min-w-0 cursor-help justify-start">
                  <AdminStatusBadge
                    tone={item.qualityIssueRate && item.qualityIssueRate > 0 ? "warning" : "success"}
                    size="xs"
                  >
                    {formatAdminStatsPercent(item.qualityIssueRate, zeroPercentLabel)}
                  </AdminStatusBadge>
                </span>
              </AppTooltip>
            </div>
          ))
        ) : (
          <div className={ADMIN_RESPONSIVE_TABLE_EMPTY_CLASS}>
            {emptyLabel}
          </div>
        )}
      </div>
    </AdminResponsiveTableShell>
  );
}

export function PeriodSummaryCard({
  title,
  items,
  selectedKey,
  onSelect,
}: {
  title: string;
  items: PeriodSummaryItem[];
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

export function PeriodTopCard({
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
    <AdminStatsAnalysisCardShell eyebrow={eyebrow} title={title}>
      {items.length > 0 ? (
        items.map((item, index) => (
          <AdminStatsBarRow
            key={`${item.label}-${index}`}
            label={item.label}
            valueLabel={formatAdminStatsCount(item.value, valueSuffix)}
            widthPercent={item.widthPercent}
            density="compact"
            indexLabel={String(index + 1)}
          />
        ))
      ) : (
        <AdminEmptyState title={emptyLabel} />
      )}
    </AdminStatsAnalysisCardShell>
  );
}

export function AdminStatsBarListCard({
  title,
  points,
  emptyLabel,
}: {
  title: string;
  points: AdminStatsBarPoint[];
  emptyLabel: string;
}) {
  const t = useAdminTranslation();

  return (
    <AdminStatsAnalysisCardShell title={title} minHeight="tall">
      {points.length > 0 ? (
        points.map((item) => (
          <AdminStatsBarRow
            key={item.label}
            label={translateAdminStatsLabel(item.label, t)}
            valueLabel={item.valueLabel ?? String(item.value)}
            widthPercent={item.widthPercent}
          />
        ))
      ) : (
        <AdminEmptyState title={emptyLabel} />
      )}
    </AdminStatsAnalysisCardShell>
  );
}
