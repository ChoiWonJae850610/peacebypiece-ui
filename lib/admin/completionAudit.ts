import { ADMIN_DOMAIN_STRUCTURE, type AdminDomainKey } from "@/lib/admin/domainRegistry";
import { getAdminDbCompletionSummary, type AdminDbScreenAuditStatus } from "@/lib/admin/dbCompletionAudit";
import { getAdminFinalAuditSummary } from "@/lib/admin/finalAdminAudit";
import { formatAdminMockAuditSummary, getAdminMockAuditSummary } from "@/lib/admin/mockDataAudit";
import { buildAdminDomainAuditItems, getAdminLegacyPathAuditItems } from "@/lib/admin/structureAudit";

export type AdminCompletionAuditStatus = "complete" | "watch" | "blocked";

export type AdminCompletionAuditStatusPresentation = {
  label: string;
  className: string;
};
export type AdminCompletionDecision = "close-admin-v1" | "continue-admin-hardening" | "blocked";

export type AdminCompletionAuditItem = {
  key: "structure" | "legacy" | "db" | "ui" | "i18n" | "mock" | "finalAudit";
  label: string;
  status: AdminCompletionAuditStatus;
  summary: string;
  detail: string;
};

export type AdminCompletionAuditSummary = {
  overallStatus: AdminCompletionAuditStatus;
  decision: AdminCompletionDecision;
  decisionLabel: string;
  decisionSummary: string;
  nextScope: string;
  readyDomainCount: number;
  totalDomainCount: number;
  removedLegacyCount: number;
  retainedLegacyCount: number;
  dbConnectedCount: number;
  dbWatchCount: number;
  mockRemoveReadyCount: number;
  mockRetainedCount: number;
  finalAuditWatchCount: number;
  finalAuditTotalCount: number;
  items: readonly AdminCompletionAuditItem[];
};

const UI_STABILIZED_ADMIN_DOMAINS: readonly AdminDomainKey[] = ["stats", "history", "files", "partner", "settings"];

function toCompletionStatus(hasBlockedIssue: boolean, hasWatchIssue: boolean): AdminCompletionAuditStatus {
  if (hasBlockedIssue) return "blocked";
  if (hasWatchIssue) return "watch";
  return "complete";
}

function isDbWatchStatus(status: AdminDbScreenAuditStatus): boolean {
  return status === "db-prepared" || status === "fallback-guarded";
}

function getCompletionDecision(status: AdminCompletionAuditStatus): Pick<AdminCompletionAuditSummary, "decision" | "decisionLabel" | "decisionSummary" | "nextScope"> {
  if (status === "blocked") {
    return {
      decision: "blocked",
      decisionLabel: "관리자 마감 보류",
      decisionSummary: "차단 항목이 있어 WorkOrder 화면 정리로 넘어가기 전 수정이 필요합니다.",
      nextScope: "차단 항목 해소 후 관리자 완료 판정을 다시 실행합니다.",
    };
  }

  if (status === "watch") {
    return {
      decision: "close-admin-v1",
      decisionLabel: "관리자 1차 완료",
      decisionSummary: "차단 항목은 없고, 안전 표시/i18n/mock 정리 점검 항목만 남아 WorkOrder PC 화면 통일로 넘어갈 수 있습니다.",
      nextScope: "WorkOrder/사용자 전환을 진행하면서 관리자 잔여 점검은 회귀 점검 항목으로 유지합니다.",
    };
  }

  return {
    decision: "close-admin-v1",
    decisionLabel: "관리자 완료",
    decisionSummary: "관리자 영역의 구조, UI, DB 상태, legacy 정리 기준이 마감 가능한 상태입니다.",
    nextScope: "다음 구조 작업으로 넘어갈 수 있습니다.",
  };
}

