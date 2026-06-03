"use client";

import type { ReactNode } from "react";

export type WaflSectionPanelDensity = "standard" | "compact";

type WaflSectionPanelProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  descriptionActions?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
  actionClassName?: string;
  density?: WaflSectionPanelDensity;
};

function joinClassNames(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

const PANEL_DENSITY_CLASS: Record<WaflSectionPanelDensity, string> = {
  standard: "rounded-[30px] p-4 sm:p-5",
  compact: "rounded-[26px] p-3.5 sm:p-4",
};

const HEADER_DENSITY_CLASS: Record<WaflSectionPanelDensity, string> = {
  standard: "pb-4",
  compact: "pb-3",
};

const TITLE_DENSITY_CLASS: Record<WaflSectionPanelDensity, string> = {
  standard: "text-xl sm:text-2xl",
  compact: "text-lg sm:text-xl",
};

export const WAFL_SECTION_PANEL_CLASS =
  "w-full min-w-0 overflow-hidden border border-[var(--pbp-border-strong)] bg-[var(--pbp-surface)] shadow-[var(--pbp-shadow-card)]";

export const WAFL_SECTION_EYEBROW_CLASS =
  "text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--pbp-brand-soft)]";

export const WAFL_SECTION_DESCRIPTION_CLASS =
  "mt-2 max-w-3xl text-sm leading-6 text-[var(--pbp-text-muted)]";

export default function WaflSectionPanel({
  eyebrow,
  title,
  description,
  meta,
  actions,
  descriptionActions,
  children,
  footer,
  className = "",
  bodyClassName = "pt-3",
  headerClassName = "",
  actionClassName = "",
  density = "standard",
}: WaflSectionPanelProps) {
  return (
    <section className={joinClassNames(WAFL_SECTION_PANEL_CLASS, PANEL_DENSITY_CLASS[density], className)}>
      <div
        className={joinClassNames(
          "flex flex-col gap-3 border-b border-[var(--pbp-border)] sm:flex-row sm:items-start sm:justify-between",
          HEADER_DENSITY_CLASS[density],
          headerClassName,
        )}
      >
        <div className="min-w-0 flex-1">
          {eyebrow ? <p className={WAFL_SECTION_EYEBROW_CLASS}>{eyebrow}</p> : null}
          <h3
            className={joinClassNames(
              "font-bold tracking-[-0.03em] text-[var(--pbp-text-primary)]",
              eyebrow ? "mt-2" : "",
              TITLE_DENSITY_CLASS[density],
            )}
          >
            {title}
          </h3>
          {description || descriptionActions ? (
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              {description ? (
                <p className={joinClassNames(WAFL_SECTION_DESCRIPTION_CLASS, "mt-0")}>{description}</p>
              ) : (
                <span aria-hidden="true" />
              )}
              {descriptionActions ? (
                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                  {descriptionActions}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        {meta || actions ? (
          <div className={joinClassNames("flex shrink-0 flex-wrap items-center gap-2 text-xs font-semibold text-[var(--pbp-text-subtle)] sm:justify-end sm:self-start", actionClassName)}>
            {meta ? <span>{meta}</span> : null}
            {actions}
          </div>
        ) : null}
      </div>

      <div className={bodyClassName}>{children}</div>
      {footer ? <div className="pt-3">{footer}</div> : null}
    </section>
  );
}
