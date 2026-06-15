import { AppBadge, AppCard } from "@/components/common/ui";
import { useI18n } from "@/lib/i18n";

export type WorkOrderDetailVisualSummaryProps = {
  orderCount: number;
  outsourcingCount: number;
  materialCount: number;
  showCostSummary: boolean;
};

function formatCount(value: number, suffix: string) {
  return `${Math.max(0, value).toLocaleString()}${suffix}`;
}

function formatDescription(template: string, values: Record<string, number>) {
  return Object.entries(values).reduce(
    (message, [key, value]) => message.replace(`{${key}}`, value.toLocaleString()),
    template,
  );
}

export default function WorkOrderDetailVisualSummary({
  orderCount,
  outsourcingCount,
  materialCount,
  showCostSummary,
}: WorkOrderDetailVisualSummaryProps) {
  const { i18n } = useI18n();
  const copy = i18n.workorder.ui.visualSummary;
  const productionCount = orderCount + outsourcingCount;
  const cards = [
    {
      label: copy.productionLabel,
      value: productionCount > 0 ? formatCount(productionCount, copy.productionCountSuffix) : copy.productionEmpty,
      description: outsourcingCount > 0
        ? formatDescription(copy.productionDescriptionFormat, { orderCount, outsourcingCount })
        : copy.productionDescriptionEmpty,
    },
    {
      label: copy.materialLabel,
      value: materialCount > 0 ? formatCount(materialCount, copy.materialCountSuffix) : copy.materialEmpty,
      description: copy.materialDescription,
    },
    {
      label: copy.costLabel,
      value: showCostSummary ? copy.costVisible : copy.costHidden,
      description: showCostSummary ? copy.costVisibleDescription : copy.costHiddenDescription,
    },
  ];

  return (
    <div className="mt-4 grid gap-2 md:grid-cols-3">
      {cards.map((card) => (
        <AppCard key={card.label} variant="subtle" padding="sm">
          <AppBadge tone="strong" size="sm">{card.label}</AppBadge>
          <div className="mt-2 text-sm font-semibold pbp-text-primary">{card.value}</div>
          <div className="mt-0.5 truncate text-[11px] pbp-text-subtle">{card.description}</div>
        </AppCard>
      ))}
    </div>
  );
}
