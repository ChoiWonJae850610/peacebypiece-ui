export type AdminStatsCacheScope = "server" | "client" | "export";

export type AdminStatsCachePolicy = {
  key: string;
  scope: AdminStatsCacheScope;
  label: string;
  staleSeconds: number;
  invalidation: string;
  nextStep: string;
};

export const ADMIN_STATS_CACHE_POLICIES: AdminStatsCachePolicy[] = [
  {
    key: "stats-overview-server",
    scope: "server",
    label: "통계 overview 서버 집계",
    staleSeconds: 60,
    invalidation: "기간 필터, 회사 범위, 작업지시서 상태 변경 시 새로 조회",
    nextStep: "API route가 분리되면 Next fetch cache 또는 route-level revalidation 기준을 적용합니다.",
  },
  {
    key: "stats-dashboard-client",
    scope: "client",
    label: "통계 화면 클라이언트 캐싱",
    staleSeconds: 120,
    invalidation: "period query, companyId, feature gate 변경 시 query key 분리",
    nextStep: "TanStack Query 도입 시 통계 화면에 한정해 staleTime 2분을 적용합니다.",
  },
  {
    key: "stats-export",
    scope: "export",
    label: "통계 내보내기",
    staleSeconds: 0,
    invalidation: "내보내기 요청마다 서버에서 재계산",
    nextStep: "Premium export API와 audit log가 준비되기 전까지 캐싱하지 않습니다.",
  },
];

export const ADMIN_STATS_TANSTACK_QUERY_DECISION = {
  status: "보류" as const,
  reason: "현재 통계 화면은 서버 컴포넌트에서 snapshot을 주입받고 있어 즉시 클라이언트 캐싱 라이브러리를 추가할 필요가 없습니다.",
  packageChange: "이번 버전에서는 package.json/package-lock.json을 수정하지 않습니다.",
  adoptionTrigger: "통계 API route가 분리되고 period/company/feature gate 기준으로 클라이언트 재조회가 필요해지는 시점에 도입합니다.",
} as const;
