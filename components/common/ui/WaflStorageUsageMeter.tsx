import { useId, type ReactNode } from "react";

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

const toneFillClassMap: Record<WaflStorageUsageTone, string> = {
  normal: "fill-[var(--pbp-status-success-fg)]",
  caution: "fill-[var(--pbp-status-warning-fg)]",
  danger: "fill-[var(--pbp-status-danger-fg)]",
};

const toneBadgeClassMap: Record<WaflStorageUsageTone, string> = {
  normal: "border-[var(--pbp-status-success-bg)] bg-[var(--pbp-status-success-bg)] text-[var(--pbp-status-success-fg)]",
  caution: "border-[var(--pbp-status-warning-bg)] bg-[var(--pbp-status-warning-bg)] text-[var(--pbp-status-warning-fg)]",
  danger: "border-[var(--pbp-status-danger-bg)] bg-[var(--pbp-status-danger-bg)] text-[var(--pbp-status-danger-fg)]",
};

function clampPercent(percent: number) {
  if (!Number.isFinite(percent)) return 0;
  return Math.min(100, Math.max(0, percent));
}

function formatPercentLabel(percent: number) {
  if (!Number.isFinite(percent) || percent <= 0) return "0%";
  if (percent < 1) return "<1%";
  return `${Math.round(percent)}%`;
}

function StorageCylinder({ percent, tone, percentLabel }: { percent: number; tone: WaflStorageUsageTone; percentLabel: string }) {
  const clipPathId = `wafl-storage-cylinder-fill-${useId().replace(/:/g, "")}`;
  const fillPercent = clampPercent(percent);
  const fillHeight = 76 * (fillPercent / 100);
  const fillTop = 28 + (76 - fillHeight);
  const fillClassName = toneFillClassMap[tone];

  return (
    <div
      data-wafl-component="storage-cylinder"
      data-storage-shape="database-cylinder-stack"
      className="relative mx-auto h-[118px] w-[168px] shrink-0"
      aria-hidden="true"
    >
      <svg className="h-full w-full" viewBox="0 0 168 118" role="img">
        <defs>
          <clipPath id={clipPathId}>
            <path d="M24 26C24 14.954 50.863 6 84 6s60 8.954 60 20v66c0 11.046-26.863 20-60 20s-60-8.954-60-20V26Z" />
          </clipPath>
        </defs>
        <path
          d="M24 26C24 14.954 50.863 6 84 6s60 8.954 60 20v66c0 11.046-26.863 20-60 20s-60-8.954-60-20V26Z"
          className="fill-[var(--pbp-surface)] stroke-[var(--pbp-border-strong)]"
          strokeWidth="1.5"
        />
        <g clipPath={`url(#${clipPathId})`}>
          <rect
            x="24"
            y={fillTop}
            width="120"
            height={fillHeight}
            className={cn("opacity-30 motion-reduce:transition-none", fillClassName)}
          />
          {fillPercent > 0 ? (
            <ellipse
              cx="84"
              cy={fillTop}
              rx="60"
              ry="20"
              className={cn("opacity-45", fillClassName)}
            />
          ) : null}
        </g>
        <ellipse
          cx="84"
          cy="26"
          rx="60"
          ry="20"
          className="fill-[var(--pbp-surface-base)] stroke-[var(--pbp-border-strong)]"
          strokeWidth="1.5"
        />
        <path d="M24 48C24 59.046 50.863 68 84 68s60-8.954 60-20" className="fill-none stroke-[var(--pbp-border)]" strokeWidth="1.25" />
        <path d="M24 70C24 81.046 50.863 90 84 90s60-8.954 60-20" className="fill-none stroke-[var(--pbp-border)]" strokeWidth="1.25" />
        <path d="M24 92C24 103.046 50.863 112 84 112s60-8.954 60-20" className="fill-none stroke-[var(--pbp-border-strong)]" strokeWidth="1.5" />
        <ellipse
          cx="84"
          cy="92"
          rx="60"
          ry="20"
          className="fill-none stroke-[var(--pbp-border-strong)]"
          strokeWidth="1.5"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center pt-2">
        <span className="rounded-full border border-[var(--pbp-border)] bg-[var(--pbp-surface)]/95 px-3 py-1 text-base font-bold text-[var(--pbp-text-primary)] shadow-sm">
          {percentLabel}
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
  const percentLabel = formatPercentLabel(percent);
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
      <div className={cn("grid min-w-0 gap-4", showCylinder ? "sm:grid-cols-[minmax(144px,0.42fr)_minmax(0,1fr)] sm:items-center" : "")}>
        {showCylinder ? <StorageCylinder percent={percent} tone={normalizedTone} percentLabel={percentLabel} /> : null}
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
            {percentLabel}
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
