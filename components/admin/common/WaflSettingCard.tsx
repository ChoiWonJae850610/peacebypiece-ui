"use client";

import type { ReactNode } from "react";

export type WaflSettingCardTone = "neutral" | "info" | "success" | "warning" | "danger";

type WaflSettingCardProps = {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  meta?: ReactNode;
  tone?: WaflSettingCardTone;
  density?: "default" | "compact";
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
};

function joinClassNames(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

const TONE_ACCENT_CLASS: Record<WaflSettingCardTone, string> = {
  neutral: "bg-[var(--pbp-brand-soft)]",
  info: "bg-[var(--pbp-status-info-fg)]",
  success: "bg-[var(--pbp-status-success-fg)]",
  warning: "bg-[var(--pbp-status-warning-fg)]",
  danger: "bg-[var(--pbp-status-danger-fg)]",
};

export const WAFL_SETTING_CARD_CLASS =
  "relative min-w-0 overflow-hidden rounded-[24px] border border-[var(--pbp-border)] bg-[var(--pbp-surface)] shadow-[var(--pbp-shadow-card)]";

const DENSITY_CLASS: Record<NonNullable<WaflSettingCardProps["density"]>, string> = {
  default: "p-3.5 sm:p-4",
  compact: "p-3 sm:p-3.5",
};

export default function WaflSettingCard({
  title,
  description,
  eyebrow,
  badge,
  actions,
  children,
  footer,
  meta,
  tone = "neutral",
  density = "default",
  className = "",
  bodyClassName = "mt-3",
  headerClassName = "",
}: WaflSettingCardProps) {
  return (
    <article className={joinClassNames(WAFL_SETTING_CARD_CLASS, DENSITY_CLASS[density], className)}>
      <span
        aria-hidden="true"
        className={joinClassNames("pointer-events-none absolute inset-y-4 left-0 w-1 rounded-r-full opacity-75", TONE_ACCENT_CLASS[tone])}
      />
      <div className={joinClassNames("flex min-w-0 flex-col gap-3 pl-1 sm:flex-row sm:items-start sm:justify-between", headerClassName)}>
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--pbp-text-subtle)]">{eyebrow}</p>
          ) : null}
          <div className={joinClassNames("flex min-w-0 flex-wrap items-center gap-2", eyebrow ? "mt-1.5" : "")}>
            <h4 className="min-w-0 text-sm font-bold tracking-[-0.02em] text-[var(--pbp-text-primary)]">{title}</h4>
            {badge ? <span className="shrink-0">{badge}</span> : null}
          </div>
          {description ? <p className="mt-2 text-xs leading-5 text-[var(--pbp-text-muted)]">{description}</p> : null}
          {meta ? <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--pbp-text-muted)]">{meta}</div> : null}
        </div>
        {actions ? <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end">{actions}</div> : null}
      </div>
      {children ? <div className={joinClassNames("pl-1", bodyClassName)}>{children}</div> : null}
      {footer ? <div className="mt-3 border-t border-[var(--pbp-border)] pt-3 pl-1">{footer}</div> : null}
    </article>
  );
}
