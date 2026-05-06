export type AdminStatsFeatureKey =
  | "stats.category"
  | "stats.factory"
  | "stats.reorder"
  | "stats.quality"
  | "stats.storageAdvanced"
  | "stats.export";

export type AdminStatsPlanTier = "Basic" | "Standard" | "Growth" | "Premium" | "Enterprise";

export type AdminStatsPreviewCard = {
  key: string;
  featureKey: AdminStatsFeatureKey;
  title: string;
  planLabel: AdminStatsPlanTier;
  statusLabel: string;
  metricLabel: string;
  metricValue: string;
  description: string;
};

export type AdminAdvancedStatsPreviewInput = {
  categoryTopLabel?: string;
  categoryTopValue?: number;
  factoryTopLabel?: string;
  factoryTopValue?: number;
  reorderTopLabel?: string;
  reorderTopValue?: number;
  totalReorderCount?: number;
  qualityRiskCount?: number;
};

function formatAdminPreviewCount(value: number | undefined, suffix = "건") {
  const normalized = Number.isFinite(value) ? Math.max(0, Math.round(value ?? 0)) : 0;
  return `${normalized.toLocaleString("ko-KR")}${suffix}`;
}

function buildMetricValue(label: string | undefined, value: number | undefined) {
  const normalizedLabel = label && label.trim().length > 0 ? label : "데이터 없음";
  return `${normalizedLabel} · ${formatAdminPreviewCount(value)}`;
}

export function buildAdminAdvancedStatsPreviewCards(input: AdminAdvancedStatsPreviewInput): AdminStatsPreviewCard[] {
  const categoryTopValue = input.categoryTopValue ?? 0;
  const factoryTopValue = input.factoryTopValue ?? 0;
  const reorderTopValue = input.reorderTopValue ?? 0;
  const qualityRiskCount = input.qualityRiskCount ?? 0;

  return [
    {
      key: "category-top",
      featureKey: "stats.category",
      title: "생산품유형 TOP",
      planLabel: "Standard",
      statusLabel: categoryTopValue > 0 ? "연결됨" : "준비",
      metricLabel: "3차 분류 기준",
      metricValue: buildMetricValue(input.categoryTopLabel, categoryTopValue),
      description: "실제 DB 집계 기준으로 생산 유형별 작업지시서 분포를 비교합니다.",
    },
    {
      key: "factory-performance",
      featureKey: "stats.factory",
      title: "협력업체 성과",
      planLabel: "Standard",
      statusLabel: factoryTopValue > 0 ? "연결됨" : "준비",
      metricLabel: "공장별 발주 건수",
      metricValue: buildMetricValue(input.factoryTopLabel, factoryTopValue),
      description: "공장별 발주 건수 preview를 먼저 연결하고, 수량/비용/납기 지표는 후속 버전에서 확장합니다.",
    },
    {
      key: "reorder-ranking",
      featureKey: "stats.reorder",
      title: "리오더 랭킹",
      planLabel: "Growth",
      statusLabel: reorderTopValue > 0 ? "연결됨" : "준비",
      metricLabel: `리오더 합계 ${formatAdminPreviewCount(input.totalReorderCount)}`,
      metricValue: buildMetricValue(input.reorderTopLabel, reorderTopValue),
      description: "2차 이상 반복 생산 흐름을 분리해 리오더 preview로 표시합니다.",
    },
    {
      key: "quality-risk",
      featureKey: "stats.quality",
      title: "검수/불량 위험",
      planLabel: "Premium",
      statusLabel: qualityRiskCount > 0 ? "연결됨" : "준비",
      metricLabel: "검수 기준",
      metricValue: qualityRiskCount > 0 ? formatAdminPreviewCount(qualityRiskCount) : "불량률 준비",
      description: "검수 결과와 불량 수량 저장 구조가 확정되면 업체별 품질 위험을 비교합니다.",
    },
  ];
}

export const ADMIN_STATS_FEATURE_GATE_NOTES = [
  "Basic은 상태별 작업지시서, 기본 저장소, 최근 작업 흐름만 노출합니다.",
  "Standard 이상은 생산품유형과 협력업체 성과 preview를 실제 DB 집계 기준으로 노출합니다.",
  "Growth 이상은 리오더 preview를 연결하고, Premium 이상은 검수/불량과 export 기능을 확장하는 기준으로 둡니다.",
  "현재 버전의 잠금은 화면 기준 preview이며, API 차단은 permission/feature gate 버전에서 별도 적용합니다.",
] as const;
