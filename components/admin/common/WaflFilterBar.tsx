import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type WaflFilterBarProps = {
  children: ReactNode;
  className?: string;
  layoutClassName?: string;
};

export const WAFL_FILTER_BAR_CLASS =
  "w-full rounded-[24px] border border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-soft)] p-3 transition-colors";

export const WAFL_FILTER_BAR_LAYOUT_CLASS =
  "grid w-full min-w-0 gap-3";

export default function WaflFilterBar({
  children,
  className,
  layoutClassName,
}: WaflFilterBarProps) {
  return (
    <div className={cn(WAFL_FILTER_BAR_CLASS, className)}>
      <div className={cn(WAFL_FILTER_BAR_LAYOUT_CLASS, layoutClassName)}>{children}</div>
    </div>
  );
}
