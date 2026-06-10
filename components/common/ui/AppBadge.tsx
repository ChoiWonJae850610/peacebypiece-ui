import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type AppBadgeTone =
  | "neutral"
  | "strong"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "brand"
  | "workorder"
  | "design"
  | "document"
  | "memo"
  | "file"
  | "inverse";

export type AppBadgeVariant =
  | "status"
  | "count"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "brand"
  | "neutral";

export type AppBadgeSize = "xs" | "sm" | "md";

const toneClassMap: Record<AppBadgeTone, string> = {
  neutral: "border-[var(--pbp-status-neutral-bg)] bg-[var(--pbp-status-neutral-bg)] text-[var(--pbp-status-neutral-fg)]",
  strong: "border-[var(--pbp-border-strong)] bg-[var(--pbp-surface)] text-[var(--pbp-text-primary)]",
  info: "border-[var(--pbp-status-info-bg)] bg-[var(--pbp-status-info-bg)] text-[var(--pbp-status-info-fg)]",
  success: "border-[var(--pbp-status-success-bg)] bg-[var(--pbp-status-success-bg)] text-[var(--pbp-status-success-fg)]",
  warning: "border-[var(--pbp-status-warning-bg)] bg-[var(--pbp-status-warning-bg)] text-[var(--pbp-status-warning-fg)]",
  danger: "border-[var(--pbp-status-danger-bg)] bg-[var(--pbp-status-danger-bg)] text-[var(--pbp-status-danger-fg)]",
  brand: "border-[var(--pbp-brand-muted)] bg-[var(--pbp-surface-selected)] text-[var(--pbp-brand-primary)]",
  workorder: "border-[color-mix(in_srgb,var(--pbp-chart-2)_34%,var(--pbp-border))] bg-[color-mix(in_srgb,var(--pbp-chart-2)_13%,var(--pbp-surface))] text-[color-mix(in_srgb,var(--pbp-chart-2)_84%,var(--pbp-text-primary))]",
  design: "border-[color-mix(in_srgb,var(--pbp-chart-4)_34%,var(--pbp-border))] bg-[color-mix(in_srgb,var(--pbp-chart-4)_12%,var(--pbp-surface))] text-[color-mix(in_srgb,var(--pbp-chart-4)_84%,var(--pbp-text-primary))]",
  document: "border-[color-mix(in_srgb,var(--pbp-chart-1)_28%,var(--pbp-border))] bg-[color-mix(in_srgb,var(--pbp-chart-1)_8%,var(--pbp-surface))] text-[color-mix(in_srgb,var(--pbp-chart-1)_88%,var(--pbp-text-primary))]",
  memo: "border-[color-mix(in_srgb,var(--pbp-chart-3)_34%,var(--pbp-border))] bg-[color-mix(in_srgb,var(--pbp-chart-3)_12%,var(--pbp-surface))] text-[color-mix(in_srgb,var(--pbp-chart-3)_84%,var(--pbp-text-primary))]",
  file: "border-[color-mix(in_srgb,var(--pbp-chart-6)_28%,var(--pbp-border))] bg-[color-mix(in_srgb,var(--pbp-chart-6)_9%,var(--pbp-surface))] text-[color-mix(in_srgb,var(--pbp-chart-6)_82%,var(--pbp-text-primary))]",
  inverse: "border-white/20 bg-white/10 text-[var(--pbp-text-inverse)]",
};

const variantToneMap: Record<AppBadgeVariant, AppBadgeTone> = {
  status: "neutral",
  count: "strong",
  info: "info",
  success: "success",
  warning: "warning",
  danger: "danger",
  brand: "brand",
  neutral: "neutral",
};

const sizeClassMap: Record<AppBadgeSize, string> = {
  xs: "px-2 py-0.5 text-[10px]",
  sm: "px-2 py-0.5 text-[11px]",
  md: "px-2.5 py-1 text-xs",
};

type AppBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: AppBadgeTone;
  variant?: AppBadgeVariant;
  size?: AppBadgeSize;
};

export default function AppBadge({
  className,
  tone,
  variant = "status",
  size = "md",
  ...props
}: AppBadgeProps) {
  const resolvedTone = tone ?? variantToneMap[variant];

  return (
    <span
      data-wafl-component="badge"
      className={cn(
        "inline-flex w-fit shrink-0 items-center justify-center gap-1 rounded-[var(--pbp-radius-wafl-compact)] border font-semibold leading-none",
        toneClassMap[resolvedTone],
        sizeClassMap[size],
        className,
      )}
      {...props}
    />
  );
}
