export type AdminStatsPerformanceMetricKey =
  | "workorder-list-load"
  | "workorder-detail-hydrate"
  | "stats-overview-api"
  | "stats-chart-render"
  | "api-error-rate"
  | "r2-operation-failure-rate";

export type AdminStatsPerformanceTarget = {
  key: AdminStatsPerformanceMetricKey;
  label: string;
  target: string;
  measureAt: string;
  recordPolicy: string;
  escalation: string;
};

export const ADMIN_STATS_PERFORMANCE_TARGETS: AdminStatsPerformanceTarget[] = [
  {
    key: "workorder-list-load",
    label: "작업지시서 목록 로딩",
    target: "1초 이하",
    measureAt: "/worker 목록 초기 진입 및 기간/상태 필터 변경",
    recordPolicy: "로컬에서는 DevTools Network와 console time으로 확인하고, 운영 전에는 web-vitals 또는 API 로그로 전환합니다.",
    escalation: "1.5초를 반복 초과하면 목록 query 조건과 hydrate 범위를 먼저 점검합니다.",
  },
  {
    key: "workorder-detail-hydrate",
    label: "작업지시서 상세 hydrate",
    target: "1.5초 이하",
    measureAt: "작업지시서 상세 진입 후 기본 정보, 첨부, 메모가 화면에 안정 표시되는 시점",
    recordPolicy: "상세 화면 container에서 시작/완료 지점을 분리 측정합니다.",
    escalation: "2초를 반복 초과하면 첨부/메모 hydrate와 workspace 조립 순서를 분리 점검합니다.",
  },
  {
    key: "stats-overview-api",
    label: "통계 overview 집계",
    target: "500ms 이하",
    measureAt: "/admin/stats 서버 snapshot 생성 또는 향후 /api/admin/stats/overview 응답",
    recordPolicy: "서버 로그에 company, period, query duration을 기록할 수 있는 구조로 준비합니다.",
    escalation: "800ms를 반복 초과하면 summary table 사용 또는 index 추가 여부를 검토합니다.",
  },
  {
    key: "stats-chart-render",
    label: "차트 렌더링",
    target: "300ms 이하",
    measureAt: "Recharts 기반 차트가 데이터 수신 후 화면에 그려지는 시점",
    recordPolicy: "대량 데이터는 차트에 직접 전달하지 않고 서버에서 TOP N으로 축약합니다.",
    escalation: "500ms를 반복 초과하면 차트 포인트 수, legend layout, client component 범위를 줄입니다.",
  },
  {
    key: "api-error-rate",
    label: "API 에러율",
    target: "1% 미만",
    measureAt: "관리자/시스템 관리자 주요 API 요청 전체",
    recordPolicy: "향후 system_error_logs 또는 operation_logs로 route, action, error_code를 남깁니다.",
    escalation: "1%를 초과하면 최근 배포 버전, route, company 기준으로 원인을 분리합니다.",
  },
  {
    key: "r2-operation-failure-rate",
    label: "R2 upload/purge 실패율",
    target: "0.5% 미만",
    measureAt: "Worker 기반 upload, download, purge 요청",
    recordPolicy: "R2 listObjects 직접 조회 없이 DB metadata의 requested/pending/succeeded/failed 상태로 측정합니다.",
    escalation: "0.5%를 초과하면 Worker 응답, key 생성, purge retry 상태를 우선 확인합니다.",
  },
];

export const ADMIN_STATS_PERFORMANCE_POLICY = {
  status: "측정 기준 고정" as const,
  version: "0.9.213",
  nextStep: "실제 API route와 system_error_logs가 준비되면 측정값을 DB 또는 운영 로그로 저장합니다.",
  noSchemaChange: "이번 버전은 측정 기준만 정리하며 DB schema는 변경하지 않습니다.",
} as const;
