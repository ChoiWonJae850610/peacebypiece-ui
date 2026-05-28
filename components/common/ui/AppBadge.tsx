import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type AppBadgeTone = "neutral" | "strong" | "info" | "success" | "warning" | "danger" | "brand";
type AppBadgeSize = "sm" | "md";

const toneClassMap: Record<AppBadgeTone, string> = {
  neutral: "border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] text-[var(--pbp-text-muted)]",
  strong: "border-[var(--pbp-border-strong)] bg-[var(--pbp-surface)] text-[var(--pbp-text-primary)]",
  info: "border-[var(--pbp-status-info-bg)] bg-[var(--pbp-status-info-bg)] text-[var(--pbp-status-info-fg)]",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-rose-200 bg-rose-50 text-rose-700",
  brand: "border-[var(--pbp-accent)] bg-[color-mix(in_srgb,var(--pbp-accent)_12%,var(--pbp-surface))] text-[var(--pbp-accent)]",
};

const sizeClassMap: Record<AppBadgeSize, string> = {
  sm: "px-2 py-0.5 text-[11px]",
  md: "px-2.5 py-1 text-xs",
};

type AppBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: AppBadgeTone;
  size?: AppBadgeSize;
};

export default function AppBadge({ className, tone = "neutral", size = "md", ...props }: AppBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-semibold leading-none",
        toneClassMap[tone],
        sizeClassMap[size],
        className,
      )}
      {...props}
    />
  );
}
