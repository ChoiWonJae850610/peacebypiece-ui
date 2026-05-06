export type AdminConsoleLinkStatus =
  | "linked"
  | "api"
  | "legacy"
  | "planned";

export interface AdminConsoleLinkItem {
  id: string;
  label: string;
  description: string;
  status: AdminConsoleLinkStatus;
  statusLabel: string;
  href?: string;
  apiPath?: string;
}

export const ADMIN_CONSOLE_PRIMARY_LINKS: AdminConsoleLinkItem[] = [
  {
    id: "workorders",
    label: "작업지시서",
    description: "작업지시서 목록과 업무 화면으로 이동합니다.",
    status: "legacy",
    statusLabel: "기존 기능",
    href: "/worker",
  },
  {
    id: "partners",
    label: "협력업체 관리",
    description: "공장, 원단, 부자재, 외주처 기준정보를 관리합니다.",
    status: "legacy",
    statusLabel: "기존 기능",
    href: "/admin/partners",
  },
  {
    id: "member-invites",
    label: "멤버 초대",
    description:
      "고객관리자가 디자이너, 검수담당자, 재고담당자를 초대하는 화면입니다.",
    status: "linked",
    statusLabel: "화면 연결",
    href: "/admin/invites",
  },
  {
    id: "stats",
    label: "통계",
    description: "작업지시서, 협력업체, 파일 사용량 지표를 확인합니다.",
    status: "linked",
    statusLabel: "화면 연결",
    href: "/admin/dashboard",
  },
];

export const ADMIN_CONSOLE_SECONDARY_LINKS: AdminConsoleLinkItem[] = [
  {
    id: "files",
    label: "저장소 관리",
    description: "첨부파일, 휴지통, 용량 사용량을 관리합니다.",
    status: "legacy",
    statusLabel: "기존 기능",
    href: "/admin/files",
  },
  {
    id: "history",
    label: "운영 히스토리",
    description: "상태 변경과 주요 작업 기록을 추적용으로 확인합니다.",
    status: "legacy",
    statusLabel: "기존 기능",
    href: "/admin/history",
  },
  {
    id: "settings",
    label: "환경설정",
    description: "고객사별 화면, 파일, 알림 정책을 관리합니다.",
    status: "legacy",
    statusLabel: "기존 기능",
    href: "/admin/settings",
  },
  {
    id: "member-management",
    label: "멤버 관리",
    description: "초대 수락 이후 멤버 권한 관리 화면으로 확장할 영역입니다.",
    status: "planned",
    statusLabel: "후순위",
  },
];

export const ADMIN_CONSOLE_API_LINKS: AdminConsoleLinkItem[] = [
  {
    id: "admin-stats-api",
    label: "고객관리자 통계 API",
    description: "고객사별 작업량, 상태, 저장공간 통계 skeleton입니다.",
    status: "api",
    statusLabel: "API 준비",
    apiPath: "/api/admin/stats?companyId=company-sample-customer",
  },
  {
    id: "invitations-api",
    label: "초대 API",
    description: "초대 링크 생성과 목록 조회 skeleton입니다.",
    status: "api",
    statusLabel: "API 준비",
    apiPath: "/api/invitations?companyId=company-sample-customer",
  },
];

export const ADMIN_CONSOLE_POLICY_NOTES = [
  "고객관리자 화면에서는 company_id가 현재 고객사로 고정됩니다.",
  "멤버 초대는 이메일 발송 전 링크 생성 흐름부터 연결합니다.",
  "통계 계산은 화면이 아니라 stats repository/API에서 처리합니다.",
  "고객관리자 메인은 상황판으로 사용하고 히스토리는 추적용 화면으로 분리합니다.",
] as const;
