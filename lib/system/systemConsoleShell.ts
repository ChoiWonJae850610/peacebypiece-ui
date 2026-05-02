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
    description: "시스템관리자 콘솔의 현재 운영 상태를 확인합니다.",
    status: "current",
    statusLabel: "현재",
    href: "/system",
  },
  {
    id: "companies",
    label: "고객사 관리",
    description: "고객사 목록과 고객사 상태를 확인할 API skeleton입니다.",
    status: "api",
    statusLabel: "API",
    apiPath: "/api/system/companies",
  },
  {
    id: "invites",
    label: "고객 초대",
    description: "시스템관리자가 고객사 관리자를 초대하는 화면입니다.",
    status: "linked",
    statusLabel: "화면",
    href: "/system/invites",
  },
  {
    id: "billing",
    label: "요금제·용량",
    description: "고객별 요금제와 저장용량 override 화면입니다.",
    status: "linked",
    statusLabel: "화면",
    href: "/system/billing",
  },
  {
    id: "category-rules",
    label: "카테고리 규칙",
    description: "기존 카테고리 추천 규칙 관리 화면입니다.",
    status: "legacy",
    statusLabel: "기존",
    href: "/system/category-rules",
  },
  {
    id: "stats",
    label: "통계",
    description: "시스템 통계 summary API skeleton입니다.",
    status: "api",
    statusLabel: "API",
    apiPath: "/api/system/stats",
  },
  {
    id: "storage-usage",
    label: "저장공간 사용량",
    description: "고객사별 저장공간 사용량 API skeleton입니다.",
    status: "api",
    statusLabel: "API",
    apiPath: "/api/system/storage-usage?companyId=company-sample-customer",
  },
  {
    id: "logs",
    label: "시스템 로그",
    description: "시스템관리자 감사 로그 화면으로 확장할 예정입니다.",
    status: "planned",
    statusLabel: "예정",
  },
];

export const SYSTEM_CONSOLE_POLICY_NOTES = [
  "화면 링크는 실제 route 기준으로만 유지합니다.",
  "API 항목은 code block으로 표시하고 자동 호출하지 않습니다.",
  "스토리지 정리 기존 기능은 콘솔 하단에서 유지합니다.",
  "고객사/통계/스토리지 API는 skeleton 상태입니다.",
] as const;
