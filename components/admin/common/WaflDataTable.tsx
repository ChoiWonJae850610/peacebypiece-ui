import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

export type WaflDataTableDensity = "standard" | "compact";

export const WAFL_DATA_TABLE_SHELL_CLASS =
  "flex min-h-fit w-full min-w-0 touch-pan-y flex-col overflow-hidden rounded-[22px] border border-[var(--pbp-border)] bg-[var(--pbp-surface)]";

export const WAFL_DATA_TABLE_HEADER_CLASS =
  "grid min-h-9 w-full min-w-0 items-center gap-3 bg-[var(--pbp-surface-muted)] px-4 py-2 text-[10px] font-semibold text-[var(--pbp-text-muted)]";

export const WAFL_DATA_TABLE_HEADER_BUTTON_CLASS =
  "inline-flex w-full max-w-full items-center gap-1 rounded-full px-1.5 py-1 text-center transition hover:bg-[var(--pbp-surface-soft)] hover:text-[var(--pbp-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pbp-focus-ring)]";

export const WAFL_DATA_TABLE_ROW_CLASS =
  "grid min-h-[44px] w-full min-w-0 items-center gap-3 px-4 py-2 text-left text-[12px] leading-5 transition focus:outline-none focus:ring-2 focus:ring-[var(--pbp-focus-ring)]";

export const WAFL_DATA_TABLE_CLICKABLE_ROW_CLASS =
  "cursor-pointer hover:bg-[var(--pbp-surface-muted)]";

export const WAFL_DATA_TABLE_DIVIDER_CLASS =
  "divide-y divide-[var(--pbp-border)]";

export const WAFL_DATA_TABLE_EMPTY_CLASS =
  "flex min-h-[220px] items-center justify-center bg-[var(--pbp-surface)] px-4 py-10 text-center text-sm text-[var(--pbp-text-muted)]";

export const WAFL_DATA_TABLE_PRIMARY_TEXT_CLASS =
  "truncate text-[13px] font-semibold text-[var(--pbp-text-muted)]";

export const WAFL_DATA_TABLE_SECONDARY_TEXT_CLASS =
  "mt-0.5 truncate text-[10px] text-[var(--pbp-text-subtle)]";

export const WAFL_DATA_TABLE_VALUE_TEXT_CLASS =
  "min-w-0 max-w-full truncate text-[12px] font-medium text-[var(--pbp-text-muted)]";

export const WAFL_DATA_TABLE_MUTED_TEXT_CLASS =
  "text-[var(--pbp-text-muted)]";

export const WAFL_DATA_TABLE_SUBTLE_TEXT_CLASS =
  "text-[var(--pbp-text-subtle)]";

export const WAFL_DATA_TABLE_COMPACT_CARD_CLASS =
  "w-full rounded-[16px] border border-[var(--pbp-border)] px-3 py-2.5 text-left text-[12px] shadow-[var(--pbp-shadow-card)] transition focus:outline-none focus:ring-2 focus:ring-[var(--pbp-focus-ring)]";

export const WAFL_DATA_TABLE_COMPACT_CARD_CLICKABLE_CLASS =
  "cursor-pointer hover:border-[var(--pbp-border-strong)] hover:bg-[var(--pbp-surface-muted)]";

export const WAFL_DATA_TABLE_COMPACT_META_BOX_CLASS =
  "min-w-0 rounded-2xl bg-[var(--pbp-surface-muted)] px-3 py-2";

export const WAFL_DATA_TABLE_COMPACT_META_LABEL_CLASS =
  "text-[10px] font-semibold text-[var(--pbp-text-subtle)]";

export const WAFL_DATA_TABLE_COMPACT_META_VALUE_CLASS =
  "mt-0.5 truncate text-[12px] font-medium text-[var(--pbp-text-muted)]";

type WaflDataTableShellProps = {
  children: ReactNode;
  className?: string;
};

type WaflDataTableGridProps = {
  children: ReactNode;
  gridTemplateColumns?: string;
  className?: string;
};

export function WaflDataTableShell({ children, className }: WaflDataTableShellProps) {
  return <section className={cn(WAFL_DATA_TABLE_SHELL_CLASS, className)}>{children}</section>;
}

export function WaflDataTableHeader({
  children,
  gridTemplateColumns,
  className,
}: WaflDataTableGridProps) {
  const style = gridTemplateColumns ? ({ gridTemplateColumns } as CSSProperties) : undefined;

  return (
    <div className={cn(WAFL_DATA_TABLE_HEADER_CLASS, className)} style={style}>
      {children}
    </div>
  );
}

export function WaflDataTableBody({ children, className }: WaflDataTableShellProps) {
  return <div className={cn(WAFL_DATA_TABLE_DIVIDER_CLASS, className)}>{children}</div>;
}

type WaflDataTableRowProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  gridTemplateColumns?: string;
  clickable?: boolean;
};

export function WaflDataTableRow({
  children,
  gridTemplateColumns,
  clickable = false,
  className,
  style,
  ...props
}: WaflDataTableRowProps) {
  const gridStyle = gridTemplateColumns
    ? ({ ...style, gridTemplateColumns } as CSSProperties)
    : style;

  return (
    <div
      className={cn(
        WAFL_DATA_TABLE_ROW_CLASS,
        clickable ? WAFL_DATA_TABLE_CLICKABLE_ROW_CLASS : undefined,
        className,
      )}
      style={gridStyle}
      {...props}
    >
      {children}
    </div>
  );
}
