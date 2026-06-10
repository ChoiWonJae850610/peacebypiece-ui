import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type WaflFilterBarProps = {
  children: ReactNode;
  className?: string;
  layoutClassName?: string;
};

export const WAFL_FILTER_BAR_CLASS =
  "w-full wafl-shape-surface border border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-soft)] p-3 shadow-none transition-colors";

export const WAFL_FILTER_BAR_LAYOUT_CLASS =
  "grid w-full min-w-0 gap-3";

export const WAFL_FILTER_FIELD_CLASS = "min-w-0 space-y-2";

export const WAFL_FILTER_LABEL_CLASS =
  "text-[12px] font-semibold text-[var(--pbp-text-muted)]";

export const WAFL_FILTER_INPUT_CLASS =
  "h-10 w-full min-w-0 wafl-shape-control border border-[var(--pbp-field-search-border)] bg-[var(--pbp-field-search-surface)] px-4 text-sm text-[var(--pbp-text-primary)] outline-none shadow-none transition placeholder:text-[var(--pbp-text-subtle)] focus:border-[var(--pbp-focus-ring)] focus:ring-2 focus:ring-[var(--pbp-focus-ring)]";

export const WAFL_FILTER_SELECT_TRIGGER_CLASS = "h-10 wafl-shape-control";

export default function WaflFilterBar({
  children,
  className,
  layoutClassName,
}: WaflFilterBarProps) {
  return (
    <div data-wafl-component="filter-bar" className={cn(WAFL_FILTER_BAR_CLASS, className)}>
      <div className={cn(WAFL_FILTER_BAR_LAYOUT_CLASS, layoutClassName)}>{children}</div>
    </div>
  );
}
