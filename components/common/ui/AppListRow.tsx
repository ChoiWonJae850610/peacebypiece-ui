import { createElement, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type AppListRowAs = "div" | "article" | "button";
export type AppListRowDensity = "regular" | "compact";
export type AppListRowVariant = "surface" | "soft" | "plain";

type AppListRowProps = HTMLAttributes<HTMLElement> & {
  as?: AppListRowAs;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  selected?: boolean;
  density?: AppListRowDensity;
  variant?: AppListRowVariant;
  type?: "button" | "submit" | "reset";
};

const densityClassMap: Record<AppListRowDensity, string> = {
  regular: "p-3",
  compact: "p-2.5",
};

const variantClassMap: Record<AppListRowVariant, string> = {
  surface: "border-[var(--pbp-border)] bg-[var(--pbp-surface)] hover:bg-[var(--pbp-surface-muted)]",
  soft: "border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] hover:bg-[var(--pbp-surface-muted)]",
  plain: "border-transparent bg-transparent hover:bg-[var(--pbp-surface-muted)]",
};

const selectedClassName =
  "border-[var(--pbp-accent)] bg-[color-mix(in_srgb,var(--pbp-accent)_12%,var(--pbp-surface))]";

export default function AppListRow({
  as: Component = "div",
  title,
  description,
  meta,
  leading,
  trailing,
  selected = false,
  density = "regular",
  variant = "surface",
  className,
  ...props
}: AppListRowProps) {
  return createElement(
    Component,
    {
      className: cn(
        "flex min-w-0 items-start gap-3 rounded-3xl border text-left transition",
        Component === "button" ? "w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-60" : null,
        densityClassMap[density],
        selected ? selectedClassName : variantClassMap[variant],
        className,
      ),
      "data-selected": selected ? "true" : undefined,
      ...props,
    },
    <>
      {leading ? <div className="shrink-0">{leading}</div> : null}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold pbp-text-primary">{title}</div>
        {description ? <div className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--pbp-text-muted)]">{description}</div> : null}
        {meta ? <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5 text-[11px] pbp-text-muted">{meta}</div> : null}
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </>,
  );
}
