"use client";

import AdminSummaryMetricCards, {
  type AdminSummaryMetricCard,
} from "@/components/admin/common/AdminSummaryMetricCards";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import { AdminSection } from "@/components/admin/common/AdminSection";

type AdminStatsOverviewSectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  selectedPeriodBadgeLabel: string;
  activePeriodLabel: string;
  cards: readonly AdminSummaryMetricCard[];
};

export default function AdminStatsOverviewSection({
  eyebrow,
  title,
  description,
  selectedPeriodBadgeLabel,
  activePeriodLabel,
  cards,
}: AdminStatsOverviewSectionProps) {
  return (
    <AdminSection
      eyebrow={eyebrow}
      title={title}
      description={description}
      className="overflow-hidden border-[var(--pbp-border-strong)] bg-[linear-gradient(135deg,var(--pbp-surface-soft),var(--pbp-surface))] p-5 shadow-[var(--pbp-shadow-elevated)]"
      headerClassName="items-end"
      actions={
        <AdminStatusBadge tone="brand">
          {selectedPeriodBadgeLabel}: {activePeriodLabel}
        </AdminStatusBadge>
      }
      bodyClassName="mt-5"
    >
      <AdminSummaryMetricCards
        cards={cards}
        gridClassName="grid gap-3 md:grid-cols-2 xl:grid-cols-4"
      />
    </AdminSection>
  );
}
