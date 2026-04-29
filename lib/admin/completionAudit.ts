import { ADMIN_DOMAIN_STRUCTURE, type AdminDomainKey } from "@/lib/admin/domainRegistry";
import { getAdminDbCompletionSummary, type AdminDbScreenAuditStatus } from "@/lib/admin/dbCompletionAudit";
import { buildAdminDomainAuditItems, getAdminLegacyPathAuditItems } from "@/lib/admin/structureAudit";

export type AdminCompletionAuditStatus = "complete" | "watch" | "blocked";

export type AdminCompletionAuditItem = {
  key: "structure" | "legacy" | "db" | "ui" | "i18n";
  label: string;
  status: AdminCompletionAuditStatus;
  summary: string;
  detail: string;
};

export type AdminCompletionAuditSummary = {
  overallStatus: AdminCompletionAuditStatus;
  readyDomainCount: number;
  totalDomainCount: number;
  removedLegacyCount: number;
  retainedLegacyCount: number;
  dbConnectedCount: number;
  dbWatchCount: number;
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
      summary: `연결 ${dbConnectedCount}개 · 준비/fallback ${dbWatchCount}개`,
      detail: "모든 화면이 DB 전용 상태는 아니며, 일부는 DB 준비 또는 fallback 보호 상태입니다.",
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
      summary: "1차 분리 완료",
      detail: "기준관리/정책관리 중심으로 분리했고, 전체 관리자 문구의 2차 분리는 추후 점검 대상입니다.",
    },
  ];

  const overallStatus = toCompletionStatus(
    items.some((item) => item.status === "blocked"),
    items.some((item) => item.status === "watch"),
  );

  return {
    overallStatus,
    readyDomainCount,
    totalDomainCount: domainAuditItems.length,
    removedLegacyCount,
    retainedLegacyCount,
    dbConnectedCount,
    dbWatchCount,
    items,
  };
}

export function getAdminCompletionAuditStatusLabel(status: AdminCompletionAuditStatus): string {
  if (status === "complete") return "완료";
  if (status === "watch") return "점검";
  return "차단";
}
