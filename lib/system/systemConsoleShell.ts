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
    description: "시스템관리자 콘솔 route입니다.",
    status: "current",
    statusLabel: "현재",
    href: "/system",
  },
  {
    id: "companies",
    label: "고객사 API",
    description: "고객사 목록과 상세 조회 API입니다.",
    status: "api",
    statusLabel: "API",
    apiPath: "/api/system/companies",
  },
  {
    id: "invites",
    label: "고객 초대",
    description: "고객사 관리자 초대 route입니다.",
    status: "linked",
    statusLabel: "화면",
    href: "/system/invites",
  },
  {
    id: "billing",
    label: "요금제·용량",
    description: "고객별 요금제와 저장용량 route입니다.",
    status: "linked",
    statusLabel: "화면",
    href: "/system/billing",
  },
  {
    id: "category-rules",
    label: "카테고리 규칙",
    description: "카테고리 추천 규칙 관리 route입니다.",
    status: "legacy",
    statusLabel: "기존",
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
];

export const SYSTEM_CONSOLE_POLICY_NOTES = [
  "route 무결성 점검 중인 화면입니다.",
  "API 항목은 자동 호출하지 않습니다.",
  "정상 동작 중인 DB/API 흐름은 변경하지 않습니다.",
] as const;