export function getAdminCompletionAuditSummary(): AdminCompletionAuditSummary {
  const domainAuditItems = buildAdminDomainAuditItems();
  const readyDomainCount = domainAuditItems.filter((item) => item.status === "ready").length;
  const partialDomainCount = domainAuditItems.length - readyDomainCount;
  const legacyItems = getAdminLegacyPathAuditItems();
  const removedLegacyCount = legacyItems.filter((item) => item.status === "removed").length;
  const retainedLegacyCount = legacyItems.length - removedLegacyCount;
  const dbSummary = getAdminDbCompletionSummary();
  const dbConnectedCount = dbSummary.items.filter((item) => item.status === "db-connected").length;
  const dbWatchCount = dbSummary.items.filter((item) => isDbWatchStatus(item.status)).length;
  const unstabilizedUiDomains = ADMIN_DOMAIN_STRUCTURE.filter(
    (domain) => domain.key !== "common" && !UI_STABILIZED_ADMIN_DOMAINS.includes(domain.key),
  );
  const mockAuditSummary = getAdminMockAuditSummary();
  const mockRetainedCount = mockAuditSummary.seedRetainedCount + mockAuditSummary.fallbackRetainedCount;
  const finalAuditSummary = getAdminFinalAuditSummary();

  const items: AdminCompletionAuditItem[] = [
    {
      key: "structure",
      label: "도메인 구조",
      status: toCompletionStatus(partialDomainCount > 0, false),
      summary: partialDomainCount > 0 ? `부분 완료 ${partialDomainCount}개` : "필수 계층 충족",
      detail: "stats/history/files/partner/settings 기준 selector, actionFlow, presentation, types 계층을 점검합니다.",
    },
    {
      key: "legacy",
      label: "legacy 정리",
      status: retainedLegacyCount > 0 ? "watch" : "complete",
      summary: `제거 ${removedLegacyCount}개 · 유지 ${retainedLegacyCount}개`,
      detail: "직접 import가 없는 alias는 제거했고, 실제 호환이 필요한 경로만 유지 대상으로 남겼습니다.",
    },
    {
      key: "db",
      label: "DB 연결 상태",
      status: dbWatchCount > 0 ? "watch" : "complete",
      summary: `연결 ${dbConnectedCount}개 · 준비/안전 표시 ${dbWatchCount}개`,
      detail: "모든 화면이 DB 전용 상태는 아니며, 일부는 DB 준비 또는 안전 표시 보호 상태입니다.",
    },
    {
      key: "ui",
      label: "관리자 UI 공통화",
      status: unstabilizedUiDomains.length > 0 ? "watch" : "complete",
      summary: unstabilizedUiDomains.length > 0 ? `점검 필요 ${unstabilizedUiDomains.length}개` : "공통 UI 기준 적용",
      detail: "AdminTable, AdminFilterBar, AdminActionBar, AdminCard 기준으로 관리자 화면 톤을 맞춘 상태입니다.",
    },
    {
      key: "i18n",
      label: "관리자 i18n",
      status: "watch",
      summary: "1차 분리 완료 · 2차 점검 유지",
      detail: "운영 중 보이는 주요 문구는 1차 분리했고, 전체 관리자 문구의 2차 분리는 WorkOrder 전환 후 회귀 점검 대상으로 남깁니다.",
    },
    {
      key: "mock",
      label: "샘플/초기값 정리",
      status: mockAuditSummary.blockedCount > 0 ? "blocked" : mockRetainedCount > 0 ? "watch" : "complete",
      summary: formatAdminMockAuditSummary(mockAuditSummary),
      detail: "고객사 관리자 화면에서 제거할 샘플 표시, 신규 회사 초기값으로 유지할 기준값, 로그인 전환 전까지 필요한 대체 데이터를 구분합니다.",
    },
    {
      key: "finalAudit",
      label: "마감 전 전체 감사",
      status: finalAuditSummary.watchCount > 0 ? "watch" : "complete",
      summary: `점검 유지 ${finalAuditSummary.watchCount}개 · 통과 ${finalAuditSummary.passedCount}개`,
      detail: finalAuditSummary.items.map((item) => `${item.label}: ${item.summary}`).join(" / "),
    },
  ];

  const overallStatus = toCompletionStatus(
    items.some((item) => item.status === "blocked"),
    items.some((item) => item.status === "watch"),
  );
  const decision = getCompletionDecision(overallStatus);

  return {
    overallStatus,
    ...decision,
    readyDomainCount,
    totalDomainCount: domainAuditItems.length,
    removedLegacyCount,
    retainedLegacyCount,
    dbConnectedCount,
    dbWatchCount,
    mockRemoveReadyCount: mockAuditSummary.removeReadyCount,
    mockRetainedCount,
    finalAuditWatchCount: finalAuditSummary.watchCount,
    finalAuditTotalCount: finalAuditSummary.totalCount,
    items,
  };
}

const ADMIN_COMPLETION_AUDIT_STATUS_PRESENTATION: Record<AdminCompletionAuditStatus, AdminCompletionAuditStatusPresentation> = {
  complete: { label: "완료", className: "bg-emerald-50 text-emerald-700 ring-emerald-100" },
  watch: { label: "점검", className: "bg-amber-50 text-amber-700 ring-amber-100" },
  blocked: { label: "차단", className: "bg-rose-50 text-rose-700 ring-rose-100" },
};

export function getAdminCompletionAuditStatusPresentation(status: AdminCompletionAuditStatus): AdminCompletionAuditStatusPresentation {
  return ADMIN_COMPLETION_AUDIT_STATUS_PRESENTATION[status];
}

export function getAdminCompletionAuditStatusLabel(status: AdminCompletionAuditStatus): string {
  return getAdminCompletionAuditStatusPresentation(status).label;
}
