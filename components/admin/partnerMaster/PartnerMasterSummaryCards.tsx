"use client";

import AdminSummaryMetricCards, {
  type AdminSummaryMetricCard,
} from "@/components/admin/common/AdminSummaryMetricCards";
import { useI18n } from "@/lib/i18n";
import type { PartnerSummaryViewModel } from "@/lib/admin/partner";

type PartnerMasterSummaryCardsProps = {
  summary: PartnerSummaryViewModel;
  className?: string;
};

function formatCount(value: number) {
  return value.toLocaleString("ko-KR");
}

function formatMessage(template: string, values: Record<string, number>) {
  return Object.entries(values).reduce(
    (message, [key, value]) =>
      message.replaceAll(`{${key}}`, formatCount(value)),
    template,
  );
}

export default function PartnerMasterSummaryCards({
  summary,
  className = "mt-3",
}: PartnerMasterSummaryCardsProps) {
  const { i18n } = useI18n();
  const summaryText = i18n.admin.partnerMaster.summaryCards;
  const cards: AdminSummaryMetricCard[] = [
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
      value: formatCount(
        summary.typeCounts.material_vendor +
          summary.typeCounts.subsidiary_vendor,
      ),
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
    <AdminSummaryMetricCards
      cards={cards}
      ariaLabel={summaryText.ariaLabel}
      className={className}
      gridClassName="grid gap-3 md:grid-cols-2 xl:grid-cols-5"
    />
  );
}
