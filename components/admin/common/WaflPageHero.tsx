"use client";

import type { ReactNode, Ref } from "react";

type WaflPageHeroProps = {
  eyebrow: ReactNode;
  title: ReactNode;
  description: ReactNode;
  actions?: ReactNode;
  badges?: ReactNode;
  children?: ReactNode;
  className?: string;
  bodyClassName?: string;
  sectionRef?: Ref<HTMLElement>;
};

function joinClassNames(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export const WAFL_PAGE_HERO_CLASS =
  "w-full overflow-hidden rounded-[32px] border border-[var(--pbp-border-strong)] bg-[linear-gradient(135deg,var(--pbp-surface-soft)_0%,var(--pbp-surface)_62%,var(--pbp-surface-muted)_130%)] p-5 shadow-[var(--pbp-shadow-elevated)] sm:p-6";

export const WAFL_PAGE_HERO_EYEBROW_CLASS =
  "text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--pbp-brand-soft)]";

export const WAFL_PAGE_HERO_TITLE_CLASS =
  "mt-2 text-2xl font-bold tracking-[-0.03em] text-[var(--pbp-text-primary)] sm:text-3xl";

export const WAFL_PAGE_HERO_DESCRIPTION_CLASS =
  "mt-2 max-w-3xl text-sm leading-6 text-[var(--pbp-text-muted)]";

export default function WaflPageHero({
  eyebrow,
  title,
  description,
  actions,
  badges,
  children,
  className = "",
  bodyClassName = "mt-5",
  sectionRef,
}: WaflPageHeroProps) {
  return (
    <section ref={sectionRef} className={joinClassNames(WAFL_PAGE_HERO_CLASS, className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className={WAFL_PAGE_HERO_EYEBROW_CLASS}>{eyebrow}</p>
          <h2 className={WAFL_PAGE_HERO_TITLE_CLASS}>{title}</h2>
          <p className={WAFL_PAGE_HERO_DESCRIPTION_CLASS}>{description}</p>
        </div>
        {actions || badges ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {badges}
            {actions}
          </div>
        ) : null}
      </div>
      {children ? <div className={bodyClassName}>{children}</div> : null}
    </section>
  );
}
