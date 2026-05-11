import {
  getAdminWorkspaceManagementCards,
  getAdminWorkspaceWorkEntryCard,
  type AdminWorkspaceCard,
  type AdminWorkspaceCardStatus,
} from "@/lib/admin/adminWorkspaceCards";

export type AdminConsoleLinkStatus = AdminWorkspaceCardStatus;

export interface AdminConsoleLinkItem {
  id: string;
  label: string;
  description: string;
  status: AdminConsoleLinkStatus;
  statusLabel: string;
  href?: string;
}

function toConsoleLinkItem(card: AdminWorkspaceCard): AdminConsoleLinkItem {
  return {
    id: card.id,
    label: card.label,
    description: card.description,
    status: card.status,
    statusLabel: card.statusLabel,
    href: card.href ?? undefined,
  };
}

export const ADMIN_CONSOLE_PRIMARY_LINKS: AdminConsoleLinkItem[] = [toConsoleLinkItem(getAdminWorkspaceWorkEntryCard())];

export const ADMIN_CONSOLE_SECONDARY_LINKS: AdminConsoleLinkItem[] = getAdminWorkspaceManagementCards().map(toConsoleLinkItem);

export const ADMIN_CONSOLE_POLICY_NOTES = [
  "고객관리자 화면에서는 좌측 패널을 제거하고 카드형 홈으로 진입합니다.",
  "작업지시서는 관리 메뉴가 아니라 별도 업무 화면 진입 버튼으로 분리합니다.",
  "상세 히스토리와 감사 로그는 고객관리자 메뉴가 아니라 시스템관리자 /system/audit-logs로 분리합니다.",
  "통계 계산은 화면이 아니라 stats repository/API에서 처리합니다.",
  "멤버관리와 세부 권한 DB는 후속 버전에서 분리해 구현합니다.",
] as const;
