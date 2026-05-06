export type AdminStatsFeatureKey =
  | "stats.category"
  | "stats.factory"
  | "stats.reorder"
  | "stats.quality"
  | "stats.storageAdvanced"
  | "stats.export";

export type AdminStatsPlanTier = "Basic" | "Standard" | "Premium" | "Enterprise";

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

export const ADMIN_ADVANCED_STATS_PREVIEW_CARDS: AdminStatsPreviewCard[] = [
  {
    key: "category-top",
    featureKey: "stats.category",
    title: "생산품유형 TOP",
    planLabel: "Standard",
    statusLabel: "잠금",
    metricLabel: "3차 분류 기준",
    metricValue: "TOP 5",
    description: "티셔츠, 셔츠, 팬츠처럼 실제 생산 유형별 발주 수량과 리오더 흐름을 비교합니다.",
  },
  {
    key: "factory-performance",
    featureKey: "stats.factory",
    title: "협력업체 성과",
    planLabel: "Standard",
    statusLabel: "잠금",
    metricLabel: "공장별 집계",
    metricValue: "수량/비용",
    description: "공장별 발주 건수, 총 수량, 총 비용을 같은 기준으로 비교합니다.",
  },
  {
    key: "reorder-ranking",
    featureKey: "stats.reorder",
    title: "리오더 랭킹",
    planLabel: "Premium",
    statusLabel: "잠금",
    metricLabel: "반복 생산",
    metricValue: "리오더율",
    description: "반복 생산이 많은 유형과 작업지시서의 재생산 흐름을 추적합니다.",
  },
  {
    key: "quality-risk",
    featureKey: "stats.quality",
    title: "검수/불량 위험",
    planLabel: "Premium",
    statusLabel: "준비",
    metricLabel: "검수 기준",
    metricValue: "불량률",
    description: "검수 결과와 불량 수량이 저장되면 업체별 품질 위험을 비교합니다.",
  },
];

export const ADMIN_STATS_FEATURE_GATE_NOTES = [
  "Basic은 상태별 작업지시서, 기본 저장소, 최근 작업 흐름만 노출합니다.",
  "Standard 이상은 생산품유형, 협력업체, 리오더 preview를 노출할 수 있습니다.",
  "Premium 이상은 검수/불량, 납기 지연, export 기능을 연결하는 기준으로 둡니다.",
  "현재 버전의 잠금은 화면 기준 preview이며, API 차단은 permission/feature gate 버전에서 별도 적용합니다.",
] as const;
