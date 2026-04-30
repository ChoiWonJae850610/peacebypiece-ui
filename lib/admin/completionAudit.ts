import { ADMIN_DOMAIN_STRUCTURE, type AdminDomainKey } from "@/lib/admin/domainRegistry";
import { getAdminDbCompletionSummary, type AdminDbScreenAuditStatus } from "@/lib/admin/dbCompletionAudit";
import { buildAdminDomainAuditItems, getAdminLegacyPathAuditItems } from "@/lib/admin/structureAudit";

export type AdminCompletionAuditStatus = "complete" | "watch" | "blocked";
export type AdminCompletionDecision = "close-admin-v1" | "continue-admin-hardening" | "blocked";

export type AdminCompletionAuditItem = {
  key: "structure" | "legacy" | "db" | "ui" | "i18n";
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
      decisionSummary: "차단 항목은 없고, 안전 표시/i18n 2차 점검 항목만 남아 WorkOrder PC 화면 통일로 넘어갈 수 있습니다.",
      nextScope: "0.7.0부터 WorkOrder PC 레이아웃 통일을 진행하고, 관리자 잔여 점검은 회귀 점검 항목으로 유지합니다.",
    };
  }

  return {
    decision: "close-admin-v1",
    decisionLabel: "관리자 완료",
    decisionSummary: "관리자 영역의 구조, UI, DB 상태, legacy 정리 기준이 마감 가능한 상태입니다.",
    nextScope: "0.7.0부터 WorkOrder PC 레이아웃 통일을 진행합니다.",
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
    items,
  };
}

export function getAdminCompletionAuditStatusLabel(status: AdminCompletionAuditStatus): string {
  if (status === "complete") return "완료";
  if (status === "watch") return "점검";
  return "차단";
}
