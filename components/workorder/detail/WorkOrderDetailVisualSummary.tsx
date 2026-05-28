import { AppBadge, AppCard } from "@/components/common/ui";

export type WorkOrderDetailVisualSummaryProps = {
  orderCount: number;
  outsourcingCount: number;
  materialCount: number;
  showCostSummary: boolean;
};

function formatCount(value: number, suffix: string) {
  return `${Math.max(0, value).toLocaleString()}${suffix}`;
}

export default function WorkOrderDetailVisualSummary({
  orderCount,
  outsourcingCount,
  materialCount,
  showCostSummary,
}: WorkOrderDetailVisualSummaryProps) {
  const productionCount = orderCount + outsourcingCount;
  const cards = [
    {
      label: "생산",
      value: productionCount > 0 ? formatCount(productionCount, "건") : "미입력",
      description: outsourcingCount > 0 ? `봉제 ${orderCount} · 외주 ${outsourcingCount}` : "봉제/외주 공정",
    },
    {
      label: "자재",
      value: materialCount > 0 ? formatCount(materialCount, "종") : "미입력",
      description: "원단·부자재 구성",
    },
    {
      label: "원가",
      value: showCostSummary ? "표시 중" : "비공개",
      description: showCostSummary ? "관리자 비용 요약 사용" : "권한에 따라 숨김",
    },
  ];

  return (
    <div className="mt-4 grid gap-2 md:grid-cols-3">
      {cards.map((card) => (
        <AppCard key={card.label} variant="subtle" padding="sm" className="rounded-2xl">
          <AppBadge tone="strong" size="sm">{card.label}</AppBadge>
          <div className="mt-2 text-sm font-semibold pbp-text-primary">{card.value}</div>
          <div className="mt-0.5 truncate text-[11px] pbp-text-subtle">{card.description}</div>
        </AppCard>
      ))}
    </div>
  );
}
