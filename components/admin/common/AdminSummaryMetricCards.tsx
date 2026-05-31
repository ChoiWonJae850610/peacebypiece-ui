"use client";

import type { ReactNode } from "react";

export type AdminSummaryMetricCard = {
  id: string;
  label: ReactNode;
  value: ReactNode;
  helper: ReactNode;
  badge?: ReactNode;
};

type AdminSummaryMetricDensity = "standard" | "compact";

type AdminSummaryMetricCardsProps = {
  cards: readonly AdminSummaryMetricCard[];
  ariaLabel?: string;
  className?: string;
  gridClassName?: string;
  density?: AdminSummaryMetricDensity;
};

const CARD_BASE_CLASS =
  "group relative flex min-w-0 flex-col overflow-hidden border border-[var(--pbp-border)] bg-[linear-gradient(135deg,var(--pbp-surface)_0%,var(--pbp-surface-muted)_100%)] shadow-[var(--pbp-shadow-card)] transition-colors hover:border-[var(--pbp-border-strong)]";

const DENSITY_CLASS: Record<AdminSummaryMetricDensity, string> = {
  standard: "min-h-[104px] rounded-[26px] px-4 py-3",
  compact: "min-h-[76px] rounded-[20px] px-3.5 py-2.5",
};

const LABEL_CLASS: Record<AdminSummaryMetricDensity, string> = {
  standard: "text-[13px] leading-5",
  compact: "text-[11px] leading-4",
};

const VALUE_CLASS: Record<AdminSummaryMetricDensity, string> = {
  standard: "text-[26px] leading-none",
  compact: "text-xl leading-none",
};

const HELPER_CLASS: Record<AdminSummaryMetricDensity, string> = {
  standard: "mt-2 text-xs leading-5",
  compact: "mt-1.5 text-[11px] leading-4",
};

export default function AdminSummaryMetricCards({
  cards,
  ariaLabel,
  className = "",
  gridClassName = "grid gap-3 md:grid-cols-2 2xl:grid-cols-4",
  density = "standard",
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
            className={[CARD_BASE_CLASS, DENSITY_CLASS[density]].join(" ")}
          >
            <span className="pointer-events-none absolute inset-y-3 left-0 w-1 rounded-r-full bg-[var(--admin-theme-surface)] opacity-75" />
            <div className="flex min-w-0 items-start justify-between gap-3 pl-1">
              <div className="min-w-0">
                <p className={["truncate font-semibold text-[var(--pbp-text-muted)]", LABEL_CLASS[density]].join(" ")}>
                  {card.label}
                </p>
                <p className={["mt-1 font-extrabold tracking-tight text-[var(--pbp-text-primary)]", VALUE_CLASS[density]].join(" ")}>
                  {card.value}
                </p>
              </div>
              {card.badge ? <div className="shrink-0">{card.badge}</div> : null}
            </div>
            <p className={["truncate pl-1 text-[var(--pbp-text-muted)]", HELPER_CLASS[density]].join(" ")}>
              {card.helper}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
