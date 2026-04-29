import type { AdminDomainKey } from "@/lib/admin/domainRegistry";

export type AdminDbConnectionState = "db-ready" | "adapter-ready" | "mock-fallback" | "read-only-db";

export type AdminDbIntegrationPoint = {
  domain: Extract<AdminDomainKey, "stats" | "history" | "files" | "partner" | "settings">;
  label: string;
  state: AdminDbConnectionState;
  tables: readonly string[];
  repositoryPath: string;
  adapterPath: string | null;
  apiRoutes: readonly string[];
  readBoundary: string;
  writeBoundary: string | null;
  fallback: string | null;
  nextDbAction: string;
};

export const ADMIN_DB_INTEGRATION_POINTS: readonly AdminDbIntegrationPoint[] = [
  {
    domain: "stats",
    label: "관리자 통계",
    state: "read-only-db",
    tables: ["spec_sheets", "partners", "partner_items", "attachments"],
    repositoryPath: "lib/admin/stats/repository.ts",
    adapterPath: null,
    apiRoutes: ["app/admin/dashboard/page.tsx"],
    readBoundary: "getAdminStatsSnapshot",
    writeBoundary: null,
    fallback: "DB 미설정/조회 실패 시 빈 통계 snapshot 반환",
    nextDbAction: "실제 DB 스키마 확정 후 status/item_type/attachment 컬럼명만 최종 검증",
  },
  {
    domain: "history",
    label: "관리자 히스토리",
    state: "db-ready",
    tables: ["history_logs", "users"],
    repositoryPath: "lib/admin/history/repository.ts",
    adapterPath: null,
    apiRoutes: ["app/admin/history/page.tsx"],
    readBoundary: "listAdminHistoryEvents",
    writeBoundary: "createAdminHistoryLogSafe",
    fallback: "DB 미설정/조회 실패 시 빈 히스토리 목록 반환",
    nextDbAction: "WorkOrder/파일/설정 actionFlow에서 history write 호출 누락 지점만 연결",
  },
  {
    domain: "files",
    label: "관리자 파일/저장소",
    state: "adapter-ready",
    tables: ["attachments", "company_settings"],
    repositoryPath: "lib/admin/files/serverActions.ts",
    adapterPath: "lib/admin/files/adapter.ts",
    apiRoutes: ["app/api/admin/files/snapshot/route.ts"],
    readBoundary: "getAdminFileManagementSnapshot",
    writeBoundary: "admin file server actions",
    fallback: "DB 대기 snapshot / 빈 파일 목록",
    nextDbAction: "R2 object key와 attachments soft-delete/purge 컬럼 기준 최종 확정",
  },
  {
    domain: "partner",
    label: "거래처/공장 관리",
    state: "adapter-ready",
    tables: ["partners", "partner_items", "outsourcing_processes", "units"],
    repositoryPath: "lib/partners/partnerRepository.ts",
    adapterPath: "lib/partners/partnerAdapter.ts",
    apiRoutes: ["app/api/admin/partners/route.ts", "app/api/partners/factories/route.ts", "app/api/partners/workorder-options/route.ts"],
    readBoundary: "createPartnerRepository().list*",
    writeBoundary: "PartnerWritableRepository methods",
    fallback: "PARTNER_REPOSITORY_MODE=mock 또는 DB 미연결 시 mockPartnerRepository",
    nextDbAction: "PARTNER_REPOSITORY_MODE=db 전환 후 관리자/작지 선택 UI 양쪽 회귀 테스트",
  },
  {
    domain: "settings",
    label: "회사/기준정보 설정",
    state: "db-ready",
    tables: ["companies", "company_settings", "units", "item_categories"],
    repositoryPath: "lib/admin/settings/companyRepository.ts, lib/admin/settings/standardsRepository.ts",
    adapterPath: null,
    apiRoutes: ["app/api/admin/companies/route.ts", "app/api/admin/companies/current/route.ts", "app/api/admin/standards/route.ts"],
    readBoundary: "getCompanySettings / getAdminStandards",
    writeBoundary: "updateCompanySettings / replaceAdminStandards",
    fallback: "DB 미설정 시 기본 회사 설정/기준정보 반환",
    nextDbAction: "초기 seed SQL과 company_id scope 기준만 최종 동기화",
  },
] as const;

export function getAdminDbIntegrationPoints(): readonly AdminDbIntegrationPoint[] {
  return ADMIN_DB_INTEGRATION_POINTS;
}

export function getAdminDbIntegrationPoint(domain: AdminDbIntegrationPoint["domain"]): AdminDbIntegrationPoint | undefined {
  return ADMIN_DB_INTEGRATION_POINTS.find((item) => item.domain === domain);
}
