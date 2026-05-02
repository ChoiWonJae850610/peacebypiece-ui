export type SystemRegressionRouteStatus =
  | "stable"
  | "api"
  | "needs_component_restore"
  | "planned";

export interface SystemRegressionRouteItem {
  id: string;
  label: string;
  href: string;
  description: string;
  status: SystemRegressionRouteStatus;
  statusLabel: string;
  apiPath?: string;
  nextAction: string;
}

export const SYSTEM_REGRESSION_ROUTES: SystemRegressionRouteItem[] = [
  {
    id: "dashboard",
    label: "시스템관리자 홈",
    href: "/system",
    description: "시스템관리자 route 안정화 허브입니다.",
    status: "stable",
    statusLabel: "안정화",
    nextAction: "기존 SystemConsoleShell 본 화면 복원 여부는 별도 버전에서 판단합니다.",
  },
  {
    id: "companies",
    label: "고객사 관리 API",
    href: "/api/system/companies",
    description: "고객사 목록과 고객사 상세 조회 API입니다.",
    status: "api",
    statusLabel: "API",
    apiPath: "/api/system/companies",
    nextAction: "고객사 관리 본 화면은 API 안정화 후 별도 route로 연결합니다.",
  },
  {
    id: "permissions",
    label: "권한 API",
    href: "/api/system/permissions",
    description: "permission catalog, role permissions, company user permissions 조회 API입니다.",
    status: "api",
    statusLabel: "API",
    apiPath: "/api/system/permissions",
    nextAction: "권한 관리 화면은 DB 권한 모델 확정 후 연결합니다.",
  },
  {
    id: "invites",
    label: "고객 초대",
    href: "/system/invites",
    description: "시스템관리자가 고객사 관리자를 초대하는 진입점입니다.",
    status: "stable",
    statusLabel: "UI 재연결",
    apiPath: "/api/invitations?companyId=company-sample-customer",
    nextAction: "0.9.104에서 시스템 고객 초대 UI 본 화면을 재연결했습니다. 이메일 발송, 고객사 생성 자동화, 인증/회원가입 연결은 별도 버전에서 진행합니다.",
  },
  {
    id: "billing",
    label: "요금제·용량",
    href: "/system/billing",
    description: "고객사별 요금제, 저장공간, 멤버 수를 확인하는 진입점입니다.",
    status: "stable",
    statusLabel: "UI 재연결",
    apiPath: "/api/system/billing",
    nextAction: "0.9.105에서 시스템 요금제·용량 UI 본 화면을 재연결했습니다. 저장 action과 결제 자동화는 별도 버전에서 판단합니다.",
  },
  {
    id: "category-rules",
    label: "카테고리 규칙",
    href: "/system/category-rules",
    description: "작업지시서 카테고리 추천 규칙 관리 진입점입니다.",
    status: "stable",
    statusLabel: "UI 재연결",
    nextAction: "0.9.103에서 기존 CategoryRulesManager 본 화면을 재연결했습니다. DB 저장 구조 변경은 별도 버전에서 판단합니다.",
  },
  {
    id: "stats",
    label: "시스템 통계 API",
    href: "/api/system/stats",
    description: "시스템관리자 통계 DB 집계 API입니다.",
    status: "api",
    statusLabel: "API",
    apiPath: "/api/system/stats",
    nextAction: "시스템 통계 화면 차트 연결은 후속 버전에서 진행합니다.",
  },
  {
    id: "storage-usage",
    label: "저장공간 사용량 API",
    href: "/api/system/storage-usage?companyId=company-sample-customer",
    description: "고객사별 저장공간 사용량과 snapshot 생성 API입니다.",
    status: "api",
    statusLabel: "API",
    apiPath: "/api/system/storage-usage?companyId=company-sample-customer",
    nextAction: "R2 실시간 inventory 조회는 연결하지 않고 DB metadata 기준을 유지합니다.",
  },
];

export const SYSTEM_REGRESSION_POLICY_NOTES = [
  "이번 버전은 시스템관리자 route가 깨진 JSX로 build/runtime을 막지 않도록 안정화하는 것이 목적입니다.",
  "정상 동작 중인 API, DB repository, 초대/요금제/통계 흐름은 변경하지 않습니다.",
  "하위 기능 컴포넌트가 JSX 손상 상태로 조회되는 화면은 안전한 진입점으로 대체합니다.",
  "기능 복원은 각 화면별로 원본 컴포넌트 무결성을 확인한 뒤 별도 버전에서 진행합니다.",
] as const;

export function getSystemRegressionRoute(
  id: string,
): SystemRegressionRouteItem | undefined {
  return SYSTEM_REGRESSION_ROUTES.find((route) => route.id === id);
}
