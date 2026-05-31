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
  const filterText = i18n.admin.partnerMaster.filters;
  const metrics: AdminSummaryMetricCard[] = [
    {
      id: "total",
      label: summaryText.total.label,
      value: formatCount(summary.total),
      helper: formatMessage(filterText.usageSummary, {
        active: summary.active,
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
    <AdminSummaryMetricCards
      ariaLabel={summaryText.ariaLabel}
      cards={metrics}
      className={className}
      density="compact"
      gridClassName="grid gap-2 min-[560px]:grid-cols-2 min-[1080px]:grid-cols-4"
    />
  );
}
