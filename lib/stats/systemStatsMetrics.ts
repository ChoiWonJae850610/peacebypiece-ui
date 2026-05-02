export interface SystemStatsMetricDefinition {
  key: string;
  label: string;
  description: string;
  group:
    | "company"
    | "storage"
    | "billing"
    | "invitation"
    | "activity";
}

export const SYSTEM_STATS_COUNT_METRICS: SystemStatsMetricDefinition[] = [
  {
    key: "companies.total",
    label: "전체 고객사",
    description: "등록된 전체 고객사 수",
    group: "company",
  },
  {
    key: "companies.active",
    label: "활성 고객사",
    description: "활성 상태 고객사 수",
    group: "company",
  },
  {
    key: "storage.used_bytes",
    label: "전체 저장용량",
    description: "전체 고객사 저장공간 사용량",
    group: "storage",
  },
  {
    key: "storage.company_top",
    label: "고객사별 저장용량",
    description: "고객사별 저장공간 사용량 순위",
    group: "storage",
  },
  {
    key: "plans.starter",
    label: "Starter 고객 수",
    description: "Starter 요금제 고객사 수",
    group: "billing",
  },
  {
    key: "plans.team",
    label: "Team 고객 수",
    description: "Team 요금제 고객사 수",
    group: "billing",
  },
  {
    key: "plans.business",
    label: "Business 고객 수",
    description: "Business 요금제 고객사 수",
    group: "billing",
  },
  {
    key: "invitations.created",
    label: "초대 생성",
    description: "기간 내 생성된 초대 수",
    group: "invitation",
  },
  {
    key: "invitations.accepted",
    label: "초대 수락",
    description: "기간 내 수락된 초대 수",
    group: "invitation",
  },
  {
    key: "invitations.pending",
    label: "대기중 초대",
    description: "아직 수락되지 않은 pending 초대 수",
    group: "invitation",
  },
];

export const SYSTEM_STATS_SERIES_KEYS = {
  COMPANY_STORAGE_USAGE: "company.storage_usage",
  PLAN_COMPANIES: "plan.companies",
  INVITATION_STATUS: "invitation.status",
  ACTIVE_COMPANIES: "company.active",
} as const;

export const SYSTEM_STATS_REPOSITORY_NOTES = [
  "고객사 수와 활성 고객사 수는 companies 기준으로 집계한다.",
  "전체 저장용량과 고객사별 저장용량은 storage_usage_snapshots 최신값 기준을 우선한다.",
  "요금제별 고객 수는 company_plan_assignments의 active assignment 기준으로 계산한다.",
  "초대 발송/수락 현황은 invitations status와 created_at/accepted_at 기준으로 계산한다.",
  "시스템관리자 통계도 화면에서 직접 계산하지 않고 stats repository를 통해 제공한다.",
] as const;
