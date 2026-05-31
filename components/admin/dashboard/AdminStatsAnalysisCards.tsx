"use client";

import { AdminEmptyState } from "@/components/admin/common/AdminEmptyState";
import { AdminCard } from "@/components/admin/layout/AdminCard";
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
import type { AdminStatsPeriodTopMode } from "@/lib/admin/stats/types";
import {
  formatAdminStatsCount,
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
}
