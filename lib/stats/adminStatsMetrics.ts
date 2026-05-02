export interface AdminStatsMetricDefinition {
  key: string;
  label: string;
  description: string;
  group:
    | "workorder"
    | "workflow"
    | "production"
    | "partner"
    | "category"
    | "storage";
}

export const ADMIN_STATS_COUNT_METRICS: AdminStatsMetricDefinition[] = [
  {
    key: "workorders.total",
    label: "전체 작업지시서",
    description: "고객사 전체 작업지시서 수",
    group: "workorder",
  },
  {
    key: "workorders.draft",
    label: "작성중",
    description: "작성중 상태의 작업지시서 수",
    group: "workflow",
  },
  {
    key: "workorders.review_requested",
    label: "검토요청",
    description: "검토요청 상태의 작업지시서 수",
    group: "workflow",
  },
  {
    key: "workorders.reviewed",
    label: "검토완료",
    description: "검토완료 상태의 작업지시서 수",
    group: "workflow",
  },
  {
    key: "workorders.inspection",
    label: "생산/검수",
    description: "생산 또는 검수 진행 중인 작업지시서 수",
    group: "workflow",
  },
  {
    key: "workorders.completed",
    label: "완료",
    description: "완료된 작업지시서 수",
    group: "workflow",
  },
  {
    key: "designers.workload",
    label: "디자이너별 작업량",
    description: "디자이너별 담당 작업지시서 수",
    group: "production",
  },
  {
    key: "factories.production",
    label: "공장별 생산량",
    description: "공장별 생산 진행 또는 완료 수량",
    group: "partner",
  },
  {
    key: "categories.production",
    label: "카테고리별 생산량",
    description: "품목 카테고리별 생산량",
    group: "category",
  },
  {
    key: "attachments.count",
    label: "첨부파일 수",
    description: "고객사 첨부파일 수",
    group: "storage",
  },
  {
    key: "storage.used_bytes",
    label: "저장공간 사용량",
    description: "DB attachment metadata 기준 저장공간 사용량",
    group: "storage",
  },
];

export const ADMIN_STATS_SERIES_KEYS = {
  MONTHLY_WORKORDERS: "monthly.workorders",
  STATUS_WORKORDERS: "status.workorders",
  DESIGNER_WORKLOAD: "designer.workload",
  FACTORY_PRODUCTION: "factory.production",
  CATEGORY_PRODUCTION: "category.production",
  STORAGE_USAGE: "storage.usage",
} as const;

export const ADMIN_STATS_REPOSITORY_NOTES = [
  "월별 작업지시서 수는 repository query에서 집계한다.",
  "상태별 작업지시서 수는 상태 문자열이 아니라 상태 policy/상수 기준으로 매핑한다.",
  "디자이너별 작업량은 화면에서 reduce하지 않고 selector/repository에서 계산한다.",
  "공장별 생산량과 카테고리별 생산량은 생산구성/발주정보 연결 후 query로 보강한다.",
  "첨부파일/용량 사용량은 storage usage snapshot 또는 attachment metadata 기준을 우선한다.",
] as const;
