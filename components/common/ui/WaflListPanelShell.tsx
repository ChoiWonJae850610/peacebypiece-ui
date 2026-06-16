import type { ReactNode } from "react";

import SectionCountBadge from "@/components/common/ui/SectionCountBadge";
import { WAFL_WORKSPACE_PANEL_PADDING_CLASS } from "@/components/common/ui/waflWorkspaceSpacing";
import { cn } from "@/lib/utils";

export const WAFL_LIST_PANEL_PADDING_CLASS = WAFL_WORKSPACE_PANEL_PADDING_CLASS;
export const WAFL_LIST_SEARCH_FILTER_GAP_CLASS = "mt-2";
export const WAFL_LIST_FILTER_ACTION_GAP_CLASS = "mt-3";
export const WAFL_LIST_ACTION_DIVIDER_GAP_CLASS = "mt-3";
export const WAFL_LIST_PANEL_LIST_CLASS =
  "min-h-0 flex-1 touch-pan-y overflow-y-scroll overscroll-contain py-3 [-webkit-overflow-scrolling:touch] [scrollbar-gutter:stable]";

export default function WaflListPanelShell({
  title,
  count,
  search,
  filters,
  action,
  children,
  className,
  listClassName,
}: {
  title: string;
  count: number;
  search: ReactNode;
  filters?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  listClassName?: string;
}) {
  return (
    <div
      data-wafl-component="list-panel-shell"
      className={cn(
        "flex h-full min-h-0 w-full min-w-0 flex-col",
        WAFL_LIST_PANEL_PADDING_CLASS,
        className,
      )}
    >
      <div className="shrink-0">
        <div className="flex items-end justify-between gap-2 pb-2.5">
          <h2 className="min-w-0 text-base font-semibold tracking-tight pbp-text-primary">{title}</h2>
          <SectionCountBadge className="translate-y-0.5">{count}건</SectionCountBadge>
        </div>
        <div className="border-b border-[var(--pbp-border)]" aria-hidden="true" />
      </div>

      <div className="mt-3 shrink-0">
        {search}
        {filters ? <div className={WAFL_LIST_SEARCH_FILTER_GAP_CLASS}>{filters}</div> : null}
        {action ? <div className={WAFL_LIST_FILTER_ACTION_GAP_CLASS}>{action}</div> : null}
      </div>

      <div className={cn("shrink-0 border-b border-[var(--pbp-border)]", WAFL_LIST_ACTION_DIVIDER_GAP_CLASS)} aria-hidden="true" />

      <div className={cn(WAFL_LIST_PANEL_LIST_CLASS, listClassName)}>{children}</div>
    </div>
  );
}
