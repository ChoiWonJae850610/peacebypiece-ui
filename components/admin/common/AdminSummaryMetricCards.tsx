"use client";

import type { ReactNode } from "react";

export type AdminSummaryMetricCard = {
  id: string;
  label: ReactNode;
  value: ReactNode;
  helper: ReactNode;
  badge?: ReactNode;
};

type AdminSummaryMetricCardsProps = {
  cards: readonly AdminSummaryMetricCard[];
  ariaLabel?: string;
  className?: string;
  gridClassName?: string;
};

export default function AdminSummaryMetricCards({
  cards,
  ariaLabel,
  className = "",
  gridClassName = "grid gap-3 md:grid-cols-2 2xl:grid-cols-4",
}: AdminSummaryMetricCardsProps) {
  return (
    <section
      className={[className, "shrink-0"].filter(Boolean).join(" ")}
      aria-label={ariaLabel}
    >
      <div className={gridClassName}>
        {cards.map((card) => (
          <article
            key={card.id}
            className="group relative flex min-h-[104px] flex-col overflow-hidden rounded-[26px] border border-[var(--admin-theme-border)] bg-[var(--pbp-surface)] px-4 py-3 shadow-sm transition-colors hover:border-[var(--admin-theme-surface)]"
          >
            <span className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[var(--admin-theme-surface)] opacity-70" />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold leading-5 text-[var(--pbp-text-primary)]">
                  {card.label}
                </p>
                <p className="mt-1 text-[26px] font-bold leading-none tracking-tight text-[var(--pbp-text-primary)]">
                  {card.value}
                </p>
              </div>
              {card.badge ? <div className="shrink-0">{card.badge}</div> : null}
            </div>
            <p className="mt-2 text-xs leading-5 text-[var(--pbp-text-muted)]">
              {card.helper}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
