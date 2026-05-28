import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type AppListRowProps = HTMLAttributes<HTMLDivElement> & {
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  selected?: boolean;
};

export default function AppListRow({
  title,
  description,
  meta,
  leading,
  trailing,
  selected = false,
  className,
  ...props
}: AppListRowProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-start gap-3 rounded-3xl border p-3 transition",
        selected ? "border-[var(--pbp-accent)] bg-[color-mix(in_srgb,var(--pbp-accent)_12%,var(--pbp-surface))]" : "border-[var(--pbp-border)] bg-[var(--pbp-surface)] hover:bg-[var(--pbp-surface-muted)]",
        className,
      )}
      data-selected={selected ? "true" : undefined}
      {...props}
    >
      {leading ? <div className="shrink-0">{leading}</div> : null}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold pbp-text-primary">{title}</div>
        {description ? <div className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--pbp-text-muted)]">{description}</div> : null}
        {meta ? <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5 text-[11px] pbp-text-muted">{meta}</div> : null}
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  );
}
