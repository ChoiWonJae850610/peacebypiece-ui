export type AdminConsoleLinkStatus =
  | "current"
  | "linked"
  | "readonly"
  | "api"
  | "planned";

export interface AdminConsoleLink {
  id: string;
  label: string;
  description: string;
  status: AdminConsoleLinkStatus;
  statusLabel: string;
  href?: string;
  apiPath?: string;
}

export const ADMIN_CONSOLE_LINKS: AdminConsoleLink[] = [
  {
    id: "overview",
    label: "전체 현황",
    description: "고객관리자 통계와 운영 현황을 확인하는 콘솔 홈입니다.",
    status: "current",
    statusLabel: "현재",
    href: "/admin",
  },
  {
    id: "partners",
    label: "거래처/공장관리",
    description: "거래처, 공장, 원단, 부자재, 외주처 기준정보 화면입니다.",
    status: "readonly",
    statusLabel: "read-only",
    href: "/admin/partners",
  },
  {
    id: "files",
    label: "저장소 관리",
    description: "첨부파일, 휴지통, 용량 사용량 관리 화면입니다.",
    status: "readonly",
    statusLabel: "read-only",
    href: "/admin/files",
  },
  {
    id: "history",
    label: "히스토리",
    description: "작업지시서와 운영 변경 이력 화면입니다.",
    status: "readonly",
    statusLabel: "read-only",
    href: "/admin/history",
  },
  {
    id: "settings",
    label: "환경설정",
    description: "고객사 화면, 파일, 알림, 사용자 접근 정책 화면입니다.",
    status: "readonly",
    statusLabel: "read-only",
    href: "/admin/settings",
  },
  {
    id: "invites",
    label: "멤버 초대",
    description: "고객사 멤버 초대 화면입니다.",
    status: "linked",
    statusLabel: "UI",
    href: "/admin/invites",
  },
  {
    id: "admin-stats",
    label: "고객관리자 통계 API",
    description: "고객사 기준 작업지시서/첨부/용량 통계 API입니다.",
    status: "api",
    statusLabel: "API",
    apiPath: "/api/admin/stats?companyId=company-sample-customer",
  },
];

export const ADMIN_CONSOLE_POLICY_NOTES = [
  "고객관리자 홈은 read-only 통계와 route/API 진입점만 제공합니다.",
  "거래처/파일/히스토리/설정 화면의 저장 action은 별도 버전에서 재연결합니다.",
  "정상 동작 중인 작업지시서, 첨부, 메모, DB 흐름은 변경하지 않습니다.",
] as const;
