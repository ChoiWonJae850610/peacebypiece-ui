import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type WaflStorageUsageTone = "normal" | "caution" | "danger";

export type WaflStorageUsageMeterDetail = {
  label: ReactNode;
  value: ReactNode;
  description?: ReactNode;
  tone?: WaflStorageUsageTone;
};

type WaflStorageUsageMeterProps = {
  percent: number;
  usedLabel: ReactNode;
  limitLabel: ReactNode;
  statusLabel: ReactNode;
  tone?: WaflStorageUsageTone;
  details?: WaflStorageUsageMeterDetail[];
  showCylinder?: boolean;
  compact?: boolean;
  className?: string;
};

const toneTrackClassMap: Record<WaflStorageUsageTone, string> = {
  normal: "bg-[var(--pbp-status-success-fg)]",
  caution: "bg-[var(--pbp-status-warning-fg)]",
  danger: "bg-[var(--pbp-status-danger-fg)]",
};

const toneBadgeClassMap: Record<WaflStorageUsageTone, string> = {
  normal: "border-[var(--pbp-status-success-bg)] bg-[var(--pbp-status-success-bg)] text-[var(--pbp-status-success-fg)]",
  caution: "border-[var(--pbp-status-warning-bg)] bg-[var(--pbp-status-warning-bg)] text-[var(--pbp-status-warning-fg)]",
  danger: "border-[var(--pbp-status-danger-bg)] bg-[var(--pbp-status-danger-bg)] text-[var(--pbp-status-danger-fg)]",
};

function clampPercent(percent: number) {
  if (!Number.isFinite(percent)) return 0;
  return Math.min(100, Math.max(0, Math.round(percent)));
}

function StorageCylinder({ percent, tone }: { percent: number; tone: WaflStorageUsageTone }) {
  const safePercent = clampPercent(percent);
  const fillClassName = toneTrackClassMap[tone];

  return (
    <div
      data-wafl-component="storage-cylinder"
      className="relative mx-auto h-[82px] w-[94px] shrink-0"
      aria-hidden="true"
    >
      <div className="absolute inset-x-4 bottom-0 h-[64px] overflow-hidden rounded-b-[28px] border-x border-b border-[var(--pbp-border-strong)] bg-[var(--pbp-surface)] shadow-inner">
        <div
          className={cn("absolute inset-x-0 bottom-0 rounded-b-[24px] opacity-25", fillClassName)}
          style={{ height: `${Math.max(6, safePercent)}%` }}
        />
      </div>
      <div className="absolute inset-x-4 top-0 h-9 rounded-[50%] border border-[var(--pbp-border-strong)] bg-[var(--pbp-surface)] shadow-sm" />
      <div
        className={cn("absolute inset-x-4 rounded-[50%] border border-[var(--pbp-border)] opacity-45", fillClassName)}
        style={{ bottom: `${Math.max(0, Math.min(56, safePercent * 0.56))}px`, height: 30 }}
      />
      <div className="absolute inset-0 flex items-center justify-center pt-2">
        <span className="rounded-full bg-[var(--pbp-surface)]/90 px-3 py-1 text-sm font-bold text-[var(--pbp-text-primary)] shadow-sm">
          {safePercent}%
        </span>
      </div>
    </div>
  );
}

export default function WaflStorageUsageMeter({
  percent,
  usedLabel,
  limitLabel,
  statusLabel,
  tone = "normal",
  details = [],
  showCylinder = false,
  compact = false,
  className,
}: WaflStorageUsageMeterProps) {
  const safePercent = clampPercent(percent);
  const normalizedTone = tone === "danger" ? "danger" : tone === "caution" ? "caution" : "normal";

  return (
    <div
      data-wafl-component="storage-usage-meter"
      className={cn(
        "min-w-0 rounded-[var(--pbp-radius-wafl)] border border-[var(--pbp-border)] bg-[var(--pbp-surface-base)]",
        compact ? "p-3" : "p-4",
        className,
      )}
    >
      <div className={cn("grid min-w-0 gap-4", showCylinder ? "sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center" : "")}>
        {showCylinder ? <StorageCylinder percent={safePercent} tone={normalizedTone} /> : null}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="min-w-0 font-semibold text-[var(--pbp-text-primary)]">
              {usedLabel} / {limitLabel}
            </span>
            <span
              className={cn(
                "inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-bold",
                toneBadgeClassMap[normalizedTone],
              )}
            >
              {statusLabel}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--pbp-surface-muted)]">
            <div
              className={cn("h-full rounded-full", toneTrackClassMap[normalizedTone])}
              style={{ width: `${safePercent}%` }}
            />
          </div>
          <p className="mt-1 text-right text-xs font-semibold text-[var(--pbp-text-muted)]">
            {safePercent}%
          </p>
        </div>
      </div>

      {details.length > 0 ? (
        <div className={cn("mt-3 grid gap-2", compact ? "sm:grid-cols-3" : "md:grid-cols-3")}>
          {details.map((item, index) => (
            <div
              key={index}
              className="min-w-0 rounded-[var(--pbp-radius-wafl)] border border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] px-3 py-2"
            >
              <p className="truncate text-[11px] font-bold text-[var(--pbp-text-subtle)]">{item.label}</p>
              <p className="mt-1 truncate text-sm font-semibold text-[var(--pbp-text-primary)]">{item.value}</p>
              {item.description ? (
                <p className="mt-0.5 truncate text-[11px] text-[var(--pbp-text-muted)]">{item.description}</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
