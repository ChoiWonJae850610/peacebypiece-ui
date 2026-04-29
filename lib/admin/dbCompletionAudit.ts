import { PARTNER_REPOSITORY_MODE, WORKORDER_REPOSITORY_MODE, ATTACHMENT_MEMO_REPOSITORY_MODE } from "@/lib/constants/app";

const SUPPORTED_DATABASE_ENV_KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
  "NEON_DATABASE_URL",
] as const;

export type AdminDbScreenAuditStatus = "db-connected" | "db-prepared" | "fallback-guarded" | "mock-only" | "not-applicable";
export type AdminDbScreenAuditSourceType = "actual-db" | "db-with-fallback" | "db-prepared-fallback" | "mock-only" | "not-applicable";

export type AdminDbScreenAuditItem = {
  key: "operations" | "stats" | "history" | "files" | "partner" | "settings";
  screen: string;
  routePath: string;
  status: AdminDbScreenAuditStatus;
  sourceType: AdminDbScreenAuditSourceType;
  readSource: string;
  writeSource: string;
  fallback: string;
  nextCheck: string;
};

export type AdminDbCompletionSummary = {
  repositoryModes: {
    workorder: typeof WORKORDER_REPOSITORY_MODE;
    partner: typeof PARTNER_REPOSITORY_MODE;
    attachmentMemo: typeof ATTACHMENT_MEMO_REPOSITORY_MODE;
  };
  supportedEnvKeys: readonly string[];
  items: readonly AdminDbScreenAuditItem[];
};

export const ADMIN_DB_SCREEN_AUDIT_ITEMS: readonly AdminDbScreenAuditItem[] = [
  {
    key: "operations",
    screen: "관리자 메인 운영 대시보드",
    routePath: "app/admin/page.tsx",
    status: "fallback-guarded",
    sourceType: "db-with-fallback",
    readSource: "lib/admin/adminOperations.repository.ts → spec_sheets/orders 조회",
    writeSource: "읽기 전용",
    fallback: "DB 미설정/조회 실패 시 0건 snapshot",
    nextCheck: "spec_sheets.status와 orders.due_date 실제 데이터 기준 그래프 값 확인",
  },
  {
    key: "stats",
    screen: "대시보드 통계",
    routePath: "app/admin/dashboard/page.tsx",
    status: "fallback-guarded",
    sourceType: "db-with-fallback",
    readSource: "lib/admin/stats/repository.ts → spec_sheets/partners/partner_items/attachments 조회",
    writeSource: "읽기 전용",
    fallback: "DB 미설정/조회 실패 시 빈 통계 snapshot",
    nextCheck: "파트너 유형과 첨부 용량 집계가 실제 컬럼명과 일치하는지 확인",
  },
  {
    key: "history",
    screen: "히스토리",
    routePath: "app/admin/history/page.tsx",
    status: "fallback-guarded",
    sourceType: "db-with-fallback",
    readSource: "lib/admin/history/repository.ts → history_logs 조회",
    writeSource: "createAdminHistoryLogSafe",
    fallback: "DB 미설정/조회 실패 시 빈 목록",
    nextCheck: "작업지시서/파일/설정 actionFlow에서 히스토리 기록 호출 누락 여부 확인",
  },
  {
    key: "files",
    screen: "저장소 관리",
    routePath: "app/admin/files/page.tsx",
    status: "db-prepared",
    sourceType: "db-prepared-fallback",
    readSource: "app/api/admin/files/snapshot/route.ts → attachments/company_settings 조회",
    writeSource: "admin file server actions",
    fallback: "조회 실패 시 기본 snapshot 반환",
    nextCheck: "R2 object key, soft-delete, purge 컬럼 기준 실제 삭제/복구 테스트",
  },
  {
    key: "partner",
    screen: "거래처/공장 관리",
    routePath: "app/admin/partners/page.tsx",
    status: "db-prepared",
    sourceType: "db-prepared-fallback",
    readSource: "app/api/admin/partners/route.ts → createPartnerRepository(db)",
    writeSource: "PartnerWritableRepository create/update/replace methods",
    fallback: "API 실패 시 빈 목록. mode가 mock이면 mockPartnerRepository 사용 가능",
    nextCheck: "PARTNER_REPOSITORY_MODE=db 유지 상태에서 등록/수정/외주공정 저장 회귀 테스트",
  },
  {
    key: "settings",
    screen: "환경설정/기준정보",
    routePath: "app/admin/settings/page.tsx, app/admin/units/page.tsx",
    status: "fallback-guarded",
    sourceType: "db-with-fallback",
    readSource: "companyRepository/standardsRepository → companies/company_settings/units/item_categories 조회",
    writeSource: "updateCompanySettings / replaceAdminStandards",
    fallback: "DB 미설정 시 기본 회사 설정/기준정보 반환",
    nextCheck: "초기 seed SQL과 company_id scope 기준 동기화",
  },
] as const;

export function getAdminDbCompletionSummary(): AdminDbCompletionSummary {
  return {
    repositoryModes: {
      workorder: WORKORDER_REPOSITORY_MODE,
      partner: PARTNER_REPOSITORY_MODE,
      attachmentMemo: ATTACHMENT_MEMO_REPOSITORY_MODE,
    },
    supportedEnvKeys: SUPPORTED_DATABASE_ENV_KEYS,
    items: ADMIN_DB_SCREEN_AUDIT_ITEMS,
  };
}

export function getAdminDbCompletionStatusLabel(status: AdminDbScreenAuditStatus): string {
  if (status === "db-connected") return "DB 연결";
  if (status === "db-prepared") return "DB 준비";
  if (status === "fallback-guarded") return "DB+fallback";
  if (status === "mock-only") return "mock only";
  return "대상 아님";
}

export function getAdminDbSourceTypeLabel(sourceType: AdminDbScreenAuditSourceType): string {
  if (sourceType === "actual-db") return "실제 DB 조회/저장";
  if (sourceType === "db-with-fallback") return "실제 DB 조회 + fallback 보호";
  if (sourceType === "db-prepared-fallback") return "DB 준비 + fallback";
  if (sourceType === "mock-only") return "mock only";
  return "대상 아님";
}
