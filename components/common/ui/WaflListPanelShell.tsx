import type { ReactNode } from "react";

import SectionCountBadge from "@/components/common/ui/SectionCountBadge";
import { cn } from "@/lib/utils";

export const WAFL_LIST_PANEL_PADDING_CLASS = "p-3.5";
export const WAFL_LIST_PANEL_CONTROL_GAP_CLASS = "gap-3";
export const WAFL_LIST_PANEL_LIST_CLASS =
  "min-h-0 flex-1 overflow-y-auto overscroll-contain py-3 [scrollbar-gutter:auto]";

export default function WaflListPanelShell({
  title,
  count,
  controls,
  action,
  children,
  className,
  listClassName,
}: {
  title: string;
  count: number;
  controls: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  listClassName?: string;
}) {
  return (
    <div className={cn("flex h-full min-h-0 w-full min-w-0 flex-col", WAFL_LIST_PANEL_PADDING_CLASS, className)}>
      <div className="shrink-0">
        <div className="flex items-end justify-between gap-2 pb-2.5">
          <h2 className="min-w-0 text-base font-semibold tracking-tight pbp-text-primary">{title}</h2>
          <SectionCountBadge className="translate-y-0.5">{count}건</SectionCountBadge>
        </div>
        <div className="border-b border-[var(--pbp-border)]" aria-hidden="true" />
      </div>

      <div className={cn("mt-3 grid shrink-0", WAFL_LIST_PANEL_CONTROL_GAP_CLASS)}>
        {controls}
        {action}
      </div>

      <div className="mt-3 shrink-0 border-b border-[var(--pbp-border)]" aria-hidden="true" />

      <div className={cn(WAFL_LIST_PANEL_LIST_CLASS, listClassName)}>{children}</div>
    </div>
  );
}
