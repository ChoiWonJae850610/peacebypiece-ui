"use client";

import { useI18n } from "@/lib/i18n";
import type { PartnerSummaryViewModel } from "@/lib/admin/partner";

type PartnerMasterSummaryCardsProps = {
  summary: PartnerSummaryViewModel;
  className?: string;
};

type PartnerSummaryMetric = {
  id: string;
  label: string;
  value: string;
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
  className = "mt-4",
}: PartnerMasterSummaryCardsProps) {
  const { i18n } = useI18n();
  const summaryText = i18n.admin.partnerMaster.summaryCards;
  const metrics: PartnerSummaryMetric[] = [
    {
      id: "total",
      label: summaryText.total.label,
      value: formatCount(summary.total),
      helper: summaryText.total.helper,
    },
    {
      id: "active",
      label: summaryText.active.label,
      value: formatCount(summary.active),
      helper: formatMessage(summaryText.active.helper, {
        inactive: summary.inactive,
      }),
    },
    {
      id: "factory",
      label: summaryText.factory.label,
      value: formatCount(summary.typeCounts.factory),
      helper: summaryText.factory.helper,
    },
    {
      id: "materials",
      label: summaryText.materials.label,
      value: formatCount(summary.typeCounts.material_vendor + summary.typeCounts.subsidiary_vendor),
      helper: formatMessage(summaryText.materials.helper, {
        fabric: summary.typeCounts.material_vendor,
        subsidiary: summary.typeCounts.subsidiary_vendor,
      }),
    },
    {
      id: "outsourcing",
      label: summaryText.outsourcing.label,
      value: formatCount(summary.typeCounts.outsourcing_vendor),
      helper: formatMessage(summaryText.outsourcing.helper, {
        processes: summary.outsourcingProcessCount,
      }),
    },
  ];

  return (
    <section className={[className, "shrink-0"].filter(Boolean).join(" ")} aria-label={summaryText.ariaLabel}>
      <div className="grid gap-2 min-[560px]:grid-cols-2 min-[920px]:grid-cols-3 min-[1180px]:grid-cols-5">
        {metrics.map((metric) => (
          <article
            key={metric.id}
            className="relative min-w-0 overflow-hidden rounded-[20px] border border-[var(--admin-theme-border)] bg-[color-mix(in_srgb,var(--pbp-surface)_88%,var(--admin-theme-surface)_12%)] px-3.5 py-3 shadow-sm transition-colors"
          >
            <span className="pointer-events-none absolute inset-y-3 left-0 w-1 rounded-r-full bg-[var(--admin-theme-surface)] opacity-70" />
            <div className="flex min-w-0 items-baseline justify-between gap-3 pl-1">
              <p className="truncate text-[12px] font-semibold leading-5 text-[var(--pbp-text-muted)]">{metric.label}</p>
              <p className="text-xl font-extrabold leading-none tracking-tight text-[var(--pbp-text-primary)]">{metric.value}</p>
            </div>
            <p className="mt-1.5 truncate pl-1 text-[11px] leading-4 text-[var(--pbp-text-muted)]">{metric.helper}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
