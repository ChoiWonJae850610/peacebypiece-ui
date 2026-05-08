import { ATTACHMENT_MEMO_REPOSITORY_MODE, PARTNER_REPOSITORY_MODE, WORKORDER_REPOSITORY_MODE } from "@/lib/constants/app";

const SUPPORTED_DATABASE_ENV_KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
  "NEON_DATABASE_URL",
] as const;

export type AdminDbScreenAuditStatus = "db-connected" | "db-prepared" | "fallback-guarded" | "mock-only" | "not-applicable";
export type AdminDbScreenAuditSourceType = "actual-db" | "db-with-fallback" | "db-prepared-fallback" | "mock-only" | "not-applicable";
export type AdminRepositoryMode = typeof WORKORDER_REPOSITORY_MODE | typeof PARTNER_REPOSITORY_MODE | typeof ATTACHMENT_MEMO_REPOSITORY_MODE;
export type AdminStatusTone = "success" | "warning" | "info" | "muted";

export type AdminStatusPresentation = {
  label: string;
  tone: AdminStatusTone;
  className: string;
};

export type AdminDbScreenAuditItem = {
  key: "operations" | "stats" | "history" | "files" | "partner" | "settings";
  screen: string;
  routePath: string;
  status: AdminDbScreenAuditStatus;
  sourceType: AdminDbScreenAuditSourceType;
  readSource: string;
  writeSource: string;
  alternateDisplay: string;
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
    alternateDisplay: "조회가 불안정한 경우 빈 운영 통계로 안전하게 표시",
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
    alternateDisplay: "조회가 불안정한 경우 빈 통계로 안전하게 표시",
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
    alternateDisplay: "조회가 불안정한 경우 빈 목록으로 안전하게 표시",
    nextCheck: "작업지시서, 파일, 설정 변경 시 기록 누락 여부 확인",
  },
  {
    key: "files",
    screen: "저장소 관리",
    routePath: "저장소 관리",
    status: "db-prepared",
    sourceType: "db-prepared-fallback",
    readSource: "첨부파일과 회사 저장소 설정을 기준으로 조회",
    writeSource: "파일 삭제, 복원, 삭제 요청 작업",
    alternateDisplay: "조회가 불안정한 경우 기본 저장소 현황으로 안전하게 표시",
    nextCheck: "실제 파일 삭제, 복원, 삭제 요청 흐름 확인",
  },
  {
    key: "partner",
    screen: "거래처/공장 관리",
    routePath: "협력업체 관리",
    status: "db-prepared",
    sourceType: "db-prepared-fallback",
    readSource: "협력업체와 외주공정 데이터를 기준으로 조회",
    writeSource: "협력업체 등록, 수정, 외주공정 저장",
    alternateDisplay: "조회가 불안정한 경우 빈 협력업체 목록으로 안전하게 표시",
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
    alternateDisplay: "회사 설정을 불러오지 못하면 기본 운영 설정으로 안전하게 표시",
    nextCheck: "회사별 데이터 분리와 초기 기준정보 동기화 확인",
  },
] as const;

const ADMIN_DB_STATUS_PRESENTATION: Record<AdminDbScreenAuditStatus, AdminStatusPresentation> = {
  "db-connected": { label: "실제 데이터 사용", tone: "success", className: "bg-emerald-50 text-emerald-700 ring-emerald-100" },
  "db-prepared": { label: "데이터 연결 준비", tone: "warning", className: "bg-amber-50 text-amber-700 ring-amber-100" },
  "fallback-guarded": { label: "안전 표시 보호", tone: "info", className: "bg-sky-50 text-sky-700 ring-sky-100" },
  "mock-only": { label: "샘플 데이터", tone: "muted", className: "bg-stone-100 text-stone-600 ring-stone-200" },
  "not-applicable": { label: "대상 아님", tone: "muted", className: "bg-stone-100 text-stone-500 ring-stone-200" },
};

const ADMIN_DB_SOURCE_TYPE_LABELS: Record<AdminDbScreenAuditSourceType, string> = {
  "actual-db": "실제 데이터 조회/저장",
  "db-with-fallback": "실제 데이터 조회 + 안전 표시",
  "db-prepared-fallback": "데이터 연결 준비 + 안전 표시",
  "mock-only": "샘플 데이터",
  "not-applicable": "대상 아님",
};

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

export function getAdminRepositoryModeLabel(mode: AdminRepositoryMode): string {
  return mode === "db" ? "실제 데이터" : "샘플 데이터";
}

export function getAdminDbCompletionStatusPresentation(status: AdminDbScreenAuditStatus): AdminStatusPresentation {
  return ADMIN_DB_STATUS_PRESENTATION[status];
}

export function getAdminDbCompletionStatusLabel(status: AdminDbScreenAuditStatus): string {
  return getAdminDbCompletionStatusPresentation(status).label;
}

export function getAdminDbSourceTypeLabel(sourceType: AdminDbScreenAuditSourceType): string {
  return ADMIN_DB_SOURCE_TYPE_LABELS[sourceType];
}
