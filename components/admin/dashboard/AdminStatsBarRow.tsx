"use client";

import {
  ADMIN_STATS_ACCENT_BAR_CLASS,
  ADMIN_STATS_BODY_CLASS,
  ADMIN_STATS_ITEM_MUTED_CLASS,
  ADMIN_STATS_TITLE_CLASS,
  ADMIN_STATS_TRACK_CLASS,
  ADMIN_STATS_TRACK_INSET_CLASS,
} from "@/components/admin/common/adminSemanticClassNames";

export type AdminStatsBarRowDensity = "compact" | "standard";

export type AdminStatsBarRowProps = {
  label: string;
  valueLabel: string;
  widthPercent: number;
  density?: AdminStatsBarRowDensity;
  indexLabel?: string;
};

export function AdminStatsBarRow({
  label,
  valueLabel,
  widthPercent,
  density = "standard",
  indexLabel,
}: AdminStatsBarRowProps) {
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
        <span className={`shrink-0 ${ADMIN_STATS_TITLE_CLASS}`}>
          {valueLabel}
        </span>
      </div>
      <div className={trackClass}>
        <div className={barClass} style={{ width: `${widthPercent}%` }} />
      </div>
    </div>
  );
}
