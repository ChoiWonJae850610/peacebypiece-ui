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
    routePath: "운영 대시보드",
    status: "fallback-guarded",
    sourceType: "db-with-fallback",
    readSource: "작업지시서와 발주 데이터를 기준으로 조회",
    writeSource: "읽기 전용",
    fallback: "DB 미설정/조회 실패 시 빈 운영 통계 표시",
    nextCheck: "실제 작업지시서 상태와 납기일 기준 통계 값 확인",
  },
  {
    key: "stats",
    screen: "대시보드 통계",
    routePath: "통계정보",
    status: "fallback-guarded",
    sourceType: "db-with-fallback",
    readSource: "작업지시서, 협력업체, 첨부파일 데이터를 기준으로 조회",
    writeSource: "읽기 전용",
    fallback: "DB 미설정/조회 실패 시 빈 통계 표시",
    nextCheck: "협력업체 유형과 첨부 용량 집계 기준 확인",
  },
  {
    key: "history",
    screen: "히스토리",
    routePath: "히스토리",
    status: "fallback-guarded",
    sourceType: "db-with-fallback",
    readSource: "작업 기록 데이터를 기준으로 조회",
    writeSource: "주요 작업 후 히스토리 기록",
    fallback: "DB 미설정/조회 실패 시 빈 목록 표시",
    nextCheck: "작업지시서, 파일, 설정 변경 시 기록 누락 여부 확인",
  },
  {
    key: "files",
    screen: "저장소 관리",
    routePath: "저장소 관리",
    status: "db-prepared",
    sourceType: "db-prepared-fallback",
    readSource: "첨부파일과 회사 저장소 설정을 기준으로 조회",
    writeSource: "파일 삭제, 복구, 영구삭제 작업",
    fallback: "조회 실패 시 기본 저장소 현황 표시",
    nextCheck: "실제 파일 삭제, 복구, 영구삭제 흐름 확인",
  },
  {
    key: "partner",
    screen: "거래처/공장 관리",
    routePath: "협력업체 관리",
    status: "db-prepared",
    sourceType: "db-prepared-fallback",
    readSource: "협력업체와 외주공정 데이터를 기준으로 조회",
    writeSource: "협력업체 등록, 수정, 외주공정 저장",
    fallback: "조회 실패 시 빈 협력업체 목록 표시",
    nextCheck: "등록, 수정, 외주공정 저장 흐름 확인",
  },
  {
    key: "settings",
    screen: "환경설정/기준정보",
    routePath: "환경설정/기준정보",
    status: "fallback-guarded",
    sourceType: "db-with-fallback",
    readSource: "회사 설정, 기준정보, 단위, 품목분류를 기준으로 조회",
    writeSource: "환경설정과 기준정보 저장",
    fallback: "DB 미설정 시 기본 회사 설정/기준정보 표시",
    nextCheck: "회사별 데이터 분리와 초기 기준정보 동기화 확인",
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
  if (status === "fallback-guarded") return "DB 조회 보호";
  if (status === "mock-only") return "테스트 데이터";
  return "대상 아님";
}

export function getAdminDbSourceTypeLabel(sourceType: AdminDbScreenAuditSourceType): string {
  if (sourceType === "actual-db") return "실제 DB 조회/저장";
  if (sourceType === "db-with-fallback") return "실제 DB 조회 + 대체 표시 보호";
  if (sourceType === "db-prepared-fallback") return "DB 준비 + 대체 표시";
  if (sourceType === "mock-only") return "테스트 데이터";
  return "대상 아님";
}
