export type SystemConsoleTabStatus =
  | "current"
  | "linked"
  | "api"
  | "planned"
  | "legacy";

export interface SystemConsoleLink {
  id: string;
  label: string;
  description: string;
  status: SystemConsoleTabStatus;
  statusLabel: string;
  href?: string;
  apiPath?: string;
}

export const SYSTEM_CONSOLE_LINKS: SystemConsoleLink[] = [
  {
    id: "overview",
    label: "전체 현황",
    description: "시스템 통계와 운영 현황을 확인하는 콘솔 홈입니다.",
    status: "current",
    statusLabel: "현재",
    href: "/system",
  },
  {
    id: "companies",
    label: "고객사 관리",
    description: "고객사 목록과 상태를 확인하는 read-only 화면입니다.",
    status: "linked",
    statusLabel: "화면",
    href: "/system/companies",
  },
  {
    id: "permissions",
    label: "권한 관리",
    description: "permission catalog와 role permission map을 확인하는 read-only 화면입니다.",
    status: "linked",
    statusLabel: "화면",
    href: "/system/permissions",
  },
  {
    id: "invites",
    label: "고객 초대",
    description: "고객사 관리자 초대 화면입니다.",
    status: "linked",
    statusLabel: "화면",
    href: "/system/invites",
  },
  {
    id: "billing",
    label: "요금제·용량",
    description: "고객별 요금제와 저장용량 화면입니다.",
    status: "linked",
    statusLabel: "화면",
    href: "/system/billing",
  },
  {
    id: "category-rules",
    label: "카테고리 규칙",
    description: "카테고리 추천 규칙 관리 화면입니다.",
    status: "linked",
    statusLabel: "화면",
    href: "/system/category-rules",
  },
  {
    id: "stats",
    label: "시스템 통계 API",
    description: "시스템 통계 DB 집계 API입니다.",
    status: "api",
    statusLabel: "API",
    apiPath: "/api/system/stats",
  },
  {
    id: "storage-usage",
    label: "저장공간 API",
    description: "고객사별 저장공간 사용량 API입니다.",
    status: "api",
    statusLabel: "API",
    apiPath: "/api/system/storage-usage?companyId=company-sample-customer",
  },
];

export const SYSTEM_CONSOLE_POLICY_NOTES = [
  "시스템관리자 홈은 read-only 통계와 route/API 진입점만 제공합니다.",
  "저장 action, 결제 자동화, audit log write는 별도 버전에서 연결합니다.",
  "정상 동작 중인 DB/API 흐름은 변경하지 않습니다.",
] as const;
