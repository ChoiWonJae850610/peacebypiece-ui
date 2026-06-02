"use client";

import AdminSummaryMetricCards, {
  type AdminSummaryMetricCard,
} from "@/components/admin/common/AdminSummaryMetricCards";
import WaflPageHero from "@/components/admin/common/WaflPageHero";

type AdminStatsOverviewSectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  cards: readonly AdminSummaryMetricCard[];
};

export default function AdminStatsOverviewSection({
  eyebrow,
  title,
  description,
  cards,
}: AdminStatsOverviewSectionProps) {
  return (
    <WaflPageHero
      eyebrow={eyebrow}
      title={title}
      description={description}
    >
      <AdminSummaryMetricCards
        cards={cards}
        gridClassName="grid gap-3 md:grid-cols-2 xl:grid-cols-4"
      />
    </WaflPageHero>
  );
}
