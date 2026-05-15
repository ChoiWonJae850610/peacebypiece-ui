"use client";

import { useI18n } from "@/lib/i18n";
import type { PartnerSummaryViewModel } from "@/lib/admin/partner";

type PartnerMasterSummaryCardsProps = {
  summary: PartnerSummaryViewModel;
  className?: string;
};

type SummaryCard = {
  key: "total" | "active" | "factory" | "materials" | "outsourcing";
  label: string;
  value: number;
  helper: string;
};

function formatCount(value: number) {
  return value.toLocaleString("ko-KR");
}

function formatMessage(template: string, values: Record<string, number>) {
  return Object.entries(values).reduce(
    (message, [key, value]) => message.replaceAll(`{${key}}`, formatCount(value)),
    template,
  );
}

export default function PartnerMasterSummaryCards({
  summary,
  className = "mt-3",
}: PartnerMasterSummaryCardsProps) {
  const { i18n } = useI18n();
  const summaryText = i18n.admin.partnerMaster.summaryCards;
  const cards: SummaryCard[] = [
    {
      key: "total",
      label: summaryText.total.label,
      value: summary.total,
      helper: summaryText.total.helper,
    },
    {
      key: "active",
      label: summaryText.active.label,
      value: summary.active,
      helper: formatMessage(summaryText.active.helper, { inactive: summary.inactive }),
    },
    {
      key: "factory",
      label: summaryText.factory.label,
      value: summary.typeCounts.factory,
      helper: summaryText.factory.helper,
    },
    {
      key: "materials",
      label: summaryText.materials.label,
      value: summary.typeCounts.material_vendor + summary.typeCounts.subsidiary_vendor,
      helper: formatMessage(summaryText.materials.helper, {
        fabric: summary.typeCounts.material_vendor,
        subsidiary: summary.typeCounts.subsidiary_vendor,
      }),
    },
    {
      key: "outsourcing",
      label: summaryText.outsourcing.label,
      value: summary.typeCounts.outsourcing_vendor,
      helper: formatMessage(summaryText.outsourcing.helper, { processes: summary.outsourcingProcessCount }),
    },
  ];

  return (
    <section className={`${className} shrink-0`} aria-label={summaryText.ariaLabel}>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <article
            key={card.key}
            className="group relative overflow-hidden rounded-[26px] border border-[var(--admin-theme-border)] bg-[var(--pbp-surface)] px-4 py-3 shadow-sm transition-colors hover:border-[var(--admin-theme-surface)]"
          >
            <span className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[var(--admin-theme-surface)] opacity-70" />
            <p className="text-[13px] font-semibold leading-5 text-[var(--pbp-text-primary)]">{card.label}</p>
            <p className="mt-1 text-[26px] font-bold leading-none tracking-tight text-[var(--pbp-text-primary)]">
              {formatCount(card.value)}
            </p>
            <p className="mt-2 text-xs leading-5 text-[var(--pbp-text-muted)]">{card.helper}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
