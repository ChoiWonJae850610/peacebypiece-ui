import { formatPbpNumberWithUnit } from "@/lib/utils/formatters";

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


export type AdminPremiumStatsReadinessItem = {
  key: string;
  title: string;
  statusLabel: "가능" | "부분 가능" | "준비 필요";
  dataSource: string;
  nextAction: string;
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
  return formatPbpNumberWithUnit(value, suffix);
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
      description: "운영 데이터 기준으로 생산 유형별 작업지시서 분포를 비교합니다.",
    },
    {
      key: "factory-performance",
      featureKey: "stats.factory",
      title: "협력업체 성과",
      planLabel: "Standard",
      statusLabel: factoryTopValue > 0 ? "연결됨" : "준비",
      metricLabel: "공장별 발주 건수",
      metricValue: buildMetricValue(input.factoryTopLabel, factoryTopValue),
      description: "공장별 발주 건수를 먼저 확인하고, 수량/비용/납기 지표는 단계적으로 확장합니다.",
    },
    {
      key: "reorder-ranking",
      featureKey: "stats.reorder",
      title: "리오더 랭킹",
      planLabel: "Growth",
      statusLabel: reorderTopValue > 0 ? "연결됨" : "준비",
      metricLabel: `리오더 합계 ${formatAdminPreviewCount(input.totalReorderCount)}`,
      metricValue: buildMetricValue(input.reorderTopLabel, reorderTopValue),
      description: "2차 이상 반복 생산 흐름을 분리해 리오더 지표로 표시합니다.",
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
  "Standard 이상은 생산품유형과 협력업체 성과 지표를 운영 데이터 기준으로 노출합니다.",
  "Growth 이상은 리오더 지표를 연결하고, Premium 이상은 검수/불량과 내보내기 기능을 확장하는 기준으로 둡니다.",
  "현재 잠금 표시는 화면 안내 기준이며, 실제 제한 기준은 권한 정책 버전에서 별도 적용합니다.",
] as const;


export const ADMIN_PREMIUM_STATS_READINESS_ITEMS: AdminPremiumStatsReadinessItem[] = [
  {
    key: "quality-defect-rate",
    title: "검수/불량률",
    statusLabel: "준비 필요",
    dataSource: "검수 결과와 불량 수량을 저장하는 전용 필드가 아직 확정되지 않았습니다.",
    nextAction: "검수 완료 액션에서 불량 수량, 검사 수량, 사유 코드를 저장할 schema를 먼저 확정합니다.",
  },
  {
    key: "delivery-delay-rate",
    title: "납기 지연율",
    statusLabel: "부분 가능",
    dataSource: "작업지시서/발주 데이터의 납기일과 완료일 후보를 기준으로 계산할 수 있으나, 실제 완료 기준일 정책이 필요합니다.",
    nextAction: "발주 단위 due_date, completed_at, inspection_completed_at 중 통계 기준일을 하나로 고정합니다.",
  },
  {
    key: "factory-cost-risk",
    title: "공장별 비용/위험",
    statusLabel: "부분 가능",
    dataSource: "orders의 factory_name과 비용 후보 필드를 사용할 수 있으나, 공임/로스/외주비 합산 기준이 아직 분리되어 있습니다.",
    nextAction: "공장별 총비용은 labor_cost, loss_cost, outsourcing_cost 등 비용 컬럼 확정 후 연결합니다.",
  },
  {
    key: "stats-export",
    title: "통계 내보내기",
    statusLabel: "준비 필요",
    dataSource: "현재 화면 집계값은 표시용 snapshot 중심이며, export 전용 DTO와 권한 차단이 아직 없습니다.",
    nextAction: "권한 정책 작업 후 CSV 내보내기와 감사 기록 기준을 함께 설계합니다.",
  },
];
