"use client";

import { useI18n } from "@/lib/i18n";
import type { PartnerSummaryViewModel } from "@/lib/admin/partner";

type PartnerMasterSummaryCardsProps = {
  summary: PartnerSummaryViewModel;
  filteredSummary: PartnerSummaryViewModel;
  hasFilter: boolean;
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
  filteredSummary,
  hasFilter,
  className = "mt-3",
}: PartnerMasterSummaryCardsProps) {
  const { i18n } = useI18n();
  const summaryText = i18n.admin.partnerMaster.summaryCards;
  const source = hasFilter ? filteredSummary : summary;
  const cards: SummaryCard[] = [
    {
      key: "total",
      label: summaryText.total.label,
      value: source.total,
      helper: hasFilter
        ? formatMessage(summaryText.total.filteredHelper, { total: summary.total })
        : summaryText.total.helper,
    },
    {
      key: "active",
      label: summaryText.active.label,
      value: source.active,
      helper: formatMessage(summaryText.active.helper, { inactive: source.inactive }),
    },
    {
      key: "factory",
      label: summaryText.factory.label,
      value: source.typeCounts.factory,
      helper: summaryText.factory.helper,
    },
    {
      key: "materials",
      label: summaryText.materials.label,
      value: source.typeCounts.material_vendor + source.typeCounts.subsidiary_vendor,
      helper: formatMessage(summaryText.materials.helper, {
        fabric: source.typeCounts.material_vendor,
        subsidiary: source.typeCounts.subsidiary_vendor,
      }),
    },
    {
      key: "outsourcing",
      label: summaryText.outsourcing.label,
      value: source.typeCounts.outsourcing_vendor,
      helper: formatMessage(summaryText.outsourcing.helper, { processes: source.outsourcingProcessCount }),
    },
  ];

  return (
    <section className={`${className} shrink-0`} aria-label={summaryText.ariaLabel}>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <article
            key={card.key}
            className="rounded-3xl border border-[var(--admin-theme-border)] bg-[var(--admin-theme-surface)] px-4 py-3 shadow-sm transition-colors"
          >
            <p className="text-xs font-semibold text-[var(--pbp-text-muted)]">{card.label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-[var(--pbp-text-strong)]">
              {formatCount(card.value)}
            </p>
            <p className="mt-1 text-xs leading-5 text-[var(--pbp-text-muted)]">{card.helper}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
