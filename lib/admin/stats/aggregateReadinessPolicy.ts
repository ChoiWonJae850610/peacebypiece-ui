export type AdminStatsAggregateReadinessStatus = "유지" | "검토" | "보류";

export type AdminStatsAggregateReadinessItem = {
  key: string;
  title: string;
  status: AdminStatsAggregateReadinessStatus;
  currentStrategy: string;
  summaryCandidate: string;
  materializedViewCandidate: string;
  decision: string;
};

export const ADMIN_STATS_AGGREGATE_READINESS_POLICY = {
  status: "검토 기준 고정",
  noSchemaChange: "0.9.214에서는 summary table이나 materialized view를 새로 만들지 않습니다.",
  nextStep: "실제 API 응답 시간이 성능 기준을 초과할 때 별도 DB schema 버전에서 반영합니다.",
  preferredOrder: [
    "기존 aggregate SQL 최적화",
    "필요 index 보강",
    "summary table 일/월 단위 저장",
    "materialized view 또는 batch refresh 검토",
  ],
} as const;

export const ADMIN_STATS_AGGREGATE_READINESS_ITEMS: AdminStatsAggregateReadinessItem[] = [
  {
    key: "workorder-overview",
    title: "작업지시서 overview",
    status: "유지",
    currentStrategy: "현재는 spec_sheets 기준 aggregate SQL로 충분합니다.",
    summaryCandidate: "company_workorder_daily_stats / company_workorder_monthly_stats",
    materializedViewCandidate: "초기에는 불필요합니다.",
    decision: "작업지시서 수가 크게 늘기 전까지 실시간 aggregate SQL을 유지합니다.",
  },
  {
    key: "storage-usage",
    title: "저장소 사용량",
    status: "검토",
    currentStrategy: "attachments metadata 기준 합산으로 계산합니다.",
    summaryCandidate: "company_storage_daily_stats",
    materializedViewCandidate: "월별 추세가 느려질 때 검토합니다.",
    decision: "용량 추이와 purge 상태는 summary table 후보로 유지합니다.",
  },
  {
    key: "partner-factory",
    title: "협력업체/공장 성과",
    status: "검토",
    currentStrategy: "orders와 partners 조인 기준으로 계산합니다.",
    summaryCandidate: "company_factory_monthly_stats",
    materializedViewCandidate: "비용/납기/불량을 함께 묶을 때 검토합니다.",
    decision: "Standard/Growth 통계가 느려질 경우 월 단위 summary table을 추가합니다.",
  },
  {
    key: "quality-risk",
    title: "검수/불량 위험",
    status: "보류",
    currentStrategy: "검수 결과 저장 기준이 아직 확정되지 않았습니다.",
    summaryCandidate: "company_quality_monthly_stats",
    materializedViewCandidate: "검수 event log가 생긴 뒤 검토합니다.",
    decision: "Premium 통계 schema 확정 전까지 테이블 생성을 보류합니다.",
  },
  {
    key: "system-company-usage",
    title: "시스템 고객사 사용량",
    status: "검토",
    currentStrategy: "system 통계 화면은 sample 기반 UI 기준으로 표시합니다.",
    summaryCandidate: "system_company_usage_daily_stats",
    materializedViewCandidate: "고객사가 늘고 cross-company 집계가 느려질 때 검토합니다.",
    decision: "초기에는 즉시 생성하지 않고 운영 데이터 증가 후 판단합니다.",
  },
];
